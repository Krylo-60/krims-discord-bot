import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1531792924055048292', '1524878881918685405']; // Krishiv Studios & KryloSMP

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`🚀 Adding 5-Point Channel Rules to Guild: ${guild.name} (${guild.id})...`);
      const channels = await guild.channels.fetch();

      for (const [cId, channel] of channels) {
        if (!channel.isTextBased() || channel.type === 4) continue; // Skip categories/voice

        console.log(`Posting 5-Point Rules to #${channel.name}...`);

        const cleanName = channel.name.replace(/[^a-zA-Z0-9]/g, ' ').trim().toUpperCase();

        const embed = new EmbedBuilder()
          .setTitle(`📌 5-POINT CHANNEL RULES & USAGE — #${channel.name}`)
          .setDescription(`Official channel guidelines and usage instructions for **${cleanName}** in **${guild.name}**.`)
          .addFields(
            { 
              name: "1️⃣ CHANNEL PURPOSE", 
              value: `This channel is dedicated exclusively to discussions, media, and features related to **${cleanName}**.` 
            },
            { 
              name: "2️⃣ PROHIBITED CONTENT", 
              value: "No spamming, off-topic links, NSFW content, unauthorized self-promotion, or toxic behavior." 
            },
            { 
              name: "3️⃣ CHAT BEHAVIOR & ETIQUETTE", 
              value: "Be respectful to all members and staff. Keep all conversations civil and constructive." 
            },
            { 
              name: "4️⃣ BOT COMMANDS & INTEGRATIONS", 
              value: "Use bot slash commands (`/spin`, `/jackpot`, `/quests`, `/bday`, `/clan`) in designated bot channels." 
            },
            { 
              name: "5️⃣ NEED ASSISTANCE?", 
              value: "Open a ticket in `#🎫・contact-staff` or visit our web portal for 24/7 AI Agent support." 
            }
          )
          .setColor(0x00F2FF)
          .setFooter({ text: `${guild.name} • Official 5-Point Channel Protocol`, iconURL: guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
          new ButtonBuilder().setLabel("📝 Order Custom Bot").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact")
        );

        await channel.send({ embeds: [embed], components: [row] }).catch(e => console.error(`Failed to send to #${channel.name}: ${e.message}`));
      }
    } catch (err) {
      console.error(`Error in guild ${gId}:`, err.message);
    }
  }

  console.log(`✅ 5-POINT RULES EMBEDS POSTED TO ALL CHANNELS ACROSS BOTH SERVERS!`);
  client.destroy();
});

client.login(token);
