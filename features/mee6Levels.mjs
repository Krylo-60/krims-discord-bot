import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateRankCardBuffer } from './rankCardGenerator.mjs';
import { getVoteMultiplier, getVoteBoosterInfo } from './voteBoosterManager.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const XP_DB_PATH = path.resolve(__dirname, '../mee6_xp.json');

export const KRIMS_CODE_GUILD_ID = '1561174283294609479';

// In-memory XP cache and cooldown map
let xpData = {};
const xpCooldowns = new Set();

// Load XP database
try {
  if (fs.existsSync(XP_DB_PATH)) {
    xpData = JSON.parse(fs.readFileSync(XP_DB_PATH, 'utf8'));
  }
} catch (e) {
  xpData = {};
}

function saveXpData() {
  try {
    fs.writeFileSync(XP_DB_PATH, JSON.stringify(xpData, null, 2));
  } catch (e) {}
}

/**
 * Formula: Required XP for Level L = 5 * (L^2) + (50 * L) + 100
 */
export function getRequiredXpForLevel(level) {
  return 5 * (level ** 2) + (50 * level) + 100;
}

export function getTotalXpForLevel(level) {
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += getRequiredXpForLevel(i);
  }
  return total;
}

export function calculateLevelFromXp(totalXp) {
  let level = 0;
  while (totalXp >= getRequiredXpForLevel(level)) {
    totalXp -= getRequiredXpForLevel(level);
    level++;
  }
  return { level, currentXp: totalXp, neededXp: getRequiredXpForLevel(level) };
}

/**
 * General helper to award XP to a user and handle level-ups / role rewards
 */
export async function awardUserXp({ guild, user, xpGain = 20, source = 'chat', client, channel }) {
  if (!guild || !user || user.bot) return;

  const userId = user.id;
  const guildId = guild.id;

  if (!xpData[guildId]) xpData[guildId] = {};
  if (!xpData[guildId][userId]) {
    xpData[guildId][userId] = {
      xp: 0,
      level: 0,
      username: user.username,
      discriminator: user.discriminator || '0',
      announced_level: 0,
      messages: 0
    };
  }

  // Track total chat messages count
  if (source === 'chat') {
    xpData[guildId][userId].messages = (xpData[guildId][userId].messages || 0) + 1;
  } else if (!xpData[guildId][userId].messages && xpData[guildId][userId].xp) {
    xpData[guildId][userId].messages = Math.max(1, Math.floor(xpData[guildId][userId].xp / 20));
  }

  const multiplier = getVoteMultiplier(userId);
  const actualXpGain = Math.round(xpGain * multiplier);

  const oldTotal = xpData[guildId][userId].xp;
  const newTotal = oldTotal + actualXpGain;
  xpData[guildId][userId].xp = newTotal;
  xpData[guildId][userId].username = user.username;

  const oldLevelInfo = calculateLevelFromXp(oldTotal);
  const newLevelInfo = calculateLevelFromXp(newTotal);
  const lvl = newLevelInfo.level;
  xpData[guildId][userId].level = lvl;

  // Level Up Trigger — only announce if this level has NEVER been announced before!
  const announcedLevel = xpData[guildId][userId].announced_level || 0;
  if (lvl > announcedLevel) {
    xpData[guildId][userId].announced_level = lvl;
    saveXpData();

    // 📢 ANNOUNCEMENT POLICY: Announce ONLY in Krims Code official server!
    // Silent leveling in all other servers to preserve tranquility and prevent unwanted cross-server spam.
    const isKrimsCodeGuild = guild.id === KRIMS_CODE_GUILD_ID || guild.name?.toLowerCase().includes('krims code');

    if (isKrimsCodeGuild && source !== 'voice') {
      let targetChannel = channel || guild.channels.cache.find(c => 
        c.name.includes('levels-and-rewards') || 
        c.name.includes('level-up') ||
        c.name.includes('general-chat') ||
        c.name.includes('chat')
      );

      if (targetChannel && targetChannel.send) {
        const boosterTag = multiplier > 1.0 ? ' • ⚡ 2x Vote Booster' : '';
        const msgCount = (xpData[guildId][userId].messages || 1).toLocaleString();
        const embed = new EmbedBuilder()
          .setColor(0x00E5FF)
          .setTitle(`🎉 LEVEL UP! — LEVEL ${lvl} REACHED!`)
          .setDescription(
            `GG <@${userId}>! You just leveled up to **Level ${lvl}** in **${guild.name}**! 🚀\n\n` +
            `💬 **Total Messages:** \`${msgCount}\`\n` +
            `⚡ **Total XP:** \`${newTotal.toLocaleString()} XP\`${boosterTag}\n\n` +
            `*Keep chatting to climb the Message & XP Leaderboard!*`
          )
          .setThumbnail(user.displayAvatarURL ? user.displayAvatarURL({ extension: 'png', size: 256 }) : null)
          .setFooter({ text: 'Krims Code AI • Progression Engine' })
          .setTimestamp();

        // Send WITHOUT user mention ping to keep chat clean and polite
        Promise.resolve(targetChannel.send({ embeds: [embed], allowedMentions: { users: [] } })).catch(() => {});
      }
    }

    // Role rewards (awarded automatically regardless of source)
    try {
      const member = await guild.members.fetch(userId);
      if (lvl >= 50) {
        const r = guild.roles.cache.find(role => role.name.includes('Level 50'));
        if (r) member.roles.add(r).catch(() => {});
      } else if (lvl >= 25) {
        const r = guild.roles.cache.find(role => role.name.includes('Level 25'));
        if (r) member.roles.add(r).catch(() => {});
      } else if (lvl >= 10) {
        const r = guild.roles.cache.find(role => role.name.includes('Level 10'));
        if (r) member.roles.add(r).catch(() => {});
      } else if (lvl >= 5) {
        const r = guild.roles.cache.find(role => role.name.includes('Level 5'));
        if (r) member.roles.add(r).catch(() => {});
      }
    } catch (e) {}
  } else {
    // Regular XP periodic save
    saveXpData();
  }
}

