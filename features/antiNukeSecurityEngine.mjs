import { AuditLogEvent, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fs from 'fs';
import path from 'path';

const FOUNDER_ID = '1414143825538191373';
// Maintenance Release Timer: Dec 5, 2026 18:00:00 UTC (1:00 PM EST)
export const SECURITY_RELEASE_AT = Date.UTC(2026, 11, 5, 18, 0, 0);

const CONFIG_PATH = path.resolve(process.cwd(), 'data', 'antinuke_config.json');

// Map<guildId, { enabled: boolean, antiRaid: boolean, threshold: number, windowMs: number, whitelist: string[], logChannelId: string | null }>
const guildConfigs = new Map();
// Map<`${guildId}:${executorId}`, number[]>
const actionTracker = new Map();
// Map<guildId, number[]>
const joinWaveTracker = new Map();
// Set<guildId> to avoid spamming raid alerts
const activeRaidCooldown = new Set();

function loadConfigs() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
      for (const [gid, cfg] of Object.entries(parsed)) {
        guildConfigs.set(gid, cfg);
      }
    }
  } catch (err) {
    console.warn('[AntiNuke] Failed to load config:', err.message);
  }
}

function saveConfigs() {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(Object.fromEntries(guildConfigs), null, 2));
  } catch (err) {
    console.warn('[AntiNuke] Failed to save config:', err.message);
  }
}

loadConfigs();

export function isSecuritySuiteUnlocked() {
  return process.env.ANTINUKE_FORCE_UNLOCK === 'true' || Date.now() >= SECURITY_RELEASE_AT;
}

export function getGuildSecurityConfig(guildId) {
  if (!guildConfigs.has(guildId)) {
    guildConfigs.set(guildId, {
      enabled: true,
      antiRaid: true,
      threshold: 3,
      windowMs: 15000,
      whitelist: [],
      logChannelId: null,
    });
  }
  return guildConfigs.get(guildId);
}

function isWhitelisted(guild, userId) {
  if (!userId) return true;
  if (userId === FOUNDER_ID || userId === guild.ownerId || userId === guild.client.user?.id) {
    return true;
  }
  const cfg = getGuildSecurityConfig(guild.id);
  return Array.isArray(cfg.whitelist) && cfg.whitelist.includes(userId);
}

async function sendSecurityAlert(guild, embed) {
  const cfg = getGuildSecurityConfig(guild.id);
  let targetChannel = null;
  if (cfg.logChannelId) {
    targetChannel = await guild.channels.fetch(cfg.logChannelId).catch(() => null);
  }
  if (!targetChannel) {
    targetChannel = guild.channels.cache.find(
      (c) => c.isTextBased() && /mod-log|audit|security|announcements/i.test(c.name)
    );
  }
  if (!targetChannel) targetChannel = guild.systemChannel;
  if (targetChannel?.isTextBased()) {
    await targetChannel.send({ embeds: [embed] }).catch(() => {});
  }
  const owner = await guild.fetchOwner().catch(() => null);
  if (owner) {
    await owner.send({ embeds: [embed] }).catch(() => {});
  }
}

async function handleDestructiveEvent(guild, auditType, reasonLabel) {
  if (!isSecuritySuiteUnlocked()) return;
  const cfg = getGuildSecurityConfig(guild.id);
  if (!cfg.enabled) return;

  const logs = await guild.fetchAuditLogs({ type: auditType, limit: 1 }).catch(() => null);
  const entry = logs?.entries?.first();
  if (!entry || Date.now() - entry.createdTimestamp > 10000) return;

  const executorId = entry.executorId || entry.executor?.id;
  if (!executorId || isWhitelisted(guild, executorId)) return;

  const key = `${guild.id}:${executorId}`;
  const now = Date.now();
  const prev = (actionTracker.get(key) || []).filter((t) => now - t < cfg.windowMs);
  prev.push(now);
  actionTracker.set(key, prev);

  if (prev.length < cfg.threshold) return;
  actionTracker.delete(key);

  const member = await guild.members.fetch(executorId).catch(() => null);
  let actionTaken = 'Alerted Owner (could not strip roles)';
  if (member && member.manageable) {
    const safeRoles = member.roles.cache.filter(
      (r) =>
        !r.permissions.has(PermissionFlagsBits.Administrator) &&
        !r.permissions.has(PermissionFlagsBits.ManageGuild) &&
        !r.permissions.has(PermissionFlagsBits.ManageChannels) &&
        !r.permissions.has(PermissionFlagsBits.ManageRoles) &&
        !r.permissions.has(PermissionFlagsBits.BanMembers) &&
        !r.permissions.has(PermissionFlagsBits.KickMembers)
    );
    await member.roles.set(safeRoles, `Krims Anti-Nuke: ${reasonLabel}`).catch(() => {});
    actionTaken = 'Stripped all dangerous staff/admin roles';
  } else if (member && member.bannable) {
    await member.ban({ reason: `Krims Anti-Nuke: ${reasonLabel}` }).catch(() => {});
    actionTaken = 'Banned attacker';
  }

  const embed = new EmbedBuilder()
    .setColor(0xef4444)
    .setTitle('🛡️ KRIMS ANTI-NUKE TRIGGERED')
    .setDescription(
      `**Executor:** <@${executorId}> (\`${executorId}\`)\n` +
      `**Trigger:** ${reasonLabel} (${cfg.threshold}+ actions in ${cfg.windowMs / 1000}s)\n` +
      `**Action Taken:** ${actionTaken}`
    )
    .setTimestamp();

  await sendSecurityAlert(guild, embed);
}

