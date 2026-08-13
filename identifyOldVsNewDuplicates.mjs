import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Old vs New Duplicate Auditor Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🔍 OLD VS NEW DUPLICATE ANALYSIS FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const channels = Array.from(guild.channels.cache.values())
        .filter(c => c.type !== ChannelType.GuildCategory);

      const nameMap = new Map();

      for (const ch of channels) {
        const cleanName = ch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!nameMap.has(cleanName)) {
          nameMap.set(cleanName, []);
        }
        nameMap.get(cleanName).push(ch);
      }

      let groupCount = 0;

      for (const [key, chList] of nameMap.entries()) {
        if (chList.length > 1) {
          groupCount++;
          chList.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

          const oldChannel = chList[0];
          const newChannel = chList[chList.length - 1];

          console.log(`📌 GROUP #${groupCount}: "${key.toUpperCase()}"`);
          console.log(`   • 📜 OLD CHANNEL: #${oldChannel.name} (Category: "${oldChannel.parent ? oldChannel.parent.name : 'Uncategorized'}")`);
          console.log(`   • ✨ NEW CHANNEL: #${newChannel.name} (Category: "${newChannel.parent ? newChannel.parent.name : 'Uncategorized'}")\n`);
        }
      }
    }

    console.log(`=======================================================`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
