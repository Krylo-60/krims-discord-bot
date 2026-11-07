import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionFlagsBits 
} from 'discord.js';
import { db } from '../databaseEngine.mjs';

// Ensure schema has welcome_format and tickets_channel columns
try {
  db.prepare("ALTER TABLE server_config ADD COLUMN welcome_format TEXT DEFAULT 'embed'").run();
} catch (_) {}
try {
  db.prepare("ALTER TABLE server_config ADD COLUMN tickets_channel TEXT").run();
} catch (_) {}

export function getGuildServerConfig(guildId) {
  const row = db.prepare('SELECT * FROM server_config WHERE guild_id = ?').get(guildId);
  if (!row) {
    db.prepare('INSERT OR IGNORE INTO server_config (guild_id) VALUES (?)').run(guildId);
    return { guild_id: guildId, prefix: '!', welcome_channel: null, welcome_format: 'embed', tickets_category: null, tickets_channel: null };
  }
  return row;
}

export function updateGuildServerConfig(guildId, updates) {
  const current = getGuildServerConfig(guildId);
  const prefix = updates.prefix !== undefined ? updates.prefix : current.prefix;
  const welcome_channel = updates.welcome_channel !== undefined ? updates.welcome_channel : current.welcome_channel;
  const welcome_format = updates.welcome_format !== undefined ? updates.welcome_format : current.welcome_format;
  const rules_channel = updates.rules_channel !== undefined ? updates.rules_channel : current.rules_channel;
  const logs_channel = updates.logs_channel !== undefined ? updates.logs_channel : current.logs_channel;
  const tickets_category = updates.tickets_category !== undefined ? updates.tickets_category : current.tickets_category;
  const tickets_channel = updates.tickets_channel !== undefined ? updates.tickets_channel : current.tickets_channel;

  db.prepare(`
    INSERT INTO server_config (guild_id, prefix, welcome_channel, welcome_format, rules_channel, logs_channel, tickets_category, tickets_channel, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(guild_id) DO UPDATE SET
      prefix = excluded.prefix,
      welcome_channel = excluded.welcome_channel,
      welcome_format = excluded.welcome_format,
      rules_channel = excluded.rules_channel,
      logs_channel = excluded.logs_channel,
      tickets_category = excluded.tickets_category,
      tickets_channel = excluded.tickets_channel,
      updated_at = CURRENT_TIMESTAMP
  `).run(guildId, prefix, welcome_channel, welcome_format, rules_channel, logs_channel, tickets_category, tickets_channel);

  return getGuildServerConfig(guildId);
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. 👋 !setwelcome / !welcomeconfig
// ═════════════════════════════════════════════════════════════════════════════
export async function handleSetWelcomeCommand(message, args) {
  if (!message.guild) return message.reply("❌ This command can only be used inside servers!");
  
  const isStaff = message.author.id === '1414143825538191373' || 
    message.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
    message.member?.permissions?.has(PermissionFlagsBits.ManageGuild);

  if (!isStaff) return message.reply("⛔ **Admin Required:** You need `Manage Server` or `Administrator` permissions to configure the Welcome System!");

  const config = getGuildServerConfig(message.guild.id);

  // If user passes direct channel mention: "!setwelcome #welcome"
  const mentionedChannel = message.mentions.channels.first();
  if (mentionedChannel) {
    updateGuildServerConfig(message.guild.id, { welcome_channel: mentionedChannel.id });
    return message.reply(`✅ **Welcome Channel Updated!** New members will now be greeted in <#${mentionedChannel.id}>.`);
  }

  // If user passes "!setwelcome format [text|image]"
  if (args[0]?.toLowerCase() === 'format') {
    const choice = args[1]?.toLowerCase();
    if (choice === 'card' || choice === 'image') {
      updateGuildServerConfig(message.guild.id, { welcome_format: 'card' });
      return message.reply(`✅ **Welcome Format Updated!** Set to **🖼️ Image Card** mode.`);
    } else {
      updateGuildServerConfig(message.guild.id, { welcome_format: 'embed' });
      return message.reply(`✅ **Welcome Format Updated!** Set to **📝 Text Embed** mode.`);
    }
  }

  // Interactive Panel
  const currentCh = config.welcome_channel ? `<#${config.welcome_channel}>` : '*Auto-Detect (#welcome or system)*';
  const currentFmt = config.welcome_format === 'card' ? '🖼️ Image Card' : '📝 Text Embed';

  const embed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle('👋 Universal Welcome System 2.0 Configuration')
    .setDescription(
      `Customize how new members are greeted when joining **${message.guild.name}**!\n\n` +
      `📍 **Current Destination:** ${currentCh}\n` +
      `🎨 **Current Format:** \`${currentFmt}\`\n\n` +
      `**Quick Setup Options:**\n` +
      `• Click **[➕ Create #welcome]** to let the bot auto-create a dedicated welcome channel with permissions.\n` +
      `• Toggle between **[📝 Text Embed]** and **[🖼️ Image Card]** below.\n` +
      `• Or mention any existing channel: \`!setwelcome #my-channel\``
    )
    .setFooter({ text: 'Krims Welcome System 2.0 • Co-Created by Mini & Krylo' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`welcome_create_${message.guild.id}`)
      .setLabel('➕ Create #👋・welcome')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`welcome_fmt_embed_${message.guild.id}`)
      .setLabel('📝 Text Embed')
      .setStyle(config.welcome_format === 'embed' ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`welcome_fmt_card_${message.guild.id}`)
      .setLabel('🖼️ Image Card')
      .setStyle(config.welcome_format === 'card' ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  return message.reply({ embeds: [embed], components: [row] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. 🎟️ !settickets / !ticketconfig
// ═════════════════════════════════════════════════════════════════════════════
export async function handleSetTicketsCommand(message, args) {
  if (!message.guild) return message.reply("❌ This command can only be used inside servers!");

  const isStaff = message.author.id === '1414143825538191373' || 
    message.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
    message.member?.permissions?.has(PermissionFlagsBits.ManageGuild);

  if (!isStaff) return message.reply("⛔ **Admin Required:** You need `Manage Server` or `Administrator` permissions to configure the Ticket System!");

  const config = getGuildServerConfig(message.guild.id);
  const currentCat = config.tickets_category ? `<#${config.tickets_category}>` : '*Not Configured*';
  const currentPanel = config.tickets_channel ? `<#${config.tickets_channel}>` : '*Not Configured*';

  const embed = new EmbedBuilder()
    .setColor(0x8B5CF6)
    .setTitle('🎟️ Support Tickets Hub 2.0 Configuration')
    .setDescription(
      `Configure where private support tickets and user transcripts go in **${message.guild.name}**!\n\n` +
      `📁 **Ticket Category:** ${currentCat}\n` +
      `📌 **Ticket Panel Channel:** ${currentPanel}\n\n` +
      `**1-Click Auto Deploy:**\n` +
      `Click **[🚀 Auto-Deploy Tickets 2.0]** below to automatically create:\n` +
      `1. \`🎫 ・SUPPORT\` Private Category\n` +
      `2. \`#🎫・open-a-ticket\` with interactive button panel\n` +
      `3. \`#📋・ticket-logs\` for staff transcript archives`
    )
    .setFooter({ text: 'Krims Support Core 2.0 • Private Ticket Routing' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tickets_deploy_${message.guild.id}`)
      .setLabel('🚀 Auto-Deploy Tickets 2.0')
      .setStyle(ButtonStyle.Success)
  );

  return message.reply({ embeds: [embed], components: [row] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. 🚀 Handle Universal Welcome & Ticket Button Interactions
// ═════════════════════════════════════════════════════════════════════════════
export async function handleWelcomeTicketInteraction(interaction) {
  if (!interaction.isButton()) return false;
  const customId = interaction.customId;

  // A. Create #welcome channel
  if (customId.startsWith('welcome_create_')) {
    if (!interaction.member?.permissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '⛔ You need `Manage Channels` permissions to create channels!', ephemeral: true });
    }
    await interaction.deferUpdate();
    try {
      const ch = await interaction.guild.channels.create({
        name: '👋・welcome',
        type: ChannelType.GuildText,
        topic: 'Official welcome greetings for new members joining the community!'
      });
      updateGuildServerConfig(interaction.guild.id, { welcome_channel: ch.id });
      return interaction.followUp({ content: `✅ Created and set **<#${ch.id}>** as your official welcome channel!`, ephemeral: true });
    } catch (err) {
      return interaction.followUp({ content: `❌ Failed to create channel: ${err.message}`, ephemeral: true });
    }
  }

  // B. Toggle Welcome Format (Embed vs Card)
  if (customId.startsWith('welcome_fmt_embed_')) {
    updateGuildServerConfig(interaction.guild.id, { welcome_format: 'embed' });
    return interaction.reply({ content: '✅ Welcome format set to **📝 Text Embed**!', ephemeral: true });
  }

  if (customId.startsWith('welcome_fmt_card_')) {
    updateGuildServerConfig(interaction.guild.id, { welcome_format: 'card' });
    return interaction.reply({ content: '✅ Welcome format set to **🖼️ Image Card**!', ephemeral: true });
  }

  // C. Auto-deploy Tickets 2.0 Hub
  if (customId.startsWith('tickets_deploy_')) {
    if (!interaction.member?.permissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '⛔ You need `Manage Channels` permissions!', ephemeral: true });
    }
    await interaction.deferUpdate();
    try {
      const category = await interaction.guild.channels.create({
        name: '🎫 ・SUPPORT TICKETS',
        type: ChannelType.GuildCategory
      });

      const panelCh = await interaction.guild.channels.create({
        name: '🎫・open-a-ticket',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Click the button below to open a private support ticket with server staff!'
      });

      const logsCh = await interaction.guild.channels.create({
        name: '📋・ticket-logs',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Archive logs for closed support tickets and transcripts.'
      });

      updateGuildServerConfig(interaction.guild.id, {
        tickets_category: category.id,
        tickets_channel: panelCh.id,
        logs_channel: logsCh.id
      });

      // Post panel
      const panelEmbed = new EmbedBuilder()
        .setColor(0x8B5CF6)
        .setTitle(`🎫 ${interaction.guild.name} — Support Center`)
        .setDescription(
          `Need help, have a question, or need to report a rule violation?\n\n` +
          `Click **Create Ticket** below to start a private conversation with our moderation team!\n\n` +
          `• 🔒 **Private & Secure:** Only you and verified staff can view your ticket.\n` +
          `• ⚡ **Fast Response:** Our team will be notified immediately.`
        )
        .setFooter({ text: 'Krims Support Core 2.0' });

      const panelRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create_general')
          .setLabel('📩 Create Ticket')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫')
      );

      await panelCh.send({ embeds: [panelEmbed], components: [panelRow] });

      return interaction.followUp({ 
        content: `🎉 **Support Hub 2.0 Successfully Deployed!**\n• Panel: <#${panelCh.id}>\n• Transcripts: <#${logsCh.id}>\n• Category: **${category.name}**`, 
        ephemeral: true 
      });
    } catch (err) {
      return interaction.followUp({ content: `❌ Failed deploying tickets: ${err.message}`, ephemeral: true });
    }
  }

  return false;
}
