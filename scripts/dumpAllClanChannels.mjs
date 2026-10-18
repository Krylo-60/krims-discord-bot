import dotenv from 'dotenv';
import { Client, GatewayIntentBits, ChannelType } from 'discord.js';

dotenv.config();

const HALF_LIFES_GUILD_ID = '1557852594242719775';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch(HALF_LIFES_GUILD_ID);
    console.log(`Guild: ${guild.name} (${guild.id})`);
    const channels = await guild.channels.fetch();

    for (const [id, ch] of channels) {
      if (!ch) continue;
      console.log(`\n=============================`);
      console.log(`CHANNEL: #${ch.name} (ID: ${id}, Type: ${ch.type})`);
      if (ch.type === ChannelType.GuildText && ch.viewable) {
        try {
          const msgs = await ch.messages.fetch({ limit: 15 });
          const sorted = Array.from(msgs.values()).reverse();
          for (const m of sorted) {
            console.log(`  [MSG ${m.id}] ${m.author.username}: ${m.content}`);
            for (const e of m.embeds) {
              console.log(`     [EMBED] Title: ${e.title} | Desc: ${e.description?.replace(/\n/g, ' ')} | Footer: ${e.footer?.text}`);
              if (e.fields && e.fields.length > 0) {
                console.log(`     [FIELDS]:`, e.fields.map(f => `${f.name}: ${f.value}`).join(' | '));
              }
            }
          }
        } catch (e) {
          console.log(`  (Could not fetch messages: ${e.message})`);
        }
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(process.env.DISCORD_TOKEN);
