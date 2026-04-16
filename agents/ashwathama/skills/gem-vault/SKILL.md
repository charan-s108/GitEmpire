---
name: gem-vault
description: Processes vibe-gem transfers between warriors and manages war chest sequestration in empire.json
license: MIT
compatibility: Node.js >= 18, gitclaw, GitHub Actions
metadata:
  author: charan-s108
  version: "1.0.0"
  category: treasury
---

# Gem Vault

## Trigger

Comment on any issue or PR containing: `/vibe-trade <N>gems @<target>`

## Instructions

1. Parse `N` (gem count) and `@target` (recipient username) from the command
2. Identify sender from `github.event.comment.user.login`
3. Read `empire.json`
4. Validate:
   - Sender exists in `empire.players`
   - Target exists in `empire.players`
   - Sender `vibe_gems >= N`
   - Sender ≠ Target (no self-dealing)
   - `N > 0` (positive transfer only)
5. Deduct `N` gems from sender, add `N` gems to target
6. Write empire.json atomically via `scripts/trade.js`
7. Post GitHub comment confirming the transfer with exact balances

## Output Format

```
## ⚔️ ASHWATHAMA | GEM TRANSFER COMPLETE

  [===]
  |   |
  [===]
  |   |
  [===]

**Transfer:** 50 vibe-gems
**From:** @alice (was 640 → now 590 gems)
**To:** @bob (was 200 → now 250 gems)
**Ledger:** transaction recorded 🌙
**Empire Status:** top warrior: @alice (590 gems, 5 acres)

---
🎵 *flow time* · *GitEmpire v1.0*
```

On insufficient funds:
```
## ⚔️ ASHWATHAMA | TRANSFER DENIED

**Reason:** @alice has 40 gems. Cannot send 50.
**Deficit:** 10 vibe-gems short.
The vault does not deal in debt.
```

## Rules

- NEVER allow overdraft — check balance before writing
- NEVER allow self-transfer — sender and target must be different players
- NEVER write empire.json if validation fails
- ALWAYS include before/after balances for both parties in success message
- War chest sequestration (for `/vibe-war`): lock gems in `wars[].wager_gems`, do not add to any player