export async function handleAntiRaidMemberJoin(member) {
  if (!isSecuritySuiteUnlocked() || !member?.guild) return;
  const guild = member.guild;
  const cfg = getGuildSecurityConfig(guild.id);
  if (!cfg.enabled || !cfg.antiRaid) return;

  const now = Date.now();
  const joins = (joinWaveTracker.get(guild.id) || []).filter((t) => now - t < 15000);
  joins.push(now);
  joinWaveTracker.set(guild.id, joins);

  if (joins.length >= 10 && !activeRaidCooldown.has(guild.id)) {
    activeRaidCooldown.add(guild.id);
    setTimeout(() => activeRaidCooldown.delete(guild.id), 60000);

    const embed = new EmbedBuilder()
      .setColor(0xf59e0b)
      .setTitle('🚨 JOIN-FLOOD ANTI-RAID ALERT')
      .setDescription(
        `Detected **${joins.length} joins in 15 seconds** in **${guild.name}**.\n` +
        `Use \`/lockdown all:true\` immediately if this raid is unauthorized.`
      )
      .setTimestamp();

    await sendSecurityAlert(guild, embed);
  }
}

export function registerAntiNukeListeners(client) {
  client.on('channelDelete', (channel) => {
    if (channel.guild) handleDestructiveEvent(channel.guild, AuditLogEvent.ChannelDelete, 'Mass Channel Deletion');
  });
  client.on('roleDelete', (role) => {
    if (role.guild) handleDestructiveEvent(role.guild, AuditLogEvent.RoleDelete, 'Mass Role Deletion');
  });
  client.on('guildBanAdd', (ban) => {
    if (ban.guild) handleDestructiveEvent(ban.guild, AuditLogEvent.MemberBanAdd, 'Mass Member Ban');
  });
  client.on('webhookUpdate', (channel) => {
    if (channel.guild) handleDestructiveEvent(channel.guild, AuditLogEvent.WebhookCreate, 'Unauthorized Webhook Spam');
  });
}

export async function handleAntiNukeCommand(interaction) {
  if (!interaction.guild) {
    return interaction.reply({ content: '❌ `/antinuke` can only be used inside a server.', ephemeral: true });
  }

  const sub = interaction.options.getSubcommand(false) || 'status';
  const cfg = getGuildSecurityConfig(interaction.guild.id);
  const unlocked = isSecuritySuiteUnlocked();
  const releaseUnix = Math.floor(SECURITY_RELEASE_AT / 1000);

  if (sub === 'status') {
    const embed = new EmbedBuilder()
      .setColor(unlocked ? 0x00f2ff : 0xf59e0b)
      .setTitle('🛡️ Krims Anti-Nuke & Anti-Raid Shield')
      .setDescription(
        unlocked
          ? `**Status:** ${cfg.enabled ? '🟢 Active & Monitoring' : '🔴 Disabled'}\n` +
            `**Anti-Raid Join Guard:** ${cfg.antiRaid ? '🟢 On (10 joins / 15s)' : '⚪ Off'}\n` +
            `**Nuke Threshold:** \`${cfg.threshold}\` destructive actions in \`${cfg.windowMs / 1000}s\`\n` +
            `**Whitelisted Users:** \`${cfg.whitelist.length}\``
          : `⏳ **Scheduled for Maintenance Release**\n` +
            `This security suite is pre-installed and unlocks automatically <t:${releaseUnix}:R> (<t:${releaseUnix}:F>).\n\n` +
            `• **Server Shield:** ${cfg.enabled ? 'Pre-armed' : 'Paused'}\n` +
            `• **Whitelisted Users:** \`${cfg.whitelist.length}\``
      )
      .setFooter({ text: 'Krims Code Security • Anti-Nuke & Anti-Raid' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  const isOwnerOrFounder = interaction.user.id === interaction.guild.ownerId || interaction.user.id === FOUNDER_ID;
  if (!isOwnerOrFounder) {
    return interaction.reply({ content: '❌ Only the **Server Owner** can modify Anti-Nuke settings or whitelists.', ephemeral: true });
  }

  if (sub === 'enable' || sub === 'disable') {
    cfg.enabled = sub === 'enable';
    saveConfigs();
    return interaction.reply({
      content: cfg.enabled
        ? `✅ **Anti-Nuke & Anti-Raid ${unlocked ? 'enabled' : `pre-armed (unlocks <t:${releaseUnix}:R>)`}!**`
        : '⚠️ **Anti-Nuke & Anti-Raid disabled** for this server.',
      ephemeral: true,
    });
  }

  if (sub === 'whitelist') {
    const action = interaction.options.getString('action') || 'list';
    const target = interaction.options.getUser('user');

    if (action === 'list') {
      const list = cfg.whitelist.length > 0 ? cfg.whitelist.map((id) => `<@${id}> (\`${id}\`)`).join('\n') : 'No extra users whitelisted (Server Owner & Krims are always protected).';
      return interaction.reply({ content: `🛡️ **Anti-Nuke Whitelist:**\n${list}`, ephemeral: true });
    }
    if (!target) {
      return interaction.reply({ content: '❌ Please specify a `user` to add or remove.', ephemeral: true });
    }
    if (action === 'add') {
      if (!cfg.whitelist.includes(target.id)) cfg.whitelist.push(target.id);
      saveConfigs();
      return interaction.reply({ content: `✅ Added <@${target.id}> to the Anti-Nuke whitelist.`, ephemeral: true });
    }
    if (action === 'remove') {
      cfg.whitelist = cfg.whitelist.filter((id) => id !== target.id);
      saveConfigs();
      return interaction.reply({ content: `🗑️ Removed <@${target.id}> from the Anti-Nuke whitelist.`, ephemeral: true });
    }
  }
}
