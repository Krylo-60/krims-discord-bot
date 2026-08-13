import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

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

    console.log(`\n🧹 Cleaning test sample video messages from #🌐┃socials...`);
    const channels = await guild.channels.fetch();
    const socialsCh = channels.find(c => c && c.name && c.name.toLowerCase().includes('social') && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    if (socialsCh) {
      const msgs = await socialsCh.messages.fetch({ limit: 50 });
      const testMsgs = msgs.filter(m => m.content.includes('d39XE_BeHZI') || m.content.includes('aCookieGod') || (m.embeds && m.embeds.some(e => e.title && e.title.includes('aCookieGod'))));
      
      for (const m of testMsgs.values()) {
        await m.delete().catch(() => {});
        console.log(`  - Deleted test sample message: ${m.id}`);
      }
    }

    console.log(`\n🏆 Test sample message removed from #🌐┃socials!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
