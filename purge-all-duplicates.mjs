import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import 'dotenv/config';

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    console.log(`[+] Auditing and cleaning duplicate messages across ${channels.size} channels...\n`);

    let totalDeleted = 0;

    for (const [id, ch] of channels) {
      if (!ch || ch.type !== ChannelType.GuildText) continue;

      try {
        const messages = await ch.messages.fetch({ limit: 100 }).catch(() => null);
        if (!messages || messages.size === 0) continue;

        // Group bot messages by embed title or duplicate content
        const botMessages = messages.filter(m => m.author.id === client.user.id);
        if (botMessages.size <= 1) continue;

        const toDelete = [];
        const seenTitles = new Set();

        // Iterate newest to oldest
        for (const [mId, msg] of botMessages) {
          const title = msg.embeds && msg.embeds[0] && msg.embeds[0].title ? msg.embeds[0].title : msg.content;
          
          if (title && seenTitles.has(title)) {
            // Duplicate found! Mark for deletion
            toDelete.push(msg);
          } else if (title) {
            seenTitles.add(title);
          }
        }

        // Also delete any old generic "📌 Welcome to #" placeholder embeds
        const oldPlaceholders = messages.filter(m => m.embeds && m.embeds[0] && m.embeds[0].title && m.embeds[0].title.startsWith('📌 Welcome to #'));
        oldPlaceholders.forEach(m => {
          if (!toDelete.includes(m)) toDelete.push(m);
        });

        if (toDelete.length > 0) {
          const deleted = await ch.bulkDelete(toDelete, true).catch(() => null);
          const count = deleted ? deleted.size : toDelete.length;
          totalDeleted += count;
          console.log(`[🧹 Purged] Removed ${count} duplicate/old message(s) from #${ch.name}`);
        }
      } catch (err) {
        console.warn(`[!] Skipping #${ch.name}: ${err.message}`);
      }
    }

    console.log(`\n[🎉 COMPLETE] Successfully purged ${totalDeleted} duplicate/old messages across the server!`);
    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error during duplicate purge:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
