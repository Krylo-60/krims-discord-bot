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

// The Light Bearers Constants
export const CLAN_GUILD_ID = '1557852594242719775';
export const CLAN_RECRUIT_ROLE_ID = '1557855852369813514'; // 🗡️ Clan Recruit
export const CLAN_LEADER_ROLE_ID = '1557855846094999572';  // 👑 Team Leader (Jonesy)
export const CLAN_COLEADER_ROLE_ID = '1557855847500091443';// ⚔️ Co-Leader (KryloMCYT)
export const CLAN_ADMIN_ROLE_ID = '1557865642659414132';   // ⚡ Clan Administrator
export const CLAN_STAFF_UPDATES_ID = '1557863149389095064'; // #📌・𝗌𝗍𝖺𝖿𝖿-𝗎𝗉𝖽𝖺𝗍𝖾𝗌
export const CLAN_STAFF_LOGS_ID = '1557865652281278604';   // #📋・𝖲taff-logs
export const CLAN_TEAM_CHAT_ID = '1557855867897127054';    // #💬・𝖳eam-chat
export const CLAN_CATEGORY_ID = '1557855860838109306';     // 📌 ─── TEAM DIRECTORY ───
export const CLAN_INVITE_URL = 'https://discord.gg/wDn4mSrcGj'; // Official Team Headquarters Invite

const KRYLO_USER_ID = '1414143825538191373';
const KRYLO_SECONDARY_ID = '1541508115302719512';

