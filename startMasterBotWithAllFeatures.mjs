import dotenv from 'dotenv';
import { 
  Client, GatewayIntentBits, Partials, EmbedBuilder, ActivityType, PermissionFlagsBits, ChannelType 
} from 'discord.js';
import { getLocatorColor } from './features/locatorBarEngine.mjs';
import { 
  handleMessageXp, handleRankCommand, handleLeaderboardCommand 
} from './features/mee6Levels.mjs';
import { 
  afkUsers, handleWarn, handleMute, handleUnmute, handleKick, handleBan, 
  handlePurge, handleLockdown, handleSlowmode, handleAfk, handleRemindMe, handleEmbedBuilder, sendModLog 
} from './features/dynoModSystem.mjs';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessageReactions
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

client.once('ready', () => {
  console.log(`\n======================================================`);
  console.log(`🤖 KRIMS CODE AI — MEE6 + DYNO + LOCATOR SUITE ACTIVE!`);
  console.log(`👑 Logged in as: ${client.user.tag} (${client.user.id})`);
  console.log(`🌐 Serving ${client.guilds.cache.size} Guilds across Krylo Network`);
  console.log(`======================================================\n`);

  client.user.setPresence({
    activities: [{ name: 'KryloSMP.play.hosting | /locator | /rank', type: ActivityType.Playing }],
    status: 'online'
  });
});

// ------------------------------------------------------------
// 1. MESSAGE EVENT HANDLER (MEE6 XP & DYNO AFK AUTO-RESPONDER)
// ------------------------------------------------------------
client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  // A. Dyno AFK Removal on user return
  if (afkUsers.has(message.author.id)) {
    const afkData = afkUsers.get(message.author.id);
    afkUsers.delete(message.author.id);
    const durationMin = Math.round((Date.now() - afkData.timestamp) / 60000);
    message.reply(`👋 Welcome back **${message.author.username}**! I removed your AFK status (You were away for ${durationMin}m).`).catch(() => {});
  }

  // B. Dyno AFK Mention Alert
  if (message.mentions.users.size > 0) {
    message.mentions.users.forEach((user) => {
      if (afkUsers.has(user.id)) {
        const afk = afkUsers.get(user.id);
        const timeAgo = Math.round((Date.now() - afk.timestamp) / 60000);
        message.reply(`💤 **${user.username}** is currently AFK: *${afk.reason}* (${timeAgo}m ago)`).catch(() => {});
      }
    });
  }

  // C. MEE6 Leveling & XP Gain
  await handleMessageXp(message, client);
});

// ------------------------------------------------------------
// 2. AUDIT LOGGING (DYNO MOD-LOGS EVENT ENGINE)
// ------------------------------------------------------------
client.on('messageDelete', async (message) => {
  if (!message.guild || message.author?.bot) return;
  const embed = new EmbedBuilder()
    .setColor(0xFF4444)
    .setTitle('🗑️ MESSAGE DELETED (Audit Log)')
    .addFields(
      { name: 'Author', value: `${message.author?.tag || 'Unknown'} (<@${message.author?.id}>)`, inline: true },
      { name: 'Channel', value: `<#${message.channel.id}>`, inline: true },
      { name: 'Content', value: message.content ? message.content.slice(0, 1024) : '*No text content (embed or attachment)*' }
    )
    .setTimestamp();
  sendModLog(message.guild, embed);
});

client.on('messageUpdate', async (oldMsg, newMsg) => {
  if (!oldMsg.guild || oldMsg.author?.bot || oldMsg.content === newMsg.content) return;
  const embed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('✏️ MESSAGE EDITED (Audit Log)')
    .addFields(
      { name: 'Author', value: `${oldMsg.author.tag} (<@${oldMsg.author.id}>)`, inline: true },
      { name: 'Channel', value: `<#${oldMsg.channel.id}>`, inline: true },
      { name: 'Before', value: oldMsg.content ? oldMsg.content.slice(0, 500) : '*Empty*' },
      { name: 'After', value: newMsg.content ? newMsg.content.slice(0, 500) : '*Empty*' }
    )
    .setTimestamp();
  sendModLog(oldMsg.guild, embed);
});

