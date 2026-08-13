import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 🗑️ DELETE SPECIFIC MESSAGES AUDITOR (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

const targetMessageIds = ['1536504715913855007', '1536502967950114917'];

client.once('ready', async () => {
  console.log('[+] Specific Message Deleter Online as ' + client.user.tag + '\n');

  try {
    const guilds = Array.from(client.guilds.cache.values());
    let foundAndDeleted = 0;

    for (const targetId of targetMessageIds) {
      let deleted = false;

      for (const guild of guilds) {
        if (deleted) break;
        const textChannels = Array.from(guild.channels.cache.values()).filter(c => c.type === ChannelType.GuildText);

        for (const ch of textChannels) {
          try {
            const msg = await ch.messages.fetch(targetId).catch(() => null);
            if (msg) {
              await msg.delete();
              deleted = true;
              foundAndDeleted++;
              console.log(`  🗑️ Successfully deleted message ${targetId} from #${ch.name} in guild "${guild.name}"!`);
              break;
            }
          } catch (e) {
            // Ignore fetch errors for non-existent messages in channel
          }
        }
      }

      if (!deleted) {
        console.log(`  [-] Message ID ${targetId} not found or already deleted.`);
      }
    }

    console.log(`\n=======================================================`);
    console.log(`🏆 TOTAL MESSAGES DELETED: ${foundAndDeleted}`);
    console.log(`=======================================================`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error deleting messages:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
