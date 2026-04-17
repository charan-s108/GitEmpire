#!/usr/bin/env node
'use strict';

/**
 * Ashwathama — gem-vault / trade
 * Transfers vibe-gems between registered warriors.
 *
 * Usage: node trade.js <sender> <amount> <@target>
 * Env:   GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_ISSUE_NUMBER
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const { applyBadge, formatBadge, buildBadgeLine } = require(path.join(process.cwd(), 'scripts', 'badge'));
const { checkQuestCompletion, nextQuestHint } = require(path.join(process.cwd(), 'scripts', 'quests'));

// ── empire.json helpers ───────────────────────────────────────────────────────

const EMPIRE_PATH = path.join(process.cwd(), 'empire.json');

function readEmpire() {
  return JSON.parse(fs.readFileSync(EMPIRE_PATH, 'utf8'));
}

function writeEmpire(empire) {
  empire.meta.last_updated = new Date().toISOString();
  fs.writeFileSync(EMPIRE_PATH, JSON.stringify(empire, null, 2));
}

// ── GitHub comment ────────────────────────────────────────────────────────────

function postComment(body) {
  const token = process.env.GITHUB_TOKEN;
  const repo  = process.env.GITHUB_REPOSITORY;
  const issue = process.env.GITHUB_ISSUE_NUMBER;

  if (!token || !repo || !issue) {
    console.log('[ashwathama] No GitHub env — printing comment to stdout:\n', body);
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
        'User-Agent': 'GitEmpire-Ashwathama/1.0',
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

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const senderArg = (process.argv[2] || '').replace(/^@/, '').trim();
  const amount    = parseInt(process.argv[3] || '0', 10);
  const targetArg = (process.argv[4] || '').replace(/^@/, '').trim();

  if (!senderArg || !targetArg || !amount) {
    console.error('[ashwathama] Usage: node trade.js <sender> <amount> <@target>');
    process.exit(1);
  }

  const senderKey = `@${senderArg}`;
  const targetKey = `@${targetArg}`;

  // ── Validation ──────────────────────────────────────────────────────────────

  if (senderArg === targetArg) {
    const comment = `## ⚔️ ASHWATHAMA | TRANSFER DENIED

The vault does not deal in self-transfers. Send to another warrior.`;
    await postComment(comment);
    console.log('[ashwathama] Rejected: self-transfer');
    return;
  }

  if (amount <= 0) {
    const comment = `## ⚔️ ASHWATHAMA | TRANSFER DENIED

**Reason:** Transfer amount must be greater than 0.`;
    await postComment(comment);
    console.log('[ashwathama] Rejected: non-positive amount');
    return;
  }

  const empire = readEmpire();

  if (!empire.players[senderKey]) {
    const comment = `## ⚔️ ASHWATHAMA | TRANSFER DENIED

**Reason:** @${senderArg} is not registered. Run \`/vibe-join @${senderArg}\` first.`;
    await postComment(comment);
    console.log(`[ashwathama] Rejected: sender @${senderArg} not registered`);
    return;
  }

  if (!empire.players[targetKey]) {
    const comment = `## ⚔️ ASHWATHAMA | TRANSFER DENIED

**Reason:** @${targetArg} is not registered. Run \`/vibe-join @${targetArg}\` first.`;
    await postComment(comment);
    console.log(`[ashwathama] Rejected: target @${targetArg} not registered`);
    return;
  }

  const senderBefore = empire.players[senderKey].vibe_gems;
  if (senderBefore < amount) {
    const deficit = amount - senderBefore;
    const comment = `## ⚔️ ASHWATHAMA | TRANSFER DENIED

**Reason:** @${senderArg} has ${senderBefore} gems. Cannot send ${amount}.
**Deficit:** ${deficit} vibe-gems short.
The vault does not deal in debt.

---
🎵 *flow time* · *GitEmpire v1.0*`;
    await postComment(comment);
    console.log(`[ashwathama] Rejected: insufficient gems (have ${senderBefore}, need ${amount})`);
    return;
  }

  // ── Execute transfer ────────────────────────────────────────────────────────

  const targetBefore = empire.players[targetKey].vibe_gems;

  empire.players[senderKey].vibe_gems -= amount;
  empire.players[targetKey].vibe_gems += amount;
  // Gems received count toward weekly/monthly for recipient only
  empire.players[targetKey].weekly_gems  = (empire.players[targetKey].weekly_gems  || 0) + amount;
  empire.players[targetKey].monthly_gems = (empire.players[targetKey].monthly_gems || 0) + amount;
  empire.players[senderKey].last_active = new Date().toISOString();
  empire.players[targetKey].last_active = new Date().toISOString();

  const senderAfter = empire.players[senderKey].vibe_gems;
  const targetAfter = empire.players[targetKey].vibe_gems;

  // Recompute badges for both parties
  applyBadge(empire.players[senderKey]);
  const targetUpgraded = applyBadge(empire.players[targetKey]);

  // Quest completion check — recipient may hit war_chest threshold
  const targetPlayer = empire.players[targetKey];
  if (!targetPlayer.quest_progress) targetPlayer.quest_progress = {};
  if (!targetPlayer.active_quests)  targetPlayer.active_quests  = [];
  const completedQuests = checkQuestCompletion(targetPlayer, 'gem_total', { vibe_gems: targetPlayer.vibe_gems });

  writeEmpire(empire);

  // Leaderboard snapshot
  const sorted = Object.entries(empire.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems);
  const [topName, topPlayer] = sorted[0];
  const empireStatus = `top warrior: ${topName} (${topPlayer.vibe_gems} gems, ${topPlayer.acres} acres)`;

  const targetBadgeLine = buildBadgeLine(empire.players[targetKey], targetUpgraded);
  const questLines = completedQuests.length > 0
    ? completedQuests.map(q => `**Quest completed (@${targetArg}):** ${q.name}${q.gem_reward > 0 ? ` (+${q.gem_reward} gems)` : ''} 🎯`).join('\n')
    : '';
  const senderPlayer = empire.players[senderKey];
  const nextQuest = `**Next Quest:** ${nextQuestHint(senderPlayer)}`;

  const comment = `## ⚔️ ASHWATHAMA | GEM TRANSFER COMPLETE

**Transfer:** ${amount} vibe-gems
**From:** @${senderArg} (was ${senderBefore} → now ${senderAfter} gems)
**To:** @${targetArg} (was ${targetBefore} → now ${targetAfter} gems)
**Ledger:** transaction recorded 🌙
${targetBadgeLine}
${questLines ? questLines + '\n' : ''}${nextQuest}
**Empire Status:** ${empireStatus}

---
🎵 *flow time* · *GitEmpire v1.0*`;

  await postComment(comment);
  console.log(`[ashwathama] ${amount} gems: @${senderArg} → @${targetArg}`);
}

main().catch((err) => {
  console.error('[ashwathama] Error:', err.message);
  process.exit(1);
});
