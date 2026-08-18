import { Client, GatewayIntentBits, ActivityType } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const NEW_NAME = process.argv[2] || 'Krylo Sentinel';

client.once('ready', async () => {
  console.log(`🤖 Logged in as: ${client.user.tag}`);
  
  try {
    console.log(`👑 Updating Bot Username to: "${NEW_NAME}"...`);
    await client.user.setUsername(NEW_NAME);
    console.log(`✅ Successfully updated Bot Username to: ${NEW_NAME}!`);
  } catch (err) {
    console.warn(`⚠️ Username change notice (Discord rate limits username changes to 2 per hour): ${err.message}`);
  }

  // Update presence
  client.user.setPresence({
    activities: [{ name: 'KryloSMP.play.hosting | /locator | /rank', type: ActivityType.Playing }],
    status: 'online'
  });

  console.log('🎉 Rebranding update applied!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
