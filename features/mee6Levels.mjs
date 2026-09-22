import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateRankCardBuffer } from './rankCardGenerator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const XP_DB_PATH = path.resolve(__dirname, '../mee6_xp.json');

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
export async function awardUserXp({ guild, user, xpGain = 20, source = 'chat', client }) {
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
      announced_level: 0
    };
  }

  const oldTotal = xpData[guildId][userId].xp;
  const newTotal = oldTotal + xpGain;
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

    // Do NOT spam announcements for voice lounge XP (voice XP accumulates silently)
    // and only announce meaningful milestone levels (Level 5, 10, 15, 20, 25, etc.)
    if (source !== 'voice' && lvl >= 5) {
      let targetChannel = guild.channels.cache.find(c => 
        c.name.includes('levels-and-rewards') || 
        c.name.includes('level-up') ||
        c.name.includes('levels')
      );

      if (targetChannel) {
        const sourceBadge = '💬 [Chat Activity]';
        const embed = new EmbedBuilder()
          .setColor(0x00E5FF)
          .setTitle(`🎉 LEVEL UP! — LEVEL ${lvl} REACHED!`)
          .setDescription(`GG **${user.username}**! You just leveled up to **Level ${lvl}** in **${guild.name}**! 🚀\n*Earned via ${sourceBadge}*\nKeep chatting to climb the leaderboard!`)
          .setThumbnail(user.displayAvatarURL ? user.displayAvatarURL({ dynamic: true }) : null)
          .setFooter({ text: 'KryloSMP Progression Engine' })
          .setTimestamp();

        // Send WITHOUT user mention ping to keep channel clean and peaceful
        targetChannel.send({ embeds: [embed], allowedMentions: { users: [] } }).catch(() => {});
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
 * Handles incoming chat messages to award XP (MEE6 System)
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
    client
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

    const isSkybase = guild.id === '1549875778575929446';
    const storeUrl = isSkybase ? 'https://krims-code-chatbot.vercel.app/' : 'https://krylosmp-store.web.app/';

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_leaderboard_view')
        .setLabel('🏆 Leaderboard')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('btn_daily_claim')
        .setLabel('🎁 Daily Bonus')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setLabel(isSkybase ? '🌐 Portal' : '🛒 Store')
        .setStyle(ButtonStyle.Link)
        .setURL(storeUrl)
    );

    const boosterContent = isOwner
      ? `👑 **SERVER OWNER** • ⚡ **Vote Booster:** \`100%\` *(Supreme Aura & Founder Tier Active)* 🔥`
      : `⚡ **Vote Booster:** \`10%\` *(Daily community perk active)*`;

    const payload = {
      content: boosterContent,
      files: [attachment],
      components: [row]
    };

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
 * Handle /leaderboard command
 */
export async function handleLeaderboardCommand(interaction) {
  const guildId = interaction.guild.id;
  const isSkybase = guildId === '1549875778575929446';
  const guildData = xpData[guildId] || {};
  const sorted = Object.entries(guildData).sort((a, b) => b[1].xp - a[1].xp).slice(0, 10);

  if (sorted.length === 0) {
    return interaction.reply({ content: '📊 No player has earned XP yet! Start chatting to claim the #1 spot!', ephemeral: true });
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const desc = sorted.map(([userId, data], i) => {
    const isOwner = userId === '1414143825538191373' || userId === interaction.guild?.ownerId;
    const badge = isOwner ? '👑 [OWNER]' : (medals[i] || `${i + 1}.`);
    return `${badge} **<@${userId}>** • **Level ${data.level}** (${data.xp.toLocaleString()} XP)`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle(`🏆 ${interaction.guild.name} — XP LEADERBOARD`)
    .setDescription(`Top 10 most active community members:\n\n${desc}`)
    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
    .setFooter({ text: isSkybase ? "Krylo's Skybase Leaderboard Engine" : 'MEE6 Leaderboard Engine' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

export function getUserLevel(guildId, userId) {
  if (!guildId || !userId) return 0;
  const userStats = xpData[guildId]?.[userId] || xpData[userId];
  if (!userStats) return 0;
  if (typeof userStats.level === 'number') return userStats.level;
  if (typeof userStats.xp === 'number') return calculateLevelFromXp(userStats.xp).level;
  return 0;
}
