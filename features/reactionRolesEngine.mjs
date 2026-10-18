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

export const SUPPORT_REACTION_ROLE_MAP = {
  '📢': { id: '1561181297899081758', name: 'Bot Updates & Drops' },
  '🚀': { id: '1561181299010568194', name: 'Beta Announcements' },
  '🌐': { id: '1561181300109484052', name: 'Uptime & Maintenance Alerts' },
  '🎮': { id: '1561181301292277791', name: 'SMP / Minecraft Owner' },
  '🤖': { id: '1561181303078916166', name: 'Community Admin' },
  '💻': { id: '1561181304115044424', name: 'Bot Developer' }
};

export const SUPPORT_COLOR_ROLES_MAP = {
  '⚡': { id: '1561181305264410716', name: '⚡ Electric Cyan' },
  '🟣': { id: '1561181305931178210', name: '🟣 Mystic Purple' },
  '🟡': { id: '1561181307243991073', name: '🟡 Neon Gold' },
  '🔴': { id: '1561181308292563097', name: '🔴 Crimson Red' },
  '🟢': { id: '1561181309890732163', name: '🟢 Emerald Green' },
  '🌸': { id: '1561181311044026458', name: '🌸 Hot Pink' },
  '🤍': { id: '1561181312176365701', name: '🤍 Ghost White' }
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
  const guildId = reaction.message.guild.id;

  const isSupportGuild = guildId === '1561174283294609479';
  const activeColorMap = isSupportGuild ? SUPPORT_COLOR_ROLES_MAP : COLOR_ROLES_MAP;
  const activeRoleMap = isSupportGuild ? SUPPORT_REACTION_ROLE_MAP : CLAN_REACTION_ROLE_MAP;

  // 1. Color Role Check
  const colorConfig = activeColorMap[emojiName];
  if (colorConfig) {
    let isColorPanel = false;
    try {
      const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
      if (row && row.panel_type === 'color_roles') isColorPanel = true;
    } catch (_) {}
    if (!isColorPanel && (embedTitle.includes('COLOR') || embedTitle.includes('COLOR ROLES') || embedTitle.includes('ACCENT COLOR'))) {
      isColorPanel = true;
    }

    if (isColorPanel) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (member) {
          // Remove any previously equipped color roles so member has exactly one
          const allColorIds = Object.values(activeColorMap).map(c => c.id);
          const toRemove = member.roles.cache.filter(r => allColorIds.includes(r.id) && r.id !== colorConfig.id);
          for (const [rId] of toRemove) {
            await member.roles.remove(rId).catch(() => {});
          }
          await member.roles.add(colorConfig.id);
          console.log(`[ColorRoles] Equipped ${colorConfig.name} on ${member.displayName} in ${reaction.message.guild.name}`);
          await user.send(`🎨 You equipped **${colorConfig.name}** in **${reaction.message.guild.name}**!`).catch(() => {});
          return true;
        }
      } catch (err) {
        console.warn('[ColorRoles Add Error]:', err.message);
      }
    }
  }

  // 2. Notification & Community / Region Role Check
  const roleConfig = activeRoleMap[emojiName];
  if (roleConfig) {
    let isRolePanel = false;
    try {
      const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
      if (row && (row.panel_type === 'clan_roles' || row.panel_type === 'support_roles')) isRolePanel = true;
    } catch (_) {}
    if (!isRolePanel && (embedTitle.includes('NOTIFICATION') || embedTitle.includes('REACTION ROLES') || embedTitle.includes('COMMUNITY ROLES'))) {
      isRolePanel = true;
    }

    if (isRolePanel) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (member) {
          // Region Roles in Clan server: enforce maximum 1 region per member
          if (!isSupportGuild) {
            const regionRoleIds = ['1557877149975707648', '1557877151309500558', '1557877152454545499'];
            if (regionRoleIds.includes(roleConfig.id)) {
              for (const rId of regionRoleIds) {
                if (rId !== roleConfig.id && member.roles.cache.has(rId)) {
                  await member.roles.remove(rId).catch(() => {});
                }
              }
            }
          }

          if (!member.roles.cache.has(roleConfig.id)) {
            await member.roles.add(roleConfig.id);
            console.log(`[ReactionRoles] Added ${roleConfig.name} to ${member.displayName} in ${reaction.message.guild.name}`);
            await user.send(`✅ You received the **${roleConfig.name}** role in **${reaction.message.guild.name}**!`).catch(() => {});
            return true;
          }
        }
      } catch (err) {
        console.warn('[ReactionRoles Add Error]:', err.message);
      }
    }
  }

  return false;
}

export async function handleReactionRoleRemove(reaction, user) {
  if (user.bot || !reaction.message.guild) return false;

  const emojiName = reaction.emoji.name;
  const msgId = reaction.message.id;
  const embedTitle = reaction.message.embeds?.[0]?.title || '';
  const guildId = reaction.message.guild.id;

  const isSupportGuild = guildId === '1561174283294609479';
  const activeColorMap = isSupportGuild ? SUPPORT_COLOR_ROLES_MAP : COLOR_ROLES_MAP;
  const activeRoleMap = isSupportGuild ? SUPPORT_REACTION_ROLE_MAP : CLAN_REACTION_ROLE_MAP;

  // 1. Color Role Removal
  const colorConfig = activeColorMap[emojiName];
  if (colorConfig) {
    let isColorPanel = false;
    try {
      const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
      if (row && row.panel_type === 'color_roles') isColorPanel = true;
    } catch (_) {}
    if (!isColorPanel && (embedTitle.includes('COLOR') || embedTitle.includes('COLOR ROLES') || embedTitle.includes('ACCENT COLOR'))) {
      isColorPanel = true;
    }

    if (isColorPanel) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (member && member.roles.cache.has(colorConfig.id)) {
          await member.roles.remove(colorConfig.id);
          console.log(`[ColorRoles] Removed ${colorConfig.name} from ${member.displayName} in ${reaction.message.guild.name}`);
          await user.send(`⚪ Removed **${colorConfig.name}** in **${reaction.message.guild.name}**.`).catch(() => {});
          return true;
        }
      } catch (err) {
        console.warn('[ColorRoles Remove Error]:', err.message);
      }
    }
  }

  // 2. Notification & Community / Region Role Removal
  const roleConfig = activeRoleMap[emojiName];
  if (roleConfig) {
    let isRolePanel = false;
    try {
      const row = db.prepare('SELECT * FROM reaction_role_panels WHERE message_id = ?').get(msgId);
      if (row && (row.panel_type === 'clan_roles' || row.panel_type === 'support_roles')) isRolePanel = true;
    } catch (_) {}
    if (!isRolePanel && (embedTitle.includes('NOTIFICATION') || embedTitle.includes('REACTION ROLES') || embedTitle.includes('COMMUNITY ROLES'))) {
      isRolePanel = true;
    }

    if (isRolePanel) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id);
        if (member && member.roles.cache.has(roleConfig.id)) {
          await member.roles.remove(roleConfig.id);
          console.log(`[ReactionRoles] Removed ${roleConfig.name} from ${member.displayName} in ${reaction.message.guild.name}`);
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
