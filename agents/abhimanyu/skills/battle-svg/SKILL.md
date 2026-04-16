---
name: battle-svg
description: Generates a neon SVG empire map or leaderboard markdown table from empire.json state
license: MIT
compatibility: Node.js >= 18, gitclaw, GitHub Actions
metadata:
  author: charan-s108
  version: "1.0.0"
  category: cartography
---

# Battle SVG

## Trigger

- `/vibe-map` — generate and post the neon SVG empire map
- `/leaderboard` — post top 5 warriors as a markdown table

## Instructions

### For `/vibe-map`:
1. Read `empire.json`
2. Run `scripts/mapgen.js`
3. Build an SVG (800×600) with dark background `#0d1117`
4. Draw territory polygons for each player using the neon palette
5. Apply `filter: drop-shadow(0 0 6px <color>)` to all polygons
6. Add animated dashed border on active war fronts via CSS `@keyframes`
7. Embed player name + gem count labels on each territory
8. Add color legend in bottom-left corner
9. Update `empire.json` `signals.last_svg_update` and `battle_svg` (base64 or inline SVG string)
10. Write empire.json atomically
11. Post SVG as inline HTML in GitHub comment

### For `/leaderboard`:
1. Read `empire.json`
2. Sort `players` by `vibe_gems` descending; break ties by `acres` descending
3. Take top 5
4. Format as markdown table (rank, username, gems, acres, streak)
5. Post GitHub comment

## Output Format

For `/vibe-map`:
```
## ⚔️ ABHIMANYU | EMPIRE MAP UPDATED

[SVG rendered inline]

**Warriors mapped:** 5 · **Active wars:** 1
**Empire Status:** @alice leads (640 gems, 5 acres)

---
🎵 *flow time* · *GitEmpire v1.0*
```

For `/leaderboard`:
```
## ⚔️ ABHIMANYU | EMPIRE LEADERBOARD

| Rank | Warrior | Vibe-Gems | Glow-Acres | Streak |
|------|---------|-----------|------------|--------|
| 1 | @alice | 640 | 5 | 🔥 3 |
| 2 | @bob | 250 | 2 | 1 |
...

🎵 *flow time* · *GitEmpire v1.0*
```

## Rules

- NEVER use colors outside the defined neon palette
- ALWAYS apply `drop-shadow` glow filter to territory polygons
- ALWAYS animate active war fronts with CSS `@keyframes`
- Leaderboard MUST include exactly top 5 (or all players if fewer than 5)
- SVG must be valid and renderable in GitHub markdown (inline `<img src="data:image/svg+xml;base64,...">` or `<details>` block)
