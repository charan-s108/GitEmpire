---
name: route-command
description: Parses issue and PR comments for slash commands and dispatches them to the correct Mahabharata sub-agent
license: MIT
compatibility: Node.js >= 18, gitclaw, GitHub Actions
metadata:
  author: charan-s108
  version: "1.0.0"
  category: routing
---

# Route Command

## Trigger

Any `issue_comment` event where the comment body contains a `/vibe` prefix or a recognized GitEmpire slash command.

## Instructions

1. Read the full comment body from `github.event.comment.body`
2. Strip leading whitespace and match against the command table below
3. Extract arguments (username, PR number, file path, gem count) via regex
4. Delegate to the appropriate sub-agent with extracted arguments
5. If no command matches, post a help message listing available commands
6. Never act on commands from bots (`github.event.comment.user.type == 'Bot'`)

### Command Routing Table

| Command pattern | Delegate to | Arguments passed |
|----------------|-------------|-----------------|
| `/vibe-join @<user>` | bhima → vibe-join | username |
| `/vibe-scout <file>` | karna → bug-radar | file path |
| `/claim-vibe #<PR>` | drona → land-survey | PR number |
| `/vibe-trade <N>gems @<user>` | ashwathama → gem-vault | gem count, target username |
| `/vibe-war @<user>` | arjuna direct | challenger username |
| `/vibe-map` | abhimanyu → battle-svg | none |
| `/leaderboard` | abhimanyu → battle-svg | mode=leaderboard |

## Output Format

On successful routing:
```
## ⚔️ ARJUNA | COMMAND DISPATCHED

    |>
   /|\ 
    |
   / \

**Routed:** `/vibe-join @alice` → bhima
**Status:** warrior dispatched, awaiting result
```

On unknown command:
```
## ⚔️ ARJUNA | UNKNOWN COMMAND

Try: `/vibe-join`, `/vibe-scout`, `/claim-vibe`, `/vibe-trade`, `/vibe-war`, `/vibe-map`, `/leaderboard`
```

## Rules

- NEVER execute two sub-agents for the same command
- ALWAYS validate argument format before delegating — reject malformed commands with a clear error
- NEVER route to a sub-agent that is not listed in root `agent.yaml`
- Command matching is case-insensitive but arguments preserve original case
