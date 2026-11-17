import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelType,
  OverwriteType
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { setPlayerVerification, getPlayer, addCoins, getBalance } from '../databaseEngine.mjs';
import { getFalixStatus, sendFalixPowerSignal, sendFalixCommand } from '../falixServerEngine.mjs';

dotenv.config();

const KSMP_TOKEN = process.env.KSMP_BOT_TOKEN;
const KSMP_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1540725967864201446';
const KSMP_GUILD_ID = process.env.DISCORD_GUILD_ID || '1538225337048236082';

const TICKET_CHANNEL_ID = '1542646331502366760'; // 🎫・support-tickets
const VERIFY_CHANNEL_ID = '1542646204658090054'; // ✅・verify
const SUPPORT_CATEGORY_ID = '1542646333943316652'; // ╭━━━ 🤖 BOTS & SUPPORT ━━━╮
const KRIMS_CODE_ID = '1523794466740371586';

const ROLE_VERIFIED = '1538228607644737546';
const ROLE_MEMBER = '1538230669467979846';
const ROLE_JAVA = '1542662169575817321';
const ROLE_BEDROCK = '1542662171937472594';
const ROLE_ADMIN = '1538228602687078492';
const ROLE_MOD = '1538228604859879435';

export const ksmpClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

let globalMasterClient = null;

export function setMasterClient(client) {
  globalMasterClient = client;
}


/**
 * Real-time Discord to Minecraft Rank Sync Engine
 */
export function determineRankFromMember(member) {
  if (!member) return 'default';
  const roleNames = member.roles?.cache ? Array.from(member.roles.cache.values()).map(r => r.name.toLowerCase()) : [];
  const isOwner = member.id === member.guild?.ownerId;

  if (isOwner || roleNames.some(r => r.includes('owner'))) {
    return 'owner';
  }
  if (roleNames.some(r => r.includes('director') || r.includes('co-leader') || r.includes('co-founder'))) {
    return 'co-leader';
  }
  if (roleNames.some(r => r.includes('admin'))) {
    return 'admin';
  }
  if (roleNames.some(r => r.includes('mod') && !r.includes('model') && !r.includes('lord'))) {
    return 'mod';
  }
  if (roleNames.some(r => r.includes('helper'))) {
    return 'helper';
  }
  if (roleNames.some(r => r.includes('media') || r.includes('creator'))) {
    return 'media';
  }
  if (roleNames.some(r => r.includes('mvp') || r.includes('booster'))) {
    return 'mvp';
  }
  if (roleNames.some(r => r.includes('vip'))) {
    return 'vip';
  }
  if (roleNames.some(r => r.includes('verified'))) {
    return 'verified';
  }
  return 'default';
}

export async function syncMemberRank(member) {
  if (!member || !member.id) return null;
  const users = loadLocalLinked();
  const record = users[member.id];
  if (!record || !record.ign) return null;

  const targetRank = determineRankFromMember(member);
  const cleanIgn = record.ign;

  if (record.currentRank === targetRank) {
    return { synced: false, rank: targetRank, ign: cleanIgn, reason: 'already_synced' };
  }

  console.log(`[⚡ KSMP Rank Sync] Updating ${member.user?.tag || member.id} (${cleanIgn}) -> ${targetRank.toUpperCase()}...`);
  try {
    await sendFalixCommand(`lp user ${cleanIgn} parent set ${targetRank}`);
    await sendFalixCommand(`tellraw ${cleanIgn} {"text":"§b§l[KryloSMP] §7Your rank has synced to §e${targetRank.toUpperCase()} §7from Discord!","color":"aqua"}`).catch(() => {});
    
    record.currentRank = targetRank;
    record.lastRankSync = new Date().toISOString();
    saveLocalLinked(users);

    return { synced: true, rank: targetRank, ign: cleanIgn };
  } catch (err) {
    console.error(`[⚡ KSMP Rank Sync Error] Failed for ${cleanIgn}:`, err.message);
    return { synced: false, error: err.message };
  }
}

async function trySetNickname(guild, memberId, newNick) {
  if (!guild || !memberId) return false;
  // 1. Try with Ksmp bot directly
  try {
    const member = await guild.members.fetch(memberId).catch(() => null);
    if (member) {
      await member.setNickname(newNick);
      return true;
    }
  } catch (_) {}

  // 2. Fallback to master client (Krims Code AI) which is at the top of the role hierarchy
  if (globalMasterClient) {
    try {
      const masterGuild = await globalMasterClient.guilds.fetch(guild.id).catch(() => null);
      const masterMember = await masterGuild?.members.fetch(memberId).catch(() => null);
      if (masterMember) {
        await masterMember.setNickname(newNick);
        return true;
      }
    } catch (_) {}
  }
  return false;
}

const DATA_FILE = path.join(process.cwd(), 'linked_players.json');

function loadLocalLinked() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (_) {}
  return {};
}

