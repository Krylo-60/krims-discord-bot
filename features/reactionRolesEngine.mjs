import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from '../databaseEngine.mjs';

// Table for tracking reaction role messages
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS reaction_role_panels (
      message_id TEXT PRIMARY KEY,
      guild_id TEXT,
      channel_id TEXT,
      panel_type TEXT
    );
  `);
} catch (err) {
  console.warn('[ReactionRoles DB Init Notice]:', err.message);
}

export const CLAN_REACTION_ROLE_MAP = {
  '⚔️': { id: '1557877145051856989', name: 'War & Raid Alerts' },
  '📢': { id: '1557877146775720087', name: 'Clan Announcement Pings' },
  '🎮': { id: '1557877148029558975', name: 'Squad Game Nights' },
  '🌎': { id: '1557877149975707648', name: 'NA Region' },
  '🌍': { id: '1557877151309500558', name: 'EU Region' },
  '🌏': { id: '1557877152454545499', name: 'Asia/OCE Region' }
};

/**
 * Deploys or refreshes the official Clan Reaction Roles panel in a target channel
 */
export async function deployClanReactionRolePanel(channel) {
  if (!channel) return null;

  const embed = new EmbedBuilder()
    .setColor(0x00FF88)
    .setTitle('🏷️ THE HALF LIFES — REACTION ROLES')
    .setDescription(
      `Welcome to **The Half Lifes** role selector! React below to customize your squad notifications and timezone so you never miss a war or raid! ⚔️\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🔔 Pings & Squad Notifications\n` +
      `⚔️ • <@&1557877145051856989> — *Pinged for active server raids, PvP battles & wars*\n` +
      `📢 • <@&1557877146775720087> — *Official clan announcements & major server news*\n` +
      `🎮 • <@&1557877148029558975> — *Game nights, practice battles & minigames*\n\n` +
      `### 🌐 Timezone & Region\n` +
      `🌎 • <@&1557877149975707648> — *North America (EST/CST/PST)*\n` +
      `🌍 • <@&1557877151309500558> — *Europe (GMT/CET/EET)*\n` +
      `🌏 • <@&1557877152454545499> — *Asia & Oceania (IST/SGT/AEST)*\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👉 **Click any emoji below to receive the role!** Click it again anytime to remove it.`
    )
    .setThumbnail('https://krims-discord-bot-d57m.onrender.com/gifs/the_half_lifes.gif')
    .setFooter({ text: 'The Half Lifes • Automated Role Dispatcher' })
    .setTimestamp();

  const msg = await channel.send({ embeds: [embed] });

  // Store message ID in DB
  try {
    db.prepare(`
      INSERT OR REPLACE INTO reaction_role_panels (message_id, guild_id, channel_id, panel_type)
      VALUES (?, ?, ?, 'clan_roles')
    `).run(msg.id, channel.guild.id, channel.id);
  } catch (_) {}

  // React with emojis sequentially
  const emojis = ['⚔️', '📢', '🎮', '🌎', '🌍', '🌏'];
  for (const emoji of emojis) {
    await msg.react(emoji).catch(() => {});
  }

  return msg;
}

/**
 * Handles emoji reaction additions for roles
 */
export async function handleReactionRoleAdd(reaction, user) {
  if (user.bot || !reaction.message.guild) return false;

  const emojiName = reaction.emoji.name;
  const roleConfig = CLAN_REACTION_ROLE_MAP[emojiName];
  if (!roleConfig) return false;

  const msgId = reaction.message.id;
  let isPanel = false;
  try {
    const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
    if (row) isPanel = true;
  } catch (_) {}

  // Also verify by channel name or embed title if DB is cold
  if (!isPanel) {
    const embedTitle = reaction.message.embeds?.[0]?.title || '';
    if (embedTitle.includes('REACTION ROLES')) isPanel = true;
  }

  if (!isPanel) return false;

  try {
    const member = await reaction.message.guild.members.fetch(user.id);
    if (member && !member.roles.cache.has(roleConfig.id)) {
      await member.roles.add(roleConfig.id);
      console.log(`[ReactionRoles] Added ${roleConfig.name} to ${member.displayName}`);
      await user.send(`✅ You received the **${roleConfig.name}** role in **${reaction.message.guild.name}**!`).catch(() => {});
      return true;
    }
  } catch (err) {
    console.warn('[ReactionRoles Add Error]:', err.message);
  }
  return false;
}

/**
 * Handles emoji reaction removals for roles
 */
export async function handleReactionRoleRemove(reaction, user) {
  if (user.bot || !reaction.message.guild) return false;

  const emojiName = reaction.emoji.name;
  const roleConfig = CLAN_REACTION_ROLE_MAP[emojiName];
  if (!roleConfig) return false;

  const msgId = reaction.message.id;
  let isPanel = false;
  try {
    const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
    if (row) isPanel = true;
  } catch (_) {}

  if (!isPanel) {
    const embedTitle = reaction.message.embeds?.[0]?.title || '';
    if (embedTitle.includes('REACTION ROLES')) isPanel = true;
  }

  if (!isPanel) return false;

  try {
    const member = await reaction.message.guild.members.fetch(user.id);
    if (member && member.roles.cache.has(roleConfig.id)) {
      await member.roles.remove(roleConfig.id);
      console.log(`[ReactionRoles] Removed ${roleConfig.name} from ${member.displayName}`);
      await user.send(`❌ Removed the **${roleConfig.name}** role in **${reaction.message.guild.name}**.`).catch(() => {});
      return true;
    }
  } catch (err) {
    console.warn('[ReactionRoles Remove Error]:', err.message);
  }
  return false;
}
