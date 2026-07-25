import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;

async function clearGlobalCommands() {
  console.log('[🚀 REMOVING DUPLICATE GLOBAL COMMANDS] Clearing global command registration...');
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    const user = await rest.get(Routes.user());
    const appId = user.id;
    console.log(`[+] Bot App ID: ${appId} (${user.username})`);

    // Clear global commands by sending an empty array []
    await rest.put(Routes.applicationCommands(appId), { body: [] });
    console.log('[✅ GLOBAL COMMANDS CLEARED SUCCESSFULLY! ONLY GUILD COMMANDS REMAIN NOW!]');
  } catch (err) {
    console.error('[-] Failed to clear global commands:', err.message);
  }
}

clearGlobalCommands();
