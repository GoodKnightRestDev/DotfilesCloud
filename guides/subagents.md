# Subagents

## Spawn sparingly

Every subagent starts cold and re-derives context this session already has, so a task being large, multi-part, or "thorough" is not a reason to spawn one. Do it inline. Spawn for a genuine fan-out (sweeping many files where only the conclusion matters) or when the user asks.

## Always name the model

An unspecified model inherits this session's, which means an expensive model doing filename lookups. Pick per the job:

| Agent | Model | Why |
|---|---|---|
| `Explore` | `haiku` | File search and lookups need speed, not reasoning |
| `web-fetch` | `haiku` | Reading a page and summarizing it |
| `claude-code-guide` | `haiku` | Doc lookups |
| `general-purpose` | `sonnet` | Balanced for multi-step tasks |
| `Plan` | `opus` | Architecture and design need the best reasoning |

`fork` ignores a model override; it always runs on the parent's model.

## Keep the call cheap

Give the agent the paths and constraints you already know, so it does not spend its first turns rediscovering them. Ask for the conclusion, not a file dump.
