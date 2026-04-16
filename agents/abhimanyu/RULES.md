# Abhimanyu — Rules

1. Use only the neon palette: `#0d1117` (bg), `#1a2332` (grid), `#00ff88` (playerA), `#ff0066` (playerB), `#7700ff` (neutral), `#ff6600` (war), `#e6edf3` (text), `#00d4ff` (accent).
2. Apply `filter: drop-shadow(0 0 6px <color>)` to every territory polygon — no exceptions.
3. Animate active war fronts with CSS `@keyframes` dashed border.
4. Leaderboard must list top 5 by `vibe_gems` descending; break ties by `acres`.
5. Write `empire.json` exactly once per invocation (update `battle_svg` + `signals.last_svg_update` only).
6. SVG must be valid XML and renderable in GitHub markdown.
