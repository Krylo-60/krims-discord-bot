import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1531792924055048292', '1524878881918685405']; // Krishiv Studios & KryloSMP

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`🧹 Scanning for Duplicate Channels in Guild: ${guild.name} (${guild.id})...`);
      const channels = await guild.channels.fetch();

      const seenNames = new Map();
      const duplicateIdsToDelete = [];

      for (const [cId, channel] of channels) {
        if (channel.type === 4) continue; // Skip categories

        // Standardize channel name snippet
        const normalized = channel.name.toLowerCase().replace(/[^a-z0-9]/g, '');

        // If we see plain 'general' or duplicate names, flag the older/plain ones for removal if a formatted one exists
        if (seenNames.has(normalized)) {
          const prevChannel = seenNames.get(normalized);

          // If current channel has emojis/fancy formatting, keep current and delete previous plain one
          if (channel.name.includes('┃') || channel.name.includes('・')) {
            duplicateIdsToDelete.push(prevChannel.id);
            seenNames.set(normalized, channel);
          } else {
            duplicateIdsToDelete.push(channel.id);
          }
        } else {
          seenNames.set(normalized, channel);
        }
      }

      console.log(`Found ${duplicateIdsToDelete.length} duplicate channels to clean up in ${guild.name}.`);

      for (const delId of duplicateIdsToDelete) {
        try {
          const chanToDelete = guild.channels.cache.get(delId);
          if (chanToDelete) {
            console.log(`Deleting duplicate channel: #${chanToDelete.name} (${delId})...`);
            await chanToDelete.delete('Cleaning up duplicate channels');
          }
        } catch (err) {
          console.error(`Could not delete channel ${delId}: ${err.message}`);
        }
      }

    } catch (err) {
      console.error(`Error processing guild ${gId}:`, err.message);
    }
  }

  console.log(`✅ DUPLICATE CHANNEL CLEANUP COMPLETE ACROSS ALL SERVERS!`);
  client.destroy();
});

client.login(token);
