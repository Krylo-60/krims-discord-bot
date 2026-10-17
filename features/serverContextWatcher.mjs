/**
 * 📡 Server Context Watcher Engine
 * Scans server messages every 30 minutes across active clan & community channels.
 * - Extracts recent discussions, player updates, and plans into server AI memory.
 * - Occasionally chimes into chat with fun, witty, supportive banter and tactical hype!
 */

import { ChannelType, PermissionFlagsBits } from 'discord.js';
import { recordConversationTurn, learnServerFact, buildServerMemoryContext } from './aiMemoryEngine.mjs';

const SCAN_INTERVAL_MS = 30 * 60 * 1000; // Every 30 minutes
const MIN_CHIME_COOLDOWN_MS = 40 * 60 * 1000; // Minimum 40 minutes between proactive bot chimes per channel
const lastChimeTimes = new Map(); // channelId -> timestamp
const lastScannedMessageIds = new Map(); // channelId -> lastMessageId

let watcherInterval = null;

/**
 * Scan all active text channels in a guild to update the AI's situational awareness
 */
export async function scanGuildContext(guild, geminiAskFn) {
  if (!guild || !guild.available) return;

  console.log(`[ContextWatcher] 🔍 Running 30-minute contextual scan for guild: "${guild.name}" (${guild.id})...`);

  try {
    const textChannels = guild.channels.cache.filter(c => 
      c.type === ChannelType.GuildText &&
      c.viewable &&
      !c.name.includes('log') &&
      !c.name.includes('ticket') &&
      !c.name.includes('admin') &&
      !c.name.includes('rules')
    );

    let totalNewMessages = 0;
    const channelSummaries = [];

    for (const [channelId, channel] of textChannels) {
      try {
        const fetchOptions = { limit: 25 };
        const lastId = lastScannedMessageIds.get(channelId);
        if (lastId) {
          fetchOptions.after = lastId;
        }

        const messages = await channel.messages.fetch(fetchOptions).catch(() => null);
        if (!messages || messages.size === 0) continue;

        // Sort chronological
        const sorted = Array.from(messages.values()).sort((a, b) => a.createdTimestamp - b.createdTimestamp);
        
        // Remember newest message ID
        lastScannedMessageIds.set(channelId, sorted[sorted.length - 1].id);

        const humanMessages = sorted.filter(m => !m.author.bot && m.content && !m.content.startsWith('!') && !m.content.startsWith('/'));
        if (humanMessages.length === 0) continue;

        totalNewMessages += humanMessages.length;

        // Feed human messages into AI server memory
        for (const msg of humanMessages) {
          recordConversationTurn(
            guild.id,
            channel.id,
            msg.author.id,
            msg.member?.nickname || msg.author.username,
            'user',
            msg.content
          );
        }

        const recentTexts = humanMessages.slice(-5).map(m => `${m.member?.nickname || m.author.username}: "${m.content}"`).join(' | ');
        channelSummaries.push(`#${channel.name}: ${recentTexts}`);

        // Check if we should proactively chime in for fun in the main chat
        await maybeChimeInForFun(channel, humanMessages, geminiAskFn, guild);

      } catch (chErr) {
        // Skip channel if no permission
      }
    }

    if (channelSummaries.length > 0) {
      const summaryText = channelSummaries.slice(0, 4).join('\n');
      learnServerFact(
        guild.id,
        'recent_server_activity',
        `Recent server discussions (${new Date().toLocaleTimeString()}):\n${summaryText}`,
        'ContextWatcher'
      );
      console.log(`[ContextWatcher] ✅ Processed ${totalNewMessages} messages across ${channelSummaries.length} channels in "${guild.name}"`);
    } else {
      console.log(`[ContextWatcher] 💤 Chat was quiet in "${guild.name}" during the last 30 minutes.`);
    }

  } catch (err) {
    console.warn(`[ContextWatcher] Error scanning guild ${guild.name}:`, err.message);
  }
}

/**
 * Evaluates whether to drop a fun, natural comment into chat
 */
