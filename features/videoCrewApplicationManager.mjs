import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  PermissionFlagsBits 
} from 'discord.js';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_FILE = path.join(__dirname, '..', 'data', 'crew_app_status.json');

const KRYLO_USER_ID = '1414143825538191373';
const CREW_ROLE_ID = '1550901841255075850';         // 🎬 Skybase Video Crew
const EARLY_ACCESS_ROLE_ID = '1550901842177822783'; // 🍿 Skybase Early Access
const REVIEW_CHANNEL_ID = '1549883558208868373';    // 🛡️・𝖬oderator-only
const CREW_LOUNGE_ID = '1550901951640768636';       // 🎬・𝖢rew-lounge
const RECORDING_STUDIO_ID = '1550604126981853356';   // 🔒・Recording Studio

export const CREW_APPLY_CHANNEL_ID = '1550902305568718948';
export const CREW_APPLY_MSG_ID = '1550902307053502537';

function readStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { isOpen: false, lastUpdated: null, messageId: CREW_APPLY_MSG_ID, channelId: CREW_APPLY_CHANNEL_ID };
}

function writeStatus(data) {
  try {
    const dir = path.dirname(STATUS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[CrewAppStatus] Failed to write status file:', e);
  }
}

let currentCrewAppStatus = readStatus();

export function isCrewAppOpen() {
  return !!currentCrewAppStatus.isOpen;
}

export function getCrewAppStatus() {
  return currentCrewAppStatus;
}

/**
 * Builds the Main Public Application Panel Embed & Buttons (OPEN)
 */
export function buildApplicationPanel() {
  const panelEmbed = new EmbedBuilder()
    .setColor(0xFF4757) // Skybase Film Red
    .setTitle('🎬 Skybase Studios — Official Production Crew Applications')
    .setDescription(
      `### 🟢 Application Status: **NOW OPEN!**\n\n` +
      `Do you want to star in official Minecraft videos with **[Krylo MC](https://www.youtube.com/@krylomcyt?sub_confirmation=1)**?\n` +
      `We are actively recruiting passionate, talented, and reliable community members to join the Skybase Production Crew!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🎭 Available Crew Specializations:\n` +
      `• 🎬 **Actors & Participants:** Star in scripted scenes, survival challenges, and manhunts.\n` +
      `• 🔨 **Master Builders & Designers:** Build custom cinematic sets, arenas, and redstone traps.\n` +
      `• ⚡ **Tech & Redstone Engineers:** Create in-game contraptions, command blocks, and minigame mechanics.\n` +
      `• 🎙️ **Voice Actors & Extra Helpers:** Assist during live filming sessions and voice special roles.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### ⭐ What Roles & Perks Do You Unlock?\n` +
      `• **@🎬 Skybase Video Crew** role on your server profile!\n` +
      `• Access to private <#${CREW_LOUNGE_ID}> chat & production discussion.\n` +
      `• Access to <#${RECORDING_STUDIO_ID}> voice studio during live shoots.\n` +
      `• Star directly in YouTube videos seen by thousands of viewers!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 📌 Requirements:\n` +
      `• Active Minecraft Java or Bedrock account.\n` +
      `• Working microphone and ability to join voice comms during film shoots.\n` +
      `• Maturity, respect, and ability to follow director instructions.\n\n` +
      `*Click the button below to open the application form!*`
    )
    .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
    .setFooter({
      text: 'Krylo\'s Skybase • Production Applications Powered by Krims Code AI',
      iconURL: 'https://krims-code-chatbot.vercel.app/app_logo.jpg'
    })
    .setTimestamp();

  const buttonRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_open_crew_app_modal')
      .setLabel('Apply for Video Crew')
      .setEmoji('🎬')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('btn_open_early_access_modal')
      .setLabel('Apply for Early Access VIP')
      .setEmoji('🍿')
      .setStyle(ButtonStyle.Secondary)
  );

  return { embeds: [panelEmbed], components: [buttonRow] };
}

/**
 * Builds the Closed Application Panel Embed & Disabled Buttons (CLOSED)
 */
