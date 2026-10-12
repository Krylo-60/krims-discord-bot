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

export const COLOR_ROLES_MAP = {
  '🔴': { id: '1559251872080994395', name: '🔴 Crimson Red' },
  '🟠': { id: '1559251873515700226', name: '🟠 Solar Orange' },
  '🟡': { id: '1559251875054755960', name: '🟡 Neon Gold' },
  '🟢': { id: '1559251876283945042', name: '🟢 Emerald Green' },
  '⚡': { id: '1559251877466472479', name: '⚡ Electric Cyan' },
  '🔵': { id: '1559251878469177517', name: '🔵 Ocean Blue' },
  '🟣': { id: '1559251880096432209', name: '🟣 Mystic Purple' },
  '🌸': { id: '1559251881023381714', name: '🌸 Hot Pink' },
  '🤍': { id: '1559251881577152635', name: '🤍 Ghost White' }
};

/**
 * Deploys the notification and timezone reaction roles panel
 */
export async function deployClanReactionRolePanel(channel) {
  if (!channel) return null;

  const embed = new EmbedBuilder()
    .setColor(0x00FF88)
    .setTitle('🏷️ THE HALF LIFES — NOTIFICATION & REGION ROLES')
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

  try {
    db.prepare(`
      INSERT OR REPLACE INTO reaction_role_panels (message_id, guild_id, channel_id, panel_type)
      VALUES (?, ?, ?, 'clan_roles')
    `).run(msg.id, channel.guild.id, channel.id);
  } catch (_) {}

  const emojis = ['⚔️', '📢', '🎮', '🌎', '🌍', '🌏'];
  for (const emoji of emojis) {
    await msg.react(emoji).catch(() => {});
  }

  return msg;
}

/**
 * Deploys the cosmetic Chat Color Roles panel
 */
export async function deployClanColorRolesPanel(channel) {
  if (!channel) return null;

  const embed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle('🎨 THE HALF LIFES — CHAT COLOR ROLES')
    .setDescription(
      `Equip a vibrant custom color for your username in chat and the member list! 🌟\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔴 • <@&1559251872080994395> — **Crimson Red**\n` +
      `🟠 • <@&1559251873515700226> — **Solar Orange**\n` +
      `🟡 • <@&1559251875054755960> — **Neon Gold**\n` +
      `🟢 • <@&1559251876283945042> — **Emerald Green**\n` +
      `⚡ • <@&1559251877466472479> — **Electric Cyan**\n` +
      `🔵 • <@&1559251878469177517> — **Ocean Blue**\n` +
      `🟣 • <@&1559251880096432209> — **Mystic Purple**\n` +
      `🌸 • <@&1559251881023381714> — **Hot Pink**\n` +
      `🤍 • <@&1559251881577152635> — **Ghost White**\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
      `👉 **Click any color emoji below to equip your color!**\n` +
      `*(Selecting a new color automatically swaps your color so you only have 1 active color. Unclick your reaction to reset to default.)*`
    )
    .setThumbnail('https://krims-discord-bot-d57m.onrender.com/gifs/the_half_lifes.gif')
    .setFooter({ text: 'The Half Lifes • Cosmetic Color Picker' })
    .setTimestamp();

  const msg = await channel.send({ embeds: [embed] });

  try {
    db.prepare(`
      INSERT OR REPLACE INTO reaction_role_panels (message_id, guild_id, channel_id, panel_type)
      VALUES (?, ?, ?, 'color_roles')
    `).run(msg.id, channel.guild.id, channel.id);
  } catch (_) {}

  const emojis = ['🔴', '🟠', '🟡', '🟢', '⚡', '🔵', '🟣', '🌸', '🤍'];
  for (const emoji of emojis) {
    await msg.react(emoji).catch(() => {});
  }

  return msg;
}

/**
 * Handles emoji reaction additions for notification, timezone, and color roles
 */
export async function handleReactionRoleAdd(reaction, user) {
  if (user.bot || !reaction.message.guild) return false;

  const emojiName = reaction.emoji.name;
  const msgId = reaction.message.id;
  const embedTitle = reaction.message.embeds?.[0]?.title || '';

  // 1. Color Role Check
  const colorConfig = COLOR_ROLES_MAP[emojiName];
  if (colorConfig) {
    let isColorPanel = false;
    try {
      const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
      if (row && row.panel_type === 'color_roles') isColorPanel = true;
    } catch (_) {}
    if (!isColorPanel && (embedTitle.includes('COLOR') || embedTitle.includes('COLOR ROLES'))) {
      isColorPanel = true;
    }

    if (isColorPanel) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (member) {
          // Remove any previously equipped color roles so member has exactly one
          const allColorIds = Object.values(COLOR_ROLES_MAP).map(c => c.id);
          const toRemove = member.roles.cache.filter(r => allColorIds.includes(r.id) && r.id !== colorConfig.id);
          for (const [rId] of toRemove) {
            await member.roles.remove(rId).catch(() => {});
          }
          await member.roles.add(colorConfig.id);
          console.log(`[ColorRoles] Equipped ${colorConfig.name} on ${member.displayName}`);
          await user.send(`🎨 You equipped **${colorConfig.name}** in **${reaction.message.guild.name}**!`).catch(() => {});
          return true;
        }
      } catch (err) {
        console.warn('[ColorRoles Add Error]:', err.message);
      }
    }
  }

  // 2. Notification & Region Role Check
  const roleConfig = CLAN_REACTION_ROLE_MAP[emojiName];
  if (roleConfig) {
    let isClanPanel = false;
    try {
      const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
      if (row && row.panel_type === 'clan_roles') isClanPanel = true;
    } catch (_) {}
    if (!isClanPanel && (embedTitle.includes('NOTIFICATION') || embedTitle.includes('REACTION ROLES'))) {
      isClanPanel = true;
    }

    if (isClanPanel) {
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
    }
  }

  return false;
}

/**
 * Handles emoji reaction removals for roles
 */
export async function handleReactionRoleRemove(reaction, user) {
  if (user.bot || !reaction.message.guild) return false;

  const emojiName = reaction.emoji.name;
  const msgId = reaction.message.id;
  const embedTitle = reaction.message.embeds?.[0]?.title || '';

  // 1. Color Role Removal
  const colorConfig = COLOR_ROLES_MAP[emojiName];
  if (colorConfig) {
    let isColorPanel = false;
    try {
      const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
      if (row && row.panel_type === 'color_roles') isColorPanel = true;
    } catch (_) {}
    if (!isColorPanel && (embedTitle.includes('COLOR') || embedTitle.includes('COLOR ROLES'))) {
      isColorPanel = true;
    }

    if (isColorPanel) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (member && member.roles.cache.has(colorConfig.id)) {
          await member.roles.remove(colorConfig.id);
          console.log(`[ColorRoles] Removed ${colorConfig.name} from ${member.displayName}`);
          await user.send(`⚪ Removed **${colorConfig.name}** in **${reaction.message.guild.name}**.`).catch(() => {});
          return true;
        }
      } catch (err) {
        console.warn('[ColorRoles Remove Error]:', err.message);
      }
    }
  }

  // 2. Notification & Region Role Removal
  const roleConfig = CLAN_REACTION_ROLE_MAP[emojiName];
  if (roleConfig) {
    let isClanPanel = false;
    try {
      const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
      if (row && row.panel_type === 'clan_roles') isClanPanel = true;
    } catch (_) {}
    if (!isClanPanel && (embedTitle.includes('NOTIFICATION') || embedTitle.includes('REACTION ROLES'))) {
      isClanPanel = true;
    }

    if (isClanPanel) {
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
    }
  }

  return false;
}
