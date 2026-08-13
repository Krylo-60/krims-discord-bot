import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 CLOSE OPEN TICKET CHANNELS (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Ticket Closer Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🔒 CLOSING TICKET CHANNELS IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const ticketChannels = Array.from(guild.channels.cache.values())
        .filter(c => c.name.startsWith('ticket-') && c.isTextBased());

      let closedCount = 0;

      for (const ch of ticketChannels) {
        try {
          await ch.delete(`Ticket closed by owner command`);
          closedCount++;
          console.log(`  🔒 Closed & Deleted Ticket Channel: #${ch.name}`);
        } catch (e) {
          console.warn(`  [-] Could not close #${ch.name}: ${e.message}`);
        }
      }

      console.log(`\n🏆 TOTAL TICKETS CLOSED IN [${guild.name}]: ${closedCount} CHANNELS!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error closing ticket channel:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
