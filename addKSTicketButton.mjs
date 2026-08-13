import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KS_GUILD_ID = '1531792924055048292'; // Krishiv Studios

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KS_GUILD_ID);
    if (!guild) {
      console.error('Krishiv Studios guild not found!');
      process.exit(1);
    }

    console.log(`\n👑 Setting up interactive ticket buttons for Krishiv Studios...`);
    const channels = await guild.channels.fetch();

    const ticketChannels = channels.filter(c => c && c.isTextBased() && (c.name.includes('ticket') || c.name.includes('contact-staff')));

    for (const [cId, channel] of ticketChannels) {
      try {
        const msgs = await channel.messages.fetch({ limit: 10 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        for (const m of botMsgs.values()) {
          await m.delete().catch(() => {});
        }
      } catch (e) {}

      const embed = new EmbedBuilder()
        .setTitle("👑 KRISHIV STUDIOS — CUSTOM BOT & SUPPORT TICKETS")
        .setDescription(
          `Welcome to **Krishiv Studios**! 🚀\n\n` +
          `Want to order a custom Discord bot, Minecraft plugin, or SaaS web application?\n` +
          `Or do you need support with an existing client delivery?\n\n` +
          `**Click the button below to open a private 1-on-1 support ticket channel!**`
        )
        .addFields(
          {
            name: "📋 How Orders Work",
            value:
              "1. Click **`📩 Open Support Ticket`** below.\n" +
              "2. Describe your bot features, budget, and timeline.\n" +
              "3. Krishiv & staff will respond within 24 hours with exact quote & scope."
          },
          {
            name: "🤖 Instant AI Sales Agent",
            value: "Want instant quotes in under 60 seconds? Visit our [Website AI Agent](https://krishiv-new-portfoilo.vercel.app/#contact)!"
          }
        )
        .setColor(0x00F2FF)
        .setFooter({ text: `Krishiv Studios • Official Support Center`, iconURL: guild.iconURL() })
        .setTimestamp();

      const openTicketBtn = new ButtonBuilder()
        .setCustomId('open_ticket')
        .setLabel('📩 Open Support Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎟️');

      const websiteBtn = new ButtonBuilder()
        .setLabel('🌐 Portfolio Website')
        .setStyle(ButtonStyle.Link)
        .setURL('https://krishiv-new-portfoilo.vercel.app');

      const orderBtn = new ButtonBuilder()
        .setLabel('📝 AI Sales Agent')
        .setStyle(ButtonStyle.Link)
        .setURL('https://krishiv-new-portfoilo.vercel.app/#contact');

      const row = new ActionRowBuilder().addComponents(openTicketBtn, websiteBtn, orderBtn);

      await channel.send({ embeds: [embed], components: [row] });
      console.log(`✅ Posted interactive ticket embed in #${channel.name}`);
    }

    console.log(`\n🏆 Krishiv Studios ticket channels updated!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
