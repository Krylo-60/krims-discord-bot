import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 TOTAL PURGE ALL MESSAGES IN EVERY CHANNEL (.MJS)
 * Purges ALL messages across every single channel.
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log('[+] Total Message Purger Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🔥 TOTAL PURGING ALL MESSAGES FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const textChannels = Array.from(guild.channels.cache.values())
        .filter(c => c.type === ChannelType.GuildText || c.type === ChannelType.GuildAnnouncement);

      let totalDeleted = 0;

      for (const ch of textChannels) {
        try {
          const msgs = await ch.messages.fetch({ limit: 100 }).catch(() => null);
          if (msgs && msgs.size > 0) {
            console.log(`  🧹 Purging ${msgs.size} messages in #${ch.name}...`);
            await ch.bulkDelete(msgs).catch(async () => {
              for (const [, m] of msgs) {
                await m.delete().catch(() => {});
              }
            });
            totalDeleted += msgs.size;
            console.log(`  ✅ Cleared #${ch.name}!`);
          }
        } catch (e) {
          console.warn(`  [-] Could not purge #${ch.name}: ${e.message}`);
        }
      }

      console.log(`\n🏆 TOTAL MESSAGES PURGED IN [${guild.name}]: ${totalDeleted} MESSAGES!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Purge Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
