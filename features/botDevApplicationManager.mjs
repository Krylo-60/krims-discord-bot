import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType
} from 'discord.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_FILE = path.join(__dirname, '..', 'data', 'bot_dev_app_status.json');

// Krims Code Support & Updates Server Constants
export const KRIMS_SUPPORT_GUILD_ID = '1561174283294609479';
export const KRIMS_BOT_DEV_ROLE_ID = '1561181304115044424';    // 💻 Bot Developer
export const KRIMS_LEAD_DEV_ROLE_ID = '1561175611870027908';   // 💻 Lead Bot Developer
export const KRIMS_EXECUTIVE_ROLE_ID = '1561175610930233464';  // 👑 Krims Executive
export const KRIMS_SUPPORT_LOGS_ID = '1561175643872563262';    // #📋・𝗌𝗎𝗉𝗉𝗈𝗋𝗍-𝗅𝗈𝗀𝗌
export const KRIMS_GENERAL_CHAT_ID = '1561175635940876308';    // #💬・𝗀𝖾𝗇𝖾𝗋𝖺𝗅-𝖼𝗁𝖺𝗍
export const KRIMS_EXEC_LOUNGE_ID = '1561175642219749386';     // #⚡・𝖾𝗑𝖾𝖼𝗎𝗍𝗂𝗏𝖾-𝗅𝗈𝗎𝗇𝗀𝖾
export const KRIMS_TICKETS_CATEGORY_ID = '1561175630194671656';// 🎫 ─── SUPPORT & TICKETS ───

const KRYLO_USER_ID = '1414143825538191373';

function readStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { isOpen: true, channelId: null, messageId: null, lastUpdated: null };
}

function writeStatus(data) {
  try {
    const dir = path.dirname(STATUS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[BotDevAppStatus] Failed to write status file:', e);
  }
}

let currentDevAppStatus = readStatus();

export function isBotDevAppOpen() {
  return currentDevAppStatus.isOpen !== false;
}

export function setBotDevAppStatus(isOpen) {
  currentDevAppStatus.isOpen = isOpen;
  currentDevAppStatus.lastUpdated = new Date().toISOString();
  writeStatus(currentDevAppStatus);
  return currentDevAppStatus;
}

export function getBotDevAppStatus() {
  return currentDevAppStatus;
}

/**
 * Builds the official Bot Developer Application Panel embed with interactive button
 */
export function buildBotDevApplicationPanel() {
  const isOpen = isBotDevAppOpen();

  const embed = new EmbedBuilder()
    .setColor(isOpen ? 0x00E5FF : 0x475569)
    .setTitle('💻 KRIMS CODE AI — BOT DEVELOPER APPLICATION')
    .setDescription(
      `Welcome to the official developer recruitment portal for **Krims Code AI**!\n\n` +
      `Krims Code AI is an advanced, high-performance Discord & gaming assistant ecosystem featuring custom slash architecture, autonomous multi-guild tooling, and game server integrations.\n\n` +
      `We are actively recruiting passionate developers and builders who want to engineer new features, optimize systems, and expand the bot's capabilities.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🛠️ WHAT WE ARE LOOKING FOR:\n` +
      `• **Node.js & JavaScript/TypeScript:** Familiarity with modern ES modules and \`discord.js v14\`.\n` +
      `• **API & Backend Integration:** Experience working with REST APIs, webhooks, or asynchronous task engines.\n` +
      `• **Problem Solving & Clean Code:** Writing clean, modular, and reliable production code.\n` +
      `• **Team Collaboration:** Ability to test features, communicate on Discord, and submit pull requests.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🌟 DEVELOPER BENEFITS:\n` +
      `• Exclusive **💻 Bot Developer** badge & access across the Krims ecosystem.\n` +
      `• Private developer staging privileges & sandbox testing environments.\n` +
      `• Direct collaboration with the Executive & Lead Development staff.\n` +
      `• Recognition in bot patch notes and release announcements.\n\n` +
      (isOpen 
        ? `👉 *Click the button below to submit your Developer Application directly inside Discord!*` 
        : `🔒 *Developer applications are currently closed. Check back soon for upcoming openings!*`)
    )
    .setThumbnail('https://cdn.discordapp.com/emojis/1218520268875694110.png')
    .setFooter({ text: 'Krims Code AI • Engineering Recruitment Matrix' })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId('btn_open_dev_app_modal')
    .setLabel(isOpen ? '💻 Apply for Bot Developer' : '🔒 Applications Closed')
    .setStyle(isOpen ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(!isOpen);

  const row = new ActionRowBuilder().addComponents(button);
  return { embeds: [embed], components: [row] };
}

/**
 * Sets up the dedicated developer recruitment channel in Krims Code Support server
 */
export async function setupBotDevApplicationChannel(guild) {
  if (!guild || guild.id !== KRIMS_SUPPORT_GUILD_ID) return null;

  let ch = guild.channels.cache.find(c => 
    c.id === '1561390592997593129' ||
    c.name.includes('𝖽𝖾𝗏-𝖺𝗉𝗉𝗅𝗒') || 
    c.name.toLowerCase().includes('dev-apply') || 
    c.name.toLowerCase().includes('developer-apply')
  );
  
  if (!ch) {
    ch = await guild.channels.create({
      name: '💻・𝖽𝖾𝗏-𝖺𝗉𝗉𝗅𝗒',
      type: ChannelType.GuildText,
      parent: KRIMS_TICKETS_CATEGORY_ID,
      topic: 'Official Developer Application Portal for Krims Code AI. Click the button to apply!',
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
          deny: [PermissionFlagsBits.SendMessages, PermissionFlagsBits.AddReactions, PermissionFlagsBits.CreatePublicThreads]
        },
        {
          id: guild.client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
        }
      ]
    });
  }

  // Clear previous bot messages in channel if any
  try {
    const msgs = await ch.messages.fetch({ limit: 10 });
    const botMsgs = msgs.filter(m => m.author.id === guild.client.user.id);
    for (const [, msg] of botMsgs) {
      await msg.delete().catch(() => {});
    }
  } catch (e) {}

  const panel = buildBotDevApplicationPanel();
  const sentMsg = await ch.send(panel);

  currentDevAppStatus.channelId = ch.id;
  currentDevAppStatus.messageId = sentMsg.id;
  currentDevAppStatus.lastUpdated = new Date().toISOString();
  writeStatus(currentDevAppStatus);

  return { channel: ch, message: sentMsg };
}

