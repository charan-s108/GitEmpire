<div align="center">

# ⚔️ GitEmpire

### *Six Mahabharata warriors. One guru. One codebase. Infinite dharma.*

PRs become land. Bugs become bounties. Every commit echoes through the ages.

<br/>

[![gitagent spec](https://img.shields.io/badge/gitagent-v0.1.0%20compliant-00d4ff?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTV6TTIgMTdsOCA0IDgtNE0yIDEybDggNCA4LTQiLz48L3N2Zz4=)](https://github.com/open-gitagent/gitagent)
[![clawless](https://img.shields.io/badge/ClawLess-WebContainer%20compatible-ff6600?style=for-the-badge&logo=webassembly&logoColor=white)](https://github.com/open-gitagent/clawless)
[![gitclaw](https://img.shields.io/badge/gitclaw-v1.3.3-00ff88?style=for-the-badge)](https://github.com/open-gitagent/gitclaw)
[![validation](https://img.shields.io/badge/gitagent%20validate-7%2F7%20%E2%9C%93-00ff88?style=for-the-badge)](#validation)
[![license](https://img.shields.io/badge/license-MIT-ff0066?style=for-the-badge)](LICENSE)
[![hackathon](https://img.shields.io/badge/GitAgent%20Hackathon-2026-ff6600?style=for-the-badge)](https://github.com/open-gitagent/gitagent)

<br/>

> *"The battlefield is the codebase. The war is the PR. The dharma is the diff."*

</div>

---

## 🎬 Demo

<!-- ═══════════════════════════════════════════════════════════════════════
     DEMO VIDEO
     Replace this block with your screen recording once captured.

     Recommended: record `npm run demo` in your terminal (shows all 8 steps
     + the rainbow ANSI scanner + the neon SVG preview opening in browser).

     Embed options:
       • GitHub-hosted MP4:  <video src="assets/demo.mp4" controls width="100%"/>
       • YouTube:            [![Demo](assets/thumbnail.png)](https://youtu.be/YOUR_ID)
       • GIF (< 10 MB):      ![Demo](assets/demo.gif)
       Drop your video file into assets/ — it's already in the repo.
     ════════════════════════════════════════════════════════════════════════ -->

<div align="center">

> 📹 **Demo video coming soon** — record with `npm run demo` and drop it here.
>
> *(replace this block with `<video src="assets/demo.mp4" controls width="100%"/>` or a YouTube embed)*

</div>

---

## 🗺️ Architecture

![Architecture](./assets/architecture.png)

<br/>

**Data flow:** GitHub event → Arjuna routes → warrior script runs → `empire.json` updated atomically → GitHub comment posted.

**One rule above all:** `empire.json` is read once, modified in memory, written once. No partial writes. No race conditions.

---

## 🏹 The Warriors

<table>
<thead>
<tr>
<th>Warrior</th>
<th>Archetype</th>
<th>Skill</th>
<th>Trigger</th>
<th>Soul</th>
</tr>
</thead>
<tbody>
<tr>
<td><strong>Arjuna</strong></td>
<td>Commander</td>
<td><code>route-command</code></td>
<td>All <code>/vibe*</code> events</td>
<td><em>"I do not fight every battle. I route the right warrior to the right war."</em></td>
</tr>
<tr>
<td><strong>Bhima</strong> 🌊</td>
<td>Recruiter</td>
<td><code>vibe-join</code></td>
<td><code>/vibe-join @user</code></td>
<td><em>"I am the largest warrior and the softest welcome."</em></td>
</tr>
<tr>
<td><strong>Karna</strong> ⚡</td>
<td>Bug Scout</td>
<td><code>bug-radar</code></td>
<td><code>/vibe-scout &lt;file&gt;</code></td>
<td><em>"Every bug is a trap in the chakravyuha of code."</em></td>
</tr>
<tr>
<td><strong>Drona</strong> ✨</td>
<td>Land Master</td>
<td><code>land-survey</code></td>
<td>PR merged · <code>/claim-vibe #N</code></td>
<td><em>"Land is not given — it is earned through lines that breathe."</em></td>
</tr>
<tr>
<td><strong>Ashwathama</strong> 🌙</td>
<td>Treasurer</td>
<td><code>gem-vault</code></td>
<td><code>/vibe-trade Ngems @user</code></td>
<td><em>"The gems remember every commit. The war chest does not forget."</em></td>
</tr>
<tr>
<td><strong>Abhimanyu</strong> 🌟</td>
<td>Strategist</td>
<td><code>battle-svg</code></td>
<td><code>/vibe-map</code> · <code>/leaderboard</code></td>
<td><em>"I entered the formation. I drew the map. I lit the neon grid."</em></td>
</tr>
<tr>
<td><strong>Veda</strong> 📚</td>
<td>Guru · Knowledge Validator</td>
<td><code>dharma-guide</code></td>
<td><code>/vibe-guide</code></td>
<td><em>"Knowledge is the only territory that expands when shared."</em></td>
</tr>
</tbody>
</table>

---

## 🚀 Quickstart

### Prerequisites

- Node.js ≥ 18
- A Groq API key — [get one free](https://console.groq.com)
- (For live mode) A GitHub repo with Actions enabled

### Install

```bash
git clone https://github.com/charan-s108/GitEmpire
cd GitEmpire
npm install
cp .env.example .env        # then fill in GROQ_API_KEY
```

### Validate the spec

```bash
npm run validate
```

```
⚔️  GitEmpire — Agent Validation
────────────────────────────────────────────
  ✓  arjuna    (root)      valid
  ✓  bhima                 valid
  ✓  karna                 valid
  ✓  drona                 valid
  ✓  ashwathama            valid
  ✓  abhimanyu             valid
  ✓  veda                  valid
────────────────────────────────────────────

  7/7 agents valid ✓ all clear
```

---

## 🧪 Local Verification

Run the full warrior chain on your machine before touching GitHub. No API key needed.

```bash
npm run demo
```

This single command runs **9 verification steps** in sequence:

| Step | What it tests | Pass condition |
|------|--------------|----------------|
| 1 | `gitagent validate` on all 7 agents | 7/7 green, 0 warnings |
| 2 | Bhima registers 3 warriors + rejects duplicate | Duplicate skipped; badge assigned on join; `first_blood` quest auto-completed |
| 3 | Drona claims 3 PRs with different complexity factors | Formula correct; `prs_merged` incremented; duplicate PR blocked |
| 4 | Karna scans a file — rainbow ANSI to terminal | Findings reported; `bugs_found` incremented; badge recomputed |
| 5 | Ashwathama executes transfer + rejects overdraft + rejects self-transfer | Balances correct; weekly/monthly gems updated; both rejections clean |
| 6 | Abhimanyu generates all 3 leaderboard modes + SVG map | alltime/weekly/monthly all print; `empire-map.svg` written to disk |
| 6b | Quest system — start, list, completion via scan | `war_chest` active for alice; `bug_scout` completed for charan via scan; all players have `quest_progress` |
| 7 | SVG preview HTML generated | `empire-preview.html` openable in browser |
| 8 | Final state table printed with badges + quest fields | Ranked correctly; all players have badge + prs_merged + quest_progress fields |

**After `npm run demo` completes:**

```bash
# Preview the neon SVG empire map in your browser:
open empire-preview.html          # macOS
xdg-open empire-preview.html      # Linux
start empire-preview.html         # Windows
```

You should see a dark `#0d1117` canvas with glowing hex cells, player names, gem counts, and the neon legend — exactly what gets embedded in GitHub comments.

### Manual script testing

If you want to test individual warriors in isolation:

```bash
# Bhima — register a player
node agents/bhima/skills/vibe-join/scripts/join.js "@yourname"

# Karna — scan any file for bugs (rainbow ANSI output)
node agents/karna/skills/bug-radar/scripts/scan.js <filepath> <your-username>

# Drona — claim a PR (PR#, author, lines+, lines-, has_tests)
node agents/drona/skills/land-survey/scripts/claim.js 42 yourname 180 30 true

# Ashwathama — transfer gems
node agents/ashwathama/skills/gem-vault/scripts/trade.js sender 50 @receiver

# Abhimanyu — generate map or leaderboard
node agents/abhimanyu/skills/battle-svg/scripts/mapgen.js map
node agents/abhimanyu/skills/battle-svg/scripts/mapgen.js leaderboard
node agents/abhimanyu/skills/battle-svg/scripts/mapgen.js leaderboard weekly
node agents/abhimanyu/skills/battle-svg/scripts/mapgen.js leaderboard monthly

# Abhimanyu — quest log (read-only)
node agents/abhimanyu/skills/battle-svg/scripts/quest-list.js "@yourname"

# Bhima — start a quest
node agents/bhima/skills/vibe-join/scripts/quest-start.js "@yourname" "bug_scout"

# Setup quest issues on GitHub (one-shot, requires live token)
GITHUB_TOKEN=... GITHUB_REPOSITORY=charan-s108/GitEmpire node scripts/create-quest-issues.js
```

All scripts print the full GitHub comment they *would* post to stdout when `GITHUB_TOKEN` is not set — so you can review every output before going live.

### Inspect empire state

```bash
cat empire.json | python3 -m json.tool   # pretty-print
# or
node -e "const e=require('./empire.json'); console.table(Object.entries(e.players).map(([n,p])=>({name:n,gems:p.vibe_gems,acres:p.acres})))"
```

### Reset between runs

```bash
npm run demo -- --reset     # wipe empire.json then run full demo
```

---

## ⚙️ Live GitHub Setup

### 1. Create the repository

Push this repo to GitHub, then in **Settings → Topics** add:
```
gitagent-hackathon-2026
```

### 2. Add secrets

| Secret | Where to get it |
|--------|----------------|
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |
| `GITHUB_TOKEN` | Auto-injected by Actions — nothing to add |

**Settings → Secrets and variables → Actions → New repository secret**

### 3. Fire the first command

Open any Issue and post:
```
/vibe-join @yourname
```

The `GitEmpire Warriors` workflow triggers within seconds. Bhima posts a reply:

```
## ⚔️ BHIMA | WARRIOR REGISTERED

**Welcome:** @yourname has entered the empire 🌊
**Starter gems:** 100 vibe-gems deposited to war chest
**Badge earned:** ⚔️ Sainik (सैनिक)
**Next: 🏹 Veer — earn 400 more gems OR merge 5 more PRs**
**Empire Status:** 1 warriors strong · top warrior: @yourname (100 gems, 0 acres)

---
🎵 flow time · GitEmpire v1.0
```

### 4. The full command set

| Post this comment | What happens |
|-------------------|-------------|
| `/vibe-join @user` | Bhima registers the warrior, awards 100 gems, shows badge + next-tier hint, auto-completes **First Blood** quest |
| `/vibe-scout src/auth.js` | Karna scans the file, posts findings table, awards bounty gems, recomputes badge, checks quest completion |
| `/claim-vibe #42` | Drona calculates gems + acres for PR #42, increments prs_merged, recomputes badge, checks quest completion |
| `/vibe-trade 50gems @bob` | Ashwathama transfers 50 gems, recomputes badge for both parties, checks gem-total quests |
| `/vibe-map` | Abhimanyu writes `empire-map.svg`, commits it, posts link to live dashboard |
| `/leaderboard` | Abhimanyu posts all-time top-10 rankings table |
| `/leaderboard weekly` | Abhimanyu posts this week's gem leaders |
| `/leaderboard monthly` | Abhimanyu posts this month's gem leaders |
| `/vibe-quest list` | Abhimanyu shows your full quest log — status (✓/◌/—/🔒), reward, difficulty, next recommendation |
| `/vibe-quest start <id>` | Bhima starts a quest (enforces badge tier requirement, max 3 active at once) |
| `/vibe-guide` | Veda shows current state, next best step, one contextual hint, and quest/badge path recommendation |

PR merged with tests? **Drona triggers automatically** — no command needed.

---

## 🏅 Badge Progression

Every warrior earns a **Mahabharata title** based on their contributions. Badges gate which issues you can claim and show on the live map.

| Badge | Sanskrit | Requirement | Quest Access |
|-------|----------|-------------|-------------|
| 📖 **Shishya** | शिष्य | Just joined | `quest:shishya` — docs, typos |
| ⚔️ **Sainik** | सैनिक | 100+ gems **or** 1 merged PR | `quest:sainik` — beginner code |
| 🏹 **Veer** | वीर | 500+ gems **or** 5 merged PRs | `quest:veer` — intermediate |
| 🛡️ **Kshatriya** | क्षत्रिय | 1500+ gems **or** 15 merged PRs | `quest:kshatriya` — advanced |
| 🔱 **Maharathi** | महारथी | 5000+ gems **or** 30 merged PRs | `quest:maharathi` — expert |
| ⚡ **Atirathi** | अतिरथी | 10+ critical bugs found (Karna) | All — highest rank |

Badges are computed automatically after every action (join, PR merge, bug scan, gem trade). Upgrades are announced in the warrior's GitHub comment with a celebration block:

```
**🎉 BADGE UPGRADE — 🏹 VEER (वीर) 🎉**
> *Courage confirmed. The empire sees your glow.*
> **Tier:** 2 of 5
```

The live dashboard also fires a **celebration toast** (bottom-right slide-up) when it detects a badge change on the next 30-second refresh.

---

## ⚔️ Quest System

Every warrior has a structured path through 8 quests — from joining to finding 10 critical bugs.

| Quest | Trigger | Badge Required | Reward |
|-------|---------|---------------|--------|
| **First Blood** | Join the empire | Any | Auto-completes on `/vibe-join` |
| **Land Grab** | Merge your first PR | Any | +50 gems |
| **Test Dharma** | Merge a PR with test files | Any | +75 gems |
| **Bug Scout** | Find a bug with `/vibe-scout` | Any | +60 gems |
| **War Chest** | Accumulate 500 total gems | ⚔️ Sainik | +100 gems |
| **Veer Surge** | Merge 5 total PRs | ⚔️ Sainik | +150 gems |
| **Karna's Eye** | Find 1 CRITICAL severity bug | 🏹 Veer | +200 gems |
| **Atirathi's Path** | Find 10 CRITICAL severity bugs | 🛡️ Kshatriya | +500 gems |

Quest rules:
- **Max 3 active at once** — choose wisely
- **First Blood** auto-starts and auto-completes on join — no command needed
- All others require `/vibe-quest start <id>`
- Quest completion is **automatic** — triggered by the relevant warrior action
- Badge-gated quests post a soft notice if your tier is too low (gems still awarded)

```
# See your quest log
/vibe-quest list

# Start a quest
/vibe-quest start war_chest
```

---

## 🗺️ Live Empire Dashboard

The empire map is more than a static image — it's a live, interactive dashboard served via **GitHub Pages**.

**URL:** `https://charan-s108.github.io/GitEmpire/`

| Feature | Details |
|---------|---------|
| Live map | Neon hex grid with badge icons, gem counts, glow filters, war animations |
| Clickable territories | Click any hex → modal with full player stats, PR history, badge journey, badge progression track, quest log |
| Quest board tab | ⚔️ Quests tab shows all 8 quests: badge required, gem reward, description, and clickable warrior chips (✓ done / ◌ active) |
| Badge celebration toast | Slide-up toast fires bottom-right when a badge upgrade is detected on refresh |
| Leaderboard tabs | Toggle between All-time / Monthly / Weekly / Quests with one click |
| Auto-refresh | Fetches latest `empire.json` every 30 seconds — no page reload needed |
| Works offline | Everything renders client-side from one JSON file |

**Setup:** Repo Settings → Pages → Source: `main` branch, `/docs` folder.

**Weekly / Monthly resets** happen automatically via GitHub Actions cron:
- Every **Monday midnight UTC** — `weekly_gems` resets to 0
- Every **1st of the month UTC** — `monthly_gems` resets to 0
- Manual trigger: Actions → GitEmpire Warriors → Run workflow → `reset_scope: weekly` or `monthly`

---

## 🌐 ClawLess — Run in the Browser

GitEmpire is fully compatible with [ClawLess](https://github.com/open-gitagent/clawless) — the serverless browser runtime for Claw Agents powered by WebContainers (WASM). Run all 7 warriors entirely in the browser with no server required.

### Why it's compatible

| Requirement | Status |
|-------------|--------|
| GitAgent v0.1.0 spec compliant | ✅ 7/7 agents pass `gitagent validate` |
| Zero native Node.js addons | ✅ Pure JS only — `gitclaw`, `clawcontainer`, `@open-gitagent/gitagent` |
| Dynamic file paths via `process.cwd()` | ✅ All scripts — no hardcoded absolute paths |
| No `child_process` in agent scripts | ✅ Only in local `demo.js` (dev tool, not agent runtime) |
| Node.js ≥ 18 | ✅ WebContainer runs Node.js 18 |
| Model format — colon separator | ✅ All `agent.yaml` use `groq:llama-3.3-70b-versatile` |
| `clawcontainer` in dependencies | ✅ `^1.1.0` in `package.json` |

### Quick start (browser)

```typescript
import { ClawContainer } from 'clawcontainer';

const cc = new ClawContainer('#app', {
  template: 'gitclaw',
  env: {
    GROQ_API_KEY: 'gsk_...',           // from https://console.groq.com
    GITHUB_TOKEN: 'ghp_...',           // for live GitHub comment posting
    // CLAWLESS_MODEL: 'claude-sonnet-4-20250514'  // optional: override model
  }
});

await cc.start();
cc.on('ready', () => console.log('GitEmpire warriors ready!'));
```

### What works in ClawLess

- ✅ All 7 warrior scripts (`join.js`, `scan.js`, `claim.js`, `trade.js`, `mapgen.js`, `quest-list.js`, `guide.js`)
- ✅ `npm run validate` — spec validation in the browser
- ✅ `npm run dev` — `gitclaw run --coordinator arjuna --recursive`
- ✅ `empire.json` read/write via WebContainer virtual filesystem
- ✅ HTTPS calls to GROQ API and GitHub API (intercepted by ClawLess network layer)
- ⚠️ `npm run demo` — uses `child_process.execSync`, which requires WebContainer process support

---

## 💎 The Economy

### Vibe-Gem Formula

```
gems = max(10,  lines_changed  ×  (has_tests ? 3 : 1)  ×  complexity_factor)
```

| `complexity_factor` | Condition |
|---------------------|-----------|
| `2.0` | Net lines negative — dead code removed or major refactor |
| `1.5` | Function/class count reduced in diff |
| `1.0` | Neutral change (default) |
| `0.5` | >200 lines added with no test files |

**Floor:** 10 gems minimum per merged PR — shipping always pays.

### Bug Bounty Scale (Karna)

| Severity | Gems | Detected patterns |
|----------|------|------------------|
| 🔴 CRITICAL | 200 | `eval()`, command injection, unhandled promise rejections |
| 🟠 HIGH | 150 | `JSON.parse` without try/catch, off-by-one with `.length`, hardcoded secrets |
| 🟡 MEDIUM | 100 | `var` declarations, possible credential leaks via `console.log` |
| 🔵 LOW | 50 | TODO/FIXME/HACK comments, `debugger` statements |
| ⚪ INFO | 10 | Hardcoded IP addresses |

### Glow-Acres Formula

```
acres = floor(lines_changed / 50)   // 1 acre per 50 lines touched
```

---

## 🎨 Neon SVG Spec

Abhimanyu's empire map uses **only** these eight colors:

```javascript
const COLORS = {
  bg:      '#0d1117',   // GitHub dark canvas
  grid:    '#1a2332',   // subtle grid lines
  players: ['#00ff88',  // matrix green   — rank 1
            '#ff0066',  // hot pink        — rank 2
            '#00d4ff',  // cyber cyan      — rank 3
            '#ffaa00',  // amber           — rank 4+
            ...],
  neutral: '#7700ff',   // deep purple    — unclaimed territory
  war:     '#ff6600',   // fire orange    — active war fronts
  text:    '#e6edf3',   // GitHub text
  accent:  '#00d4ff',   // highlight
};
```

Every territory polygon carries:
```css
filter: drop-shadow(0 0 6px <color>)   /* neon glow — no exceptions */
```

Active war fronts animate:
```css
@keyframes warPulse {
  0%   { stroke-dashoffset: 0;   opacity: 1;   }
  50%  {                         opacity: 0.6; }
  100% { stroke-dashoffset: -24; opacity: 1;   }
}
.war-border { animation: warPulse 1.4s linear infinite; }
```

---

## 📐 Spec Compliance

GitEmpire is built on **GitAgent v0.1.0** — the git-native agent specification.

| Requirement | Status |
|-------------|--------|
| `agent.yaml` with `spec_version`, `name`, `version`, `description` | ✅ All 7 agents |
| `SOUL.md` identity file per agent | ✅ All 7 agents |
| `SKILL.md` with valid YAML frontmatter per skill | ✅ All 7 skills |
| `agents:` as object keyed by agent name (not array) | ✅ Confirmed by AJV |
| `skills:` as array of kebab-case strings | ✅ Confirmed by AJV |
| `gitagent-hackathon-2026` tag in every `agent.yaml` | ✅ All 7 agents |
| `gitagent validate` passes with 0 warnings | ✅ `npm run validate` — 7/7 green |
| ClawLess compatibility (pure Node.js, no native addons) | ✅ Zero native addons — WebContainer-safe |
| ClawLess model format — colon separator in `agent.yaml` | ✅ All 7 agents use `groq:model-name` (gitclaw v1.3.3 runtime requirement) |
| `clawcontainer` in `package.json` dependencies | ✅ `^1.1.0` |
| No `child_process` in agent execution paths | ✅ Only in local `demo.js` dev tool |
| `RULES.md` + `DUTIES.md` per agent (SOD policy) | ✅ Root + all 6 warriors |
| Single atomic `empire.json` write pattern | ✅ All scripts — Veda is read-only (never writes) |

---

## 🏗️ Repository Structure

```
GitEmpire/
├── agent.yaml                    ← Arjuna (root coordinator)
├── SOUL.md                       ← Arjuna identity
├── RULES.md                      ← System-wide gem/acres formulas
├── DUTIES.md                     ← Root SOD policy + conflict matrix
├── AGENTS.md                     ← Fallback reference for non-gitagent tools
├── empire.json                   ← Shared atomic state (players, badges, gems, wars)
├── empire-map.svg                ← Committed neon map (updated by /vibe-map)
├── package.json                  ← scripts: start, validate, dev, demo
├── .env.example
│
├── docs/
│   └── index.html                ← GitHub Pages live dashboard (interactive map + leaderboard)
│
├── assets/                       ← demo video + architecture diagram (drop files here)
│
├── scripts/
│   ├── demo.js                   ← local verification: 9-step full chain (incl. quest system)
│   ├── badge.js                  ← shared badge utility (computeBadge, applyBadge, buildBadgeLine)
│   ├── quests.js                 ← 8-quest catalog, checkQuestCompletion(), nextQuestHint()
│   ├── create-quest-issues.js    ← one-shot setup: 13 labels + 8 quest GitHub issues
│   └── reset-leaderboard.js      ← weekly/monthly gem reset (called by cron workflow)
│
├── skills/
│   └── route-command/SKILL.md    ← Command parsing + routing table
│
├── agents/
│   ├── bhima/                    ← Recruiter
│   │   ├── agent.yaml · SOUL.md · RULES.md · DUTIES.md
│   │   └── skills/vibe-join/
│   │       ├── SKILL.md
│   │       └── scripts/
│   │           ├── join.js       ← register player, first_blood quest, badge on join
│   │           └── quest-start.js ← /vibe-quest start <id> (tier gate, 3-quest cap)
│   │
│   ├── karna/                    ← Bug Scout
│   │   ├── agent.yaml · SOUL.md · RULES.md · DUTIES.md
│   │   └── skills/bug-radar/
│   │       ├── SKILL.md
│   │       └── scripts/scan.js   ← 15 bug patterns, rainbow ANSI, badge recompute
│   │
│   ├── drona/                    ← Land Master
│   │   ├── agent.yaml · SOUL.md · RULES.md · DUTIES.md
│   │   └── skills/land-survey/
│   │       ├── SKILL.md
│   │       └── scripts/claim.js  ← gem formula, acres, prs_merged++, badge recompute
│   │
│   ├── ashwathama/               ← Treasurer
│   │   ├── agent.yaml · SOUL.md · RULES.md · DUTIES.md
│   │   └── skills/gem-vault/
│   │       ├── SKILL.md
│   │       └── scripts/trade.js  ← transfer, overdraft guard, badge recompute both parties
│   │
│   ├── abhimanyu/                ← Strategist
│   │   ├── agent.yaml · SOUL.md · RULES.md · DUTIES.md
│   │   └── skills/battle-svg/
│   │       ├── SKILL.md
│   │       └── scripts/
│   │           ├── mapgen.js     ← neon hex SVG, badge icons, 3-mode leaderboard
│   │           └── quest-list.js ← /vibe-quest list (read-only, full status table)
│   └── veda/                     ← Guru of Beginners (read-only)
│       ├── agent.yaml · SOUL.md · RULES.md · DUTIES.md
│       └── skills/dharma-guide/
│           ├── SKILL.md
│           └── scripts/
│               └── guide.js      ← /vibe-guide (read-only: badge progress + next step + quest hint)
│
└── .github/
    └── workflows/
        └── gitempire.yml         ← per-step routing + auto-claim + cron resets
```

---

## 🔧 npm Scripts

| Command | What it does |
|---------|-------------|
| `npm start` | `gitclaw run --coordinator arjuna --recursive` (used by ClawLess / play.clawless.io) |
| `npm run validate` | Validate all 7 agents — prints clean `7/7 agents valid ✓ all clear` |
| `npm run demo` | Full 9-step local verification chain (warriors + quests + Veda) |
| `npm run demo -- --reset` | Reset empire.json then run full demo |
| `npm run dev` | Same as `npm start` — gitclaw interactive mode |

---

## 🛠️ Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Agent spec | [GitAgent v0.1.0](https://github.com/open-gitagent/gitagent) | The hackathon target spec |
| Runtime | [gitclaw v1.3.3](https://github.com/open-gitagent/gitclaw) | Git-native agent executor |
| Browser runtime | [ClawLess / clawcontainer ^1.1.0](https://github.com/open-gitagent/clawless) | Serverless WebContainer sandbox — run agents in the browser |
| CI/CD | GitHub Actions | Free, event-driven, native to git |
| LLM | `groq:llama-3.3-70b-versatile` | Fast inference, generous free tier |
| Language | Node.js ≥ 18 | Zero native addons — pure JS, WebContainer-safe |
| State | `empire.json` | One file, atomic writes, git-tracked |
| No Python · No databases · No paid infra beyond Groq |

---

<div align="center">

## 🎵 *lofi hiphop · ancient dharma · vibe coding*

**GitEmpire v1.0** · Built for the **GitAgent Hackathon 2026** · by [@charan-s108](https://github.com/charan-s108)

*"The battlefield is the codebase. The war is the PR. The dharma is the diff."*

[![gitagent-hackathon-2026](https://img.shields.io/badge/tag-gitagent--hackathon--2026-ff6600?style=flat-square)](https://github.com/topics/gitagent-hackathon-2026)

</div>
