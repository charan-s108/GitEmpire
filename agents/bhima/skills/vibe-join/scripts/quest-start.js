#!/usr/bin/env node
'use strict';

/**
 * Bhima — quest-start
 * Enrolls a warrior in a quest. Max 3 active quests at once.
 *
 * Usage: node quest-start.js <@username> <quest_id>
 * Env:   GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_ISSUE_NUMBER
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const { formatBadge, BADGE_META } = require(path.join(process.cwd(), 'scripts', 'badge'));
const { QUESTS, badgeTier } = require(path.join(process.cwd(), 'scripts', 'quests'));

const EMPIRE_PATH = path.join(process.cwd(), 'empire.json');
const MAX_ACTIVE_QUESTS = 3;
const BADGE_ORDER = ['shishya', 'sainik', 'veer', 'kshatriya', 'maharathi', 'atirathi'];

function readEmpire()  { return JSON.parse(fs.readFileSync(EMPIRE_PATH, 'utf8')); }
function writeEmpire(empire) {
  empire.meta.last_updated = new Date().toISOString();
  fs.writeFileSync(EMPIRE_PATH, JSON.stringify(empire, null, 2));
}

function postComment(body) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPOSITORY;
  const issue = process.env.GITHUB_ISSUE_NUMBER;
  if (!token || !repo || !issue) {
    console.log('[bhima:quest-start] No GitHub env — printing to stdout:\n', body);
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
        'User-Agent': 'GitEmpire-Bhima/1.0',
      },
    }, (res) => { res.resume(); resolve(); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function main() {
  const rawUser = (process.argv[2] || '').replace(/^@/, '').trim();
  const questId = (process.argv[3] || '').trim();

  if (!rawUser || !questId) {
    console.error('[bhima:quest-start] Usage: node quest-start.js <@username> <quest_id>');
    process.exit(1);
  }

  const playerKey = `@${rawUser}`;
  const quest = QUESTS[questId];

  // Unknown quest
  if (!quest) {
    const validIds = Object.keys(QUESTS).join(', ');
    const comment = `## ⚔️ BHIMA | QUEST NOT FOUND

**@${rawUser}:** Quest \`${questId}\` does not exist.
**Valid quest IDs:** ${validIds}

Run \`/vibe-quest list\` to see all available quests.

---
🎵 *flow time* · *GitEmpire v1.0*`;
    await postComment(comment);
    return;
  }

  const empire = readEmpire();

  // Player not registered
  if (!empire.players[playerKey]) {
    const comment = `## ⚔️ BHIMA | QUEST DENIED

**@${rawUser}** is not registered. Run \`/vibe-join @${rawUser}\` first.

---
🎵 *flow time* · *GitEmpire v1.0*`;
    await postComment(comment);
    return;
  }

  const player = empire.players[playerKey];
  if (!player.quest_progress) player.quest_progress = {};
  if (!player.active_quests)  player.active_quests  = [];

  // Already completed
  if (player.quest_progress[questId]?.status === 'completed') {
    const comment = `## ⚔️ BHIMA | QUEST ALREADY COMPLETE

**@${rawUser}** has already completed **${quest.name}**. ✓

Run \`/vibe-quest list\` to see your remaining quests.

---
🎵 *flow time* · *GitEmpire v1.0*`;
    await postComment(comment);
    return;
  }

  // Already active
  if (player.active_quests.includes(questId)) {
    const comment = `## ⚔️ BHIMA | QUEST ALREADY ACTIVE

**@${rawUser}** is already on quest **${quest.name}**.

**Hint:** ${quest.hint}

---
🎵 *flow time* · *GitEmpire v1.0*`;
    await postComment(comment);
    return;
  }

  // Active quest limit
  if (player.active_quests.length >= MAX_ACTIVE_QUESTS) {
    const activeNames = player.active_quests
      .map(id => QUESTS[id]?.name || id)
      .join(', ');
    const comment = `## ⚔️ BHIMA | QUEST LOG FULL

**@${rawUser}** already has ${MAX_ACTIVE_QUESTS} active quests: ${activeNames}.

Complete or abandon one before starting a new quest. A warrior with too many fronts loses them all.

---
🎵 *flow time* · *GitEmpire v1.0*`;
    await postComment(comment);
    return;
  }

  // Badge tier requirement
  const playerTier   = BADGE_ORDER.indexOf(player.badge || 'shishya');
  const requiredTier = quest.badge_tier_required;
  if (playerTier < requiredTier) {
    const reqKey  = BADGE_ORDER[requiredTier];
    const reqMeta = BADGE_META[reqKey];
    const comment = `## ⚔️ BHIMA | QUEST LOCKED

**@${rawUser}:** **${quest.name}** requires ${reqMeta.emoji} ${reqMeta.label} (${reqMeta.sanskrit}) or higher.
**Your badge:** ${formatBadge(player.badge)}

Earn more gems or merge more PRs to unlock this quest.

---
🎵 *flow time* · *GitEmpire v1.0*`;
    await postComment(comment);
    return;
  }

  // ── Enroll ──────────────────────────────────────────────────────────────────
  player.active_quests.push(questId);
  player.quest_progress[questId] = { status: 'in_progress' };

  writeEmpire(empire);

  const reqBadgeKey = BADGE_ORDER[quest.badge_tier_required];
  const reqMeta     = BADGE_META[reqBadgeKey];
  const rewardText  = quest.gem_reward > 0 ? `${quest.gem_reward} vibe-gems` : 'Empire honor';
  const activeCount = player.active_quests.length;

  const comment = `## ⚔️ BHIMA | QUEST STARTED

**Warrior:** @${rawUser}
**Quest:** ${quest.name} (${quest.difficulty})
**Description:** ${quest.description}
**Badge required:** ${reqMeta.emoji} ${reqMeta.label} (${reqMeta.sanskrit})
**Reward:** ${rewardText}
**How to complete:** ${quest.hint}
**Active quests:** ${activeCount}/${MAX_ACTIVE_QUESTS}

The path is set. Walk it with dharma. 🏹

---
🎵 *flow time* · *GitEmpire v1.0*`;

  await postComment(comment);
  console.log(`[bhima:quest-start] @${rawUser} started quest: ${questId}`);
}

main().catch(err => {
  console.error('[bhima:quest-start] Error:', err.message);
  process.exit(1);
});
