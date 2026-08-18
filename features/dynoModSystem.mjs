import { EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';

// In-memory AFK and Reminders store
export const afkUsers = new Map();
export const activeReminders = new Map();
const warningsDb = new Map();

/**
 * Helper to dispatch mod logs to the guild's dedicated mod-logs channel
 */
export async function sendModLog(guild, embed) {
  try {
    const logChannel = guild.channels.cache.find(c => c.name.includes('mod-logs') || c.name.includes('audit-log') || c.name.includes('staff-logs'));
    if (logChannel && logChannel.isTextBased()) {
      await logChannel.send({ embeds: [embed] });
    }
  } catch (e) {}
}

/**
 * /warn command handler
 */
export async function handleWarn(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({ content: '🚫 You do not have permission to warn members!', ephemeral: true });
  }

  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'No reason provided';

  const userKey = `${interaction.guild.id}_${targetUser.id}`;
  const count = (warningsDb.get(userKey) || 0) + 1;
  warningsDb.set(userKey, count);

  const embed = new EmbedBuilder()
    .setColor(0xFFB020)
    .setTitle('⚠️ MEMBER WARNED (Dyno Protocol)')
    .addFields(
      { name: 'Target User', value: `<@${targetUser.id}> (\`${targetUser.id}\`)`, inline: true },
      { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Total Warnings', value: `\`${count}\``, inline: true },
      { name: 'Reason', value: reason }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  sendModLog(interaction.guild, embed);

  // DM target user
  try {
    await targetUser.send(`⚠️ You received a formal warning in **${interaction.guild.name}** for: *${reason}* (Total warnings: ${count})`);
  } catch (e) {}
}

/**
 * /mute (timeout) command handler
 */
export async function handleMute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({ content: '🚫 You do not have permission to mute members!', ephemeral: true });
  }

  const targetMember = interaction.options.getMember('user');
  const durationMin = interaction.options.getInteger('minutes') || 10;
  const reason = interaction.options.getString('reason') || 'Muted by Staff';

  if (!targetMember || !targetMember.moderatable) {
    return interaction.reply({ content: '❌ Cannot mute this member (hierarchy too high).', ephemeral: true });
  }

  const durationMs = durationMin * 60 * 1000;
  await targetMember.timeout(durationMs, reason);

  const embed = new EmbedBuilder()
    .setColor(0xFF4444)
    .setTitle('🔇 MEMBER MUTED / TIMED OUT')
    .addFields(
      { name: 'Target User', value: `<@${targetMember.id}>`, inline: true },
      { name: 'Duration', value: `\`${durationMin} Minutes\``, inline: true },
      { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Reason', value: reason }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  sendModLog(interaction.guild, embed);
}

/**
 * /unmute command handler
 */
export async function handleUnmute(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return interaction.reply({ content: '🚫 You do not have permission to unmute members!', ephemeral: true });
  }

  const targetMember = interaction.options.getMember('user');
  if (!targetMember) return interaction.reply({ content: '❌ Member not found.', ephemeral: true });

  await targetMember.timeout(null, `Unmuted by ${interaction.user.username}`);

  const embed = new EmbedBuilder()
    .setColor(0x00FF88)
    .setTitle('🔊 MEMBER UNMUTED')
    .setDescription(`<@${targetMember.id}> was unmuted by <@${interaction.user.id}>.`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  sendModLog(interaction.guild, embed);
}

/**
 * /kick command handler
 */
export async function handleKick(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.KickMembers)) {
    return interaction.reply({ content: '🚫 You do not have permission to kick members!', ephemeral: true });
  }

  const targetMember = interaction.options.getMember('user');
  const reason = interaction.options.getString('reason') || 'Kicked by Staff';

  if (!targetMember || !targetMember.kickable) {
    return interaction.reply({ content: '❌ Cannot kick this member.', ephemeral: true });
  }

  await targetMember.kick(reason);

  const embed = new EmbedBuilder()
    .setColor(0xFF6B35)
    .setTitle('👢 MEMBER KICKED')
    .addFields(
      { name: 'User', value: `${targetMember.user.tag} (\`${targetMember.id}\`)`, inline: true },
      { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Reason', value: reason }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  sendModLog(interaction.guild, embed);
}

/**
 * /ban command handler
 */
export async function handleBan(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
    return interaction.reply({ content: '🚫 You do not have permission to ban members!', ephemeral: true });
  }

  const targetUser = interaction.options.getUser('user');
  const reason = interaction.options.getString('reason') || 'Banned by Staff';

  try {
    await interaction.guild.bans.create(targetUser.id, { reason });
  } catch (e) {
    return interaction.reply({ content: '❌ Failed to ban user (check permissions/hierarchy).', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🔨 MEMBER BANNED (Dyno Engine)')
    .addFields(
      { name: 'Banned User', value: `${targetUser.tag} (\`${targetUser.id}\`)`, inline: true },
      { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true },
      { name: 'Reason', value: reason }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  sendModLog(interaction.guild, embed);
}

/**
 * /purge command handler
 */
export async function handlePurge(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: '🚫 You do not have permission to purge messages!', ephemeral: true });
  }

  const count = interaction.options.getInteger('count');
  if (count < 1 || count > 100) {
    return interaction.reply({ content: '❌ Please specify between 1 and 100 messages to delete.', ephemeral: true });
  }

  const deleted = await interaction.channel.bulkDelete(count, true);

  const embed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setDescription(`🧹 Purged **${deleted.size}** messages by <@${interaction.user.id}>.`)
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
  sendModLog(interaction.guild, embed);
}

/**
 * /lockdown & /unlock command handler
 */
export async function handleLockdown(interaction, isLock) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: '🚫 You do not have permission to manage channels!', ephemeral: true });
  }

  const channel = interaction.options.getChannel('channel') || interaction.channel;
  const everyoneRole = interaction.guild.roles.everyone;

  await channel.permissionOverwrites.edit(everyoneRole, {
    SendMessages: !isLock
  });

  const title = isLock ? '🔒 CHANNEL LOCKED DOWN' : '🔓 CHANNEL UNLOCKED';
  const color = isLock ? 0xFF4444 : 0x00FF88;
  const desc = isLock 
    ? `This channel has been locked down by <@${interaction.user.id}>. Regular members cannot send messages.`
    : `This channel has been unlocked by <@${interaction.user.id}>. Chat is now open!`;

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(desc)
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
  sendModLog(interaction.guild, embed);
}

