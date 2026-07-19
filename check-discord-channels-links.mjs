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
    console.log("Connected to Discord! Scanning server for tebex.io links...\n");
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    for (const channel of channels.values()) {
      if (!channel) continue;

      // 1. Check Channel Topic
      if (channel.topic && channel.topic.toLowerCase().includes('tebex')) {
        console.log(`[TOPIC MATCH] #${channel.name} (ID: ${channel.id}): "${channel.topic}"`);
      }

      // 2. Check Messages in Text Channels
      if (channel.isTextBased()) {
        try {
          const messages = await channel.messages.fetch({ limit: 50 });
          for (const msg of messages.values()) {
            if (msg.content && msg.content.toLowerCase().includes('tebex')) {
              console.log(`[MESSAGE MATCH] #${channel.name} | Author: ${msg.author.username} | Msg: "${msg.content}"`);
            }
            if (msg.embeds && msg.embeds.length > 0) {
              for (const embed of msg.embeds) {
                const embedText = [
                  embed.title,
                  embed.description,
                  embed.url,
                  embed.footer?.text,
                  embed.fields?.map(f => `${f.name} ${f.value}`).join(' ')
                ].join(' ').toLowerCase();

                if (embedText.includes('tebex')) {
                  console.log(`[EMBED MATCH] #${channel.name} | Author: ${msg.author.username} | Title: "${embed.title}" | Url: "${embed.url}"`);
                }
              }
            }
          }
        } catch (err) {
          // Skip channels we can't read
        }
      }
    }
    console.log("\nScan complete!");
  } catch (err) {
    console.error("Scan failed:", err.message);
  }
  client.destroy();
});

client.login(token);
