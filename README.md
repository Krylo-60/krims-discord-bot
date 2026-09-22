# Krims Code AI 🤖

[![Discord Bot](https://img.shields.io/badge/Discord.js-v14.14-5865F2?logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Google Gemini](https://img.shields.io/badge/AI-Google%20Gemini-4285F4?logo=google&logoColor=white)](https://ai.google.dev/)
[![Render](https://img.shields.io/badge/Deploy-Render-46E3B7?logo=render&logoColor=white)](https://render.com/)

**Krims Code AI** is a state-of-the-art Discord community and enterprise management bot built with **Discord.js v14**, **Google Gemini AI**, and **Render Cloud Infrastructure**. It powers high-scale servers with 97 unified slash commands, custom Jimp-rendered leveling cards, video production crew audition pipelines, connected platform role showcases, and automated Dyno-grade moderation.

---

## ⚡ Core Systems

### 🤖 1. Hybrid Gemini AI Core
* **`/ask <prompt>`**: Intelligent, contextual responses powered by Google Gemini with custom safety guidelines and studio awareness.
* **`/diagnose`**: Live diagnostic overview of system latency, memory allocation, Discord Gateway health, and API connectivity.
* **Automated Support**: Context-aware assistance for incoming server queries and audition tickets.

### 🎬 2. Film Crew & Audition Management
* **Audition Controls**: Staff and director commands (`/startcrewapp`, `/stopcrewapp`, `/crewapp status`) to open or close recruitment panels in real time.
* **Modal Applications**: Dynamic, interactive application modals submitted directly to private moderator review lounges.
* **Recruitment Hub**: Embed state synchronization across recruitment channels with instantaneous button lockouts upon closure.

### 👑 3. MEE6-Grade Leveling & Dynamic Rank Cards
* **Custom Graphical Cards (`/rank`)**: High-performance PNG card generation via Jimp featuring custom avatars, level badges, dynamic progress bars, and server owner prestige flair.
* **XP Tracking**: Real-time message XP rewards, voice channel time accumulation, and configurable cooldown throttles.
* **Chat Leaderboards (`/leaderboard`)**: Dynamic top-10 member rankings with medals and owner badges.

### 🛡️ 4. Dyno-Grade Moderation & Security
* **Full Moderation Suite**: `/warn`, `/mute`, `/unmute`, `/kick`, `/ban`, `/purge`, `/lockdown`, `/unlock`, `/slowmode`.
* **AutoMod Safeguards**: Automated protection against mention spam, malicious invites, and suspicious content.
* **Role Hierarchy Guards**: Administrative bypass protections and safety checks for server owners and moderators.

### 🔗 5. Connected Platform Verification & Roles
* **Public Identity Badges**: Showcase badges for verified YouTube, Twitch, and Spotify connections.
* **Privacy Controls**: Secure management consoles for releasing special platform follower and subscriber roles on demand.

### 💰 6. Economy, Progression & Minigames
* Virtual coins, daily login rewards (`/daily`), quests, duels (`/duel`), chest rewards, and clan management.

---

## 📋 Slash Command Suite (97 Commands)

| Category | Highlights |
| :--- | :--- |
| **🤖 AI & Diagnostics** | `/ask`, `/diagnose`, `/setupbot`, `/custombot`, `/about`, `/getbot`, `/pricing`, `/github` |
| **🎬 Film Crew** | `/startcrewapp`, `/stopcrewapp`, `/startcrew`, `/stopcrew`, `/crewapp`, `/crew` |
| **🛡️ Moderation** | `/warn`, `/mute`, `/unmute`, `/kick`, `/ban`, `/purge`, `/lockdown`, `/unlock`, `/slowmode`, `/afk` |
| **📈 Progression** | `/rank`, `/level`, `/leaderboard`, `/xpleaderboard`, `/daily`, `/balance`, `/pay`, `/quests`, `/clan` |
| **📡 Community** | `/help`, `/status`, `/rules`, `/announce`, `/poll`, `/serverinfo`, `/userinfo`, `/avatar`, `/suggest` |
| **⚔️ Games & Duels** | `/duel`, `/pvp`, `/tournament`, `/bounty`, `/trade`, `/pet`, `/fish`, `/mine`, `/craft`, `/raid` |

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) v18.0.0 or higher
* npm (bundled with Node.js)
* A Discord Bot Application created on the [Discord Developer Portal](https://discord.com/developers/applications)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Krylo-60/krims-discord-bot.git
   cd krims-discord-bot
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the project root:
   ```env
   DISCORD_TOKEN=your_discord_bot_token_here
   CLIENT_ID=your_discord_client_id_here
   GEMINI_API_KEY=your_gemini_api_key_here
   PORT=3000
   ```

4. **Register Slash Commands:**
   Deploy all 97 unified commands to Discord's Gateway:
   ```bash
   node deployMasterUnifiedCommands.mjs
   ```

5. **Start the Bot:**
   ```bash
   npm start
   ```

---

## 🌐 Cloud Deployment (Render)

This bot is optimized for 24/7 continuous operation on [Render](https://render.com) Web Services.

* **Build Command:** `npm install`
* **Start Command:** `npm start`
* **Health Check Path:** `/` (returns HTTP 200 JSON status)

---

## 🔒 Security & Privacy

* All bot tokens, API keys, and local environment files are strictly excluded from version control via `.gitignore`.
* Private administration consoles and audit channels are restricted via Discord snowflake permissions and owner ID validation.

---

## 📜 License
Distributed under the MIT License. See `LICENSE` for more information.
