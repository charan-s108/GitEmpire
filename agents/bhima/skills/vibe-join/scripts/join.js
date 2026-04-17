#!/usr/bin/env node
'use strict';

/**
 * Bhima — vibe-join
 * Registers a new warrior in empire.json and awards 100 starter vibe-gems.
 *
 * Usage: node join.js <@username>
 * Env:   GITHUB_TOKEN  — for posting the comment
 *        GITHUB_REPOSITORY  — owner/repo
 *        GITHUB_ISSUE_NUMBER — issue or PR number to comment on
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
  const issue = process.env.GITHUB_ISSUE_NUMBER;

  if (!token || !repo || !issue) {
    console.log('[bhima] No GitHub env — printing comment to stdout:\n', body);
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
          'User-Agent': 'GitEmpire-Bhima/1.0',
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

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const rawArg = process.argv[2] || '';
  const username = rawArg.replace(/^@/, '').trim();

  if (!username) {
    console.error('[bhima] Usage: node join.js <@username>');
    process.exit(1);
  }

  if (username.endsWith('[bot]')) {
    console.error('[bhima] Bots cannot join the empire.');
    process.exit(0);
  }

  const empire = readEmpire();

  // Duplicate check
  if (empire.players[`@${username}`]) {
    const player = empire.players[`@${username}`];
    const comment = `## ⚔️ BHIMA | WARRIOR ALREADY REGISTERED

**@${username}** is already a warrior of this empire 🌊
**Current gems:** ${player.vibe_gems} vibe-gems · **Acres:** ${player.acres}

---
🎵 *flow time* · *GitEmpire v1.0*`;

    await postComment(comment);
    console.log(`[bhima] @${username} already registered — skipped.`);
    return;
  }

  // Register new player
  const now = new Date().toISOString();
  empire.players[`@${username}`] = {
    vibe_gems: 100,
    weekly_gems: 100,
    monthly_gems: 100,
    acres: 0,
    plots: [],
    streak: 1,
    joined: now,
    last_active: now,
    wars_won: 0,
    wars_lost: 0,
    badge: 'shishya',
    badge_history: [],
    bugs_found: 0,
    critical_bugs_found: 0,
    prs_merged: 0,
    quest_progress: {},
    active_quests: ['first_blood'],
  };
  empire.meta.total_warriors += 1;

  // Compute initial badge (100 gems → sainik)
  const player = empire.players[`@${username}`];
  const upgraded = applyBadge(player);

  // Auto-complete first_blood quest (triggers immediately on join)
  checkQuestCompletion(player, 'join', {});

  writeEmpire(empire);

  // Build leaderboard snapshot (top player by gems)
  const sorted = Object.entries(empire.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems);
  const [topName, topPlayer] = sorted[0];
  const empireStatus = `${empire.meta.total_warriors} warriors strong · top warrior: ${topName} (${topPlayer.vibe_gems} gems, ${topPlayer.acres} acres)`;

  const badgeLine  = buildBadgeLine(player, upgraded);
  const questHint  = nextQuestHint(player);

  const comment = `## ⚔️ BHIMA | WARRIOR REGISTERED

**Welcome:** @${username} has entered the empire 🌊
**Starter gems:** 100 vibe-gems deposited to war chest
**Quest completed:** First Blood ⚔️ — you have entered the empire
${badgeLine}
**${nextBadgeHint(player)}**
**Next Quest:** ${questHint}
**Empire Status:** ${empireStatus}

---
🎵 *flow time* · *GitEmpire v1.0*`;

  await postComment(comment);
  console.log(`[bhima] @${username} registered. Total warriors: ${empire.meta.total_warriors}`);
}

main().catch((err) => {
  console.error('[bhima] Error:', err.message);
  process.exit(1);
});
