/**
 * 🛡️ The Half Life's Elite Welcome Card Engine
 * Generates dynamic, dual-phase welcome cards:
 *   - Phase 1: On member join -> Displays Discord handle, member #, and "⏳ PENDING MINECRAFT IGN"
 *   - Phase 2: On IGN drop in #📋・𝖱oster -> Live-edits the original welcome message with 3D skin head & "✅ VERIFIED SMP ROSTER"
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { AttachmentBuilder, EmbedBuilder } from 'discord.js';
import db from '../databaseEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

// Initialize Welcome Cards DB Table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS member_welcome_cards (
      user_id TEXT,
      guild_id TEXT,
      message_id TEXT,
      channel_id TEXT,
      member_count INTEGER,
      minecraft_ign TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME,
      PRIMARY KEY (user_id, guild_id)
    );
  `);
} catch (e) {
  console.warn('[WelcomeCardEngine] DB init notice:', e.message);
}

export const HALF_LIFES_GUILD_ID = '1557852594242719775';
export const HALF_LIFES_WELCOME_CHANNEL_ID = '1557863777070743693'; // 👋・𝖶elcome
export const HALF_LIFES_ROSTER_CHANNEL_ID = '1557858900806738050';  // 📋・𝖱oster
export const HALF_LIFES_CREED_CHANNEL_ID = '1557855862146465922';   // 📜・𝖱ules
export const HALF_LIFES_ROLES_CHANNEL_ID = '1559251032465219587';   // 🏷️・𝖱oles
export const HALF_LIFES_TEAM_CHAT_CHANNEL_ID = '1557855867897127054'; // 💬・𝖳eam-𝖢hat

/**
 * Render the high-resolution welcome card via the Python Pillow generator
 */
export async function renderWelcomeCard({
  avatarUrl,
  mcHeadUrl = '',
  username,
  memberCount = 1,
  serverName = "THE LIGHT BEARERS",
  phase = 1
}) {
  const scriptPath = path.join(rootDir, 'scripts', 'generate_welcome_card.py');
  const tempOut = path.join(rootDir, 'data', `welcome_card_${Date.now()}_${Math.floor(Math.random() * 10000)}.png`);
  
  if (!fs.existsSync(path.dirname(tempOut))) {
    fs.mkdirSync(path.dirname(tempOut), { recursive: true });
  }

  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const args = [
    scriptPath,
    '--avatar', avatarUrl,
    '--username', username,
    '--member_count', String(memberCount),
    '--server_name', serverName,
    '--phase', String(phase),
    '--out', tempOut
  ];

  if (mcHeadUrl) {
    args.push('--mc_head', mcHeadUrl);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn(pythonCmd, args);
    let stderr = '';

    proc.stderr.on('data', data => {
      stderr += data.toString();
    });

    proc.on('close', code => {
      if (code !== 0 || !fs.existsSync(tempOut)) {
        console.error(`[WelcomeCardEngine] Python card generator failed (code ${code}):`, stderr);
        return resolve(null);
      }

      try {
        const buffer = fs.readFileSync(tempOut);
        fs.unlink(tempOut, () => {});
        resolve(buffer);
      } catch (err) {
        console.error('[WelcomeCardEngine] Failed to read card buffer:', err);
        resolve(null);
      }
    });

    proc.on('error', err => {
      console.error('[WelcomeCardEngine] Could not spawn Python:', err);
      resolve(null);
    });
  });
}

/**
 * Handle new operative join: Post Phase 1 Welcome Card
 */
export async function handleGuildMemberAddWelcome(member) {
  if (member.guild.id !== HALF_LIFES_GUILD_ID) return;

  try {
    const welcomeCh = member.guild.channels.cache.get(HALF_LIFES_WELCOME_CHANNEL_ID) ||
                      member.guild.channels.cache.find(c => c.name.includes('welcome'));
    if (!welcomeCh) return;

    const memberCount = member.guild.memberCount;
    const avatarUrl = member.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });

    console.log(`[WelcomeCardEngine] Rendering Phase 1 Welcome Card for @${member.user.username}...`);
    const cardBuffer = await renderWelcomeCard({
      avatarUrl,
      username: member.user.username,
      memberCount,
      serverName: "THE LIGHT BEARERS",
      phase: 1
    });

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('✨ NEW GUARDIAN DEPLOYED — THE LIGHT BEARERS')
      .setDescription(
        `Welcome <@${member.id}> to **The Light Bearers**! 🛡️✨\n\n` +
        `• 📜 **Read Guild Creed & Rules:** <#${HALF_LIFES_CREED_CHANNEL_ID}>\n` +
        `• 📋 **Drop your Minecraft IGN in** <#${HALF_LIFES_ROSTER_CHANNEL_ID}> to verify your roster card & unlock your 3D skin badge!\n` +
        `• 🎨 **Pick your chat color & specialty in** <#${HALF_LIFES_ROLES_CHANNEL_ID}>\n` +
        `• 💬 **Introduce yourself in** <#${HALF_LIFES_TEAM_CHAT_CHANNEL_ID}>`
      )
      .setFooter({ text: `✨ CO-LEADER: KryloMCYT • 👑 LEADER: Jonesy / st1LLkill3r • Guardian #${memberCount}` })
      .setTimestamp();

    let sentMsg;
    if (cardBuffer) {
      const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome_card.png' });
      embed.setImage('attachment://welcome_card.png');
      sentMsg = await welcomeCh.send({
        content: `✨ Welcome to the light, <@${member.id}>! Stand together as The Light Bearers.`,
        embeds: [embed],
        files: [attachment]
      });
    } else {
      sentMsg = await welcomeCh.send({
        content: `✨ Welcome to the light, <@${member.id}>! Stand together as The Light Bearers.`,
        embeds: [embed]
      });
    }

    if (sentMsg) {
      db.prepare(`
        INSERT INTO member_welcome_cards (user_id, guild_id, message_id, channel_id, member_count)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, guild_id) DO UPDATE SET
          message_id = excluded.message_id,
          channel_id = excluded.channel_id,
          member_count = excluded.member_count,
          updated_at = CURRENT_TIMESTAMP
      `).run(member.id, member.guild.id, sentMsg.id, welcomeCh.id, memberCount);
      console.log(`[WelcomeCardEngine] ✅ Phase 1 Card posted and recorded (Message ID: ${sentMsg.id})`);
    }
  } catch (err) {
    console.error('[WelcomeCardEngine] Error in handleGuildMemberAddWelcome:', err);
  }
}