/**
 * /slowmode command handler
 */
export async function handleSlowmode(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    return interaction.reply({ content: '🚫 Permission denied.', ephemeral: true });
  }

  const seconds = interaction.options.getInteger('seconds');
  await interaction.channel.setRateLimitPerUser(seconds);

  await interaction.reply({
    content: seconds === 0 ? '⚡ Slowmode has been disabled.' : `⏳ Slowmode set to **${seconds} seconds**.`
  });
}

/**
 * /afk command handler
 */
export function handleAfk(interaction) {
  const reason = interaction.options.getString('reason') || 'AFK';
  afkUsers.set(interaction.user.id, {
    reason,
    timestamp: Date.now()
  });

  const embed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setDescription(`💤 **${interaction.user.username}** is now AFK: *${reason}*`);

  interaction.reply({ embeds: [embed] });
}

/**
 * /remindme command handler
 */
export function handleRemindMe(interaction) {
  const timeStr = interaction.options.getString('time');
  const text = interaction.options.getString('reminder');

  let ms = 0;
  if (timeStr.endsWith('m')) ms = parseInt(timeStr) * 60 * 1000;
  else if (timeStr.endsWith('h')) ms = parseInt(timeStr) * 60 * 60 * 1000;
  else if (timeStr.endsWith('s')) ms = parseInt(timeStr) * 1000;
  else ms = parseInt(timeStr) * 60 * 1000; // default minutes

  if (!ms || isNaN(ms)) {
    return interaction.reply({ content: '❌ Invalid time format! Use `10m`, `1h`, or `30s`.', ephemeral: true });
  }

  interaction.reply({ content: `⏰ Reminder set! I will remind you in **${timeStr}** for: *${text}*` });

  setTimeout(async () => {
    try {
      const user = await interaction.client.users.fetch(interaction.user.id);
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('⏰ REMINDER NOTIFICATION')
        .setDescription(`Hey <@${user.id}>! You asked me to remind you:\n\n**${text}**`)
        .setFooter({ text: 'Dyno-Style Reminder System' })
        .setTimestamp();
      await user.send({ embeds: [embed] });
    } catch (e) {}
  }, ms);
}

/**
 * /embed builder command handler
 */
export async function handleEmbedBuilder(interaction) {
  if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
    return interaction.reply({ content: '🚫 You need Manage Messages permission to build embeds!', ephemeral: true });
  }

  const title = interaction.options.getString('title');
  const description = interaction.options.getString('description');
  const colorHex = interaction.options.getString('color') || '#00E5FF';
  const image = interaction.options.getString('image_url');

  let color = 0x00E5FF;
  try {
    color = parseInt(colorHex.replace('#', ''), 16);
  } catch (e) {}

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description.replace(/\\n/g, '\n'))
    .setColor(color)
    .setFooter({ text: `${interaction.guild.name} • Official Announcement` })
    .setTimestamp();

  if (image) embed.setImage(image);

  await interaction.channel.send({ embeds: [embed] });
  await interaction.reply({ content: '✅ Custom announcement embed deployed!', ephemeral: true });
}
