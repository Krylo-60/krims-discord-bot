import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag} - Deploying Application Panels...`);

  const guilds = await client.guilds.fetch();

  for (const [guildId] of guilds) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild || !guild.name.toLowerCase().includes('krylo')) continue;

    console.log(`\nDeploying to: ${guild.name} (${guild.id})`);
    const channels = await guild.channels.fetch();

    const partnerCh = channels.find(c => c && c.name.includes('partnership') && c.isTextBased());
    if (partnerCh) {
      // Purge old bot messages
      const msgs = await partnerCh.messages.fetch({ limit: 10 }).catch(() => new Map());
      for (const [, msg] of msgs) {
        if (msg.author.id === client.user.id) {
          await msg.delete().catch(() => {});
        }
      }

      const partnerEmbed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🤝 KRYLOSMP OFFICIAL PARTNERSHIP PROGRAM')
        .setDescription(
          'We partner with active Discord servers, Minecraft networks, and content creators to grow together!\n\n' +
          '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
          '📋 **Partnership Requirements:**\n' +
          '• **50+ Active Members** (excluding bots)\n' +
          '• Family-friendly & adheres to Discord TOS\n' +
          '• Dedicated `#partnerships` channel for cross-promotion\n' +
          '• Active community engagement\n\n' +
          '🎁 **Partnership Perks:**\n' +
          '• `@Partnership` ping on our official announcement channel\n' +
          '• Custom promotional embed posted in our `#🤝┃partnerships` channel\n' +
          '• Dedicated `🤝 Partner` role for server representative\n' +
          '• Joint events and tournament cross-promotions'
        )
        .setThumbnail(guild.iconURL({ dynamic: true }))
        .setFooter({ text: 'KryloSMP • Application Center • Season 1 Re-Release' })
        .setTimestamp();

      const applyEmbed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('📝 KRYLOSMP APPLICATION CENTER')
        .setDescription(
          'Interested in joining our team or collaborating with KryloSMP? Choose an application category below!\n\n' +
          '🛡️ **Staff Application** — Apply for Moderator, Admin, or Helper\n' +
          '🤝 **Partnership Application** — Submit your server for official partnership\n' +
          '🎬 **Media / Creator Application** — Apply for Content Creator role & rewards'
        )
        .setFooter({ text: 'Click a button below or open a ticket in #support-tickets' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('app_partner')
          .setLabel('Apply for Partnership')
          .setEmoji('🤝')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('app_staff')
          .setLabel('Apply for Staff')
          .setEmoji('🛡️')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('app_creator')
          .setLabel('Apply for Creator')
          .setEmoji('🎬')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setLabel('Online Application Hub')
          .setEmoji('🌐')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp.web.app/apply.html')
      );

      await partnerCh.send({ embeds: [partnerEmbed, applyEmbed], components: [row] });
      console.log(`✅ Deployed Application & Partnership panel to #${partnerCh.name} in ${guild.name}`);
    }
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
