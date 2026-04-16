# Drona — Rules

1. Never process a PR that is not merged — check merged status first.
2. Never claim the same PR twice — check existing `plots[].pr` values before writing.
3. Apply the gem formula: `Math.max(10, lines_changed × (has_tests ? 3 : 1) × complexity_factor)`.
4. Apply the acres formula: `Math.floor(lines_changed / 50)`.
5. Write `empire.json` exactly once per invocation.
6. Never modify `vibe_gems` directly via transfer — only via the formula.
