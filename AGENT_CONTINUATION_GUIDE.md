# 🚀 KryloSMP Discord Bot — Agent Continuation Guide

> [!CAUTION]
> ### 🛡️ ZERO SECRET LEAKAGE & STRICT SECURITY PROTOCOL (MANDATORY FOR ALL AGENTS)
> 1. **NEVER HARDCODE SECRETS:** Under NO circumstances should any API keys, database passwords, Discord bot tokens, webhook URLs, SSH keys, or server passwords be written directly into code, scripts, Markdown files, or git-tracked files.
> 2. **STRICT `.env` & PROCESS.ENV INJECTION:** All sensitive parameters MUST strictly be read from `process.env.<VAR_NAME>`. The `.env` file is in `.gitignore` and must NEVER be committed to Git or pushed to GitHub.
> 3. **NO COMMITTING UNENCRYPTED WEBHOOKS OR CREDENTIALS:** When writing new scripts or database connectors, always use `process.env.DATABASE_URL`, `process.env.DISCORD_TOKEN`, `process.env.FALIX_API_KEY`, etc.
> 4. **EVIDENCE LOG PRESERVATION:** The file `EVIDENCE_LOG_WEBHOOK_INCIDENT.md` is an immutable official evidence log and MUST be preserved at all times for police/cybercrime reporting.

## Overview
This document enables future Antigravity agents to seamlessly continue work on the KryloSMP Discord bot ecosystem. Read this FIRST before making any changes.

---

## 🏗️ Project Structure

### Main Bot Code
- **`C:\Users\naina\.gemini\antigravity\scratch\krims-discord-bot\index.js`** — Master bot file (~8,000 lines)
  - 65 registered slash commands (ALL have handlers — verified by audit)
  - Button interaction handlers (`start_verification`, `role_java`, `role_bedrock`, `role_announcements`, `role_giveaways`, `btn_check_status`, `btn_startserver_quick`, `trade_accept_*`, `trade_decline_*`, etc.)
  - Modal handlers (`modal_enter_verify_code`, `modal_start_verification`)
  - XP/Leveling system, Economy system, Clan system, PvP system
  - Auto-updater (checks GitHub every 5 minutes)
  - Express server on port 3000 for health checks

### Data Files
- `verifiedUsers.json` — Verified player records with 6-digit codes
- `clans.json` — Clan data (members, vaults, roles)
- `xp.json` — User XP and level data
- `jackpot.json` — Jackpot pool data
- `quests.json` — Daily quest tracking
- `.env` — `DISCORD_TOKEN`, `PTERODACTYL_API_KEY`, `PTERODACTYL_SERVER_ID`, `GITHUB_TOKEN`, `GEMINI_API_KEY`

