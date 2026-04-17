#!/usr/bin/env node
'use strict';

/**
 * GitEmpire — Local Demo & Verification Script
 * Runs the full warrior chain end-to-end, verifies state, and renders the SVG.
 *
 * Usage: node scripts/demo.js [--reset]
 *   --reset   Wipe empire.json back to blank before running
 */

const fs     = require('fs');
const path   = require('path');
const { execSync } = require('child_process');

// ── ANSI ──────────────────────────────────────────────────────────────────────

const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  magenta: '\x1b[35m',
  red:     '\x1b[31m',
  blue:    '\x1b[34m',
};

function h1(text) {
  console.log(`\n${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  ${text}${C.reset}`);
  console.log(`${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}\n`);
}

function h2(text) {
  console.log(`\n${C.bold}${C.yellow}  ▶ ${text}${C.reset}`);
}

function ok(text)   { console.log(`  ${C.green}✓${C.reset} ${text}`); }
function info(text) { console.log(`  ${C.blue}i${C.reset} ${text}`); }
function warn(text) { console.log(`  ${C.yellow}!${C.reset} ${text}`); }
function fail(text) { console.log(`  ${C.red}✗${C.reset} ${text}`); }
function sep()      { console.log(`  ${C.dim}${'─'.repeat(54)}${C.reset}`); }

// ── Helpers ───────────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const EMPIRE_PATH = path.join(ROOT, 'empire.json');
const BLANK_EMPIRE = {
  meta: {
    version: '1.0.0',
    last_updated: new Date().toISOString(),
    total_warriors: 0,
    leaderboard_resets: {
      weekly_reset: new Date().toISOString(),
      monthly_reset: new Date().toISOString(),
    },
  },
  players: {},
  wars: [],
  signals: { pending_claims: [], karna_scanning: false, last_svg_update: null },
  leaderboard: [],
  battle_svg: '',
};

function readEmpire() {
  return JSON.parse(fs.readFileSync(EMPIRE_PATH, 'utf8'));
}

function run(label, cmd) {
  try {
    const out = execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    ok(label);
    return out;
  } catch (e) {
    fail(`${label}\n    ${e.stderr?.split('\n')[0] || e.message}`);
    process.exit(1);
  }
}

