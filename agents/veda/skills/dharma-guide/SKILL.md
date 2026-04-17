---
name: dharma-guide
description: Reads a warrior's current empire state and posts a contextual guidance comment — badge progress, active quests, next best action, and one actionable hint. Triggered by /vibe-guide.
license: MIT
compatibility: Node.js >= 18, gitclaw, GitHub Actions
metadata:
  author: charan-s108
  version: "1.0.0"
  category: onboarding
---

# Dharma Guide

## Trigger

Comment on any issue or PR containing: `/vibe-guide`

## Instructions

1. Parse `@username` from the GitHub comment author (passed as argv[2])
2. Read `empire.json` from repository root (read-only)
3. If `@username` is not in `empire.players`: post unregistered guidance recommending `/vibe-join`
4. If registered:
   a. Compute badge progress using `nextBadgeHint()` from `scripts/badge.js`
   b. List active quests from `player.active_quests` and `player.quest_progress`
   c. Determine the single highest-priority next best action (see priority order below)
   d. Compose one contextual hint sentence tailored to the player's state
   e. Get quest recommendation via `nextQuestHint()` from `scripts/quests.js`
5. Post GitHub comment using the standard warrior format
6. Never write to `empire.json`

## Next Best Action Priority Order

1. `prs_merged === 0` → "Open and merge your first PR — Drona awards gems and acres automatically"
2. `bugs_found === 0` → "Run `/vibe-scout path/to/file.js` to scan for bugs and earn bounty gems"
3. `vibe_gems < 500` → "Earn more gems via PRs and bug scans to reach War Chest (500 gems)"
4. `prs_merged < 5` → "Merge more PRs — 5 total unlocks Veer Surge quest and Veer badge"
5. `critical_bugs_found === 0` → "Scan files with `eval()` or template literals in `exec` — Karna awards 200 gems per CRITICAL finding"
6. Otherwise → "You are on the path. Keep contributing — the empire grows with every commit."

## Output Format

### Registered warrior:
```
## ⚔️ VEDA | DHARMA GUIDANCE — @username

**Badge:** ⚔️ Sainik (सैनिक) — Tier 1 of 5
**Progress:** Next: 🏹 Veer — earn 350 more gems OR merge 4 more PRs

**Active Quests:**
◌ war_chest — Accumulate 500 total gems

**Your next best step:** Run `/vibe-scout path/to/file.js` to scan for bugs and earn bounty gems

**Hint:** Scan `agents/karna/skills/bug-radar/scripts/scan.js` — it contains TODO comments and var declarations worth 50–100 gems each

**Quest recommendation:** Start `bug_scout` — find a bug with `/vibe-scout` and earn 60 gems

---
🎵 *flow time* · *GitEmpire v1.0*
```

### Unregistered warrior:
```
## ⚔️ VEDA | DHARMA GUIDANCE

**@username is not yet registered in the empire.**

**First step:** Post `/vibe-join @username` as a comment on any issue.
Bhima will welcome you, award 100 starter gems, and begin your dharma path.

---
🎵 *flow time* · *GitEmpire v1.0*
```

## Rules

- NEVER write to empire.json — read-only at all times
- NEVER award gems, claim acres, or modify any player field
- ALWAYS recommend exactly one next best step — not a list
- ALWAYS include exactly one hint sentence — specific and actionable
- Only show the invoking player's own data — never other players' private state
