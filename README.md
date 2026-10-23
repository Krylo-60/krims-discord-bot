# Krims Code AI 🤖 • Tactical Clan & Enterprise Bot Fleet (v5.5)

[![Version](https://img.shields.io/badge/Release-v5.5%20Fleet%20Architecture-00FFFF?logo=rocket&logoColor=white)](#)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14.14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![AI Engine](https://img.shields.io/badge/AI-Groq%20LPU%20%2B%20Gemini%202.5-00F2FF?logo=probot&logoColor=white)](#)
[![Hosting](https://img.shields.io/badge/Deploy-Render%20Cloud-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![Founder](https://img.shields.io/badge/Founder-krylo__plays-FFD700?logo=discord&logoColor=black)](#-leadership--ownership)
[![License](https://img.shields.io/badge/License-Proprietary%20%7C%20All%20Rights%20Reserved-FF0055.svg)](#-license)

**Krims Code AI** is an advanced, autonomous multi-bot Discord operations platform engineered by **Krylo** (`krylo_plays` / `KryloMCYT`) and **Krims Code Studio**. It powers competitive Minecraft SMP team headquarters (**The Half Life's**) and content studios (**Krylo's Skybase**) with dual-phase adaptive welcome cards, real-time Cloudflare SMP synchronization, persistent multi-turn conversational memory, automated Minecraft roster linking, and enterprise VIP intelligence.

---

## 🚀 The Krims Code Bot Fleet

The ecosystem runs as a coordinated fleet of specialized bot instances, each tailored for specific operational roles:

| Bot Instance | Client ID | Avatar Theme | Primary Role & Capabilities |
| :--- | :---: | :---: | :--- |
| **Krims Code AI** *(Master)* | `1523794466740371586` | 💎 Electric Cyan | Core community operations, 100 slash commands, leveling, moderation, tickets, and Minecraft database bridge. |
| **Krims Code Premium** *(VIP)* | `1562586215822266599` | 👑 Golden Amber | Dedicated 0ms Groq LPU compute, 120B/27B open-source intelligence, automatic 2x XP multiplier, full 100-command powerhouse suite + `/premium`, and real-time Elite SMP leaderboard sync. |
| **Krims Code Alpha** *(Experimental)* | `1562208078517243977` | 🔴 Electric Crimson | Tactical combat analytics, PvP telemetry, and experimental feature sandbox. |
| **Krims Code Beta** *(Experimental)* | `1562208157777133598` | 🟣 Quantum Amethyst | Development staging, rapid prototyping, and automated unit verification. |

---

## ⚡ Flagship Systems & Capabilities

### ⚔️ 1. Live Elite SMP Cloudflare Integration (`/elitesmp`)
Directly integrated with the official **Elite SMP** (`elitesmp.gg`) live Cloudflare Worker API:
* **Live Team Leaderboard:** Fetches real-time kills, treasuries, member counts, and clan stages directly from `elite-smp-leaderboard.smpcurios.workers.dev/leaderboard`.
  * Top Rivals: **VenomX** (#1, 182 kills, Top Player `ODYSSEAS12345`) and **Team_Rocket** (#2, 181 kills, Top Player `Jamkeju`, Treasury `$511k`).
  * Official Clan Ally: **BAT** (#6, Top Player `.acesbedoya`) — officially partnered with **The Half Life's**!
* **Cross-Play Connection Hub (`/elitesmp join`):** Live server addresses and port guides for Java (`elitesmp.gg:25565`) and Bedrock (`elitesmp.gg:19132`, prefix `.`, spaces as `_`).
* **In-Game Rules & Mechanics (`/elitesmp rules` & `/elitesmp wiki`):** Full guides on raiding permissions (100% legal), combat tagging (15s combat log instant death), grace periods, and weekly legendary kits.
* **Custom Spawner Crafting (`/elitesmp craftings`):** In-game recipes for Skeleton, Zombie, Spider, Cave Spider, and Magma Cube spawners.

---

### 🧠 2. Persistent AI Dialogue Memory Matrix (`features/aiMemoryEngine.mjs`)
Shared SQLite-backed dialogue memory giving both bots deep contextual awareness:
* **Multi-Turn Memory:** Bots remember the last 6+ messages exchanged in the channel. Follow-up queries (*"and who leads it?"* or *"what about them?"*) work naturally without re-explaining context.
* **Server Knowledge Seeding:** Automatically stores and recalls server facts, clan creeds, builder assignments, and alliance logs.
* **Grounded Leadership Recognition:**
  * **Team Leader:** `st1llkill3r` — Official Leader of The Half Life's clan in Elite SMP.
  * **Team Co-Leader & Supreme Owner:** `krylo_plays` (`KryloMCYT` / `1414143825538191373`) — Official Co-Leader of The Half Life's and Supreme Founder of Krims Code.
  * **Lead Builder & Redstone Engineer:** `CrazyCoolCam`
  * **Official Ally:** `BAT`
* **Supreme Founder Clearance:** Automatically salutes Krylo (`krylo_plays`) with 100% loyalty and recognizes his **Lifetime Founder License ($0.00 Free Forever)**.

---

### 💎 3. Krims Code Premium Architecture (`features/premiumManager.mjs`)
Engineered as an all-in-one VIP upgrade that includes **everything from the main bot** plus exclusive enterprise capabilities:
* **High-Speed Groq LPUs:** Runs on dedicated open-source models (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`, `llama-3.3-70b-versatile`) with 0ms queue wait times.
* **Automatic 2x VIP XP Multiplier:** All messages in servers with Krims Code Premium automatically award double XP for leveling and rank cards.
* **Full 100-Command Powerhouse Suite:** Supports all 100 master slash commands plus `/premium` and `/elitesmp`.
* **Full Prefix System (`!`):** Responds to `!help`, `!rank`, `!daily`, `!balance`, `!leaderboard`, `!elitesmp`, and `!premium` with Golden VIP Embeds.
* **Anti-Hallucination Directives:** Strictly grounded to real server databases, never inventing fictional clans or imaginary rivals.

---

### 🛡️ 4. The Half Life's Elite Clan Operations
* **Dual-Phase Adaptive Welcome Cards:**
  * **Phase 1 (Arrival):** Generates a custom Dark Cyber welcome card in `#👋・𝖶elcome` with member count and `⏳ PENDING MINECRAFT IGN`.
  * **Phase 2 (Roster Verified):** When an operative posts their IGN in `#📋・𝖱oster`, the bot **live-edits the original welcome message in real time**, attaching their 3D Minecraft skin head badge and updating their status to `✅ VERIFIED SMP ROSTER`.
* **Automatic Minecraft IGN Nickname Synchronization:** Parses IGNs from `#📋・𝖱oster` and syncs nicknames automatically.
* **Cosmetic Chat Color & Regional Roles:** Self-service reaction panels for 9 cosmetic colors and single-region assignment (NA, EU, Asia).
* **43 Custom Tactical Emojis & Stickers:** Tailor-made icons (`:team_halfheart:`, `:team_lambda:`, `:team_crest:`, `:team_mace:`, `:anim_team_radar:`).

---

### 🛡️ 5. Autonomous Security, Auto-Mod & Self-Healing
* **Zero-Crash Fault Isolation:** Catches unhandled rejections and runtime exceptions globally, keeping the fleet 100% online.
* **Automated AI Root-Cause Analysis:** Connects runtime stack traces to the multi-brain router to diagnose bugs and log recommended patches to `#📋・𝖲taff-logs`.
* **Anti-Raid & Server Security Guard:** Real-time invite link blocking, anti-flood protection (5+ messages in 3s), and profanity filtering.
* **Continuous Auto-Deploy:** Pulls updates from GitHub origin every 5 minutes and hot-restarts without downtime.

---

### 🎬 6. Skybase Video Production & Community Tools
* **Film Crew Auditions:** Staff controls (`/startcrewapp`, `/stopcrewapp`) with interactive Discord modal forms.
* **Custom Graphical Rank Cards:** Dynamic Jimp canvas rank cards rendered on the fly (`/rank`).
* **Top.gg Vote Multipliers:** Webhook listener awarding 2.0x XP bonuses and streak rewards.
* **Discord Activities Hub:** Instant launch links for YouTube Together, Poker Night, Chess, and Gartic Phone via `/activity`.

---

## 📋 Master Slash Command Directory (100 Commands)

| Module | Available Slash Commands |
| :--- | :--- |
| **🤖 AI & Diagnostics** | `/ask`, `/memory`, `/diagnose`, `/setupbot`, `/getbot`, `/about`, `/github`, `/translate`, `/ping`, `/uptime` |
| **💎 Premium & VIP** | `/premium`, `/elitesmp` |
| **🛡️ Moderation** | `/warn`, `/mute`, `/unmute`, `/kick`, `/ban`, `/purge`, `/lockdown`, `/unlock`, `/slowmode`, `/afk` |
| **📈 Leveling & Progression** | `/rank`, `/level`, `/leaderboard`, `/rewards`, `/quests`, `/clan` |
| **💰 Economy & Store** | `/balance`, `/daily`, `/pay`, `/store`, `/giveaway`, `/work`, `/counting`, `/slots`, `/spin`, `/jackpot` |
| **🏰 Clan & Warfare** | `/clan create`, `/clan info`, `/clan leaderboard`, `/bounty`, `/raid` |
| **⚔️ Games & Duels** | `/duel`, `/challenge`, `/endduel`, `/pvp`, `/tournament`, `/trade`, `/pet`, `/fish`, `/mine`, `/craft`, `/enchant`, `/heist`, `/rob`, `/lottery`, `/lootbox` |
| **📡 Community & Utilities** | `/help`, `/rules`, `/status`, `/ip`, `/announce`, `/poll`, `/suggest`, `/serverinfo`, `/userinfo`, `/avatar`, `/embed`, `/wiki`, `/ticket`, `/close`, `/activity`, `/gif`, `/coinflip`, `/roll`, `/eightball`, `/joke`, `/meme`, `/bday`, `/gameboost`, `/voice`, `/emojis` |
| **🟣 Twitch & Creator Tools** | `/verifytwitch`, `/supporters`, `/crew`, `/apply`, `/startstream`, `/stopstream`, `/link`, `/verify`, `/devlogs` |

---

## 💬 Prefix Command Quick-Reference (`!`)

All primary commands can be triggered with the standard `!` prefix across both bots:

```bash
!help            # Displays the Master Feature Suite and documentation
!premium         # Opens the VIP Architecture & perks dashboard
!elitesmp        # Displays live Elite SMP team rankings, rules, and connection IPs
!rank            # Renders your graphical level and XP rank card
!balance         # Checks your KryloCoins vault balance
!daily           # Claims your daily streak reward (with 2x VIP bonus)
!leaderboard     # Shows the top server chat and XP leaderboard
!clan            # Opens clan management and territory intel
!ping            # Tests bot gateway WebSocket latency
```

---

## 🏗️ Technical Stack & Infrastructure

* **Runtime:** Node.js v20+ (ES Modules) + Python 3 (Pillow graphical asset generator)
* **Libraries:** `discord.js` v14.14, `@discordjs/voice`, `@neondatabase/serverless`, `better-sqlite3`
* **Inference Engines:** Groq LPU (`openai/gpt-oss-120b`, `qwen/qwen3.8-27b`) + Google Gemini 2.5 Flash
* **Databases:**
  * SQLite (WAL Mode) — Local ultra-fast state, level cards, and AI dialogue memory.
  * Neon Serverless PostgreSQL — Cloud economy, clan inventories, and player portal sync.
  * FalixNodes MySQL — Direct in-game Minecraft plugin bridge.
* **Deployment:** Hosted 24/7 on [Render](https://render.com) Linux cloud containers with automated zero-downtime CI/CD.
  * Live Web Dashboard: [https://krims-discord-bot-d57m.onrender.com/](https://krims-discord-bot-d57m.onrender.com/)
  * Live Wiki Portal: [https://krims-discord-bot-d57m.onrender.com/wiki](https://krims-discord-bot-d57m.onrender.com/wiki)
  * Telemetry API: [https://krims-discord-bot-d57m.onrender.com/api/status](https://krims-discord-bot-d57m.onrender.com/api/status)

---

## 👑 Leadership & Ownership

* **Creator & Supreme Founder:** **Krylo** (`krylo_plays` / `KryloMCYT` / `st1llkill3r` — User ID: `1414143825538191373`)
* **The Half Life's Clan Leader:** `st1llkill3r`
* **The Half Life's Clan Co-Leader:** `krylo_plays`
* **Development Studio:** **Krims Code Studio**

---

## 📜 License

**Copyright © 2026 KryloMCYT & Krims Code Studio. All rights reserved.**

This software, its source code, visual cards, algorithms, and documentation are **strictly proprietary and confidential**. 

> [!CAUTION]
> **STRICTLY NO COPYING, FORKING, REDISTRIBUTION, OR REVERSE ENGINEERING.**
> No part of this software may be copied, reproduced, cloned, mirrored, sold, or distributed in any form without explicit, prior written permission from KryloMCYT.
