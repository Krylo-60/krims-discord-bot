import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  PermissionFlagsBits,
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import {
  isSecuritySuiteUnlocked,
  SECURITY_RELEASE_AT,
  getGuildSecurityConfig,
} from './antiNukeSecurityEngine.mjs';

const FOUNDER_ID = '1414143825538191373';
const BACKUP_DIR = path.resolve(process.cwd(), 'data', 'backups');
const VERIFY_CFG_PATH = path.resolve(process.cwd(), 'data', 'verify_panels.json');

// Map<guildId, { roleId: string | null, autoRoleId: string | null }>
const verifyConfigs = new Map();

function loadVerifyConfigs() {
  try {
    if (fs.existsSync(VERIFY_CFG_PATH)) {
      const parsed = JSON.parse(fs.readFileSync(VERIFY_CFG_PATH, 'utf8'));
      for (const [gid, cfg] of Object.entries(parsed)) verifyConfigs.set(gid, cfg);
    }
  } catch (err) {
    console.warn('[MaintenanceSuite] Failed to load verify configs:', err.message);
  }
}

function saveVerifyConfigs() {
  try {
    const dir = path.dirname(VERIFY_CFG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(VERIFY_CFG_PATH, JSON.stringify(Object.fromEntries(verifyConfigs), null, 2));
  } catch (err) {
    console.warn('[MaintenanceSuite] Failed to save verify configs:', err.message);
  }
}

loadVerifyConfigs();

function buildLockedReply(featureName) {
  const releaseUnix = Math.floor(SECURITY_RELEASE_AT / 1000);
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(0xf59e0b)
        .setTitle(`⏳ ${featureName} — Maintenance Timer Active`)
        .setDescription(
          `This feature is pre-installed and unlocks automatically during the **Maintenance Release** <t:${releaseUnix}:R> (<t:${releaseUnix}:F>).`
        )
        .setFooter({ text: 'Krims Code AI • Maintenance Suite' })
        .setTimestamp(),
    ],
    ephemeral: true,
  };
}

export async function handleQuickStartCommand(interaction) {
  if (!interaction.guild) {
    return interaction.reply({ content: '❌ `/quickstart` can only be used inside a server.', ephemeral: true });
  }
  if (!isSecuritySuiteUnlocked() && interaction.user.id !== FOUNDER_ID) {
    return interaction.reply(buildLockedReply('Quick-Setup Wizard'));
  }
  if (!interaction.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '❌ You need **Administrator** permission to run `/quickstart`.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });
  const guild = interaction.guild;

  let logCh = guild.channels.cache.find((c) => c.isTextBased() && /mod-log|krims-log|audit/i.test(c.name));
  if (!logCh) {
    logCh = await guild.channels
      .create({
        name: 'krims-mod-logs',
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: guild.client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ],
      })
      .catch(() => null);
  }

  const secCfg = getGuildSecurityConfig(guild.id);
  secCfg.enabled = true;
  secCfg.antiRaid = true;
  if (logCh) secCfg.logChannelId = logCh.id;

  return interaction.editReply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x00f2ff)
        .setTitle('⚡ Krims Quick-Setup Complete')
        .setDescription(
          `• **Mod/Security Log Channel:** ${logCh ? `<#${logCh.id}>` : 'Skipped (missing Manage Channels)'}\n` +
            `• **Anti-Nuke Shield:** 🟢 Armed (3 actions / 15s)\n` +
            `• **Join-Flood Anti-Raid:** 🟢 Armed (10 joins / 15s)\n` +
            `• **Next Step:** Run \`/verifypanel setup\` in your verification channel or configure modules on \`https://krims-code.net\`.`
        )
        .setTimestamp(),
    ],
  });
}

