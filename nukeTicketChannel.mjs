import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 NUKE TICKET CHANNEL MESSAGES (.MJS)
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
  console.log('[+] Ticket Nuke Auditor Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🔥 NUKING TICKET CHANNELS IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const ticketChannels = Array.from(guild.channels.cache.values())
        .filter(c => c.name.startsWith('ticket-') && c.isTextBased());

      for (const ch of ticketChannels) {
        try {
          const msgs = await ch.messages.fetch({ limit: 100 }).catch(() => null);
          if (msgs && msgs.size > 0) {
            console.log(`  🧹 Purging ALL ${msgs.size} messages from #${ch.name}...`);
            await ch.bulkDelete(msgs).catch(async () => {
              for (const [, m] of msgs) {
                await m.delete().catch(() => {});
              }
            });
            console.log(`  ✅ Successfully emptied #${ch.name}!`);
          }
        } catch (e) {
          console.warn(`  [-] Could not nuke #${ch.name}: ${e.message}`);
        }
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error nuking ticket channel:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
