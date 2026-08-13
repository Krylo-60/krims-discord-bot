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
  console.log('[+] Raw Channels Auditor Online as ' + client.user.tag + '\n');

  try {
    const guilds = Array.from(client.guilds.cache.values());

    for (const guild of guilds) {
      console.log(`=======================================================`);
      console.log(`📋 RAW ALL CHANNELS LIST FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const categories = Array.from(guild.channels.cache.values())
        .filter(c => c.type === ChannelType.GuildCategory)
        .sort((a, b) => a.position - b.position);

      let channelCount = 0;

      for (const cat of categories) {
        console.log(`📁 CATEGORY: ${cat.name}`);
        const children = Array.from(guild.channels.cache.values())
          .filter(c => c.parentId === cat.id)
          .sort((a, b) => a.position - b.position);

        if (children.length === 0) {
          console.log(`   (No channels in this category)`);
        } else {
          for (const ch of children) {
            channelCount++;
            const typeStr = ch.type === ChannelType.GuildText ? '💬 Text' : ch.type === ChannelType.GuildVoice ? '🔊 Voice' : '📌 Announcement';
            console.log(`   ${channelCount}. [${typeStr}] #${ch.name}`);
          }
        }
        console.log('');
      }

      const orphanChannels = Array.from(guild.channels.cache.values())
        .filter(c => !c.parentId && c.type !== ChannelType.GuildCategory)
        .sort((a, b) => a.position - b.position);

      if (orphanChannels.length > 0) {
        console.log(`📁 UNCATEGORIZED CHANNELS:`);
        for (const ch of orphanChannels) {
          channelCount++;
          const typeStr = ch.type === ChannelType.GuildText ? '💬 Text' : ch.type === ChannelType.GuildVoice ? '🔊 Voice' : '📌 Announcement';
          console.log(`   ${channelCount}. [${typeStr}] #${ch.name}`);
        }
        console.log('');
      }

      console.log(`🏆 TOTAL RAW CHANNELS IN [${guild.name}]: ${channelCount} CHANNELS!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
