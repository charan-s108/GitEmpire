#!/usr/bin/env node
'use strict';

/**
 * Abhimanyu — battle-svg / mapgen
 * Generates a neon SVG empire map or leaderboard table from empire.json.
 *
 * Usage: node mapgen.js map | node mapgen.js leaderboard
 * Env:   GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_ISSUE_NUMBER
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');

// ── Neon palette (ONLY these colors — no deviations) ─────────────────────────

const COLORS = {
  bg:      '#0d1117',
  grid:    '#1a2332',
  players: ['#00ff88', '#ff0066', '#00d4ff', '#ffaa00', '#cc44ff', '#ff4444', '#44ffcc', '#ff8800'],
  neutral: '#7700ff',
  war:     '#ff6600',
  text:    '#e6edf3',
  accent:  '#00d4ff',
  dim:     '#8b949e',
};

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
    console.log('[abhimanyu] No GitHub env — printing comment to stdout:\n', body);
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

// ── SVG generation ────────────────────────────────────────────────────────────

/**
 * Deterministic hexagon grid layout.
 * Each player gets a hex cell; wars draw animated borders between adjacent cells.
 * Canvas: 800 × 520
 */
function generateSVG(empire) {
  const W = 800, H = 520;
  const players = Object.entries(empire.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems);

  // Hex grid params
  const HEX_R = 70;           // outer radius
  const HEX_H = HEX_R * Math.sqrt(3);
  const COLS   = 4;

  // Generate hex center positions in a grid
  function hexCenter(idx) {
    const col = idx % COLS;
    const row = Math.floor(idx / COLS);
    const x = 100 + col * (HEX_R * 1.75);
    const y = 120 + row * HEX_H + (col % 2 === 1 ? HEX_H / 2 : 0);
    return { x, y };
  }

  // Flat-top hexagon points
  function hexPoints(cx, cy, r) {
    return Array.from({ length: 6 }, (_, i) => {
      const angle = (Math.PI / 180) * (60 * i);
      return `${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`;
    }).join(' ');
  }

  // Active wars lookup
  const activeWars = new Set(
    (empire.wars || [])
      .filter((w) => w.status === 'active')
      .flatMap((w) => [w.attacker, w.defender])
  );

  // Build filter defs
  const defs = players.map((_, i) => {
    const color = COLORS.players[i % COLORS.players.length];
    return `<filter id="glow${i}" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;
  }).join('\n    ');

  const warFilterDef = `<filter id="warGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>`;

  // Build hex cells
  const hexCells = players.map(([name, player], i) => {
    const color = COLORS.players[i % COLORS.players.length];
    const { x, y } = hexCenter(i);
    const pts = hexPoints(x, y, HEX_R - 4);
    const isAtWar = activeWars.has(name);
    const displayName = name.replace(/^@/, '');
    const shortName = displayName.length > 8 ? displayName.slice(0, 7) + '…' : displayName;

    const warStroke = isAtWar
      ? `<polygon points="${pts}"
           fill="none"
           stroke="${COLORS.war}"
           stroke-width="3"
           stroke-dasharray="8 4"
           filter="url(#warGlow)"
           class="war-border"/>`
      : '';

    return `
    <!-- ${name} -->
    <polygon points="${pts}"
      fill="${color}22"
      stroke="${color}"
      stroke-width="2"
      filter="url(#glow${i})"
    />
    ${warStroke}
    <text x="${x}" y="${y - 14}" text-anchor="middle"
      font-family="monospace" font-size="12" font-weight="bold"
      fill="${color}">@${shortName}</text>
    <text x="${x}" y="${y + 4}" text-anchor="middle"
      font-family="monospace" font-size="10"
      fill="${COLORS.text}">💎 ${player.vibe_gems}</text>
    <text x="${x}" y="${y + 18}" text-anchor="middle"
      font-family="monospace" font-size="10"
      fill="${COLORS.dim}">🌿 ${player.acres} acres</text>`;
  }).join('\n');

  // Empty-state hex if no players
  const emptyHex = players.length === 0 ? `
    <polygon points="${hexPoints(W / 2, H / 2 - 30, HEX_R)}"
      fill="${COLORS.neutral}22" stroke="${COLORS.neutral}" stroke-width="1.5"/>
    <text x="${W / 2}" y="${H / 2 - 20}" text-anchor="middle"
      font-family="monospace" font-size="13" fill="${COLORS.neutral}">no warriors yet</text>
    <text x="${W / 2}" y="${H / 2 - 4}" text-anchor="middle"
      font-family="monospace" font-size="11" fill="${COLORS.dim}">/vibe-join @you</text>` : '';

  // Legend
  const legendItems = Math.min(players.length, 4);
  const legendRows = Array.from({ length: legendItems }, (_, i) => {
    const [name] = players[i];
    const color = COLORS.players[i % COLORS.players.length];
    return `<rect x="${16 + i * 120}" y="${H - 38}" width="10" height="10" fill="${color}" rx="2"/>
    <text x="${30 + i * 120}" y="${H - 29}" font-family="monospace" font-size="9"
      fill="${COLORS.dim}">${name.replace(/^@/, '').slice(0, 9)}</text>`;
  }).join('\n    ');

  const warLegend = empire.wars?.some((w) => w.status === 'active')
    ? `<rect x="${W - 140}" y="${H - 38}" width="10" height="10" fill="${COLORS.war}" rx="2"/>
    <text x="${W - 126}" y="${H - 29}" font-family="monospace" font-size="9" fill="${COLORS.dim}">active war</text>`
    : '';

  // Grid lines (subtle background)
  const gridLines = Array.from({ length: 10 }, (_, i) =>
    `<line x1="0" y1="${52 * i}" x2="${W}" y2="${52 * i}" stroke="${COLORS.grid}" stroke-width="0.5"/>`
  ).join('\n  ') + '\n  ' + Array.from({ length: 16 }, (_, i) =>
    `<line x1="${50 * i}" y1="0" x2="${50 * i}" y2="${H}" stroke="${COLORS.grid}" stroke-width="0.5"/>`
  ).join('\n  ');

  // Title
  const warriorCount = players.length;
  const activeWarCount = (empire.wars || []).filter((w) => w.status === 'active').length;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    ${defs}
    ${warFilterDef}
    <style>
      @keyframes warPulse {
        0%   { stroke-dashoffset: 0; opacity: 1; }
        50%  { opacity: 0.6; }
        100% { stroke-dashoffset: -24; opacity: 1; }
      }
      .war-border { animation: warPulse 1.4s linear infinite; }
    </style>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${COLORS.bg}"/>

  <!-- Grid -->
  ${gridLines}

  <!-- Title bar -->
  <rect x="0" y="0" width="${W}" height="44" fill="${COLORS.grid}"/>
  <text x="16" y="28" font-family="monospace" font-size="16" font-weight="bold"
    fill="${COLORS.accent}">⚔️  GitEmpire</text>
  <text x="${W - 16}" y="28" text-anchor="end" font-family="monospace" font-size="11"
    fill="${COLORS.dim}">${warriorCount} warrior${warriorCount !== 1 ? 's' : ''} · ${activeWarCount} active war${activeWarCount !== 1 ? 's' : ''}</text>

  <!-- Hex cells -->
  ${hexCells}
  ${emptyHex}

  <!-- Legend -->
  <rect x="0" y="${H - 48}" width="${W}" height="48" fill="${COLORS.grid}88"/>
  ${legendRows}
  ${warLegend}
  <text x="${W - 16}" y="${H - 10}" text-anchor="end" font-family="monospace"
    font-size="9" fill="${COLORS.dim}">GitEmpire v1.0 · 🎵 synthwave</text>
</svg>`;

  return svg;
}

// ── Leaderboard ───────────────────────────────────────────────────────────────

function generateLeaderboard(empire) {
  const players = Object.entries(empire.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems || b.acres - a.acres)
    .slice(0, 5);

  if (players.length === 0) {
    return `*No warriors yet. Be the first — \`/vibe-join @you\`*`;
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
  const rows = players.map(([name, p], i) => {
    const streak = p.streak > 1 ? ` 🔥 ${p.streak}` : '';
    return `| ${medals[i]} | ${name} | ${p.vibe_gems} | ${p.acres} |${streak} |`;
  }).join('\n');

  return `| Rank | Warrior | 💎 Vibe-Gems | 🌿 Glow-Acres | Streak |
|------|---------|------------|------------|--------|
${rows}`;
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const mode = (process.argv[2] || 'map').toLowerCase();

  const empire = readEmpire();

  if (mode === 'leaderboard') {
    const table = generateLeaderboard(empire);
    const totalWarriors = Object.keys(empire.players).length;
    const topEntry = Object.entries(empire.players)
      .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems)[0];
    const empireStatus = topEntry
      ? `${topEntry[0]} leads (${topEntry[1].vibe_gems} gems, ${topEntry[1].acres} acres)`
      : 'no warriors yet';

    const comment = `## ⚔️ ABHIMANYU | EMPIRE LEADERBOARD

${table}

**Total warriors:** ${totalWarriors}
**Empire Status:** ${empireStatus}

---
🎵 *flow time* · *GitEmpire v1.0*`;

    await postComment(comment);
    console.log('[abhimanyu] Leaderboard posted.');
    return;
  }

  // mode === 'map'
  const svg = generateSVG(empire);

  // Write SVG as a committed file
  fs.writeFileSync(path.join(process.cwd(), 'empire-map.svg'), svg, 'utf8');

  // Update empire.json
  empire.battle_svg = 'empire-map.svg';
  empire.signals.last_svg_update = new Date().toISOString();
  writeEmpire(empire);

  const warriorCount = Object.keys(empire.players).length;
  const activeWarCount = (empire.wars || []).filter((w) => w.status === 'active').length;
  const topEntry = Object.entries(empire.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems)[0];
  const empireStatus = topEntry
    ? `@${topEntry[0].replace(/^@/, '')} leads (${topEntry[1].vibe_gems} gems, ${topEntry[1].acres} acres)`
    : 'no warriors yet';

  const [owner] = (process.env.GITHUB_REPOSITORY || 'charan-s108/GitEmpire').split('/');
  const dashboardUrl = `https://${owner}.github.io/GitEmpire/`;

  const comment = `## ⚔️ ABHIMANYU | EMPIRE MAP UPDATED

\`\`\`
 * . * . *
. * . * .
 * . * . *
\`\`\`

**Warriors mapped:** ${warriorCount} · **Active wars:** ${activeWarCount}
**Empire Status:** ${empireStatus}

🗺 [View live empire map →](${dashboardUrl})

---
🎵 *flow time* · *GitEmpire v1.0*`;

  await postComment(comment);
  console.log('[abhimanyu] Empire map generated and posted.');
}

main().catch((err) => {
  console.error('[abhimanyu] Error:', err.message);
  process.exit(1);
});
