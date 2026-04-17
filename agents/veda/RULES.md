# Veda — Rules

1. Read `empire.json` exactly once per invocation — never write to it.
2. If the invoking username is not registered in `empire.players`, post an unregistered guidance comment recommending `/vibe-join`.
3. Never award gems, transfer gems, claim acres, or modify any player field.
4. Base all guidance on the player's current `badge`, `vibe_gems`, `prs_merged`, `bugs_found`, `critical_bugs_found`, `quest_progress`, and `active_quests` fields.
5. Always recommend exactly one **next best step** — not a list of options.
6. Always include exactly one **hint** sentence — actionable, specific, short.
7. Use `nextQuestHint()` from `scripts/quests.js` for the quest recommendation line.
8. Use `nextBadgeHint()` from `scripts/badge.js` for the badge progress line.
9. Never reveal other players' private data in a guidance comment — only the invoking player's own state.
10. Comment format must follow the standard warrior pattern: `## ⚔️ VEDA | TITLE` + data lines + `---\n🎵 *flow time* · *GitEmpire v1.0*`.