// ------------------------------------------------------------
// 3. SLASH COMMAND INTERACTION ROUTER
// ------------------------------------------------------------
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  try {
    // 🧭 Locator Bar Neighbor Finder
    if (commandName === 'locator') {
      const input = interaction.options.getString('player_or_color');
      await interaction.deferReply();
      const res = await getLocatorColor(input);

      if (res.type === 'color') {
        const embed = new EmbedBuilder()
          .setColor(parseInt(res.normalizedHex.replace('#', ''), 16))
          .setTitle(`🧭 LOCATOR BAR COLOR SCANNER`)
          .setDescription(`Radar analysis for color \`${res.rawHex.toUpperCase()}\`:\n\n**Normalized 90% In-Game Color:** \`${res.normalizedHex.toUpperCase()}\`\n**Hue:** \`${res.hue}°\` • **Brightness:** \`90%\``)
          .addFields(
            { name: 'RGB Breakdown', value: `R: \`${res.rgb.r}\` G: \`${res.rgb.g}\` B: \`${res.rgb.b}\``, inline: true },
            { name: 'BossBar Preview', value: `\`[ ▬▬▬▬▬ ⬥ COLOR ⬥ ▬▬▬▬▬ ]\``, inline: true }
          )
          .setFooter({ text: 'KryloSMP Locator Radar Engine' })
          .setTimestamp();
        return interaction.editReply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(parseInt(res.normalizedHex.replace('#', ''), 16))
        .setAuthor({ name: `Minecraft Locator Bar • ${res.username}`, iconURL: res.avatarUrl })
        .setThumbnail(res.avatarUrl)
        .setDescription(`Computed in-game 90% normalized radar locator bar color for **${res.username}**!`)
        .addFields(
          { name: '👤 Username', value: `\`${res.username}\``, inline: true },
          { name: '🆔 UUID', value: `\`${res.uuid}\``, inline: true },
          { name: '🎨 90% In-Game Hex', value: `\`${res.normalizedHex.toUpperCase()}\``, inline: true },
          { name: '🌈 Raw Hash Hex', value: `\`${res.rawHex.toUpperCase()}\``, inline: true },
          { name: '📊 Hue / Saturation', value: `\`${res.hue}° / ${res.saturation}%\``, inline: true },
          { name: '🧭 Radar Frequency', value: `\`Band #${res.hue}\``, inline: true },
          { name: '🔍 BossBar Preview', value: `\`${res.barPreview}\`` },
          { name: '🌐 Web Radar Tool', value: `[Open Interactive Tool](https://krylosmp-store.web.app/locator.html)` }
        )
        .setImage(`https://mc-heads.net/body/${encodeURIComponent(res.username)}/right`)
        .setFooter({ text: 'KryloSMP Radar Protocol • locatorbar.crab.trade Engine' })
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    // 🤖 MEE6 Leveling Suite
    if (commandName === 'rank') return handleRankCommand(interaction);
    if (commandName === 'leaderboard') return handleLeaderboardCommand(interaction);

    // 🛡️ Dyno Moderation Suite
    if (commandName === 'warn') return handleWarn(interaction);
    if (commandName === 'mute') return handleMute(interaction);
    if (commandName === 'unmute') return handleUnmute(interaction);
    if (commandName === 'kick') return handleKick(interaction);
    if (commandName === 'ban') return handleBan(interaction);
    if (commandName === 'purge') return handlePurge(interaction);
    if (commandName === 'lockdown') return handleLockdown(interaction, true);
    if (commandName === 'unlock') return handleLockdown(interaction, false);
    if (commandName === 'slowmode') return handleSlowmode(interaction);
    if (commandName === 'afk') return handleAfk(interaction);
    if (commandName === 'remindme') return handleRemindMe(interaction);
    if (commandName === 'embed') return handleEmbedBuilder(interaction);

  } catch (err) {
    console.error(`Error executing /${commandName}:`, err);
    if (!interaction.replied && !interaction.deferred) {
      interaction.reply({ content: `❌ Error: ${err.message}`, ephemeral: true }).catch(() => {});
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
