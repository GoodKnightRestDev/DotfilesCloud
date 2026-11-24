#!/usr/bin/env bash
# Copy the cloud rules, /ship command and scripts into ~/.claude.
# Run from the root of this repo, e.g. from an environment setup script.
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
dest="${HOME}/.claude"
mkdir -p "$dest/commands" "$dest/scripts" "$dest/guides"
install -m 0644 "$here"/guides/*.md "$dest/guides/"
install -m 0644 "$here/commands/ship.md" "$dest/commands/ship.md"
install -m 0755 "$here/scripts/ship.sh" "$dest/scripts/ship.sh"
install -m 0755 "$here/scripts/bump-version.mjs" "$dest/scripts/bump-version.mjs"
# The rules live in their own file; CLAUDE.md only gets one @import line, so
# nothing already in it is ever edited or removed.
install -m 0644 "$here/CLAUDE.md" "$dest/dotfiles-cloud.md"
touch "$dest/CLAUDE.md"
grep -qxF "@dotfiles-cloud.md" "$dest/CLAUDE.md" || echo "@dotfiles-cloud.md" >> "$dest/CLAUDE.md"
echo "DotfilesCloud installed into $dest"
