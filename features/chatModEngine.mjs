import { 
  EmbedBuilder, 
  PermissionFlagsBits, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';

// Recognized Bot Creators and Sovereign Owners
const KRYLO_USER_ID = '1414143825538191373';

/**
 * Checks if a member has administrative authority in the guild
 */
export function isMemberAdmin(member, guild) {
  if (!member) return false;
  if (member.id === KRYLO_USER_ID) return true;
  if (guild && member.id === guild.ownerId) return true;

  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.permissions.has(PermissionFlagsBits.BanMembers)) return true;
  if (member.permissions.has(PermissionFlagsBits.KickMembers)) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  if (member.permissions.has(PermissionFlagsBits.ModerateMembers)) return true;

  return member.roles?.cache.some(r => {
    const n = r.name.normalize('NFKD').toLowerCase();
    return n.includes('founder') || n.includes('owner') || n.includes('admin') || n.includes('head mod') || n.includes('co-founder');
  }) || false;
}

/**
 * Parses duration strings like '10m', '1h', '2d', '30s', '1w' to milliseconds
 */
export function parseDurationToMs(str) {
  if (!str) return 0;
  const match = str.toLowerCase().match(/^(\d+)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes|h|hr|hrs|hour|hours|d|day|days|w|week|weeks)$/);
  if (!match) return 0;
  const val = parseInt(match[1], 10);
  const unit = match[2];

  if (unit.startsWith('s')) return val * 1000;
  if (unit.startsWith('m')) return val * 60 * 1000;
  if (unit.startsWith('h')) return val * 60 * 60 * 1000;
  if (unit.startsWith('d')) return val * 24 * 60 * 60 * 1000;
  if (unit.startsWith('w')) return val * 7 * 24 * 60 * 60 * 1000;
  return 0;
}

/**
 * Finds a target member in a guild by mention, ID, username, or display name
 */
export async function resolveTargetMember(guild, inputStr, message = null) {
  if (!guild || !inputStr) return null;

  // 1. Check message mentions first
  if (message && message.mentions.members && message.mentions.members.size > 0) {
    const firstMention = message.mentions.members.first();
    // Verify mention matches the token if multiple mentions
    if (inputStr.includes(firstMention.id)) return firstMention;
    return firstMention;
  }

  const clean = inputStr.replace(/[<@!>]/g, '').trim();

  // 2. Lookup by ID
  if (/^\d{17,20}$/.test(clean)) {
    try {
      const byId = await guild.members.fetch(clean).catch(() => null);
      if (byId) return byId;
    } catch (_) {}
  }

  // 3. Lookup in cached members by username, tag, or displayName
  const lower = inputStr.toLowerCase();
  let found = guild.members.cache.find(m => 
    m.user.username.toLowerCase() === lower ||
    m.displayName.toLowerCase() === lower ||
    m.user.tag.toLowerCase() === lower
  );

  if (found) return found;

  // 4. Fallback search via guild query
  try {
    const searchRes = await guild.members.search({ query: inputStr, limit: 1 }).catch(() => null);
    if (searchRes && searchRes.size > 0) {
      return searchRes.first();
    }
  } catch (_) {}

  return null;
}

/**
 * Main Chat Moderation Router for Discord Bots
 * Handles natural and prefixed commands:
 * - ban <user> [reason]
 * - kick <user> [reason]
 * - mute / timeout <user> <duration> [reason]
 * - unmute / untimeout <user>
 * - warn <user> [reason]
 * - purge / clear <number>
 * - lock / unlock
 * - slowmode <time/off>
 */
