# GitEmpire — System Rules

## Core Invariants

1. **One write per script execution.** Every script reads `empire.json` once, makes all changes in memory, writes once. No second write.
2. **No negative gems.** A player's `vibe_gems` must never go below 0. Reject any operation that would cause it.
3. **No duplicate players.** A username may only appear once in `empire.players`. Bhima must check before registering.
4. **No duplicate claims.** A PR number may only be claimed once. Drona must check `plots[].pr` before writing.
5. **War chest is sequestered.** Gems wagered in `wars[].wager_gems` are deducted from both parties on war start and held in the war object — they do not live in `empire.players` during an active war.
6. **Minimum gem floor.** Every PR claim awards at least 10 gems regardless of formula result.

## Vibe-Gem Formula

```
vibe_gems = Math.max(10, lines_changed × (has_tests ? 3 : 1) × complexity_factor)
```

`complexity_factor`:
- `2.0` — net lines negative (dead code removed) or explicit refactor label
- `1.5` — function/class count reduced in diff
- `1.0` — neutral (default)
- `0.5` — lines added > 200 with no test files in diff

## Glow-Acres Formula

```
glow_acres = Math.floor(lines_changed / 50)   // minimum 0
```

## Bug Bounty Scale

| Severity | Gems |
|----------|------|
| CRITICAL | 200  |
| HIGH     | 150  |
| MEDIUM   | 100  |
| LOW      |  50  |
| INFO     |  10  |

## Agent Boundaries

- Only Bhima writes new player entries.
- Only Karna awards bug bounty gems.
- Only Drona writes `plots` and `acres`.
- Only Ashwathama moves gems between players.
- Only Abhimanyu writes `battle_svg` and `signals.last_svg_update`.
- Arjuna never writes `empire.json` directly — it routes only.
