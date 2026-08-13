import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILDS = [
  '1524878881918685405', // KryloSMP
  '1420991845546332162', // Krylo's Discord server
  '1532574925356007525'  // Krylo Fan Army 👑
];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag} - Deploying Support Ticket Panels across all 3 Krylo servers...`);

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      const channels = await guild.channels.fetch();
      let ticketCh = channels.find(c => c && c.name && (c.name.includes('support-tickets') || c.name.includes('ticket') || c.name.includes('support')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

      if (!ticketCh) {
        console.log(`[+] Creating missing #🎫┃support-tickets in ${guild.name}...`);
        ticketCh = await guild.channels.create({
          name: '🎫┃support-tickets',
          type: ChannelType.GuildText,
          topic: '🎫 Need assistance, report a player, or ask a question? Open a 24/7 support ticket here!'
        });
      }

      console.log(`[+] Cleaning and deploying ticket panel in #${ticketCh.name} (${guild.name})...`);
      const oldMsgs = await ticketCh.messages.fetch({ limit: 50 }).catch(() => null);
      if (oldMsgs && oldMsgs.size > 0) {
        for (const m of oldMsgs.values()) {
          await m.delete().catch(() => {});
        }
      }

      const ticketEmbed = new EmbedBuilder()
        .setAuthor({ name: `${guild.name} Official 24/7 Help Desk`, iconURL: guild.iconURL() || client.user.displayAvatarURL() })
        .setTitle('🎫 KRYLOSMP EXECUTIVE SUPPORT CENTER')
        .setDescription(
          `Welcome to the **KryloSMP 24/7 Support Portal**!\n\n` +
          `Have a question, encountered a bug, need store/item assistance, or want to report a player?\n` +
          `Our administrative team and Gemini AI Assistant are available 24/7 to help!\n\n` +
          `### 📋 How to Open a Support Ticket:\n` +
          `1️⃣ Click the **\`🎟️ Open Support Ticket\`** button below.\n` +
          `2️⃣ Describe your issue or query in the popup box.\n` +
          `3️⃣ A private, encrypted channel will be created exclusively for you and our staff team!\n\n` +
          `---\n` +
          `🌐 **Official Resources:**\n` +
          `• **Player Portal:** [https://krylosmp.web.app/](https://krylosmp.web.app/)\n` +
          `• **Web Store:** [https://krylosmp-store.web.app/](https://krylosmp-store.web.app/)\n` +
          `• **Minecraft IP:** \`KryloSmp.play.hosting\``
        )
        .setColor(0x00F2FF)
        .setFooter({ text: 'KryloSMP Executive Support System • 24/7 Automated Response Active', iconURL: guild.iconURL() || client.user.displayAvatarURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open_ticket')
          .setLabel('🎟️ Open Support Ticket')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setLabel('🌐 Player Portal')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp.web.app/'),
        new ButtonBuilder()
          .setLabel('🛒 Web Store')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp-store.web.app/')
      );

      await ticketCh.send({ embeds: [ticketEmbed], components: [row] });
      console.log(`[+] Successfully deployed fresh support ticket panel to #${ticketCh.name} in ${guild.name}!`);
    } catch (err) {
      console.warn(`[-] Error deploying ticket panel for guild ${guildId}:`, err.message);
    }
  }

  console.log('\n[🎉 COMPLETE] Support ticket panels deployed across all 3 Krylo servers!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