/**
 * Handle Minecraft IGN verification: Edit original Welcome Card to Phase 2
 */
export async function handleRosterIgnWelcomeUpdate(guild, userId, ign) {
  if (guild.id !== HALF_LIFES_GUILD_ID) return;

  try {
    const record = db.prepare(`
      SELECT * FROM member_welcome_cards
      WHERE user_id = ? AND guild_id = ?
    `).get(userId, guild.id);

    const welcomeCh = await guild.channels.fetch(HALF_LIFES_WELCOME_CHANNEL_ID).catch(() => null) ||
                      guild.channels.cache.find(c => c.name.includes('welcome'));
    if (!welcomeCh) {
      console.warn('[WelcomeCardEngine] Welcome channel not found');
      return;
    }

    const member = await guild.members.fetch(userId).catch(() => null);
    const memberCount = record ? record.member_count : guild.memberCount;
    const avatarUrl = member ? member.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true }) : 'https://cdn.discordapp.com/embed/avatars/0.png';
    const mcHeadUrl = `https://mc-heads.net/avatar/${ign}/128.png`;

    console.log(`[WelcomeCardEngine] Rendering Phase 2 Verified Card for ${ign}...`);
    const cardBuffer = await renderWelcomeCard({
      avatarUrl,
      mcHeadUrl,
      username: `${ign}`,
      memberCount,
      serverName: "THE LIGHT BEARERS",
      phase: 2
    });

    if (!cardBuffer) {
      console.warn('[WelcomeCardEngine] Failed to render Phase 2 buffer');
      return;
    }

    const attachment = new AttachmentBuilder(cardBuffer, { name: 'welcome_card_verified.png' });
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('✅ GUARDIAN VERIFIED & ROSTER DEPLOYED')
      .setDescription(
        `<@${userId}> has officially linked Minecraft IGN **\`${ign}\`**! ✨🛡️\n\n` +
        `• 🏷️ **Verified In-Game Name:** \`${ign}\`\n` +
        `• 🌐 **SMP Status:** Active Light Bearer Guardian\n` +
        `• 💬 **Guild Chat:** <#${HALF_LIFES_TEAM_CHAT_CHANNEL_ID}>\n` +
        `• ✨ **All sanctuary communications & project channels unlocked!**`
      )
      .setImage('attachment://welcome_card_verified.png')
      .setFooter({ text: `✨ CO-LEADER: KryloMCYT • 👑 LEADER: Jonesy / st1LLkill3r • Guardian #${memberCount} [VERIFIED]` })
      .setTimestamp();

    if (record && record.message_id) {
      try {
        const targetMsg = await welcomeCh.messages.fetch(record.message_id).catch(() => null);
        if (targetMsg) {
          await targetMsg.edit({
            content: `✨ **Guardian Roster Updated:** <@${userId}> is officially verified as **\`${ign}\`**!`,
            embeds: [embed],
            files: [attachment]
          });
          console.log(`[WelcomeCardEngine] ✅ Live-edited original welcome message ${record.message_id} to Phase 2 for ${ign}!`);
          
          db.prepare(`
            UPDATE member_welcome_cards
            SET minecraft_ign = ?, updated_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND guild_id = ?
          `).run(ign, userId, guild.id);
          return;
        }
      } catch (editErr) {
        console.warn('[WelcomeCardEngine] Could not edit original message, sending verification card instead:', editErr.message);
      }
    }

    // If no prior message was recorded, send verification confirmation in welcome channel
    const sent = await welcomeCh.send({
      content: `🛡️ **Operative Verified:** <@${userId}> has officially linked Minecraft IGN **\`${ign}\`**!`,
      embeds: [embed],
      files: [attachment]
    });

    db.prepare(`
      INSERT INTO member_welcome_cards (user_id, guild_id, message_id, channel_id, member_count, minecraft_ign)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, guild_id) DO UPDATE SET
        message_id = excluded.message_id,
        channel_id = excluded.channel_id,
        minecraft_ign = excluded.minecraft_ign,
        updated_at = CURRENT_TIMESTAMP
    `).run(userId, guild.id, sent.id, welcomeCh.id, memberCount, ign);

  } catch (err) {
    console.error('[WelcomeCardEngine] Error in handleRosterIgnWelcomeUpdate:', err);
  }
}