function saveLocalLinked(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

const commands = [
  new SlashCommandBuilder()
    .setName('link')
    .setDescription('🔗 Link your Discord account to your Minecraft account!')
    .addStringOption(opt =>
      opt.setName('username').setDescription('Your Minecraft In-Game Name (IGN)').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('🔓 Unlink your currently connected Minecraft account.'),
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('👤 View your linked Minecraft profile, stats, and KryloCoins ($Kr).')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to view (defaults to yourself)').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('mc-status')
    .setDescription('Show live Minecraft server status on Falix.'),
  new SlashCommandBuilder()
    .setName('mc-power')
    .setDescription('Start, stop, restart, or kill the Minecraft server.')
    .addStringOption(opt =>
      opt.setName('signal')
        .setDescription('Power action')
        .setRequired(true)
        .addChoices(
          { name: 'start', value: 'start' },
          { name: 'stop', value: 'stop' },
          { name: 'restart', value: 'restart' },
          { name: 'kill', value: 'kill' }
        )
    ),
  new SlashCommandBuilder()
    .setName('mc-command')
    .setDescription('Send one console command to the Minecraft server.')
    .addStringOption(opt =>
      opt.setName('command').setDescription('Single console command').setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName('sync')
    .setDescription('⚡ Sync your Discord roles with your in-game Minecraft rank!')
].map(c => c.toJSON());

async function registerCommands() {
  if (!KSMP_TOKEN) return;
  try {
    const rest = new REST({ version: '10' }).setToken(KSMP_TOKEN);
    await rest.put(Routes.applicationGuildCommands(KSMP_CLIENT_ID, KSMP_GUILD_ID), { body: commands });
    console.log('[⚡ KSMP BOT ENGINE] Slash commands registered successfully in guild', KSMP_GUILD_ID);
  } catch (err) {
    console.warn('[⚡ KSMP BOT ENGINE] Failed to register slash commands:', err.message);
  }
}

export function formatIgnWithCapital(raw) {
  if (!raw) return '';
  const trimmed = raw.trim();
  const isBedrock = trimmed.startsWith('.');
  const bare = isBedrock ? trimmed.slice(1) : trimmed;
  if (!bare) return trimmed;
  const capitalized = bare.charAt(0).toUpperCase() + bare.slice(1);
  return (isBedrock ? '.' : '') + capitalized;
}

export async function processLink(interaction, rawIgn, isModal = false) {
  const cleanIgn = formatIgnWithCapital(rawIgn);

  if (!cleanIgn || cleanIgn.length < 3 || cleanIgn.length > 16 || !/^[a-zA-Z0-9_.]+$/.test(cleanIgn)) {
    const errorMsg = '❌ **Invalid Minecraft Username!**\nIGN must be 3–16 characters (alphanumeric, underscores, or leading dot for Bedrock).';
    return interaction.reply({ content: errorMsg, ephemeral: true });
  }

  // 1. Save in database (SQLite + Neon Postgres)
  try {
    setPlayerVerification(interaction.user.id, cleanIgn);
    addCoins(interaction.user.id, 1000);
  } catch (dbErr) {
    console.warn('[KSMP DB Error]:', dbErr.message);
  }

  // 2. Save in local JSON
  const users = loadLocalLinked();
  const existing = users[interaction.user.id];
  const balance = (existing?.balance || 0) + (existing ? 0 : 1000);

  users[interaction.user.id] = {
    discordId: interaction.user.id,
    tag: interaction.user.tag || interaction.user.username,
    ign: cleanIgn,
    balance: balance,
    linkedAt: existing?.linkedAt || new Date().toISOString()
  };
  saveLocalLinked(users);

  // 3. Assign Discord Roles
  const member = interaction.member;
  if (member && member.roles) {
    const rolesToAdd = [];
    if (!member.roles.cache.has(ROLE_VERIFIED)) rolesToAdd.push(ROLE_VERIFIED);
    if (!member.roles.cache.has(ROLE_MEMBER)) rolesToAdd.push(ROLE_MEMBER);

    if (cleanIgn.startsWith('.')) {
      if (!member.roles.cache.has(ROLE_BEDROCK)) rolesToAdd.push(ROLE_BEDROCK);
    } else {
      if (!member.roles.cache.has(ROLE_JAVA)) rolesToAdd.push(ROLE_JAVA);
    }

    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd).catch(() => {});
    }

    // Format nickname: "Verified | <IGN>", "Owner | <IGN>", "Admin | <IGN>", etc.
    let prefix = 'Verified';
    if (member.id === interaction.guild?.ownerId) {
      prefix = 'Owner';
    } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('admin'))) {
      prefix = 'Admin';
    } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('mod'))) {
      prefix = 'Mod';
    } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('booster'))) {
      prefix = 'Booster';
    } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('vip'))) {
      prefix = 'VIP';
    }
    const formattedNick = `${prefix} | ${cleanIgn}`.slice(0, 32);

    // Attempt nickname change (with fallback to Krims Code AI top-level permissions)
    await trySetNickname(interaction.guild, member.id, formattedNick);
  }

  // 4. Send console commands to Falix
  sendFalixCommand(`whitelist add ${cleanIgn}`).catch(() => {});
    await syncMemberRank(member).catch(() => {});
  sendFalixCommand(`tellraw ${cleanIgn} {"text":"§a§l[KryloSMP] §eLinked with Discord! (+1,000 Kr)","color":"green"}`).catch(() => {});

  const isBedrock = cleanIgn.startsWith('.');
  const editionTag = isBedrock ? '📱 Bedrock Edition' : '☕ Java Edition';

  const successEmbed = new EmbedBuilder()
    .setColor(0x10B981)
    .setTitle('🎮 Account Linked Successfully!')
    .setAuthor({
      name: 'KryloSMP Network • Account Verification',
      iconURL: interaction.guild?.iconURL() || interaction.user.displayAvatarURL()
    })
    .setThumbnail(`https://mc-heads.net/avatar/${encodeURIComponent(cleanIgn)}/128`)
    .setDescription(
      `Hey <@${interaction.user.id}>! Your Discord account is now linked to **\`${cleanIgn}\`**!\n\n` +
      `• ⛏️ **Minecraft IGN:** \`${cleanIgn}\` (${editionTag})\n` +
      `• 💎 **Link Reward:** **+1,000 KryloCoins ($Kr)** deposited to your wallet!\n` +
      `• 🛡️ **Roles Granted:** <@&${ROLE_VERIFIED}> & <@&${isBedrock ? ROLE_BEDROCK : ROLE_JAVA}>\n` +
      `• 🚀 **Server Status:** Pre-registered & whitelisted for server launch!\n\n` +
      `*KryloSMP is launching soon! Keep an eye on announcements for the new server IP!* 🌟`
    )
    .setFooter({ text: 'KryloSMP • Official Network System' })
    .setTimestamp();

  return interaction.reply({ embeds: [successEmbed], ephemeral: isModal });
}

