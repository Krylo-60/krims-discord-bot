import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import 'dotenv/config';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch('1524878881918685405');
    const channels = await guild.channels.fetch();

    for (const [id, ch] of channels) {
      if (!ch || ch.type !== ChannelType.GuildText) continue;
      const msgs = await ch.messages.fetch({ limit: 10 }).catch(() => null);
      if (!msgs) continue;

      const oldPlaceholders = msgs.filter(m => m.embeds && m.embeds[0] && m.embeds[0].title && m.embeds[0].title.startsWith('📌 Welcome to #'));
      if (oldPlaceholders.size > 0) {
        await ch.bulkDelete(oldPlaceholders, true).catch(() => {});
        console.log(`[Cleaned] Removed ${oldPlaceholders.size} old placeholder embed(s) from #${ch.name}`);
      }
    }

    console.log('[Done] All old placeholder headers cleaned up!');
    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
