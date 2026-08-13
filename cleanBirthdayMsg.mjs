import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';

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

    console.log(`\n🧹 Cleaning automated birthday announcement from #📢┃announcements...`);
    const channels = await guild.channels.fetch();
    const announceCh = channels.find(c => c && c.name && c.name.toLowerCase().includes('announcement') && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    if (announceCh) {
      const msgs = await announceCh.messages.fetch({ limit: 50 });
      const bdayMsgs = msgs.filter(m => m.content.includes("OFFICIALLY KRYLO'S BIRTHDAY") || (m.embeds && m.embeds.some(e => e.title && e.title.includes("KRYLO'S BIRTHDAY"))));

      for (const m of bdayMsgs.values()) {
        await m.delete().catch(() => {});
        console.log(`  - Deleted birthday announcement message: ${m.id}`);
      }
    }

    console.log(`\n🏆 Automated birthday announcement cleaned from #📢┃announcements!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
