import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  try {
    const guild = client.guilds.cache.get('1524878881918685405');
    if (!guild) {
      console.error("Guild not found");
      process.exit(1);
    }
    const channels = await guild.channels.fetch();
    for (const [id, ch] of channels) {
      console.log(`ID: ${id} | Name: "${ch.name}" | Type: ${ch.type}`);
    }
  } catch (e) {
    console.error(e);
  } finally {
    client.destroy();
  }
});

client.login(token);
