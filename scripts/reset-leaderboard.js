#!/usr/bin/env node
'use strict';

/**
 * GitEmpire — Leaderboard Reset Script
 * Resets weekly_gems or monthly_gems for all players.
 * Called by scheduled GitHub Actions cron jobs.
 *
 * Usage: node scripts/reset-leaderboard.js weekly
 *        node scripts/reset-leaderboard.js monthly
 */

const fs   = require('fs');
const path = require('path');

const EMPIRE_PATH = path.join(process.cwd(), 'empire.json');

function readEmpire() {
  return JSON.parse(fs.readFileSync(EMPIRE_PATH, 'utf8'));
}

function writeEmpire(empire) {
  empire.meta.last_updated = new Date().toISOString();
  fs.writeFileSync(EMPIRE_PATH, JSON.stringify(empire, null, 2));
}

function main() {
  const scope = (process.argv[2] || '').toLowerCase();

  if (scope !== 'weekly' && scope !== 'monthly') {
    console.error('[reset] Usage: node scripts/reset-leaderboard.js weekly|monthly');
    process.exit(1);
  }

  const empire = readEmpire();
  const field  = scope === 'weekly' ? 'weekly_gems' : 'monthly_gems';
  const now    = new Date().toISOString();

  let count = 0;
  for (const player of Object.values(empire.players)) {
    player[field] = 0;
    count++;
  }

  if (!empire.meta.leaderboard_resets) {
    empire.meta.leaderboard_resets = {};
  }
  empire.meta.leaderboard_resets[`${scope}_reset`] = now;

  writeEmpire(empire);
  console.log(`[reset] ${scope} leaderboard reset — ${count} player(s) zeroed at ${now}`);
}

main();
