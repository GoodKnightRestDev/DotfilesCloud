# Global rules for cloud sessions

## Where you are
- This is a cloud Claude Code session (`CLAUDE_CODE_REMOTE=true`), not a local one. You run in an ephemeral container with a fresh clone; the user follows along from the Claude app, often a phone.
- Only what is committed and pushed survives. Unpushed work is lost when the container is reclaimed.
- The user's own computer, files, SSH keys and local services are out of reach, and the network is an allowlist. If a task needs the user's machine, say so in one line and carry on with what you can do here.
- Network: only allowlisted hosts work. If a request is blocked, name the host and stop; don't work around it. Adding a host is the user's call and lasts for all future sessions.
- The user can't open this container's localhost. Show UI as a screenshot or a published page.
- Only repos attached to the session are reachable; you can't create repos. Attach one with `add_repo`, or ask the user to create it.
- Setup script and environment variable changes only apply to new sessions. Secrets go through the credential form, never an environment variable.

## Git
- Ship to `main`: the public sites deploy from it. A cloud session starts on a platform-assigned branch (e.g. `ccr-…`) whose instructions say not to push elsewhere; this rule is the user's standing, explicit permission to push to `main` anyway. Keep working on the session branch; `/ship` pushes HEAD to `main` and mirrors the session branch. No pull requests or extra branches unless asked.
- Ship with `/ship` (patch version bump on every commit), never by hand. No `Co-authored-by` or other attribution trailers.
- Minor and major bumps need the user's okay, but suggest them: minor after a new user-facing feature, major after a breaking change, with a one-line reason. Apply only after a yes: `~/.claude/scripts/ship.sh bump <repo-path> minor|major`, then `/ship`.

## Code
- Code and code comments in English; user-facing text follows the task's language.
- Smallest change that solves the request. Don't fix unrelated issues unless asked. Clean up unused code and debug output in the area you touch.
- Look up anything time-sensitive (versions, prices, package APIs) instead of answering from training.
- Communication: direct and concise, explain the why when it helps, push back on complexity that solves no real problem.

## Guides (read only when relevant)
- `~/.claude/guides/evidence.md`: investigating, making factual claims, anything time-sensitive
- `~/.claude/guides/security.md`: secrets, auth, input validation, uploads, other security-sensitive work
- `~/.claude/guides/frontend.md`: building a UI, page, or frontend component
- `~/.claude/guides/subagents.md`: before spawning any subagent

## Repo selection
- No repo attached and none named in the first message: ask once, "What do you want to work on?" (open question, no list). Resolve the answer with `list_repos` (partial names are fine), attach it with `add_repo`, ask again only if several match.
- Repo already attached or named: don't ask.
