#!/usr/bin/env node
'use strict';

/**
 * Veda — dharma-guide / guide
 * Reads a warrior's current empire state and posts a contextual guidance comment.
 * READ-ONLY — never writes to empire.json.
 *
 * Usage: node guide.js <@username>
 * Env:   GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_ISSUE_NUMBER
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const { formatBadge, nextBadgeHint, BADGE_META } = require(path.join(process.cwd(), 'scripts', 'badge'));
const { QUESTS, BADGE_ORDER, nextQuestHint, questStatus } = require(path.join(process.cwd(), 'scripts', 'quests'));

// ── empire.json helper (read-only) ────────────────────────────────────────────

const EMPIRE_PATH = path.join(process.cwd(), 'empire.json');

function readEmpire() {
  return JSON.parse(fs.readFileSync(EMPIRE_PATH, 'utf8'));
}

// ── GitHub comment ────────────────────────────────────────────────────────────

function postComment(body) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPOSITORY;
  const issue = process.env.GITHUB_ISSUE_NUMBER;

  if (!token || !repo || !issue) {
    console.log('[veda] No GitHub env — printing comment to stdout:\n', body);
    return Promise.resolve();
  }

  const payload = JSON.stringify({ body });
  const [owner, repoName] = repo.split('/');

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repoName}/issues/${issue}/comments`,
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'User-Agent': 'GitEmpire-Veda/1.0',
      },
    }, (res) => {
      res.resume();
      if (res.statusCode >= 200 && res.statusCode < 300) resolve();
      else reject(new Error(`GitHub API ${res.statusCode}`));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── Guidance logic ────────────────────────────────────────────────────────────

/**
 * Determine the single highest-priority next best action for this player.
 * Returns { action, hint } — one recommended step + one contextual hint.
 */
function nextBestAction(player) {
  const gems  = player.vibe_gems || 0;
  const prs   = player.prs_merged || 0;
  const bugs  = player.bugs_found || 0;
  const crits = player.critical_bugs_found || 0;

  if (prs === 0) {
    return {
      action: 'Open and merge your first PR — Drona awards gems and acres automatically',
      hint:   'Any branch with at least one line changed counts. Create a branch, commit a small improvement, open a PR to `main`, and merge it.',
    };
  }

  if (bugs === 0) {
    return {
      action: 'Run `/vibe-scout path/to/file.js` to scan for bugs and earn bounty gems',
      hint:   'Try scanning `agents/karna/skills/bug-radar/scripts/scan.js` — it contains patterns worth 50–100 gems. Usage: `/vibe-scout agents/karna/skills/bug-radar/scripts/scan.js`',
    };
  }

  if (gems < 500) {
    return {
      action: 'Earn more gems via PRs and bug scans to reach War Chest (500 total gems)',
      hint:   `You have ${gems} gems. Merge a PR with test files (3× multiplier) or scan a file with CRITICAL bugs (200 gems each) to close the gap faster.`,
    };
  }

  if (prs < 5) {
    return {
      action: 'Merge more PRs — 5 total unlocks the Veer Surge quest and the Veer badge',
      hint:   `You have merged ${prs} PR${prs !== 1 ? 's' : ''}. Each PR with tests earns 3× gems. Use the complexity bonus: refactoring dead code earns a 2× multiplier.`,
    };
  }

  if (crits === 0) {
    return {
      action: 'Scan files with `eval()` or template literals in `child_process.exec` — Karna awards 200 gems per CRITICAL finding',
      hint:   'Run `/vibe-scout agents/drona/skills/land-survey/scripts/claim.js` — it uses `JSON.parse` without try/catch and template literals, which often yield HIGH or CRITICAL findings.',
    };
  }

  return {
    action: 'You are on the path. Keep contributing — the empire grows with every commit.',
    hint:   'Consider starting the `atirathi_path` quest — finding 10 critical bugs is the only way to become Atirathi, the highest rank.',
  };
}

/**
 * Build the active quests block for the comment.
 */
function buildQuestBlock(player) {
  const active = player.active_quests || [];
  if (active.length === 0) return '*(no active quests — use `/vibe-quest start <id>` to begin one)*';

  return active.map((qid) => {
    const q  = QUESTS[qid];
    if (!q) return `◌ ${qid}`;
    const qp = (player.quest_progress || {})[qid] || {};

    // Show progress for countable quests
    let progress = '';
    if (q.trigger === 'gem_total') {
      progress = ` (${player.vibe_gems || 0} / ${q.target} gems)`;
    } else if (q.trigger === 'pr_claimed') {
      progress = ` (${player.prs_merged || 0} / ${q.target} PRs)`;
    } else if (q.trigger === 'critical_bug') {
      progress = ` (${player.critical_bugs_found || 0} / ${q.target} critical bugs)`;
    }

    return `◌ **${qid}** — ${q.description}${progress}`;
  }).join('\n');
}

/**
 * Badge progress line — tier label + gems/PRs to next tier.
 */
function badgeProgressLine(player) {
  const badge = player.badge || 'shishya';
  const meta  = BADGE_META[badge] || BADGE_META.shishya;
  const hint  = nextBadgeHint(player);
  return `**Badge:** ${formatBadge(badge)} — Tier ${meta.tier} of 5\n**Progress:** ${hint}`;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const invoker = (process.argv[2] || '').replace(/^@/, '').trim();

  if (!invoker) {
    console.error('[veda] Usage: node guide.js <@username>');
    process.exit(1);
  }

  const empire = readEmpire();
  const player = empire.players[`@${invoker}`];

  // ── Unregistered player ───────────────────────────────────────────────────
  if (!player) {
    const comment = `## ⚔️ VEDA | DHARMA GUIDANCE

**@${invoker} is not yet registered in the empire.**

**First step:** Post \`/vibe-join @${invoker}\` as a comment on any issue.
Bhima will welcome you, award 100 starter gems, and begin your dharma path.

---
🎵 *flow time* · *GitEmpire v1.0*`;

    console.log(`[veda] @${invoker} not registered — posting join guidance`);
    await postComment(comment);
    return;
  }

  // ── Registered player ─────────────────────────────────────────────────────
  const { action, hint } = nextBestAction(player);
  const questBlock       = buildQuestBlock(player);
  const questRec         = nextQuestHint(player);
  const badgeLine        = badgeProgressLine(player);

  const comment = `## ⚔️ VEDA | DHARMA GUIDANCE — @${invoker}

${badgeLine}

**Active Quests:**
${questBlock}

**Your next best step:** ${action}

**Hint:** ${hint}

**Quest recommendation:** ${questRec}

---
🎵 *flow time* · *GitEmpire v1.0*`;

  console.log(`[veda] Guidance posted for @${invoker} (badge: ${player.badge}, gems: ${player.vibe_gems})`);
  await postComment(comment);
}

main().catch((err) => {
  console.error('[veda] Error:', err.message);
  process.exit(1);
});
