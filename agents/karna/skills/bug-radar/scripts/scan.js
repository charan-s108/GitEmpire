#!/usr/bin/env node
'use strict';

/**
 * Karna — bug-radar / scan
 * Scans a file for common bug patterns, classifies severity, awards gem bounties.
 *
 * Usage: node scan.js <filepath> <invoker_username>
 * Env:   GITHUB_TOKEN, GITHUB_REPOSITORY, GITHUB_ISSUE_NUMBER
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// ── ANSI rainbow ──────────────────────────────────────────────────────────────

const ANSI = {
  red:     '\x1b[31m',
  redBold: '\x1b[1;31m',
  yellow:  '\x1b[33m',
  green:   '\x1b[32m',
  cyan:    '\x1b[36m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
  bold:    '\x1b[1m',
  reset:   '\x1b[0m',
};

const SEVERITY_COLOR = {
  CRITICAL: ANSI.redBold,
  HIGH:     ANSI.red,
  MEDIUM:   ANSI.yellow,
  LOW:      ANSI.cyan,
  INFO:     ANSI.green,
};

const SEVERITY_GEMS = {
  CRITICAL: 200,
  HIGH:     150,
  MEDIUM:   100,
  LOW:       50,
  INFO:      10,
};

const SEVERITY_EMOJI = {
  CRITICAL: '🔴',
  HIGH:     '🟠',
  MEDIUM:   '🟡',
  LOW:      '🔵',
  INFO:     '⚪',
};

// ── Bug pattern catalogue ─────────────────────────────────────────────────────

const PATTERNS = [
  // JavaScript / TypeScript
  {
    severity: 'CRITICAL',
    pattern: /\.then\s*\([^)]*\)(?!\s*\.catch)/g,
    desc: 'Promise `.then()` without `.catch()` — unhandled rejection',
    lang: ['js', 'ts', 'mjs', 'cjs'],
  },
  {
    severity: 'CRITICAL',
    pattern: /eval\s*\(/g,
    desc: '`eval()` call — remote code execution risk',
    lang: ['js', 'ts'],
  },
  {
    severity: 'CRITICAL',
    pattern: /child_process\.exec\s*\(\s*`[^`]*\$\{/g,
    desc: 'Command injection via template literal in `child_process.exec`',
    lang: ['js', 'ts'],
  },
  {
    severity: 'HIGH',
    pattern: /==\s*null(?!\s*\|\|)/g,
    desc: 'Loose `== null` check — may miss `undefined`',
    lang: ['js', 'ts'],
  },
  {
    severity: 'HIGH',
    pattern: /JSON\.parse\s*\([^)]*\)(?!\s*catch|\s*\/\/\s*safe)/g,
    desc: '`JSON.parse()` without try/catch — throws on malformed input',
    lang: ['js', 'ts'],
  },
  {
    severity: 'HIGH',
    pattern: /for\s*\(\s*(?:var|let|const)\s+\w+\s*=\s*0\s*;\s*\w+\s*<=\s*\w+\.length/g,
    desc: 'Off-by-one: loop condition uses `<=` with `.length`',
    lang: ['js', 'ts'],
  },
  {
    severity: 'MEDIUM',
    pattern: /var\s+/g,
    desc: '`var` declaration — function-scoped, prefer `const`/`let`',
    lang: ['js', 'ts'],
  },
  {
    severity: 'MEDIUM',
    pattern: /console\.(log|debug|info)\s*\([^)]*(?:password|token|secret|key|auth)/gi,
    desc: 'Possible credential leak via `console.log`',
    lang: ['js', 'ts'],
  },
  {
    severity: 'MEDIUM',
    pattern: /setTimeout\s*\(\s*(?:"|')/g,
    desc: '`setTimeout` with string argument — implicit `eval`',
    lang: ['js', 'ts'],
  },
  {
    severity: 'LOW',
    pattern: /\/\/\s*TODO|\/\/\s*FIXME|\/\/\s*HACK/gi,
    desc: 'Unresolved TODO/FIXME/HACK comment',
    lang: ['js', 'ts', 'py', 'go', 'java', 'rb'],
  },
  {
    severity: 'LOW',
    pattern: /debugger\s*;/g,
    desc: '`debugger` statement left in code',
    lang: ['js', 'ts'],
  },
  // Python
  {
    severity: 'CRITICAL',
    pattern: /os\.system\s*\(\s*f['"]/g,
    desc: 'Command injection via f-string in `os.system`',
    lang: ['py'],
  },
  {
    severity: 'HIGH',
    pattern: /except\s*:/g,
    desc: 'Bare `except:` clause — swallows all exceptions including `SystemExit`',
    lang: ['py'],
  },
  {
    severity: 'MEDIUM',
    pattern: /print\s*\([^)]*(?:password|token|secret)/gi,
    desc: 'Possible credential leak via `print`',
    lang: ['py'],
  },
  // Generic
  {
    severity: 'INFO',
    pattern: /0\.0\.0\.0|127\.0\.0\.1/g,
    desc: 'Hardcoded localhost/wildcard IP address',
    lang: ['js', 'ts', 'py', 'go', 'java', 'yaml', 'yml'],
  },
  {
    severity: 'HIGH',
    pattern: /(?:password|secret|api_key|apikey)\s*=\s*['"][^'"]{4,}['"]/gi,
    desc: 'Hardcoded credential or API key',
    lang: ['js', 'ts', 'py', 'go', 'java', 'rb', 'yaml', 'yml'],
  },
];

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
    console.log('[karna] No GitHub env — printing comment to stdout:\n', body);
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
        'User-Agent': 'GitEmpire-Karna/1.0',
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

// ── Scanner ───────────────────────────────────────────────────────────────────

function detectLanguage(filePath) {
  const ext = path.extname(filePath).replace('.', '').toLowerCase();
  return ext || 'unknown';
}

function scanFile(filePath, lang) {
  const src = fs.readFileSync(filePath, 'utf8');
  const lines = src.split('\n');
  const findings = [];

  for (const rule of PATTERNS) {
    if (rule.lang && !rule.lang.includes(lang)) continue;

    // Reset lastIndex for global patterns
    rule.pattern.lastIndex = 0;

    let match;
    while ((match = rule.pattern.exec(src)) !== null) {
      // Find line number
      const lineNum = src.slice(0, match.index).split('\n').length;
      const lineContent = lines[lineNum - 1]?.trim() ?? '';

      findings.push({
        severity: rule.severity,
        line: lineNum,
        match: match[0].slice(0, 60),
        desc: rule.desc,
        lineContent: lineContent.slice(0, 80),
      });

      // Prevent infinite loops on zero-width matches
      if (match.index === rule.pattern.lastIndex) rule.pattern.lastIndex++;
    }
  }

  // Deduplicate by (severity, line, desc)
  const seen = new Set();
  return findings.filter((f) => {
    const key = `${f.severity}:${f.line}:${f.desc}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => {
    const order = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'];
    return order.indexOf(a.severity) - order.indexOf(b.severity);
  });
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const filePath = process.argv[2];
  const invoker  = (process.argv[3] || '').replace(/^@/, '').trim();

  if (!filePath) {
    console.error('[karna] Usage: node scan.js <filepath> <invoker_username>');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`[karna] File not found: ${filePath}`);
    process.exit(1);
  }

  const lang = detectLanguage(filePath);

  console.log(`\n${ANSI.bold}${ANSI.cyan}⚡ KARNA BUG RADAR — scanning ${filePath}${ANSI.reset}\n`);

  const findings = scanFile(filePath, lang);

  if (findings.length === 0) {
    console.log(`${ANSI.green}✓ No bugs detected. The dharma code is clean.${ANSI.reset}\n`);
    const comment = `## ⚔️ KARNA | SCAN COMPLETE — CLEAN

**File:** \`${filePath}\`
**Findings:** 0 bugs detected ✓

The dharma code is clean. No bounty awarded.

---
🎵 *flow time* · *GitEmpire v1.0*`;
    await postComment(comment);
    return;
  }

  // Print ANSI output to CI logs
  for (const f of findings) {
    const color = SEVERITY_COLOR[f.severity] || ANSI.reset;
    console.log(`${color}[${f.severity}]${ANSI.reset} line ${f.line}: ${f.desc}`);
    console.log(`  ${ANSI.magenta}${f.lineContent}${ANSI.reset}`);
  }
  console.log('');

  // Calculate bounty
  const totalGems = findings.reduce((sum, f) => sum + SEVERITY_GEMS[f.severity], 0);

  // Update empire.json
  const empire = readEmpire();
  if (invoker && empire.players[`@${invoker}`]) {
    empire.players[`@${invoker}`].vibe_gems += totalGems;
    empire.players[`@${invoker}`].last_active = new Date().toISOString();
    empire.signals.karna_scanning = false;
    writeEmpire(empire);
  } else {
    console.warn(`[karna] @${invoker} not registered — gems not awarded. Run /vibe-join first.`);
  }

  // Build findings table for GitHub comment
  const tableRows = findings
    .map((f) => `| ${SEVERITY_EMOJI[f.severity]} ${f.severity} | ${f.line} | ${f.desc} |`)
    .join('\n');

  const topPlayer = Object.entries(empire.players)
    .sort(([, a], [, b]) => b.vibe_gems - a.vibe_gems)[0];
  const empireStatus = topPlayer
    ? `${topPlayer[0]} (${topPlayer[1].vibe_gems} gems, ${topPlayer[1].acres} acres)`
    : 'no warriors yet';

  const comment = `## ⚔️ KARNA | BUG SCAN COMPLETE

**File:** \`${filePath}\`
**Findings:** ${findings.length} bug${findings.length !== 1 ? 's' : ''} detected

| Severity | Line | Description |
|----------|------|-------------|
${tableRows}

**Bounty awarded:** ${totalGems} vibe-gems → @${invoker}
**Empire Status:** ${empireStatus}

---
🎵 *flow time* · *GitEmpire v1.0*`;

  await postComment(comment);
  console.log(`[karna] @${invoker}: +${totalGems} gems for ${findings.length} finding(s) in ${filePath}`);
}

main().catch((err) => {
  console.error('[karna] Error:', err.message);
  process.exit(1);
});
