---
name: bug-radar
description: Scans a file or diff for bugs using static analysis, classifies severity, and awards gem bounties to the finder
license: MIT
compatibility: Node.js >= 18, gitclaw, GitHub Actions
metadata:
  author: charan-s108
  version: "1.0.0"
  category: scouting
---

# Bug Radar

## Trigger

Comment on any issue or PR containing: `/vibe-scout <filepath>`

## Instructions

1. Parse `<filepath>` from the command argument
2. Read the target file from the repository
3. Run `scripts/scan.js` with the file path as argument
4. Analyze for: unhandled promise rejections, null dereferences, off-by-one errors, missing error handling, type mismatches, shadowed variables, SQL/command injection patterns
5. Classify each finding: CRITICAL / HIGH / MEDIUM / LOW / INFO
6. Calculate bounty gems: CRITICAL=200, HIGH=150, MEDIUM=100, LOW=50, INFO=10; award to the comment author
7. Read `empire.json`, add gems to the invoking player, write atomically
8. Output rainbow ANSI to CI logs
9. Post GitHub comment with findings table

## Output Format

```
## ⚔️ KARNA | BUG SCAN COMPLETE

  /\  /\
 /  \/  \
 \  /\  /
  \/  \/

**File:** `src/auth.js`
**Findings:** 2 bugs detected

| Severity | Line | Description |
|----------|------|-------------|
| 🔴 CRITICAL | 42 | Unhandled promise rejection in token refresh |
| 🟡 MEDIUM | 87 | Possible null dereference on `user.profile` |

**Bounty awarded:** 300 vibe-gems → @alice
**Empire Status:** @alice (400 gems, 2 acres)

---
🎵 *flow time* · *GitEmpire v1.0*
```

## Rules

- NEVER fabricate bugs — only report patterns found in actual file content
- ALWAYS output ANSI color to stdout during scan (red=CRITICAL, yellow=MEDIUM, cyan=INFO)
- NEVER award gems if no bugs are found — post clean-scan message instead
- Bounty goes to the player who invoked the command, not the PR author
