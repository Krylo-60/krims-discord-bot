import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  const guilds = await client.guilds.fetch();
  
  for (const [guildId] of guilds) {
    const guild = await client.guilds.fetch(guildId);
    console.log(`\n========================================`);
    console.log(`🏰 Guild: ${guild.name} (${guild.id})`);
    console.log(`========================================`);
    
    const channels = await guild.channels.fetch();
    const categories = channels.filter(c => c && c.type === ChannelType.GuildCategory);
    const nonCategoryChannels = channels.filter(c => c && c.type !== ChannelType.GuildCategory);
    
    const categorized = [];
    const uncategorized = [];
    
    for (const [, channel] of nonCategoryChannels) {
      if (!channel.parentId) {
        uncategorized.push(channel);
      } else {
        categorized.push(channel);
      }
    }
    
    console.log(`Total Categories: ${categories.size}`);
    console.log(`Categorized Channels: ${categorized.length}`);
    console.log(`Uncategorized Channels: ${uncategorized.length}`);
    
    if (uncategorized.length > 0) {
      console.log(`⚠️ Uncategorized channels:`);
      for (const ch of uncategorized) {
        console.log(`   - [${ch.type}] #${ch.name} (${ch.id})`);
      }
    } else {
      console.log(`✅ All channels in "${guild.name}" are properly categorized!`);
    }
    
    console.log(`\nCategory Breakdown:`);
    for (const [, cat] of categories) {
      const children = nonCategoryChannels.filter(c => c.parentId === cat.id);
      console.log(`📁 ${cat.name} (${children.size} channels):`);
      for (const [, child] of children) {
        console.log(`   └─ #${child.name}`);
      }
    }
  }
  
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
