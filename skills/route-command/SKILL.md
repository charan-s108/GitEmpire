---
name: route-command
description: Parses slash commands and dispatches them to the correct Mahabharata sub-agent by running the matching Node.js script with the cli tool
license: MIT
compatibility: Node.js >= 18, gitclaw, GitHub Actions
metadata:
  author: charan-s108
  version: "1.0.0"
  category: routing
---

# Route Command

## Trigger

Any message or comment containing a `/vibe-*` or GitEmpire slash command.

## Instructions

When you receive a message containing a GitEmpire slash command, use the `cli` tool to run the matching Node.js script directly. Do not ask for confirmation — just run it.

### Command dispatch table

| Command pattern | Script to run with `cli` tool |
|----------------|-------------------------------|
| `/vibe-join @<user>` | `node agents/bhima/skills/vibe-join/scripts/join.js @<user>` |
| `/vibe-scout <file>` | `node agents/karna/skills/bug-radar/scripts/scan.js <file>` |
| `/claim-vibe <PR>` | `node agents/drona/skills/land-survey/scripts/claim.js <PR> unknown 50 10 false` |
| `/vibe-trade <N>gems @<user>` | `node agents/ashwathama/skills/gem-vault/scripts/trade.js @sender <N> @<user>` |
| `/vibe-map` | `node agents/abhimanyu/skills/battle-svg/scripts/mapgen.js` |
| `/leaderboard` | `node agents/abhimanyu/skills/battle-svg/scripts/mapgen.js leaderboard alltime` |
| `/leaderboard weekly` | `node agents/abhimanyu/skills/battle-svg/scripts/mapgen.js leaderboard weekly` |
| `/leaderboard monthly` | `node agents/abhimanyu/skills/battle-svg/scripts/mapgen.js leaderboard monthly` |
| `/vibe-quest list` | `node agents/abhimanyu/skills/battle-svg/scripts/quest-list.js @unknown` |
| `/vibe-quest start <id>` | `node agents/bhima/skills/vibe-join/scripts/quest-start.js @unknown <id>` |
| `/vibe-guide` | `node agents/veda/skills/dharma-guide/scripts/guide.js @unknown` |

### Argument extraction rules

- `/vibe-join @alice` → user = `@alice`
- `/vibe-scout agents/karna/skills/bug-radar/scripts/scan.js` → file = the path as given
- `/vibe-guide` with no username → use `@unknown` as the username argument
- `/vibe-quest list` with no username → use `@unknown`
- `/vibe-quest start land_grab` → id = `land_grab`

### Steps

1. Read the incoming message and identify which command pattern matches
2. Extract the arguments from the message
3. Use the `cli` tool to run the exact Node.js command from the dispatch table
4. Show the full stdout output to the user
5. If no command matches, list the available commands

## Output Format

Show the raw output from the script exactly as printed. The scripts print GitHub-flavored markdown comment blocks to stdout when no GitHub environment is configured — display them as-is.

If no command matches:
```
Available commands:
  /vibe-join @user          — register a warrior
  /vibe-scout <file>        — scan for bugs, earn gems
  /vibe-guide               — get badge/quest guidance
  /vibe-map                 — generate the empire SVG map
  /vibe-quest list          — show all quests
  /vibe-quest start <id>    — start a quest
  /vibe-trade <N>gems @user — transfer gems
  /leaderboard              — top-10 rankings
```

## Rules

- ALWAYS use the `cli` tool to run the script — never just describe what would happen
- NEVER run two scripts for the same command
- NEVER modify empire.json directly — let the scripts handle all state
- If the script exits with an error, show the error output and suggest a fix
