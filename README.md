# Krims Code | Discord Bot

A Node.js Discord Bot for the Krims Code ecosystem. Integrates with the live Vercel-hosted Custom AI Chatbot via the official `@krishivpb60/krims-code-sdk`.

---

## ⚡ Bot Features

- **`!ask <prompt>`**: Instantly queries the hybrid AI statistical/cloud engine.
- **`!diagnose`**: Generates a custom embedded diagnostic panel showing the health of the AI router mesh and NPM download statistics.

---

## 🛠️ Setup Instructions

### 1. Create a Discord Bot Application
1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application** and name it **Krims Code AI**.
3. Navigate to the **Bot** tab on the left sidebar.
4. Click **Reset Token** and copy the generated token.
5. **CRITICAL**: Scroll down on the Bot page to **Privileged Gateway Intents** and toggle **ON** the **MESSAGE CONTENT INTENT** (this is required for the bot to read `!ask` and `!diagnose` commands).

### 2. Configure Environment Variables
1. Navigate to the project directory:
   ```bash
   cd C:\Users\naina\.gemini\antigravity\scratch\krims-discord-bot
   ```
2. Copy `.env.example` to a new file named `.env`:
   ```bash
   copy .env.example .env
   ```
3. Open `.env` and paste your Bot Token:
   ```env
   DISCORD_TOKEN=your_copied_bot_token_here
   ```

### 3. Invite the Bot to Your Server
1. In the Developer Portal, go to the **OAuth2** tab.
2. Select **URL Generator** under OAuth2.
3. In **Scopes**, check `bot`.
4. In **Bot Permissions**, check:
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
5. Copy the generated URL at the bottom and open it in your browser to invite the bot to your Discord server.

### 4. Install & Run
Run the commands using CMD to start the bot:
```cmd
npm install
npm start
```
