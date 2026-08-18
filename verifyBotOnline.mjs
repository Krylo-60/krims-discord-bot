import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', () => {
  console.log(`🤖 Bot Verification Test: ${client.user.tag} is ONLINE and connected to ${client.guilds.cache.size} servers!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
