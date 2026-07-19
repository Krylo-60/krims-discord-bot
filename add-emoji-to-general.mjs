import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import path from 'path';
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
    // Find KryloSMP guild by exact ID
    const guild = client.guilds.cache.get('1524878881918685405') || client.guilds.cache.find(g => g.name.toLowerCase().includes('krylo') || g.id === '1524878881918685405');
    if (!guild) {
      console.error("Guild KryloSMP not found.");
      process.exit(1);
    }
    console.log(`Found Guild: ${guild.name} (${guild.id})`);

    // Fetch all channels
    const channels = await guild.channels.fetch();
    
    console.log("Guild channels:");
    let targetChannel = null;
    
    for (const [id, channel] of channels) {
      if (channel.isTextBased() && !channel.isThread()) {
        console.log(`- ${channel.name} (${channel.type})`);
        if (channel.name === 'general-chat' || channel.name === 'general_chat' || channel.name === 'general') {
          targetChannel = channel;
        }
      }
    }

    if (targetChannel) {
      const oldName = targetChannel.name;
      const newName = `💬┃general-chat`;
      console.log(`Renaming channel "${oldName}" to "${newName}"...`);
      await targetChannel.setName(newName);
      console.log("Channel renamed successfully!");
    } else {
      console.log("No matching channel found without emoji (checked 'general-chat', 'general_chat', 'general').");
    }
  } catch (err) {
    console.error("Error running script:", err);
  } finally {
    client.destroy();
  }
});

client.login(token);
