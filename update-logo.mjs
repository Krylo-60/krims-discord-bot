import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN not found in .env");
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const guild = client.guilds.cache.get('1524878881918685405');
    if (!guild) {
      console.error("Guild KryloSMP not found.");
      process.exit(1);
    }
    console.log(`Found Guild: ${guild.name}`);

    const logoPath = path.resolve('krylosmp_banner.png');
    if (fs.existsSync(logoPath)) {
      console.log(`Setting guild icon to ${logoPath}...`);
      await guild.setIcon(logoPath);
      console.log("Guild icon updated successfully!");
    } else {
      console.error(`Logo file not found at ${logoPath}`);
    }
  } catch (err) {
    console.error("Error setting guild icon:", err.message);
  } finally {
    client.destroy();
  }
});

client.login(token);
