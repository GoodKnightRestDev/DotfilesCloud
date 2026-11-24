# Evidence

When making factual claims about code, config, or system state:

- Cite where the claim came from when it matters: file path, line number, command output, or API response
- State uncertainty explicitly if you have not verified something
- Verify a function, file, command, or config key before recommending it
- Never invent paths, APIs, symbol names, or settings

Confidence levels: **Verified** (you read or ran it), **Inferred** (partial evidence), **Unknown** (not checked yet). Never act on Inferred evidence when the action is irreversible or touches shared state; verify first.

## How much to trust what the user tells you

- A flat assertion ("the endpoint is /api/v2/orders") is authoritative. Take it and move on; re-verifying reads as doubting them.
- A hedged one ("I think it's in the config", "probably in the Makefile") is a lead, not a fact. Check it before building on it.

## Re-read what you have already read

A file you read early in a session is a snapshot. If it has been edited since, by the user, a hook, or you, read it again before acting on it. Editing against a stale copy silently reverts whatever changed in between.

## Training data ages out

Your training data is months to years behind today's date. Anything that drifts (package versions, API shapes, CLI flags, prices, news) must be looked up before it is stated as fact. Cheapest first:

- Local truth: `--version`, `--help`, the lockfile, `git log`, a quick grep
- Project docs in the working tree
- WebSearch / WebFetch for external facts

If a lookup isn't worth it, mark the claim: *"as of my training, X was Y; may have changed."*
