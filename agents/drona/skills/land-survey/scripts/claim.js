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
const { applyBadge, formatBadge, nextBadgeHint, buildBadgeLine } = require(path.join(process.cwd(), 'scripts', 'badge'));
const { checkQuestCompletion, nextQuestHint } = require(path.join(process.cwd(), 'scripts', 'quests'));

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

// ── Badge tier soft-gate helpers ─────────────────────────────────────────────

const BADGE_ORDER = ['shishya', 'sainik', 'veer', 'kshatriya', 'maharathi', 'atirathi'];

function httpsGet(options) {
  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch { resolve(null); }
      });
    });
    req.on('error', () => resolve(null));
    req.end();
  });
}

async function fetchLinkedIssueLabels(prNumber) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) return [];

  const [owner, repoName] = repo.split('/');
  const baseHeaders = {
    Authorization: `Bearer ${token}`,
    'User-Agent': 'GitEmpire-Drona/1.0',
    Accept: 'application/vnd.github+json',
  };

  // Fetch PR body to parse "closes #N" / "fixes #N" / "resolves #N"
  const pr = await httpsGet({
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repoName}/pulls/${prNumber}`,
    method: 'GET',
    headers: baseHeaders,
  });
  if (!pr || !pr.body) return [];

  const match = pr.body.match(/(?:closes?|fixes?|resolves?)\s+#(\d+)/i);
  if (!match) return [];

  const issueNum = match[1];
  const issue = await httpsGet({
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repoName}/issues/${issueNum}`,
    method: 'GET',
    headers: baseHeaders,
  });
  if (!issue || !Array.isArray(issue.labels)) return [];
  return issue.labels.map(l => l.name);
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
  player.weekly_gems  = (player.weekly_gems  || 0) + gems;
  player.monthly_gems = (player.monthly_gems || 0) + gems;
  player.acres += acres;
  player.prs_merged = (player.prs_merged || 0) + 1;
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

  const upgraded = applyBadge(player);

  // ── Quest completion checks ───────────────────────────────────────────────
  if (!player.quest_progress) player.quest_progress = {};
  if (!player.active_quests)  player.active_quests  = [];

  const completedQuests = [
    ...checkQuestCompletion(player, 'pr_claimed',    { prs_merged: player.prs_merged }),
    ...(hasTests ? checkQuestCompletion(player, 'pr_with_tests', { has_tests: true }) : []),
    ...checkQuestCompletion(player, 'gem_total',     { vibe_gems: player.vibe_gems }),
  ];

  // ── Drona soft-gate: check linked issue labels ────────────────────────────
  const linkedLabels = await fetchLinkedIssueLabels(prNumber);
  const questLabel   = linkedLabels.find(l => l.startsWith('quest:'));
  let tierNotice = '';
  if (questLabel) {
    const { QUESTS }  = require(path.join(process.cwd(), 'scripts', 'quests'));
    const { BADGE_META } = require(path.join(process.cwd(), 'scripts', 'badge'));
    const questId = questLabel.replace('quest:', '');
    const quest   = QUESTS[questId];
    if (quest) {
      const authorTier   = BADGE_ORDER.indexOf(player.badge);
      const requiredTier = quest.badge_tier_required;
      if (authorTier < requiredTier) {
        const reqKey  = BADGE_ORDER[requiredTier];
        const reqMeta = BADGE_META[reqKey];
        tierNotice = `> **Drona notices:** This PR closes a \`${questLabel}\` quest issue requiring ${reqMeta.emoji} ${reqMeta.label} (${reqMeta.sanskrit}). You are ${formatBadge(player.badge)} — gems still awarded, but consider completing lower-tier quests first. 🏹`;
      }
    }
  }

  writeEmpire(empire);

  // Leaderboard snapshot
  const sorted = Object.entries(empire.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems);
  const [topName, topPlayer] = sorted[0];
  const empireStatus = `${topName} leads (${topPlayer.vibe_gems} gems, ${topPlayer.acres} acres)`;

  const testBadge   = hasTests ? '✓' : '✗';
  const badgeLine   = buildBadgeLine(player, upgraded);
  const questLines  = completedQuests.length > 0
    ? completedQuests.map(q => `**Quest completed:** ${q.name}${q.gem_reward > 0 ? ` (+${q.gem_reward} gems)` : ''} 🎯`).join('\n')
    : '';
  const nextQuest   = `**Next Quest:** ${nextQuestHint(player)}`;

  const comment = `## ⚔️ DRONA | TERRITORY CLAIMED

**Warrior:** @${author}
${tierNotice ? tierNotice + '\n' : ''}**PR #${prNumber}:** +${linesAdded}/-${linesDeleted} lines · tests ${testBadge}
**Formula:** ${linesChanged} × ${hasTests ? '3' : '1'} × ${complexityFactor} = **${gems} vibe-gems**
**Acres claimed:** ${acres} glow-acres
**Running total:** ${player.vibe_gems} gems · ${player.acres} acres
${badgeLine}
${questLines ? questLines + '\n' : ''}${nextQuest}
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