/**
 * Handles all Button and Modal interactions for Bot Developer Applications
 */
export async function handleBotDevApplicationInteraction(interaction) {
  // 1. OPEN APPLICATION MODAL POPUP
  if (interaction.isButton() && interaction.customId === 'btn_open_dev_app_modal') {
    if (!isBotDevAppOpen()) {
      return await interaction.reply({
        content: '🔒 **Developer applications are currently closed.** Please check back later!',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_submit_dev_app')
      .setTitle('Krims Code AI Developer Application');

    const languagesInput = new TextInputBuilder()
      .setCustomId('dev_app_languages')
      .setLabel('Programming Languages & Frameworks')
      .setPlaceholder('e.g. JavaScript, TypeScript, Node.js, discord.js, Python')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const portfolioInput = new TextInputBuilder()
      .setCustomId('dev_app_portfolio')
      .setLabel('GitHub / Portfolio / Project Links')
      .setPlaceholder('e.g. https://github.com/your-username or list notable projects')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(120)
      .setRequired(true);

    const expInput = new TextInputBuilder()
      .setCustomId('dev_app_experience')
      .setLabel('Discord Bot & Development Experience')
      .setPlaceholder('Describe any bots, APIs, or tools you have built or contributed to')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(800)
      .setRequired(true);

    const availabilityInput = new TextInputBuilder()
      .setCustomId('dev_app_availability')
      .setLabel('Weekly Availability & Timezone')
      .setPlaceholder('e.g. 5-10 hours/week, EST / GMT / IST')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(50)
      .setRequired(true);

    const whyInput = new TextInputBuilder()
      .setCustomId('dev_app_why')
      .setLabel('What features do you want to build/improve?')
      .setPlaceholder('Describe what you would love to engineer for Krims Code AI')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(800)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(languagesInput),
      new ActionRowBuilder().addComponents(portfolioInput),
      new ActionRowBuilder().addComponents(expInput),
      new ActionRowBuilder().addComponents(availabilityInput),
      new ActionRowBuilder().addComponents(whyInput)
    );

    return await interaction.showModal(modal);
  }

  // 2. MODAL SUBMISSION HANDLER
  if (interaction.isModalSubmit() && interaction.customId === 'modal_submit_dev_app') {
    const languages = interaction.fields.getTextInputValue('dev_app_languages').trim();
    const portfolio = interaction.fields.getTextInputValue('dev_app_portfolio').trim();
    const experience = interaction.fields.getTextInputValue('dev_app_experience').trim();
    const availability = interaction.fields.getTextInputValue('dev_app_availability').trim();
    const why = interaction.fields.getTextInputValue('dev_app_why').trim();

    await interaction.reply({
      content: 
        `💻 **Application Successfully Submitted!**\n\n` +
        `Thank you **${interaction.user.username}**! Your Developer Application for **Krims Code AI** has been delivered directly to the Lead Development team.\n` +
        `Our executive staff (<@&${KRIMS_EXECUTIVE_ROLE_ID}> & <@&${KRIMS_LEAD_DEV_ROLE_ID}>) will review your portfolio and code background shortly. You will receive an automated notification once reviewed! 🚀`,
      ephemeral: true
    });

    // Send application embed to Staff Logs Channel
    try {
      const staffChannel = interaction.guild.channels.cache.get(KRIMS_SUPPORT_LOGS_ID) ||
                           interaction.guild.channels.cache.find(c => c.name.includes('support-logs') || c.name.includes('staff-logs'));

      if (staffChannel) {
        const reviewEmbed = new EmbedBuilder()
          .setColor(0x00E5FF)
          .setTitle('📥 NEW BOT DEVELOPER CANDIDATE RECEIVED')
          .setDescription(
            `A new developer has submitted their application to join the **Krims Code AI** engineering team!\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `👤 **Applicant:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)\n` +
            `🆔 **User ID:** \`${interaction.user.id}\`\n` +
            `💻 **Tech Stack:** **\`${languages}\`**\n` +
            `🔗 **Portfolio / GitHub:** \`${portfolio}\`\n` +
            `🕒 **Availability & Timezone:** \`${availability}\`\n\n` +
            `📜 **Experience & Projects:**\n> ${experience.replace(/\n/g, '\n> ')}\n\n` +
            `💡 **Vision for Krims Code:**\n> ${why.replace(/\n/g, '\n> ')}\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
          )
          .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
          .setFooter({ text: 'Review candidate below using Accept or Decline' })
          .setTimestamp();

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`btn_dev_accept_${interaction.user.id}`)
            .setLabel('Accept Developer')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
          new ButtonBuilder()
            .setCustomId(`btn_dev_deny_${interaction.user.id}`)
            .setLabel('Decline')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌')
        );

        await staffChannel.send({
          content: `🔔 <@&${KRIMS_EXECUTIVE_ROLE_ID}> <@&${KRIMS_LEAD_DEV_ROLE_ID}> **New Bot Developer Applicant:** <@${interaction.user.id}>!`,
          embeds: [reviewEmbed],
          components: [actionRow]
        });
      }
    } catch (err) {
      console.error('[BotDevApp] Failed to route application to support log:', err);
    }
    return;
  }

  // 3. STAFF BUTTONS: ACCEPT OR DECLINE
  if (interaction.isButton() && (interaction.customId.startsWith('btn_dev_accept_') || interaction.customId.startsWith('btn_dev_deny_'))) {
    const isAccept = interaction.customId.startsWith('btn_dev_accept_');
    const targetUserId = interaction.customId.replace(isAccept ? 'btn_dev_accept_' : 'btn_dev_deny_', '');

    // Authorization: Must have Executive, Lead Dev role, Admin perm or be Krylo
    const member = interaction.member;
    const isAuthorized = 
      interaction.user.id === KRYLO_USER_ID ||
      member?.permissions?.has(PermissionFlagsBits.Administrator) ||
      member?.roles?.cache?.has(KRIMS_EXECUTIVE_ROLE_ID) ||
      member?.roles?.cache?.has(KRIMS_LEAD_DEV_ROLE_ID);

    if (!isAuthorized) {
      return await interaction.reply({
        content: '❌ **Permission Denied:** Only Krims Executives and Lead Developers can review developer applications.',
        ephemeral: true
      });
    }

    const targetMember = await interaction.guild.members.fetch(targetUserId).catch(() => null);

    if (isAccept) {
      // 1. Assign Bot Developer Role
      if (targetMember) {
        await targetMember.roles.add(KRIMS_BOT_DEV_ROLE_ID).catch(() => {});
        
        // 2. DM the accepted developer
        const dmEmbed = new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle('🎉 CONGRATULATIONS! WELCOME TO KRIMS CODE DEV TEAM! 💻')
          .setDescription(
            `Hey **${targetMember.user.username}**, your application to join the **Krims Code AI** development team has been **ACCEPTED** by <@${interaction.user.id}>!\n\n` +
            `You have been granted the **<@&${KRIMS_BOT_DEV_ROLE_ID}>** role in the official server.\n\n` +
            `### 🚀 GETTING STARTED:\n` +
            `1. Connect with the engineering team in <#${KRIMS_EXEC_LOUNGE_ID}>!\n` +
            `2. Check out our project architecture and guidelines in our development channels.\n` +
            `3. Speak with <@${KRYLO_USER_ID}> or Lead Developers for repository access and current sprint priorities.\n\n` +
            `Welcome aboard — let's build the future of Krims Code AI! ⚡`
          )
          .setTimestamp();

        await targetMember.send({ embeds: [dmEmbed] }).catch(() => {});
      }

      // 3. Post Announcement in General Chat
      try {
        const generalChat = interaction.guild.channels.cache.get(KRIMS_GENERAL_CHAT_ID);
        if (generalChat) {
          const welcomeDevEmbed = new EmbedBuilder()
            .setColor(0x00E5FF)
            .setTitle('⚡ NEW BOT DEVELOPER JOINED THE SQUAD!')
            .setDescription(
              `Give a warm welcome to our newest engineer, <@${targetUserId}>!\n\n` +
              `• **Role:** **💻 Bot Developer**\n` +
              `• **Onboarded By:** <@${interaction.user.id}>\n\n` +
              `Excited to build awesome new features and capabilities for Krims Code AI together! 🚀`
            )
            .setTimestamp();

          await generalChat.send({ embeds: [welcomeDevEmbed] });
        }
      } catch (e) {}

      // 4. Update the staff review message to Green
      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(0x10B981)
        .setTitle('✅ BOT DEVELOPER APPLICATION APPROVED')
        .addFields({
          name: '🎯 Decision',
          value: `**ACCEPTED** by <@${interaction.user.id}> on <t:${Math.floor(Date.now() / 1000)}:R>`,
          inline: false
        });

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_dev_accepted_disabled')
          .setLabel('Accepted')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
          .setDisabled(true)
      );

      return await interaction.update({
        content: `✅ **Application Approved by <@${interaction.user.id}>**`,
        embeds: [updatedEmbed],
        components: [disabledRow]
      });

    } else {
      // 1. DM the declined candidate politely
      if (targetMember) {
        const declineDmEmbed = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('Update Regarding Your Krims Code Developer Application')
          .setDescription(
            `Hey **${targetMember.user.username}**,\n\n` +
            `Thank you for taking the time to apply for the **Krims Code AI** development team. At this time, we are unable to move forward with your application.\n\n` +
            `We receive numerous developer submissions and encourage you to continue developing projects, contribute to community discussions, and re-apply in future development cycles!\n\n` +
            `We appreciate your support of Krims Code AI. 🌟`
          )
          .setTimestamp();

        await targetMember.send({ embeds: [declineDmEmbed] }).catch(() => {});
      }

      // 2. Update the staff review message to Red
      const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(0xEF4444)
        .setTitle('❌ BOT DEVELOPER APPLICATION DECLINED')
        .addFields({
          name: '🎯 Decision',
          value: `**DECLINED** by <@${interaction.user.id}> on <t:${Math.floor(Date.now() / 1000)}:R>`,
          inline: false
        });

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_dev_declined_disabled')
          .setLabel('Declined')
          .setStyle(ButtonStyle.Danger)
          .setEmoji('❌')
          .setDisabled(true)
      );

      return await interaction.update({
        content: `❌ **Application Declined by <@${interaction.user.id}>**`,
        embeds: [updatedEmbed],
        components: [disabledRow]
      });
    }
  }
}
