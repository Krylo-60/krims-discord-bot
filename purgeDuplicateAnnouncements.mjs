import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';
const DUPLICATE_ANNOUNCE_ID = '1532560244679512189';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('KryloSMP guild not found!');
      process.exit(1);
    }

    console.log(`\n🧹 Deleting duplicate announcements channel (${DUPLICATE_ANNOUNCE_ID})...`);
    const channels = await guild.channels.fetch();

    const dupCh = channels.get(DUPLICATE_ANNOUNCE_ID);
    if (dupCh) {
      await dupCh.delete('Removing duplicate announcements channel');
      console.log(`✅ Deleted duplicate channel: #${dupCh.name} (${DUPLICATE_ANNOUNCE_ID})`);
    } else {
      console.log(`Duplicate channel ${DUPLICATE_ANNOUNCE_ID} not found or already deleted.`);
    }

    // Now inspect all text/announcement channels for any leftover birthday messages and delete them
    console.log(`\n🧹 Purging any birthday messages across all channels...`);
    const announceChs = channels.filter(c => c && c.name && c.name.toLowerCase().includes('announcement') && c.isTextBased() && c.id !== DUPLICATE_ANNOUNCE_ID);

    for (const [, ch] of announceChs) {
      try {
        const msgs = await ch.messages.fetch({ limit: 50 });
        const bdayMsgs = msgs.filter(m => 
          m.content.includes("BIRTHDAY") || 
          (m.embeds && m.embeds.some(e => (e.title && e.title.includes("BIRTHDAY")) || (e.description && e.description.includes("BIRTHDAY"))))
        );

        for (const m of bdayMsgs.values()) {
          await m.delete().catch(() => {});
          console.log(`  - Deleted birthday message ${m.id} from #${ch.name}`);
        }
      } catch (e) {
        console.warn(`Could not check msgs in #${ch.name}: ${e.message}`);
      }
    }

    console.log(`\n🏆 DUPLICATE ANNOUNCEMENT CHANNEL & BIRTHDAY MESSAGES PURGED!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
