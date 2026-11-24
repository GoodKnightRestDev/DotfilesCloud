---
description: Commit and push changes to main, bumping the patch version. Use whenever the user asks to commit, push, ship, save, or sync changes.
allowed-tools:
  - Bash(~/.claude/scripts/ship.sh *)
---

`~/.claude/scripts/ship.sh` does the git mechanics; you only write the message.

1. Run `~/.claude/scripts/ship.sh info <repo-path>`: status, diff stat, recent log, files that look like secrets. If the status is empty, report "Nothing to commit" and stop.
2. Write a one-sentence commit message in the present tense, focused on why, matching the repo's recent log style.
3. Run `~/.claude/scripts/ship.sh commit <repo-path> "<message>"`: stages everything except likely secrets, bumps the patch version, commits, and pushes to the default branch (also when you are on another branch).
4. Report the commit hash and message. If the push failed, say so; don't claim it shipped.
