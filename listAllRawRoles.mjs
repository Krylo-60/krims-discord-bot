import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 RAW ALL ROLES AUDITOR (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Raw Roles Auditor Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`📋 RAW ALL ROLES LIST FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const roles = Array.from(guild.roles.cache.values())
        .sort((a, b) => b.position - a.position);

      let count = 0;
      for (const r of roles) {
        count++;
        const hexColor = r.hexColor;
        const memberCount = r.members.size;
        const hoistStr = r.hoist ? '📌 Hoisted' : '📎 Normal';
        console.log(`${count.toString().padStart(2, ' ')}. [${hoistStr}] Role: "${r.name}" (Color: ${hexColor} | Members: ${memberCount} | ID: ${r.id})`);
      }

      console.log(`\n🏆 TOTAL ROLES FOUND IN [${guild.name}]: ${count} ROLES!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error listing roles:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