export function buildClosedApplicationPanel() {
  const closedEmbed = new EmbedBuilder()
    .setColor(0xEF4444) // Red for closed
    .setTitle('📋 Skybase Studios — Applications')
    .setDescription(
      `### 🔴 Application Status: **CURRENTLY CLOSED**\n\n` +
      `Thank you for your interest in joining the official **[Krylo MC](https://www.youtube.com/@krylomcyt?sub_confirmation=1)** Team & Video Production Crew!\n` +
      `Our team roster is currently full at this time, and official applications are **NOT** being accepted right now.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🎬 Team Roles (When Applications Reopen):\n` +
      `• 🛡️ **Staff & Moderators:** Chat moderation, ticket support, and server order.\n` +
      `• 🎭 **Actors & Participants:** Playing roles in video challenges, manhunts, and scripted scenarios.\n` +
      `• 🔨 **Master Builders:** Constructing video arenas, traps, and custom SMP set pieces.\n` +
      `• 🎥 **Replay Mod & Camera:** Capturing cinematic drone shots and angles.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 📣 Want to star in a video right now?\n` +
      `Krylo regularly recruits community members for one-off video sessions, challenges, and battles in **<#1550901948910141620>**!\n` +
      `• Keep an eye on <#1550901948910141620> and turn on channel notifications.\n` +
      `• When a recruitment call is announced, follow the instructions to jump into the recording!\n\n` +
      `🔔 *An announcement will be posted in <#1549882277209571329> as soon as applications reopen!*`
    )
    .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
    .setFooter({
      text: 'Krylo\'s Skybase • Applications Managed by Krims Code AI',
      iconURL: 'https://krims-code-chatbot.vercel.app/app_logo.jpg'
    })
    .setTimestamp();

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_app_closed_notice')
      .setLabel('🔒 Applications Currently Closed')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  return { embeds: [closedEmbed], components: [disabledRow] };
}

/**
 * Changes crew application state (open or closed) and updates live channel panel
 */
export async function setCrewAppStatus(open, guild, user) {
  let channel = null;
  if (guild) {
    channel = guild.channels.cache.get(CREW_APPLY_CHANNEL_ID) || await guild.channels.fetch(CREW_APPLY_CHANNEL_ID).catch(() => null);
  }
  if (!channel && guild?.client) {
    channel = await guild.client.channels.fetch(CREW_APPLY_CHANNEL_ID).catch(() => null);
  }

  if (!channel) {
    throw new Error(`Could not find channel #${CREW_APPLY_CHANNEL_ID}`);
  }

  const payload = open ? buildApplicationPanel() : buildClosedApplicationPanel();
  let targetMsg = null;
  const msgIdToUse = currentCrewAppStatus.messageId || CREW_APPLY_MSG_ID;

  try {
    targetMsg = await channel.messages.fetch(msgIdToUse);
  } catch (e) {
    // If not found by ID, try finding latest bot message
    const msgs = await channel.messages.fetch({ limit: 10 }).catch(() => null);
    if (msgs) {
      targetMsg = msgs.find(m => m.author.id === channel.client.user.id);
    }
  }

  if (targetMsg) {
    await targetMsg.edit(payload);
  } else {
    targetMsg = await channel.send(payload);
  }

  currentCrewAppStatus = {
    isOpen: !!open,
    lastUpdated: new Date().toISOString(),
    updatedBy: user ? user.id : 'system',
    messageId: targetMsg.id,
    channelId: channel.id
  };
  writeStatus(currentCrewAppStatus);

  return {
    success: true,
    isOpen: currentCrewAppStatus.isOpen,
    messageId: targetMsg.id,
    channelId: channel.id
  };
}

/**
 * Handles all Interaction events for Video Crew Applications
 */