// In-Memory Multi-Stage Application Drafts (Auto-expires after 2 hours)
const clanAppDrafts = new Map();

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
      `We are a united, competitive Minecraft SMP guild dedicated to being a beacon of light in the darkness. We stand against bullies and griefers, engineer subterranean sanctuaries, master automated redstone farms, and grind resources as one family.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 📋 RECRUITMENT REQUIREMENTS:\n` +
      `• **Active SMP Player:** Plays actively on our target SMP (Elite SMP).\n` +
      `• **Guild Loyalty:** Unbreakable trust — **never** leak base coordinates or betray teammates.\n` +
      `• **Team Culture:** Mature, respectful, focused on team growth, and ready to stand with us.\n` +
      `• **Voice & Comms:** Active in Discord text & voice during key operations.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🎯 AVAILABLE ROLES:\n` +
      `• 🛡️ **Guardian / Base Defender** — Combat defense, counter-raids & frontline security.\n` +
      `• 🏗️ **Architect / Sanctuary Builder** — Underground base design, secret vaults & aesthetics.\n` +
      `• ⚡ **Redstone Engineer** — Blast doors, automated sorters & resource farms.\n` +
      `• ⛏️ **Miner & Merchant** — Subterranean resource harvesting, gear supply & trading.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      (isOpen 
        ? `👉 **Candidate Questionnaire (12 Questions):**\n` +
          `Click the button below to begin your comprehensive 12-question application across 3 fast stages. Once submitted, Clan Leadership (<@&${CLAN_LEADER_ROLE_ID}> & <@&${CLAN_COLEADER_ROLE_ID}>) will review your dossier and dispatch your private invite link via DM!` 
        : `🔒 *Recruitment is currently closed by Guild Leadership. Check back soon!*`)
    )
    .setImage('attachment://the_light_bearers_banner.jpg')
    .setFooter({ text: 'The Light Bearers • Autonomous Recruitment Matrix' })
    .setTimestamp();

  const button = new ButtonBuilder()
    .setCustomId('btn_open_clan_app_modal')
    .setLabel(isOpen ? '✨ Apply to The Light Bearers (12 Questions)' : '🔒 Applications Closed')
    .setStyle(isOpen ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(!isOpen);

  const row = new ActionRowBuilder().addComponents(button);
  return { embeds: [embed], components: [row] };
}

/**
 * Sets up the dedicated recruitment channel in The Light Bearers server
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
  const bannerPath = path.join(__dirname, '..', 'assets', 'the_light_bearers_banner.jpg');
  const files = fs.existsSync(bannerPath) ? [bannerPath] : [];

  const sentMsg = await ch.send({
    embeds: panel.embeds,
    components: panel.components,
    files
  });

  currentClanAppStatus.channelId = ch.id;
  currentClanAppStatus.messageId = sentMsg.id;
  currentClanAppStatus.lastUpdated = new Date().toISOString();
  writeStatus(currentClanAppStatus);

  return { channel: ch, message: sentMsg };
}

/**
 * Handles all Button and Modal interactions for Team Clan Applications (12 Questions across 3 stages)
 */
export async function handleTeamClanApplicationInteraction(interaction) {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 1: TRIGGER INITIAL MODAL (QUESTIONS 1 - 4)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (interaction.isButton() && interaction.customId === 'btn_open_clan_app_modal') {
    if (!isClanAppOpen()) {
      return await interaction.reply({
        content: '🔒 **Applications are currently closed by Clan Leadership.** Please check back later!',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_clan_app_stage_1')
      .setTitle('The Light Bearers App • Part 1/3');

    const ignInput = new TextInputBuilder()
      .setCustomId('clan_app_ign')
      .setLabel('1. Minecraft IGN & Edition (Java / Bedrock)')
      .setPlaceholder('e.g. KryloMCYT (Java 1.21.x)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(50)
      .setRequired(true);

    const ageInput = new TextInputBuilder()
      .setCustomId('clan_app_age')
      .setLabel('2. Your Age')
      .setPlaceholder('e.g. 15, 17, 20')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(10)
      .setRequired(true);

    const activityInput = new TextInputBuilder()
      .setCustomId('clan_app_activity')
      .setLabel('3. Timezone & Daily Active Hours')
      .setPlaceholder('e.g. 3-5 hrs/day, EST / GMT / IST')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(50)
      .setRequired(true);

    const referrerInput = new TextInputBuilder()
      .setCustomId('clan_app_referrer')
      .setLabel('4. Who told you about us / Referral source?')
      .setPlaceholder('e.g. Jonesy, Krylo, Friend in game, Server listing')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(80)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ignInput),
      new ActionRowBuilder().addComponents(ageInput),
      new ActionRowBuilder().addComponents(activityInput),
      new ActionRowBuilder().addComponents(referrerInput)
    );

    return await interaction.showModal(modal);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 1 SUBMIT -> STORE Q1-4 & PROMPT STAGE 2
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (interaction.isModalSubmit() && interaction.customId === 'modal_clan_app_stage_1') {
    const ign = interaction.fields.getTextInputValue('clan_app_ign').trim();
    const age = interaction.fields.getTextInputValue('clan_app_age').trim();
    const activity = interaction.fields.getTextInputValue('clan_app_activity').trim();
    const referrer = interaction.fields.getTextInputValue('clan_app_referrer').trim();

    clanAppDrafts.set(interaction.user.id, {
      userId: interaction.user.id,
      userTag: interaction.user.tag,
      ign,
      age,
      activity,
      referrer,
      createdAt: Date.now()
    });

    const p1Embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('✨ PART 1/3 COMPLETE — IDENTITY & TIMEZONE')
      .setDescription(
        `Great start, **${interaction.user.username}**! Your initial details have been saved:\n\n` +
        `• 🎮 **Minecraft IGN:** \`${ign}\`\n` +
        `• 🎂 **Age:** \`${age}\`\n` +
        `• 🕒 **Timezone / Active:** \`${activity}\`\n` +
        `• 📢 **Referred By:** \`${referrer}\`\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👉 **Next Step:** Click the button below to answer **Questions 5 - 8** regarding your SMP skills, combat level, and specialty!`
      )
      .setFooter({ text: 'The Light Bearers Application • Stage 1 of 3 Saved' });

    const nextRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_open_clan_app_stage_2')
        .setLabel('⚔️ Continue to Part 2: Skills & Roles (Q5-8)')
        .setStyle(ButtonStyle.Success)
    );

    return await interaction.reply({
      embeds: [p1Embed],
      components: [nextRow],
      ephemeral: true
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 2: TRIGGER MODAL (QUESTIONS 5 - 8)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (interaction.isButton() && interaction.customId === 'btn_open_clan_app_stage_2') {
    const draft = clanAppDrafts.get(interaction.user.id);
    if (!draft) {
      return await interaction.reply({
        content: '⚠️ **Session Expired:** Please click **Apply to The Light Bearers** again in <#1561393934653980795> to start fresh.',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_clan_app_stage_2')
      .setTitle('The Light Bearers App • Part 2/3');

    const whyInput = new TextInputBuilder()
      .setCustomId('clan_app_why')
      .setLabel('5. Why do you want to join The Light Bearers?')
      .setPlaceholder('How will you stand with us to be a light in the dark and help our guild?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(600)
      .setRequired(true);

    const specialtyInput = new TextInputBuilder()
      .setCustomId('clan_app_specialty')
      .setLabel('6. Primary Role / Specialty')
      .setPlaceholder('Guardian/PvP, Sanctuary Builder, Redstone Engineer, Merchant/Grinder')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(60)
      .setRequired(true);

    const pvpInput = new TextInputBuilder()
      .setCustomId('clan_app_pvp')
      .setLabel('7. PvP & Combat Skill Level (1-10)')
      .setPlaceholder('e.g. 8/10 — experienced in sword, shield, mace, potion, or crystal combat')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(100)
      .setRequired(true);

    const buildingInput = new TextInputBuilder()
      .setCustomId('clan_app_building')
      .setLabel('8. Underground Sanctuary & Redstone Skills')
      .setPlaceholder('Describe underground bases, hidden vaults, traps, or automated farms you built')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(600)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(whyInput),
      new ActionRowBuilder().addComponents(specialtyInput),
      new ActionRowBuilder().addComponents(pvpInput),
      new ActionRowBuilder().addComponents(buildingInput)
    );

    return await interaction.showModal(modal);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 2 SUBMIT -> STORE Q5-8 & PROMPT STAGE 3
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (interaction.isModalSubmit() && interaction.customId === 'modal_clan_app_stage_2') {
    const draft = clanAppDrafts.get(interaction.user.id) || { userId: interaction.user.id };
    draft.why = interaction.fields.getTextInputValue('clan_app_why').trim();
    draft.specialty = interaction.fields.getTextInputValue('clan_app_specialty').trim();
    draft.pvp = interaction.fields.getTextInputValue('clan_app_pvp').trim();
    draft.building = interaction.fields.getTextInputValue('clan_app_building').trim();
    clanAppDrafts.set(interaction.user.id, draft);

    const p2Embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('⚔️ PART 2/3 COMPLETE — SKILLS & SPECIALTY')
      .setDescription(
        `Excellent progress, **${interaction.user.username}**! Your combat & sanctuary skills have been logged:\n\n` +
        `• 🛡️ **Role Specialty:** \`${draft.specialty}\`\n` +
        `• ⚔️ **PvP Rating:** \`${draft.pvp}\`\n` +
        `• 🏗️ **Building Experience:** Logged\n` +
        `• 💡 **Motivation:** Logged\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👉 **Final Step:** Click the button below to answer **Questions 9 - 12** regarding previous clans, voice comms, and the guild loyalty pledge!`
      )
      .setFooter({ text: 'The Light Bearers Application • Stage 2 of 3 Saved' });

    const nextRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_open_clan_app_stage_3')
        .setLabel('📜 Complete Part 3: History & Loyalty Pledge (Q9-12)')
        .setStyle(ButtonStyle.Success)
    );

    return await interaction.reply({
      embeds: [p2Embed],
      components: [nextRow],
      ephemeral: true
    });
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 3: TRIGGER MODAL (QUESTIONS 9 - 12)
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (interaction.isButton() && interaction.customId === 'btn_open_clan_app_stage_3') {
    const draft = clanAppDrafts.get(interaction.user.id);
    if (!draft) {
      return await interaction.reply({
        content: '⚠️ **Session Expired:** Please click **Apply to The Light Bearers** again in <#1561393934653980795> to start fresh.',
        ephemeral: true
      });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_clan_app_stage_3')
      .setTitle('The Light Bearers App • Part 3/3');

    const historyInput = new TextInputBuilder()
      .setCustomId('clan_app_history')
      .setLabel('9. Past SMPs, Clans & Reputation (Any Bans?)')
      .setPlaceholder('What servers or teams have you played with? Any previous bans or drama?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(600)
      .setRequired(true);

    const micInput = new TextInputBuilder()
      .setCustomId('clan_app_mic')
      .setLabel('10. Working Microphone & Voice Comms? (Yes/No)')
      .setPlaceholder('Yes / No — can you speak and listen in Voice Channels during operations?')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(40)
      .setRequired(true);

    const defenseInput = new TextInputBuilder()
      .setCustomId('clan_app_defense')
      .setLabel('11. How will you protect against griefers?')
      .setPlaceholder('How will you stand up for victims and maintain our sanctuary security?')
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(600)
      .setRequired(true);

    const loyaltyInput = new TextInputBuilder()
      .setCustomId('clan_app_loyalty')
      .setLabel('12. Loyalty Pledge: Never leak coords / betray?')
      .setPlaceholder('Type "I AGREE" to swear absolute guild loyalty and anti-betrayal covenant')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(30)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(historyInput),
      new ActionRowBuilder().addComponents(micInput),
      new ActionRowBuilder().addComponents(defenseInput),
      new ActionRowBuilder().addComponents(loyaltyInput)
    );

    return await interaction.showModal(modal);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAGE 3 SUBMIT -> COMPILE MASTER 12-QUESTION DOSSIER
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (interaction.isModalSubmit() && interaction.customId === 'modal_clan_app_stage_3') {
    const draft = clanAppDrafts.get(interaction.user.id) || { userId: interaction.user.id };
    draft.history = interaction.fields.getTextInputValue('clan_app_history').trim();
    draft.mic = interaction.fields.getTextInputValue('clan_app_mic').trim();
    draft.defense = interaction.fields.getTextInputValue('clan_app_defense').trim();
    draft.loyalty = interaction.fields.getTextInputValue('clan_app_loyalty').trim();

    // Reply confirmation to candidate
    await interaction.reply({
      content: 
        `🎉 **Application Successfully Completed & Submitted!**\n\n` +
        `Thank you **${interaction.user.username}**! All **12 recruitment questions** have been recorded and delivered directly to Guild Leadership.\n\n` +
        `Our leaders (<@&${CLAN_LEADER_ROLE_ID}> & <@&${CLAN_COLEADER_ROLE_ID}>) will review your dossier. Once approved, you will receive an automated private DM containing your official server invite link! ✨🛡️`,
      ephemeral: true
    });

    // Send Full 12-Question Dossier to #📌・𝗌𝗍𝖺𝖿𝖿-𝗎𝗉𝖽𝖺𝗍𝖾𝗌 & #📋・𝖲taff-logs
    try {
      const clanGuild = interaction.client.guilds.cache.get(CLAN_GUILD_ID);
      if (clanGuild) {
        const updatesChannel = clanGuild.channels.cache.get(CLAN_STAFF_UPDATES_ID) ||
                              clanGuild.channels.cache.find(c => c.name.includes('staff-updates') || c.name.includes('updates-and-progress')) ||
                              clanGuild.channels.cache.get(CLAN_STAFF_LOGS_ID);

        if (updatesChannel) {
          const dossierEmbed = new EmbedBuilder()
            .setColor(0xFFD700)
            .setTitle('📥 NEW 12-POINT CANDIDATE DOSSIER RECEIVED')
            .setDescription(
              `A candidate has completed the comprehensive **12-Question Entry Questionnaire** to join **The Light Bearers**!\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `### 👤 1. CANDIDATE PROFILE\n` +
              `• **Applicant:** <@${interaction.user.id}> (\`${interaction.user.tag}\`)\n` +
              `• **User ID:** \`${interaction.user.id}\`\n` +
              `• **Minecraft IGN:** **\`${draft.ign || 'N/A'}\`**\n` +
              `• **Age:** **\`${draft.age || 'N/A'}\`**\n` +
              `• **Timezone & Hours:** \`${draft.activity || 'N/A'}\`\n` +
              `• **Referred By:** \`${draft.referrer || 'N/A'}\`\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `### ⚔️ 2. SKILLS & PLAYSTYLE\n` +
              `• **Specialty Role:** \`${draft.specialty || 'N/A'}\`\n` +
              `• **PvP Skill (1-10):** \`${draft.pvp || 'N/A'}\`\n` +
              `• **Motivation / Why Join:**\n> ${String(draft.why || 'N/A').replace(/\n/g, '\n> ')}\n` +
              `• **Sanctuary & Redstone Building:**\n> ${String(draft.building || 'N/A').replace(/\n/g, '\n> ')}\n\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `### 🛡️ 3. HISTORY, COMMS & LOYALTY\n` +
              `• **Past SMPs & Reputation:**\n> ${String(draft.history || 'N/A').replace(/\n/g, '\n> ')}\n` +
              `• **Working Microphone / Voice:** \`${draft.mic || 'N/A'}\`\n` +
              `• **Anti-Griefing Defense Philosophy:**\n> ${String(draft.defense || 'N/A').replace(/\n/g, '\n> ')}\n` +
              `• **Loyalty Pledge (Never Leak Coords):** **\`${draft.loyalty || 'N/A'}\`**\n` +
              `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
              `*Review the candidate's answers below and click "Accept & Send Invite" to automatically dispatch the private server invite!*`
            )
            .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'The Light Bearers • 12-Point Recruitment Dossier' })
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
            content: `🔔 <@&${CLAN_LEADER_ROLE_ID}> <@&${CLAN_COLEADER_ROLE_ID}> **New 12-Point Candidate Dossier:** <@${interaction.user.id}> (\`${draft.ign || interaction.user.username}\`)!`,
            embeds: [dossierEmbed],
            components: [actionRow]
          });
        }
      }
    } catch (err) {
      console.error('[ClanApp] Failed to route dossier to updates channel:', err);
    }

    clanAppDrafts.delete(interaction.user.id);
    return;
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // STAFF ACTION BUTTONS: ACCEPT OR DECLINE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  if (interaction.isButton() && (interaction.customId.startsWith('btn_clan_accept_') || interaction.customId.startsWith('btn_clan_deny_'))) {
    const isAccept = interaction.customId.startsWith('btn_clan_accept_');
    const targetUserId = interaction.customId.replace(isAccept ? 'btn_clan_accept_' : 'btn_clan_deny_', '');

    // Authorization: Must have Leader, Co-Leader, Admin role or be Krylo / Admin perm
    const member = interaction.member;
    const isAuthorized = 
      interaction.user.id === KRYLO_USER_ID ||
      interaction.user.id === KRYLO_SECONDARY_ID ||
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
              .setTitle('✨ NEW GUARDIAN ENLISTED IN THE LIGHT BEARERS!')
              .setDescription(
                `Give a warm guild welcome to our newest member, <@${targetUserId}>!\n\n` +
                `• **Rank:** **🗡️ Clan Recruit**\n` +
                `• **Recruited By:** <@${interaction.user.id}>\n\n` +
                `Welcome to **The Light Bearers**! Together, we dispel the dark. 🛡️✨`
              )
              .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
              .setTimestamp();

            await teamChat.send({ content: `🎉 Welcome <@${targetUserId}> to The Light Bearers!`, embeds: [welcomeSquadEmbed] });
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
                 `📨 **DM Status:** ${dmSent ? '✅ Server invite link successfully sent to applicant\'s DM!' : '⚠️ Applicant DMs were closed; invite link: ' + CLAN_INVITE_URL}`,
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
      // Decline handling - send polite DM
      if (targetUser) {
        const dmDecline = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('✨ The Light Bearers — Application Update')
          .setDescription(
            `Hello **${targetUser.username}**,\n\n` +
            `Thank you for taking the time to apply for **The Light Bearers**.\n\n` +
            `After review by Guild Leadership, our roster is currently full or not onboarding additional recruits for this role at this time.\n\n` +
            `We encourage you to stay active in our community and apply again in upcoming recruitment rounds! ✨`
          )
          .setTimestamp();

        try {
          await targetUser.send({ embeds: [dmDecline] });
        } catch (e) {}
      }

      // Update review card in updates channel to Red
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