async function maybeChimeInForFun(channel, recentHumanMessages, geminiAskFn, guild) {
  // Only chime into team chat, lounge, or general discussion channels
  const name = channel.name.toLowerCase();
  const isTargetChannel = name.includes('team-chat') || name.includes('general') || name.includes('lounge') || name.includes('chat');
  if (!isTargetChannel) return;

  const now = Date.now();
  const lastChime = lastChimeTimes.get(channel.id) || 0;
  if (now - lastChime < MIN_CHIME_COOLDOWN_MS) {
    return; // Rate limit protected
  }

  // Need at least 2 recent human messages to have conversational context
  if (recentHumanMessages.length < 2) return;

  // Most recent message shouldn't be ancient (within last 25 minutes)
  const latestMsg = recentHumanMessages[recentHumanMessages.length - 1];
  if (now - latestMsg.createdTimestamp > 25 * 60 * 1000) return;

  // Don't chime in 100% of the time — 60% probability for natural balance
  if (Math.random() > 0.60) return;

  console.log(`[ContextWatcher] 🎲 Selecting #${channel.name} in "${guild.name}" for a fun proactive chime-in...`);

  const chatSnippet = recentHumanMessages.slice(-4).map(m => `${m.member?.nickname || m.author.username}: ${m.content}`).join('\n');
  
  const isClanServer = guild.id === '1557852594242719775' || guild.name.toLowerCase().includes('half');
  const personaPrompt = isClanServer
    ? `You are Krims Code AI, the dedicated clan bot and tactical assistant for The Half Life's SMP team!
Leader: st1LLkill3r (Jonesy)
Co-Leader: KryloMCYT
Builder/Redstone: CrazyCoolCam
Veterans: Byqml, Domino.
Recent team conversation:
${chatSnippet}

Task: Write a single, brief, fun, upbeat or humorous 1-2 sentence message to chime into the conversation. Be supportive of base building, redstone projects, SMP grinding, or PvP prep. Use 1 or 2 relevant emojis (⚔️, 🛡️, 🔥, ⛏️, 🧠, 👑).
RULES: Never say you are an AI or bot. Never say "As a bot". Keep it short, natural, and friendly!`
    : `You are Krims Code AI, the community assistant for ${guild.name}.
Recent conversation:
${chatSnippet}

Task: Write a brief, witty, friendly 1-sentence comment to chime in and keep the chat lively. Use 1-2 emojis. Keep it natural!`;

  try {
    let responseText = null;
    if (typeof geminiAskFn === 'function') {
      responseText = await geminiAskFn(
        'Chime into the chat with a fun, natural comment based on recent messages.',
        personaPrompt,
        guild.name,
        guild.id
      );
    }

    if (responseText && responseText.trim().length > 0 && responseText.length < 280) {
      // Clean any accidental quotes
      const cleanReply = responseText.replace(/^["']|["']$/g, '').trim();
      await channel.send(cleanReply);
      lastChimeTimes.set(channel.id, now);
      console.log(`[ContextWatcher] 💬 Proactive chime sent in #${channel.name}: "${cleanReply}"`);
    }
  } catch (err) {
    console.warn(`[ContextWatcher] Chime error in #${channel.name}:`, err.message);
  }
}

/**
 * Initialize and start the recurring 30-minute watcher
 */
export function startServerContextWatcher(client, geminiAskFn) {
  if (watcherInterval) {
    clearInterval(watcherInterval);
  }

  console.log('[ContextWatcher] 🚀 Server Context Watcher started (scanning every 30 minutes)...');

  // Trigger initial scan after 15 seconds so bot connects first
  setTimeout(() => {
    runAllGuildScans(client, geminiAskFn);
  }, 15000);

  // Set 30-minute recurring interval
  watcherInterval = setInterval(() => {
    runAllGuildScans(client, geminiAskFn);
  }, SCAN_INTERVAL_MS);

  return watcherInterval;
}

export async function runAllGuildScans(client, geminiAskFn) {
  if (!client || !client.guilds) return;
  for (const [guildId, guild] of client.guilds.cache) {
    await scanGuildContext(guild, geminiAskFn);
  }
}