export async function handleVideoCrewInteraction(interaction) {
  // Check if applications are open when attempting to open a modal
  if (
    interaction.isButton() && 
    (interaction.customId === 'btn_open_crew_app_modal' || interaction.customId === 'btn_open_early_access_modal')
  ) {
    if (!isCrewAppOpen()) {
      return await interaction.reply({
        content: '🔒 **Applications are currently closed!** The team roster is full at this time. Watch <#1550901948910141620> for filming recruitment calls and announcements when applications reopen! 🎬',
        ephemeral: true
      });
    }
  }

  // Check if applications are open when submitting a modal
  if (
    interaction.isModalSubmit() && 
    (interaction.customId === 'modal_submit_crew_app' || interaction.customId === 'modal_submit_early_access_app')
  ) {
    if (!isCrewAppOpen()) {
      return await interaction.reply({
        content: '🔒 **Applications closed before submission could be processed!** Please wait until applications reopen. 🎬',
        ephemeral: true
      });
    }
  }

  // ──────────────────────────────────────────────────────────
  // 1. OPEN CREW APPLICATION MODAL
  // ──────────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === 'btn_open_crew_app_modal') {
    const modal = new ModalBuilder()
      .setCustomId('modal_submit_crew_app')
      .setTitle('🎬 Skybase Film Crew Application');

    const ignInput = new TextInputBuilder()
      .setCustomId('app_ign')
      .setLabel('Minecraft IGN & Version (Java / Bedrock)')
      .setPlaceholder('e.g. Krylo_MC (Java 1.21.x)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(50)
      .setRequired(true);

    const roleInput = new TextInputBuilder()
      .setCustomId('app_role')
      .setLabel('Desired Role(s) (Actor / Builder / Redstone)')
      .setPlaceholder('e.g. Actor & Set Builder')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(60)
      .setRequired(true);

    const ageTzInput = new TextInputBuilder()
      .setCustomId('app_age_tz')
      .setLabel('Age & Timezone')
      .setPlaceholder('e.g. 16, EST / GMT / IST')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(40)
      .setRequired(true);

    const portfolioInput = new TextInputBuilder()
      .setCustomId('app_portfolio')
      .setLabel('Experience & Portfolio (Builds / Videos)')
      .setPlaceholder('Describe your Minecraft build/acting experience or link screenshots/clips')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(1000)
      .setRequired(true);

    const whyJoinInput = new TextInputBuilder()
      .setCustomId('app_why_join')
      .setLabel('Why do you want to join Krylo\'s Film Crew?')
      .setPlaceholder('Tell us about your enthusiasm and dedication to the team!')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(600)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ignInput),
      new ActionRowBuilder().addComponents(roleInput),
      new ActionRowBuilder().addComponents(ageTzInput),
      new ActionRowBuilder().addComponents(portfolioInput),
      new ActionRowBuilder().addComponents(whyJoinInput)
    );

    return await interaction.showModal(modal);
  }

  // ──────────────────────────────────────────────────────────
  // 2. OPEN EARLY ACCESS MODAL
  // ──────────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === 'btn_open_early_access_modal') {
    const modal = new ModalBuilder()
      .setCustomId('modal_submit_early_access_app')
      .setTitle('🍿 Early Access VIP Application');

    const ignInput = new TextInputBuilder()
      .setCustomId('ea_ign')
      .setLabel('Minecraft Username or Nickname')
      .setPlaceholder('e.g. SkyPilot_99')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(50)
      .setRequired(true);

    const whyInput = new TextInputBuilder()
      .setCustomId('ea_why')
      .setLabel('Why do you want Early Video Previews & Polls?')
      .setPlaceholder('How will you support video releases and provide constructive feedback?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(600)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ignInput),
      new ActionRowBuilder().addComponents(whyInput)
    );

    return await interaction.showModal(modal);
  }

  // ──────────────────────────────────────────────────────────
  // 3. SUBMIT CREW APPLICATION MODAL
  // ──────────────────────────────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === 'modal_submit_crew_app') {
    await interaction.deferReply({ ephemeral: true });

    const ign = interaction.fields.getTextInputValue('app_ign').trim();
    const role = interaction.fields.getTextInputValue('app_role').trim();
    const ageTz = interaction.fields.getTextInputValue('app_age_tz').trim();
    const portfolio = interaction.fields.getTextInputValue('app_portfolio').trim();
    const whyJoin = interaction.fields.getTextInputValue('app_why_join').trim();

    const reviewChannel = interaction.guild.channels.cache.get(REVIEW_CHANNEL_ID);
    if (reviewChannel) {
      const reviewEmbed = new EmbedBuilder()
        .setColor(0xFF4757)
        .setAuthor({
          name: `${interaction.user.tag} (${interaction.user.id})`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTitle('📋 New Application: 🎬 Skybase Video Crew')
        .setDescription(`A new candidate has applied to join the **Skybase Video Production Crew**!`)
        .addFields(
          { name: '👤 Applicant', value: `<@${interaction.user.id}> (\`${interaction.user.tag}\`)`, inline: true },
          { name: '🎮 Minecraft IGN', value: `\`${ign}\``, inline: true },
          { name: '🎭 Desired Role', value: `\`${role}\``, inline: true },
          { name: '🌍 Age & Timezone', value: `\`${ageTz}\``, inline: true },
          { name: '🏗️ Experience & Portfolio', value: portfolio },
          { name: '💡 Statement / Why Join', value: whyJoin },
          { name: '⚖️ Status', value: '🟡 **Pending Staff Review**', inline: true }
        )
        .setFooter({ text: `Application ID: crew_${interaction.user.id}` })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`btn_crew_accept_${interaction.user.id}`)
          .setLabel('Accept & Grant Crew Role')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`btn_crew_decline_${interaction.user.id}`)
          .setLabel('Decline Application')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Danger)
      );

      await reviewChannel.send({
        content: `🔔 <@${KRYLO_USER_ID}> **New Film Crew Application Received!**`,
        embeds: [reviewEmbed],
        components: [actionRow]
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('🎉 Application Submitted Successfully!')
      .setDescription(
        `Thank you **${interaction.user.username}**! Your application for the **🎬 Skybase Video Crew** has been forwarded directly to Krylo and the Skybase directors.\n\n` +
        `⏳ **Review Process:** Staff will review your submission shortly. If accepted, you will automatically receive the **@🎬 Skybase Video Crew** role and access to <#${CREW_LOUNGE_ID}>!`
      )
      .setFooter({ text: 'Krylo\'s Skybase • Production Management' })
      .setTimestamp();

    return await interaction.editReply({ embeds: [confirmEmbed] });
  }

  // ──────────────────────────────────────────────────────────
  // 4. SUBMIT EARLY ACCESS MODAL
  // ──────────────────────────────────────────────────────────
  if (interaction.isModalSubmit() && interaction.customId === 'modal_submit_early_access_app') {
    await interaction.deferReply({ ephemeral: true });

    const ign = interaction.fields.getTextInputValue('ea_ign').trim();
    const why = interaction.fields.getTextInputValue('ea_why').trim();

    const reviewChannel = interaction.guild.channels.cache.get(REVIEW_CHANNEL_ID);
    if (reviewChannel) {
      const reviewEmbed = new EmbedBuilder()
        .setColor(0xFFA502)
        .setAuthor({
          name: `${interaction.user.tag} (${interaction.user.id})`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTitle('🍿 New Application: Early Access VIP')
        .setDescription(`A community member has applied for **Skybase Early Access VIP**!`)
        .addFields(
          { name: '👤 Applicant', value: `<@${interaction.user.id}> (\`${interaction.user.tag}\`)`, inline: true },
          { name: '🎮 IGN / Nick', value: `\`${ign}\``, inline: true },
          { name: '💡 Statement / Why', value: why },
          { name: '⚖️ Status', value: '🟡 **Pending Staff Review**', inline: true }
        )
        .setFooter({ text: `Application ID: ea_${interaction.user.id}` })
        .setTimestamp();

      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`btn_ea_accept_${interaction.user.id}`)
          .setLabel('Accept & Grant Early Access')
          .setEmoji('✅')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId(`btn_ea_decline_${interaction.user.id}`)
          .setLabel('Decline')
          .setEmoji('❌')
          .setStyle(ButtonStyle.Danger)
      );

      await reviewChannel.send({
        content: `🔔 <@${KRYLO_USER_ID}> **New Early Access Application!**`,
        embeds: [reviewEmbed],
        components: [actionRow]
      });
    }

    const confirmEmbed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('🎉 Early Access Application Submitted!')
      .setDescription(
        `Thank you **${interaction.user.username}**! Your request for **🍿 Skybase Early Access** has been received by Krylo.`
      )
      .setTimestamp();

    return await interaction.editReply({ embeds: [confirmEmbed] });
  }

  // ──────────────────────────────────────────────────────────
  // 5. STAFF DECISION: ACCEPT CREW APPLICATION
  // ──────────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('btn_crew_accept_')) {
    const applicantId = interaction.customId.replace('btn_crew_accept_', '');

    // Check staff permission
    const isStaff = interaction.user.id === KRYLO_USER_ID ||
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
                    interaction.member.permissions.has(PermissionFlagsBits.ManageRoles);
    if (!isStaff) {
      return await interaction.reply({ content: '❌ Only Krylo and authorized Server Staff can approve applications!', ephemeral: true });
    }

    await interaction.deferUpdate();

    try {
      const member = await interaction.guild.members.fetch(applicantId).catch(() => null);
      if (member) {
        // Add Crew Role
        await member.roles.add(CREW_ROLE_ID, `Application approved by ${interaction.user.tag}`);

        // Send Acceptance DM to user
        const dmEmbed = new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle('🎉 Congratulations! You are accepted into the Skybase Film Crew!')
          .setDescription(
            `Hey **${member.user.username}**!\n\n` +
            `Your application has been **ACCEPTED** by **${interaction.user.username}**! You have been granted the **@🎬 Skybase Video Crew** role in **Krylo\'s Skybase**!\n\n` +
            `🚀 **What you have unlocked:**\n` +
            `• <#${CREW_LOUNGE_ID}> — Talk directly with Krylo and the film crew.\n` +
            `• <#${RECORDING_STUDIO_ID}> — Jump in voice comms during film shoots.\n\n` +
            `Welcome to the team! Make sure to say hi in the crew lounge!`
          )
          .setFooter({ text: 'Krylo\'s Skybase • Production Crew' })
          .setTimestamp();

        await member.send({ embeds: [dmEmbed] }).catch(() => {});

        // Broadcast welcome in crew-lounge
        const crewLounge = interaction.guild.channels.cache.get(CREW_LOUNGE_ID);
        if (crewLounge) {
          await crewLounge.send({
            content: `🎉 **Everyone welcome our newest Film Crew member:** <@${applicantId}>! *(Approved by <@${interaction.user.id}>)*`
          }).catch(() => {});
        }
      }

      // Update Staff Review Embed
      const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      oldEmbed.setColor(0x10B981);
      const fields = oldEmbed.data.fields.map(f => {
        if (f.name.includes('Status')) {
          return { name: '⚖️ Status', value: `✅ **APPROVED** by <@${interaction.user.id}> on <t:${Math.floor(Date.now() / 1000)}:R>`, inline: true };
        }
        return f;
      });
      oldEmbed.setFields(fields);

      await interaction.editReply({
        embeds: [oldEmbed],
        components: []
      });
    } catch (err) {
      console.error('[Crew Accept Error]', err);
    }
    return;
  }

  // ──────────────────────────────────────────────────────────
  // 6. STAFF DECISION: DECLINE CREW APPLICATION
  // ──────────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('btn_crew_decline_')) {
    const applicantId = interaction.customId.replace('btn_crew_decline_', '');

    const isStaff = interaction.user.id === KRYLO_USER_ID ||
                    interaction.member.permissions.has(PermissionFlagsBits.Administrator) ||
                    interaction.member.permissions.has(PermissionFlagsBits.ManageRoles);
    if (!isStaff) {
      return await interaction.reply({ content: '❌ Only Krylo and authorized Server Staff can review applications!', ephemeral: true });
    }

    await interaction.deferUpdate();

    try {
      const member = await interaction.guild.members.fetch(applicantId).catch(() => null);
      if (member) {
        const declineDm = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('🎬 Skybase Film Crew Application Update')
          .setDescription(
            `Hey **${member.user.username}**,\n\n` +
            `Thank you for applying for the **🎬 Skybase Video Crew** in **Krylo\'s Skybase**.\n` +
            `At this time, we have decided not to proceed with your application. Don\'t be discouraged! You are always welcome to participate in public casting calls in <#1550901948910141620> and re-apply in future recruitment rounds!`
          )
          .setTimestamp();
        await member.send({ embeds: [declineDm] }).catch(() => {});
      }

      const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      oldEmbed.setColor(0xEF4444);
      const fields = oldEmbed.data.fields.map(f => {
        if (f.name.includes('Status')) {
          return { name: '⚖️ Status', value: `❌ **DECLINED** by <@${interaction.user.id}> on <t:${Math.floor(Date.now() / 1000)}:R>`, inline: true };
        }
        return f;
      });
      oldEmbed.setFields(fields);

      await interaction.editReply({
        embeds: [oldEmbed],
        components: []
      });
    } catch (err) {
      console.error('[Crew Decline Error]', err);
    }
    return;
  }

  // ──────────────────────────────────────────────────────────
  // 7. STAFF DECISION: ACCEPT EARLY ACCESS
  // ──────────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('btn_ea_accept_')) {
    const applicantId = interaction.customId.replace('btn_ea_accept_', '');
    const isStaff = interaction.user.id === KRYLO_USER_ID || interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isStaff) {
      return await interaction.reply({ content: '❌ Only Krylo and Admins can approve VIP Early Access!', ephemeral: true });
    }

    await interaction.deferUpdate();
    try {
      const member = await interaction.guild.members.fetch(applicantId).catch(() => null);
      if (member) {
        await member.roles.add(EARLY_ACCESS_ROLE_ID, `Early Access approved by ${interaction.user.tag}`);
        const dmEmbed = new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle('🍿 Early Access VIP Approved!')
          .setDescription(`Hey **${member.user.username}**, you have been granted **@🍿 Skybase Early Access**! Enjoy sneak peeks and video polls in <#1550901949853863942>!`)
          .setTimestamp();
        await member.send({ embeds: [dmEmbed] }).catch(() => {});
      }

      const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
      oldEmbed.setColor(0x10B981);
      const fields = oldEmbed.data.fields.map(f => {
        if (f.name.includes('Status')) {
          return { name: '⚖️ Status', value: `✅ **APPROVED** by <@${interaction.user.id}>`, inline: true };
        }
        return f;
      });
      oldEmbed.setFields(fields);
      await interaction.editReply({ embeds: [oldEmbed], components: [] });
    } catch (err) {}
    return;
  }

  // ──────────────────────────────────────────────────────────
  // 8. STAFF DECISION: DECLINE EARLY ACCESS
  // ──────────────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId.startsWith('btn_ea_decline_')) {
    const applicantId = interaction.customId.replace('btn_ea_decline_', '');
    const isStaff = interaction.user.id === KRYLO_USER_ID || interaction.member.permissions.has(PermissionFlagsBits.Administrator);
    if (!isStaff) {
      return await interaction.reply({ content: '❌ Only Krylo and Admins can review this!', ephemeral: true });
    }

    await interaction.deferUpdate();
    const oldEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    oldEmbed.setColor(0xEF4444);
    const fields = oldEmbed.data.fields.map(f => {
      if (f.name.includes('Status')) {
        return { name: '⚖️ Status', value: `❌ **DECLINED** by <@${interaction.user.id}>`, inline: true };
      }
      return f;
    });
    oldEmbed.setFields(fields);
    await interaction.editReply({ embeds: [oldEmbed], components: [] });
    return;
  }

  // Safety fallback for closed buttons or unhandled events
  if (!interaction.replied && !interaction.deferred) {
    return await interaction.reply({
      content: '🔒 **Applications are currently closed!** The team roster is full at this time. Watch <#1550901948910141620> for filming recruitment calls and announcements when applications reopen! 🎬',
      ephemeral: true
    }).catch(() => {});
  }
}
