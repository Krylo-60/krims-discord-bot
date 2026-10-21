import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPDATES_FILE = path.resolve(__dirname, '../data/persistent_updates.json');

export const DEFAULT_UPDATES_CHANNEL_ID = '1561175627799994402'; // #🚀・𝖡ot-𝖴pdates

/**
 * Initial Seed Updates
 */
const INITIAL_UPDATES = [
  {
    id: 'upd_v5_3_0',
    version: 'v5.3.0',
    title: 'Krims Code v5 — Powered by Krims AI v3.1 Neural Engine',
    date: '2026-10-21',
    timestamp: Date.now(),
    category: 'Major Platform Release',
    summary: 'Official release of Krims Code v5 running the next-generation Krims AI v3.1 Neural Core, Single-Key Modular Feature Expander, 100-command enterprise Wiki, and full white-label security isolation.',
    highlights: [
      '🧠 Krims AI v3.1 Neural Engine: Distributed low-latency neural processing with persistent guild memory and multimodal vision',
      '🔑 Single-Key Modular Expander: Automatically activates high-tier features (Voice TTS, Quantum Math, Live Weather) with just 1 API key in config',
      '📖 Enterprise Wiki Live: Interactive 100-command documentation with live search at https://krims-bot-dashboard.vercel.app/wiki',
      '🗳️ Universal Top.gg 2.0x Vote Booster: Live vote tracking with 12h/24h double XP multipliers across all 7 servers',
      '🛡️ Autonomous White-Label Shield: Complete proprietary security perimeter with zero external leak vectors',
      '⚡ Instant Guild Command Deduplication: Global 100-command fleet synchronized across Discord with 0 duplicate registrations'
    ],
    author: 'Krims Engineering Team',
    pinned: true
  },
  {
    id: 'upd_v5_2_0',
    version: 'v5.2.0',
    title: 'Universal Fleet & Enterprise Wiki Release',
    date: '2026-10-20',
    timestamp: Date.now() - 86400000,
    category: 'Major Release',
    summary: 'Launch of the Official Krims Wiki with 100-command directory, slash command deduplication, and universal 2.0x Top.gg vote booster.',
    highlights: [
      '📖 Official Krims Wiki live at https://krims-bot-dashboard.vercel.app/wiki',
      '🧹 Slash Command Deduplication: Cleared redundant guild commands across all 7 servers',
      '🗳️ Universal Top.gg Vote Booster Hub: Active in #🗳️・𝖵ote-𝖫ogs with 2.0x XP multiplier',
      '🏷️ Unicode Title Case Channel Formatting: Standardized 42 community channels',
      '🛡️ Autonomous Raid Shield & Anti-Nuke architecture documentation released'
    ],
    author: 'Krims Engineering Team',
    pinned: false
  },
  {
    id: 'upd_v5_1_0',
    version: 'v5.1.0',
    title: 'Top.gg Vote Booster & Auto-Mod Hardening',
    date: '2026-10-18',
    timestamp: Date.now() - 86400000 * 3,
    category: 'Security & Rewards',
    summary: 'Integrated automated vote webhook ingestion and 2.0x XP multiplier engine.',
    highlights: [
      '⚡ Automated 2.0x text and voice XP multiplier for 12 hours (24h on weekends)',
      '🏆 Real-time voter shoutout logs and consecutive streak multiplier',
      '🔒 Advanced flood protection and mass-join mitigation',
      '🎫 Isolated 1-on-1 private player ticketing with /ticket and /close'
    ],
    author: 'Krims Engineering Team',
    pinned: false
  }
];

let updatesStore = {
  lastUpdated: Date.now(),
  pinnedMessageId: null,
  updates: [...INITIAL_UPDATES]
};

function loadUpdates() {
  try {
    if (fs.existsSync(UPDATES_FILE)) {
      const data = JSON.parse(fs.readFileSync(UPDATES_FILE, 'utf8'));
      if (Array.isArray(data.updates)) {
        updatesStore = data;
      }
    } else {
      saveUpdates();
    }
  } catch (err) {
    console.warn('[PersistentUpdates] Could not load updates file, initializing defaults:', err.message);
    saveUpdates();
  }
}

