#!/usr/bin/env node
'use strict';

/**
 * GitEmpire — Create Quest Issues
 * One-shot setup script: creates 8 GitHub issues with quest labels and
 * badge requirement labels so contributors can filter quests by tier.
 *
 * Quest completion is FULLY AUTOMATIC — tracked in empire.json via
 * slash commands (/vibe-join, /vibe-scout, /vibe-quest start, etc.).
 * These issues are a reference board, not a completion mechanism.
 *
 * Usage:
 *   GITHUB_TOKEN=gsk_... GITHUB_REPOSITORY=owner/repo node scripts/create-quest-issues.js
 *
 * Run once per repo. No duplicate protection on issues — do not run twice.
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
    ? `**${quest.gem_reward} vibe-gems** (bonus on completion)`
    : 'Empire recognition + **100 starter gems** awarded automatically on join';

  const steps = buildSteps(quest);

  return `## ⚔️ Quest: ${quest.name}

**Difficulty:** ${quest.difficulty}
**Badge Required to start:** ${reqMeta.emoji} ${reqMeta.label} (${reqMeta.sanskrit}) or higher
**Reward:** ${rewardText}
**Quest ID:** \`${quest.id}\`

---

### What This Quest Is

${quest.description}

### How to Complete

${quest.hint}

### Steps

${steps}

### How the Quest System Works

- **Start a quest:** Post \`/vibe-quest start ${quest.id}\` as a comment on any issue
- **Complete automatically:** The relevant warrior script detects your action and awards the bonus gems — no manual confirmation needed
- **Check your progress:** Post \`/vibe-quest list\` to see all quest statuses, or open the live dashboard at https://charan-s108.github.io/GitEmpire/ (⚔️ Quests tab)
- **Max 3 active quests** at once — complete one before starting another

> This issue is a reference board. Quest completion is tracked in \`empire.json\` via GitHub Actions — not by closing this issue.

---

*Part of the [GitEmpire](https://github.com/charan-s108/GitEmpire) quest system · Powered by Mahabharata warriors as recursive AI agents*`;
}

function buildSteps(quest) {
  const register = '1. Register if you haven\'t yet: post `/vibe-join @yourname` in any issue comment';
  switch (quest.trigger) {
    case 'join':
      return `${register}\n2. That's it — **First Blood completes automatically the moment you join**`;

    case 'pr_claimed':
      if (quest.target === 1) {
        return [
          register,
          '2. Start the quest: `/vibe-quest start land_grab`',
          '3. Create a branch, make any code change, open a PR targeting `main`',
          '4. Merge the PR — Drona auto-triggers within ~30 seconds and awards gems',
          '5. Quest completion is posted as a comment on the PR',
        ].join('\n');
      }
      return [
        register,
        `2. Start the quest: \`/vibe-quest start ${quest.id}\``,
        `3. Merge PRs — Drona auto-claims every merged PR`,
        `4. Quest completes automatically when your \`prs_merged\` counter reaches ${quest.target}`,
      ].join('\n');

    case 'pr_with_tests':
      return [
        register,
        '2. Start the quest: `/vibe-quest start test_dharma`',
        '3. Create a branch with code changes',
        '4. Add at least one test file (`.test.js`, `.spec.ts`, or `_test.` naming pattern)',
        '5. Open and merge the PR — Drona detects test files automatically and completes the quest',
      ].join('\n');

    case 'bug_found':
      return [
        register,
        '2. Start the quest: `/vibe-quest start bug_scout`',
        '3. Pick any JavaScript or Python file in the repo',
        '4. Post `/vibe-scout path/to/file.js` as a comment on any issue',
        '5. Karna scans it — if at least one bug is found, the quest completes and bonus gems are awarded',
      ].join('\n');

    case 'gem_total':
      return [
        register,
        `2. Start the quest: \`/vibe-quest start ${quest.id}\``,
        '3. Earn vibe-gems through any combination of:',
        '   - Merging PRs (Drona awards based on lines changed × complexity × test bonus)',
        '   - Bug scans with Karna (`/vibe-scout path/to/file.js`)',
        '   - Receiving gem trades from other warriors (`/vibe-trade <N>gems @you`)',
        `4. Quest completes automatically when your total reaches ${quest.target} gems`,
      ].join('\n');

    case 'critical_bug':
      if (quest.target === 1) {
        return [
          register,
          '2. Start the quest: `/vibe-quest start karna_eye`',
          '3. Scan files that are likely to contain CRITICAL bugs — good targets:',
          '   - Files using `eval()` or `new Function()`',
          '   - Files with template literals passed to `child_process.exec`',
          '   - Files with `.then()` chains that have no `.catch()`',
          '4. Post `/vibe-scout path/to/file.js` — if Karna finds a CRITICAL severity bug, the quest completes',
        ].join('\n');
      }
      return [
        register,
        `2. Start the quest: \`/vibe-quest start ${quest.id}\``,
        `3. Run \`/vibe-scout\` on multiple files — each CRITICAL finding counts`,
        `4. Quest completes automatically at ${quest.target} total CRITICAL severity bugs across any scans`,
      ].join('\n');

    default:
      return register;
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
  const reqBadgeKey = BADGE_ORDER[quest.badge_tier_required];
  // Labels: quest category + specific quest + badge tier required
  const labels = ['quest', `quest:${quest.id}`, `badge:${reqBadgeKey}`];
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

  // Create labels: quest category + per-quest + badge tier required
  console.log('Creating labels...');
  const labelDefs = [
    // Quest system
    { name: 'quest',               color: '7700ff', description: 'GitEmpire quest system' },
    // Per-quest labels
    { name: 'quest:first_blood',   color: '00ff88', description: 'Quest: First Blood' },
    { name: 'quest:land_grab',     color: '00ff88', description: 'Quest: Land Grab' },
    { name: 'quest:test_dharma',   color: '00ff88', description: 'Quest: Test Dharma' },
    { name: 'quest:bug_scout',     color: '00ff88', description: 'Quest: Bug Scout' },
    { name: 'quest:war_chest',     color: '00d4ff', description: 'Quest: War Chest' },
    { name: 'quest:veer_surge',    color: '00d4ff', description: 'Quest: Veer Surge' },
    { name: 'quest:karna_eye',     color: 'ffaa00', description: "Quest: Karna's Eye" },
    { name: 'quest:atirathi_path', color: 'ff0066', description: "Quest: Atirathi's Path" },
    // Badge tier required — contributors can filter issues by their current badge
    { name: 'badge:shishya',   color: 'e8f5e9', description: 'Requires Shishya badge (any new warrior)' },
    { name: 'badge:sainik',    color: '00d4ff', description: 'Requires Sainik badge (100+ gems or 1+ PR)' },
    { name: 'badge:veer',      color: 'ffaa00', description: 'Requires Veer badge (500+ gems or 5+ PRs)' },
    { name: 'badge:kshatriya', color: 'ff0066', description: 'Requires Kshatriya badge (1500+ gems or 15+ PRs)' },
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
    await sleep(600); // stay under GitHub secondary rate limit
  }

  console.log(`\n✓ Done — ${created.length}/${Object.keys(QUESTS).length} quest issues created`);
  console.log('\nNext steps:');
  console.log('  1. Pin the "First Blood" issue to your repo (Issues → ⋯ → Pin issue)');
  console.log('  2. Share the live quest board with contributors:');
  console.log('     https://charan-s108.github.io/GitEmpire/ → ⚔️ Quests tab');
  console.log('  3. Contributors register with: /vibe-join @username (comment on any issue)');
  console.log('  4. Contributors start quests with: /vibe-quest start <id> (e.g. land_grab)\n');
}

main().catch(err => {
  console.error('[create-quest-issues] Fatal:', err.message);
  process.exit(1);
});
