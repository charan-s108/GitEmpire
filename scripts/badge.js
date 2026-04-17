'use strict';

/**
 * GitEmpire — Badge computation utility
 * Shared by all warrior scripts. Pure function, no I/O.
 *
 * Mahabharata badge tiers (ascending):
 *   shishya   → शिष्य  — Devoted student      (just joined)
 *   sainik    → सैनिक  — Foot soldier          (100+ gems OR 1+ PR)
 *   veer      → वीर    — Brave warrior         (500+ gems OR 5+ PRs)
 *   kshatriya → क्षत्रिय — Noble warrior class (1500+ gems OR 15+ PRs)
 *   maharathi → महारथी — Great chariot warrior (5000+ gems OR 30+ PRs)
 *   atirathi  → अतिरथी — Matchless hero        (special: 10+ critical bugs)
 */

const BADGE_META = {
  shishya:   { label: 'Shishya',   sanskrit: 'शिष्य',     emoji: '📖', tier: 0 },
  sainik:    { label: 'Sainik',    sanskrit: 'सैनिक',     emoji: '⚔️',  tier: 1 },
  veer:      { label: 'Veer',      sanskrit: 'वीर',       emoji: '🏹',  tier: 2 },
  kshatriya: { label: 'Kshatriya', sanskrit: 'क्षत्रिय',  emoji: '🛡️',  tier: 3 },
  maharathi: { label: 'Maharathi', sanskrit: 'महारथी',    emoji: '🔱',  tier: 4 },
  atirathi:  { label: 'Atirathi',  sanskrit: 'अतिरथी',    emoji: '⚡',  tier: 5 },
};

/**
 * Compute the correct badge for a player object.
 * Reads: vibe_gems, prs_merged, critical_bugs_found
 * Returns: badge key string
 */
function computeBadge(player) {
  const gems = player.vibe_gems || 0;
  const prs  = player.prs_merged || 0;
  const crit = player.critical_bugs_found || 0;

  if (crit >= 10)                return 'atirathi';
  if (gems >= 5000 || prs >= 30) return 'maharathi';
  if (gems >= 1500 || prs >= 15) return 'kshatriya';
  if (gems >= 500  || prs >= 5)  return 'veer';
  if (gems >= 100  || prs >= 1)  return 'sainik';
  return 'shishya';
}

/**
 * Apply badge recomputation to a player object in-place.
 * Records a badge_history entry if the badge changed.
 * Returns true if the badge was upgraded.
 */
function applyBadge(player) {
  const newBadge = computeBadge(player);
  const oldBadge = player.badge || 'shishya';

  if (newBadge !== oldBadge) {
    if (!player.badge_history) player.badge_history = [];
    player.badge_history.push({ badge: newBadge, earned_at: new Date().toISOString() });
    player.badge = newBadge;
    return true;
  }
  return false;
}

/**
 * Format badge for display in GitHub comments.
 * e.g. "⚔️ Sainik (सैनिक)"
 */
function formatBadge(badgeKey) {
  const m = BADGE_META[badgeKey] || BADGE_META.shishya;
  return `${m.emoji} ${m.label} (${m.sanskrit})`;
}

/**
 * Returns the next badge above the current one, or null if already at max.
 */
function nextBadge(badgeKey) {
  const current = BADGE_META[badgeKey] || BADGE_META.shishya;
  const next = Object.entries(BADGE_META).find(([, m]) => m.tier === current.tier + 1);
  return next ? next[0] : null;
}

/**
 * Returns a hint string about what the player needs to reach the next badge.
 */
function nextBadgeHint(player) {
  const badge = player.badge || 'shishya';
  const next = nextBadge(badge);
  if (!next) return 'You have reached the highest rank — Atirathi. ⚡';

  const thresholds = {
    sainik:    { gems: 100,  prs: 1  },
    veer:      { gems: 500,  prs: 5  },
    kshatriya: { gems: 1500, prs: 15 },
    maharathi: { gems: 5000, prs: 30 },
    atirathi:  { crit: 10 },
  };

  const t = thresholds[next];
  if (t.crit) return `Find ${t.crit - (player.critical_bugs_found || 0)} more critical bugs to become Atirathi ⚡`;

  const gemsNeeded = Math.max(0, t.gems - (player.vibe_gems || 0));
  const prsNeeded  = Math.max(0, t.prs  - (player.prs_merged  || 0));
  const meta = BADGE_META[next];

  if (gemsNeeded === 0 || prsNeeded === 0) return `Next: ${meta.emoji} ${meta.label} — nearly there!`;
  return `Next: ${meta.emoji} ${meta.label} — earn ${gemsNeeded} more gems OR merge ${prsNeeded} more PRs`;
}

/**
 * Builds the badge line for a warrior GitHub comment.
 * When upgraded: returns a multi-line celebration block.
 * When not upgraded: returns a single "**Badge:** ..." line.
 */
function buildBadgeLine(player, upgraded) {
  if (!upgraded) return `**Badge:** ${formatBadge(player.badge)}`;

  const m = BADGE_META[player.badge] || BADGE_META.shishya;
  const RANK_FLAVOR = {
    sainik:    'You have taken your first step as a warrior. The empire grows stronger.',
    veer:      'Courage confirmed. The battlefield remembers the brave.',
    kshatriya: 'You have earned nobility. Your code carries honor.',
    maharathi: 'Great chariot warrior — you drive the formation forward.',
    atirathi:  'MATCHLESS. You stand where no arrow can reach you. ⚡',
  };
  const flavor = RANK_FLAVOR[player.badge] || 'The empire recognizes your rise.';
  return `**🎉 BADGE UPGRADE — ${m.emoji} ${m.label.toUpperCase()} (${m.sanskrit}) 🎉**\n> *${flavor}*\n> **Tier:** ${m.tier} of 5`;
}

module.exports = { computeBadge, applyBadge, formatBadge, nextBadgeHint, buildBadgeLine, BADGE_META };
