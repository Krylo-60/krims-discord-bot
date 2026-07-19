import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', async () => {
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();
    const storeCh = channels.find(c => c && c.name && c.name.includes('store'));

    if (storeCh) {
      const messages = await storeCh.messages.fetch({ limit: 10 });
      for (const msg of messages.values()) {
        if (msg.embeds && msg.embeds.length > 0) {
          console.log("=== EMBED ===");
          console.log("Msg ID:", msg.id);
          console.log("Title:", msg.embeds[0].title);
          console.log("Desc:", msg.embeds[0].description);
        }
      }
    }
  } catch (err) {
    console.error(err);
  }
  client.destroy();
});

client.login(token);
