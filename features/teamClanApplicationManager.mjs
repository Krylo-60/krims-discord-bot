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
const STATUS_FILE = path.join(__dirname, '..', 'data', 'clan_app_status.json');
const APPROVED_RECRUITS_FILE = path.join(__dirname, '..', 'data', 'approved_clan_recruits.json');

// The_Half_Lifes Constants
export const CLAN_GUILD_ID = '1557852594242719775';
export const CLAN_RECRUIT_ROLE_ID = '1557855852369813514'; // 🗡️ Clan Recruit
export const CLAN_LEADER_ROLE_ID = '1557855846094999572';  // 👑 Team Leader
export const CLAN_COLEADER_ROLE_ID = '1557855847500091443';// ⚔️ Co-Leader
export const CLAN_ADMIN_ROLE_ID = '1557865642659414132';   // ⚡ Clan Administrator
export const CLAN_STAFF_UPDATES_ID = '1557863149389095064'; // #📌・𝗌𝗍𝖺𝖿𝖿-𝗎𝗉𝖽𝖺𝗍𝖾𝗌
export const CLAN_STAFF_LOGS_ID = '1557865652281278604';   // #📋・𝖲taff-logs
export const CLAN_TEAM_CHAT_ID = '1557855867897127054';    // #💬・𝖳eam-chat
export const CLAN_CATEGORY_ID = '1557855860838109306';     // 📌 ─── TEAM DIRECTORY ───
export const CLAN_INVITE_URL = 'https://discord.gg/wDn4mSrcGj'; // Official Team Headquarters Invite

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
    console.error('[ClanAppStatus] Failed to write status file:', e);
  }
}

let currentClanAppStatus = readStatus();

export function isClanAppOpen() {
  return currentClanAppStatus.isOpen !== false;
}

export function setClanAppStatus(isOpen) {
  currentClanAppStatus.isOpen = isOpen;
  currentClanAppStatus.lastUpdated = new Date().toISOString();
  writeStatus(currentClanAppStatus);
  return currentClanAppStatus;
}

export function getClanAppStatus() {
  return currentClanAppStatus;
}

