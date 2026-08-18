import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const BOT_NAME = 'Atlas';

client.once('ready', async () => {
  console.log(`🤖 Connected as: ${client.user.tag}`);
  
  // Set nickname across all guilds to "Atlas"
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const me = await guild.members.fetchMe();
      await me.setNickname(BOT_NAME);
      console.log(`✅ Set nickname to "${BOT_NAME}" in guild: ${guild.name}`);
    } catch (err) {
      console.warn(`⚠️ Could not set nickname in ${guild.name}:`, err.message);
    }
  }

  // Set presence activity
  client.user.setPresence({
    activities: [{ name: `KryloSMP.play.hosting | /locator | /rank • ${BOT_NAME}`, type: ActivityType.Playing }],
    status: 'online'
  });

  console.log(`🎉 ${BOT_NAME} is now the active brand name across all servers!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