/**
 * Handles incoming chat messages to award XP (Krims Leveling System)
 */
export async function handleMessageXp(message, client) {
  if (!message.guild || message.author.bot) return;

  const userId = message.author.id;
  const guildId = message.guild.id;
  const key = `${guildId}_${userId}`;

  if (xpCooldowns.has(key)) return;

  // Add 1-minute cooldown for chat XP gain
  xpCooldowns.add(key);
  setTimeout(() => xpCooldowns.delete(key), 60000);

  // Random XP between 15 and 25
  const xpGain = Math.floor(Math.random() * 11) + 15;

  await awardUserXp({
    guild: message.guild,
    user: message.author,
    xpGain,
    source: 'chat',
    client,
    channel: message.channel
  });
}

// ═══════════════════════════════════════════════════════════
// 🎙️ VOICE LEVELING ENGINE
// Awards 10-20 XP every minute for active members in voice channels.
// Anti-cheat filters:
// - Excludes bots
// - Excludes AFK channels
// - Excludes self-deafened members
// - Requires at least 2 non-bot members in voice channel to prevent solo idling farming
// ═══════════════════════════════════════════════════════════
let voiceTickerStarted = false;

export function startVoiceLevelTicker(client) {
  if (voiceTickerStarted) return;
  voiceTickerStarted = true;

  console.log('🎙️ [VoiceLeveling] Voice XP Ticker Initialized (Running every 60s)...');

  setInterval(async () => {
    try {
      if (!client || !client.guilds) return;

      for (const guild of client.guilds.cache.values()) {
        const voiceChannels = guild.channels.cache.filter(c => c.isVoiceBased && c.isVoiceBased());

        for (const channel of voiceChannels.values()) {
          // Skip AFK channel if designated
          if (guild.afkChannelId && channel.id === guild.afkChannelId) continue;

          // Filter eligible members
          const activeMembers = channel.members.filter(m => !m.user.bot && !m.voice.deaf && !m.voice.selfDeaf);

          // Require at least 2 active human members in voice channel
          if (activeMembers.size < 2) continue;

          for (const member of activeMembers.values()) {
            // Give 10 - 20 XP per minute
            const voiceXp = Math.floor(Math.random() * 11) + 10;
            await awardUserXp({
              guild,
              user: member.user,
              xpGain: voiceXp,
              source: 'voice',
              client
            }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('[VoiceLeveling Error]:', err.message);
    }
  }, 60000); // 60 seconds
}

export function handleVoiceStateUpdate(oldState, newState, client) {
  // Can be used for instant join/leave tracking or telemetry
}

/**
 * Generates visual ASCII progress bar
 */
function createProgressBar(current, max, size = 12) {
  const progress = Math.min(Math.max(current / max, 0), 1);
  const filled = Math.round(progress * size);
  const empty = size - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * Send Graphical Rank Card (Both Interaction & Message friendly)
 */
export async function sendRankCard(context, targetUser = null) {
  const guild = context.guild;
  if (!guild) return;

  const user = targetUser || (context.user || context.author);
  const guildId = guild.id;

  const guildData = xpData[guildId] || {};
  const sorted = Object.entries(guildData).sort((a, b) => (b[1]?.xp || 0) - (a[1]?.xp || 0));
  const rankIndex = sorted.findIndex(([id]) => id === user.id);
  const rankPos = rankIndex !== -1 ? rankIndex + 1 : Math.max(1, sorted.length + 1);

  const userStats = guildData[user.id] || xpData[user.id] || { xp: 0, level: 0 };

  const isOwner = user.id === '1414143825538191373' || (guild && guild.ownerId === user.id);

  try {
    const cardBuffer = await generateRankCardBuffer({
      user,
      userStats: { ...userStats, isOwner },
      rankPos: isOwner ? '#0 (OWNER)' : rankPos
    });

    const attachment = new AttachmentBuilder(cardBuffer, { name: `rank-${user.username}.png` });

    const voteInfo = getVoteBoosterInfo(user.id);
    let boosterContent = '';
    if (isOwner) {
      boosterContent = `👑 **SERVER OWNER** • 🔥 **Supreme Founder Tier Active (3.0x Multiplier)** 🔥`;
    } else if (voteInfo.isActive) {
      boosterContent = `⚡ **TOP.GG VOTE BOOSTER:** \`2.0x XP ACTIVE\` *(Ends in ${voteInfo.remainingFormatted})* 🔥`;
    } else {
      boosterContent = `💤 **Vote Booster:** \`Inactive (1.0x)\` • Vote via \`/vote\` to activate **2.0x XP**!`;
    }

    const payload = {
      content: boosterContent,
      files: [attachment],
      components: []
    };

    const voteRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🗳️ Vote for 2x XP')
        .setStyle(ButtonStyle.Link)
        .setURL('https://top.gg/bot/1523794466740371586/vote'),
      new ButtonBuilder()
        .setCustomId('btn_refresh_vote_status')
        .setLabel('⚡ Vote Status')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_leaderboard_view')
        .setLabel('🏆 Leaderboard')
        .setStyle(ButtonStyle.Secondary)
    );
    payload.components = [voteRow];

    if (context.isChatInputCommand && context.isChatInputCommand()) {
      if (context.deferred) {
        return await context.editReply(payload);
      }
      return await context.reply(payload);
    } else if (context.reply) {
      return await context.reply(payload);
    } else if (context.channel && context.channel.send) {
      return await context.channel.send(payload);
    }
  } catch (err) {
    console.error('[RankCard Error]:', err);
    const fallbackText = `📊 **${user.username}** — Level **${userStats.level || 0}** • **${(userStats.xp || 0).toLocaleString()} XP** (Rank: #${rankPos})`;
    if (context.reply) return await context.reply(fallbackText).catch(() => {});
    if (context.channel) return await context.channel.send(fallbackText).catch(() => {});
  }
}

/**
 * Handle /rank command
 */
export async function handleRankCommand(interaction) {
  await interaction.deferReply().catch(() => {});
  const targetUser = interaction.options.getUser('user') || interaction.user;
  await sendRankCard(interaction, targetUser);
}

/**
 * Builds the rich leaderboard embed & action row buttons for either messages or XP
 */
export function buildLeaderboardPayload({ guild, type = 'messages', currentUserId }) {
  const guildId = guild?.id;
  const isKrimsCode = guildId === KRIMS_CODE_GUILD_ID || guild?.name?.toLowerCase().includes('krims code');
  const guildData = xpData[guildId] || {};

  // Sort based on type: 'messages' or 'xp'
  const isMessageMode = type === 'messages';
  const sorted = Object.entries(guildData).sort((a, b) => {
    if (isMessageMode) {
      const msgsA = a[1].messages ?? Math.max(1, Math.floor((a[1].xp || 0) / 20));
      const msgsB = b[1].messages ?? Math.max(1, Math.floor((b[1].xp || 0) / 20));
      return msgsB - msgsA;
    } else {
      return (b[1].xp || 0) - (a[1].xp || 0);
    }
  }).slice(0, 10);

  if (sorted.length === 0) {
    return {
      content: '📊 No player has recorded activity yet! Start chatting in the server to claim the #1 spot on the leaderboard!',
      embeds: [],
      components: []
    };
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const desc = sorted.map(([userId, data], i) => {
    const isOwner = userId === '1414143825538191373' || userId === guild?.ownerId;
    const badge = isOwner ? '👑 [OWNER]' : (medals[i] || `${i + 1}.`);
    const lvl = data.level || 0;
    const xp = (data.xp || 0).toLocaleString();
    const msgs = (data.messages ?? Math.max(1, Math.floor((data.xp || 0) / 20))).toLocaleString();

    if (isMessageMode) {
      return `${badge} **<@${userId}>** • **${msgs} Messages** • Level ${lvl} (${xp} XP)`;
    } else {
      return `${badge} **<@${userId}>** • **Level ${lvl}** (${xp} XP) • ${msgs} Messages`;
    }
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(isMessageMode ? 0x00E5FF : 0xFFD700)
    .setTitle(isMessageMode ? `💬 ${guild?.name || 'Community'} — TOP MESSAGES LEADERBOARD` : `⚡ ${guild?.name || 'Community'} — XP & LEVELS LEADERBOARD`)
    .setDescription(
      (isMessageMode 
        ? `🔥 **Top 10 Most Active Chatters** ranked by total messages sent:\n\n`
        : `⚡ **Top 10 Community Legends** ranked by earned XP and Level:\n\n`) +
      desc +
      `\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `💡 *Tip: Chat in public channels to gain XP & messages. Upvote on Top.gg for 2x XP!*`
    )
    .setThumbnail(guild?.iconURL ? guild.iconURL({ dynamic: true }) : null)
    .setFooter({ text: isKrimsCode ? 'Krims Code AI • Official Community Leaderboard' : `${guild?.name || 'Server'} • Krims Progression Engine` })
    .setTimestamp();

  // Interactive navigation buttons
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_lb_messages')
      .setLabel('💬 Messages')
      .setStyle(isMessageMode ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_lb_xp')
      .setLabel('⚡ XP & Levels')
      .setStyle(!isMessageMode ? ButtonStyle.Primary : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel('🗳️ Vote for 2x XP')
      .setStyle(ButtonStyle.Link)
      .setURL('https://top.gg/bot/1523794466740371586/vote')
  );

  // Announce to chat button — ONLY in Krims Code official server!
  if (isKrimsCode) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('btn_lb_announce_krims')
        .setLabel('📢 Announce to Chat')
        .setStyle(ButtonStyle.Success)
    );
  }

  return { embeds: [embed], components: [row] };
}

/**
 * Handle /leaderboard command (slash)
 */
export async function handleLeaderboardCommand(interaction, initialType = 'messages') {
  const chosenType = interaction.options?.getString?.('type') || initialType || 'messages';
  const payload = buildLeaderboardPayload({
    guild: interaction.guild,
    type: chosenType,
    currentUserId: interaction.user.id
  });

  if (interaction.deferred) {
    return await interaction.editReply(payload);
  }
  return await interaction.reply(payload);
}

/**
 * Handle prefix !leaderboard, !messages, !topmessages
 */
export async function handlePrefixLeaderboard(message, initialType = 'messages') {
  if (!message.guild) return;
  const payload = buildLeaderboardPayload({
    guild: message.guild,
    type: initialType,
    currentUserId: message.author.id
  });
  return await message.reply(payload);
}

/**
 * Handle interactive leaderboard button clicks
 */
export async function handleLeaderboardButton(interaction) {
  const customId = interaction.customId;
  const guild = interaction.guild;
  if (!guild) return false;

  if (customId === 'btn_lb_messages') {
    const payload = buildLeaderboardPayload({ guild, type: 'messages', currentUserId: interaction.user.id });
    await interaction.update(payload).catch(() => {});
    return true;
  }

  if (customId === 'btn_lb_xp') {
    const payload = buildLeaderboardPayload({ guild, type: 'xp', currentUserId: interaction.user.id });
    await interaction.update(payload).catch(() => {});
    return true;
  }

  if (customId === 'btn_lb_announce_krims') {
    const isKrimsCode = guild.id === KRIMS_CODE_GUILD_ID || guild.name?.toLowerCase().includes('krims code');
    if (!isKrimsCode) {
      await interaction.reply({
        content: '❌ Leaderboard chat announcements are configured exclusively for the official Krims Code server.',
        ephemeral: true
      }).catch(() => {});
      return true;
    }

    const payload = buildLeaderboardPayload({ guild, type: 'messages', currentUserId: interaction.user.id });
    const targetChannel = guild.channels.cache.find(c => 
      c.name.includes('announcements') || 
      c.name.includes('general-chat')
    ) || interaction.channel;

    if (targetChannel && targetChannel.send) {
      await targetChannel.send({
        content: '📢 **KRIMS CODE COMMUNITY LEADERBOARD UPDATE!** Here are the top chatters and XP leaders:',
        embeds: payload.embeds
      }).catch(() => {});
      await interaction.reply({
        content: `✅ Leaderboard successfully announced in <#${targetChannel.id}>!`,
        ephemeral: true
      }).catch(() => {});
      return true;
    } else {
      await interaction.reply({
        content: '❌ Could not find a suitable announcement channel.',
        ephemeral: true
      }).catch(() => {});
      return true;
    }
  }

  return false;
}

export function getUserLevel(guildId, userId) {
  if (!guildId || !userId) return 0;
  const userStats = xpData[guildId]?.[userId] || xpData[userId];
  if (!userStats) return 0;
  if (typeof userStats.level === 'number') return userStats.level;
  if (typeof userStats.xp === 'number') return calculateLevelFromXp(userStats.xp).level;
  return 0;
}
