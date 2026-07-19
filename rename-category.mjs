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
    const category = await guild.channels.fetch('1528058116959371478');
    if (!category) {
      console.error("Category not found");
      process.exit(1);
    }
    const oldName = category.name;
    const newName = `「 ⚔️ 」PvP & TOURNAMENTS`;
    console.log(`Renaming category "${oldName}" to "${newName}"...`);
    await category.setName(newName);
    console.log("Category renamed successfully!");
  } catch (e) {
    console.error(e);
  } finally {
    client.destroy();
  }
});

client.login(token);
