import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 FULL RAW MESSAGES EXPORTER (.MJS)
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
  console.log('[+] Full Text Exporter Online as ' + client.user.tag + '\n');

  try {
    const guild = client.guilds.cache.find(g => g.name.toLowerCase().includes('krylosmp') || g.name.toLowerCase().includes('krylo'));
    if (!guild) {
      console.error('[-] Guild KryloSMP not found.');
      process.exit(1);
    }

    console.log(`=======================================================`);
    console.log(`📜 COMPLETE ALL MESSAGES TEXT FOR: ${guild.name}`);
    console.log(`=======================================================\n`);

    const textChannels = Array.from(guild.channels.cache.values())
      .filter(c => c.type === ChannelType.GuildText)
      .sort((a, b) => a.position - b.position);

    let totalCount = 0;

    for (const ch of textChannels) {
      console.log(`-------------------------------------------------------`);
      console.log(`💬 CHANNEL: #${ch.name} (Category: ${ch.parent ? ch.parent.name : 'Uncategorized'})`);
      console.log(`-------------------------------------------------------`);

      try {
        const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
        if (!msgs || msgs.size === 0) {
          console.log(`   (No messages in this channel)\n`);
        } else {
          const sorted = Array.from(msgs.values()).reverse();
          for (const m of sorted) {
            totalCount++;
            const dateStr = new Date(m.createdTimestamp).toLocaleString();
            const authorName = m.author ? m.author.tag : 'Unknown User';
            const embedText = m.embeds.length > 0 ? ` [Embed Title: "${m.embeds[0].title || m.embeds[0].author?.name || 'Rich Embed'}"]` : '';
            const content = m.content ? m.content : embedText;
            console.log(`• [${dateStr}] ${authorName} (ID: ${m.id}):`);
            console.log(`  ${content}`);
          }
          console.log('');
        }
      } catch (e) {
        console.warn(`   [-] Could not fetch messages for #${ch.name}: ${e.message}\n`);
      }
    }

    console.log(`=======================================================`);
    console.log(`🏆 TOTAL ALL MESSAGES OUTPUT: ${totalCount} MESSAGES!`);
    console.log(`=======================================================`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
