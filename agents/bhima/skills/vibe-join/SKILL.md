---
name: vibe-join
description: Registers a new warrior in empire.json and awards 100 starter vibe-gems when triggered by /vibe-join @username
license: MIT
compatibility: Node.js >= 18, gitclaw, GitHub Actions
metadata:
  author: charan-s108
  version: "1.0.0"
  category: onboarding
---

# Vibe Join

## Trigger

Comment on any issue or PR containing: `/vibe-join @<username>`

## Instructions

1. Parse `@username` from the command argument
2. Read `empire.json` from repository root
3. Check `empire.players` — if `@username` already exists, skip registration and post duplicate message
4. If new: create player entry with 100 `vibe_gems`, 0 `acres`, empty `plots`, `streak: 1`, and current ISO timestamp for `joined` and `last_active`
5. Increment `meta.total_warriors`
6. Write updated `empire.json` atomically (read → modify → write once)
7. Run `scripts/join.js` to perform the write
8. Post GitHub comment in the vibe aesthetic format

## Output Format

```
## ⚔️ BHIMA | WARRIOR REGISTERED

  ( )
 (   )
(     )
 \   /
  \_/

**Welcome:** @alice has entered the empire 🌊
**Starter gems:** 100 vibe-gems deposited to war chest
**Empire Status:** 7 warriors strong · top warrior: @alice (100 gems, 0 acres)

---
🎵 *flow time* · *GitEmpire v1.0*
```

## Rules

- NEVER register the same username twice — check before writing
- ALWAYS award exactly 100 starter gems, no more, no less
- NEVER write empire.json more than once per invocation
- If username is a bot (`[bot]` suffix), reject with a message
