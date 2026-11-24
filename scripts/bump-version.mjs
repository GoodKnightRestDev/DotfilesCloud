#!/usr/bin/env node
// Bump the semver of a repo. Called by ship.sh before committing.
//
// Usage: bump-version.mjs <repo> [patch|minor|major] [--dry-run]
//
// The version location comes from a "## Versioning" section in the repo's
// CLAUDE.md ("Version file:", optional "Version key:", or "Version file: none").
// Without that section it falls back to package.json, then a VERSION file.
// Repos whose origin is not under GoodKnightRestDev (work, upstream clones) are skipped.
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

const OWNER = "GoodKnightRestDev";
const FIRST_VERSION = "0.1.0";

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const positional = args.filter((a) => !a.startsWith("--"));
const repo = path.resolve(positional[0] || ".");
const level = positional[1] || "patch";
if (!["patch", "minor", "major"].includes(level)) die(`unknown level "${level}"`);

function die(msg) {
  console.error(`bump-version: ${msg}`);
  process.exit(1);
}

function skip(msg) {
  console.log(`version: skipped (${msg})`);
  process.exit(0);
}

function git(...gitArgs) {
  return execFileSync("git", ["-C", repo, ...gitArgs], { encoding: "utf8" }).trim();
}

function bump(version) {
  const m = /^(\d+)\.(\d+)(?:\.(\d+))?$/.exec(version);
  if (!m) return null;
  let [major, minor, patch] = [Number(m[1]), Number(m[2]), Number(m[3] ?? 0)];
  if (level === "major") [major, minor, patch] = [major + 1, 0, 0];
  else if (level === "minor") [minor, patch] = [minor + 1, 0];
  else patch += 1;
  return `${major}.${minor}.${patch}`;
}

// Owner guard: no origin means a local-only repo of mine.
let origin = "";
try {
  origin = execFileSync("git", ["-C", repo, "remote", "get-url", "origin"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  }).trim();
} catch {
  // no origin
}
if (origin && !origin.includes(`github.com:${OWNER}/`) && !origin.includes(`github.com/${OWNER}/`)) {
  skip(`origin is not ${OWNER}: ${origin}`);
}

function readConfig() {
  const file = path.join(repo, "CLAUDE.md");
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  const clean = (v) => v?.trim().replace(/^`|`$/g, "");
  return {
    file: clean(/^Version file:\s*(.+)$/m.exec(text)?.[1]),
    key: clean(/^Version key:\s*(.+)$/m.exec(text)?.[1]),
  };
}

const config = readConfig();
if (config.file?.toLowerCase() === "none") skip("Version file: none");

let versionFile = config.file;
if (!versionFile) {
  const pkg = path.join(repo, "package.json");
  if (existsSync(pkg) && /"version"\s*:/.test(readFileSync(pkg, "utf8"))) versionFile = "package.json";
  else versionFile = "VERSION";
}
const abs = path.join(repo, versionFile);
const changed = [];
let result;

function write(file, content) {
  if (!dryRun) writeFileSync(file, content);
  changed.push(path.relative(repo, file));
}

function bumpJson() {
  const text = readFileSync(abs, "utf8");
  const json = JSON.parse(text);
  const key = config.key || "version";
  const parts = key.split(".");
  const last = parts.pop();
  const parent = parts.reduce((o, k) => o?.[k], json);
  if (!parent || typeof parent !== "object") die(`${versionFile}: key "${key}" has no parent object`);

  const old = parent[last];
  if (old === undefined || typeof old !== "string") {
    // Missing key (e.g. "version-name" in a GNOME metadata.json): add it to a top-level object.
    if (parts.length) die(`${versionFile}: key "${key}" is missing and can only be created at the top level`);
    const end = text.lastIndexOf("}");
    const before = text.slice(0, end).replace(/\s+$/, "");
    write(abs, `${before},\n  "${last}": "${FIRST_VERSION}"\n${text.slice(end)}`);
    return { old: null, next: FIRST_VERSION };
  }
  const next = bump(old);
  if (!next) skip(`${versionFile} "${key}" is not semver: ${old}`);
  const re = new RegExp(`("${last}"\\s*:\\s*")${old.replace(/\./g, "\\.")}(")`);
  if (!re.test(text)) die(`${versionFile}: could not locate "${last}": "${old}" in the text`);
  write(abs, text.replace(re, `$1${next}$2`));

  // npm keeps the version in the lockfile too.
  const lockFile = path.join(repo, "package-lock.json");
  if (versionFile === "package.json" && existsSync(lockFile)) {
    const lock = JSON.parse(readFileSync(lockFile, "utf8"));
    if (lock.version) lock.version = next;
    if (lock.packages?.[""]?.version) lock.packages[""].version = next;
    write(lockFile, `${JSON.stringify(lock, null, 2)}\n`);
  }
  return { old, next };
}

function bumpGradle() {
  const text = readFileSync(abs, "utf8");
  const nameRe = /(versionName\s*=\s*")([^"]+)(")/;
  const m = nameRe.exec(text);
  if (!m) die(`${versionFile}: no versionName found`);
  const next = bump(m[2]);
  if (!next) skip(`${versionFile} versionName is not semver: ${m[2]}`);
  let out = text.replace(nameRe, `$1${next}$3`);
  // Android refuses an update unless versionCode goes up.
  out = out.replace(/(versionCode\s*=\s*)(\d+)/, (_, p, n) => `${p}${Number(n) + 1}`);
  write(abs, out);
  return { old: m[2], next };
}

function bumpPlain() {
  if (!existsSync(abs)) {
    write(abs, `${FIRST_VERSION}\n`);
    return { old: null, next: FIRST_VERSION };
  }
  const old = readFileSync(abs, "utf8").trim();
  const next = bump(old);
  if (!next) skip(`${versionFile} is not semver: ${old}`);
  write(abs, `${next}\n`);
  return { old, next };
}

if (!existsSync(abs) && !/(^|\/)VERSION$/.test(versionFile)) die(`${versionFile} does not exist`);

// A manual minor/major bump is already pending: don't add a patch on top of it.
if (level === "patch" && existsSync(abs)) {
  let diff = "";
  try {
    diff = execFileSync("git", ["-C", repo, "diff", "HEAD", "-U0", "--", versionFile], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    // No commits yet: nothing to compare against.
  }
  const touched = diff.split("\n").some((l) => /^[-+](?![-+])/.test(l) && /version|^[-+]\d+\.\d+/i.test(l));
  if (touched) skip(`${versionFile} version already changed in this commit`);
}
if (versionFile.endsWith(".json")) result = bumpJson();
else if (/\.(kts|gradle)$/.test(versionFile)) result = bumpGradle();
else result = bumpPlain();

if (!dryRun) git("add", "--", ...changed);
const arrow = result.old ? `${result.old} -> ${result.next}` : `created at ${result.next}`;
console.log(`version: ${versionFile} ${arrow}${dryRun ? " (dry run)" : ""}`);