export async function handleChatModeration(client, message) {
  if (!message.guild || message.author.bot) return false;

  let content = message.content.trim();
  if (!content) return false;

  // Remove bot mention or bot name prefix if present
  // e.g. "@Mini X ban ace", "Mini X, ban ace", "!ban ace", "ban ace"
  const botMentionRegex = new RegExp(`^<@!?${client.user.id}>\\s*,?\\s*`, 'i');
  const botNameRegex = new RegExp(`^${client.user.username}\\s*,?\\s*`, 'i');
  const miniXRegex = /^mini\s*x\s*,?\s*/i;

  let isDirectlyAddressed = false;
  if (botMentionRegex.test(content)) {
    content = content.replace(botMentionRegex, '');
    isDirectlyAddressed = true;
  } else if (botNameRegex.test(content)) {
    content = content.replace(botNameRegex, '');
    isDirectlyAddressed = true;
  } else if (client.user.id === '1565848105277067414' && miniXRegex.test(content)) {
    content = content.replace(miniXRegex, '');
    isDirectlyAddressed = true;
  }

  // Check if first word is a moderation command
  const rawWords = content.trim().split(/\s+/);
  if (rawWords.length === 0) return false;

  let cmd = rawWords[0].toLowerCase();
  if (cmd.startsWith('!')) cmd = cmd.slice(1);

  const MOD_COMMANDS = [
    'ban', 'kick', 'mute', 'timeout', 'unmute', 'untimeout', 
    'warn', 'purge', 'clear', 'lock', 'unlock', 'slowmode'
  ];

  if (!MOD_COMMANDS.includes(cmd)) {
    return false;
  }

  // 🛡️ SECURITY GUARD: Admin-Only Execution Check
  const isAdmin = isMemberAdmin(message.member, message.guild);
  if (!isAdmin) {
    if (cmd.startsWith('!') || isDirectlyAddressed) {
      await message.reply({
        content: `⛔ **Access Denied!** Moderation commands are strictly restricted to **Server Administrators & Founders** (<@${message.guild.ownerId}>).`,
        allowedMentions: { repliedUser: false }
      }).catch(() => {});
      return true;
    }
    return false;
  }

  const args = rawWords.slice(1);
  const botMember = message.guild.members.me;

  // 1. BAN COMMAND
  if (cmd === 'ban') {
    if (args.length === 0) {
      await message.reply('❌ **Usage:** `ban @user [reason]` or `!ban ace breaking rules`');
      return true;
    }

    const targetArg = args[0];
    const target = await resolveTargetMember(message.guild, targetArg, message);

    if (!target) {
      await message.reply(`❌ Could not locate member **${targetArg}**. Please mention them or provide their username/ID.`);
      return true;
    }

    if (target.id === message.author.id) {
      await message.reply('⚠️ You cannot ban yourself!');
      return true;
    }

    if (target.id === message.guild.ownerId || target.id === KRYLO_USER_ID) {
      await message.reply('🛡️ **Protection Alert:** You cannot ban the Server Owner or System Creator!');
      return true;
    }

    if (!botMember.permissions.has(PermissionFlagsBits.BanMembers)) {
      await message.reply('❌ I need the **Ban Members** permission in this server to execute this command!');
      return true;
    }

    if (target.roles && botMember.roles.highest.position <= target.roles.highest.position) {
      await message.reply(`⚠️ Cannot ban <@${target.id}> because their role is higher than or equal to my highest role! Please move my role higher in Server Settings.`);
      return true;
    }

    const reason = args.slice(1).join(' ') || 'Banned by Server Administration';

    try {
      await target.send({
        content: `🔨 You have been banned from **${message.guild.name}** by <@${message.author.id}>.\n**Reason:** ${reason}`
      }).catch(() => {});

      await target.ban({ reason: `${reason} (Actioned by ${message.author.tag})` });

      const embed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('🔨 MEMBER BANNED')
        .setDescription(
          `**User:** <@${target.id}> (\`${target.user.tag}\`)\n` +
          `**Moderator:** <@${message.author.id}>\n` +
          `**Reason:** ${reason}\n` +
          `**Server:** ${message.guild.name}`
        )
        .setThumbnail(target.user.displayAvatarURL ? target.user.displayAvatarURL({ dynamic: true }) : null)
        .setFooter({ text: `${client.user.username} • Moderation Engine` })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
      return true;
    } catch (err) {
      await message.reply(`❌ Failed to ban <@${target.id}>: ${err.message}`);
      return true;
    }
  }

  // 2. KICK COMMAND
  if (cmd === 'kick') {
    if (args.length === 0) {
      await message.reply('❌ **Usage:** `kick @user [reason]` or `!kick ace`');
      return true;
    }

    const targetArg = args[0];
    const target = await resolveTargetMember(message.guild, targetArg, message);

    if (!target) {
      await message.reply(`❌ Could not locate member **${targetArg}**.`);
      return true;
    }

    if (target.id === message.author.id) {
      await message.reply('⚠️ You cannot kick yourself!');
      return true;
    }

    if (target.id === message.guild.ownerId || target.id === KRYLO_USER_ID) {
      await message.reply('🛡️ **Protection Alert:** You cannot kick the Server Owner or System Creator!');
      return true;
    }

    if (!botMember.permissions.has(PermissionFlagsBits.KickMembers)) {
      await message.reply('❌ I need the **Kick Members** permission to execute kicks!');
      return true;
    }

    if (target.roles && botMember.roles.highest.position <= target.roles.highest.position) {
      await message.reply(`⚠️ Cannot kick <@${target.id}> because their role is higher than or equal to my highest role!`);
      return true;
    }

    const reason = args.slice(1).join(' ') || 'Kicked by Server Administration';

    try {
      await target.send({
        content: `👢 You have been kicked from **${message.guild.name}** by <@${message.author.id}>.\n**Reason:** ${reason}`
      }).catch(() => {});

      await target.kick(`${reason} (Actioned by ${message.author.tag})`);

      const embed = new EmbedBuilder()
        .setColor(0xF97316)
        .setTitle('👢 MEMBER KICKED')
        .setDescription(
          `**User:** <@${target.id}> (\`${target.user.tag}\`)\n` +
          `**Moderator:** <@${message.author.id}>\n` +
          `**Reason:** ${reason}`
        )
        .setFooter({ text: `${client.user.username} • Moderation Engine` })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
      return true;
    } catch (err) {
      await message.reply(`❌ Failed to kick <@${target.id}>: ${err.message}`);
      return true;
    }
  }

  // 3. MUTE / TIMEOUT COMMAND
  if (cmd === 'mute' || cmd === 'timeout') {
    if (args.length === 0) {
      await message.reply('❌ **Usage:** `mute @user <duration> [reason]` (e.g. `mute @ace 10m spamming`)');
      return true;
    }

    const targetArg = args[0];
    const target = await resolveTargetMember(message.guild, targetArg, message);

    if (!target) {
      await message.reply(`❌ Could not locate member **${targetArg}**.`);
      return true;
    }

    if (target.id === message.author.id) {
      await message.reply('⚠️ You cannot mute yourself!');
      return true;
    }

    if (target.id === message.guild.ownerId || target.id === KRYLO_USER_ID) {
      await message.reply('🛡️ **Protection Alert:** You cannot mute the Server Owner or System Creator!');
      return true;
    }

    if (!botMember.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.reply('❌ I need the **Moderate Members (Timeout)** permission to mute members!');
      return true;
    }

    let durationMs = parseDurationToMs(args[1]);
    let reasonIndex = 2;

    // Default to 10 minutes if duration omitted
    if (durationMs <= 0) {
      durationMs = 10 * 60 * 1000;
      reasonIndex = 1;
    }

    const reason = args.slice(reasonIndex).join(' ') || 'Muted by Server Administration';
    const durationHuman = `${Math.round(durationMs / 60000)} minutes`;

    try {
      await target.timeout(durationMs, `${reason} (Actioned by ${message.author.tag})`);

      const embed = new EmbedBuilder()
        .setColor(0xEAB308)
        .setTitle('🔇 MEMBER MUTED (TIMEOUT)')
        .setDescription(
          `**User:** <@${target.id}> (\`${target.user.tag}\`)\n` +
          `**Duration:** \`${durationHuman}\` (Expires: <t:${Math.floor((Date.now() + durationMs) / 1000)}:R>)\n` +
          `**Moderator:** <@${message.author.id}>\n` +
          `**Reason:** ${reason}`
        )
        .setFooter({ text: `${client.user.username} • Moderation Engine` })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
      return true;
    } catch (err) {
      await message.reply(`❌ Failed to timeout <@${target.id}>: ${err.message}`);
      return true;
    }
  }

  // 4. UNMUTE / UNTIMEOUT COMMAND
  if (cmd === 'unmute' || cmd === 'untimeout') {
    if (args.length === 0) {
      await message.reply('❌ **Usage:** `unmute @user` or `!unmute ace`');
      return true;
    }

    const targetArg = args[0];
    const target = await resolveTargetMember(message.guild, targetArg, message);

    if (!target) {
      await message.reply(`❌ Could not locate member **${targetArg}**.`);
      return true;
    }

    try {
      await target.timeout(null, `Unmuted by ${message.author.tag}`);
      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('🔊 MEMBER UNMUTED')
        .setDescription(`**User:** <@${target.id}>\n**Moderator:** <@${message.author.id}>\n**Status:** Timeout removed.`)
        .setFooter({ text: `${client.user.username} • Moderation Engine` });

      await message.channel.send({ embeds: [embed] });
      return true;
    } catch (err) {
      await message.reply(`❌ Could not unmute <@${target.id}>: ${err.message}`);
      return true;
    }
  }

  // 5. PURGE / CLEAR COMMAND
  if (cmd === 'purge' || cmd === 'clear') {
    if (!botMember.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await message.reply('❌ I need **Manage Messages** permission to clear messages!');
      return true;
    }

    const count = parseInt(args[0], 10);
    if (isNaN(count) || count < 1 || count > 100) {
      await message.reply('❌ **Usage:** `purge <1-100>` or `clear 25` (Must be between 1 and 100).');
      return true;
    }

    try {
      // Delete user's command message first
      await message.delete().catch(() => {});
      const deleted = await message.channel.bulkDelete(count, true);

      const notice = await message.channel.send(`🧹 **Cleared ${deleted.size} messages!** (Requested by <@${message.author.id}>)`);
      setTimeout(() => notice.delete().catch(() => {}), 4000);
      return true;
    } catch (err) {
      await message.channel.send(`❌ Failed to purge messages: ${err.message}`);
      return true;
    }
  }

  // 6. WARN COMMAND
  if (cmd === 'warn') {
    if (args.length === 0) {
      await message.reply('❌ **Usage:** `warn @user [reason]`');
      return true;
    }

    const targetArg = args[0];
    const target = await resolveTargetMember(message.guild, targetArg, message);

    if (!target) {
      await message.reply(`❌ Could not locate member **${targetArg}**.`);
      return true;
    }

    const reason = args.slice(1).join(' ') || 'Rule violation warning';

    try {
      await target.send({
        content: `⚠️ **OFFICIAL WARNING from ${message.guild.name}:**\n**Reason:** ${reason}\n**Issued By:** <@${message.author.id}>`
      }).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(0xFBBF24)
        .setTitle('⚠️ OFFICIAL WARNING ISSUED')
        .setDescription(
          `**User:** <@${target.id}> (\`${target.user.tag}\`)\n` +
          `**Moderator:** <@${message.author.id}>\n` +
          `**Reason:** ${reason}`
        )
        .setFooter({ text: `${client.user.username} • Warning System` })
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
      return true;
    } catch (err) {
      await message.reply(`❌ Error warning member: ${err.message}`);
      return true;
    }
  }

  // 7. LOCK / UNLOCK CHANNEL
  if (cmd === 'lock' || cmd === 'unlock') {
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply('❌ I need **Manage Channels** permission to lock/unlock channels!');
      return true;
    }

    const isLock = cmd === 'lock';
    try {
      await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
        SendMessages: !isLock
      });

      const embed = new EmbedBuilder()
        .setColor(isLock ? 0xEF4444 : 0x10B981)
        .setTitle(isLock ? '🔒 CHANNEL LOCKED' : '🔓 CHANNEL UNLOCKED')
        .setDescription(
          isLock 
            ? `This channel has been locked by <@${message.author.id}>. Members cannot send messages.` 
            : `This channel has been unlocked by <@${message.author.id}>. Chat is open!`
        )
        .setFooter({ text: `${client.user.username} • Channel Security` });

      await message.channel.send({ embeds: [embed] });
      return true;
    } catch (err) {
      await message.reply(`❌ Failed to ${cmd} channel: ${err.message}`);
      return true;
    }
  }

  // 8. SLOWMODE COMMAND
  if (cmd === 'slowmode') {
    if (!botMember.permissions.has(PermissionFlagsBits.ManageChannels)) {
      await message.reply('❌ I need **Manage Channels** permission to adjust slowmode!');
      return true;
    }

    const arg = (args[0] || '').toLowerCase();
    let seconds = 0;

    if (arg === 'off' || arg === '0' || arg === 'disable') {
      seconds = 0;
    } else {
      const ms = parseDurationToMs(arg);
      seconds = ms > 0 ? Math.round(ms / 1000) : parseInt(arg, 10);
    }

    if (isNaN(seconds) || seconds < 0 || seconds > 21600) {
      await message.reply('❌ **Usage:** `slowmode <seconds/time>` (e.g. `slowmode 5s`, `slowmode 1m`, `slowmode off`). Max 6 hours.');
      return true;
    }

    try {
      await message.channel.setRateLimitPerUser(seconds);
      const textNotice = seconds === 0 ? 'Disabled' : `${seconds}s per user`;
      await message.reply(`⏱️ Slowmode set to **${textNotice}**!`);
      return true;
    } catch (err) {
      await message.reply(`❌ Could not set slowmode: ${err.message}`);
      return true;
    }
  }

  return false;
}
