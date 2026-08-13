import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 CLEAN TICKET CHANNEL SPAM AUDITOR (.MJS)
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
  console.log('[+] Ticket Spam Cleaner Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🧹 CLEANING TICKET SPAM IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const ticketChannels = Array.from(guild.channels.cache.values())
        .filter(c => c.name.startsWith('ticket-') && c.isTextBased());

      for (const ch of ticketChannels) {
        try {
          const msgs = await ch.messages.fetch({ limit: 100 }).catch(() => null);
          if (msgs && msgs.size > 0) {
            console.log(`📌 Found ${msgs.size} messages in #${ch.name}...`);
            let deletedCount = 0;
            const msgList = Array.from(msgs.values());

            // Keep the first welcome embed (oldest message), delete duplicate bot replies
            for (let i = 0; i < msgList.length - 2; i++) {
              const m = msgList[i];
              if (m.author.bot && m.content.includes("Krims Support AI")) {
                try {
                  await m.delete();
                  deletedCount++;
                } catch (e) {}
              }
            }
            console.log(`  ✅ Deleted ${deletedCount} repetitive bot spam messages in #${ch.name}!`);
          }
        } catch (e) {
          console.warn(`  [-] Could not clean #${ch.name}: ${e.message}`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error cleaning ticket spam:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
