import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const BOT_NAME = 'Vesper';

client.once('ready', async () => {
  console.log(`🤖 Connected as: ${client.user.tag}`);
  
  // 1. Try global username update
  try {
    console.log(`👑 Updating Bot Username to "${BOT_NAME}"...`);
    await client.user.setUsername(BOT_NAME);
    console.log(`✅ Global Bot Username set to "${BOT_NAME}"!`);
  } catch (err) {
    console.warn(`⚠️ Global username note (Discord rate limit): ${err.message}`);
  }

  // 2. Set server nickname in every guild
  for (const [guildId, guild] of client.guilds.cache) {
    try {
      const me = await guild.members.fetchMe();
      await me.setNickname(BOT_NAME);
      console.log(`✅ Set nickname to "${BOT_NAME}" in guild: ${guild.name}`);
    } catch (err) {
      console.warn(`⚠️ Could not set nickname in ${guild.name}:`, err.message);
    }
  }

  // 3. Set presence activity
  client.user.setPresence({
    activities: [{ name: `KryloSMP.play.hosting | /locator | /rank • ${BOT_NAME}`, type: ActivityType.Playing }],
    status: 'online'
  });

  console.log(`\n🎉 BOT IS NOW OFFICIALLY NAMED "${BOT_NAME}"!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
