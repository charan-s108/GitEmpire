---
name: land-survey
description: Calculates glow-acres earned from a merged PR using the vibe-gem formula and updates player territory in empire.json
license: MIT
compatibility: Node.js >= 18, gitclaw, GitHub Actions
metadata:
  author: charan-s108
  version: "1.0.0"
  category: surveying
---

# Land Survey

## Trigger

- Automatic: `pull_request` event where `merged == true`
- Manual: `/claim-vibe #<PR_number>` comment

## Instructions

1. Identify the PR author from `github.event.pull_request.user.login` or parse PR number from command
2. Fetch PR diff stats: `lines_added`, `lines_deleted`, `has_tests` (presence of `*.test.*` / `*.spec.*` in changed files)
3. Calculate `lines_changed = lines_added + lines_deleted`
4. Determine `complexity_factor`:
   - `2.0` if net lines negative (dead code deleted) or major refactor
   - `1.5` if measurably reduced function count
   - `1.0` neutral
   - `0.5` if lines added > 200 with no tests
5. Calculate `vibe_gems = max(10, lines_changed × (has_tests ? 3 : 1) × complexity_factor)`
6. Calculate `glow_acres = Math.floor(lines_changed / 50)` (1 acre per 50 lines, minimum 0)
7. Add a plot entry: `{ pr: #N, files: [...changed files], acres: N, claimed: timestamp }`
8. Read `empire.json`, update player, write atomically via `scripts/claim.js`
9. Post GitHub comment on the PR

## Output Format

```
## ⚔️ DRONA | TERRITORY CLAIMED

  ___
 /   \
| ### |
 \___/

**Warrior:** @alice
**PR #42:** +180 lines · tests detected ✓
**Gems earned:** 540 vibe-gems (180 × 3 × 1.0)
**Acres claimed:** 3 glow-acres
**New territory:** plots [api/, tests/]
**Empire Status:** @alice (640 gems, 5 acres)

---
🎵 *flow time* · *GitEmpire v1.0*
```

## Rules

- NEVER process a PR that is not merged — check `merged` status first
- NEVER claim the same PR twice — check `plots` for existing PR number
- Minimum gem floor is 10 — never award less
- ALWAYS write empire.json once, atomically
