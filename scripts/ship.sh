#!/usr/bin/env bash
# Helper for the /ship command. Collapses the multi-step git flow into
# two calls: `info` (gather context) and `commit` (stage/commit/push).
set -euo pipefail

SECRET_PATTERN='(^|/)\.env($|\.)|credentials|secret|\.pem$|\.p12$|\.pfx$|id_rsa|id_ecdsa|id_ed25519|\.key$'
SAFE_TEMPLATE_PATTERN='\.(example|sample)$'

is_secret() {
  grep -E "$SECRET_PATTERN" | grep -Ev "$SAFE_TEMPLATE_PATTERN"
}

usage() {
  echo "Usage: $0 info <repo-path> | $0 commit <repo-path> <message> | $0 bump <repo-path> minor|major" >&2
  exit 1
}

[ $# -ge 2 ] || usage
cmd="$1"
repo="$2"

# The branch everything ships to: the branch you are on (in cloud sessions
# that is the session branch the platform assigns). Detached HEAD falls back
# to the remote's default branch, else main.
target=$(git -C "$repo" branch --show-current)
if [ -z "$target" ]; then
  target=$(git -C "$repo" symbolic-ref --short refs/remotes/origin/HEAD 2>/dev/null || true)
  target="${target#origin/}"
  target="${target:-main}"
fi

case "$cmd" in
  info)
    echo "## git status --short"
    git -C "$repo" status --short
    echo
    echo "## git diff HEAD --stat"
    git -C "$repo" diff HEAD --stat
    echo
    echo "## git log -5 --oneline"
    git -C "$repo" log -5 --oneline
    echo
    echo "## potential secret files (will be excluded from staging)"
    git -C "$repo" status --short | awk '{print $2}' | is_secret || echo "(none)"
    ;;

  commit)
    [ $# -ge 3 ] || usage
    message="$3"

    git -C "$repo" add -A

    mapfile -t secrets < <(git -C "$repo" diff --cached --name-only | is_secret || true)
    for f in "${secrets[@]:-}"; do
      [ -n "$f" ] && git -C "$repo" reset -q HEAD -- "$f"
    done

    if [ "${#secrets[@]}" -gt 0 ] && [ -n "${secrets[0]:-}" ]; then
      echo "## excluded from staging (looked like secrets)"
      printf '%s\n' "${secrets[@]}"
      echo
    fi

    if git -C "$repo" diff --cached --quiet; then
      # A commit whose push failed earlier (e.g. after a rebase) still needs pushing.
      git -C "$repo" fetch -q origin "$target" 2>/dev/null || true
      # No remote ref yet (empty remote) counts as unpushed.
      unpushed=$(git -C "$repo" rev-list --count "origin/$target..HEAD" 2>/dev/null || echo 1)
      if [ "$unpushed" = "0" ]; then
        echo "Nothing to commit."
        exit 0
      fi
      echo "Nothing new to commit; pushing $unpushed unpushed commit(s)."
    else
      # Semver: every shipped commit bumps the patch. Where the version lives is
      # declared in the repo's CLAUDE.md ("## Versioning"); see bump-version.mjs.
      echo "## version"
      node "$(dirname "$0")/bump-version.mjs" "$repo" patch || echo "version: bump failed, committing without it"
      echo

      git -C "$repo" commit -m "$message"
    fi
    echo
    branch=$(git -C "$repo" branch --show-current)
    if [ "$branch" = "$target" ]; then
      git -C "$repo" push -u origin "$target"
    else
      echo "On '${branch:-detached HEAD}', pushing HEAD to $target"
      git -C "$repo" push origin "HEAD:refs/heads/$target"
    fi
    echo
    echo "## commit"
    git -C "$repo" log -1 --oneline
    ;;

  bump)
    # Manual minor/major bump; stages the version file, the next /ship commits it.
    # That ship sees the pending change and skips its own patch bump.
    [ $# -ge 3 ] || usage
    node "$(dirname "$0")/bump-version.mjs" "$repo" "$3"
    ;;

  *)
    usage
    ;;
esac