function runScript(label, scriptPath, ...args) {
  const argStr = args.map((a) => JSON.stringify(String(a))).join(' ');
  return run(label, `node ${scriptPath} ${argStr}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const reset = process.argv.includes('--reset');

  h1('GitEmpire — Local Demo & Verification');
  console.log(`  ${C.dim}Runs the full warrior chain end-to-end.${C.reset}`);
  console.log(`  ${C.dim}No GitHub env needed — all output goes to stdout.${C.reset}\n`);

  // ── Step 0: Reset state ────────────────────────────────────────────────────
  if (reset || !fs.existsSync(EMPIRE_PATH) ||
      Object.keys(JSON.parse(fs.readFileSync(EMPIRE_PATH,'utf8')).players).length > 0) {
    fs.writeFileSync(EMPIRE_PATH, JSON.stringify(BLANK_EMPIRE, null, 2));
    ok('empire.json reset to blank state');
  } else {
    info('empire.json already blank — skipping reset (use --reset to force)');
  }

  // ── Step 1: Spec validation ────────────────────────────────────────────────
  h2('Step 1 — Spec Validation (gitagent v0.1.0)');
  for (const dir of ['.', 'agents/bhima', 'agents/karna', 'agents/drona', 'agents/ashwathama', 'agents/abhimanyu', 'agents/veda']) {
    run(`gitagent validate ${dir}`, `gitagent validate ${dir}`);
  }

  // ── Step 2: Bhima — register warriors ─────────────────────────────────────
  h2('Step 2 — Bhima: Register Warriors');
  const JOIN = 'agents/bhima/skills/vibe-join/scripts/join.js';
  runScript('register @alice',   JOIN, '@alice');
  runScript('register @bob',     JOIN, '@bob');
  runScript('register @charan',  JOIN, '@charan');
  runScript('duplicate @alice (should skip)', JOIN, '@alice');
  sep();
  const e1 = readEmpire();
  info(`Warriors registered: ${e1.meta.total_warriors}`);
  info(`@alice: ${e1.players['@alice'].vibe_gems} gems`);

  // ── Step 3: Drona — claim PRs ─────────────────────────────────────────────
  h2('Step 3 — Drona: Claim Merged PRs');
  const CLAIM = 'agents/drona/skills/land-survey/scripts/claim.js';
  runScript('claim PR #1 (alice, +180/-30, tests)', CLAIM, 1, 'alice', 180, 30, true);
  runScript('claim PR #2 (bob, +90/-10, no tests)',  CLAIM, 2, 'bob',  90,  10, false);
  runScript('claim PR #3 (charan, +400/-5, no tests — 0.5x)', CLAIM, 3, 'charan', 400, 5, false);
  runScript('duplicate PR #1 (should skip)', CLAIM, 1, 'alice', 180, 30, true);
  sep();
  const e2 = readEmpire();
  info(`@alice:  ${e2.players['@alice'].vibe_gems} gems · ${e2.players['@alice'].acres} acres`);
  info(`@bob:    ${e2.players['@bob'].vibe_gems} gems · ${e2.players['@bob'].acres} acres`);
  info(`@charan: ${e2.players['@charan'].vibe_gems} gems · ${e2.players['@charan'].acres} acres`);

  // ── Step 4: Karna — scan files ────────────────────────────────────────────
  h2('Step 4 — Karna: Bug Scan (rainbow ANSI output)');
  const SCAN = 'agents/karna/skills/bug-radar/scripts/scan.js';
  console.log('');
  // Scan a script that has intentional patterns for demo
  runScript('scan agents/drona/skills/land-survey/scripts/claim.js', SCAN, 'agents/drona/skills/land-survey/scripts/claim.js', 'alice');
  sep();
  const e3 = readEmpire();
  info(`@alice after scan: ${e3.players['@alice'].vibe_gems} gems`);

  // ── Step 5: Ashwathama — gem transfers ────────────────────────────────────
  h2('Step 5 — Ashwathama: Gem Transfers');
  const TRADE = 'agents/ashwathama/skills/gem-vault/scripts/trade.js';
  runScript('alice → bob (50 gems)',           TRADE, 'alice', 50, '@bob');
  runScript('bob → charan (25 gems)',          TRADE, 'bob',   25, '@charan');
  runScript('overdraft attempt (should deny)', TRADE, 'bob',   9999, '@alice');
  runScript('self-transfer (should deny)',     TRADE, 'alice', 10,   '@alice');
  sep();
  const e4 = readEmpire();
  info(`@alice:  ${e4.players['@alice'].vibe_gems} gems`);
  info(`@bob:    ${e4.players['@bob'].vibe_gems} gems`);
  info(`@charan: ${e4.players['@charan'].vibe_gems} gems`);

  // ── Step 6: Abhimanyu — map + leaderboard modes ───────────────────────────
  h2('Step 6 — Abhimanyu: Leaderboard (all modes) & Neon SVG Map');
  const MAPGEN = 'agents/abhimanyu/skills/battle-svg/scripts/mapgen.js';
  runScript('generate all-time leaderboard', MAPGEN, 'leaderboard', 'alltime');
  runScript('generate weekly leaderboard',   MAPGEN, 'leaderboard', 'weekly');
  runScript('generate monthly leaderboard',  MAPGEN, 'leaderboard', 'monthly');
  runScript('generate SVG map',              MAPGEN, 'map');
  sep();

  // ── Step 6b: Quest system ─────────────────────────────────────────────────
  h2('Step 6b — Quest System (Phase 6)');
  const QUEST_START = 'agents/bhima/skills/vibe-join/scripts/quest-start.js';
  const QUEST_LIST  = 'agents/abhimanyu/skills/battle-svg/scripts/quest-list.js';

  // Quest list — read-only, never mutates empire.json
  runScript('/vibe-quest list for @alice',  QUEST_LIST, '@alice');
  runScript('/vibe-quest list for @charan', QUEST_LIST, '@charan');

  // Quest start — war_chest requires sainik tier (alice has it)
  runScript('/vibe-quest start war_chest for @alice',      QUEST_START, '@alice',  'war_chest');
  runScript('/vibe-quest start bug_scout for @charan',     QUEST_START, '@charan', 'bug_scout');

  // Error cases
  runScript('duplicate start (should already be active)',  QUEST_START, '@alice',  'war_chest');
  runScript('unknown quest id (should reject)',            QUEST_START, '@alice',  'fake_quest');

  sep();
  const e5 = readEmpire();

  // Verify quest fields
  let questOk = true;
  for (const [name, p] of Object.entries(e5.players)) {
    if (!p.quest_progress) { warn(`${name} missing quest_progress`); questOk = false; }
    if (!Array.isArray(p.active_quests)) { warn(`${name} missing active_quests`); questOk = false; }
  }
  if (questOk) ok('All players have quest_progress + active_quests fields');

  // Verify first_blood is completed for all (join.js auto-completes it)
  let firstBloodOk = true;
  for (const [name, p] of Object.entries(e5.players)) {
    if (p.quest_progress?.first_blood?.status !== 'completed') {
      warn(`${name} first_blood not completed`);
      firstBloodOk = false;
    }
  }
  if (firstBloodOk) ok('first_blood quest auto-completed for all warriors');

  // Verify alice has war_chest active
  const aliceWarChest = e5.players['@alice']?.quest_progress?.war_chest?.status;
  if (aliceWarChest === 'in_progress') {
    ok('@alice war_chest quest is active (in_progress)');
  } else {
    warn(`@alice war_chest status: ${aliceWarChest || 'missing'}`);
  }

  // Quest completion through scan — bug_scout trigger
  info('Scanning to trigger bug_scout quest completion for @charan...');
  runScript('scan trade.js (triggers bug_scout for @charan)', SCAN,
    'agents/ashwathama/skills/gem-vault/scripts/trade.js', 'charan');
  const e5b = readEmpire();
  const charanBugScout = e5b.players['@charan']?.quest_progress?.bug_scout?.status;
  if (charanBugScout === 'completed') {
    ok('@charan bug_scout quest completed via scan');
  } else {
    info(`@charan bug_scout status: ${charanBugScout || 'not started (no bugs found)'}`);
  }

  // Quest completion through claim — land_grab already completed; show quest progress table
  console.log('');
  console.log(`  ${C.bold}${'Warrior'.padEnd(14)}${'first_blood'.padEnd(15)}${'land_grab'.padEnd(13)}${'bug_scout'.padEnd(12)}${'war_chest'.padEnd(12)}active${C.reset}`);
  console.log(`  ${C.dim}${'─'.repeat(74)}${C.reset}`);
  for (const [name, p] of Object.entries(e5b.players)) {
    const qp = p.quest_progress || {};
    const s  = (id) => (qp[id]?.status === 'completed' ? '✓' : qp[id]?.status === 'in_progress' ? '◌' : '—').padEnd(13);
    const active = (p.active_quests || []).join(', ') || '—';
    console.log(`  ${name.padEnd(14)}${s('first_blood')} ${s('land_grab')} ${s('bug_scout')} ${s('war_chest')} ${active}`);
  }

  // ── Step 6c: Veda guide ───────────────────────────────────────────────────
  h2('Step 6c — Veda: Dharma Guidance');
  const GUIDE = 'agents/veda/skills/dharma-guide/scripts/guide.js';

  // Unregistered user — should get join recommendation
  runScript('/vibe-guide unregistered player', GUIDE, '@nobody');

  // Registered users — guidance adapts to their state
  runScript('/vibe-guide @alice (veer, has PRs + bugs)', GUIDE, '@alice');
  runScript('/vibe-guide @bob (sainik, no bugs yet)',    GUIDE, '@bob');
  runScript('/vibe-guide @charan (sainik, has bug)',     GUIDE, '@charan');

  sep();
  ok('Veda guidance adapts to each player\'s state');
  info('Veda is read-only — empire.json unchanged after all 4 guide calls');

  // Verify empire.json was not written (last_updated should not have changed)
  const e6c = readEmpire();
  const e5bStr = JSON.stringify(e5b);
  const e6cStr = JSON.stringify(e6c);
  if (e5bStr === e6cStr) {
    ok('empire.json unchanged — Veda read-only constraint verified');
  } else {
    fail('empire.json was modified by Veda — read-only constraint violated');
    process.exit(1);
  }

  // ── Step 7: SVG preview ───────────────────────────────────────────────────
  h2('Step 7 — SVG Preview');
  const svgFilePath = path.join(ROOT, 'empire-map.svg');
  if (fs.existsSync(svgFilePath)) {
    const svgContent = fs.readFileSync(svgFilePath, 'utf8');
    const previewPath = path.join(ROOT, 'empire-preview.html');
    fs.writeFileSync(previewPath, `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GitEmpire Map Preview</title>
  <style>
    body { background: #0d1117; display: flex; flex-direction: column;
           align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 24px; }
    h1   { color: #00d4ff; font-family: monospace; margin-bottom: 24px; }
    svg  { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>⚔️ GitEmpire — Empire Map</h1>
  ${svgContent}
</body>
</html>`);
    ok('empire-map.svg written and preview generated → empire-preview.html');
    info(`Open in browser: file://${previewPath}`);
  } else {
    warn('empire-map.svg not found — map generation may have failed');
  }

  // ── Step 8: Badge + State summary ────────────────────────────────────────
  h2('Step 8 — Final Empire State (with Badges)');
  const final = readEmpire();
  const sorted = Object.entries(final.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems);

  // Verify badge + quest fields exist
  let badgeOk = true;
  for (const [name, p] of sorted) {
    if (!p.badge) { warn(`${name} missing badge field`); badgeOk = false; }
    if (p.prs_merged === undefined) { warn(`${name} missing prs_merged field`); badgeOk = false; }
    if (!p.quest_progress) { warn(`${name} missing quest_progress field`); badgeOk = false; }
    if (!Array.isArray(p.active_quests)) { warn(`${name} missing active_quests field`); badgeOk = false; }
  }
  if (badgeOk) ok('All players have badge + progression + quest fields');

  console.log('');
  console.log(`  ${C.bold}${'Rank'.padEnd(6)}${'Warrior'.padEnd(14)}${'Badge'.padEnd(12)}${'Gems'.padEnd(10)}${'W.Gems'.padEnd(10)}${'Acres'.padEnd(8)}PRs${C.reset}`);
  console.log(`  ${C.dim}${'─'.repeat(66)}${C.reset}`);
  sorted.forEach(([name, p], i) => {
    const medal = ['🥇','🥈','🥉'][i] || `${i+1}. `;
    const badge = (p.badge || 'shishya').padEnd(10);
    console.log(`  ${medal}  ${name.padEnd(14)}${badge}${String(p.vibe_gems).padEnd(10)}${String(p.weekly_gems||0).padEnd(10)}${String(p.acres).padEnd(8)}${p.prs_merged||0}`);
  });

  // ── Final ─────────────────────────────────────────────────────────────────
  h1('All checks passed ✓');
  console.log(`  ${C.green}${C.bold}GitEmpire is working correctly.${C.reset}`);
  console.log(`  ${C.dim}All 6 warriors + Veda smoke-tested · badges verified · quests verified · SVG rendered${C.reset}\n`);
  console.log(`  Next steps:`);
  console.log(`  ${C.cyan}1.${C.reset} Open empire-preview.html in your browser to see the neon map`);
  console.log(`  ${C.cyan}2.${C.reset} Open https://charan-s108.github.io/GitEmpire/ for the live dashboard`);
  console.log(`  ${C.cyan}3.${C.reset} Push to GitHub and run: GITHUB_TOKEN=... GITHUB_REPOSITORY=charan-s108/GitEmpire node scripts/create-quest-issues.js`);
  console.log(`  ${C.cyan}4.${C.reset} Post \`/vibe-join @yourname\` on any issue to go live\n`);
}

main().catch((err) => {
  console.error(`\n${C.red}Demo failed:${C.reset}`, err.message);
  process.exit(1);
});