// ═════════════════════════════════════════════════════════════════════════════
// 🎫 SUPPORT TICKET CATEGORIES & HANDLERS
// ═════════════════════════════════════════════════════════════════════════════

export const TICKET_CATEGORIES = {
  report: {
    id: 'report',
    prefix: 'report',
    title: '🛡️ Player Report / Cheater Violation',
    desc: 'Submit video proof of hackers or rulebreakers',
    emoji: '🛡️',
    color: 0xEF4444,
    modalTitle: '🛡️ Report Rulebreaker / Cheater',
    inputLabel: 'Player IGN and violation details',
    inputPlaceholder: 'Rulebreaker IGN, rule broken, video/screenshot link...'
  },
  billing: {
    id: 'billing',
    prefix: 'billing',
    title: '💎 Billing & Store Support',
    desc: 'Questions regarding ranks, vouchers, or payments',
    emoji: '💎',
    color: 0x3B82F6,
    modalTitle: '💎 Billing & Store Support',
    inputLabel: 'Describe your payment or store inquiry',
    inputPlaceholder: 'Transaction ID, package name, IGN, payment issue...'
  },
  bug: {
    id: 'bug',
    prefix: 'bug',
    title: '🐛 Bug / Exploit Bounty',
    desc: 'Report server glitches to claim massive KryloCoins!',
    emoji: '🐛',
    color: 0x10B981,
    modalTitle: '🐛 Bug / Exploit Bounty Report',
    inputLabel: 'Describe the bug / glitch and steps',
    inputPlaceholder: 'Bug description, steps to reproduce, coordinates/proof...'
  },
  partner: {
    id: 'partner',
    prefix: 'creator',
    title: '🤝 Creator & Partner Inquiries',
    desc: 'Apply for Media / Content Creator rank',
    emoji: '🤝',
    color: 0xA855F7,
    modalTitle: '🤝 Media & Creator Application',
    inputLabel: 'YouTube / Twitch / TikTok channel link',
    inputPlaceholder: 'Channel link, subscriber count, upload frequency...'
  },
  general: {
    id: 'general',
    prefix: 'general',
    title: '❓ General Assistance',
    desc: 'Account issues, gameplay questions, and rank recovery',
    emoji: '❓',
    color: 0xF59E0B,
    modalTitle: '❓ General Assistance',
    inputLabel: 'How can the KryloSMP staff help you?',
    inputPlaceholder: 'Describe your question or issue in detail...'
  }
};

async function showTicketModal(interaction, catKey) {
  const cat = TICKET_CATEGORIES[catKey] || TICKET_CATEGORIES.general;
  const modal = new ModalBuilder()
    .setCustomId(`modal_ksmp_ticket_${cat.id}`)
    .setTitle(cat.modalTitle.slice(0, 45));

  const inquiryInput = new TextInputBuilder()
    .setCustomId('ticket_inquiry')
    .setLabel(cat.inputLabel.slice(0, 45))
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(cat.inputPlaceholder.slice(0, 100))
    .setMinLength(5)
    .setMaxLength(1000)
    .setRequired(true);

  modal.addComponents(new ActionRowBuilder().addComponents(inquiryInput));
  return interaction.showModal(modal);
}

