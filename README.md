# Krims Code AI 🤖 • Tactical Clan & Community Bot (v5.3)

[![Version](https://img.shields.io/badge/Release-v5.3%20Enterprise-00FFFF?logo=rocket&logoColor=white)](#)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14.14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![AI Engine](https://img.shields.io/badge/AI-Krims%20Neural%20Brain-00F2FF?logo=probot&logoColor=white)](#)
[![Hosting](https://img.shields.io/badge/Deploy-Render%20Cloud-46E3B7?logo=render&logoColor=white)](https://render.com/)
[![License](https://img.shields.io/badge/License-Proprietary%20%7C%20All%20Rights%20Reserved-FF0055.svg)](#-license)

**Krims Code AI** is an advanced, autonomous Discord intelligence and server operations platform designed and developed by **KryloMCYT** and **Krims Code Studio**. It powers competitive SMP team headquarters (**The Half Life's**) and content creation studios (**Krylo's Skybase**) with dual-phase dynamic visual cards, autonomous AI self-healing, real-time message contextual awareness, automated Minecraft roster synchronization, and advanced autonomous moderation.

---

## ⚡ Flagship Systems & Capabilities

### 🛡️ 1. The Half Life's Elite Clan Operations
* **Dual-Phase Adaptive Welcome Cards:**
  * **Phase 1 (Arrival):** Generates a custom Dark Cyber / Neon Shield welcome card in `#👋・𝖶elcome` featuring the member's Discord avatar, electric cyan cyber halo, member count number (`MEMBER #005`), and `⏳ PENDING MINECRAFT IGN`.
  * **Phase 2 (Roster Verified):** When an operative posts their in-game name in `#📋・𝖱oster`, the bot **live-edits their original welcome message in real time**, attaching their official 3D Minecraft skin head badge, IGN, and updating their status to `✅ VERIFIED SMP ROSTER`.
* **Automatic Minecraft IGN Nickname Synchronization:** Automatically detects Minecraft IGNs posted in `#📋・𝖱oster` and syncs the member's server nickname while updating persistent AI memory.
* **Cosmetic Chat Color & Single-Region Engine:** Self-service emoji reaction panels allowing members to choose from 9 custom cosmetic colors with smart swapping, and single-region role enforcement (NA, EU, Asia).
* **Dedicated Clan Emoji & Sticker Arsenal:** 43 custom server emojis and animated GIFs (`:team_halfheart:`, `:team_lambda:`, `:team_crest:`, `:team_mace:`, `:anim_team_radar:`, `:anim_team_heart:`) built exclusively for tactical squad communications.

### 🧠 2. Autonomous AI Self-Healing & Crash Isolation
* **Zero-Crash Fault Tolerance:** Global runtime exception handlers catch unhandled rejections and runtime exceptions, isolating the failure to keep the bot 100% online.
* **Automated AI Root-Cause Analysis:** Connects runtime stack traces to the Krims neural multi-brain router to automatically diagnose bugs, determine root causes, and propose recommended patches.
* **Audit & Staff Logs:** Automatically dispatches bug diagnostics to `#📋・𝖲taff-logs` and records telemetry in SQLite `dev_audit_logs`.
* **Continuous Auto-Updater:** Checks GitHub origin every 5 minutes (`git fetch`), automatically pulling new code updates, installing dependencies, and hot-restarting without manual intervention.

### 📡 3. 30-Minute Situational Context Watcher
* **Scheduled Channel Scans:** Every 30 minutes, scans active conversations across `#💬・𝖳eam-chat`, `#📋・𝖱oster`, and announcements.
* **Conversational Memory Integration:** Feeds chat highlights and building/PvP plans directly into `server_ai_facts` and `server_ai_memory`.
* **Proactive & Fun Chat Banter:** Occasionally drops witty, motivating, and clan-themed comments into `#💬・𝖳eam-chat` to hype up builders, miners, and PvP combatants with built-in anti-spam rate limiting.
* **Manual Trigger:** On-demand instant scan available via `!forcescan`.

### 🛡️ 4. Anti-Raid & Server Security Guard
* **Anti-Server Advertising & Invite Blocker:** Strict real-time filter that instantly deletes unauthorized Discord invite links or server advertising attempts and issues warning strikes.
* **Anti-Flood & Duplicate Spam Shield:** Automatically throttles message floods (5+ messages within 3 seconds) and mutes offending accounts.
* **Profanity & Slur Filter:** Automatic sanitization and strike issuance for blacklisted terms.

### 🎬 5. Skybase Video Production & Film Crew Management
* **Recruitment Controls:** Staff commands (`/startcrewapp`, `/stopcrewapp`) to open and close video production auditions.
* **Interactive Modal Applications:** Direct modal submission pipeline sending candidate auditions to private staff review channels.
* **Dynamic Krims XP Leveling & Jimp Graphical Rank Cards:** Custom `/rank` cards rendered on the fly, voice XP timers, and server leaderboards.

---

## 📋 Slash Command Suite (100 Commands)

| Category | Highlights |
| :--- | :--- |
| **🤖 AI & Diagnostics** | `/ask`, `/diagnose`, `/setupbot`, `/custombot`, `/about`, `/getbot`, `/pricing`, `/github` |
| **🎬 Film Crew** | `/startcrewapp`, `/stopcrewapp`, `/startcrew`, `/stopcrew`, `/crewapp`, `/crew` |
| **🛡️ Moderation** | `/warn`, `/mute`, `/unmute`, `/kick`, `/ban`, `/purge`, `/lockdown`, `/unlock`, `/slowmode`, `/afk` |
| **📈 Progression** | `/rank`, `/level`, `/leaderboard`, `/xpleaderboard`, `/daily`, `/balance`, `/pay`, `/quests`, `/clan` |
| **📡 Community** | `/help`, `/status`, `/rules`, `/announce`, `/poll`, `/serverinfo`, `/userinfo`, `/avatar`, `/suggest` |
| **⚔️ Games & Duels** | `/duel`, `/pvp`, `/tournament`, `/bounty`, `/trade`, `/pet`, `/fish`, `/mine`, `/craft`, `/raid` |

---

## 🚀 Deployment & Operations

### Cloud Runtime
Optimized for 24/7 continuous operation on [Render](https://render.com) Web Services and Linux containers.
* **Runtime:** Node.js v20+ with Python 3 + Pillow asset rendering
* **Databases:** SQLite (WAL mode) + Neon Serverless Postgres + FalixNodes MySQL
* **Keep-Alive:** Internal 5-minute health check pinger preventing container hibernation

---

## 📜 License

**Copyright © 2026 KryloMCYT & Krims Code Studio. All rights reserved.**

This repository and all associated source code, graphics, font bundles, database schemas, and algorithms are **strictly proprietary and confidential**. 

> [!CAUTION]
> **STRICTLY NO COPYING, FORKING, REDISTRIBUTION, OR REVERSE ENGINEERING.**
> No part of this software may be copied, reproduced, cloned, mirrored, sold, or distributed in any form without explicit, prior written permission from the copyright holders. Any unauthorized copying or replication will be met with immediate DMCA copyright enforcement.

See the full [LICENSE](file:///LICENSE) document for complete terms.
