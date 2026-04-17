#!/usr/bin/env node
'use strict';

const { execSync } = require('child_process');
const path = require('path');

const AGENTS = [
  { dir: '.',                    name: 'arjuna    (root)' },
  { dir: 'agents/bhima',        name: 'bhima' },
  { dir: 'agents/karna',        name: 'karna' },
  { dir: 'agents/drona',        name: 'drona' },
  { dir: 'agents/ashwathama',   name: 'ashwathama' },
  { dir: 'agents/abhimanyu',    name: 'abhimanyu' },
  { dir: 'agents/veda',         name: 'veda' },
];

const GREEN  = '\x1b[32m';
const RED    = '\x1b[31m';
const CYAN   = '\x1b[36m';
const DIM    = '\x1b[2m';
const BOLD   = '\x1b[1m';
const RESET  = '\x1b[0m';

const results = [];

process.stdout.write(`\n${BOLD}${CYAN}⚔️  GitEmpire — Agent Validation${RESET}\n`);
process.stdout.write(`${DIM}${'─'.repeat(44)}${RESET}\n`);

for (const agent of AGENTS) {
  try {
    execSync(`gitagent validate ${agent.dir}`, {
      stdio: 'pipe',
      cwd: path.resolve(__dirname, '..'),
    });
    process.stdout.write(`  ${GREEN}✓${RESET}  ${agent.name.padEnd(22)}${DIM}valid${RESET}\n`);
    results.push({ ok: true, name: agent.name });
  } catch (err) {
    const msg = (err.stderr || err.stdout || '').toString().split('\n').find(l => l.includes('✗') || l.includes('error') || l.includes('Error')) || 'failed';
    process.stdout.write(`  ${RED}✗${RESET}  ${agent.name.padEnd(22)}${RED}${msg.trim()}${RESET}\n`);
    results.push({ ok: false, name: agent.name, msg });
  }
}

const passed = results.filter(r => r.ok).length;
const total  = results.length;
const allOk  = passed === total;

process.stdout.write(`${DIM}${'─'.repeat(44)}${RESET}\n`);

if (allOk) {
  process.stdout.write(`\n  ${GREEN}${BOLD}${passed}/${total} agents valid${RESET} ${GREEN}✓ all clear${RESET}\n\n`);
} else {
  const failed = results.filter(r => !r.ok).map(r => r.name.trim());
  process.stdout.write(`\n  ${RED}${BOLD}${passed}/${total} passed${RESET} — failed: ${failed.join(', ')}\n\n`);
  process.exit(1);
}
