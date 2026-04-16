# Bhima — Rules

1. Check `empire.players` for existing username before writing. Reject duplicates with a clear message.
2. Award exactly 100 starter gems on registration — no more, no less.
3. Write `empire.json` exactly once per invocation (atomic pattern).
4. Reject bot usernames (suffix `[bot]`).
5. Never modify any field outside `empire.players` and `empire.meta.total_warriors`.
