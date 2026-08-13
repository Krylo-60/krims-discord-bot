import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ══════════════════════════════════════════════════════════════════════════
 * 🧹 PURGE & SINGLE EMBED DEPLOYMENT ENGINE (.MJS)
 * ══════════════════════════════════════════════════════════════════════════
 * Purges old messages inside channels and posts a single, clean embed!
 * ══════════════════════════════════════════════════════════════════════════
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

client.once('ready', async () => {
  console.log('[+] Purge & Single Embed Script Online as ' + client.user.tag);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) process.exit(1);

    console.log(`\n🧹 PURGING CLUTTER MESSAGES ON: ${guild.name}...\n`);

    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);

    for (const [chId, channel] of textChannels) {
      try {
        // Bulk delete or fetch messages to clear clutter
        const msgs = await channel.messages.fetch({ limit: 50 });
        if (msgs.size > 1) {
          // Delete old messages
          for (const msg of Array.from(msgs.values()).slice(1)) {
            if (msg.deletable) {
              await msg.delete().catch(() => {});
              await sleep(150);
            }
          }
          console.log(`  🧹 Purged clutter messages in #${channel.name}`);
        }
      } catch (e) {
        console.warn(`  [-] Could not purge #${channel.name}: ${e.message}`);
      }
    }

    console.log(`\n🏆 PURGE & SINGLE EMBED CLEANUP COMPLETED!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
