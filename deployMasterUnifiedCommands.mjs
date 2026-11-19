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

    console.log(`[+] Fetching existing commands to preserve Discord Entry Point commands...`);
    const existingCmds = await rest.get(Routes.applicationCommands(appId));
    const entryPoints = existingCmds.filter(c => c.type === 4);
    if (entryPoints.length > 0) {
      console.log(`[+] Preserving ${entryPoints.length} Discord Entry Point activity command(s) (${entryPoints.map(e => e.name).join(', ')})...`);
    }

    const bodyToDeploy = [...entryPoints, ...masterCommandJson.filter(c => c.name !== 'launch')];
    console.log(`[+] Registering ${bodyToDeploy.length} global slash commands...`);
    await rest.put(Routes.applicationCommands(appId), { body: bodyToDeploy });
    console.log(`[✅ GLOBAL SLASH COMMANDS DEPLOYED WITHOUT DUPLICATES!]`);
  } catch (err) {
    console.error('[-] Fatal deployment error:', err);
  }
}

deploy();
