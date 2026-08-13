import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1524878881918685405', '1531792924055048292']; // KryloSMP & Krishiv Studios

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`\n==================================================`);
      console.log(`🏰 SERVER: ${guild.name} (${guild.id})`);
      console.log(`==================================================`);

      const channels = await guild.channels.fetch();
      const categories = channels.filter(c => c && c.type === ChannelType.GuildCategory);

      // Sort categories by position
      const sortedCategories = Array.from(categories.values()).sort((a, b) => a.position - b.position);

      for (const cat of sortedCategories) {
        console.log(`\n📁 CATEGORY: ${cat.name}`);
        const catChannels = channels.filter(c => c && c.parentId === cat.id).sort((a, b) => a.position - b.position);

        for (const [, ch] of catChannels) {
          const typeStr = ch.type === ChannelType.GuildVoice ? '🔊 Voice' : ch.type === ChannelType.GuildAnnouncement ? '📢 News' : '💬 Text';
          console.log(`   └─ [${typeStr}] #${ch.name} (ID: ${ch.id})`);
        }
      }

      // Uncategorized channels
      const uncategorized = channels.filter(c => c && !c.parentId && c.type !== ChannelType.GuildCategory).sort((a, b) => a.position - b.position);
      if (uncategorized.size > 0) {
        console.log(`\n📁 UNCATEGORIZED CHANNELS:`);
        for (const [, ch] of uncategorized) {
          const typeStr = ch.type === ChannelType.GuildVoice ? '🔊 Voice' : ch.type === ChannelType.GuildAnnouncement ? '📢 News' : '💬 Text';
          console.log(`   └─ [${typeStr}] #${ch.name} (ID: ${ch.id})`);
        }
      }

    } catch (err) {
      console.error(`Error fetching channels for guild ${gId}:`, err.message);
    }
  }

  client.destroy();
});

client.login(token);
