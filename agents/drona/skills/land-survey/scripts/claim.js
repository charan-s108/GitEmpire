#!/usr/bin/env node
'use strict';

/**
 * Drona — land-survey / claim
 * Calculates glow-acres and vibe-gems for a merged PR and updates empire.json.
 *
 * Usage: node claim.js <PR_number> <author> <lines_added> <lines_deleted> <has_tests> [complexity_factor]
 * Env:   GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_ISSUE_NUMBER (PR number for comment)
 *
 * Can also be called from GitHub Actions with:
 *   node claim.js "$PR_NUMBER" "$PR_AUTHOR" "$LINES_ADDED" "$LINES_DELETED" "$HAS_TESTS"
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── empire.json helpers ──────────────────────────────────────────────────────

const EMPIRE_PATH = path.join(process.cwd(), 'empire.json');

function readEmpire() {
  return JSON.parse(fs.readFileSync(EMPIRE_PATH, 'utf8'));
}

function writeEmpire(empire) {
  empire.meta.last_updated = new Date().toISOString();
  fs.writeFileSync(EMPIRE_PATH, JSON.stringify(empire, null, 2));
}

// ── GitHub comment helper ────────────────────────────────────────────────────

function postComment(body) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const issue = process.env.GITHUB_ISSUE_NUMBER || process.env.PR_NUMBER;

  if (!token || !repo || !issue) {
    console.log('[drona] No GitHub env — printing comment to stdout:\n', body);
    return Promise.resolve();
  }

  const payload = JSON.stringify({ body });
  const [owner, repoName] = repo.split('/');

  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path: `/repos/${owner}/${repoName}/issues/${issue}/comments`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
          'User-Agent': 'GitEmpire-Drona/1.0',
        },
      },
      (res) => {
        res.resume();
        if (res.statusCode >= 200 && res.statusCode < 300) resolve();
        else reject(new Error(`GitHub API ${res.statusCode}`));
      }
    );
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── formula ──────────────────────────────────────────────────────────────────

function calcComplexityFactor(linesAdded, linesDeleted, hasTests, explicitFactor) {
  if (explicitFactor !== undefined) return parseFloat(explicitFactor);
  const linesChanged = linesAdded + linesDeleted;
  const netLines = linesAdded - linesDeleted;
  if (netLines < 0) return 2.0;                         // dead code removed
  if (linesAdded > 200 && !hasTests) return 0.5;        // large addition, no tests
  return 1.0;
}

function calcGems(linesChanged, hasTests, complexityFactor) {
  return Math.max(10, Math.round(linesChanged * (hasTests ? 3 : 1) * complexityFactor));
}

function calcAcres(linesChanged) {
  return Math.floor(linesChanged / 50);
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const [, , prNumArg, authorArg, linesAddedArg, linesDeletedArg, hasTestsArg, factorArg] =
    process.argv;

  if (!prNumArg || !authorArg) {
    console.error('[drona] Usage: node claim.js <PR#> <author> <added> <deleted> <has_tests> [factor]');
    process.exit(1);
  }

  const prNumber = parseInt(prNumArg, 10);
  const author = authorArg.replace(/^@/, '').trim();
  const linesAdded = parseInt(linesAddedArg || '0', 10);
  const linesDeleted = parseInt(linesDeletedArg || '0', 10);
  const hasTests = hasTestsArg === 'true' || hasTestsArg === '1';
  const linesChanged = linesAdded + linesDeleted;

  const complexityFactor = calcComplexityFactor(linesAdded, linesDeleted, hasTests, factorArg);
  const gems = calcGems(linesChanged, hasTests, complexityFactor);
  const acres = calcAcres(linesChanged);

  const empire = readEmpire();

  // Guard: player must exist
  if (!empire.players[`@${author}`]) {
    console.error(`[drona] @${author} is not registered. Run /vibe-join first.`);
    process.exit(1);
  }

  // Guard: duplicate claim
  const alreadyClaimed = empire.players[`@${author}`].plots.some((p) => p.pr === prNumber);
  if (alreadyClaimed) {
    console.log(`[drona] PR #${prNumber} already claimed by @${author} — skipped.`);
    return;
  }

  // Apply changes
  const player = empire.players[`@${author}`];
  player.vibe_gems += gems;
  player.acres += acres;
  player.last_active = new Date().toISOString();
  player.plots.push({
    pr: prNumber,
    acres,
    gems_earned: gems,
    lines_changed: linesChanged,
    has_tests: hasTests,
    complexity_factor: complexityFactor,
    claimed: new Date().toISOString(),
  });

  writeEmpire(empire);

  // Leaderboard snapshot
  const sorted = Object.entries(empire.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems);
  const [topName, topPlayer] = sorted[0];
  const empireStatus = `${topName} leads (${topPlayer.vibe_gems} gems, ${topPlayer.acres} acres)`;

  const testBadge = hasTests ? '✓' : '✗';
  const comment = `## ⚔️ DRONA | TERRITORY CLAIMED

**Warrior:** @${author}
**PR #${prNumber}:** +${linesAdded}/-${linesDeleted} lines · tests ${testBadge}
**Formula:** ${linesChanged} × ${hasTests ? '3' : '1'} × ${complexityFactor} = **${gems} vibe-gems**
**Acres claimed:** ${acres} glow-acres
**Running total:** ${player.vibe_gems} gems · ${player.acres} acres
**Empire Status:** ${empireStatus}

---
🎵 *flow time* · *GitEmpire v1.0*`;

  await postComment(comment);
  console.log(`[drona] PR #${prNumber} → @${author}: +${gems} gems, +${acres} acres`);
}

main().catch((err) => {
  console.error('[drona] Error:', err.message);
  process.exit(1);
});
