
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
 * 👑 PHOENIX DEN EXCLUSIVE SYSTEM ENGINE (Baby PHOENIX #8301)
 * Strictly active ONLY for Baby Phoenix (1565527301444083722) in Phoenix Den (1534016405693796462)
 *
 * Implements the 2-Week Server Feature Roadmap:
 * 1. 💰 Server Currency & Daily Challenges (Phoenix Flames 🔥)
 * 2. 📈 Leveling Role Escalation & Auto-Rewards (Levels 5 -> 90)
 * 3. 🥇 Top Message Sender & Member of the Week Tracking
 * 4. 🎨 Custom Role Colors (!color)
 * 5. 👑 OG & Elite Status (!elite / !og)
 * 6. 🎁 Weekly Giveaways & Monthly Tournaments Helpers
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../data/krylosmp.db');

export const PHOENIX_DEN_GUILD_ID = '1534016405693796462';
export const BABY_PHOENIX_BOT_ID = '1565527301444083722';
export const LEVEL_UPS_CHANNEL_ID = '1553500520508035122'; // #⭐・level-ups
export const TOURNAMENT_CHAT_ID = '1559739777236996216';   // #⚔️・tournament-chat
export const GIVEAWAYS_CHANNEL_ID = '1567953625693687938'; // #giveaways

// Level Roles Mapping in Phoenix Den
export const PHOENIX_LEVEL_ROLES = [
  { level: 5,  roleId: '1550221987895451751', name: 'LVL 5-BABY PHOENIX' },
  { level: 10, roleId: '1550222117923201184', name: 'LVL 10-ASHLING' },
  { level: 15, roleId: '1550222240841207928', name: 'LVL 15-CINDER' },
  { level: 20, roleId: '1550222372416520327', name: 'LVL 20-EMBER' },
  { level: 30, roleId: '1550222615275245619', name: 'LVL 30-FLARE' },
  { level: 40, roleId: '1550223077718364280', name: 'LEVEL 40-BLAZE' },
  { level: 50, roleId: '1550223216440512682', name: 'LVL 50-PHOENIX' },
  { level: 60, roleId: '1550223329636524202', name: 'LVL 60-INFERNO WIN' },
  { level: 65, roleId: '1559744102994546708', name: 'LVL 65-NOVA FLAME' },
  { level: 70, roleId: '1559745267690115122', name: 'LVL 70-INFERNO' },
  { level: 80, roleId: '1559745472443453500', name: 'LVL 80-ETERNAL PHOENIX' },
  { level: 90, roleId: '1564813220571652298', name: 'LVL 90-APEX PHOENIX [GOD]' }
];

let db;
function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS phoenix_den_economy (
        user_id TEXT PRIMARY KEY,
        flames INTEGER DEFAULT 0,
        last_daily INTEGER DEFAULT 0,
        streak INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS phoenix_den_activity (
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

// 1. Record Message Activity for Member of the Week
export function trackPhoenixDenActivity(userId) {
  try {
    const database = getDb();
    const weekKey = getWeekKey();
    database.prepare(`
      INSERT INTO phoenix_den_activity (user_id, week_key, message_count) 
      VALUES (?, ?, 1) 
      ON CONFLICT(user_id, week_key) DO UPDATE SET message_count = message_count + 1
    `).run(userId, weekKey);
  } catch (err) {
    console.error('[PhoenixDen] Error tracking activity:', err.message);
  }
}

// 2. Auto-Assign Phoenix Level Role upon level up
export async function checkAndApplyPhoenixLevelRoles(guild, member, newLevel) {
  if (!guild || !member || guild.id !== PHOENIX_DEN_GUILD_ID) return;

  const qualifiedRoles = PHOENIX_LEVEL_ROLES.filter(r => newLevel >= r.level);
  if (qualifiedRoles.length === 0) return;

  // The highest role unlocked
  const targetTier = qualifiedRoles[qualifiedRoles.length - 1];
  const targetRole = guild.roles.cache.get(targetTier.roleId);

  if (targetRole && !member.roles.cache.has(targetRole.id)) {
    try {
      await member.roles.add(targetRole);
      console.log(`[PhoenixDen] 🔥 Assigned ${targetRole.name} to ${member.user.username} for reaching Level ${newLevel}!`);

      // Post celebration in #⭐・level-ups
      const levelChannel = guild.channels.cache.get(LEVEL_UPS_CHANNEL_ID);
      if (levelChannel && levelChannel.isTextBased()) {
        const fireEmbed = new EmbedBuilder()
          .setColor(0xFF6B00)
          .setTitle('🔥 PHOENIX ASCENSION • NEW ROLE UNLOCKED!')
          .setDescription(
            `Congratulations <@${member.id}>! You reached **Level ${newLevel}** and unlocked the sacred role:\n\n` +
            `👑 **\`${targetRole.name}\`**\n\n` +
            `*Keep chatting and burning bright in Phoenix Den!* 🪶✨`
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setFooter({ text: 'Baby PHOENIX • Phoenix Den Sovereign Level Engine' })
          .setTimestamp();

        await levelChannel.send({
          content: `🎉 <@${member.id}> unlocked **${targetRole.name}**!`,
          embeds: [fireEmbed]
        }).catch(() => {});
      }
    } catch (roleErr) {
      console.warn(`[PhoenixDen] Error adding level role to ${member.user.username}:`, roleErr.message);
    }
  }
}

// 3. Main Message Handler for Baby Phoenix in Phoenix Den
export async function handleBabyPhoenixDenMessage(client, message) {
  if (!message.guild || message.guild.id !== PHOENIX_DEN_GUILD_ID) return false;
  if (client.user.id !== BABY_PHOENIX_BOT_ID) return false;
  if (message.author.bot) return false;

  // Track activity count
  trackPhoenixDenActivity(message.author.id);

  const text = message.content.trim();
  const lower = text.toLowerCase();
  const database = getDb();

  // Command: !daily (Claim Phoenix Flames)
  if (lower === '!daily' || lower === '!claim') {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    const twoDays = 48 * 60 * 60 * 1000;

    let row = database.prepare(`SELECT flames, last_daily, streak FROM phoenix_den_economy WHERE user_id = ?`).get(message.author.id);
    let flames = row ? row.flames : 0;
    let lastDaily = row ? row.last_daily : 0;
    let streak = row ? row.streak : 0;

    if (now - lastDaily < oneDay) {
      const timeLeft = oneDay - (now - lastDaily);
      const hours = Math.floor(timeLeft / (60 * 60 * 1000));
      const mins = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
      return message.reply(`⏳ You already claimed your daily flames! Come back in **${hours}h ${mins}m**.`);
    }

    // Calculate streak
    if (now - lastDaily < twoDays) {
      streak += 1;
    } else {
      streak = 1;
    }

    const baseReward = 500;
    const streakBonus = Math.min((streak - 1) * 50, 500);
    const totalReward = baseReward + streakBonus;
    flames += totalReward;

    database.prepare(`
      INSERT INTO phoenix_den_economy (user_id, flames, last_daily, streak) 
      VALUES (?, ?, ?, ?) 
      ON CONFLICT(user_id) DO UPDATE SET flames = flames + ?, last_daily = ?, streak = ?
    `).run(message.author.id, totalReward, now, streak, totalReward, now, streak);

    const embed = new EmbedBuilder()
      .setColor(0xFF6B00)
      .setTitle('🔥 DAILY PHOENIX FLAMES CLAIMED! 🔥')
      .setDescription(
        `You claimed your daily flame shards!\n\n` +
        `• 🪙 **Base Reward:** +${baseReward} 🔥\n` +
        `• ⚡ **Streak Bonus (Day ${streak}):** +${streakBonus} 🔥\n` +
        `• 💰 **Total Earned:** **+${totalReward} 🔥**\n` +
        `• 💎 **Current Balance:** **${flames.toLocaleString()} 🔥 Flames**`
      )
      .setFooter({ text: 'Baby PHOENIX • Phoenix Den Economy' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // Command: !balance / !flames / !coins
  if (lower === '!balance' || lower === '!flames' || lower === '!coins') {
    const targetUser = message.mentions.users.first() || message.author;
    const row = database.prepare(`SELECT flames, streak FROM phoenix_den_economy WHERE user_id = ?`).get(targetUser.id);
    const flames = row ? row.flames : 0;
    const streak = row ? row.streak : 0;

    const embed = new EmbedBuilder()
      .setColor(0xFF6B00)
      .setAuthor({ name: targetUser.username, iconURL: targetUser.displayAvatarURL() })
      .setTitle(`🔥 PHOENIX VAULT BALANCE`)
      .setDescription(
        `**Flames:** \`${flames.toLocaleString()}\` 🔥\n` +
        `**Daily Streak:** \`${streak} Days\` ⚡\n` +
        `**Server:** 👑 Phoenix Den A Gaming Server`
      )
      .setFooter({ text: 'Use !daily to collect more flames every 24 hours!' });

    return message.reply({ embeds: [embed] });
  }

  // Command: !pay @user <amount>
  if (lower.startsWith('!pay')) {
    const args = text.split(/\s+/).slice(1);
    const recipient = message.mentions.users.first();
    const amount = parseInt(args[1], 10);

    if (!recipient || recipient.bot || recipient.id === message.author.id || isNaN(amount) || amount <= 0) {
      return message.reply('❌ **Usage:** `!pay @user <amount>` (Must be a valid flame amount).');
    }

    const row = database.prepare(`SELECT flames FROM phoenix_den_economy WHERE user_id = ?`).get(message.author.id);
    const senderFlames = row ? row.flames : 0;
    if (senderFlames < amount) {
      return message.reply(`❌ You only have **${senderFlames.toLocaleString()} 🔥**! You need **${amount.toLocaleString()} 🔥**.`);
    }

    const transfer = database.transaction(() => {
      database.prepare(`UPDATE phoenix_den_economy SET flames = flames - ? WHERE user_id = ?`).run(amount, message.author.id);
      database.prepare(
        `INSERT INTO phoenix_den_economy (user_id, flames) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET flames = flames + ?`
      ).run(recipient.id, amount, amount);
    });
    transfer();

    return message.reply(`🔥 **Transfer Successful!** Sent **${amount.toLocaleString()} 🔥 Flames** to <@${recipient.id}>!`);
  }

  // Command: !topmessages / !weekly / !motw (Member of the Week / Most Active)
  if (lower === '!topmessages' || lower === '!weekly' || lower === '!motw' || lower === '!active') {
    const weekKey = getWeekKey();
    const rows = database.prepare(
      `SELECT user_id, message_count FROM phoenix_den_activity WHERE week_key = ? ORDER BY message_count DESC LIMIT 10`
    ).all(weekKey);

    if (!rows || rows.length === 0) {
      return message.reply('📊 No message activity recorded for this week yet! Start chatting to top the charts!');
    }

    let desc = '👑 **Top Active Message Senders This Week:**\n\n';
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹';
      desc += `${medal} **#${i + 1}** <@${r.user_id}> — **${r.message_count.toLocaleString()} messages**\n`;
    }
    desc += `\n*The #1 member at the end of the week earns the **🥇 Top Message Sender** role & weekly rewards!* 🏆`;

    const embed = new EmbedBuilder()
      .setColor(0xF59E0B)
      .setTitle('⭐ MEMBER OF THE WEEK • ACTIVITY LEADERBOARD')
      .setDescription(desc)
      .setFooter({ text: 'Baby PHOENIX • Activity Tracker' })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  }

  // Command: !challenges / !challenge (Daily Challenges)
  if (lower === '!challenges' || lower === '!challenge') {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('⚡ PHOENIX DEN DAILY & WEEKLY CHALLENGES')
      .setDescription(
        `Complete these challenges to earn bonus **Phoenix Flames** and boost your rank!\n\n` +
        `• 💬 **Chat Champion:** Send 50 messages in <#1551649038510587944> — \`+300 🔥\`\n` +
        `• 🎙️ **Voice Warrior:** Hang out in <#1558814100593573898> for 30 mins — \`+500 🔥\`\n` +
        `• 📊 **Civic Duty:** Cast a vote in <#1546950818933252196> — \`+250 🔥\`\n` +
        `• ⚔️ **Tournament Warrior:** Enter a match in <#1559739777236996216> — \`+1,000 🔥\`\n` +
        `• 🎁 **Luck Seeker:** Click enter in <#1567953625693687938> — \`+150 🔥\`\n\n` +
        `*Use \`!daily\` every day to maintain your streak bonus!* 🔥`
      )
      .setFooter({ text: 'Baby PHOENIX • Challenge Hub' });

    return message.reply({ embeds: [embed] });
  }

  // Command: !elite or !og (OG Member & Elite explanation)
  if (lower === '!elite' || lower === '!og') {
    const embed = new EmbedBuilder()
      .setColor(0xF59E0B)
      .setTitle('🔒 𓆩🛡️𓆪 𝐄𝐋𝐈𝐓𝐄 亗 • THE OG FAMILY STATUS')
      .setDescription(
        `### As proclaimed by Founder & Leadership:\n\n` +
        `This role is **NOT for sale**.\n` +
        `This role is **NOT for asking**.\n` +
        `This role is **NOT for grinding in 1 week**.\n\n` +
        `👑 **ELITE is for the true OGs ONLY:**\n` +
        `• The ones who were here when we had 10 members.\n` +
        `• The ones who stayed when chat was quiet.\n` +
        `• The ones who never switched up.\n\n` +
        `*If you carry \`𓆩🛡️𓆪 𝐄𝐋𝐈𝐓𝐄 亗\`, you are family forever.* ⚔️🔥`
      )
      .setFooter({ text: 'Phoenix Den Official Doctrine • Sabo & Leadership' });

    return message.reply({ embeds: [embed] });
  }

  // Command: !color <hex> (Custom Role Color for Level 30+ / Flare or Booster)
  if (lower.startsWith('!color')) {
    const args = text.split(/\s+/).slice(1);
    const hex = args[0];

    if (!hex || !/^#?([a-fA-F0-9]{6})$/.test(hex)) {
      return message.reply('❌ **Usage:** `!color #FF0077` (Provide a valid 6-digit hex color code).');
    }

    const cleanHex = hex.startsWith('#') ? hex : `#${hex}`;

    // Check if user has LVL 30-FLARE or higher, or is a Server Booster
    const member = message.member;
    const hasPerk = member.roles.cache.some(r => 
      r.name.includes('LVL 30') || 
      r.name.includes('LVL 40') || 
      r.name.includes('LVL 50') || 
      r.name.includes('LVL 60') || 
      r.name.includes('LVL 70') || 
      r.name.includes('LVL 80') || 
      r.name.includes('LVL 90') || 
      r.name.includes('BOOSTER') || 
      r.name.includes('FOUNDER') ||
      r.name.includes('COMMANDER') ||
      r.name.includes('ELITE')
    );

    if (!hasPerk) {
      return message.reply('🔒 Custom role colors are unlocked at **Level 30 (FLARE)** or with **Server Booster / VIP** perks! Keep leveling up!');
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
          reason: `Custom Color Role for ${member.user.username}`
        });
        await member.roles.add(customRole);
      }

      return message.reply(`🎨 **Color Applied!** Your custom color has been set to **\`${cleanHex.toUpperCase()}\`**! ✨`);
    } catch (colorErr) {
      return message.reply(`⚠️ Could not create color role: ${colorErr.message}`);
    }
  }

  // Command: !gstart <time_minutes> <prize> (Quick Giveaway Starter)
  if (lower.startsWith('!gstart') || lower.startsWith('!giveaway')) {
    const isStaff = message.author.id === '1414143825538191373' ||
      message.guild.ownerId === message.author.id ||
      message.member.permissions.has(PermissionFlagsBits.ManageGuild) ||
      message.member.permissions.has(PermissionFlagsBits.Administrator) ||
      message.member.roles.cache.some(r => {
        const norm = r.name.normalize('NFKD').toLowerCase();
        return norm.includes('founder') || norm.includes('commander') || norm.includes('maker') || r.name.includes('𝐅𝐎𝐔𝐍𝐃𝐄𝐑');
      });

    if (!isStaff) {
      return message.reply('❌ Only Staff and Announcement Makers can start giveaways!');
    }

    const args = text.split(/\s+/).slice(1);
    const durationStr = args[0] || '';
    const prize = args.slice(1).join(' ') || 'Sacred Phoenix Reward';
    const durationMs = parseDurationToMs(durationStr);

    if (durationMs <= 0) {
      return message.reply('❌ **Usage:** `!gstart <duration> <prize name>`\nExamples:\n• `!gstart 1month Flame Role`\n• `!gstart 7d 10,000 Flames`\n• `!gstart 60m VIP Perks`');
    }

    const humanDuration = formatDurationHuman(durationMs);
    const endTime = Date.now() + durationMs;

    const targetChannel = message.guild.channels.cache.get(GIVEAWAYS_CHANNEL_ID) || 
      message.guild.channels.cache.find(c => c.name.includes('giveaway')) || 
      message.channel;

    const gEmbed = new EmbedBuilder()
      .setColor(0xFF0077)
      .setTitle('🎉 PHOENIX DEN OFFICIAL GIVEAWAY! 🎉')
      .setDescription(
        `**Prize:** 🎁 **${prize}**\n` +
        `**Hosted By:** <@${message.author.id}>\n` +
        `**Duration:** \`${humanDuration}\` (Ends: <t:${Math.floor(endTime / 1000)}:R>)\n\n` +
        `React with 🎉 below to enter!`
      )
      .setFooter({ text: 'Baby PHOENIX • Weekly Giveaways Engine' })
      .setTimestamp(endTime);

    const gMsg = await targetChannel.send({
      content: '🚨 <@&1567952922791256227> **A NEW GIVEAWAY HAS DROPPED!** 🚨',
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
      .setColor(0x10B981)
      .setTitle('🏆 PHOENIX DEN MONTHLY TOURNAMENTS')
      .setDescription(
        `Ready to prove your skills in the arena?\n\n` +
        `• ⚔️ **Tournament Arena:** <#1559739777236996216>\n` +
        `• 🥇 **Champion Rewards:** Exclusive **Champion** role, 10,000 🔥 Flames, and Hall of Fame immortality!\n` +
        `• 🔔 **Stay Notified:** Make sure you have the <@&1565869254035775498> role!\n\n` +
        `*Monthly brackets are announced every 1st and 15th of the month!* 🎮✨`
      )
      .setFooter({ text: 'Baby PHOENIX • Tournament Coordinator' });

    return message.reply({ embeds: [embed] });
  }

  // Command: !phoenixhelp (Menu of all Baby Phoenix features)
  if (lower === '!phoenixhelp' || lower === '!flamehelp') {
    const embed = new EmbedBuilder()
      .setColor(0xFF6B00)
      .setTitle('🔥 BABY PHOENIX • SERVER FEATURES MENU')
      .setDescription(
        `Welcome to the Phoenix Den feature suite powered by Baby PHOENIX!\n\n` +
        `🪙 **Economy & Daily:**\n` +
        `• \`!daily\` — Claim daily Phoenix Flames 🔥 + streak bonus\n` +
        `• \`!balance\` — Check your flame balance & rank\n` +
        `• \`!pay @user <amount>\` — Send flames to a friend\n` +
        `• \`!challenges\` — View daily & weekly flame quests\n\n` +
        `⭐ **Community & Rewards:**\n` +
        `• \`!weekly\` / \`!topmessages\` — View Member of the Week leaderboard\n` +
        `• \`!color #HEX\` — Set your custom role color (Level 30+ or Booster)\n` +
        `• \`!elite\` / \`!og\` — Read the sacred OG Elite doctrine\n` +
        `• \`!tournament\` — Info on monthly tournaments\n` +
        `• \`!gstart <mins> <prize>\` — Staff giveaway launcher`
      )
      .setFooter({ text: 'Baby PHOENIX #8301 • Exclusive to Phoenix Den' });

    return message.reply({ embeds: [embed] });
  }

  return false;
}
