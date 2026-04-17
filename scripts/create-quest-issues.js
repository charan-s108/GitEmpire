#!/usr/bin/env node
'use strict';

/**
 * GitEmpire — Create Quest Issues
 * One-shot setup script: creates 8 GitHub issues with quest:* labels,
 * badge requirements, difficulty, rewards, and step-by-step hints.
 *
 * Usage:
 *   GITHUB_TOKEN=gsk_... GITHUB_REPOSITORY=owner/repo node scripts/create-quest-issues.js
 *
 * Run once per repo. Subsequent runs will create duplicate issues if not skipped manually.
 */

const https = require('https');
const path  = require('path');
const { QUESTS } = require('./quests');
const { BADGE_META } = require('./badge');

const BADGE_ORDER = ['shishya', 'sainik', 'veer', 'kshatriya', 'maharathi', 'atirathi'];

// ── GitHub API helpers ────────────────────────────────────────────────────────

function httpsRequest(options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Issue body builder ────────────────────────────────────────────────────────

function buildIssueBody(quest) {
  const reqKey  = BADGE_ORDER[quest.badge_tier_required];
  const reqMeta = BADGE_META[reqKey];
  const rewardText = quest.gem_reward > 0
    ? `**${quest.gem_reward} vibe-gems**${quest.badge_tier_reward !== null ? ' + badge unlock' : ''}`
    : 'Empire recognition (starter quest — 100 starter gems awarded on join)';

  const steps = buildSteps(quest);

  return `## ⚔️ Quest: ${quest.name}

**Difficulty:** ${quest.difficulty}
**Badge Required:** ${reqMeta.emoji} ${reqMeta.label} (${reqMeta.sanskrit}) or higher
**Reward:** ${rewardText}
**Quest ID:** \`${quest.id}\`

---

### Description

${quest.description}

### How to Complete

${quest.hint}

### Steps

${steps}

### Quest System

1. Start this quest: \`/vibe-quest start ${quest.id}\`
2. Complete the required action (see steps above)
3. The quest completes **automatically** — the relevant warrior posts confirmation

> If you open a PR that closes this issue (via "Closes #N" in the PR body),
> Drona will check your badge tier and note any tier mismatch.

---

**Labels:** \`quest\` · \`quest:${quest.id}\` · \`${quest.difficulty.toLowerCase()}\`

*Part of the [GitEmpire](https://github.com/charan-s108/GitEmpire) quest system — Phase 6*`;
}

function buildSteps(quest) {
  const common = '1. Make sure you are registered: `/vibe-join @yourname` in any issue comment';
  switch (quest.trigger) {
    case 'join':
      return `${common}\n2. That's it — this quest completes automatically when you join`;
    case 'pr_claimed':
      if (quest.target === 1) {
        return `${common}\n2. Create a branch and make any code change\n3. Open a Pull Request targeting \`main\`\n4. Merge the PR — Drona auto-claims it within ~30 seconds`;
      }
      return `${common}\n2. Merge ${quest.target} PRs total (Drona auto-claims each one)\n3. The quest completes automatically when your \`prs_merged\` counter reaches ${quest.target}`;
    case 'pr_with_tests':
      return `${common}\n2. Create a branch with code changes\n3. Add at least one test file (\`.test.js\`, \`.spec.ts\`, or \`_test.\` pattern)\n4. Open and merge the PR — Drona detects test files automatically`;
    case 'bug_found':
      return `${common}\n2. Pick any JavaScript or Python file in the repo\n3. Post \`/vibe-scout path/to/file.js\` as a comment on any issue\n4. If Karna finds at least one bug, the quest completes`;
    case 'gem_total':
      return `${common}\n2. Earn vibe-gems through PRs, bug scans, and gem trades\n3. The quest completes automatically when your total reaches ${quest.target} gems`;
    case 'critical_bug':
      if (quest.target === 1) {
        return `${common}\n2. Run \`/vibe-scout\` on files that use \`eval()\`, template literals in \`exec\`, or unhandled \`.then()\` chains\n3. If Karna finds a CRITICAL severity bug, the quest completes`;
      }
      return `${common}\n2. Accumulate ${quest.target} CRITICAL severity bug findings across any number of \`/vibe-scout\` runs\n3. The quest completes automatically at ${quest.target} critical bugs`;
    default:
      return common;
  }
}

// ── Ensure labels exist ───────────────────────────────────────────────────────

async function ensureLabel(owner, repo, token, name, color, description) {
  const res = await httpsRequest({
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/labels`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'GitEmpire-Setup/1.0',
      Accept: 'application/vnd.github+json',
    },
  }, JSON.stringify({ name, color, description }));

  if (res.status === 201) {
    console.log(`  ✓ Created label: ${name}`);
  } else if (res.status === 422) {
    console.log(`  · Label already exists: ${name}`);
  } else {
    console.warn(`  ! Label ${name}: status ${res.status}`);
  }
}

// ── Create a single issue ─────────────────────────────────────────────────────

async function createIssue(owner, repo, token, quest) {
  const labels = ['quest', `quest:${quest.id}`, quest.difficulty.toLowerCase()];
  const body   = buildIssueBody(quest);

  const res = await httpsRequest({
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/issues`,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'GitEmpire-Setup/1.0',
      Accept: 'application/vnd.github+json',
    },
  }, JSON.stringify({
    title: `⚔️ Quest: ${quest.name} [${quest.difficulty}]`,
    body,
    labels,
  }));

  if (res.status === 201) {
    console.log(`  ✓ Created issue #${res.body.number}: ${quest.name}`);
    return res.body.number;
  } else {
    console.error(`  ✗ Failed to create issue for ${quest.name}: ${res.status}`, res.body?.message || '');
    return null;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repoFull = process.env.GITHUB_REPOSITORY;

  if (!token || !repoFull) {
    console.error('[create-quest-issues] Set GITHUB_TOKEN and GITHUB_REPOSITORY env vars');
    console.error('  Example: GITHUB_TOKEN=gsk_... GITHUB_REPOSITORY=owner/repo node scripts/create-quest-issues.js');
    process.exit(1);
  }

  const [owner, repo] = repoFull.split('/');
  console.log(`\n⚔️  GitEmpire Quest Issue Creator`);
  console.log(`   Repository: ${repoFull}\n`);

  // Create required labels first
  console.log('Creating labels...');
  const labelDefs = [
    { name: 'quest',         color: '7700ff', description: 'GitEmpire quest system' },
    { name: 'quest:first_blood',   color: '00ff88', description: 'Quest: First Blood' },
    { name: 'quest:land_grab',     color: '00ff88', description: 'Quest: Land Grab' },
    { name: 'quest:test_dharma',   color: '00ff88', description: 'Quest: Test Dharma' },
    { name: 'quest:bug_scout',     color: '00ff88', description: 'Quest: Bug Scout' },
    { name: 'quest:war_chest',     color: '00d4ff', description: 'Quest: War Chest' },
    { name: 'quest:veer_surge',    color: '00d4ff', description: 'Quest: Veer Surge' },
    { name: 'quest:karna_eye',     color: 'ffaa00', description: "Quest: Karna's Eye" },
    { name: 'quest:atirathi_path', color: 'ff0066', description: "Quest: Atirathi's Path" },
    { name: 'beginner',     color: '00ff88', description: 'Beginner difficulty' },
    { name: 'intermediate', color: '00d4ff', description: 'Intermediate difficulty' },
    { name: 'advanced',     color: 'ffaa00', description: 'Advanced difficulty' },
    { name: 'legendary',    color: 'ff0066', description: 'Legendary difficulty' },
  ];

  for (const label of labelDefs) {
    await ensureLabel(owner, repo, token, label.name, label.color, label.description);
    await sleep(200);
  }

  // Create quest issues
  console.log('\nCreating quest issues...');
  const created = [];
  for (const quest of Object.values(QUESTS)) {
    const issueNum = await createIssue(owner, repo, token, quest);
    if (issueNum) created.push({ quest: quest.name, issue: issueNum });
    await sleep(600); // stay well under GitHub's secondary rate limit
  }

  console.log(`\n✓ Done — ${created.length}/${Object.keys(QUESTS).length} quest issues created`);
  console.log('\nNext steps:');
  console.log('  1. Pin the "First Blood" issue to your repo (Issues → ⋯ → Pin issue)');
  console.log('  2. Add "war camp" label or milestone to group quest issues');
  console.log('  3. Update README with a "Quests" section linking to the issue list');
  console.log('  4. Contributors can now run `/vibe-quest start <id>` to begin\n');
}

main().catch(err => {
  console.error('[create-quest-issues] Fatal:', err.message);
  process.exit(1);
});
