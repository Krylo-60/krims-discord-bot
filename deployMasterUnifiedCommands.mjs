import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { masterCommandJson } from './commands/masterCommandRegistry.mjs';

dotenv.config();

const token = process.env.DISCORD_TOKEN;

async function deploy() {
  console.log(`[🚀 MASTER UNIFIED SLASH COMMANDS] Deploying ALL ${masterCommandJson.length} commands across guilds...`);
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    const user = await rest.get(Routes.user());
    const appId = user.id;
    console.log(`[+] Bot App ID: ${appId} (${user.username})`);

    const guildsRes = await rest.get(Routes.userGuilds());
    for (const g of guildsRes) {
      console.log(`[+] Cleaning any guild-scoped commands in ${g.name} (${g.id}) to prevent duplicates...`);
      try {
        await rest.put(Routes.applicationGuildCommands(appId, g.id), { body: [] });
      } catch (err) {
        console.warn(`[-] Failed cleaning ${g.name}:`, err.message);
      }
    }

    console.log(`[+] Registering ${masterCommandJson.length} global slash commands...`);
    await rest.put(Routes.applicationCommands(appId), { body: masterCommandJson });
    console.log(`[✅ GLOBAL SLASH COMMANDS DEPLOYED WITHOUT DUPLICATES!]`);
  } catch (err) {
    console.error('[-] Fatal deployment error:', err);
  }
}

deploy();
