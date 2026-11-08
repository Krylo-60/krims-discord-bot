
export function parseDurationToMs(str) {
  if (!str) return 0;
  const s = str.trim().toLowerCase();
  if (/^\d+$/.test(s)) return parseInt(s, 10) * 60 * 1000;
  const match = s.match(/^(\d+)\s*(month|months|mo|w|week|weeks|d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs)?$/);
  if (!match) return 0;
  const val = parseInt(match[1], 10);
  const unit = match[2] || 'm';
  if (unit.startsWith('mo')) return val * 30 * 24 * 60 * 60 * 1000;
  if (unit.startsWith('w')) return val * 7 * 24 * 60 * 60 * 1000;
  if (unit.startsWith('d')) return val * 24 * 60 * 60 * 1000;
  if (unit.startsWith('h')) return val * 60 * 60 * 1000;
  if (unit.startsWith('s')) return val * 1000;
  return val * 60 * 1000;
}

export function formatDurationHuman(ms) {
  const seconds = Math.floor(ms / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  if (days >= 30) return `${Math.round(days / 30)} Month(s)`;
  if (days > 0) return `${days} Day(s)${hours > 0 ? ` ${hours}h` : ''}`;
  if (hours > 0) return `${hours} Hour(s)${mins > 0 ? ` ${mins}m` : ''}`;
  return `${mins} Minute(s)`;
}

/**
 * ⚡ MINI'S COOL ROBLOX SERVER EXCLUSIVE ENGINE (Mini X #6403)
 * Strictly active for Mini X (1565848105277067414) in Mini's server (1568083131624460371)
 *
 * Implements:
 * 1. 💰 Server Currency: Cyber Shards (⚡) & Daily Quests (!daily, !balance, !pay)
 * 2. 📈 Leveling Auto-Rewards & Role Unlocks (Level 5 -> Cyber VIP, Level 15 -> Color Role)
 * 3. 🥇 Top Message Sender & Member of the Week Tracking (!topmessages, !weekly, !motw)
 * 4. 🎨 Custom Role Colors (!color <#hex>)
 * 5. ⚡ Blox Fruits & Server Daily Challenges (!challenges)
 * 6. 🎁 Weekly Giveaways Helper (!gstart) in #🎉・giveaways
 * 7. 🏆 Blox Fruits Tournaments Helper (!tournament)
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { handleChatModeration } from './chatModEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../data/krylosmp.db');

export const MINI_ROBLOX_GUILD_ID = '1568083131624460371';
export const MINI_X_BOT_ID = '1565848105277067414';
export const GIVEAWAYS_CHANNEL_ID = '1568087136861691944'; // #🎉・giveaways
export const GENERAL_CHAT_ID = '1568086296189079582';      // #💬・general-chat
export const BOT_COMMANDS_ID = '1568086897795014767';      // #🤖・bot-commands

// Special Roles in Mini's server
export const CYBER_VIP_ROLE_ID = '1568426767750922360';   // ⚡𓆪・𝑴𝒊𝒏𝒊 𝑿 𝑪𝒚𝒃𝒆𝒓 𝑽𝑰𝑷『💠』
export const GIVEAWAY_PING_ID = '1568426782065959063';    // 🎁・𝑮𝒊𝒗𝒆𝒂𝒘𝒂𝒚𝒔 𝑷𝒊𝒏𝒈
export const TOURNAMENT_CHAMP_ROLE_ID = '1568426763120541857'; // 🏆𓆪・𝑻𝒐𝒖𝒓𝒏𝒂𝒎𝒆𝒏𝒕 𝑪𝒉𝒂𝒎𝒑𝒊𝒐𝒏『🥇』

let db;
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS mini_roblox_economy (
        user_id TEXT PRIMARY KEY,
        shards INTEGER DEFAULT 0,
        last_daily INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS mini_roblox_activity (
        user_id TEXT,
        week_key TEXT,
        message_count INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, week_key)
      );
    `);
  }
  return db;
}

function getWeekKey() {
  const d = new Date();
  const year = d.getUTCFullYear();
  const week = Math.ceil((((d - new Date(Date.UTC(year, 0, 1))) / 86400000) + 1) / 7);
  return `${year}-W${week}`;
}

// 1. Track Weekly Messages for Member of the Week
export function trackMiniServerActivity(userId) {
  try {
    const database = getDb();
    const weekKey = getWeekKey();
    database.prepare(`
      INSERT INTO mini_roblox_activity (user_id, week_key, message_count) 
      VALUES (?, ?, 1) 
      ON CONFLICT(user_id, week_key) DO UPDATE SET message_count = message_count + 1
    `).run(userId, weekKey);
  } catch (err) {
    console.error('[MiniEngine] Error tracking activity:', err.message);
  }
}

// 2. Auto-Assign Role Rewards on Level Up in Mini's Server
export async function checkAndApplyMiniLevelRoles(guild, member, newLevel) {
  if (!guild || !member || guild.id !== MINI_ROBLOX_GUILD_ID) return;

  // Level 5 Unlock: Mini X Cyber VIP
  if (newLevel >= 5) {
    const vipRole = guild.roles.cache.get(CYBER_VIP_ROLE_ID);
    if (vipRole && !member.roles.cache.has(vipRole.id)) {
      try {
        await member.roles.add(vipRole);
        console.log(`[MiniServer] ⚡ Auto-assigned Cyber VIP to ${member.user.username} for reaching Level ${newLevel}!`);

        const botCommandsCh = guild.channels.cache.get(BOT_COMMANDS_ID) || guild.channels.cache.get(GENERAL_CHAT_ID);
        if (botCommandsCh && botCommandsCh.isTextBased()) {
          const vipEmbed = new EmbedBuilder()
            .setColor(0x00F2FF)
            .setTitle('⚡ CYBER VIP UNLOCKED • MINI X REWARD!')
            .setDescription(
              `Huge GG <@${member.id}>! You reached **Level ${newLevel}** and unlocked:\n\n` +
              `👑 **\`⚡𓆪・𝑴𝒊𝒏𝒊 𝑿 𝑪𝒚𝒃𝒆𝒓 𝑽𝑰𝑷『💠』\`**\n\n` +
              `• ⚡ VIP Queue & Chat Status\n` +
              `• 🎨 Custom Color Role eligibility (\`!color\`)\n` +
              `• 🎁 Multiplier bonus on daily shards!`
            )
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ text: 'Mini X • Co-Created by Mini & Krylo' })
            .setTimestamp();

          await botCommandsCh.send({ content: `🎉 <@${member.id}> unlocked **Cyber VIP**!`, embeds: [vipEmbed] }).catch(() => {});
        }
      } catch (err) {
        console.warn(`[MiniServer] Error adding VIP role to ${member.user.username}:`, err.message);
      }
    }
  }
}

// 3. Main Message Handler for Mini X in Mini's Server
export async function handleMiniRobloxServerMessage(client, message) {
  if (!message.guild || message.guild.id !== MINI_ROBLOX_GUILD_ID) return false;
  if (client.user.id !== MINI_X_BOT_ID) return false;
  if (message.author.bot) return false;

  // 🛡️ Admin Moderation Actions (ban, kick, mute, unmute, purge, lock, slowmode)
  const isModHandled = await handleChatModeration(client, message);
  if (isModHandled) return true;

  // Track activity
  trackMiniServerActivity(message.author.id);

  const text = message.content.trim();
  const lower = text.toLowerCase();
  const database = getDb();

  // Command: !daily (Claim Cyber Shards)
  if (lower === '!daily' || lower === '!claim') {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const twoDays = 48 * 60 * 60 * 1000;

    let row = database.prepare(`SELECT shards, last_daily, streak FROM mini_roblox_economy WHERE user_id = ?`).get(message.author.id);
    let shards = row ? row.shards : 0;
    let lastDaily = row ? row.last_daily : 0;
    let streak = row ? row.streak : 0;

    if (now - lastDaily < oneDay) {
      const timeLeft = oneDay - (now - lastDaily);
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const mins = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return message.reply(`⏳ You already claimed your daily Cyber Shards! Come back in **${hours}h ${mins}m**.`);
    }

    if (now - lastDaily < twoDays) {
      streak += 1;
    } else {
      streak = 1;
    }

    const baseReward = 500;
    const streakBonus = Math.min((streak - 1) * 50, 500);
    const totalReward = baseReward + streakBonus;
    shards += totalReward;

    database.prepare(`
      INSERT INTO mini_roblox_economy (user_id, shards, last_daily, streak) 
      VALUES (?, ?, ?, ?) 
      ON CONFLICT(user_id) DO UPDATE SET shards = shards + ?, last_daily = ?, streak = ?
    `).run(message.author.id, totalReward, now, streak, totalReward, now, streak);

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('⚡ DAILY CYBER SHARDS CLAIMED! ⚡')
      .setDescription(
        `You claimed your daily energy shards!\n\n` +
        `• 🪙 **Base Reward:** +${baseReward} ⚡\n` +
        `• ⚡ **Streak Bonus (Day ${streak}):** +${streakBonus} ⚡\n` +
        `• 💰 **Total Earned:** **+${totalReward} ⚡ Shards**\n` +
        `• 💎 **Current Balance:** **${shards.toLocaleString()} ⚡ Shards**`
      )
      .setFooter({ text: 'Mini X • Mini\'s Cool Roblox Server' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // Command: !balance / !shards / !coins
  if (lower === '!balance' || lower === '!shards' || lower === '!coins') {
    const targetUser = message.mentions.users.first() || message.author;
    const row = database.prepare(`SELECT shards, streak FROM mini_roblox_economy WHERE user_id = ?`).get(targetUser.id);
    const shards = row ? row.shards : 0;
    const streak = row ? row.streak : 0;

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
      .setTitle(`⚡ CYBER VAULT BALANCE`)
      .setDescription(
        `**Cyber Shards:** \`${shards.toLocaleString()}\` ⚡\n` +
        `**Daily Streak:** \`${streak} Days\` 🔥\n` +
        `**Server:** Mini's cool roblox server 🎮`
      )
      .setFooter({ text: 'Use !daily to collect more shards every 24 hours!' });

    return message.reply({ embeds: [embed] });
  }

  // Command: !pay @user <amount>
  if (lower.startsWith('!pay')) {
    const args = text.split(/\s+/).slice(1);
    const recipient = message.mentions.users.first();
    const amount = parseInt(args[1], 10);

    if (!recipient || recipient.bot || recipient.id === message.author.id || isNaN(amount) || amount <= 0) {
      return message.reply('❌ **Usage:** `!pay @user <amount>` (Must be a valid shard amount).');
    }

    const row = database.prepare(`SELECT shards FROM mini_roblox_economy WHERE user_id = ?`).get(message.author.id);
    const senderShards = row ? row.shards : 0;
    if (senderShards < amount) {
      return message.reply(`❌ You only have **${senderShards.toLocaleString()} ⚡**! You need **${amount.toLocaleString()} ⚡**.`);
    }

    const transfer = database.transaction(() => {
      database.prepare(`UPDATE mini_roblox_economy SET shards = shards - ? WHERE user_id = ?`).run(amount, message.author.id);
      database.prepare(
        `INSERT INTO mini_roblox_economy (user_id, shards) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET shards = shards + ?`
      ).run(recipient.id, amount, amount);
    });
    transfer();

    return message.reply(`⚡ **Transfer Successful!** Sent **${amount.toLocaleString()} ⚡ Cyber Shards** to <@${recipient.id}>!`);
  }

  // Command: !topmessages / !weekly / !motw (Member of the Week)
  if (lower === '!topmessages' || lower === '!weekly' || lower === '!motw' || lower === '!active') {
    const weekKey = getWeekKey();
    const rows = database.prepare(
      `SELECT user_id, message_count FROM mini_roblox_activity WHERE week_key = ? ORDER BY message_count DESC LIMIT 10`
    ).all(weekKey);

    if (!rows || rows.length === 0) {
      return message.reply('📊 No message activity recorded for this week yet! Start chatting in #general-chat to top the charts!');
    }

    let desc = '👑 **Top Active Chatters This Week:**\n\n';
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹';
      desc += `${medal} **#${i + 1}** <@${r.user_id}> — **${r.message_count.toLocaleString()} messages**\n`;
    }
    desc += `\n*The top member at the end of the week earns **Member of the Week** status & 2,500 bonus ⚡ Shards!* 🏆`;

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('⭐ MEMBER OF THE WEEK • ACTIVITY LEADERBOARD')
      .setDescription(desc)
      .setFooter({ text: 'Mini X • Activity Tracker' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // Command: !challenges / !challenge (Blox Fruits & Server Quests)
  if (lower === '!challenges' || lower === '!challenge') {
    const embed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('⚡ MINI\'S SERVER DAILY & WEEKLY QUESTS')
      .setDescription(
        `Complete these challenges to earn bonus **Cyber Shards** and level up faster!\n\n` +
        `• 💬 **Chat Grind:** Send 50 messages in <#1568086296189079582> — \`+300 ⚡\`\n` +
        `• 💪 **Raid Trooper:** Assist someone in <#1568094033061089431> — \`+500 ⚡\`\n` +
        `• 🌊 **Sea Hunter:** Join a Sea Event squad in <#1568093722103521290> — \`+600 ⚡\`\n` +
        `• 💎 **Trade Master:** Post a legitimate trade in <#1568093586476765234> — \`+250 ⚡\`\n` +
        `• 🎁 **Luck Seeker:** React to a giveaway in <#1568087136861691944> — \`+150 ⚡\`\n\n` +
        `*Use \`!daily\` every day to build your streak bonus!* 🔥⚡`
      )
      .setFooter({ text: 'Mini X • Blox Fruits & Community Hub' });

    return message.reply({ embeds: [embed] });
  }

  // Command: !color <hex> (Custom Role Color for Cyber VIP / Level 15+ / Boosters)
  if (lower.startsWith('!color')) {
    const args = text.split(/\s+/).slice(1);
    const hex = args[0];

    if (!hex || !/^#?([a-fA-F0-9]{6})$/.test(hex)) {
      return message.reply('❌ **Usage:** `!color #00F2FF` (Provide a valid 6-digit hex color code).');
    }

    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;
    const member = message.member;

    const hasPerk = member.roles.cache.some(r => 
      r.id === CYBER_VIP_ROLE_ID || 
      r.name.includes('FOUNDER') || 
      r.name.includes('CO-FOUNDER') ||
      r.name.includes('Moderator') ||
      r.name.includes('Role Maker') ||
      r.name.includes('BOOSTER')
    );

    if (!hasPerk) {
      return message.reply('🔒 Custom role colors are unlocked for **⚡ Cyber VIP (Level 5+)**, **Staff**, and **Boosters**! Keep chatting to unlock!');
    }

    try {
      const colorRoleName = `🎨 ${member.user.username}`;
      let customRole = message.guild.roles.cache.find(r => r.name === colorRoleName);

      if (customRole) {
        await customRole.setColor(cleanHex);
      } else {
        customRole = await message.guild.roles.create({
          name: colorRoleName,
          color: cleanHex,
          permissions: [],
          reason: `Custom Color Role for ${member.user.username} via Mini X`
        });
        await member.roles.add(customRole);
      }

      return message.reply(`🎨 **Color Applied!** Your custom role color is now **\`${cleanHex.toUpperCase()}\`**! ✨`);
    } catch (colorErr) {
      return message.reply(`⚠️ Could not create color role: ${colorErr.message}`);
    }
  }

  // Command: !gstart <time_minutes> <prize> (Giveaways in #🎉・giveaways)
  if (lower.startsWith('!gstart') || lower.startsWith('!giveaway')) {
    const isStaff = message.author.id === '1414143825538191373' ||
      message.guild.ownerId === message.author.id ||
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.roles.cache.some(r => {
        const norm = r.name.normalize('NFKD').toLowerCase();
        return norm.includes('founder') || norm.includes('moderator') || norm.includes('maker') || r.name.includes('𝐅𝐎𝐔𝐍𝐃𝐄𝐑');
      });

    if (!isStaff) {
      return message.reply('❌ Only Staff and Announcement Makers can start giveaways!');
    }

    const args = text.split(/\s+/).slice(1);
    let durationStr = '';
    let prize = '';

    if (args[0] && /^\d+$/.test(args[0]) && args[1] && /^(month|months|mo|w|week|weeks|d|day|days|h|hr|hrs|hour|hours|m|min|mins|minute|minutes|s|sec|secs)$/i.test(args[1])) {
      durationStr = `${args[0]}${args[1]}`;
      prize = args.slice(2).join(' ') || 'Mystery Reward';
    } else {
      durationStr = args[0] || '';
      prize = args.slice(1).join(' ') || 'Mystery Reward';
    }

    const durationMs = parseDurationToMs(durationStr);

    if (durationMs <= 0) {
      return message.reply('❌ **Usage:** `!gstart <duration> <prize name>`\nExamples:\n• `!gstart 4 days Buddha Fruit`\n• `!gstart 1month Permanent Buddha Fruit`\n• `!gstart 7d VIP Color Role`\n• `!gstart 60m 5,000 Cyber Shards`');
    }

    const humanDuration = formatDurationHuman(durationMs);
    const endTime = Date.now() + durationMs;

    const targetChannel = message.guild.channels.cache.get(GIVEAWAYS_CHANNEL_ID) || 
      message.guild.channels.cache.find(c => c.name.includes('giveaway')) || 
      message.channel;

    const gEmbed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🎉 MINI\'S SERVER OFFICIAL GIVEAWAY! 🎉')
      .setDescription(
        `**Prize:** 🎁 **${prize}**\n` +
        `**Hosted By:** <@${message.author.id}>\n` +
        `**Duration:** \`${humanDuration}\` (Ends: <t:${Math.floor(endTime / 1000)}:R>)\n\n` +
        `React with 🎉 below to enter!`
      )
      .setFooter({ text: 'Mini X • Weekly Giveaways Engine' })
      .setTimestamp(endTime);

    const gMsg = await targetChannel.send({
      content: `🚨 <@&${GIVEAWAY_PING_ID}> **A NEW GIVEAWAY HAS DROPPED!** 🚨`,
      embeds: [gEmbed]
    });
    await gMsg.react('🎉').catch(() => {});

    if (targetChannel.id !== message.channel.id) {
      message.reply(`✅ **Giveaway Launched!** Prize: **${prize}** for **${humanDuration}** in <#${targetChannel.id}>!`);
    } else {
      message.reply(`✅ **Giveaway Launched!** React with 🎉 to enter!`);
    }
    return true;
  }

  // Command: !tournament
  if (lower === '!tournament' || lower === '!tournaments') {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🏆 BLOX FRUITS PVP TOURNAMENTS')
      .setDescription(
        `Prove you are the strongest fighter in the server!\n\n` +
        `• ⚔️ **PVP Arena:** <#1568096059060785253> & #🥇tournaments VC\n` +
        `• 🥇 **Champion Rewards:** Unlock <@&${TOURNAMENT_CHAMP_ROLE_ID}> + 10,000 ⚡ Cyber Shards!\n` +
        `• 📋 **Rules:** No exploiting, no outside interference, best of 3 rounds.\n\n` +
        `*Stay tuned in announcements for the next tournament date!* ⚔️🔥`
      )
      .setFooter({ text: 'Mini X • Tournament Coordinator' });

    return message.reply({ embeds: [embed] });
  }

  // Command: !claimroles / !autorole / !roles
  if (lower === '!claimroles' || lower === '!autorole' || lower === '!roles') {
    const { assignMiniCommunityAutoRoles } = await import('../customBotSpawner.mjs');
    const added = await assignMiniCommunityAutoRoles(message.member);
    if (added && added.length > 0) {
      return message.reply(`⚡ **Roles Assigned!** Granted: ${added.map(r => `\`${r.name}\``).join(', ')} 🎉`);
    } else {
      return message.reply(`✅ You already have all 4 community roles (\`Members\`, \`🔔 𓆩・𝐔𝐏𝐃𝐀𝐓𝐄 𝐏𝐈𝐍𝐆\`, \`📢・𝑨𝒏𝒏𝒐𝒖𝒏𝒄𝒆𝒎𝒆𝒏𝒕𝒔 𝑷𝒊𝒏𝒈\`, \`⚡ 𓆩・𝐑𝐎𝐋𝐄 𝐏𝐈𝐍𝐆\`)!`);
    }
  }

  // Command: !minihelp (Full features list)
  if (lower === '!minihelp' || lower === '!cyberhelp') {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('⚡ MINI X • SERVER FEATURES & COMMANDS')
      .setDescription(
        `Welcome to Mini's Cool Roblox Server feature suite!\n\n` +
        `🪙 **Economy & Daily:**\n` +
        `• \`!daily\` — Claim daily Cyber Shards ⚡ + streak bonus\n` +
        `• \`!balance\` — Check your shard balance & streak\n` +
        `• \`!pay @user <amount>\` — Send shards to a friend\n` +
        `• \`!challenges\` — View daily Blox Fruits & server quests\n\n` +
        `⭐ **Community & Roles:**\n` +
        `• \`!claimroles\` — Auto-claim all 4 ping and member roles\n` +
        `• \`!weekly\` / \`!topmessages\` — Member of the Week activity leaderboard\n` +
        `• \`!color #HEX\` — Set your custom role color (Cyber VIP or Staff)\n` +
        `• \`!tournament\` — Info on Blox Fruits PVP tournaments\n` +
        `• \`!gstart <mins> <prize>\` — Staff giveaway launcher\n\n` +
        `🛡️ **Admin & Founder Moderation (Admin Only):**\n` +
        `• \`ban <@user/name> [reason]\` — Instant server ban\n` +
        `• \`kick <@user/name> [reason]\` — Kick member from server\n` +
        `• \`mute <@user/name> <10m/1h/24h> [reason]\` — Timeout member\n` +
        `• \`unmute <@user/name>\` — Remove member timeout\n` +
        `• \`purge <1-100>\` / \`clear <1-100>\` — Bulk delete messages\n` +
        `• \`warn <@user/name> [reason]\` — Issue official warning\n` +
        `• \`lock\` / \`unlock\` — Lock/unlock channel for members\n` +
        `• \`slowmode <5s/off>\` — Adjust channel rate limit`
      )
      .setFooter({ text: 'Mini X #6403 • Co-Created by Mini & Krylo' });

    return message.reply({ embeds: [embed] });
  }

  return false;
}
