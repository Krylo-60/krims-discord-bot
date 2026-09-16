import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../data/custom_commands.json');

const DEFAULT_COMMANDS = [
  { trigger: '!test', response: '⚡ **Krims Code AI** is fully operational and responding! (Latency: {latency}ms)' },
  { trigger: '!ip', response: '🎮 **Minecraft Server IP:** `krylosmp.falix.gg:29273`\n📱 **Bedrock Port:** `29273`\n✨ Join now on Paper 1.21 with Geyser crossplay!' },
  { trigger: '!store', response: '🛒 **Official Web Store:** https://krylosmp-store.web.app/\nEarn KryloCoins in-game and redeem exclusive kits and cosmetics!' },
  { trigger: '!discord', response: '💬 **Invite your friends:** https://discord.gg/2hSXQKHvvX' },
  { trigger: '!vote', response: '⭐ **Vote for KryloSMP:** Boost your rank with a 10% vote bonus! [Vote Link](https://arcane.bot/vote)' }
];

let customCommandsCache = {};

function ensureDir() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadCustomCommands() {
  try {
    ensureDir();
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      customCommandsCache = JSON.parse(data || '{}');
    } else {
      customCommandsCache = { default: DEFAULT_COMMANDS };
      fs.writeFileSync(DB_PATH, JSON.stringify(customCommandsCache, null, 2), 'utf8');
    }
  } catch (err) {
    console.warn('[CustomCommands] Failed to read database, using defaults:', err.message);
    customCommandsCache = { default: DEFAULT_COMMANDS };
  }
  return customCommandsCache;
}

export function saveCustomCommands() {
  try {
    ensureDir();
    fs.writeFileSync(DB_PATH, JSON.stringify(customCommandsCache, null, 2), 'utf8');
  } catch (err) {
    console.error('[CustomCommands] Failed to save database:', err.message);
  }
}

loadCustomCommands();

export function getGuildCustomCommands(guildId, dashboardCommands = null) {
  const commands = [];
  const seenTriggers = new Set();

  if (Array.isArray(dashboardCommands) && dashboardCommands.length > 0) {
    for (const cmd of dashboardCommands) {
      if (cmd && cmd.trigger && cmd.response) {
        const cleanTrigger = cmd.trigger.trim().toLowerCase();
        if (!seenTriggers.has(cleanTrigger)) {
          seenTriggers.add(cleanTrigger);
          commands.push({ trigger: cleanTrigger, response: cmd.response });
        }
      }
    }
  }

  if (guildId && customCommandsCache[guildId]) {
    for (const cmd of customCommandsCache[guildId]) {
      if (cmd && cmd.trigger && cmd.response) {
        const cleanTrigger = cmd.trigger.trim().toLowerCase();
        if (!seenTriggers.has(cleanTrigger)) {
          seenTriggers.add(cleanTrigger);
          commands.push({ trigger: cleanTrigger, response: cmd.response });
        }
      }
    }
  }

  const defaults = customCommandsCache.default || DEFAULT_COMMANDS;
  for (const cmd of defaults) {
    if (cmd && cmd.trigger && cmd.response) {
      const cleanTrigger = cmd.trigger.trim().toLowerCase();
      if (!seenTriggers.has(cleanTrigger)) {
        seenTriggers.add(cleanTrigger);
        commands.push({ trigger: cleanTrigger, response: cmd.response });
      }
    }
  }

  return commands;
}

export function addGuildCustomCommand(guildId, trigger, response) {
  const cleanTrigger = trigger.trim().toLowerCase();
  const gId = guildId || 'default';
  if (!customCommandsCache[gId]) {
    customCommandsCache[gId] = [];
  }

  const idx = customCommandsCache[gId].findIndex(c => c.trigger.toLowerCase() === cleanTrigger);
  if (idx !== -1) {
    customCommandsCache[gId][idx].response = response;
  } else {
    customCommandsCache[gId].push({ trigger: cleanTrigger, response });
  }

  saveCustomCommands();
  return customCommandsCache[gId];
}

export function deleteGuildCustomCommand(guildId, trigger) {
  const cleanTrigger = trigger.trim().toLowerCase();
  const gId = guildId || 'default';
  if (!customCommandsCache[gId]) return false;

  const initialLen = customCommandsCache[gId].length;
  customCommandsCache[gId] = customCommandsCache[gId].filter(c => c.trigger.toLowerCase() !== cleanTrigger);
  const deleted = customCommandsCache[gId].length < initialLen;
  if (deleted) saveCustomCommands();
  return deleted;
}

export async function handleCustomCommandExecution(message, client, dashboardCommands = null) {
  if (!message || !message.content) return false;

  const rawContent = message.content.trim();
  const lowerContent = rawContent.toLowerCase();
  const guildId = message.guild ? message.guild.id : null;

  const availableCommands = getGuildCustomCommands(guildId, dashboardCommands);

  for (const cmd of availableCommands) {
    const trigger = cmd.trigger.toLowerCase();
    const isExact = lowerContent === trigger;
    const isPrefix = lowerContent.startsWith(trigger + ' ');

    if (isExact || isPrefix) {
      let responseText = cmd.response;
      if (message.author) {
        responseText = responseText.replace(/{user}/g, `<@${message.author.id}>`);
        responseText = responseText.replace(/{username}/g, message.author.username);
      }
      if (message.guild) {
        responseText = responseText.replace(/{server}/g, message.guild.name);
        responseText = responseText.replace(/{members}/g, `${message.guild.memberCount}`);
      }
      if (message.channel) {
        responseText = responseText.replace(/{channel}/g, `<#${message.channel.id}>`);
      }
      if (client && client.ws) {
        responseText = responseText.replace(/{latency}/g, `${client.ws.ping}`);
      }

      await message.reply({ content: responseText }).catch(() => {});
      return true;
    }
  }

  return false;
}
