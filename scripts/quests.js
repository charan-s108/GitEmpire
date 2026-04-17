#!/usr/bin/env node
'use strict';

/**
 * GitEmpire — Quest Catalog & Logic
 * Shared by all warrior scripts. Pure functions, no I/O.
 *
 * Quest triggers:
 *   join           — fired by join.js on new registration
 *   pr_claimed     — fired by claim.js on any merged PR
 *   pr_with_tests  — fired by claim.js when has_tests === true
 *   bug_found      — fired by scan.js when findings.length >= 1
 *   gem_total      — fired after any gem award to check cumulative total
 *   critical_bug   — fired by scan.js when CRITICAL findings found
 */

const path = require('path');
const { BADGE_META } = require(path.join(process.cwd(), 'scripts', 'badge'));

// ── Badge order for tier comparisons ─────────────────────────────────────────

const BADGE_ORDER = ['shishya', 'sainik', 'veer', 'kshatriya', 'maharathi', 'atirathi'];

function badgeTier(badgeKey) {
  const idx = BADGE_ORDER.indexOf(badgeKey);
  return idx >= 0 ? idx : 0;
}

// ── Quest catalog ─────────────────────────────────────────────────────────────

const QUESTS = {
  first_blood: {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Join the empire and ignite your war chest.',
    badge_tier_required: 0,
    badge_tier_reward: null,
    gem_reward: 0,           // the 100 starter gems from join.js ARE the reward
    trigger: 'join',
    target: 1,
    hint: 'Run `/vibe-join @yourname` in any issue comment to enter the empire.',
    difficulty: 'Beginner',
  },
  land_grab: {
    id: 'land_grab',
    name: 'Land Grab',
    description: 'Merge your first pull request and claim your first territory.',
    badge_tier_required: 0,
    badge_tier_reward: null,
    gem_reward: 50,
    trigger: 'pr_claimed',
    target: 1,              // prs_merged >= 1
    hint: 'Merge any PR — Drona auto-claims it within seconds.',
    difficulty: 'Beginner',
  },
  test_dharma: {
    id: 'test_dharma',
    name: 'Test Dharma',
    description: 'Merge a pull request that includes test files. Prove your code is righteous.',
    badge_tier_required: 0,
    badge_tier_reward: null,
    gem_reward: 75,
    trigger: 'pr_with_tests',
    target: 1,
    hint: 'Ensure your PR includes a `.test.js`, `.spec.ts`, or `_test.` file.',
    difficulty: 'Beginner',
  },
  bug_scout: {
    id: 'bug_scout',
    name: 'Bug Scout',
    description: 'Use `/vibe-scout` to scan a file and find at least one bug.',
    badge_tier_required: 0,
    badge_tier_reward: null,
    gem_reward: 60,
    trigger: 'bug_found',
    target: 1,              // findings.length >= 1
    hint: 'Run `/vibe-scout path/to/file.js` in any issue comment.',
    difficulty: 'Beginner',
  },
  war_chest: {
    id: 'war_chest',
    name: 'War Chest',
    description: "Accumulate 500 vibe-gems total — a warrior's first war fund.",
    badge_tier_required: 1,  // sainik
    badge_tier_reward: null,
    gem_reward: 100,
    trigger: 'gem_total',
    target: 500,             // vibe_gems >= 500
    hint: 'Keep contributing PRs and scanning bugs to grow your gem count to 500.',
    difficulty: 'Intermediate',
  },
  veer_surge: {
    id: 'veer_surge',
    name: 'Veer Surge',
    description: 'Merge 5 pull requests — prove sustained contribution.',
    badge_tier_required: 1,  // sainik
    badge_tier_reward: null,
    gem_reward: 150,
    trigger: 'pr_claimed',
    target: 5,               // prs_merged >= 5 cumulative
    hint: 'Merge 5 PRs total. Each auto-merge via Drona counts.',
    difficulty: 'Intermediate',
  },
  karna_eye: {
    id: 'karna_eye',
    name: "Karna's Eye",
    description: 'Find a CRITICAL severity bug — prove you see what others miss.',
    badge_tier_required: 2,  // veer
    badge_tier_reward: null,
    gem_reward: 200,
    trigger: 'critical_bug',
    target: 1,               // critical_bugs_found >= 1
    hint: 'Run `/vibe-scout` on JS files that use `eval`, template literals in exec, or unhandled promises.',
    difficulty: 'Advanced',
  },
  atirathi_path: {
    id: 'atirathi_path',
    name: "Atirathi's Path",
    description: 'Find 10 critical bugs across any number of scans. Become the matchless hero.',
    badge_tier_required: 3,  // kshatriya
    badge_tier_reward: 5,    // atirathi tier (badge auto-upgrades via computeBadge)
    gem_reward: 500,
    trigger: 'critical_bug',
    target: 10,              // critical_bugs_found >= 10
    hint: 'Accumulate 10 critical bug findings total. The Atirathi badge follows automatically.',
    difficulty: 'Legendary',
  },
};