### AI Engine (Gemini 3.5 Flash-Lite Upgrade)
- **Primary**: Direct `@google/genai` SDK → `gemini-3.5-flash-lite` model (if `GEMINI_API_KEY` set)
- **Fallback**: `@krishivpb60/krims-code-sdk` → `krims-code-chatbot.vercel.app` → Gemini backend
- **To activate**: Add `GEMINI_API_KEY=<your-key>` to `.env` (get free key from https://aistudio.google.com/apikey)
- The `/ask` command, ticket auto-reply, and DM auto-reply all use this dual-engine pattern

### Connected Services
- **Player Portal**: https://krylosmp.web.app/
- **KC Store** (NOT real money): https://krylosmp-store.web.app/
- **Minecraft Server**: krylosmp.falix.gg:29273 (Java 25565, Bedrock 19132)
- **Pterodactyl Panel**: https://panel.play.hosting/server/25a5d79a

---

## 🏰 Discord Servers (3 Guilds)

| Server | Guild ID | Purpose |
|:---|:---|:---|
| KryloSMP | `1524878881918685405` | Main SMP server (AutoMod active) |
| Krylo's Discord server | `1420991845546332162` | Original community server |
| Krylo Fan Army 👑 | `1532574925356007525` | Fan community server |

---

## ✅ Completed Work (All 5 Phases)

### Phase 1 — Foundation
- ✅ Channel topics set for ALL text channels (25+ per server)
- ✅ Smart slowmode (general 5s, memes 10s, suggestions 30s, clan-recruitment 60s)
- ✅ 11 premium hoisted roles created (Owner, Admin, Mod, Creator, VIP, Booster, Level 50/25/10, Newcomer, Verified)
- ✅ `#👋┃welcome` channel with Server IP embed + Verify/Portal/Store buttons
- ✅ 6 premium guide embeds (server-info, socials, clan-recruitment, pvp-chat, jackpot-vault, bounty-board)
- ✅ AutoMod rules: Anti-Mass Mention, Anti-Invite Links, Profanity Filter (KryloSMP only)

### Phase 2 — Engagement
- ✅ Self-role panel in `#✅┃verify` (Java, Bedrock, News, Giveaways buttons)
- ✅ `#❓┃faq-how-to-play` with 8 Q&A topics
- ✅ `#🎁┃giveaways` hub with guide embed
- ✅ Season 1 Re-Release patch notes in `#📢┃new-updates`
- ✅ `#🔢┃counting` channel
- ✅ `#💭┃question-of-the-day` channel
- ✅ AFK channel set (5 min timeout), system channel set
- ✅ Boost perks embed in `#🛒┃store`

### Phase 3 — Protection & Content
- ✅ `#⭐┃starboard` channel
- ✅ `#🤫┃confessions` channel
- ✅ `#📊┃levels-and-rewards` with XP guide embed
- ✅ `#🤝┃partnerships` with partnership program embed
- ✅ Verified-only permissions (19-27 channels locked per server)
- ✅ Additional voice channels (General, Gaming Squad 1/2, Music Lounge, AFK)
- ✅ Economy guide embed in `#🛒┃store`

### Phase 4 — Premium Features
- ✅ `#📋┃changelog` with documented updates
- ✅ `#🗺️┃world-info` with World Atlas (spawn, borders, nether hub)
- ✅ `#🟢┃server-status` with live status buttons
- ✅ `#🎬┃content-creators` showcase channel
- ✅ `#🎪┃events` hub channel

### Phase 5 — Final Polish
- ✅ `#👤┃introductions` with intro template
- ✅ Art posted in `#🎨┃art-and-builds`
- ✅ Complete 65-command reference (2 embeds) in `#🤖┃bot-commands`
- ✅ `#💡┃tips-and-tricks` with economy/PvP/clan tips
- ✅ Season 1 Re-Release announcement banner with buttons

### Store URL Fix
- ✅ All `tebex.io` references replaced with `krylosmp-store.web.app`
- ✅ 14 live Discord embeds updated across all 3 servers

---

## ⚠️ Known Issues to Fix

### 1. Interaction Crashes (CRITICAL)
The bot crashes with `10062: Unknown interaction` and `40060: Interaction already acknowledged` at these locations:
- **Line ~1891** — `start_verification` button reply
- **Line ~5013-5038** — Slash command replies (multiple commands)
- **Line ~5249** — Slash command replies

**Root Cause**: Multiple bot instances running simultaneously (EADDRINUSE port 3000), or interaction handling code that doesn't check `interaction.deferred || interaction.replied` before responding.

**Fix Pattern**: Every interaction handler MUST use this guard:
```javascript
try {
  if (interaction.deferred || interaction.replied) {
    await interaction.editReply({ ... });
  } else {
    await interaction.reply({ ..., flags: 64 });
  }
} catch (e) {
  if (e.code !== 10062 && e.code !== 40060) console.error(e);
}
```

### 2. Multiple Bot Instances
The bot often hits `EADDRINUSE` on port 3000 because old instances aren't killed. Before starting:
```bash
taskkill /F /IM node.exe  # Kill all Node processes first
node index.js
```

### 3. Starboard Not Automated
The `#⭐┃starboard` channel exists but has no automated star-reaction tracking in `index.js`. The bot should listen for `messageReactionAdd` events and auto-post messages with 3+ ⭐ reactions.

### 4. Counting Channel Not Enforced
The `#🔢┃counting` channel exists but has no enforcement logic in `index.js`. The bot should validate sequential counting and reset on errors.

---

## 🔧 Technical Notes

### Discord.js Version
Using discord.js v14 (about to deprecate `ready` → use `clientReady` in v15). Use `flags: 64` instead of `ephemeral: true`.

### Pterodactyl API
Requires standard browser `User-Agent` headers or Cloudflare blocks with 403. Use `deferReply()` before API calls (they take >3 seconds).

### User Preferences
- Category names: `╭━━━ 🔊 VOICE LOUNGES ━━━╮` style
- Channel names: `🤖┃bot-commands` style (emoji + pipe separator ┃)
- The server is in **Season 1 Re-Release**
- Store uses **KryloCoins (KC)**, NOT real money
- All channels MUST be inside categories

### Key Environment Variables
```
DISCORD_TOKEN=<bot token>
PTERODACTYL_API_KEY=<panel API key>
PTERODACTYL_SERVER_ID=25a5d79a
GITHUB_TOKEN=<for auto-updater>
```

---

## 📋 Suggested Next Tasks
1. **Fix all interaction crashes** — Wrap every `interaction.reply()` in try/catch with deferred/replied guards
2. **Automate starboard** — Add `messageReactionAdd` listener for ⭐ tracking
3. **Counting enforcement** — Add message listener for `#🔢┃counting` validation
4. **QOTD auto-poster** — Daily cron to post random questions
5. **Welcome DM** — Send a DM to new members on `guildMemberAdd`
6. **Auto-role** — Give `🌱 Newcomer` role to new members automatically
7. **Level-up notifications** — Post embed when user reaches Level 10/25/50
8. **Starboard** — Listen for ⭐ reactions and post to `#⭐┃starboard`
