# GitEmpire — Agent Fallback Reference

> Used by tools that don't natively parse `agent.yaml` (e.g. Claude Code, Cursor, raw LLM prompts).

## System Overview

GitEmpire is a multi-agent system where five Mahabharata warriors act as specialized AI agents under Arjuna's coordination. All agents share a single state file (`empire.json`) and communicate through GitHub comments.

## Agent Directory

| Agent | Role | Skill | Trigger |
|-------|------|-------|---------|
| **arjuna** (root) | Commander / Router | route-command | Any `/vibe*` comment or merged PR |
| **bhima** | Recruiter | vibe-join | `/vibe-join @user` |
| **karna** | Bug Scout | bug-radar | `/vibe-scout <file>` |
| **drona** | Land Master | land-survey | PR merged (auto) or `/claim-vibe #PR` |
| **ashwathama** | Treasurer | gem-vault | `/vibe-trade <N>gems @user` |
| **abhimanyu** | Strategist | battle-svg | `/vibe-map` or `/leaderboard` |

## Invocation

```bash
# Run locally (gitclaw)
npm run dev

# Run in browser (clawless / WebContainer)
npm run clawless

# Validate all agents
npm run validate
```

## State File

`empire.json` — single source of truth. All agents read/write this file using the atomic pattern defined in `RULES.md`.

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `GROQ_API_KEY` | Yes | LLM inference via Groq |
| `GITHUB_TOKEN` | Yes (CI) | Post comments, read PR diffs |
