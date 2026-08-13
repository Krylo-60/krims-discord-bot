import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 FETCH ALL SERVER MESSAGES AUDITOR (.MJS)
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
  console.log('[+] Message Auditor Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`💬 RECENT MESSAGES TRANSCRIPT FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const textChannels = Array.from(guild.channels.cache.values())
        .filter(c => c.type === ChannelType.GuildText)
        .sort((a, b) => a.position - b.position);

      let totalMsgsFound = 0;

      for (const ch of textChannels) {
        try {
          const msgs = await ch.messages.fetch({ limit: 5 }).catch(() => null);
          if (msgs && msgs.size > 0) {
            console.log(`📌 CHANNEL: #${ch.name} (${msgs.size} messages)`);
            const sortedMsgs = Array.from(msgs.values()).reverse();

            for (const m of sortedMsgs) {
              totalMsgsFound++;
              const timeStr = new Date(m.createdTimestamp).toLocaleTimeString();
              const authorStr = m.author.bot ? `🤖 ${m.author.tag}` : `👤 ${m.author.tag}`;
              const contentStr = m.content ? m.content.replace(/\n/g, ' ') : (m.embeds.length > 0 ? `[EMBED: ${m.embeds[0].title || 'Rich Embed'}]` : '[ATTACHMENT/OTHER]');
              console.log(`   [${timeStr}] ${authorStr} (ID: ${m.id}): ${contentStr.substring(0, 120)}`);
            }
            console.log('');
          }
        } catch (e) {
          // Channel unreadable or no permission
        }
      }

      console.log(`🏆 TOTAL RECENT MESSAGES FETCHED IN [${guild.name}]: ${totalMsgsFound} MESSAGES!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error fetching messages:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
