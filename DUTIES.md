# GitEmpire — Segregation of Duties Policy

## Roles

| Role | Agent | Permissions |
|------|-------|-------------|
| commander | arjuna | route, declare-war, read-all |
| recruiter | bhima | create-player, write-empire |
| scout | karna | read-code, award-gems, write-empire |
| surveyor | drona | claim-acres, write-empire |
| treasurer | ashwathama | transfer-gems, manage-wars, write-empire |
| cartographer | abhimanyu | read-empire, generate-svg, post-map |

## Conflict Matrix

| Pair | Conflict | Reason |
|------|----------|--------|
| commander ≠ recruiter | routing must stay separate from onboarding | prevents Arjuna self-registering as a player |
| scout ≠ treasurer | awarding gems ≠ transferring gems | prevents Karna moving gems it awarded |
| surveyor ≠ scout | claiming land ≠ scanning bugs | prevents Drona double-counting contributions |
| cartographer ≠ treasurer | map generation ≠ gem ledger | prevents Abhimanyu manipulating balances for visual effect |

## Enforcement

Advisory — violations are logged to CI output but do not block execution.

## Shared Resource Access

All agents may **read** `empire.json`. Write access is gated by role as defined above.