async function handleTicketModalSubmit(interaction, catKey) {
  const cat = TICKET_CATEGORIES[catKey] || TICKET_CATEGORIES.general;
  const inquiryText = interaction.fields.getTextInputValue('ticket_inquiry');

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild;
  if (!guild) {
    return interaction.editReply({ content: '❌ Tickets can only be created inside the KryloSMP Discord server.' });
  }

  const cleanName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'user';

  // Check if user already has an active ticket
  const existingTicket = guild.channels.cache.find(c => 
    c.type === ChannelType.GuildText &&
    c.name.startsWith('ticket-') &&
    (c.topic?.includes(interaction.user.id) || c.name.endsWith(cleanName))
  );

  if (existingTicket) {
    return interaction.editReply({
      content: `❌ You already have an open ticket in <#${existingTicket.id}>! Please send your questions there.`
    });
  }

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      type: OverwriteType.Role,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: interaction.user.id,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
      ]
    },
    {
      id: ksmpClient.user.id,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
      ]
    }
  ];

  if (guild.ownerId) {
    overwrites.push({
      id: guild.ownerId,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }

  const adminRole = guild.roles.cache.get(ROLE_ADMIN);
  if (adminRole) {
    overwrites.push({
      id: adminRole.id,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }

  const modRole = guild.roles.cache.get(ROLE_MOD);
  if (modRole) {
    overwrites.push({
      id: modRole.id,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  }

  try {
    const channelName = `ticket-${cat.prefix}-${cleanName}`.slice(0, 32);
    const ticketChannel = await guild.channels.create({
      name: channelName,
      type: ChannelType.GuildText,
      parent: SUPPORT_CATEGORY_ID,
      topic: `KryloSMP Support Ticket | Category: ${cat.title} | User: @${interaction.user.tag} | ID: ${interaction.user.id}`,
      permissionOverwrites: overwrites
    });

    const ticketEmbed = new EmbedBuilder()
      .setColor(cat.color)
      .setTitle(`🎫 KryloSMP Support • ${cat.title}`)
      .setAuthor({
        name: 'KryloSMP Executive Support Desk',
        iconURL: guild.iconURL() || interaction.user.displayAvatarURL()
      })
      .setDescription(
        `Welcome <@${interaction.user.id}>! Staff has been alerted to your inquiry.\n\n` +
        `• 📁 **Category:** ${cat.title}\n` +
        `• 👤 **Opened By:** <@${interaction.user.id}>\n` +
        `• 📝 **Inquiry / Details:**\n> ${inquiryText.replace(/\n/g, '\n> ')}\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Our staff will be with you shortly. Feel free to upload any screenshots or logs below.*`
      )
      .setFooter({ text: 'KryloSMP Support Core • Click Close Ticket when resolved' })
      .setTimestamp();

    const actionRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_ksmp_close_ticket')
        .setLabel('🔒 Close Ticket')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('btn_ksmp_claim_ticket')
        .setLabel('🛡️ Claim Ticket')
        .setStyle(ButtonStyle.Secondary)
    );

    const pingText = `👋 <@${interaction.user.id}> | Staff notification: <@&${ROLE_ADMIN}> <@&${ROLE_MOD}>`;
    await ticketChannel.send({
      content: pingText,
      embeds: [ticketEmbed],
      components: [actionRow]
    });

    return interaction.editReply({
      content: `✅ **Ticket created successfully!** Please proceed to <#${ticketChannel.id}>.`
    });
  } catch (err) {
    console.error('[KSMP Ticket Creation Error]:', err);
    return interaction.editReply({
      content: `❌ Could not create ticket channel: ${err.message}`
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 🚀 DEPLOY OFFICIAL KRYLOSMP PANELS
// ═════════════════════════════════════════════════════════════════════════════

export async function deployOfficialPanels(force = false) {
  if (!ksmpClient.isReady()) return;

  try {
    // 1. Support Tickets Panel
    const ticketChannel = await ksmpClient.channels.fetch(TICKET_CHANNEL_ID).catch(() => null);
    if (ticketChannel) {
      const msgs = await ticketChannel.messages.fetch({ limit: 10 }).catch(() => null);
      let needsPost = force;
      if (msgs) {
        for (const m of msgs.values()) {
          if (m.author.id === KRIMS_CODE_ID) {
            await m.delete().catch(() => {});
            needsPost = true;
          }
        }
        const hasKsmpMsg = msgs.some(m => m.author.id === ksmpClient.user.id);
        if (!hasKsmpMsg) needsPost = true;
      } else {
        needsPost = true;
      }

      if (needsPost) {
        const supportEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle('🎫 KRYLOSMP 24/7 SUPPORT & HELP CENTER')
          .setAuthor({
            name: '👑 KryloSMP Executive Support Protocol',
            iconURL: ticketChannel.guild?.iconURL() || ksmpClient.user?.displayAvatarURL() || 'https://cdn.discordapp.com/icons/1538225337048236082/71b673a19efeeb1581b81563f155455f.png'
          })
          .setDescription(
            '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            'Need assistance from the **KryloSMP Administration Team**? Select the category matching your inquiry below to open a private encrypted ticket!\n\n' +
            '📌 **TICKET CATEGORIES:**\n' +
            '• 🛡️ **Player Report / Cheater Violation**: Submit video proof of hackers or rulebreakers.\n' +
            '• 💎 **Billing & Store Support**: Questions regarding ranks, vouchers, or payments.\n' +
            '• 🐛 **Bug / Exploit Bounty**: Report server glitches to claim massive KryloCoins!\n' +
            '• 🤝 **Creator & Partner Inquiries**: Apply for Media / Content Creator rank.\n' +
            '• ❓ **General Assistance**: Account issues, gameplay questions, and rank recovery.\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '⚡ *Our executive staff team responds in under 5 minutes!*'
          )
          .setImage('https://krylosmp.web.app/official_banner_clean.jpg')
          .setFooter({ text: 'KryloSMP Official • 24/7 Support Desk' })
          .setTimestamp();

        const selectRow = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('ksmp_ticket_select')
            .setPlaceholder('📂 Choose a ticket category to open a ticket...')
            .addOptions(
              new StringSelectMenuOptionBuilder()
                .setValue('report')
                .setLabel('Player Report / Cheater Violation')
                .setDescription('Submit video proof of hackers or rulebreakers')
                .setEmoji('🛡️'),
              new StringSelectMenuOptionBuilder()
                .setValue('billing')
                .setLabel('Billing & Store Support')
                .setDescription('Questions regarding ranks, vouchers, or payments')
                .setEmoji('💎'),
              new StringSelectMenuOptionBuilder()
                .setValue('bug')
                .setLabel('Bug / Exploit Bounty')
                .setDescription('Report server glitches to claim massive KryloCoins!')
                .setEmoji('🐛'),
              new StringSelectMenuOptionBuilder()
                .setValue('partner')
                .setLabel('Creator & Partner Inquiries')
                .setDescription('Apply for Media / Content Creator rank')
                .setEmoji('🤝'),
              new StringSelectMenuOptionBuilder()
                .setValue('general')
                .setLabel('General Assistance')
                .setDescription('Account issues, gameplay questions, and rank recovery')
                .setEmoji('❓')
            )
        );

        const buttonRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_ksmp_ticket_report')
            .setLabel('Player Report')
            .setEmoji('🛡️')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('btn_ksmp_ticket_billing')
            .setLabel('Billing & Store')
            .setEmoji('💎')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('btn_ksmp_ticket_bug')
            .setLabel('Bug Bounty')
            .setEmoji('🐛')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('btn_ksmp_ticket_partner')
            .setLabel('Creator Rank')
            .setEmoji('🤝')
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId('btn_ksmp_ticket_general')
            .setLabel('General Help')
            .setEmoji('❓')
            .setStyle(ButtonStyle.Secondary)
        );

        await ticketChannel.send({
          embeds: [supportEmbed],
          components: [selectRow, buttonRow]
        });
        console.log('[⚡ KSMP BOT ENGINE] Official Support Panel deployed to #🎫・support-tickets');
      }
    }

    // 2. Verification Panel
    const verifyChannel = await ksmpClient.channels.fetch(VERIFY_CHANNEL_ID).catch(() => null);
    if (verifyChannel) {
      const msgs = await verifyChannel.messages.fetch({ limit: 10 }).catch(() => null);
      let needsPost = force;
      if (msgs) {
        for (const m of msgs.values()) {
          if (m.author.id === KRIMS_CODE_ID) {
            await m.delete().catch(() => {});
            needsPost = true;
          }
        }
        const ksmpCount = msgs.filter(m => m.author.id === ksmpClient.user.id).size;
        if (ksmpCount < 2) needsPost = true;
      } else {
        needsPost = true;
      }

      if (needsPost) {
        const syncEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle('🎮 KRYLOSMP — MINECRAFT ACCOUNT SYNC & PERKS')
          .setDescription(
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '🌐 **KRYLOSMP PRE-REGISTRATION IS LIVE!**\n' +
            '• 🔒 **Server IP:** `Revealing Soon at Grand Launch!`\n' +
            '• 🛡️ **Platform:** Full Java & Bedrock Crossplay Support\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
            '### ⚡ Why Sync Your Minecraft Account Now?\n' +
            'Linking your Discord account to your in-game username enables automatic store fulfillment, stats tracking, and perks:\n\n' +
            '🎁 **Perks Unlocked When Synced:**\n' +
            '• 💰 **+1,000 KryloCoins** instant welcome bonus\n' +
            '• 📦 **Automated In-Game Delivery** for all web store kits & ranks\n' +
            '• 🏰 **Clan Roster & Leaderboard** integration\n' +
            '• 🛡️ **Verified Member Role** in Discord\n\n' +
            '### 🚀 How to Sync in 5 Seconds:\n' +
            '1️⃣ Click the **🎮 Sync Minecraft Account** button below.\n' +
            '2️⃣ Enter your **Minecraft In-Game Name (IGN)** in the pop-up modal.\n' +
            '3️⃣ That\'s it! Your account is instantly linked and whitelisted.\n\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '*Need assistance? Open a support ticket in <#1542646331502366760>!*'
          )
          .setFooter({ text: 'KryloSMP Account Sync Engine • Whitelisting Active ⚡' })
          .setTimestamp();

        const syncRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_ksmp_verify_modal')
            .setLabel('🎮 Sync Minecraft Account')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setLabel('🛒 Web Store')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp.web.app')
        );

        const platformEmbed = new EmbedBuilder()
          .setColor(0x5865F2)
          .setTitle('🎮 CHOOSE YOUR MINECRAFT PLATFORM')
          .setDescription(
            'Select your Minecraft edition to unlock platform-specific alerts, chat badges, and guides:\n\n' +
            '• ☕ **Java Edition:** PC / Mac / Linux (1.20.x — 1.21.x)\n' +
            '• 📱 **Bedrock Edition:** Mobile / Console / Windows 10/11\n\n' +
            '*(Official server IP will be revealed in announcements on launch day!)*\n\n' +
            '*Click the buttons below to claim or toggle your platform roles!*'
          )
          .setFooter({ text: 'KryloSMP Crossplay Protocol • Java & Bedrock 1.21.x ⚡' });

        const platformRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_ksmp_role_java')
            .setLabel('☕ Java Player')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('btn_ksmp_role_bedrock')
            .setLabel('📱 Bedrock Player')
            .setStyle(ButtonStyle.Primary)
        );

        await verifyChannel.send({ embeds: [syncEmbed], components: [syncRow] });
        await verifyChannel.send({ embeds: [platformEmbed], components: [platformRow] });
        console.log('[⚡ KSMP BOT ENGINE] Official Verification & Platform Panels deployed to #✅・verify');
      }
    }
  } catch (err) {
    console.warn('[⚡ KSMP BOT ENGINE] deployOfficialPanels error:', err.message);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// ⚡ INTERACTION CREATE ROUTING (KSMP BOT)
// ═════════════════════════════════════════════════════════════════════════════

ksmpClient.on('interactionCreate', async interaction => {
  try {
    // 1. Modal Submissions
    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'modal_link_minecraft') {
        const ign = interaction.fields.getTextInputValue('link_mc_ign');
        return processLink(interaction, ign, true);
      }

      if (interaction.customId.startsWith('modal_ksmp_ticket_')) {
        const catKey = interaction.customId.replace('modal_ksmp_ticket_', '');
        return handleTicketModalSubmit(interaction, catKey);
      }
    }

    // 2. Select Menus
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'ksmp_ticket_select') {
        const chosen = interaction.values[0];
        return showTicketModal(interaction, chosen);
      }
    }

    // 3. Buttons
    if (interaction.isButton()) {
      // Direct ticket category buttons
      if (interaction.customId.startsWith('btn_ksmp_ticket_')) {
        const catKey = interaction.customId.replace('btn_ksmp_ticket_', '');
        return showTicketModal(interaction, catKey);
      }

      // Close ticket button
      if (interaction.customId === 'btn_ksmp_close_ticket') {
        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_ksmp_confirm_close')
            .setLabel('✅ Yes, Close & Delete')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('btn_ksmp_cancel_close')
            .setLabel('❌ Cancel')
            .setStyle(ButtonStyle.Secondary)
        );
        return interaction.reply({
          content: '⚠️ **Are you sure you want to close and delete this ticket channel?**',
          components: [confirmRow],
          ephemeral: true
        });
      }

      // Confirm close
      if (interaction.customId === 'btn_ksmp_confirm_close') {
        await interaction.update({
          content: '🔒 Ticket confirmed closed. Deleting channel in 5 seconds...',
          components: []
        });
        await interaction.channel.send(`🔒 **Ticket closed by <@${interaction.user.id}>. This channel will self-destruct in 5 seconds...**`).catch(() => {});
        setTimeout(() => {
          interaction.channel.delete('Ticket closed by user').catch(() => {});
        }, 5000);
        return;
      }

      // Cancel close
      if (interaction.customId === 'btn_ksmp_cancel_close') {
        return interaction.update({
          content: 'Ticket closure cancelled.',
          components: []
        });
      }

      // Claim ticket
      if (interaction.customId === 'btn_ksmp_claim_ticket') {
        const isStaff = interaction.member?.permissions?.has(PermissionFlagsBits.ManageMessages) ||
          interaction.member?.roles?.cache?.has(ROLE_ADMIN) ||
          interaction.member?.roles?.cache?.has(ROLE_MOD) ||
          interaction.user.id === interaction.guild?.ownerId;

        if (!isStaff) {
          return interaction.reply({
            content: '❌ Only staff members can claim support tickets!',
            ephemeral: true
          });
        }

        return interaction.reply({
          content: `🛡️ **<@${interaction.user.id}> has claimed this ticket!** They will be assisting with this inquiry.`
        });
      }

      // Verification modal button
      if (interaction.customId === 'btn_ksmp_verify_modal') {
        const modal = new ModalBuilder()
          .setCustomId('modal_link_minecraft')
          .setTitle('🎮 Link Minecraft Account');

        const ignInput = new TextInputBuilder()
          .setCustomId('link_mc_ign')
          .setLabel('Minecraft Username (IGN)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. Krylo_Plays, Steve, Notch')
          .setMinLength(3)
          .setMaxLength(16)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(ignInput));
        return interaction.showModal(modal);
      }

      // Java role toggle
      if (interaction.customId === 'btn_ksmp_role_java') {
        const member = interaction.member;
        if (!member) return;
        if (member.roles.cache.has(ROLE_JAVA)) {
          await member.roles.remove(ROLE_JAVA).catch(() => {});
          return interaction.reply({ content: '☕ Removed **Java Player** role.', ephemeral: true });
        } else {
          await member.roles.add(ROLE_JAVA).catch(() => {});
          return interaction.reply({ content: '☕ Added **Java Player** role!', ephemeral: true });
        }
      }

      // Bedrock role toggle
      if (interaction.customId === 'btn_ksmp_role_bedrock') {
        const member = interaction.member;
        if (!member) return;
        if (member.roles.cache.has(ROLE_BEDROCK)) {
          await member.roles.remove(ROLE_BEDROCK).catch(() => {});
          return interaction.reply({ content: '📱 Removed **Bedrock Player** role.', ephemeral: true });
        } else {
          await member.roles.add(ROLE_BEDROCK).catch(() => {});
          return interaction.reply({ content: '📱 Added **Bedrock Player** role!', ephemeral: true });
        }
      }
    }

    // 4. Slash Commands
    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === 'link') {
        const ignOption = interaction.options.getString('username');
        if (!ignOption) {
          const modal = new ModalBuilder()
            .setCustomId('modal_link_minecraft')
            .setTitle('🎮 Link Minecraft Account');

          const ignInput = new TextInputBuilder()
            .setCustomId('link_mc_ign')
            .setLabel('Minecraft Username (IGN)')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('e.g. Krylo_Plays, Steve, Notch')
            .setMinLength(3)
            .setMaxLength(16)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder().addComponents(ignInput));
          return interaction.showModal(modal);
        }
        return processLink(interaction, ignOption, false);
      }

      if (interaction.commandName === 'unlink') {
        const users = loadLocalLinked();
        const record = users[interaction.user.id];
        if (!record) {
          return interaction.reply({ content: "❌ You don't have any linked Minecraft account.", ephemeral: true });
        }
        const oldIgn = record.ign;
        delete users[interaction.user.id];
        saveLocalLinked(users);
        if (interaction.member) {
          await interaction.member.roles.remove([ROLE_VERIFIED, ROLE_JAVA, ROLE_BEDROCK]).catch(() => {});
        }
        const unlinkEmbed = new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle('🔓 Account Unlinked')
          .setDescription(`Your Discord has been unlinked from **\`${oldIgn}\`**.\nYou can link a new account anytime with \`/link\`!`)
          .setFooter({ text: 'KryloSMP Network' })
          .setTimestamp();
        return interaction.reply({ embeds: [unlinkEmbed], ephemeral: true });
      }

      if (interaction.commandName === 'sync') {
    const users = loadLocalLinked();
    const record = users[interaction.user.id];
    if (!record || !record.ign) {
      return interaction.reply({
        content: '❌ **You have not linked your Minecraft account yet!**\nUse the **🎮 Sync Minecraft Account** button in <#1542661596700737606> or type `/link` to connect first.',
        ephemeral: true
      });
    }

    delete record.currentRank; // clear cache to force execute
    const res = await syncMemberRank(interaction.member);
    const activeRank = res?.rank || determineRankFromMember(interaction.member);

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('⚡ KryloSMP Role Sync Complete!')
      .setDescription(
        `Hey <@${interaction.user.id}>! Your Discord roles have synced to Minecraft:\n\n` +
        `• 🎮 **In-Game IGN:** \`${record.ign}\`\n` +
        `• 👑 **Active Rank:** **\`${activeRank.toUpperCase()}\`**\n` +
        `• 🛡️ **Badge:** Active in TAB, Chat, and Nametag!`
      )
      .setFooter({ text: 'KryloSMP Automatic Role Sync • FalixNodes Network' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (interaction.commandName === 'profile') {
        const targetUser = interaction.options.getUser('user') || interaction.user;
        const users = loadLocalLinked();
        const record = users[targetUser.id];
        if (!record) {
          return interaction.reply({
            content: targetUser.id === interaction.user.id
              ? '❌ You have not linked your Minecraft account yet! Use `/link` to connect.'
              : `❌ <@${targetUser.id}> has not linked their Minecraft account yet.`,
            ephemeral: true
          });
        }
        const isBedrock = record.ign.startsWith('.');
        const edition = isBedrock ? '📱 Bedrock Edition' : '☕ Java Edition';
        const linkedDate = record.linkedAt ? new Date(record.linkedAt).toLocaleDateString() : 'Recently';

        const profileEmbed = new EmbedBuilder()
          .setColor(0x3B82F6)
          .setTitle(`👤 ${record.ign}'s KryloSMP Profile`)
          .setAuthor({ name: `${targetUser.username}'s Player Card`, iconURL: targetUser.displayAvatarURL() })
          .setThumbnail(`https://mc-heads.net/body/${encodeURIComponent(record.ign)}/128`)
          .addFields(
            { name: '⛏️ In-Game Name', value: `\`${record.ign}\``, inline: true },
            { name: '🎮 Platform', value: edition, inline: true },
            { name: '💰 Balance', value: `\`${Number(record.balance || 0).toLocaleString()} Kr\``, inline: true },
            { name: '📅 Member Since', value: linkedDate, inline: true },
            { name: '🛡️ Verification Status', value: '✅ Verified Human Player', inline: true }
          )
          .setFooter({ text: 'KryloSMP Network • Profile System' })
          .setTimestamp();
        return interaction.reply({ embeds: [profileEmbed] });
      }

      if (interaction.commandName === 'mc-status') {
        await interaction.deferReply();
        const statusRes = await getFalixStatus();
        if (!statusRes.success) {
          return interaction.editReply(`Could not read status: ${statusRes.error}`);
        }
        const status = statusRes.data;
        const state = status.state || 'unknown';
        const cpu = status.cpu_absolute ? `${status.cpu_absolute.toFixed(1)}%` : 'unknown';
        return interaction.editReply(`KryloSMP status: **${state}**\nCPU: ${cpu}`);
      }

      if (interaction.commandName === 'mc-power') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.editReply('You need Manage Server permission to use this command.');
        }
        const signal = interaction.options.getString('signal', true);
        const res = await sendFalixPowerSignal(signal);
        if (!res.success) {
          return interaction.editReply(`Power action failed: ${res.error}`);
        }
        return interaction.editReply(`Sent \`${signal}\` signal to server.`);
      }

      if (interaction.commandName === 'mc-command') {
        await interaction.deferReply({ ephemeral: true });
        if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
          return interaction.editReply('You need Manage Server permission to use this command.');
        }
        const cmd = interaction.options.getString('command', true);
        const res = await sendFalixCommand(cmd);
        if (!res.success) {
          return interaction.editReply(`Command failed: ${res.error}`);
        }
        return interaction.editReply(`Sent command to server.`);
      }
    }
  } catch (err) {
    console.error('[KSMP Interaction Error]:', err.message);
  }
});

