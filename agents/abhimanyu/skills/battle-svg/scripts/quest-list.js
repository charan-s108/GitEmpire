#!/usr/bin/env node
'use strict';

/**
 * Abhimanyu — quest-list
 * Shows a player's full quest log — completed, active, available, and locked.
 * READ-ONLY: never writes empire.json.
 *
 * Usage: node quest-list.js <@username>
 * Env:   GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_ISSUE_NUMBER
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const { formatBadge, BADGE_META } = require(path.join(process.cwd(), 'scripts', 'badge'));
const { QUESTS, questStatus, nextQuestHint } = require(path.join(process.cwd(), 'scripts', 'quests'));

const EMPIRE_PATH = path.join(process.cwd(), 'empire.json');
const BADGE_ORDER = ['shishya', 'sainik', 'veer', 'kshatriya', 'maharathi', 'atirathi'];
const MAX_ACTIVE_QUESTS = 3;

function readEmpire() { return JSON.parse(fs.readFileSync(EMPIRE_PATH, 'utf8')); }

function postComment(body) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPOSITORY;
  const issue = process.env.GITHUB_ISSUE_NUMBER;
  if (!token || !repo || !issue) {
    console.log('[abhimanyu:quest-list] No GitHub env — printing to stdout:\n', body);
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
        'User-Agent': 'GitEmpire-Abhimanyu/1.0',
      },
    }, (res) => { res.resume(); resolve(); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

const STATUS_ICON = {
  completed: '✓',
  active:    '◌',
  available: '—',
  locked:    '🔒',
};

const STATUS_LABEL = {
  completed: 'Completed',
  active:    'Active',
  available: 'Available',
  locked:    'Locked',
};

async function main() {
  const rawUser = (process.argv[2] || '').replace(/^@/, '').trim();

  if (!rawUser) {
    console.error('[abhimanyu:quest-list] Usage: node quest-list.js <@username>');
    process.exit(1);
  }

  const playerKey = `@${rawUser}`;
  const empire = readEmpire();

  if (!empire.players[playerKey]) {
    const comment = `## ⚔️ ABHIMANYU | QUEST LOG

**@${rawUser}** is not registered. Run \`/vibe-join @${rawUser}\` to enter the empire.

---
🎵 *flow time* · *GitEmpire v1.0*`;
    await postComment(comment);
    return;
  }

  const player = empire.players[playerKey];
  if (!player.quest_progress) player.quest_progress = {};
  if (!player.active_quests)  player.active_quests  = [];

  const activeCount    = player.active_quests.length;
  const completedCount = Object.values(player.quest_progress)
    .filter(p => p.status === 'completed').length;

  // Build quest table rows
  const rows = Object.values(QUESTS).map(quest => {
    const status  = questStatus(player, quest.id);
    const icon    = STATUS_ICON[status];
    const label   = STATUS_LABEL[status];
    const reqKey  = BADGE_ORDER[quest.badge_tier_required];
    const reqMeta = BADGE_META[reqKey];
    const reward  = quest.gem_reward > 0 ? `${quest.gem_reward} 💎` : '—';
    return `| ${icon} | **${quest.name}** | ${label} | ${reqMeta.emoji} ${reqMeta.label} | ${reward} | ${quest.difficulty} |`;
  }).join('\n');

  const nextHint = nextQuestHint(player);

  const comment = `## ⚔️ ABHIMANYU | QUEST LOG — @${rawUser}

**Badge:** ${formatBadge(player.badge)} · **Active:** ${activeCount}/${MAX_ACTIVE_QUESTS} · **Completed:** ${completedCount}/${Object.keys(QUESTS).length}

| | Quest | Status | Req. Badge | Reward | Difficulty |
|--|-------|--------|------------|--------|------------|
${rows}

**Recommendation:** ${nextHint}

> Start a quest: \`/vibe-quest start <quest_id>\`
> Quest IDs: ${Object.keys(QUESTS).join(', ')}

---
🎵 *flow time* · *GitEmpire v1.0*`;

  await postComment(comment);
  console.log(`[abhimanyu:quest-list] Quest log posted for @${rawUser}`);
}

main().catch(err => {
  console.error('[abhimanyu:quest-list] Error:', err.message);
  process.exit(1);
});