export function readApprovedRecruits() {
  try {
    if (fs.existsSync(APPROVED_RECRUITS_FILE)) {
      return JSON.parse(fs.readFileSync(APPROVED_RECRUITS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return [];
}

export function addApprovedRecruit(userId) {
  const recruits = readApprovedRecruits();
  if (!recruits.includes(userId)) {
    recruits.push(userId);
    try {
      const dir = path.dirname(APPROVED_RECRUITS_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(APPROVED_RECRUITS_FILE, JSON.stringify(recruits, null, 2), 'utf-8');
    } catch (e) {
      console.error('[ApprovedRecruits] Failed to write file:', e);
    }
  }
}

/**
 * Checks if a newly joined guild member was an approved recruit and automatically assigns the Clan Recruit role.
 */
export async function checkAndAssignApprovedRecruit(member) {
  if (!member || member.guild.id !== CLAN_GUILD_ID) return false;
  const recruits = readApprovedRecruits();
  if (recruits.includes(member.id)) {
    if (!member.roles.cache.has(CLAN_RECRUIT_ROLE_ID)) {
      await member.roles.add(CLAN_RECRUIT_ROLE_ID).catch(() => {});
      console.log(`[ClanApp] Auto-granted 🗡️ Clan Recruit role to newly joined approved member: ${member.user.tag}`);
    }
    return true;
  }
  return false;
}

/**
 * Builds the official Team Application Dispatch panel embed with interactive button
 */
export function buildTeamApplicationPanel() {
  const isOpen = isClanAppOpen();

  const embed = new EmbedBuilder()
    .setColor(isOpen ? 0xFFD700 : 0x7F1D1D)
    .setTitle('✨ THE LIGHT BEARERS — OFFICIAL GUILD RECRUITMENT')
    .setDescription(
      `Welcome to **The Light Bearers** official recruitment portal!\n\n` +
      `We are a united, competitive Minecraft SMP guild dedicated to being a light in the dark. We stand against bullies and griefers, engineer subterranean sanctuaries, master automated redstone farms, and grind resources as one family.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 📋 RECRUITMENT REQUIREMENTS:\n` +
      `• **Active SMP Player:** Plays actively on our target SMP (Elite SMP).\n` +
      `• **Guild Loyalty:** Unbreakable trust — **never** leak base coordinates or betray guild members.\n` +
      `• **Team First:** Respectful, focused on guild progress, and ready to stand with us.\n` +
      `• **Voice & Comms:** Active in Discord text & voice during key operations.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🎯 AVAILABLE ROLES:\n` +
      `• 🛡️ **Guardian / Base Defender** — Combat protection, counter-raids & frontline defense.\n` +
      `• 🏗️ **Architect / Sanctuary Builder** — Underground base design, vaults & aesthetics.\n` +
      `• ⚡ **Redstone Engineer** — Traps, blast doors & automated farms.\n` +
      `• ⛏️ **Miner & Merchant** — Underground resource harvesting, gear supply & trading.\n\n` +
      (isOpen 
        ? `👉 *Click the button below to fill out your entry questionnaire! Once approved by Guild Leadership, you will receive a private DM with the invite link to join the team!*` 
        : `🔒 *Recruitment is currently closed by Guild Leadership. Check back soon!*`)
    )
    .setThumbnail('https://cdn.discordapp.com/emojis/1561391538355961997.png')
    .setFooter({ text: 'The Light Bearers • Autonomous Recruitment Matrix' })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId('btn_open_clan_app_modal')
    .setLabel(isOpen ? '✨ Apply to The Light Bearers' : '🔒 Applications Closed')
    .setStyle(isOpen ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(!isOpen);

  const row = new ActionRowBuilder().addComponents(button);
  return { embeds: [embed], components: [row] };
}

/**
 * Sets up the dedicated recruitment channel in The_Half_Lifes server
 */
export async function setupTeamApplicationChannel(guild) {
  if (!guild || guild.id !== CLAN_GUILD_ID) return null;

  const channels = await guild.channels.fetch();
  let ch = channels.get('1561393934653980795') || channels.find(c => 
    c && c.type === ChannelType.GuildText && (
      c.name.includes('𝗍𝖾𝖺𝗆-𝖺𝗉𝗉𝗅𝗒') || 
      c.name.toLowerCase().includes('team-apply') || 
      c.name.toLowerCase().includes('clan-apply') ||
      c.name.toLowerCase().includes('apply')
    )
  );
  
  if (!ch) {
    ch = await guild.channels.create({
      name: '📝・𝗍𝖾𝖺𝗆-𝖺𝗉𝗉𝗅𝗒',
      type: ChannelType.GuildText,
      parent: CLAN_CATEGORY_ID,
      topic: 'Official Recruitment Portal for The Light Bearers SMP guild. Click the button to apply!',
      permissionOverwrites: [
        {
          id: guild.roles?.everyone?.id || guild.id,
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

  const panel = buildTeamApplicationPanel();
  const sentMsg = await ch.send(panel);

  currentClanAppStatus.channelId = ch.id;
  currentClanAppStatus.messageId = sentMsg.id;
  currentClanAppStatus.lastUpdated = new Date().toISOString();
  writeStatus(currentClanAppStatus);

  return { channel: ch, message: sentMsg };
}

/**
 * Handles all Button and Modal interactions for Team Clan Applications
 */
export async function handleTeamClanApplicationInteraction(interaction) {
  // 1. OPEN APPLICATION MODAL POPUP
  if (interaction.isButton() && interaction.customId === 'btn_open_clan_app_modal') {
    if (!isClanAppOpen()) {
      return await interaction.reply({
        content: '🔒 **Applications are currently closed by Clan Leadership.** Please check back later!',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_submit_clan_app')
      .setTitle('The Light Bearers Guild Application');

    const ignInput = new TextInputBuilder()
      .setCustomId('clan_app_ign')
      .setLabel('Minecraft IGN & Version (Java / Bedrock)')
      .setPlaceholder('e.g. st1LLkill3r (Java 1.21.x)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(50)
      .setRequired(true);

    const specialtyInput = new TextInputBuilder()
      .setCustomId('clan_app_specialty')
      .setLabel('Primary Role / Specialty')
      .setPlaceholder('Guardian/PvP, Base Builder, Redstone, Merchant/Grinder')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(60)
      .setRequired(true);

    const activityInput = new TextInputBuilder()
      .setCustomId('clan_app_activity')
      .setLabel('Daily Activity & Timezone')
      .setPlaceholder('e.g. 2-4 hours/day, EST / GMT / IST')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(40)
      .setRequired(true);

    const expInput = new TextInputBuilder()
      .setCustomId('clan_app_experience')
      .setLabel('Building / Defense / SMP Skills & Experience')
      .setPlaceholder('Describe your building, redstone, defense, or faction experience')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(800)
      .setRequired(true);

    const whyInput = new TextInputBuilder()
      .setCustomId('clan_app_why')
      .setLabel('Why join The Light Bearers? (How will you help?)')
      .setPlaceholder('How will you stand with us to build a better community?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(800)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ignInput),
      new ActionRowBuilder().addComponents(specialtyInput),
      new ActionRowBuilder().addComponents(activityInput),
      new ActionRowBuilder().addComponents(expInput),
      new ActionRowBuilder().addComponents(whyInput)
    );

    return await interaction.showModal(modal);
  }

  // 2. MODAL SUBMISSION HANDLER
  if (interaction.isModalSubmit() && interaction.customId === 'modal_submit_clan_app') {
    const ign = interaction.fields.getTextInputValue('clan_app_ign').trim();
    const specialty = interaction.fields.getTextInputValue('clan_app_specialty').trim();
    const activity = interaction.fields.getTextInputValue('clan_app_activity').trim();
    const experience = interaction.fields.getTextInputValue('clan_app_experience').trim();
    const why = interaction.fields.getTextInputValue('clan_app_why').trim();

    await interaction.reply({
      content: 
        `✨ **Application Successfully Submitted!**\n\n` +
        `Thank you **${interaction.user.username}**! Your entry application for **The Light Bearers** has been delivered directly to Guild Leadership in the updates terminal.\n` +
        `Our leaders (<@&${CLAN_LEADER_ROLE_ID}> & <@&${CLAN_COLEADER_ROLE_ID}>) will review your responses. Once approved, you will receive an automated private DM with the official guild invite link! 🛡️✨`,
      ephemeral: true
    });

    // Send application embed directly to #📌・𝗌𝗍𝖺𝖿𝖿-𝗎𝗉𝖽𝖺𝗍𝖾𝗌 (and #📋・𝖲taff-logs)
    try {
      const clanGuild = interaction.client.guilds.cache.get(CLAN_GUILD_ID);
      if (clanGuild) {
        const updatesChannel = clanGuild.channels.cache.get(CLAN_STAFF_UPDATES_ID) ||
                              clanGuild.channels.cache.find(c => c.name.includes('staff-updates') || c.name.includes('updates-and-progress')) ||
                              clanGuild.channels.cache.get(CLAN_STAFF_LOGS_ID);

        if (updatesChannel) {
          const reviewEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('📥 NEW CANDIDATE ENTRY APPLICATION RECEIVED')
            .setDescription(
              `A new candidate has submitted their entry application to join **The Light Bearers**!\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `👤 **Applicant:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)\n` +
              `🆔 **User ID:** \`${interaction.user.id}\`\n` +
              `🎮 **Minecraft IGN:** **\`${ign}\`**\n` +
              `✨ **Specialty / Role:** \`${specialty}\`\n` +
              `🕒 **Activity & Timezone:** \`${activity}\`\n\n` +
              `📜 **Building & Defense Experience:**\n> ${experience.replace(/\n/g, '\n> ')}\n\n` +
              `🤝 **Why Join The Light Bearers:**\n> ${why.replace(/\n/g, '\n> ')}\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `*Click "Accept & Send Invite" to automatically dispatch the private guild invite link to the user's DMs!*`
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'The Light Bearers • Leadership Review Matrix' })
            .setTimestamp();

          const actionRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId(`btn_clan_accept_${interaction.user.id}`)
              .setLabel('Accept & Send Server Invite')
              .setStyle(ButtonStyle.Success)
              .setEmoji('✅'),
            new ButtonBuilder()
              .setCustomId(`btn_clan_deny_${interaction.user.id}`)
              .setLabel('Decline')
              .setStyle(ButtonStyle.Danger)
              .setEmoji('❌')
          );

          await updatesChannel.send({
            content: `🔔 <@&${CLAN_LEADER_ROLE_ID}> <@&${CLAN_COLEADER_ROLE_ID}> **New Candidate Application:** <@${interaction.user.id}> (\`${ign}\`)!`,
            embeds: [reviewEmbed],
            components: [actionRow]
          });
        }
      }
    } catch (err) {
      console.error('[ClanApp] Failed to route application to updates channel:', err);
    }
    return;
  }

  // 3. STAFF BUTTONS: ACCEPT OR DECLINE
  if (interaction.isButton() && (interaction.customId.startsWith('btn_clan_accept_') || interaction.customId.startsWith('btn_clan_deny_'))) {
    const isAccept = interaction.customId.startsWith('btn_clan_accept_');
    const targetUserId = interaction.customId.replace(isAccept ? 'btn_clan_accept_' : 'btn_clan_deny_', '');

    // Authorization: Must have Leader, Co-Leader, Admin role or be Krylo / Admin perm
    const member = interaction.member;
    const isAuthorized = 
      interaction.user.id === KRYLO_USER_ID ||
      member?.permissions?.has(PermissionFlagsBits.Administrator) ||
      member?.roles?.cache?.has(CLAN_LEADER_ROLE_ID) ||
      member?.roles?.cache?.has(CLAN_COLEADER_ROLE_ID) ||
      member?.roles?.cache?.has(CLAN_ADMIN_ROLE_ID);

    if (!isAuthorized) {
      return await interaction.reply({
        content: '❌ **Permission Denied:** Only Clan Leaders and Administrators can review team applications.',
        ephemeral: true
      });
    }

    const clanGuild = interaction.client.guilds.cache.get(CLAN_GUILD_ID);
    const targetUser = await interaction.client.users.fetch(targetUserId).catch(() => null);
    const targetMember = clanGuild ? await clanGuild.members.fetch(targetUserId).catch(() => null) : null;

    if (isAccept) {
      // 1. Add to Approved Recruits store so auto-role triggers on join
      addApprovedRecruit(targetUserId);

      // 2. If already in guild, assign role immediately
      if (targetMember) {
        await targetMember.roles.add(CLAN_RECRUIT_ROLE_ID).catch(() => {});
      }

      // 3. Send DM to the candidate with the Team Server Invite Link!
      let dmSent = false;
      if (targetUser) {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('🎉 CONGRATULATIONS! WELCOME TO THE LIGHT BEARERS! ✨')
          .setDescription(
            `Hey **${targetUser.username}**, your application to join **The Light Bearers** has been **ACCEPTED** by <@${interaction.user.id}>!\n\n` +
            `You have been granted access to our private guild sanctuary.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🔗 **YOUR OFFICIAL GUILD INVITE LINK:**\n` +
            `👉 **${CLAN_INVITE_URL}**\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
            `### 🚀 NEXT STEPS:\n` +
            `1. Click the link above to join our private server.\n` +
            `2. You will be automatically awarded the **<@&${CLAN_RECRUIT_ROLE_ID}>** rank.\n` +
            `3. Introduce yourself to the guild in <#${CLAN_TEAM_CHAT_ID}>!\n` +
            `4. Read our guild creed and server rules in <#1557855862146465922>.\n\n` +
            `*Remember: Be a light in the darkness. Never leak base coordinates.* ✨🛡️`
          )
          .setThumbnail('https://cdn.discordapp.com/emojis/1561391538355961997.png')
          .setTimestamp();

        try {
          await targetUser.send({ embeds: [dmEmbed] });
          dmSent = true;
        } catch (e) {
          console.warn('[ClanApp] Could not DM candidate:', e.message);
        }
      }

      // 4. Post announcement in Team Chat if member is already inside
      if (targetMember && clanGuild) {
        try {
          const teamChat = clanGuild.channels.cache.get(CLAN_TEAM_CHAT_ID);
          if (teamChat) {
            const welcomeSquadEmbed = new EmbedBuilder()
              .setColor(0x10B981)
              .setTitle('⚔️ NEW SQUAD RECRUIT ENLISTED!')
              .setDescription(
                `Give a warm squad welcome to our newest member, <@${targetUserId}>!\n\n` +
                `• **Rank:** **🗡️ Clan Recruit**\n` +
                `• **Recruited By:** <@${interaction.user.id}>\n\n` +
                `Welcome to **The Half Life's**! May our streak never fall. 🚀`
              )
              .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
              .setTimestamp();

            await teamChat.send({ content: `🎉 Welcome <@${targetUserId}> to the team!`, embeds: [welcomeSquadEmbed] });
          }
        } catch (e) {}
      }

      // 5. Update the review card in updates channel to Green
      const origEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(origEmbed)
        .setColor(0x10B981)
        .setTitle('✅ APPLICATION APPROVED — INVITE LINK SENT VIA DM')
        .addFields({
          name: '🎯 Decision & DM Status',
          value: `**ACCEPTED** by <@${interaction.user.id}> on <t:${Math.floor(Date.now() / 1000)}:R>\n` +
                 `📨 **DM Status:** ${dmSent ? '✅ Server invite link successfully sent to applicant\'s DM!' : '⚠️ Applicant DMs were closed; invite generated: ' + CLAN_INVITE_URL}`,
          inline: false
        });

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_clan_accepted_disabled')
          .setLabel('Accepted & Invite Sent')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅')
          .setDisabled(true)
      );

      return await interaction.update({
        content: `✅ **Application Approved by <@${interaction.user.id}> • Invite Dispatched!**`,
        embeds: [updatedEmbed],
        components: [disabledRow]
      });

    } else {
      // 1. Decline handling - send polite DM
      if (targetUser) {
        const dmDecline = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('🛡️ The Half Life\'s — Application Update')
          .setDescription(
            `Hello **${targetUser.username}**,\n\n` +
            `Thank you for taking the time to apply for **The Half Life's**.\n\n` +
            `After review by Clan Leadership, our roster is currently full or not onboarding additional recruits for this role at this time.\n\n` +
            `We encourage you to stay active in our community and apply again in upcoming recruitment rounds! ⚔️`
          )
          .setTimestamp();

        try {
          await targetUser.send({ embeds: [dmDecline] });
        } catch (e) {}
      }

      // 2. Update review card in updates channel to Red
      const origEmbed = interaction.message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(origEmbed)
        .setColor(0xEF4444)
        .setTitle('❌ APPLICATION DECLINED')
        .addFields({
          name: '🎯 Decision',
          value: `**DECLINED** by <@${interaction.user.id}> on <t:${Math.floor(Date.now() / 1000)}:R>\n` +
                 `📨 Candidate notified via DM.`,
          inline: false
        });

      const disabledRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_clan_declined_disabled')
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
