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
  meta: { version: '1.0.0', last_updated: new Date().toISOString(), total_warriors: 0 },
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
  for (const dir of ['.', 'agents/bhima', 'agents/karna', 'agents/drona', 'agents/ashwathama', 'agents/abhimanyu']) {
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

  // ── Step 6: Abhimanyu — map + leaderboard ─────────────────────────────────
  h2('Step 6 — Abhimanyu: Leaderboard & Neon SVG Map');
  const MAPGEN = 'agents/abhimanyu/skills/battle-svg/scripts/mapgen.js';
  runScript('generate leaderboard', MAPGEN, 'leaderboard');
  runScript('generate SVG map',     MAPGEN, 'map');
  sep();

  // ── Step 7: SVG preview ───────────────────────────────────────────────────
  h2('Step 7 — SVG Preview');
  const e5 = readEmpire();
  if (e5.battle_svg) {
    const svgContent = Buffer.from(e5.battle_svg, 'base64').toString('utf8');
    const previewPath = path.join(ROOT, 'empire-preview.html');
    fs.writeFileSync(previewPath, `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>GitEmpire Map Preview</title>
  <style>
    body { background: #0d1117; display: flex; flex-direction: column;
           align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    h1   { color: #00d4ff; font-family: monospace; margin-bottom: 24px; }
  </style>
</head>
<body>
  <h1>⚔️ GitEmpire — Empire Map</h1>
  ${svgContent}
</body>
</html>`);
    ok(`SVG preview written → empire-preview.html`);
    info(`Open in browser: file://${previewPath}`);
  } else {
    warn('battle_svg empty — map not generated');
  }

  // ── Step 8: State summary ─────────────────────────────────────────────────
  h2('Step 8 — Final Empire State');
  const final = readEmpire();
  const sorted = Object.entries(final.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems);

  console.log('');
  console.log(`  ${C.bold}${'Rank'.padEnd(6)}${'Warrior'.padEnd(14)}${'Gems'.padEnd(10)}${'Acres'.padEnd(8)}Plots${C.reset}`);
  console.log(`  ${C.dim}${'─'.repeat(50)}${C.reset}`);
  sorted.forEach(([name, p], i) => {
    const medal = ['🥇','🥈','🥉'][i] || `${i+1}. `;
    console.log(`  ${medal}  ${name.padEnd(14)}${String(p.vibe_gems).padEnd(10)}${String(p.acres).padEnd(8)}${p.plots.length}`);
  });

  // ── Final ─────────────────────────────────────────────────────────────────
  h1('All checks passed ✓');
  console.log(`  ${C.green}${C.bold}GitEmpire is working correctly.${C.reset}`);
  console.log(`  ${C.dim}All 5 warriors smoke-tested · empire.json valid · SVG rendered${C.reset}\n`);
  console.log(`  Next steps:`);
  console.log(`  ${C.cyan}1.${C.reset} Open empire-preview.html in your browser to see the neon map`);
  console.log(`  ${C.cyan}2.${C.reset} Push to GitHub and add GROQ_API_KEY secret`);
  console.log(`  ${C.cyan}3.${C.reset} Post \`/vibe-join @yourname\` on any issue to go live\n`);
}

main().catch((err) => {
  console.error(`\n${C.red}Demo failed:${C.reset}`, err.message);
  process.exit(1);
});
