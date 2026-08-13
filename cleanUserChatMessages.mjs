import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 CLEAN USER CHAT MESSAGES AUDITOR (.MJS)
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
  console.log('[+] Chat Purger Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🧹 PURGING USER CHAT MESSAGES FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const textChannels = Array.from(guild.channels.cache.values()).filter(c => c.type === ChannelType.GuildText);
      let deletedUserMsgs = 0;

      for (const ch of textChannels) {
        if (ch.name.includes('general') || ch.name.includes('chat') || ch.name.includes('talk')) {
          try {
            const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
            if (msgs && msgs.size > 0) {
              for (const [, m] of msgs) {
                // Delete messages sent by regular users (non-bot)
                if (!m.author.bot) {
                  try {
                    await m.delete();
                    deletedUserMsgs++;
                    console.log(`  🗑️ Deleted user message by ${m.author.tag} in #${ch.name}: "${m.content}"`);
                  } catch (e) {
                    console.warn(`  [-] Could not delete message from ${m.author.tag}: ${e.message}`);
                  }
                }
              }
            }
          } catch (err) {
            // Ignore channel errors
          }
        }
      }

      console.log(`\n🏆 CHAT PURGE COMPLETE IN [${guild.name}]: ${deletedUserMsgs} USER MESSAGES DELETED!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error purging user messages:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
