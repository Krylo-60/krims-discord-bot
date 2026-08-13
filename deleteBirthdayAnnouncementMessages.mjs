import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log('[+] Birthday Message Deleter Online as ' + client.user.tag + '\n');

  try {
    for (const [, guild] of client.guilds.cache) {
      if (!guild.name.toLowerCase().includes('krylo')) continue;

      const channels = await guild.channels.fetch();
      const announceChannels = channels.filter(c => c && c.isTextBased() && c.name.includes('announcements'));

      for (const [, ch] of announceChannels) {
        try {
          const msgs = await ch.messages.fetch({ limit: 20 });
          for (const [, msg] of msgs) {
            if (
              msg.content.includes("KRYLO'S BIRTHDAY") ||
              (msg.embeds && msg.embeds.some(e => e.title && e.title.includes("KRYLO'S BIRTHDAY")))
            ) {
              await msg.delete();
              console.log(`[🗑️ DELETED BIRTHDAY ANNOUNCEMENT]: #${ch.name} in [${guild.name}]`);
            }
          }
        } catch (e) {
          console.warn(`[-] Error checking #${ch.name}: ${e.message}`);
        }
      }
    }

    console.log('\n🏆 Birthday message cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