// ── Quest completion logic ────────────────────────────────────────────────────

/**
 * Check if any quests complete based on the current action and player state.
 * Mutates player.quest_progress in memory only — NO I/O.
 * Guards against double-completion.
 * Returns array of quest objects that were newly completed this call.
 *
 * @param {object} player  — Player object (already mutated with new stats)
 * @param {string} action  — Trigger key (join | pr_claimed | pr_with_tests | bug_found | gem_total | critical_bug)
 * @param {object} data    — Context: { findings, has_tests, prs_merged, vibe_gems, critical_bugs_found }
 */
function checkQuestCompletion(player, action, data) {
  // Ensure fields exist (backward-compat with older player objects)
  if (!player.quest_progress) player.quest_progress = {};
  if (!player.active_quests)  player.active_quests  = [];

  const playerTier = badgeTier(player.badge || 'shishya');
  const completed  = [];
  const now        = new Date().toISOString();

  for (const quest of Object.values(QUESTS)) {
    // Must match action trigger
    if (quest.trigger !== action) continue;

    // Must be in active_quests (started)
    if (!player.active_quests.includes(quest.id)) continue;

    // Must not already be completed
    if (player.quest_progress[quest.id]?.status === 'completed') continue;

    // Player must meet badge tier requirement
    if (playerTier < quest.badge_tier_required) continue;

    // Evaluate completion condition per trigger type
    let done = false;
    switch (action) {
      case 'join':
        done = true;
        break;
      case 'pr_claimed':
        done = (player.prs_merged || 0) >= quest.target;
        break;
      case 'pr_with_tests':
        done = data.has_tests === true;
        break;
      case 'bug_found':
        done = (data.findings || 0) >= quest.target;
        break;
      case 'gem_total':
        done = (player.vibe_gems || 0) >= quest.target;
        break;
      case 'critical_bug':
        done = (player.critical_bugs_found || 0) >= quest.target;
        break;
    }

    if (!done) continue;

    // Award gems and record completion
    player.vibe_gems     = (player.vibe_gems     || 0) + quest.gem_reward;
    player.weekly_gems   = (player.weekly_gems   || 0) + quest.gem_reward;
    player.monthly_gems  = (player.monthly_gems  || 0) + quest.gem_reward;
    player.quest_progress[quest.id] = { status: 'completed', completed_at: now };

    // Remove from active_quests once complete
    player.active_quests = player.active_quests.filter(id => id !== quest.id);

    completed.push(quest);
  }

  return completed;
}

// ── Next quest hint ───────────────────────────────────────────────────────────

/**
 * Returns a hint string for the "Next Quest:" line in warrior comments.
 * Shows the most relevant quest that is either active or startable.
 */
function nextQuestHint(player) {
  if (!player.quest_progress) player.quest_progress = {};
  if (!player.active_quests)  player.active_quests  = [];

  const playerTier = badgeTier(player.badge || 'shishya');

  // 1. Find the first active quest that is in_progress
  for (const id of player.active_quests) {
    const q = QUESTS[id];
    if (!q) continue;
    if (player.quest_progress[id]?.status !== 'completed') {
      return `**${q.name}** — ${q.hint}`;
    }
  }

  // 2. Find the first quest that is startable (not started, not completed, badge met)
  for (const quest of Object.values(QUESTS)) {
    const prog = player.quest_progress[quest.id];
    if (prog?.status === 'completed') continue;
    if (player.active_quests.includes(quest.id)) continue;
    if (playerTier < quest.badge_tier_required) continue;
    return `Start **${quest.name}** — \`/vibe-quest start ${quest.id}\` — ${quest.hint}`;
  }

  // 3. All quests done or locked
  const allDone = Object.values(QUESTS).every(
    q => player.quest_progress[q.id]?.status === 'completed'
  );
  if (allDone) return 'All quests complete — you stand at the highest rank. ⚡';
  return 'Earn more gems or merge more PRs to unlock higher-tier quests.';
}

// ── Quest status helpers for quest-list.js ───────────────────────────────────

/**
 * Get the display status of a quest for a given player.
 * Returns: 'completed' | 'active' | 'available' | 'locked'
 */
function questStatus(player, questId) {
  if (!player.quest_progress) player.quest_progress = {};
  if (!player.active_quests)  player.active_quests  = [];

  const q = QUESTS[questId];
  if (!q) return 'locked';

  if (player.quest_progress[questId]?.status === 'completed') return 'completed';
  if (player.active_quests.includes(questId)) return 'active';

  const playerTier = badgeTier(player.badge || 'shishya');
  if (playerTier >= q.badge_tier_required) return 'available';
  return 'locked';
}

module.exports = { QUESTS, BADGE_ORDER, checkQuestCompletion, nextQuestHint, questStatus, badgeTier };