export async function handleBackupCommand(interaction) {
  if (!interaction.guild) {
    return interaction.reply({ content: '❌ `/backup` can only be used inside a server.', ephemeral: true });
  }
  if (!isSecuritySuiteUnlocked() && interaction.user.id !== FOUNDER_ID) {
    return interaction.reply(buildLockedReply('Server Backup & Snapshot'));
  }
  if (interaction.user.id !== interaction.guild.ownerId && interaction.user.id !== FOUNDER_ID) {
    return interaction.reply({ content: '❌ Only the **Server Owner** can create or view server backups.', ephemeral: true });
  }

  const sub = interaction.options.getSubcommand(false) || 'info';
  const guild = interaction.guild;
  const filePath = path.join(BACKUP_DIR, `${guild.id}.json`);

  if (sub === 'create') {
    await interaction.deferReply({ ephemeral: true });
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const snapshot = {
      guildId: guild.id,
      guildName: guild.name,
      createdAt: new Date().toISOString(),
      roles: guild.roles.cache
        .filter((r) => !r.managed && r.id !== guild.id)
        .sort((a, b) => b.position - a.position)
        .map((r) => ({ name: r.name, color: r.hexColor, permissions: r.permissions.bitfield.toString(), hoist: r.hoist })),
      channels: guild.channels.cache
        .sort((a, b) => a.rawPosition - b.rawPosition)
        .map((c) => ({ name: c.name, type: c.type, parent: c.parent?.name || null })),
    };

    fs.writeFileSync(filePath, JSON.stringify(snapshot, null, 2));
    return interaction.editReply({
      content: `✅ **Server Snapshot Saved!** Captured \`${snapshot.roles.length}\` roles and \`${snapshot.channels.length}\` channels for **${guild.name}**.`,
    });
  }

  if (!fs.existsSync(filePath)) {
    return interaction.reply({ content: 'ℹ️ No backup snapshot found yet. Run `/backup create` to save one.', ephemeral: true });
  }
  const snap = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return interaction.reply({
    content: `📦 **Latest Backup for ${snap.guildName}:**\n• Saved: \`${snap.createdAt}\`\n• Roles: \`${snap.roles.length}\`\n• Channels: \`${snap.channels.length}\``,
    ephemeral: true,
  });
}

export async function handleVerifyPanelCommand(interaction) {
  if (!interaction.guild) {
    return interaction.reply({ content: '❌ `/verifypanel` can only be used inside a server.', ephemeral: true });
  }
  if (!isSecuritySuiteUnlocked() && interaction.user.id !== FOUNDER_ID) {
    return interaction.reply(buildLockedReply('1-Click Member Verification'));
  }
  if (!interaction.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
    return interaction.reply({ content: '❌ You need **Administrator** permission to configure `/verifypanel`.', ephemeral: true });
  }

  const sub = interaction.options.getSubcommand(false) || 'setup';
  const role = interaction.options.getRole('role');
  const existing = verifyConfigs.get(interaction.guild.id) || { roleId: null, autoRoleId: null };

  if (sub === 'autorole') {
    existing.autoRoleId = role ? role.id : null;
    verifyConfigs.set(interaction.guild.id, existing);
    saveVerifyConfigs();
    return interaction.reply({
      content: role ? `✅ **Auto-Role on Join set to <@&${role.id}>!**` : '🗑️ Auto-Role on Join cleared.',
      ephemeral: true,
    });
  }

  if (role) {
    existing.roleId = role.id;
    verifyConfigs.set(interaction.guild.id, existing);
    saveVerifyConfigs();
  }

  const embed = new EmbedBuilder()
    .setColor(0x00f2ff)
    .setTitle('✅ Server Verification')
    .setDescription(
      `Welcome to **${interaction.guild.name}**!\nClick the button below to verify your account${existing.roleId ? ` and unlock <@&${existing.roleId}>` : ''}.`
    )
    .setFooter({ text: 'Protected by Krims Code Security' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`krims_verify_btn:${interaction.guild.id}`)
      .setLabel('✅ Verify & Enter')
      .setStyle(ButtonStyle.Success)
  );

  await interaction.channel.send({ embeds: [embed], components: [row] });
  return interaction.reply({ content: '✅ Verification panel posted!', ephemeral: true });
}

export async function handleVerifyPanelButton(interaction) {
  if (!interaction.guild || !interaction.member) return;
  const cfg = verifyConfigs.get(interaction.guild.id);
  if (!cfg?.roleId) {
    return interaction.reply({ content: '✅ Verified! (No verification role configured yet.)', ephemeral: true });
  }
  await interaction.member.roles.add(cfg.roleId, 'Krims 1-Click Verification').catch(() => null);
  return interaction.reply({ content: `✅ You are now verified and received <@&${cfg.roleId}>!`, ephemeral: true });
}

export async function handleMaintenanceAutoRole(member) {
  if (!isSecuritySuiteUnlocked() || !member?.guild) return;
  const cfg = verifyConfigs.get(member.guild.id);
  if (cfg?.autoRoleId) {
    await member.roles.add(cfg.autoRoleId, 'Krims Auto-Role on Join').catch(() => {});
  }
}
