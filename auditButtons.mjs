import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1524878881918685405', '1531792924055048292'];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`\n🔍 AUDITING BUTTONS IN: ${guild.name} (${guild.id})...`);
      const channels = await guild.channels.fetch();

      let totalButtons = 0;
      let interactiveButtons = 0;
      let linkButtons = 0;

      for (const [cId, channel] of channels) {
        if (!channel || !channel.isTextBased() || channel.type === ChannelType.GuildCategory) continue;

        try {
          const msgs = await channel.messages.fetch({ limit: 10 });
          const botMsgs = msgs.filter(m => m.author.id === client.user.id);

          for (const m of botMsgs.values()) {
            if (!m.components || m.components.length === 0) continue;

            for (const row of m.components) {
              for (const btn of row.components) {
                totalButtons++;
                if (btn.customId) {
                  interactiveButtons++;
                  console.log(`  [INTERACTIVE] #${channel.name} -> customId: '${btn.customId}' | label: '${btn.label}'`);
                } else if (btn.url) {
                  linkButtons++;
                  console.log(`  [LINK] #${channel.name} -> url: '${btn.url}' | label: '${btn.label}'`);
                }
              }
            }
          }
        } catch (e) {}
      }

      console.log(`\n📊 Audit Summary for ${guild.name}:`);
      console.log(`   • Total Buttons: ${totalButtons}`);
      console.log(`   • Interactive (Bot Logic) Buttons: ${interactiveButtons}`);
      console.log(`   • Link (Web URL) Buttons: ${linkButtons}`);

    } catch (err) {
      console.error(`Error in guild ${gId}:`, err.message);
    }
  }

  client.destroy();
});

client.login(token);