export async function startKsmpBot(masterClient = null) {
  if (masterClient) {
    globalMasterClient = masterClient;
  }
  if (!KSMP_TOKEN) {
    console.log('[⚡ KSMP BOT ENGINE] No KSMP_BOT_TOKEN provided, skipping secondary bot launch.');
    return;
  }

  const handleMemberUpdate = async (oldMember, newMember) => {
    try {
      if (newMember.guild?.id !== KSMP_GUILD_ID) return;
      const oldRoles = oldMember?.roles?.cache;
      const newRoles = newMember?.roles?.cache;
      if (!oldRoles || !newRoles || oldRoles.size !== newRoles.size || !oldRoles.equals(newRoles)) {
        await syncMemberRank(newMember);
      }
    } catch (e) {
      console.warn('[RankSync Update Error]:', e.message);
    }
  };

  ksmpClient.on('guildMemberUpdate', handleMemberUpdate);
  if (globalMasterClient) {
    globalMasterClient.on('guildMemberUpdate', handleMemberUpdate);
  }

  ksmpClient.once('clientReady', async () => {
    console.log('==================================================');
    console.log(`⚡ [KSMP BOT ENGINE] ONLINE as ${ksmpClient.user.tag}`);
    console.log(`🛡️ Running seamlessly inside Krims Code Master Host!`);
    console.log('==================================================');
    try {
      await deployOfficialPanels(false);
    } catch (deployErr) {
      console.warn('[⚡ KSMP BOT ENGINE] Panel deployment error:', deployErr.message);
    }
  });

  try {
    await registerCommands();
    await ksmpClient.login(KSMP_TOKEN);
  } catch (err) {
    console.error('[⚡ KSMP BOT ENGINE ERROR]', err.message);
  }
}