function saveUpdates() {
  try {
    const dir = path.dirname(UPDATES_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(UPDATES_FILE, JSON.stringify(updatesStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[PersistentUpdates] Failed to save updates store:', err.message);
  }
}

loadUpdates();

/**
 * Returns all persistent updates
 */
export function getAllUpdates(limit = 10) {
  return updatesStore.updates.slice(0, limit);
}

/**
 * Returns the latest update
 */
export function getLatestUpdate() {
  return updatesStore.updates[0] || null;
}

/**
 * Adds a new persistent update
 */
export function addPersistentUpdate(updateData) {
  const newUpdate = {
    id: 'upd_' + Date.now().toString(36),
    version: updateData.version || 'v2.4.1',
    title: updateData.title || 'Platform Improvement',
    date: new Date().toISOString().split('T')[0],
    timestamp: Date.now(),
    category: updateData.category || 'Maintenance',
    summary: updateData.summary || 'General performance enhancements and system optimizations.',
    highlights: updateData.highlights || [],
    author: updateData.author || 'Krims Engineering Team',
    pinned: Boolean(updateData.pinned)
  };

  updatesStore.updates.unshift(newUpdate);
  updatesStore.lastUpdated = Date.now();
  saveUpdates();
  return newUpdate;
}

/**
 * Generates an Embed for an update
 */
export function buildUpdateEmbed(update) {
  const u = update || getLatestUpdate();
  if (!u) return null;

  const embed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setAuthor({ 
      name: `Krims Code v5 • Powered by Krims AI v3.1 (${u.version})`, 
      iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256' 
    })
    .setTitle(`🚀 ${u.title}`)
    .setDescription(
      `**Category:** \`${u.category}\` • **Date:** \`${u.date}\`\n\n` +
      `${u.summary}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🌟 Key Improvements:\n` +
      u.highlights.map(h => `• ${h}`).join('\n') + '\n' +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .setFooter({ 
      text: `Published by ${u.author} • Zero Downtime Continuous Deployment`, 
      iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256' 
    })
    .setTimestamp(u.timestamp);

  return embed;
}

/**
 * Builds the interactive buttons row for updates
 */
export function buildUpdateActionRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('📖 Open Krims Wiki')
      .setStyle(ButtonStyle.Link)
      .setURL('https://krims-bot-dashboard.vercel.app/wiki'),
    new ButtonBuilder()
      .setLabel('🗳️ Vote on Top.gg (2x XP)')
      .setStyle(ButtonStyle.Link)
      .setURL('https://top.gg/bot/1523794466740371586/vote'),
    new ButtonBuilder()
      .setLabel('🎛️ Dashboard')
      .setStyle(ButtonStyle.Link)
      .setURL('https://krims-bot-dashboard.vercel.app/')
  );
}

/**
 * Handles /updates or !updates command
 */
export async function handleUpdatesCommand(context) {
  const latest = getLatestUpdate();
  const embed = buildUpdateEmbed(latest);
  const row = buildUpdateActionRow();

  if (context.isCommand && context.isCommand()) {
    return context.reply({ embeds: [embed], components: [row] });
  } else if (context.reply) {
    return context.reply({ embeds: [embed], components: [row] });
  } else if (context.channel) {
    return context.channel.send({ embeds: [embed], components: [row] });
  }
}
export async function syncPersistentUpdateToDiscord(client, channelId = DEFAULT_UPDATES_CHANNEL_ID) {
  if (!client) return null;

  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return null;

    const latest = getLatestUpdate();
    const embed = buildUpdateEmbed(latest);
    const row = buildUpdateActionRow();

    // 1. First check if updatesStore has a pinnedMessageId
    if (updatesStore.pinnedMessageId) {
      try {
        const msg = await channel.messages.fetch(updatesStore.pinnedMessageId);
        if (msg) {
          await msg.edit({
            content: '📢 **Krims Code v5 • Live Platform Updates (Powered by Krims AI v3.1)** 🚀',
            embeds: [embed],
            components: [row]
          });
          console.log(`[PersistentUpdates] Edited existing persistent update message: ${msg.id}`);
          return msg;
        }
      } catch (_) {
        // Message was deleted or unreachable
      }
    }

    // 2. Scan recent messages in channel to avoid posting duplicates across container restarts
    const recentMessages = await channel.messages.fetch({ limit: 15 }).catch(() => null);
    if (recentMessages) {
      const existingBotMsg = recentMessages.find(m => 
        m.author.id === client.user.id && 
        m.content.includes('Live Platform Updates')
      );

      if (existingBotMsg) {
        updatesStore.pinnedMessageId = existingBotMsg.id;
        saveUpdates();
        await existingBotMsg.edit({
          content: '📢 **Krims Code v5 • Live Platform Updates (Powered by Krims AI v3.1)** 🚀',
          embeds: [embed],
          components: [row]
        });
        console.log(`[PersistentUpdates] Found & updated existing channel message: ${existingBotMsg.id} (prevented duplicate)`);
        return existingBotMsg;
      }
    }

    // 3. Only if absolutely no existing message exists, send a new one
    const newMsg = await channel.send({
      content: '📢 **Krims Code v5 • Live Platform Updates (Powered by Krims AI v3.1)** 🚀',
      embeds: [embed],
      components: [row]
    });

    updatesStore.pinnedMessageId = newMsg.id;
    saveUpdates();
    console.log(`[PersistentUpdates] Published new persistent update message: ${newMsg.id}`);
    return newMsg;
  } catch (err) {
    console.error('[PersistentUpdates] Error syncing update to Discord:', err.message);
    return null;
  }
}
