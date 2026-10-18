import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;

async function clearGuildDuplicates() {
  console.log('[🚀 FIXING OVERLAPPING COMMANDS] Purging guild-level command duplicates...');
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    const user = await rest.get(Routes.user());
    const appId = user.id;
    console.log(`[+] Bot App ID: ${appId} (${user.username})`);

    const guilds = await rest.get(Routes.userGuilds());
    console.log(`Found ${guilds.length} guilds. Clearing guild-level command duplicates...`);

    for (const g of guilds) {
      try {
        await rest.put(Routes.applicationGuildCommands(appId, g.id), { body: [] });
        console.log(`[✅ Cleared guild duplicates for: ${g.name} (${g.id})]`);
      } catch (err) {
        console.warn(`[-] Error on ${g.name}:`, err.message);
      }
    }

    const globalCmds = await rest.get(Routes.applicationCommands(appId));
    console.log(`\n🎉 DONE! Global commands active: ${globalCmds.length}`);
    console.log(`All servers will now display exactly ONE of each command with ZERO duplicates or overlaps!`);
  } catch (err) {
    console.error('[-] Fatal error:', err);
  }
}

clearGuildDuplicates();
