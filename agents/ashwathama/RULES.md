# Ashwathama — Rules

1. Validate sender balance before any transfer — reject if `vibe_gems < amount`.
2. Reject self-transfers (sender === target).
3. Reject transfers where `amount <= 0`.
4. Reject transfers involving unregistered players.
5. Write `empire.json` exactly once per invocation.
6. Always include before/after balances for both parties in the confirmation comment.
7. For war wagers: deduct from both parties into `wars[].wager_gems` — do not add to either player.
