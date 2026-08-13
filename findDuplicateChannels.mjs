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
  console.log('[+] Multi-Guild Duplicate Auditor Online as ' + client.user.tag + '\n');

  try {
    const guilds = Array.from(client.guilds.cache.values());

    for (const guild of guilds) {
      console.log(`=======================================================`);
      console.log(`🔍 DUPLICATE CHANNELS AUDIT FOR: ${guild.name} (${guild.id})`);
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

      let duplicateGroupCount = 0;
      let totalDuplicateChannels = 0;

      for (const [key, chList] of nameMap.entries()) {
        if (chList.length > 1) {
          duplicateGroupCount++;
          totalDuplicateChannels += chList.length;
          console.log(`🚨 DUPLICATE GROUP #${duplicateGroupCount}: "${key.toUpperCase()}" (${chList.length} instances)`);
          for (const ch of chList) {
            const parentName = ch.parent ? ch.parent.name : 'Uncategorized';
            const typeStr = ch.type === ChannelType.GuildText ? '💬 Text' : ch.type === ChannelType.GuildVoice ? '🔊 Voice' : '📌 Announcement';
            console.log(`   • [${typeStr}] #${ch.name} (Category: "${parentName}")`);
          }
          console.log('');
        }
      }

      console.log(`🏆 TOTAL DUPLICATE GROUPS IN [${guild.name}]: ${duplicateGroupCount}`);
      console.log(`🏆 TOTAL DUPLICATE CHANNELS INVOLVED: ${totalDuplicateChannels}\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
