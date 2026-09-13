import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateRankCardBuffer } from './rankCardGenerator.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const XP_DB_PATH = path.resolve(__dirname, '../xp.json');

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
 * Handles incoming chat messages to award XP (MEE6 System)
 */
export async function handleMessageXp(message, client) {
  if (!message.guild || message.author.bot) return;

  const userId = message.author.id;
  const guildId = message.guild.id;
  const key = `${guildId}_${userId}`;

  if (xpCooldowns.has(key)) return;

  // Add 1-minute cooldown for XP gain
  xpCooldowns.add(key);
  setTimeout(() => xpCooldowns.delete(key), 60000);

  // Random XP between 15 and 25
  const xpGain = Math.floor(Math.random() * 11) + 15;

  if (!xpData[guildId]) xpData[guildId] = {};
  if (!xpData[guildId][userId]) {
    xpData[guildId][userId] = {
      xp: 0,
      level: 0,
      username: message.author.username,
      discriminator: message.author.discriminator
    };
  }

  const oldTotal = xpData[guildId][userId].xp;
  const newTotal = oldTotal + xpGain;
  xpData[guildId][userId].xp = newTotal;
  xpData[guildId][userId].username = message.author.username;

  const oldLevelInfo = calculateLevelFromXp(oldTotal);
  const newLevelInfo = calculateLevelFromXp(newTotal);

  // Level Up Trigger — only announce if this level has NEVER been announced before!
  const announcedLevel = xpData[guildId][userId].announced_level || 0;
  if (newLevelInfo.level > announcedLevel) {
    const lvl = newLevelInfo.level;
    xpData[guildId][userId].announced_level = lvl;
    saveXpData();

    // Route all level-up celebrations EXCLUSIVELY to #📊┃levels-and-rewards so chat stays clean!
    let targetChannel = message.guild.channels.cache.find(c => 
      c.name.includes('levels-and-rewards') || 
      c.name.includes('level-up') ||
      c.name.includes('levels')
    );

    if (targetChannel) {
      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle(`🎉 LEVEL UP! — LEVEL ${lvl} REACHED!`)
        .setDescription(`GG **<@${userId}>**! You just leveled up to **Level ${lvl}** in **${message.guild.name}**! 🚀\nKeep chatting and participating in voice lounges to climb the leaderboard.`)
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
        .setFooter({ text: 'KryloSMP MEE6 Progression Engine' })
        .setTimestamp();

      targetChannel.send({ content: `<@${userId}>`, embeds: [embed] }).catch(() => {});
    }

    // Role rewards
    try {
      const member = await message.guild.members.fetch(userId);
      if (lvl >= 50) {
        const r = message.guild.roles.cache.find(role => role.name.includes('Level 50'));
        if (r) member.roles.add(r).catch(() => {});
      } else if (lvl >= 25) {
        const r = message.guild.roles.cache.find(role => role.name.includes('Level 25'));
        if (r) member.roles.add(r).catch(() => {});
      } else if (lvl >= 10) {
        const r = message.guild.roles.cache.find(role => role.name.includes('Level 10'));
        if (r) member.roles.add(r).catch(() => {});
      }
    } catch (e) {}
  }
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

  try {
    const cardBuffer = await generateRankCardBuffer({
      user,
      userStats,
      rankPos
    });

    const attachment = new AttachmentBuilder(cardBuffer, { name: `rank-${user.username}.png` });

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
        .setLabel('🛒 Store')
        .setStyle(ButtonStyle.Link)
        .setURL('https://krylosmp-store.web.app/')
    );

    const payload = {
      content: `⚡ **Vote Booster:** \`10%\` *(11 hours remaining)*`,
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
  const guildData = xpData[guildId] || {};
  const sorted = Object.entries(guildData).sort((a, b) => b[1].xp - a[1].xp).slice(0, 10);

  if (sorted.length === 0) {
    return interaction.reply({ content: '📊 No player has earned XP yet! Start chatting to claim the #1 spot!', ephemeral: true });
  }

  const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
  const desc = sorted.map(([userId, data], i) => {
    const medal = medals[i] || `${i + 1}.`;
    return `${medal} **<@${userId}>** • **Level ${data.level}** (${data.xp.toLocaleString()} XP)`;
  }).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle(`🏆 ${interaction.guild.name} — XP LEADERBOARD`)
    .setDescription(`Top 10 most active community members:\n\n${desc}`)
    .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
    .setFooter({ text: 'MEE6 Leaderboard Engine' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}
