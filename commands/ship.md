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
5. Only when the repo is `GoodKnightRestDev/DotfilesCloud` and the push succeeded: roll the change out by bumping the pin in the environment's setup script. Call `get_environment`, replace the 40-character hash after `checkout -q` with the shipped commit's full hash (`git rev-parse HEAD`), then call `update_environment` with that script (`script_change`: "replaces the existing setup script"). Change nothing else in the script. The user gets an approval prompt; if declined, say the change is not rolled out yet and stop.
