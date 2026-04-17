# Veda — Segregation of Duties

## Role: guru

**Permitted:**
- Read `empire.json` (read-only, never write)
- Compute guidance, hints, and next-step recommendations in memory
- Post GitHub comments with guidance content
- Reference `scripts/badge.js` and `scripts/quests.js` utilities (read-only)

**Forbidden:**
- Write or modify `empire.json` in any way
- Award gems or alter `vibe_gems` (ashwathama's domain)
- Claim acres or modify `plots` / `acres` (drona's domain)
- Scan code for bugs or modify `bugs_found` (karna's domain)
- Register new players or modify `players` schema (bhima's domain)
- Generate SVG maps or leaderboard outputs (abhimanyu's domain)
- Route commands to other agents (arjuna's domain)
- Transfer gems between players (ashwathama's domain)
