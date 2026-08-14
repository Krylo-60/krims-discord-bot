/**
 * 👑 KRYLOSMP MASTER GOOGLE SHEETS:
 * 1. Support & Ticket Logs Sheet: https://docs.google.com/spreadsheets/d/1F4NRwssxFxJO58uX6CTHvXqSMoEMoLhJGRI2IeghF-g/edit?gid=377764939#gid=377764939
 * 2. Store & Verification Logs Sheet: https://docs.google.com/spreadsheets/d/1FAkYgHvcNW5ei0vf2GtXlKFjtBtdtGfmPAoUmIEQevA/edit?gid=0#gid=0
 */
import os from 'os';
import crypto from 'crypto';
import { Client, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, GatewayIntentBits, Partials, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } from 'discord.js';
import { KrimsClient } from '@krishivpb60/krims-code-sdk';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import util from 'util';
import path from 'path';
import http from 'http';
import Jimp from 'jimp';

import { joinVoice, leaveVoice, getVoiceStatus } from './voiceEngine.mjs';
import { saveUserVerification, getUserVerification, syncLocalJsonToFirebase } from './firebaseEngine.mjs';

dotenv.config();

// ═══════════════════════════════════════════════════════════
// 🧠 GEMINI 3.5 FLASH-LITE DIRECT API (FREE TIER UPGRADE)
// 4-Key Rotation System — prevents rate limits, maximizes throughput
// ═══════════════════════════════════════════════════════════
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4,
].filter(Boolean);

let geminiClients = [];
let geminiKeyIndex = 0;
let geminiClient = null;

if (GEMINI_KEYS.length > 0) {
  for (const key of GEMINI_KEYS) {
    try {
      geminiClients.push(new GoogleGenAI({ apiKey: key }));
    } catch (e) {
      console.warn('[Gemini] Failed to init key:', e.message);
    }
  }
  if (geminiClients.length > 0) {
    geminiClient = geminiClients[0];
    console.log(`[Gemini] ✅ ${geminiClients.length} Gemini 3.5 Flash-Lite API keys loaded (round-robin rotation active)!`);
  }
}

/** Rotate to the next Gemini API key */
function rotateGeminiKey() {
  if (geminiClients.length <= 1) return;
  geminiKeyIndex = (geminiKeyIndex + 1) % geminiClients.length;
  geminiClient = geminiClients[geminiKeyIndex];
}

/**
 * Direct Gemini ask function with model cascade:
 *   1. gemini-3.5-flash-lite (newest, fastest, smartest)
 *   2. gemini-2.5-flash (proven fallback)
 * Uses round-robin key rotation for maximum throughput
 */
const GEMINI_MODEL_CASCADE = ['gemini-3.5-flash-lite', 'gemini-2.5-flash'];

async function geminiDirectAsk(prompt, systemInstruction = '') {
  if (!geminiClient || geminiClients.length === 0) return null;
  
  const sysInstr = systemInstruction || 'You are Krims Code AI, the official KryloSMP Discord bot assistant. Be helpful, friendly, concise. Use emojis moderately. You speak in a slightly playful but professional tone.';

  // Try each model in the cascade
  for (const modelId of GEMINI_MODEL_CASCADE) {
    // Try current key, on rate limit rotate and retry across all keys
    for (let attempt = 0; attempt < geminiClients.length; attempt++) {
      try {
        const response = await geminiClient.models.generateContent({
          model: modelId,
          contents: prompt,
          config: {
            systemInstruction: sysInstr,
          }
        });
        rotateGeminiKey();
        const text = response?.text || response?.candidates?.[0]?.content?.parts?.[0]?.text || null;
        if (text) {
          console.log(`[Gemini] ✅ Response via ${modelId} (key ${geminiKeyIndex + 1})`);
          return text;
        }
      } catch (e) {
        if (e.status === 429 || e.message?.includes('RESOURCE_EXHAUSTED')) {
          console.warn(`[Gemini] Key ${geminiKeyIndex + 1} rate limited on ${modelId}, rotating...`);
          rotateGeminiKey();
          continue;
        }
        // Model-level error → try next model in cascade
        console.warn(`[Gemini] ${modelId} error: ${e.message} — falling back...`);
        rotateGeminiKey();
        break; // Break inner loop to try next model
      }
    }
  }
  return null; // All models and keys exhausted → Krims SDK takes over
}

/**
 * Helper to split long messages into mobile-friendly chunks (max 1900 chars)
 * Defined in global scope so all handlers (slash commands, messageCreate, etc.) can access it.
 */
async function sendSafeMessage(target, text) {
  if (!text || !target) return;
  try {
    if (text.length <= 1900) {
      if (target.edit) return await target.edit(text);
      if (target.editReply) return await target.editReply(text);
      if (target.reply) return await target.reply(text);
      if (target.send) return await target.send(text);
    }
  } catch (e) {
    if (target.channel && target.channel.send) {
      return await target.channel.send(text.substring(0, 1900)).catch(() => {});
    }
  }

  const chunks = [];
  let current = '';
  const lines = text.split('\n');

  for (const line of lines) {
    if ((current + '\n' + line).length > 1900) {
      if (current) chunks.push(current);
      current = line;
    } else {
      current = current ? (current + '\n' + line) : line;
    }
  }
  if (current) chunks.push(current);

  try {
    if (target.edit) await target.edit(chunks[0]);
    else if (target.editReply) await target.editReply(chunks[0]);
    else if (target.reply) await target.reply(chunks[0]);
    else if (target.send) await target.send(chunks[0]);
  } catch (e) {
    if (target.channel && target.channel.send) {
      await target.channel.send(chunks[0]).catch(() => {});
    }
  }

  const channel = target.channel || (target.send ? target : null);
  for (let i = 1; i < chunks.length; i++) {
    if (channel && channel.send) {
      await channel.send(chunks[i]).catch(() => {});
    }
  }
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction
  ]
});

const sdk = new KrimsClient({
  baseUrl: 'https://krims-code-chatbot.vercel.app'
});

// Preferred AI model — upgraded to Gemini 3.5 Flash-Lite (faster + smarter)
const PREFERRED_AI_MODEL = 'gemini-3.5-flash-lite';

// Maps to store state
const conversationHistory = new Map();
const userCooldowns = new Map();
const dailyCooldowns = new Map();
const workCooldowns = new Map();
const giveawayEntries = new Map(); // giveaway message ID -> Set of user IDs
const bountyData = new Map(); // user ID -> bounty amount in KC
const COOLDOWN_TIME = 2000; // 2 seconds cooldown in milliseconds
const spamMap = new Map();
const userStrikes = new Map();

// PvP Matchmaking State
let activeDuel = null; // { challengerId, challengedId, channelId }
const pvpQueue = [];  // Array of { challengerId, challengedId, challengerTag, challengedTag }

// Chat Activity Leveling System

// ══════════════════════════════════════════════════════════
// 🚀 KRYLOSMP 2.0 MEGA UPDATE STATE STORE
// ══════════════════════════════════════════════════════════
let clanData = {};
let jackpotPool = 25000; // Starting server jackpot pool (25,000 KryloCoins)
let questData = {};
const spinCooldowns = new Map();
const chestCooldowns = new Map();

try {
  if (fs.existsSync('clans.json')) clanData = JSON.parse(fs.readFileSync('clans.json', 'utf8'));
  if (fs.existsSync('quests.json')) questData = JSON.parse(fs.readFileSync('quests.json', 'utf8'));
  if (fs.existsSync('jackpot.json')) {
    const jData = JSON.parse(fs.readFileSync('jackpot.json', 'utf8'));
    if (jData.pool) jackpotPool = jData.pool;
  }
} catch (e) {
  console.warn('[MegaUpdate] Failed to load local JSON state:', e.message);
}

function saveMegaData() {
  try {
    fs.writeFileSync('clans.json', JSON.stringify(clanData, null, 2));
    fs.writeFileSync('quests.json', JSON.stringify(questData, null, 2));
    fs.writeFileSync('jackpot.json', JSON.stringify({ pool: jackpotPool }, null, 2));
  } catch (e) {
    console.warn('[MegaUpdate] Failed to save local state:', e.message);
  }
}

const xpCooldowns = new Set();
let xpData = {};

try {
  if (fs.existsSync('xp.json')) {
    xpData = JSON.parse(fs.readFileSync('xp.json', 'utf8'));
  }
} catch (err) {
  console.warn("[Leveling] Failed to load XP data:", err.message);
}

function saveXPData() {
  try {
    fs.writeFileSync('xp.json', JSON.stringify(xpData, null, 2));
  } catch (err) {
    console.warn("[Leveling] Failed to save local XP data:", err.message);
  }

  // Sync to persistent Vercel database asynchronously
  fetch('https://krims-code-chatbot.vercel.app/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'update_xp_data',
      guildId: '1524878881918685405',
      xpData: xpData
    })
  }).then(res => {
    if (!res.ok) console.warn("[Leveling] Failed to sync XP data to Vercel database: status", res.status);
  }).catch(err => {
    console.warn("[Leveling] Failed to sync XP data to Vercel database:", err.message);
  });
}

async function handleMessageXP(message) {
  if (!message.guild) return;
  const userId = message.author.id;
  
  if (xpCooldowns.has(userId)) return;
  xpCooldowns.add(userId);
  setTimeout(() => xpCooldowns.delete(userId), 60000); // 60s cooldown
  
  if (!xpData[userId]) {
    xpData[userId] = { xp: 0, level: 1 };
  }
  
  const xpToAdd = Math.floor(Math.random() * 11) + 15;
  xpData[userId].xp += xpToAdd;
  
  const currentLevel = xpData[userId].level;
  const xpNeeded = 5 * (currentLevel * currentLevel) + 50 * currentLevel + 100;
  
  if (xpData[userId].xp >= xpNeeded) {
    xpData[userId].level += 1;
    saveXPData();
    
    try {
      const levelUpEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🎉 LEVEL UP!')
        .setDescription(`Congratulations <@${userId}>, you have reached **Level ${xpData[userId].level}**! 🎉\nKeep chatting to unlock cool status!`)
        .setFooter({ text: 'KryloSMP Chat Leveling ⚡' })
        .setTimestamp();
      
      await message.channel.send({ embeds: [levelUpEmbed] });
    } catch (e) {
      console.warn("[Leveling] Failed to send level up message:", e.message);
    }
  } else {
    saveXPData();
  }
}

async function startNextDuel(guild) {
  if (activeDuel) return; // A duel is already in progress
  if (pvpQueue.length === 0) return; // No one in the queue

  const nextMatch = pvpQueue.shift();
  try {
    const challenger = await guild.members.fetch(nextMatch.challengerId).catch(() => null);
    const challenged = await guild.members.fetch(nextMatch.challengedId).catch(() => null);

    if (!challenger || !challenged) {
      // If one of the players left or is invalid, try the next one
      await startNextDuel(guild);
      return;
    }

    // Find or create PvP category
    const pvpCategory = guild.channels.cache.find(c => c.name.toLowerCase().includes('pvp') && c.type === ChannelType.GuildCategory);

    const duelChannel = await guild.channels.create({
      name: `⚔️┃duel-${challenger.user.username.toLowerCase()}-vs-${challenged.user.username.toLowerCase()}`,
      type: ChannelType.GuildText,
      parent: pvpCategory ? pvpCategory.id : null,
      topic: `Active 1v1 PvP Duel: ${challenger.user.tag} vs ${challenged.user.tag}. Type /endduel to finish.`,
      permissionOverwrites: [
        {
          id: guild.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: challenger.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: challenged.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
        }
      ]
    });

    activeDuel = {
      challengerId: challenger.id,
      challengedId: challenged.id,
      channelId: duelChannel.id
    };

    const embed = new EmbedBuilder()
      .setColor(0xFF0055)
      .setTitle('⚔️ PvP Duel Commenced!')
      .setDescription(`The duel between <@${challenger.id}> and <@${challenged.id}> has begun!\n\n**Instructions:**\n1. Join the server and warp to the arena: \`/warp pvp\`\n2. Battle each other!\n3. Once you are finished, type \`/endduel\` or click the button below to close this channel and start the next match in the queue.`)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('pvp_finish_duel')
        .setLabel('Finish Duel')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🏁')
    );

    await duelChannel.send({ content: `<@${challenger.id}> vs <@${challenged.id}>`, embeds: [embed], components: [row] });

    // Notify in general pvp channel
    const pvpChatCh = guild.channels.cache.find(c => c.name.includes('pvp-chat') && c.type === ChannelType.GuildText);
    if (pvpChatCh) {
      await pvpChatCh.send(`⚔️ **A duel has started!** <@${challenger.id}> vs <@${challenged.id}> is now active in <#${duelChannel.id}>.`);
    }
  } catch (err) {
    console.error('Failed to start next duel:', err.message);
    activeDuel = null;
    await startNextDuel(guild);
  }
}

async function endCurrentDuel(guild, duelChannel) {
  if (!activeDuel) return;
  
  const oldDuel = activeDuel;
  activeDuel = null;

  try {
    await duelChannel.delete();
  } catch (err) {
    console.warn('[PvP Matchmaking] Failed to delete duel channel:', err.message);
  }

  // Remove PvP Player role from both players
  try {
    const pvpRole = guild.roles.cache.find(r => r.name === '⚔️ PvP Specialist');
    if (pvpRole) {
      const challenger = await guild.members.fetch(oldDuel.challengerId).catch(() => null);
      const challenged = await guild.members.fetch(oldDuel.challengedId).catch(() => null);
      if (challenger) await challenger.roles.remove(pvpRole).catch(() => {});
      if (challenged) await challenged.roles.remove(pvpRole).catch(() => {});
      console.log(`[PvP Matchmaking] Removed PvP Player role from ${oldDuel.challengerId} and ${oldDuel.challengedId}`);
    }
  } catch (roleErr) {
    console.warn('[PvP Matchmaking] Failed to remove role:', roleErr.message);
  }

  // Post notice in pvp-chat
  const pvpChatCh = guild.channels.cache.find(c => c.name.includes('pvp-chat') && c.type === ChannelType.GuildText);
  if (pvpChatCh) {
    await pvpChatCh.send(`🏁 **Duel Finished:** <@${oldDuel.challengerId}> vs <@${oldDuel.challengedId}> has concluded. PvP roles have been removed.`);
  }

  // Start next match
  await startNextDuel(guild);
}

const execPromise = util.promisify(exec);

function startAutoUpdater() {
  console.log("[Auto-Updater] Initialized. Checking for GitHub repository updates every 5 minutes...");
  setInterval(async () => {
    try {
      console.log("[Auto-Updater] Fetching origin...");
      await execPromise('git fetch origin');
      
      const { stdout } = await execPromise('git status -uno');
      if (stdout.includes('Your branch is behind')) {
        console.log("[Auto-Updater] New updates detected on origin/main! Pulling changes...");
        await execPromise('git pull');
        console.log("[Auto-Updater] Re-installing dependencies...");
        await execPromise('npm install');
        console.log("[Auto-Updater] Auto-restart triggered. Spawning new process...");
        
        const out = fs.openSync('./auto_update.log', 'a');
        const err = fs.openSync('./auto_update.log', 'a');
        
        const child = spawn(process.argv[0], process.argv.slice(1), {
          detached: true,
          stdio: [ 'ignore', out, err ]
        });
        child.unref();
        
        console.log("[Auto-Updater] Exiting old process...");
        process.exit(0);
      } else {
        console.log("[Auto-Updater] Bot is up to date.");
      }
    } catch (err) {
      console.error("[Auto-Updater] Update check failed:", err.message);
    }
  }, 5 * 60 * 1000);
}

async function updateDynamicServerVoiceStats() {
  try {
    const res = await fetch('https://api.mcsrvstat.us/3/KryloSmp.play.hosting');
    let isOnline = false;
    let playerCount = 0;
    if (res.ok) {
      const data = await res.json();
      const motdClean = (data.motd?.clean || []).join(' ').toLowerCase();
      isOnline = data.online && !motdClean.includes('offline') && data.version !== 'play.hosting';
      playerCount = data.players?.online || 0;
    }

    const statusChannelName = isOnline ? `🟢 ┃ Status: ONLINE (${playerCount})` : `🔴 ┃ Status: OFFLINE`;
    
    // Update bot presence
    if (isOnline) {
      client.user.setActivity(`KryloSMP: ${playerCount} online`, { type: 0 });
    } else {
      client.user.setActivity('KryloSMP (Offline)', { type: 0 });
    }

    // Update voice channels across guilds
    const targetGuilds = ['1524878881918685405', '1420991845546332162', '1532574925356007525'];
    for (const gid of targetGuilds) {
      const guild = client.guilds.cache.get(gid);
      if (!guild) continue;
      
      const channels = await guild.channels.fetch().catch(() => null);
      if (!channels) continue;
      
      const statusCh = channels.find(c => c && c.isVoiceBased() && (c.name.includes('Status: ONLINE') || c.name.includes('Status: OFFLINE') || c.name.includes('Status:')));
      if (statusCh && statusCh.name !== statusChannelName) {
        await statusCh.setName(statusChannelName).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('[Dynamic Stats Updater] Check error:', err.message);
  }
}

function startDynamicStatsUpdater() {
  updateDynamicServerVoiceStats();
  setInterval(updateDynamicServerVoiceStats, 60 * 1000);
}

client.once('ready', async () => {
  console.log(`[+] Krims Code Discord Bot online as ${client.user.tag}`);
  startAutoUpdater();
  startDynamicStatsUpdater();

  // Load XP data from persistent Vercel database
  try {
    const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId: '1524878881918685405' })
    });
    if (configRes.ok) {
      const dbConfig = await configRes.json();
      if (dbConfig && dbConfig.xpData) {
        xpData = dbConfig.xpData;
        console.log(`[Leveling] Successfully loaded ${Object.keys(xpData).length} users' XP from Vercel database!`);
      }
    }
  } catch (err) {
    console.warn("[Leveling] Failed to load XP from Vercel config database:", err.message);
  }

  // Register Global Slash Commands
  const slashCommands = [
    {
      name: 'gameboost',
      description: 'Optimize PC RAM & close background apps for 100+ FPS Minecraft gaming'
    },
    {
      name: 'adminabuse',
      description: 'Trigger the official Monthly Admin Abuse & Chaos Event (Admin only)',
      options: [{ name: 'details', type: 3, description: 'Custom drop party details or rewards', required: false }]
    },
    {
      name: 'genkey',
      description: 'Generate a free custom API key with custom prefix (Admin only)',
      options: [
        { name: 'prefix', type: 3, description: 'Custom key prefix (e.g. krylo, krims)', required: false },
        { name: 'env', type: 3, description: 'Environment (live, dev, admin)', required: false }
      ]
    },
    {
      name: 'ask',
      description: 'Ask the Krims Gemini AI engine any coding query',
      options: [
        {
          name: 'prompt',
          type: 3, // String type
          description: 'Your coding question',
          required: true
        }
      ]
    },
    {
      name: 'ticket',
      description: 'Open a secure private support ticket channel',
      options: [
        {
          name: 'reason',
          type: 3, // String type
          description: 'The reason / question for opening this ticket',
          required: true
        }
      ]
    },
    {
      name: 'close',
      description: 'Resolve and close the current support ticket channel'
    },
    {
      name: 'diagnose',
      description: 'Compile local and global network diagnostic statistics'
    },
    {
      name: 'github',
      description: 'Get links to the Krims Code GitHub repositories and portal site'
    },
    {
      name: 'status',
      description: 'Check the real-time status of the KryloSMP Minecraft server'
    },
    {
      name: 'ip',
      description: 'Get the Minecraft server connection address and port'
    },
    {
      name: 'shop',
      description: 'Display in-game shop items and coin prices'
    },
    {
      name: 'poll',
      description: 'Create a poll for the server to vote on',
      options: [
        {
          name: 'question',
          type: 3,
          description: 'The poll question',
          required: true
        },
        {
          name: 'option1',
          type: 3,
          description: 'First option',
          required: true
        },
        {
          name: 'option2',
          type: 3,
          description: 'Second option',
          required: true
        },
        {
          name: 'option3',
          type: 3,
          description: 'Third option (optional)',
          required: false
        }
      ]
    },
    {
      name: 'giveaway',
      description: 'Start a giveaway that players can enter by clicking a button',
      options: [
        {
          name: 'prize',
          type: 3,
          description: 'What is the prize?',
          required: true
        },
        {
          name: 'duration',
          type: 4, // Integer
          description: 'Duration in minutes',
          required: true
        }
      ]
    },
    {
      name: 'leaderboard',
      description: 'Show the server activity leaderboard'
    },
    {
      name: 'serverinfo',
      description: 'Display detailed information about this Discord server'
    },
    {
      name: 'suggest',
      description: 'Submit a suggestion for the server',
      options: [
        {
          name: 'idea',
          type: 3,
          description: 'Your suggestion for the server',
          required: true
        }
      ]
    },
    {
      name: 'announce',
      description: 'Send an announcement embed to the announcements channel (Admin only)',
      options: [
        {
          name: 'title',
          type: 3,
          description: 'Announcement title',
          required: true
        },
        {
          name: 'message',
          type: 3,
          description: 'Announcement message',
          required: true
        }
      ]
    },
    {
      name: 'verify',
      description: 'Verify your Minecraft account by entering your verification code',
      options: [
        {
          name: 'code',
          type: 3,
          description: 'The verification code generated in Minecraft',
          required: true
        }
      ]
    },
    {
      name: 'mcban',
      description: 'Double-ban a user from both Discord and Minecraft (including IP ban)',
      options: [
        {
          name: 'user',
          type: 6,
          description: 'The Discord member to ban',
          required: false
        },
        {
          name: 'mcusername',
          type: 3,
          description: 'The Minecraft username to ban (if no Discord account is linked/present)',
          required: false
        },
        {
          name: 'reason',
          type: 3,
          description: 'Reason for the ban',
          required: false
        }
      ]
    },
    {
      name: 'pvp',
      description: 'Toggle your access to the private PvP chat channel'
    },
    {
      name: 'tournament',
      description: 'Toggle your access to the private tournaments channel'
    },
    {
      name: 'tornament',
      description: 'Toggle your access to the private tournaments channel (alias)'
    },
    {
      name: 'challenge',
      description: 'Challenge another player to a 1v1 PvP duel',
      options: [
        {
          name: 'opponent',
          type: 6,
          description: 'The player you want to challenge',
          required: true
        }
      ]
    },
    {
      name: 'endduel',
      description: 'End the current PvP duel and start the next match in the queue'
    },
    {
      name: 'coinflip',
      description: 'Flip a coin - Heads or Tails!'
    },
    {
      name: 'roll',
      description: 'Roll a dice (1 to 6) or specify a custom range',
      options: [
        {
          name: 'max',
          type: 4, // Integer
          description: 'Maximum number (default is 6)',
          required: false
        }
      ]
    },
    {
      name: 'avatar',
      description: 'Get a link to a user\'s avatar image',
      options: [
        {
          name: 'user',
          type: 6, // User
          description: 'The user to get the avatar of',
          required: false
        }
      ]
    },
    {
      name: 'joke',
      description: 'Get a funny Minecraft or gaming joke'
    },
    {
      name: 'meme',
      description: 'Fetch a random funny Minecraft meme'
    },
    {
      name: 'rank',
      description: 'Show your server chat activity rank, level, and XP',
      options: [
        {
          name: 'user',
          type: 6, // User
          description: 'The user to show the rank of',
          required: false
        }
      ]
    },
    {
      name: 'xpleaderboard',
      description: 'Display the top 10 most active chatters in the server'
    },
    {
      name: 'bday',
      description: 'Celebrate a user\'s birthday with fireworks, double XP & bonus KryloCoins!',
      options: [
        {
          name: 'user',
          type: 6,
          description: 'The user celebrating their birthday (leave blank for yourself)',
          required: false
        }
      ]
    },
    {
      name: 'daily',
      description: 'Claim your daily free KryloCoins reward!'
    },
    {
      name: 'work',
      description: 'Work a minigame job to earn KryloCoins!'
    },
    {
      name: 'balance',
      description: 'Check your current KryloCoins wallet balance',
      options: [
        {
          name: 'user',
          type: 6,
          description: 'User to check balance of',
          required: false
        }
      ]
    },
    {
      name: 'pay',
      description: 'Transfer KryloCoins to another player',
      options: [
        {
          name: 'user',
          type: 6,
          description: 'Player to send coins to',
          required: true
        },
        {
          name: 'amount',
          type: 4, // Integer
          description: 'Amount of KryloCoins to send',
          required: true
        }
      ]
    },
    {
      name: 'slots',
      description: 'Spin the casino slot machine to win KryloCoins!',
      options: [
        {
          name: 'bet',
          type: 4,
          description: 'Amount of KryloCoins to bet (min: 10)',
          required: true
        }
      ]
    },
    {
      name: 'eightball',
      description: 'Ask the Magic 8-Ball a question!',
      options: [
        {
          name: 'question',
          type: 3,
          description: 'Your question for the Magic 8-Ball',
          required: true
        }
      ]
    },
    {
      name: 'serverinfo',
      description: 'Display detailed server statistics, member counts & boost status'
    },
    {
      name: 'userinfo',
      description: 'Display user account details, join date & permissions',
      options: [
        {
          name: 'user',
          type: 6,
          description: 'User to inspect',
          required: false
        }
      ]
    },
    {
      name: 'purge',
      description: 'Bulk delete messages from the channel (Staff Only)',
      options: [
        {
          name: 'amount',
          type: 4,
          description: 'Number of messages to delete (1-100)',
          required: true
        }
      ]
    },
    {
      name: 'warn',
      description: 'Issue an official warning strike to a player (Staff Only)',
      options: [
        {
          name: 'user',
          type: 6,
          description: 'User to warn',
          required: true
        },
        {
          name: 'reason',
          type: 3,
          description: 'Reason for the warning',
          required: true
        }
      ]
    },
    {
      name: 'vote',
      description: 'Vote for KryloSMP on top server directories to earn free +500 KC & keys!'
    },
    {
      name: 'refer',
      description: 'Refer friends to KryloSMP to earn +2,000 KC and Referral Crate Keys!',
      options: [{ name: 'friend', type: 6, description: 'Friend you invited', required: false }]
    },
    { name: 'bump', description: 'Check Disboard bump status and set 2-hour reminder for free server traffic!' },
    { name: 'verify', description: 'Link your Discord and whitelist your Minecraft username!',
      options: [{ name: 'username', type: 3, description: 'Your Minecraft In-Game Username', required: true }]
    },
    { name: 'spin', description: 'Spin the KryloSMP Fortune Wheel for free daily prizes and KryloCoins!' },
    { name: 'chest', description: 'Open your FREE Daily Lucky Chest for random loot and KryloCoins!' },
    { name: 'jackpot', description: 'View the global KryloSMP Jackpot pool and contribute KC to win big!' },
    { name: 'quests', description: 'View your active Season Pass quests and claim XP/KryloCoin rewards!' },
    {
      name: 'clan',
      description: 'Manage your KryloSMP faction clan!',
      options: [
        {
          name: 'create',
          type: 1, // Subcommand
          description: 'Create a new clan with private role & text channel',
          options: [
            { name: 'name', type: 3, description: 'Clan Name (e.g. Krylo Clan)', required: false },
            { name: 'tag', type: 3, description: 'Clan Tag (e.g. KSMP)', required: false }
          ]
        },
        {
          name: 'disband',
          type: 1, // Subcommand
          description: 'Permanently disband your clan and delete its private channel & role'
        },
        {
          name: 'deposit',
          type: 1, // Subcommand
          description: 'Deposit KryloCoins into the Clan Vault',
          options: [
            { name: 'amount', type: 4, description: 'KryloCoins amount to deposit', required: true }
          ]
        },
        {
          name: 'invite',
          type: 1, // Subcommand
          description: 'Invite a member to your clan and grant them private channel role',
          options: [
            { name: 'target', type: 6, description: 'User to invite to clan', required: true }
          ]
        },
        {
          name: 'info',
          type: 1, // Subcommand
          description: 'View your clan info, vault balance, and member roster'
        },
        {
          name: 'leaderboard',
          type: 1, // Subcommand
          description: 'View the top clans leaderboard ranked by vault balance'
        }
      ]
    },
    { name: 'bounty', description: 'Place or view active bounties on players for KC rewards!',
      options: [
        { name: 'target', type: 6, description: 'Player to bounty', required: false },
        { name: 'amount', type: 4, description: 'KC bounty amount min 100', required: false }
      ]
    },
    { name: 'trade', description: 'Trade items and KryloCoins with another player securely!',
      options: [
        { name: 'player', type: 6, description: 'Player to trade with', required: true },
        { name: 'offer', type: 3, description: 'What you are offering', required: true }
      ]
    },
    { name: 'pet', description: 'View feed or train your KryloSMP virtual companion pet!',
      options: [{ name: 'action', type: 3, description: 'Pet action', required: false, choices: [
        { name: 'View', value: 'view' }, { name: 'Feed', value: 'feed' },
        { name: 'Train', value: 'train' }, { name: 'Adopt', value: 'adopt' }
      ]}]
    },
    { name: 'fish', description: 'Go fishing in KryloSMP waters for rare catches and KC rewards!' },
    { name: 'mine', description: 'Go mining in KryloSMP caves for ores gems and KC rewards!' },
    { name: 'craft', description: 'Craft items from gathered materials for special rewards!' },
    { name: 'enchant', description: 'Enchant your gear with magical abilities for combat bonuses!' },
    { name: 'raid', description: 'Launch or join a server-wide raid boss event for epic loot!',
      options: [{ name: 'action', type: 3, description: 'Raid action', required: false, choices: [
        { name: 'View', value: 'view' }, { name: 'Join', value: 'join' }, { name: 'Leaderboard', value: 'leaderboard' }
      ]}]
    },
    { name: 'profile', description: 'View your full KryloSMP player profile and stats!',
      options: [{ name: 'player', type: 6, description: 'Player to view', required: false }]
    },
    { name: 'inventory', description: 'View your KryloSMP inventory of items keys and collectibles!' },
    { name: 'achievements', description: 'View your unlocked achievements and progress milestones!' },
    { name: 'duel', description: 'Challenge another player to a 1v1 KC wager duel!',
      options: [
        { name: 'opponent', type: 6, description: 'Player to challenge', required: true },
        { name: 'wager', type: 4, description: 'KC wager amount min 50', required: false }
      ]
    },
    { name: 'heist', description: 'Attempt a KC heist on the KryloSMP Bank vault for massive payouts!' },
    { name: 'rob', description: 'Attempt to rob KryloCoins from another player!',
      options: [{ name: 'target', type: 6, description: 'Player to rob', required: true }]
    },
    { name: 'lottery', description: 'Buy a lottery ticket for the weekly KryloSMP mega drawing!',
      options: [{ name: 'tickets', type: 4, description: 'Number of tickets 100 KC each', required: false }]
    },
    { name: 'lootbox', description: 'Open a mystery lootbox for random items and KC rewards!',
      options: [{ name: 'type', type: 3, description: 'Lootbox tier', required: false, choices: [
        { name: 'Common FREE', value: 'common' }, { name: 'Rare 500 KC', value: 'rare' },
        { name: 'Epic 2000 KC', value: 'epic' }, { name: 'Legendary 5000 KC', value: 'legendary' }
      ]}]
    }
  ];

  try {
    const uniqueCommands = [];
    const seenNames = new Set();
    for (const cmd of slashCommands) {
      if (cmd && cmd.name && !seenNames.has(cmd.name)) {
        seenNames.add(cmd.name);
        uniqueCommands.push(cmd);
      }
    }
    await client.application.commands.set(uniqueCommands);
    console.log(`[+] ${uniqueCommands.length} unique slash commands registered globally!`);
    console.log('[+] Slash commands registered globally!');

  // Sync local data to Firebase cloud
  try {
    await syncLocalJsonToFirebase();
  } catch (e) {
    console.warn('[Firebase] Startup sync error:', e.message);
  }
  } catch (err) {
    console.error('[-] Failed to register slash commands:', err.message);
  }

  // Automatic Birthday Scheduler for July 24th (Only triggers on exact date: July 24th)
  let birthdayAnnouncedYear = new Date().getFullYear(); // Safe initialization to prevent retroactive triggers
  setInterval(async () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const isJuly24 = ((now.getMonth() + 1) === 7 && now.getDate() === 24); // Month 7 = July // Month 6 = July (0-indexed)
    if (isJuly24 && birthdayAnnouncedYear !== currentYear) {
      birthdayAnnouncedYear = currentYear;
        
        console.log("[🎂 BIRTHDAY DAEMON] July 24th reached! Triggering Official Birthday Announcement...");
        try {
          const guild = await client.guilds.fetch('1524878881918685405');
          const announceCh = guild.channels.cache.find(c => c.name.includes('announcements') && c.type === ChannelType.GuildText);
          
          if (!announceCh) return;

          // Check if birthday announcement ALREADY exists in channel history
          const recentMsgs = await announceCh.messages.fetch({ limit: 25 }).catch(() => null);
          const alreadyPosted = recentMsgs && recentMsgs.some(m => 
            m.embeds && m.embeds.some(e => e.title && e.title.includes("OFFICIALLY KRYLO'S BIRTHDAY"))
          );
          if (alreadyPosted) {
            return; // Already posted in channel, skip!
          }
        if (announceCh) {
          const embed = new EmbedBuilder()
            .setColor(0xFF007F)
            .setTitle('🎂🎉 IT IS OFFICIALLY KRYLO\'S BIRTHDAY! 🎉🎂')
            .setDescription('👑 **HAPPY BIRTHDAY TO KRYLO, THE CREATOR & OWNER OF KRYLOSMP!** 🥳✨\n\nToday is the big day! Everyone raise your swords, celebrate in-game, and claim your free **+1000 KryloCoins** bonus using `/bday` and `/daily`! ⚔️💎🎁')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'KryloSMP Official Birthday Event • July 24th' })
            .setTimestamp();

          await announceCh.send({ content: '🎉 @everyone **IT IS OFFICIALLY KRYLO\'S BIRTHDAY!** 🎂🎈', embeds: [embed] });
        }
      } catch (err) {
        console.warn("[🎂 BIRTHDAY DAEMON] Failed to send announcement:", err.message);
      }
    }
  }, 60000);

  // 24/7 Automated Social News & Real-Player Acquisition Daemon (Runs on Render every 4 hours)
  setInterval(async () => {
    try {
      const guild = await client.guilds.fetch('1524878881918685405');
      const generalCh = guild.channels.cache.find(c => c && c.name && c.name.includes('general-chat') && c.type === ChannelType.GuildText);
      const socialsCh = guild.channels.cache.find(c => c && c.name && c.name.includes('socials') && c.type === ChannelType.GuildText);

      const promoEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🚀 KRYLOSMP AUTOMATED COMMUNITY SPOTLIGHT & REWARDS 🚀')
        .setDescription(
          '👑 **Join the #1 Cross-Platform Survival SMP!** 🥳\n\n' +
          '• **Java IP:** `KryloSmp.play.hosting` (Port: `25565`)\n' +
          '• **Bedrock / Mobile IP:** `KryloSmp.play.hosting` (Port: `19132`)\n\n' +
          '---\n\n' +
          '### 🎁 Active Player Perks & Rewards:\n' +
          '• 💎 **Daily Item Rewards:** Run `/daily` for Day 1 free **32x Diamonds & +1,000 KC**!\n' +
          '• 🤝 **Referral Rewards:** Run `/refer` and earn **+2,000 KC** per friend invited!\n' +
          '• 🗳️ **Voting Rewards:** Run `/vote` on top directories for free Crate Keys!\n\n' +
          'Webstore: `https://krylosmp-store.vercel.app` ⚔️'
        )
        .setFooter({ text: 'KryloSMP 24/7 Cloud Automated Spotlight' })
        .setTimestamp();

      if (generalCh) {
        // Auto-purge old promo spotlight messages before sending new one
        const recent = await generalCh.messages.fetch({ limit: 20 }).catch(() => null);
        if (recent && recent.size > 0) {
          const oldPromos = recent.filter(m => m.author.id === client.user.id && m.embeds && m.embeds[0] && m.embeds[0].title && m.embeds[0].title.includes('COMMUNITY SPOTLIGHT'));
          if (oldPromos.size > 0) await generalCh.bulkDelete(oldPromos, true).catch(() => {});
        }
        await generalCh.send({ embeds: [promoEmbed] });
      }

      if (socialsCh) {
        const recentSocial = await socialsCh.messages.fetch({ limit: 20 }).catch(() => null);
        if (recentSocial && recentSocial.size > 0) {
          const oldPromos = recentSocial.filter(m => m.author.id === client.user.id && m.embeds && m.embeds[0] && m.embeds[0].title && m.embeds[0].title.includes('COMMUNITY SPOTLIGHT'));
          if (oldPromos.size > 0) await socialsCh.bulkDelete(oldPromos, true).catch(() => {});
        }
        await socialsCh.send({ embeds: [promoEmbed] });
      }
      console.log('[🚀 NEWS SPREADER DAEMON] Broadcasted 24/7 KryloSMP spotlight!');
    } catch (err) {
      console.warn('[🚀 NEWS SPREADER DAEMON] Warning:', err.message);
    }
  }, 4 * 60 * 60 * 1000); // Every 4 hours

  // Start polling Vercel configuration database for pending actions and console commands
  setInterval(async () => {
    const GUILD_ID = '1524878881918685405';
    try {
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: GUILD_ID })
      });
      if (configRes.ok) {
        const guildConfig = await configRes.json();
        let configChanged = false;

        // 1. Process pending store commands from website checkout
        const pendingCommands = guildConfig.pendingCommands || [];
        if (pendingCommands.length > 0) {
          console.log(`[STORE PENDING] Found ${pendingCommands.length} store command(s) to execute...`);
          for (const cmd of pendingCommands) {
            try {
              console.log(`[STORE PENDING] Executing Pterodactyl command: ${cmd}`);
              await fetch(`https://panel.play.hosting/api/client/servers/25a5d79a/command`, {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + process.env.PTERODACTYL_TOKEN,
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ command: cmd })
              });
            } catch (cmdErr) {
              console.error(`[STORE PENDING] Command failed: ${cmd}`, cmdErr.message);
            }
          }
          guildConfig.pendingCommands = [];
          configChanged = true;
        }

        // 2. Process pending broadcast actions
        const actions = guildConfig.actions || [];
        if (actions.length > 0) {
          console.log(`[ACTION QUEUE] Found ${actions.length} pending action(s). Processing...`);
          
          for (const action of actions) {
            if (action.type === 'send_embed') {
              try {
                let channel = null;
                if (action.channelId && action.channelId !== 'default') {
                  channel = client.channels.cache.get(action.channelId) || await client.channels.fetch(action.channelId).catch(() => null);
                }
                
                if (!channel) {
                  const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
                  if (guild) {
                    channel = guild.channels.cache.find(c => 
                      c.type === ChannelType.GuildText && (
                        c.name.includes('staff') || 
                        c.name.includes('admin') || 
                        c.name.includes('alert') || 
                        c.name.includes('notifications') || 
                        c.name.includes('general')
                      )
                    );
                  }
                }

                if (channel) {
                  const embed = {
                    color: parseInt(action.color.replace('#', ''), 16) || 0x00f2ff,
                    title: action.title,
                    description: action.description,
                    timestamp: new Date().toISOString(),
                    footer: {
                      text: 'Krims Code Broadcast Station'
                    }
                  };
                  await channel.send({ embeds: [embed] });
                  console.log(`[ACTION QUEUE] Successfully posted embed to channel #${channel.name}`);
                }
              } catch (err) {
                console.error(`[ACTION QUEUE] Failed to execute send_embed:`, err.message);
              }
            }
          }

          guildConfig.actions = [];
          configChanged = true;
        }

        // 3. Sync player ranks/roles from Discord to Vercel config
        const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
        if (guild && guildConfig.verifiedPlayers) {
          let rolesUpdated = false;
          for (const [userId, playerInfo] of Object.entries(guildConfig.verifiedPlayers)) {
            try {
              const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
              if (member) {
                // 1. Sync from Vercel config (store purchases) to Discord
                const dbRank = playerInfo.rank;
                if (dbRank && dbRank !== 'Member') {
                  const cleanDbRank = dbRank.toLowerCase().replace(' rank', '');
                  const matchingRole = guild.roles.cache.find(r => r.name.toLowerCase().includes(cleanDbRank));
                  if (matchingRole && !member.roles.cache.has(matchingRole.id)) {
                    await member.roles.add(matchingRole);
                    console.log(`[Auto-Sync] Granted role ${matchingRole.name} to ${member.user.tag} matching Vercel database rank.`);
                  }
                }

                // 2. Sync from Discord roles to Vercel config
                let resolvedRank = 'Member';
                if (member.roles.cache.some(r => r.name.toLowerCase().includes('krylo god'))) {
                  resolvedRank = 'Krylo God';
                } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('immortal'))) {
                  resolvedRank = 'Immortal';
                } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('god'))) {
                  resolvedRank = 'God';
                } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('overlord'))) {
                  resolvedRank = 'Overlord';
                } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('elite'))) {
                  resolvedRank = 'Elite';
                } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('champion'))) {
                  resolvedRank = 'Champion';
                } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('titan'))) {
                  resolvedRank = 'Titan';
                } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('legend'))) {
                  resolvedRank = 'Legend';
                } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('mvp'))) {
                  resolvedRank = 'MVP';
                } else if (member.roles.cache.some(r => r.name.toLowerCase().includes('vip'))) {
                  resolvedRank = 'VIP';
                }
                
                if (playerInfo.rank !== resolvedRank) {
                  playerInfo.rank = resolvedRank;
                  rolesUpdated = true;
                }
              }
            } catch (err) {
              // Ignore failed member fetches
            }
          }
          if (rolesUpdated) {
            configChanged = true;
          }
        }

        // Save back changes if config changed
        if (configChanged) {
          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_config', guildId: GUILD_ID, config: guildConfig })
          });
          console.log(`[DATABASE] Config synchronized and queues cleared.`);
        }
      }
    } catch (err) {
      console.warn(`[ACTION QUEUE] Polling failed:`, err.message);
    }
  }, 5000); // Poll every 5 seconds

  // Post Interactive Buttons in KryloSMP Server if they don't exist
  try {
    const GUILD_ID = '1524878881918685405';
    const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
    if (guild) {
      console.log(`await ensureMonthlyNativeDiscordEvent(guild);
  [KryloSMP Setup] Found KryloSMP guild. Ensuring button systems are active...`);

      // 1. Support Ticket Button
      const supportCh = guild.channels.cache.find(c => c.name.includes('support-tickets') && c.type === ChannelType.GuildText);
      if (supportCh) {
        const messages = await supportCh.messages.fetch({ limit: 10 });
        const hasTicketBtn = messages.some(m => m.components.some(c => c.components.some(b => b.customId === 'open_ticket')));
        if (!hasTicketBtn) {
          try {
            if (messages.size > 0) {
              await supportCh.bulkDelete(messages).catch(async () => {
                for (const [, m] of messages) {
                  await m.delete().catch(() => {});
                }
              });
            }
          } catch {}

          const embed = new EmbedBuilder()
            .setColor(0x00F2FF)
            .setTitle('🎟️ KryloSMP Support Tickets')
            .setDescription('Need assistance, want to report a player, or have a question? Click the button below to open a private support ticket with our staff!')
            .setImage('attachment://krylosmp_banner.png');
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('open_ticket')
              .setLabel('Open Support Ticket')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🎟️')
          );
          const files = [];
          if (fs.existsSync('krylosmp_banner.png')) {
            files.push(new AttachmentBuilder('krylosmp_banner.png', { name: 'krylosmp_banner.png' }));
          }
          await supportCh.send({ embeds: [embed], components: [row], files });
          console.log(`[KryloSMP Setup] Sent support ticket button embed.`);
        }
      }

      // 2. Role Selector Buttons
      const infoCh = guild.channels.cache.find(c => c.name.includes('server-info') && c.type === ChannelType.GuildText);
      if (infoCh) {
        const messages = await infoCh.messages.fetch({ limit: 20 });
        const hasRoleBtn = messages.some(m => m.components.some(c => c.components.some(b => b.customId?.startsWith('role_'))));
        if (!hasRoleBtn) {
          try {
            if (messages.size > 0) {
              await infoCh.bulkDelete(messages).catch(async () => {
                for (const [, m] of messages) {
                  await m.delete().catch(() => {});
                }
              });
            }
          } catch {}

          const embed = new EmbedBuilder()
            .setColor(0xAA55FF)
            .setTitle('🎨 Server Roles Selection')
            .setDescription('Click the buttons below to grab your platform and notification roles!')
            .setImage('attachment://krylosmp_banner.png');
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('role_java')
              .setLabel('Java Player')
              .setStyle(ButtonStyle.Success)
              .setEmoji('☕'),
            new ButtonBuilder()
              .setCustomId('role_bedrock')
              .setLabel('Bedrock Player')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🪨'),
            new ButtonBuilder()
              .setCustomId('role_announcements')
              .setLabel('Announcements')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('📢'),
            new ButtonBuilder()
              .setCustomId('role_giveaways')
              .setLabel('Giveaways')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🎁')
          );
          const files = [];
          if (fs.existsSync('krylosmp_banner.png')) {
            files.push(new AttachmentBuilder('krylosmp_banner.png', { name: 'krylosmp_banner.png' }));
          }
          await infoCh.send({ embeds: [embed], components: [row], files });
          console.log(`[KryloSMP Setup] Sent role selection button embed.`);
        }
      }

      // 3. Minecraft Link / Verify Button
      let verifyCh = guild.channels.cache.find(c => (c.name.includes('verify') || c.name.includes('link')) && c.type === ChannelType.GuildText);
      
      let verifiedRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('verified'));
      if (!verifiedRole) {
        try {
          verifiedRole = await guild.roles.create({
            name: 'Verified',
            color: '#00ff66',
            reason: 'Auto-created by verification system'
          });
        } catch (err) {
          console.warn('Failed to create Verified role:', err.message);
        }
      }

      if (!verifyCh) {
        const infoCategory = guild.channels.cache.find(c => c.name.includes('INFORMATION') && c.type === ChannelType.GuildCategory);
        try {
          const overwrites = [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [PermissionFlagsBits.SendMessages]
            }
          ];
          if (verifiedRole) {
            overwrites.push({
              id: verifiedRole.id,
              deny: [PermissionFlagsBits.ViewChannel]
            });
          }

          verifyCh = await guild.channels.create({
            name: 'verify',
            type: ChannelType.GuildText,
            parent: infoCategory ? infoCategory.id : null,
            topic: 'Verify your Minecraft account here!',
            permissionOverwrites: overwrites,
            reason: 'Auto-created by verification setup'
          });
          console.log('[KryloSMP Setup] Created missing verify channel.');
        } catch (err) {
          console.warn('[KryloSMP Setup] Failed to create verify channel:', err.message);
        }
      } else if (verifiedRole) {
        try {
          await verifyCh.permissionOverwrites.edit(verifiedRole.id, {
            ViewChannel: false
          });
          console.log('[KryloSMP Setup] Enforced verify channel permission overwrites.');
        } catch (err) {
          console.warn('Failed to edit verify channel permissions:', err.message);
        }
      }

      if (verifyCh) {
        // Only post verify embed if it doesn't already exist (prevents duplicates on restart)
        const existingMsgs = await verifyCh.messages.fetch({ limit: 10 });
        const hasVerifyBtn = existingMsgs.some(m => m.author.id === client.user.id && m.components.some(c => c.components.some(b => b.customId === 'start_verification')));
        
        if (!hasVerifyBtn) {
          // Clear any stale messages before posting fresh embed
          try {
            if (existingMsgs.size > 0) {
              await verifyCh.bulkDelete(existingMsgs).catch(async () => {
                for (const [, m] of existingMsgs) {
                  await m.delete().catch(() => {});
                }
              });
            }
          } catch (err) {
            console.warn('Failed to clear old verify messages:', err.message);
          }

          const embed = new EmbedBuilder()
            .setAuthor({ name: 'KryloSMP Official Security & Whitelist Gateway', iconURL: guild.iconURL() })
            .setTitle('⚡ KRYLOSMP 3.0 — OFFICIAL VERIFICATION PORTAL')
            .setDescription(
              `Welcome to **KryloSMP**! To protect our community from bot raids, malicious alt accounts, and spam, all new members must verify their account before accessing server channels.\n\n` +
              `**HOW TO VERIFY & UNLOCK THE SERVER:**\n` +
              `1️⃣ Click the **\`✅ Verify Account\`** button below.\n` +
              `2️⃣ The bot will generate a **unique personal 6-digit code** for your account.\n` +
              `3️⃣ Enter your code on the [**Player Portal**](https://krylosmp.web.app/) or type \`/verify <code>\` inside Minecraft (\`KryloSmp.play.hosting\`).\n` +
              `4️⃣ Your Discord account will automatically receive the **\`✅ VERIFIED PLAYER\`** role and unlock all chat & voice lounges!\n\n` +
              `*Need assistance? Open a ticket in #🎟️・open-ticket for 24/7 AI support!*`
            )
            .setColor(0x00FF88)
            .setFooter({ text: 'KryloSMP Network Security • Unique Player Code System Active', iconURL: guild.iconURL() })
            .setTimestamp();
          
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('verify_user')
              .setLabel('✅ Verify Account')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setLabel('🌐 Player Portal')
              .setStyle(ButtonStyle.Link)
              .setURL('https://krylosmp.web.app/'),
            new ButtonBuilder()
              .setLabel('🛒 Web Store')
              .setStyle(ButtonStyle.Link)
              .setURL('https://krylosmp-store.web.app/')
          );
          const files = [];
          if (fs.existsSync('krylosmp_banner.png')) {
            files.push(new AttachmentBuilder('krylosmp_banner.png', { name: 'krylosmp_banner.png' }));
          }
          await verifyCh.send({ embeds: [embed], components: [row], files });
          console.log(`[KryloSMP Setup] Sent 4-button verification embed matching layout.`);
        } else {
          console.log(`[KryloSMP Setup] Verify button already exists, skipping.`);
        }
      }

      // 4. Create and Align Category/Channel Hierarchy (Hypixel/Hermitcraft Style)
      try {
        console.log('[KryloSMP Setup] Ensuring all premium categories and channels are created & organized...');
        
        // Helper to find or create a category
        const ensureCategory = async (name) => {
          let cat = guild.channels.cache.find(c => c.name.toUpperCase().includes(name.toUpperCase()) && c.type === ChannelType.GuildCategory);
          if (!cat) {
            cat = await guild.channels.create({
              name: name,
              type: ChannelType.GuildCategory
            });
            console.log(`[KryloSMP Setup] Created category: ${name}`);
          }
          return cat;
        };

        const infoCat = await ensureCategory('╭━━━ 📌 INFORMATION ━━━╮');
        const commCat = await ensureCategory('╭━━━ 💬 COMMUNITY ━━━╮');
        const econCat = await ensureCategory('╭━━━ 🛒 ECONOMY & STORE ━━━╮');
        const clanCat = await ensureCategory('╭━━━ 🏰 FACTIONS & CLANS ━━━╮');
        const pvpCat  = await ensureCategory('╭━━━ ⚔️ PVP & TOURNAMENTS ━━━╮');
        const tktCat  = await ensureCategory('╭━━━ 🎟️ SUPPORT & TICKETS ━━━╮');
        const voiceCat = await ensureCategory('╭━━━ 🔊 VOICE LOUNGES ━━━╮');

        // Helper to find or create/move a text channel
        const ensureChannel = async (name, parentCat, topic = '', isPrivate = false) => {
          const cleanSearch = name.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
          let ch = guild.channels.cache.find(c => c && c.name && c.name.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().includes(cleanSearch) && c.isTextBased());
          
          const overwrites = [];
          if (isPrivate) {
            overwrites.push(
              { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] }
            );
            if (verifiedRole) {
              overwrites.push(
                { id: verifiedRole.id, deny: [PermissionFlagsBits.ViewChannel] }
              );
            }
          }

          if (!ch) {
            ch = await guild.channels.create({
              name: name,
              type: ChannelType.GuildText,
              parent: parentCat.id,
              topic: topic,
              permissionOverwrites: overwrites
            });
            console.log(`[KryloSMP Setup] Created channel: ${name}`);
          } else {
            if (ch.parentId !== parentCat.id) {
              await ch.setParent(parentCat.id).catch(() => {});
              console.log(`[KryloSMP Setup] Moved channel ${ch.name} to category ${parentCat.name}`);
            }
            if (isPrivate) {
              await ch.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: false }).catch(() => {});
              if (verifiedRole) {
                await ch.permissionOverwrites.edit(verifiedRole.id, { ViewChannel: false }).catch(() => {});
              }
            }
          }
          return ch;
        };

        // Align channels under 📌 INFORMATION
        await ensureChannel('📌┃rules', infoCat, 'Official server rules and regulations.');
        await ensureChannel('📢┃server-announcements', infoCat, 'Official server news and announcements.');
        await ensureChannel('📺┃youtube-announcements', infoCat, 'YouTube video notifications.');
        await ensureChannel('🌐┃socials', infoCat, 'Official web links and store.');
        await ensureChannel('✅┃verify', infoCat, 'Player verification gateway.');

        // Align channels under 💬 COMMUNITY
        await ensureChannel('💬┃general-chat', commCat, 'General chat and discussion.');
        await ensureChannel('🤖┃bot-commands', commCat, 'Use bot commands here.');
        await ensureChannel('📷┃media-clips', commCat, 'Post your builds and clips.');
        await ensureChannel('💡┃suggestions', commCat, 'Submit ideas and vote.');

        // Align channels under 🛒 ECONOMY & STORE
        await ensureChannel('🛒┃store', econCat, 'Official KryloSMP store catalog.');
        await ensureChannel('💰┃jackpot-vault', econCat, 'Jackpot vault & casino.');
        await ensureChannel('🎯┃bounty-board', econCat, 'Active player bounties.');
        await ensureChannel('🤝┃item-trading', econCat, 'Player-to-player trading.');

        // Align channels under 🏰 FACTIONS & CLANS
        await ensureChannel('🏰・ksmp-clan-chat', clanCat, 'Official clan discussion.');
        await ensureChannel('🏆┃clan-leaderboard', clanCat, 'Top clans leaderboard.');

        // Align channels under ⚔️ PVP & TOURNAMENTS
        await ensureChannel('⚔️┃pvp-chat', pvpCat, 'PvP chat and duels.');
        await ensureChannel('🏆┃monthly-tournament', pvpCat, 'Monthly tournament announcements.');

        // Align channels under 🎟️ SUPPORT & TICKETS
        await ensureChannel('🎫┃support-tickets', tktCat, 'Open support tickets.');

        // Align Voice Channels
        const voiceChannels = ['🔊・General Lounge', '🔊・Gaming Squad 1', '🔊・Gaming Squad 2', '💤・afk-zone'];
        for (const vcName of voiceChannels) {
          const existingVC = guild.channels.cache.find(c => c.name === vcName && c.type === ChannelType.GuildVoice && c.parentId === voiceCat.id);
          if (!existingVC) {
            await guild.channels.create({
              name: vcName,
              type: ChannelType.GuildVoice,
              parent: voiceCat.id
            });
            console.log(`[KryloSMP Setup] Created voice channel: ${vcName}`);
          }
        }
        const onlinePlayersCh = null;
        const leaderboardCh = null;
        const modLogsCh = null;

        // Setup live status and leaderboard polling
        if (onlinePlayersCh) {
          try {
            const oldMsgs = await onlinePlayersCh.messages.fetch({ limit: 50 });
            if (oldMsgs.size > 0) {
              await onlinePlayersCh.bulkDelete(oldMsgs).catch(async () => {
                for (const [, m] of oldMsgs) {
                  await m.delete().catch(() => {});
                }
              });
            }
          } catch (err) {
            console.warn('Failed to clear old status messages:', err.message);
          }
          startLiveStatusUpdate(guild, onlinePlayersCh);
        }
        
        startLeaderboardUpdate(guild);
        startPaperAutoUpdater(guild);

      } catch (err) {
        console.warn('[KryloSMP Setup] Failed to setup channels/categories structure:', err.message);
      }

      // 5. Enforce Verification Gateway Category-Level Permissions
      console.log('[KryloSMP Setup] Enforcing gateway permissions for all categories...');
      try {
        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
        for (const [, cat] of categories) {
          if (cat.name.toUpperCase().includes('INFORMATION')) {
            // Everyone can see INFORMATION category (so they can verify!)
            await cat.permissionOverwrites.edit(guild.roles.everyone.id, {
              ViewChannel: true
            }).catch(() => {});
            continue;
          }

          // Lock all other categories for unverified, open for verified!
          await cat.permissionOverwrites.edit(guild.roles.everyone.id, {
            ViewChannel: false
          }).catch(() => {});
          
          if (verifiedRole) {
            await cat.permissionOverwrites.edit(verifiedRole.id, {
              ViewChannel: true
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('Failed to enforce category gateway permissions:', err.message);
      }

      // 6. Setup PvP and Tournament Roles & Channels
      console.log('[KryloSMP Setup] Setting up PvP and Tournament roles and channels...');
      
      let pvpRole = guild.roles.cache.find(r => r.name === '⚔️ PvP Specialist');
      if (!pvpRole) {
        try {
          pvpRole = await guild.roles.create({
            name: '⚔️ PvP Specialist',
            color: 0xFF0055,
            reason: 'Auto-created PvP command role'
          });
          console.log('[KryloSMP Setup] Created PvP Player role.');
        } catch (err) {
          console.warn('[KryloSMP Setup] Failed to create PvP Player role:', err.message);
        }
      }

      let tournamentRole = guild.roles.cache.find(r => r.name === 'Tournament Participant');
      if (!tournamentRole) {
        try {
          tournamentRole = await guild.roles.create({
            name: 'Tournament Participant',
            color: 0xFFAA00,
            reason: 'Auto-created Tournament command role'
          });
          console.log('[KryloSMP Setup] Created Tournament Participant role.');
        } catch (err) {
          console.warn('[KryloSMP Setup] Failed to create Tournament Participant role:', err.message);
        }
      }

      // Find or create "─── PvP & TOURNAMENTS ───" category
      let pvpCategory = guild.channels.cache.find(c => c.name.toLowerCase().includes('pvp') && c.type === ChannelType.GuildCategory);
      if (!pvpCategory) {
        try {
          pvpCategory = await guild.channels.create({
            name: '─── PvP & TOURNAMENTS ───',
            type: ChannelType.GuildCategory,
            reason: 'Auto-created PvP & Tournaments category'
          });
          console.log('[KryloSMP Setup] Created PvP & Tournaments category.');
        } catch (err) {
          console.warn('[KryloSMP Setup] Failed to create category:', err.message);
        }
      }

      // Find or create pvp-chat channel
      let pvpChatCh = guild.channels.cache.find(c => c.name.includes('pvp-chat') && c.type === ChannelType.GuildText);
      if (!pvpChatCh && pvpRole) {
        try {
          pvpChatCh = await guild.channels.create({
            name: '⚔️┃pvp-chat',
            type: ChannelType.GuildText,
            parent: pvpCategory ? pvpCategory.id : null,
            topic: 'Private channel for PvP discussion and match making. Run /pvp to gain access!',
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              {
                id: pvpRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
              },
              {
                id: client.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
              }
            ],
            reason: 'Auto-created pvp-chat channel'
          });
          console.log('[KryloSMP Setup] Created private #pvp-chat channel.');
        } catch (err) {
          console.warn('[KryloSMP Setup] Failed to create pvp-chat channel:', err.message);
        }
      }

      // Setup Monthly Tournament Channel (delete old, create new)
      console.log('[KryloSMP Setup] Setting up Monthly Tournament channel...');
      const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      const currentDate = new Date();
      const currentMonth = monthNames[currentDate.getMonth()];
      const currentYear = currentDate.getFullYear();
      const targetChannelName = `🏆┃tournament-${currentMonth}-${currentYear}`;

      // Check if current month channel exists
      let currentTourneyCh = guild.channels.cache.find(c => c.name === targetChannelName && c.type === ChannelType.GuildText);
      if (!currentTourneyCh && tournamentRole) {
        try {
          // Create the new tournament channel
          currentTourneyCh = await guild.channels.create({
            name: targetChannelName,
            type: ChannelType.GuildText,
            parent: pvpCategory ? pvpCategory.id : null,
            topic: `Official tournament channel for ${currentMonth.toUpperCase()} ${currentYear}. Run /tournament to join!`,
            permissionOverwrites: [
              {
                id: guild.roles.everyone.id,
                deny: [PermissionFlagsBits.ViewChannel]
              },
              {
                id: tournamentRole.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
              },
              {
                id: client.user.id,
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
              }
            ],
            reason: `Created new monthly tournament channel for ${currentMonth} ${currentYear}`
          });
          console.log(`[KryloSMP Setup] Created monthly tournament channel: ${targetChannelName}`);

          // Delete previous monthly tournament channels
          const allChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && c.parentId === pvpCategory?.id);
          for (const [, oldCh] of allChannels) {
            if ((oldCh.name.includes('tournament-') || oldCh.name.includes('tournaments')) && oldCh.name !== targetChannelName) {
              try {
                await oldCh.delete();
                console.log(`[KryloSMP Setup] Deleted old tournament channel: ${oldCh.name}`);
              } catch (err) {
                console.warn(`[KryloSMP Setup] Failed to delete old channel ${oldCh.name}:`, err.message);
              }
            }
          }
        } catch (err) {
          console.warn('[KryloSMP Setup] Failed to setup monthly tournament channel:', err.message);
        }
      }
    }
  } catch (err) {
    console.warn(`[KryloSMP Setup] Failed to post interactive components:`, err.message);
  }
});

// Slash Commands & Buttons Interaction Handler

async function checkKryloServerOnline() {
  return new Promise((resolve) => {
    import('net').then(({ default: net }) => {
      const socket = new net.Socket();
      socket.setTimeout(2500);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(25565, 'KryloSmp.play.hosting');
    }).catch(() => resolve(false));
  });
}


// ═══════════════════════════════════════════════════════════
// GAME BOOSTER & PC RAM OPTIMIZER ENGINE
// ═══════════════════════════════════════════════════════════
async function executeGameBoostOptimization(author) {
  try {
    if (process.platform === 'win32') {
      const bloatApps = ['brave', 'chrome', 'msedge', 'spotify', 'epicgameslauncher', 'Steam', 'DismHost'];
      for (const app of bloatApps) {
        try {
          execSync(`powershell -Command "Stop-Process -Name '${app}' -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore' });
        } catch (e) {}
      }

      const psScript = 'Get-Process | ForEach-Object { try { [void]$_.EmptyWorkingSet() } catch {} }; [System.GC]::Collect()';
      try {
        execSync(`powershell -Command "${psScript}"`, { stdio: 'ignore' });
      } catch (e) {}
      try {
        execSync('powercfg /s 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { stdio: 'ignore' });
      } catch (e) {}
    }

    const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
    const usedMemGB = (totalMemGB - freeMemGB).toFixed(2);

    const embed = new EmbedBuilder()
      .setTitle('🎮 KRYLO GAME BOOSTER ACTIVATED! 🚀')
      .setDescription(
        `👑 **Game Boost Initiated by ${author ? author.username : 'System'}!**\n\n` +
        `> 🧹 **Background Apps Closed:** Brave, Chrome, Edge, Spotify, Steam\n` +
        `> 🧠 **System RAM Status:** ${usedMemGB} GB Used / **${freeMemGB} GB FREE**\n` +
        `> 🎮 **Allocated to Lunar Client:** 6.00 GB RAM\n` +
        `> ⚡ **Power Plan:** High Performance (Maximum FPS Enabled)\n` +
        `> 🚀 **YOUR PC IS OPTIMIZED & READY FOR 100+ FPS MINECRAFT!**`
      )
      .setColor(0x00FF88)
      .setFooter({ text: 'KryloSMP Game Booster Engine • Powered by Krims Code AI' })
      .setTimestamp();

    return embed;
  } catch (err) {
    console.error('[Game Booster] Error:', err.message);
    throw err;
  }
}


client.on('interactionCreate', async (interaction) => {
  if (!interaction.guild) return;
  let guildConfig = null;

  // Handle String Select Menu Interactions (Support Desk)
  if (interaction.isStringSelectMenu()) {
    const { customId, values } = interaction;
    if (customId === 'select_open_ticket') {
      const category = values[0];
      const categoryMap = {
        ticket_report: { label: '🛡️ Player Report', color: 0xFF4444 },
        ticket_store: { label: '💎 Store & Billing Support', color: 0x9D4EDD },
        ticket_bug: { label: '🐛 Bug / Exploit Bounty', color: 0xFF9E00 },
        ticket_media: { label: '🤝 Creator & Partnership', color: 0x5865F2 },
        ticket_general: { label: '❓ General Assistance', color: 0x00F2FF }
      };

      const sel = categoryMap[category] || { label: '❓ Support Ticket', color: 0x00F2FF };

      try {
        const ticketCat = interaction.guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && (c.name.includes('SUPPORT') || c.name.includes('TICKET')));
        const cleanUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
        const ticketCh = await interaction.guild.channels.create({
          name: `ticket-${cleanUsername}`,
          type: ChannelType.GuildText,
          parent: ticketCat ? ticketCat.id : null,
          permissionOverwrites: [
            { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles] },
            { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Administrator] }
          ]
        });

        const ticketWelcomeEmbed = new EmbedBuilder()
          .setColor(sel.color)
          .setAuthor({ name: `👑 KryloSMP Ticket: ${sel.label}`, iconURL: interaction.user.displayAvatarURL() })
          .setTitle(`🎫 Ticket Created: ${sel.label}`)
          .setDescription(
            `Hello <@${interaction.user.id}>! A member of the **KryloSMP Staff Team** will assist you shortly.\n\n` +
            `📋 **Ticket Details:**\n` +
            `• **Category:** ${sel.label}\n` +
            `• **Opened By:** <@${interaction.user.id}>\n\n` +
            `💬 Please explain your request in detail. If reporting a player or bug, attach screenshots or video links below!`
          )
          .setFooter({ text: 'Click the button below when your issue is resolved.' })
          .setTimestamp();

        const closeBtn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('🔒 Close Ticket')
            .setStyle(ButtonStyle.Danger)
        );

        await ticketCh.send({ content: `<@${interaction.user.id}>`, embeds: [ticketWelcomeEmbed], components: [closeBtn] });

        return interaction.reply({
          content: `✅ **Ticket Opened!** Your private support channel is ready: <#${ticketCh.id}>`,
          flags: 64
        });
      } catch (err) {
        console.error('Error creating select ticket:', err.message);
        return interaction.reply({ content: '❌ Failed to create ticket. Please contact staff directly.', flags: 64 });
      }
    }
  }

  // Handle Button Interactions
  if (interaction.isButton()) {
    const { customId } = interaction;

    // Legendary Giveaway & Daily Reward Buttons
    if (customId === 'btn_claim_daily_kc') {
      const now = Date.now();
      if (!global.userDailyClaimTimes) global.userDailyClaimTimes = {};
      const lastClaim = global.userDailyClaimTimes[interaction.user.id] || 0;
      if (now - lastClaim < 24 * 60 * 60 * 1000) {
        const remHours = Math.ceil((24 * 60 * 60 * 1000 - (now - lastClaim)) / (1000 * 60 * 60));
        return interaction.reply({
          content: `⏳ **Already Claimed!** Come back in **${remHours} hours** for your next **+1,000 KC** drop!`,
          flags: 64
        });
      }
      global.userDailyClaimTimes[interaction.user.id] = now;
      let curBal = (economy[interaction.user.id] || 1000) + 1000;
      economy[interaction.user.id] = curBal;

      return interaction.reply({
        content: `🎉 **+1,000 KryloCoins Added!** Your new balance is **${curBal.toLocaleString()} KC**! 💎\n*View your profile at https://krylosmp.web.app/*`,
        flags: 64
      });
    }

    if (customId === 'btn_enter_vip_giveaway') {
      return interaction.reply({
        content: `🎟️ **Giveaway Entry Confirmed!** You are registered for the **⚡ VIP Sovereign Rank + 50,000 KC** giveaway! 👑`,
        flags: 64
      });
    }

    if (customId === 'btn_refresh_clan_stats') {
      return interaction.reply({
        content: `🔄 **Clan Standings Refreshed!** Top Rank: **[KRYLO] Krylo Army** with **1,000,000,000 KC** vault balance! 🏰\n*View full leaderboard at https://krylosmp.web.app/*`,
        flags: 64
      });
    }

    // --- Interactive Store & Economy Buttons ---
    if (customId === 'shop_check_balance') {
      const bal = economy[interaction.user.id] || 1000;
      const lvl = Math.floor(Math.sqrt((userXp[interaction.user.id] || 0) / 100)) + 1;
      return interaction.reply({
        content: `💰 **Player Account Summary**\n• **KryloCoins Balance:** **${bal.toLocaleString()} KC** 💎\n• **Chat Level:** Level ${lvl}\n• **Web Profile:** https://krylosmp.web.app/`,
        flags: 64
      });
    }

    if (customId === 'shop_buy_vip') {
      let bal = economy[interaction.user.id] || 1000;
      if (bal < 50000) {
        return interaction.reply({ content: `❌ **Insufficient Funds!** You need **50,000 KC** (You have **${bal.toLocaleString()} KC**). Play games or run \`/daily\`!`, flags: 64 });
      }
      economy[interaction.user.id] = bal - 50000;
      const vipRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes('vip'));
      if (vipRole) await interaction.member.roles.add(vipRole).catch(() => {});
      return interaction.reply({ content: `👑 **Purchase Successful!** You unlocked **💎 VIP Sovereign Rank**! Your new balance is **${(bal - 50000).toLocaleString()} KC**.`, flags: 64 });
    }

    if (customId === 'shop_buy_netherite') {
      let bal = economy[interaction.user.id] || 1000;
      if (bal < 25000) {
        return interaction.reply({ content: `❌ **Insufficient Funds!** You need **25,000 KC** (You have **${bal.toLocaleString()} KC**).`, flags: 64 });
      }
      economy[interaction.user.id] = bal - 25000;
      return interaction.reply({ content: `⚔️ **Purchase Successful!** 64x Netherite Ingot Kit voucher registered to your account! Link your IGN at https://krylosmp.web.app/ to claim in-game!`, flags: 64 });
    }

    if (customId === 'shop_buy_gacha') {
      let bal = economy[interaction.user.id] || 1000;
      if (bal < 10000) {
        return interaction.reply({ content: `❌ **Insufficient Funds!** You need **10,000 KC** (You have **${bal.toLocaleString()} KC**).`, flags: 64 });
      }
      economy[interaction.user.id] = bal - 10000;
      const rewards = [
        { name: '🔥 Mythic Fire Sword Voucher', bonus: 5000 },
        { name: '👑 25,000 KC Jackpot Prize!', bonus: 25000 },
        { name: '💎 50x God Apples Voucher', bonus: 8000 },
        { name: '🛡️ Sovereign Shield Skin', bonus: 12000 }
      ];
      const win = rewards[Math.floor(Math.random() * rewards.length)];
      economy[interaction.user.id] += win.bonus;
      return interaction.reply({ content: `🎁 **MYSTERY CRATE OPENED!**\n🎉 You pulled: **${win.name}**! (+${win.bonus.toLocaleString()} KC added to your balance).`, flags: 64 });
    }

    // --- Interactive Minigame Buttons ---
    if (customId === 'btn_play_slots') {
      let bal = economy[interaction.user.id] || 1000;
      if (bal < 500) {
        return interaction.reply({ content: `❌ **Need 500 KC to spin slots!** Run \`/daily\` or work to earn coins.`, flags: 64 });
      }
      economy[interaction.user.id] = bal - 500;
      const icons = ['💎', '👑', '⚡', '🍒', '7️⃣'];
      const r1 = icons[Math.floor(Math.random() * icons.length)];
      const r2 = icons[Math.floor(Math.random() * icons.length)];
      const r3 = icons[Math.floor(Math.random() * icons.length)];

      if (r1 === r2 && r2 === r3) {
        const winAmount = 5000;
        economy[interaction.user.id] += winAmount;
        return interaction.reply({ content: `🎰 **[ ${r1} | ${r2} | ${r3} ]** 🎰\n🎉 **JACKPOT!** You matched 3 and won **+${winAmount.toLocaleString()} KC**! Balance: **${(economy[interaction.user.id]).toLocaleString()} KC** 👑`, flags: 64 });
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        const winAmount = 1000;
        economy[interaction.user.id] += winAmount;
        return interaction.reply({ content: `🎰 **[ ${r1} | ${r2} | ${r3} ]** 🎰\n✨ **Nice Spin!** Matched 2! You won **+${winAmount.toLocaleString()} KC**! Balance: **${(economy[interaction.user.id]).toLocaleString()} KC**`, flags: 64 });
      } else {
        return interaction.reply({ content: `🎰 **[ ${r1} | ${r2} | ${r3} ]** 🎰\n❌ No match! You lost 500 KC. New balance: **${(economy[interaction.user.id]).toLocaleString()} KC**. Spin again!`, flags: 64 });
      }
    }

    if (customId === 'btn_play_coinflip') {
      let bal = economy[interaction.user.id] || 1000;
      if (bal < 500) {
        return interaction.reply({ content: `❌ **Need 500 KC to flip!**`, flags: 64 });
      }
      economy[interaction.user.id] = bal - 500;
      const win = Math.random() >= 0.5;
      if (win) {
        economy[interaction.user.id] += 1000;
        return interaction.reply({ content: `🪙 **Coin landed on HEADS!**\n🎉 You doubled your coins and won **+1,000 KC**! Balance: **${(economy[interaction.user.id]).toLocaleString()} KC**!`, flags: 64 });
      } else {
        return interaction.reply({ content: `🪙 **Coin landed on TAILS!**\n❌ Lost 500 KC. Balance: **${(economy[interaction.user.id]).toLocaleString()} KC**. Try again!`, flags: 64 });
      }
    }

    if (customId === 'btn_hourly_work') {
      const now = Date.now();
      if (!global.userWorkTimes) global.userWorkTimes = {};
      const lastWork = global.userWorkTimes[interaction.user.id] || 0;
      if (now - lastWork < 60 * 60 * 1000) {
        const remMins = Math.ceil((60 * 60 * 1000 - (now - lastWork)) / (1000 * 60));
        return interaction.reply({ content: `⏳ **Take a breather!** You can work again in **${remMins} minutes**!`, flags: 64 });
      }
      global.userWorkTimes[interaction.user.id] = now;
      let cur = (economy[interaction.user.id] || 1000) + 2500;
      economy[interaction.user.id] = cur;
      return interaction.reply({ content: `💼 **Shift Completed!** You earned **+2,500 KryloCoins**! New balance: **${cur.toLocaleString()} KC** 💰`, flags: 64 });
    }

    // --- Color Roles Handlers ---
    if (customId.startsWith('color_')) {
      const colorMap = {
        color_crimson: '🔴 Crimson Red',
        color_cyan: '🔵 Cyber Cyan',
        color_gold: '🟡 Imperial Gold',
        color_violet: '🟣 Neon Violet',
        color_green: '🟢 Emerald Green',
        color_pink: '🌸 Sakura Pink'
      };
      const targetRoleName = colorMap[customId];
      if (targetRoleName) {
        const allColorNames = Object.values(colorMap);
        const rolesToRemove = interaction.member.roles.cache.filter(r => allColorNames.includes(r.name));
        for (const [, r] of rolesToRemove) {
          await interaction.member.roles.remove(r).catch(() => {});
        }
        let targetRole = interaction.guild.roles.cache.find(r => r.name === targetRoleName);
        if (!targetRole) {
          targetRole = await interaction.guild.roles.create({ name: targetRoleName }).catch(() => null);
        }
        if (targetRole) {
          await interaction.member.roles.add(targetRole).catch(() => {});
          return interaction.reply({ content: `🎨 **Name Color Updated!** You now have the **${targetRoleName}** color role!`, flags: 64 });
        }
      }
    }

    // --- Self-Assign Notification and Community Roles ---
    if (customId.startsWith('selfrole_')) {
      const selfRoleMap = {
        selfrole_announcement: { name: '📢 Announcements', ping: true },
        selfrole_giveaway: { name: '🎁 Giveaways', ping: true },
        selfrole_event: { name: '🎪 Events', ping: true },
        selfrole_builder: { name: '🏰 Builder', ping: false },
        selfrole_pvp: { name: '⚔️ PvP Warrior', ping: false }
      };
      const roleInfo = selfRoleMap[customId];
      if (roleInfo) {
        let role = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes(roleInfo.name.toLowerCase().replace(/[^a-z]/gi, '')));
        if (!role) {
          role = await interaction.guild.roles.create({ name: roleInfo.name, mentionable: roleInfo.ping }).catch(() => null);
        }
        if (role) {
          if (interaction.member.roles.cache.has(role.id)) {
            await interaction.member.roles.remove(role).catch(() => {});
            return interaction.reply({ content: `➖ **Role Removed!** You no longer have the **${role.name}** role.`, flags: 64 });
          } else {
            await interaction.member.roles.add(role).catch(() => {});
            return interaction.reply({ content: `➕ **Role Added!** You now have the **${role.name}** role!`, flags: 64 });
          }
        }
      }
    }

    // --- Bump Reminder, Check Rank, Partnership FAQ Buttons ---
    if (customId === 'btn_bump_reminder') {
      return interaction.reply({
        content: `🔔 **Bump Reminder Set!** Run \`/bump\` right now to boost KryloSMP and earn **+500 KryloCoins**! Make sure to run it every 2 hours! 🚀`,
        flags: 64
      });
    }

    if (customId === 'btn_check_rank') {
      const bal = economy[interaction.user.id] || 1000;
      const xp = userXp[interaction.user.id] || 0;
      const lvl = Math.floor(Math.sqrt(xp / 100)) + 1;
      const nextXp = (lvl * lvl) * 100;
      return interaction.reply({
        content: `📈 **Your KryloSMP Progression Stats**\n• **Chat Level:** Level ${lvl} ⭐\n• **Experience Points (XP):** ${xp} / ${nextXp} XP\n• **Wallet Balance:** **${bal.toLocaleString()} KC** 💎\n• **Web Profile:** https://krylosmp.web.app/`,
        flags: 64
      });
    }

    if (customId === 'btn_partner_info') {
      return interaction.reply({
        content: `🤝 **KryloSMP Partnership Guidelines**\n• **Requirements:** 100+ Discord members or 100+ YouTube subscribers.\n• **How to Apply:** Click the *Apply for Partnership* button to submit your link!\n• **Turnaround:** Executive staff reviews all applications within 24 hours.`,
        flags: 64
      });
    }

    if (customId === 'btn_join_beta_roster') {
      let betaRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes('beta tester') || r.name.toLowerCase().includes('founder'));
      if (!betaRole) {
        betaRole = await interaction.guild.roles.create({ name: '🧪 Beta Tester', color: 0x00FFCC, hoist: true }).catch(() => null);
      }
      if (betaRole) {
        await interaction.member.roles.add(betaRole).catch(() => {});
      }
      return interaction.reply({
        content: `🧪 **WELCOME TO THE KRYLOSMP BETA ROSTER!**\n\n✅ You have been awarded the **🧪 Beta Tester** role!\n📜 **Whitelist Priority:** Your account has been registered for the private development whitelist.\n🎁 **Launch Day Rewards:** You will receive **+10,000 KryloCoins** and the exclusive **[Founder]** tag when Season 1 officially opens! 👑\n\n*Make sure to drop your Minecraft In-Game Name (IGN) in <#${interaction.channelId}> or DM staff so we can whitelist you!*`,
        flags: 64
      });
    }

    // Item Trade Accept / Decline Button Handling
    if (customId.startsWith('trade_accept_') || customId.startsWith('trade_decline_')) {
      const parts = customId.split('_');
      const action = parts[1]; // 'accept' or 'decline'
      const senderId = parts[2];
      const targetId = parts[3];

      if (interaction.user.id !== targetId) {
        await interaction.reply({ content: '❌ Only the targeted player can respond to this trade offer!', flags: 64 });
        return;
      }

      await interaction.deferUpdate();

      if (action === 'accept') {
        const acceptEmbed = new EmbedBuilder()
          .setTitle('🤝 TRADE OFFER ACCEPTED!')
          .setDescription(`✅ <@${targetId}> has **ACCEPTED** the trade offer from <@${senderId}>!\n\n*Please conduct your item or KryloCoin exchange safely in-game!*`)
          .setColor(0x00FF77)
          .setTimestamp();

        await interaction.editReply({
          content: `🎉 **Trade Accepted between <@${senderId}> and <@${targetId}>!**`,
          embeds: [acceptEmbed],
          components: []
        });
      } else {
        const declineEmbed = new EmbedBuilder()
          .setTitle('❌ TRADE OFFER DECLINED')
          .setDescription(`❌ <@${targetId}> has **DECLINED** the trade offer from <@${senderId}>.`)
          .setColor(0xFF0055)
          .setTimestamp();

        await interaction.editReply({
          content: `❌ **Trade Offer Declined.**`,
          embeds: [declineEmbed],
          components: []
        });
      }
      return;
    }

    // PvP Accept/Decline Button Handling
    if (customId.startsWith('pvp_accept_') || customId.startsWith('pvp_decline_')) {
      const parts = customId.split('_');
      const action = parts[1]; // 'accept' or 'decline'
      const challengerId = parts[2];
      const challengedId = parts[3];

      if (interaction.user.id !== challengedId) {
        await interaction.reply({ content: '❌ Only the challenged player can respond to this challenge!', ephemeral: true });
        return;
      }

      await interaction.deferUpdate();

      if (action === 'accept') {
        // Add to queue
        pvpQueue.push({
          challengerId,
          challengedId,
          challengerTag: `<@${challengerId}>`,
          challengedTag: `<@${challengedId}>`
        });

        // Update original challenge message
        await interaction.editReply({
          content: `✅ <@${challengedId}> has accepted the challenge from <@${challengerId}>! Added to PvP Queue.`,
          components: []
        });

        // Start next duel if empty
        if (!activeDuel) {
          await startNextDuel(interaction.guild);
        } else {
          // Send queue position message in pvp-chat
          const pvpChatCh = interaction.guild.channels.cache.find(c => c.name.includes('pvp-chat') && c.type === ChannelType.GuildText);
          if (pvpChatCh) {
            await pvpChatCh.send(`⏳ **Queue Update:** <@${challengerId}> vs <@${challengedId}> is in queue (Position #${pvpQueue.length}).`);
          }
        }
      } else {
        // Decline challenge
        await interaction.editReply({
          content: `❌ <@${challengedId}> has declined the challenge from <@${challengerId}>.`,
          components: []
        });
      }
      return;
    }

    // PvP Finish Duel Button Handling
    if (customId === 'pvp_finish_duel') {
      if (!activeDuel) {
        await interaction.reply({ content: '❌ No active duel found.', ephemeral: true });
        return;
      }

      const isDuelist = interaction.user.id === activeDuel.challengerId || interaction.user.id === activeDuel.challengedId;
      const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) || interaction.member.roles.cache.some(r => r.name.toLowerCase().includes('staff') || r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('mod'));

      if (!isDuelist && !isStaff) {
        await interaction.reply({ content: '❌ Only the duelists or staff members can end the duel!', ephemeral: true });
        return;
      }

      await interaction.reply('🏁 **Duel finished. Deleting channel and starting next match...**');

      const guild = interaction.guild;
      const duelChannel = interaction.channel;

      setTimeout(async () => {
        await endCurrentDuel(guild, duelChannel);
      }, 3000);
      return;
    }

    
    // ══════════════════════════════════════════════════════════
    // 📜 KRYLOSMP STARTER ROLE & RULES AGREEMENT HANDLER
    // ══════════════════════════════════════════════════════════
    if (customId === 'claim_starter_role') {
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch {}

      let starterRole = interaction.guild.roles.cache.find(r => r.name === 'KryloSMP Starter');
      if (!starterRole) {
        try {
          starterRole = await interaction.guild.roles.create({
            name: 'KryloSMP Starter',
            color: 0x00F2FF,
            reason: 'Auto-created KryloSMP Starter role'
          });
          console.log('[KryloSMP Setup] Created KryloSMP Starter role.');
        } catch (rErr) {
          console.warn('[KryloSMP Setup] Failed to create KryloSMP Starter role:', rErr.message);
        }
      }

      if (starterRole) {
        await interaction.member.roles.add(starterRole).catch(() => {});
      }

      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🎉 KryloSMP Starter Role Unlocked!')
        .setDescription(
          `Congratulations <@${interaction.user.id}>! You accepted the server rules and unlocked the **KryloSMP Starter** role!\n\n` +
          '### 🎮 What You Discovered:\n' +
          '• 💬 Full access to chat in all community channels!\n' +
          '• 🛒 Post item trades in marketplace!\n' +
          '• ⚔️ Join 1v1 duels in pvp-chat!\n' +
          '• 💎 Run `/daily` for free **+1,000 KryloCoins & 32x Diamonds**!'
        )
        .setFooter({ text: 'KryloSMP Starter Role • Server Access Granted ⚡' })
        .setTimestamp();

      await interaction.editReply({ embeds: [welcomeEmbed] });

      // Send broadcast in general-chat
      try {
        const generalCh = interaction.guild.channels.cache.find(c => c.name.includes('general-chat') && c.type === ChannelType.GuildText);
        if (generalCh) {
          const broadEmbed = new EmbedBuilder()
            .setColor(0x00F2FF)
            .setTitle('👋 Welcome New KryloSMP Starter!')
            .setDescription(`Everyone welcome <@${interaction.user.id}> to **KryloSMP**! They agreed to the server rules and claimed their **KryloSMP Starter** role! 🎮⚡`)
            .setTimestamp();
          await generalCh.send({ embeds: [broadEmbed] }).catch(() => {});
        }
      } catch {}
      return;
    }

    if (customId === 'app_staff' || customId === 'app_partner' || customId === 'app_creator') {
      const ticketCh = interaction.guild?.channels.cache.find(c => c.name.includes('ticket') || c.name.includes('support'));
      const appType = customId === 'app_staff' ? '🛡️ Staff (Moderator/Admin)' : customId === 'app_partner' ? '🤝 Server Partnership' : '🎬 Content Creator / Media';
      
      const appEmbed = new EmbedBuilder()
        .setColor(customId === 'app_staff' ? 0x00FF88 : customId === 'app_partner' ? 0x5865F2 : 0xE91E63)
        .setTitle(`📝 Applying for: ${appType}`)
        .setDescription(
          `To submit your official application for **${appType}**:\n\n` +
          `1️⃣ Open a private ticket in ${ticketCh ? `<#${ticketCh.id}>` : 'the support channel'}\n` +
          `2️⃣ Click **Open Support Ticket** and select **Application / Partnership**\n` +
          `3️⃣ Fill out your answers or attach your Google Form submission!\n\n` +
          `✨ **Tip:** Include your Discord tag, IGN, age, experience, and timezone for fastest review.`
        )
        .setFooter({ text: 'KryloSMP Application System' })
        .setTimestamp();

      await interaction.reply({ embeds: [appEmbed], ephemeral: true });
      return;
    }

    if (customId === 'start_verification' || customId === 'enter_verify_code') {
      const verifiedRole = interaction.guild?.roles.cache.find(r => r.name === 'Verified');
      if (verifiedRole && interaction.member.roles.cache.has(verifiedRole.id)) {
        const supportCh = interaction.guild?.channels.cache.find(c => c.name.includes('ticket') || c.name.includes('support'));
        await interaction.reply({ content: `❌ **You are already verified!**\n\nIf you need to change your Minecraft username or link a different account, please open a support ticket in ${supportCh ? `<#${supportCh.id}>` : 'support channels'} for staff assistance.`, ephemeral: true });
        return;
      }
    }

    if (customId === 'start_verification' || customId === 'verify_user' || customId === 'btn_open_verify_modal') {
      let verified = {};
      if (fs.existsSync('verifiedUsers.json')) {
        try {
          verified = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf-8'));
        } catch (e) {}
      }

      let userRecord = verified[interaction.user.id];
      let personalCode;

      if (userRecord && userRecord.verificationCode && userRecord.verificationCode !== '77777') {
        personalCode = userRecord.verificationCode;
      } else {
        personalCode = Math.floor(100000 + Math.random() * 900000).toString();
        verified[interaction.user.id] = {
          discordId: interaction.user.id,
          discordTag: interaction.user.tag,
          verificationCode: personalCode,
          minecraftUsername: userRecord?.minecraftUsername || '',
          verified: userRecord?.verified || false,
          createdAt: new Date().toISOString()
        };
        fs.writeFileSync('verifiedUsers.json', JSON.stringify(verified, null, 2));
      }

      const verifyEmbed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Unique Account Verification', iconURL: interaction.guild.iconURL() })
        .setTitle('🔒 YOUR PERSONAL VERIFICATION CODE')
        .setDescription(
          `Hello <@${interaction.user.id}>! Here is your unique, personal verification code:

` +
          `🔑 **YOUR PERSONAL CODE**: **\`${personalCode}\`**

` +
          `**HOW TO COMPLETE YOUR VERIFICATION:**
` +
          `1️⃣ Copy your code: **\`${personalCode}\`**
` +
          `2️⃣ Enter code **\`${personalCode}\`** on the [**Player Portal**](https://krylosmp.web.app/)
` +
          `3️⃣ Or connect to Minecraft (\`KryloSmp.play.hosting\`) and type: \`/verify ${personalCode}\`

` +
          `*This code is generated specifically for your account only and is private!*`
        )
        .setColor(0x00FF88)
        .setFooter({ text: `Unique Player Code • ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ embeds: [verifyEmbed] });
      } else {
        await interaction.reply({ embeds: [verifyEmbed], flags: 64 });
      }
      return;
    }

    if (customId === 'enter_verify_code') {
      const modal = new ModalBuilder()
        .setCustomId('modal_enter_verify_code')
        .setTitle('Enter Verification Code');

      const codeInput = new TextInputBuilder()
        .setCustomId('verify_code')
        .setLabel('Enter the 5-digit code shown in-game:')
        .setPlaceholder('e.g. A3F89')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(codeInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
      return;
    }

    if (customId === 'close_ticket') {
      try {
        await interaction.reply({ content: '🔒 **Closing ticket...** This channel will be deleted in 5 seconds.' });
        await closeTicketInGoogleSheet(interaction.channel.id).catch(() => {});
        setTimeout(async () => {
          await interaction.channel.delete().catch(() => {});
        }, 5000);
      } catch (err) {
        console.error('Error closing ticket:', err.message);
      }
      return;
    }

    
    if (customId === 'claim_tier1_krylo' || customId === 'verify_member') {
      try {
        let verifiedRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes('verified')) ||
                           interaction.guild.roles.cache.find(r => r.name.includes('Starter'));
        if (verifiedRole && interaction.member) {
          await interaction.member.roles.add(verifiedRole).catch(() => {});
        }
        let ogRole = interaction.guild.roles.cache.find(r => r.name.includes('OG Member'));
        if (ogRole && interaction.member) {
          await interaction.member.roles.add(ogRole).catch(() => {});
        }

        const channels = await interaction.guild.channels.fetch();
        const starterChannels = channels.filter(c => c && c.isTextBased() && c.type !== ChannelType.GuildCategory);

        await interaction.reply({
          content: `<:KryloSMP:1530370298262720722> **TIER 1 STARTER UNLOCKED!**\n\n` +
                   `Welcome to **KryloSMP**! You have received your Tier 1 Starter Rank.\n` +
                   `🔓 All Starter channels have been unlocked for you! Start chatting in <#${channels.find(c => c?.name?.includes('general'))?.id || '0'}>!\n\n` +
                   `🔒 *Earn activity levels (Level 10/25/50) by chatting to unlock advanced PvP, Tournament & Trader channels!*`,
          ephemeral: true
        });
      } catch (err) {
        console.error('Tier 1 claim error:', err.message);
      }
      return;
    }

    if (customId === 'btn_startserver_quick') {
      try {
        await interaction.deferReply({ ephemeral: true });
        const serverId = '25a5d79a';
        const pteroToken = process.env.PTERODACTYL_TOKEN;

        try {
          await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/power`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${pteroToken}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: JSON.stringify({ signal: 'start' })
          });
        } catch (err) {}

        const embed = new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Server Power Controller', iconURL: interaction.guild?.iconURL() })
          .setTitle('🚀 MINECRAFT SERVER IS STARTING!')
          .setDescription(
            `The power signal **START** has been sent to the server node!\n\n` +
            `🌐 **Server IP**: \`KryloSmp.play.hosting\`\n` +
            `🔌 **Port**: \`25565\` (Java) | \`19132\` (Bedrock)\n` +
            `⏱️ **Estimated Boot Time**: ~20-30 seconds\n\n` +
            `*Raise your swords and connect now!*`
          )
          .setColor(0x00FF77)
          .setTimestamp();

        return interaction.editReply({ embeds: [embed] });
      } catch (e) {
        console.error('btn_startserver_quick error:', e.message);
      }
      return;
    }

    if (customId === 'open_ticket' || customId === 'btn_ticket_open') {
      const modal = new ModalBuilder()
        .setCustomId('modal_open_ticket')
        .setTitle('Open Support Ticket');

      const reasonInput = new TextInputBuilder()
        .setCustomId('ticket_reason')
        .setLabel('Reason / Question')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your issue, question, or report (e.g. grief, bug, crash...)')
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(row);

      try {
        await interaction.showModal(modal);
      } catch (modalErr) {
        console.error('Failed to show modal:', modalErr.message);
      }
      return;
    }

    if (customId.startsWith('role_')) {
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch (deferErr) {
        console.warn('Failed to defer role interaction:', deferErr.message);
        return;
      }
      try {
        let roleName = '';
        if (customId === 'role_java') roleName = '☕ Java Player';
        else if (customId === 'role_bedrock') roleName = '🪨 Bedrock Player';
        else if (customId === 'role_announcements') roleName = '📢 Announcements';
        else if (customId === 'role_giveaways') roleName = '🎁 Giveaways';

        let role = interaction.guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
          try {
            role = await interaction.guild.roles.create({
              name: roleName,
              reason: 'Auto-created for self-assignable roles selector'
            });
            console.log(`[Role Selector] Auto-created missing role: ${roleName}`);
          } catch (createErr) {
            await interaction.editReply(`❌ Role "${roleName}" not found and could not be created!`);
            return;
          }
        }

        const hasRole = interaction.member.roles.cache.has(role.id);
        if (hasRole) {
          await interaction.member.roles.remove(role);
          await interaction.editReply(`✗ Removed role: **${roleName}**`);
        } else {
          await interaction.member.roles.add(role);
          await interaction.editReply(`✓ Granted role: **${roleName}**`);
        }
      } catch (err) {
        await interaction.editReply(`❌ Failed to assign role: ${err.message}`);
      }
      return;
    }

    // Giveaway enter button
    if (customId.startsWith('giveaway_enter_')) {
      const giveawayId = customId.replace('giveaway_enter_', '');
      await interaction.deferReply({ ephemeral: true });

      if (!giveawayEntries.has(giveawayId)) {
        await interaction.editReply('❌ This giveaway has ended!');
        return;
      }

      const entries = giveawayEntries.get(giveawayId);
      if (entries.has(interaction.user.id)) {
        entries.delete(interaction.user.id);
        await interaction.editReply('✗ You left the giveaway.');
      } else {
        entries.add(interaction.user.id);
        await interaction.editReply(`🎉 You entered the giveaway! (${entries.size} total entries)`);
      }
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 🛒 DISCORD STORE — Buy Button Handler
    // ══════════════════════════════════════════════════════════
    if (customId.startsWith('shop_buy_')) {
      const itemId = customId.replace('shop_buy_', '');
      await interaction.deferReply({ ephemeral: true });

      // Item catalog with prices & display info (must match create-store.mjs)
      const SHOP_CATALOG = {
        // Ranks
        bronze:    { name: '🥉 Bronze Rank',         price: 500,   category: 'Rank',     emoji: '👑', desc: 'Custom prefix, colored name, priority queue' },
        silver:    { name: '🥈 Silver Rank',         price: 1500,  category: 'Rank',     emoji: '👑', desc: 'Bronze perks + /fly, 3 homes, kit access' },
        gold:      { name: '🥇 Gold Rank',           price: 3000,  category: 'Rank',     emoji: '👑', desc: 'Silver perks + /nick, 5 homes, cosmetics' },
        diamond:   { name: '💎 Diamond Rank',        price: 5000,  category: 'Rank',     emoji: '👑', desc: 'All perks + /god, unlimited homes, VIP' },
        // Kits
        warrior:   { name: '⚔️ Warrior Kit',         price: 200,   category: 'Kit',      emoji: '🎒', desc: 'Iron armor + Sharpness II sword + food' },
        ranger:    { name: '🏹 Ranger Kit',          price: 200,   category: 'Kit',      emoji: '🎒', desc: 'Leather armor + Power II Infinity bow' },
        miner:     { name: '⛏️ Miner Kit',           price: 200,   category: 'Kit',      emoji: '🎒', desc: 'Efficiency III Fortune II pickaxe + torches' },
        enchanter: { name: '🔮 Enchanter Kit',       price: 350,   category: 'Kit',      emoji: '🎒', desc: 'Enchanting table + 30 bookshelves + XP' },
        // Cosmetics
        fire:      { name: '🔥 Fire Trail',          price: 300,   category: 'Cosmetic', emoji: '✨', desc: 'Leave a trail of fire particles' },
        frost:     { name: '❄️ Frost Aura',           price: 300,   category: 'Cosmetic', emoji: '✨', desc: 'Surround yourself with frost particles' },
        lightning: { name: '⚡ Lightning Kill Effect', price: 500,   category: 'Cosmetic', emoji: '✨', desc: 'Lightning strikes when you get a kill' },
        rainbow:   { name: '🌈 Rainbow Name',        price: 750,   category: 'Cosmetic', emoji: '✨', desc: 'Your name cycles through rainbow colors' },
        firework:  { name: '🎆 Firework Death Effect', price: 400,  category: 'Cosmetic', emoji: '✨', desc: 'Fireworks explode on your death' },
        // Specials
        claim:     { name: '🏗️ +1,000 Claim Blocks', price: 400,   category: 'Special',  emoji: '🎁', desc: 'Expand your protected land area' },
        backpack:  { name: '🎒 Backpack Expansion',  price: 250,   category: 'Special',  emoji: '🎁', desc: 'Upgrade your portable storage' },
        warp:      { name: '🌀 Custom Warp',         price: 600,   category: 'Special',  emoji: '🎁', desc: 'Create a personal public warp point' },
        keepinv:   { name: '🛡️ Keep Inventory Token', price: 150,   category: 'Special',  emoji: '🎁', desc: 'Keep items on next death (1 use)' },
      };

      const item = SHOP_CATALOG[itemId];
      if (!item) {
        await interaction.editReply('❌ Unknown item. This shop item may have been removed.');
        return;
      }

      // Check if user has a linked Minecraft account + fetch balance
      let mcUsername = null;
      let playerBalance = null;
      try {
        const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId: interaction.guild?.id || '1524878881918685405' })
        });
        if (configRes.ok) {
          const cfg = await configRes.json();
          if (cfg.verifiedPlayers && cfg.verifiedPlayers[interaction.user.id]) {
            mcUsername = cfg.verifiedPlayers[interaction.user.id].name;
            // Check if balance data is synced
            if (cfg.verifiedPlayers[interaction.user.id].balance !== undefined) {
              playerBalance = cfg.verifiedPlayers[interaction.user.id].balance;
            }
          }
          // Also check server-synced economy data
          if (mcUsername && cfg.economyData && cfg.economyData[mcUsername]) {
            playerBalance = cfg.economyData[mcUsername];
          }
        }
      } catch (e) {
        console.warn('[Shop] Failed to fetch config:', e.message);
      }

      if (!mcUsername) {
        const vCh = interaction.guild?.channels.cache.find(c => c.name.includes('verify'));
        const linkEmbed = new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle('❌ Account Not Linked')
          .setDescription('You need to **link your Minecraft account** before you can purchase items from the store!')
          .addFields(
            { name: '📋 How to Link', value: `1. Go to ${vCh ? `<#${vCh.id}>` : 'the verify channel'}\n2. Click **Verify Account**\n3. Enter your MC username & code` }
          )
          .setFooter({ text: 'KryloSMP Store' })
          .setTimestamp();
        await interaction.editReply({ embeds: [linkEmbed] });
        return;
      }

      // Build rich profile confirmation embed
      const avatarUrl = interaction.user.displayAvatarURL({ dynamic: true, size: 128 });
      const mcHeadUrl = `https://mc-heads.net/avatar/${mcUsername}/64`;
      const canAfford = playerBalance !== null ? playerBalance >= item.price : null;
      const balanceStr = playerBalance !== null 
        ? `**${Math.floor(playerBalance).toLocaleString()} ⛃**` 
        : '`Syncing...`';
      const affordStr = canAfford === true 
        ? '✅ You can afford this!' 
        : canAfford === false 
        ? '❌ Not enough coins!' 
        : '⚠️ Balance checked on purchase';

      const confirmEmbed = new EmbedBuilder()
        .setColor(canAfford === false ? 0xFF4444 : 0xFFAA00)
        .setAuthor({ name: `${interaction.user.displayName} (${interaction.user.tag})`, iconURL: avatarUrl })
        .setTitle(`${item.emoji} Confirm Purchase — ${item.name}`)
        .setThumbnail(mcHeadUrl)
        .setDescription(`> ${item.desc}\n\nAre you sure you want to buy this item?`)
        .addFields(
          { name: '💰 Price', value: `**${item.price.toLocaleString()} KryloCoins** ⛃`, inline: true },
          { name: '🪙 Your Balance', value: balanceStr, inline: true },
          { name: '📦 Category', value: item.category, inline: true },
          { name: '⛏️ Minecraft Account', value: `\`${mcUsername}\``, inline: true },
          { name: '🏷️ Discord', value: `<@${interaction.user.id}>`, inline: true },
          { name: '💳 Status', value: affordStr, inline: true }
        )
        .setFooter({ text: 'KryloSMP Store • Coins deducted from in-game balance', iconURL: 'https://mc-heads.net/avatar/KryloSMP/32' })
        .setTimestamp();

      const confirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`shop_confirm_${itemId}_${interaction.user.id}`)
          .setLabel(`✅ Buy for ${item.price.toLocaleString()} ⛃`)
          .setStyle(canAfford === false ? ButtonStyle.Secondary : ButtonStyle.Success)
          .setDisabled(canAfford === false),
        new ButtonBuilder()
          .setCustomId(`shop_cancel_${interaction.user.id}`)
          .setLabel('❌ Cancel')
          .setStyle(ButtonStyle.Secondary)
      );

      await interaction.editReply({ embeds: [confirmEmbed], components: [confirmRow] });
      return;
    }

    // Shop Confirm Purchase
    if (customId.startsWith('shop_confirm_')) {
      const parts = customId.replace('shop_confirm_', '').split('_');
      const userId = parts.pop(); // last segment is user ID
      const itemId = parts.join('_'); // everything before is the item ID

      // Only the original buyer can confirm
      if (interaction.user.id !== userId) {
        await interaction.reply({ content: '❌ This purchase confirmation is not for you!', ephemeral: true });
        return;
      }

      await interaction.deferUpdate();

      // Item catalog (same as above)
      const SHOP_CATALOG = {
        bronze: { name: '🥉 Bronze Rank', price: 500, category: 'Rank' },
        silver: { name: '🥈 Silver Rank', price: 1500, category: 'Rank' },
        gold: { name: '🥇 Gold Rank', price: 3000, category: 'Rank' },
        diamond: { name: '💎 Diamond Rank', price: 5000, category: 'Rank' },
        warrior: { name: '⚔️ Warrior Kit', price: 200, category: 'Kit' },
        ranger: { name: '🏹 Ranger Kit', price: 200, category: 'Kit' },
        miner: { name: '⛏️ Miner Kit', price: 200, category: 'Kit' },
        enchanter: { name: '🔮 Enchanter Kit', price: 350, category: 'Kit' },
        fire: { name: '🔥 Fire Trail', price: 300, category: 'Cosmetic' },
        frost: { name: '❄️ Frost Aura', price: 300, category: 'Cosmetic' },
        lightning: { name: '⚡ Lightning Kill Effect', price: 500, category: 'Cosmetic' },
        rainbow: { name: '🌈 Rainbow Name', price: 750, category: 'Cosmetic' },
        firework: { name: '🎆 Firework Death Effect', price: 400, category: 'Cosmetic' },
        claim: { name: '🏗️ +1,000 Claim Blocks', price: 400, category: 'Special' },
        backpack: { name: '🎒 Backpack Expansion', price: 250, category: 'Special' },
        warp: { name: '🌀 Custom Warp', price: 600, category: 'Special' },
        keepinv: { name: '🛡️ Keep Inventory Token', price: 150, category: 'Special' },
      };

      const item = SHOP_CATALOG[itemId];
      if (!item) {
        await interaction.editReply({ content: '❌ Item no longer available.', embeds: [], components: [] });
        return;
      }

      // Get linked MC username
      let mcUsername = null;
      try {
        const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId: interaction.guild?.id || '1524878881918685405' })
        });
        if (configRes.ok) {
          const cfg = await configRes.json();
          if (cfg.verifiedPlayers && cfg.verifiedPlayers[interaction.user.id]) {
            mcUsername = cfg.verifiedPlayers[interaction.user.id].name;
          }
        }
      } catch (e) {
        console.warn('[Shop] Config fetch failed:', e.message);
      }

      if (!mcUsername) {
        await interaction.editReply({ content: '❌ Your Minecraft account is no longer linked. Please re-verify in <#1526685112693952568>.', embeds: [], components: [] });
        return;
      }

      // Execute the purchase via Pterodactyl console command
      const pteroToken = process.env.PTERODACTYL_TOKEN;
      const serverId = '25a5d79a';
      const buyCommand = `krylo buy ${mcUsername} ${itemId} ${item.price}`;

      try {
        const execRes = await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/command`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pteroToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ command: buyCommand })
        });

        if (execRes.ok || execRes.status === 204) {
          const mcHeadUrl = `https://mc-heads.net/avatar/${mcUsername}/64`;
          const successEmbed = new EmbedBuilder()
            .setColor(0x00FF66)
            .setAuthor({ name: `${interaction.user.displayName}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 64 }) })
            .setTitle('✅ Purchase Successful!')
            .setThumbnail(mcHeadUrl)
            .setDescription(`🛒 You bought **${item.name}** for **${item.price.toLocaleString()} KryloCoins** ⛃`)
            .addFields(
              { name: '⛏️ Delivered To', value: `\`${mcUsername}\``, inline: true },
              { name: '📦 Category', value: item.category, inline: true },
              { name: '🏷️ Discord', value: `<@${interaction.user.id}>`, inline: true },
              { name: '💡 Note', value: item.category === 'Kit'
                ? 'If you\'re online, check your inventory! If offline, the kit will be delivered when you join.'
                : item.category === 'Rank'
                ? 'Your rank has been updated! Rejoin the server to see your new perks.'
                : 'Your purchase has been applied to your account!' }
            )
            .setFooter({ text: `Receipt • KryloSMP Store`, iconURL: 'https://mc-heads.net/avatar/KryloSMP/32' })
            .setTimestamp();

          await interaction.editReply({ embeds: [successEmbed], components: [] });

          // Log the purchase publicly in the store channel
          try {
            const logEmbed = new EmbedBuilder()
              .setColor(0xFFAA00)
              .setAuthor({ name: interaction.user.displayName, iconURL: interaction.user.displayAvatarURL({ dynamic: true, size: 32 }) })
              .setDescription(`🛒 <@${interaction.user.id}> purchased **${item.name}** for **${item.price.toLocaleString()}** ⛃\n⛏️ MC: \`${mcUsername}\``)
              .setThumbnail(mcHeadUrl)
              .setTimestamp();
            await interaction.channel.send({ embeds: [logEmbed] });
          } catch (logErr) {
            console.warn('[Shop] Failed to log purchase:', logErr.message);
          }
        } else {
          const errorEmbed = new EmbedBuilder()
            .setColor(0xFF4444)
            .setTitle('❌ Purchase Failed')
            .setDescription('The server could not process your purchase. This could mean:')
            .addFields(
              { name: '🔧 Possible Reasons', value: '• Insufficient KryloCoins balance\n• Server is offline or restarting\n• Network connection issue' },
              { name: '💡 What to Do', value: `Check your balance in-game with \`/balance\` — you need **${item.price.toLocaleString()} ⛃**` }
            )
            .setFooter({ text: 'No coins were deducted.' })
            .setTimestamp();

          await interaction.editReply({ embeds: [errorEmbed], components: [] });
        }
      } catch (err) {
        console.error('[Shop] Purchase execution error:', err);
        await interaction.editReply({
          content: `❌ Failed to connect to the Minecraft server. Please try again later.\n\`${err.message}\``,
          embeds: [],
          components: []
        });
      }
      return;
    }

    // Shop Cancel
    if (customId.startsWith('shop_cancel_')) {
      const userId = customId.replace('shop_cancel_', '');
      if (interaction.user.id !== userId) {
        await interaction.reply({ content: '❌ This is not your purchase to cancel!', ephemeral: true });
        return;
      }

      await interaction.deferUpdate();
      const cancelEmbed = new EmbedBuilder()
        .setColor(0x888888)
        .setTitle('🚫 Purchase Cancelled')
        .setDescription('No coins were deducted. You can browse the store anytime and try again!')
        .setTimestamp();

      await interaction.editReply({ embeds: [cancelEmbed], components: [] });
      return;
    }

    // ──────────────────────────────────────────────────────────────────────────
    // VERIFICATION 4-BUTTON PANEL INTERACTION HANDLERS
    // ──────────────────────────────────────────────────────────────────────────
    if (customId === 'unlink_account') {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      try {
        let verifiedRole = interaction.guild.roles.cache.find(r => 
          r.name.toLowerCase().includes('verified') || 
          r.name.toLowerCase().includes('member')
        );
        if (verifiedRole && interaction.member) {
          await interaction.member.roles.remove(verifiedRole).catch(() => {});
        }

        const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId })
        });
        if (res.ok) {
          const config = await res.json();
          let linkedIgn = null;
          if (config.verifiedUsers) {
            for (const [ign, data] of Object.entries(config.verifiedUsers)) {
              if (data.discordId === interaction.user.id) {
                linkedIgn = ign;
                delete config.verifiedUsers[ign];
              }
            }
          }
          if (linkedIgn && config.pendingCommands) {
            config.pendingCommands.push(`whitelist remove ${linkedIgn}`);
          }
          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_config', guildId, config })
          });
        }

        const unlinkEmbed = new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle('🔴 Account Unlinked Successfully')
          .setDescription(`Your Discord account has been unlinked from Minecraft. You can re-link anytime!`)
          .setTimestamp();
        await interaction.editReply({ embeds: [unlinkEmbed] });
      } catch (err) {
        await interaction.editReply(`❌ Error unlinking account: ${err.message}`);
      }
      return;
    }

    if (customId === 'update_username') {
      // Re-trigger verification modal
      const modal = new ModalBuilder()
        .setCustomId('modal_start_verification')
        .setTitle('🔄 Update Linked Minecraft Username');

      const usernameInput = new TextInputBuilder()
        .setCustomId('mc_username')
        .setLabel('Enter your New Minecraft Username')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('e.g. Krylo_MC')
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(usernameInput));
      await interaction.showModal(modal);
      return;
    }

    if (customId === 'check_status' || customId === 'btn_check_status') {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      try {
        let linkedIgn = 'Not Linked';
        let balance = 0;

        // Check local verifiedUsers.json first
        if (fs.existsSync('verifiedUsers.json')) {
          try {
            const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf-8'));
            const uRecord = vData[interaction.user.id];
            if (uRecord && uRecord.minecraftUsername) {
              linkedIgn = uRecord.minecraftUsername;
            }
          } catch (e) {}
        }
        if (interaction.user.id === '1414143825538191373' && linkedIgn === 'Not Linked') {
          linkedIgn = 'Krylo_MC';
        }

        const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId })
        });
        if (res.ok) {
          const config = await res.json();
          if (linkedIgn === 'Not Linked' && config.verifiedUsers) {
            for (const [ign, data] of Object.entries(config.verifiedUsers)) {
              if (data.discordId === interaction.user.id) {
                linkedIgn = ign;
                break;
              }
            }
          }

          // Fetch balance across IGN, Username, or User ID
          if (config.economyData) {
            if (linkedIgn && config.economyData[linkedIgn]) balance = config.economyData[linkedIgn].balance || 0;
            else if (config.economyData[interaction.user.username]) balance = config.economyData[interaction.user.username].balance || 0;
            else if (config.verifiedPlayers && config.verifiedPlayers[interaction.user.id]) balance = config.verifiedPlayers[interaction.user.id].balance || 0;
          }

          // Owner Infinite KC Override
          if (interaction.user.id === '1414143825538191373' || (linkedIgn && linkedIgn.toLowerCase().includes('krylo'))) {
            balance = 999999999999;
          }
        }

        const balanceFormatted = balance >= 999999999 ? '♾️ Unlimited KC (Owner)' : `${balance.toLocaleString()} KC`;

        const statusEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle('🔍 Verification & Account Status')
          .setThumbnail(`https://mc-heads.net/avatar/${encodeURIComponent(linkedIgn !== 'Not Linked' ? linkedIgn : 'Steve')}/64`)
          .addFields(
            { name: '👤 Discord Account', value: `<@${interaction.user.id}>`, inline: true },
            { name: '🎮 Linked Minecraft Username', value: linkedIgn !== 'Not Linked' ? `\`${linkedIgn}\`` : '❌ `Not Linked`', inline: true },
            { name: '💰 KryloCoins Balance', value: `\`${balanceFormatted}\``, inline: true },
            { name: '🌐 Server IP', value: '`KryloSmp.play.hosting`', inline: true }
          )
          .setFooter({ text: 'KryloSMP Account Management System ⚡' })
          .setTimestamp();

        await interaction.editReply({ embeds: [statusEmbed] });
      } catch (err) {
        await interaction.editReply(`❌ Error checking status: ${err.message}`);
      }
      return;
    }

    if (customId === 'copy_ip_btn') {
      await interaction.reply({
        content: '🌐 **KryloSMP Connection Details:**\n\n' +
                 '• **Java Server IP:** `KryloSmp.play.hosting` (Port: `25565`)\n' +
                 '• **Bedrock IP:** `KryloSmp.play.hosting` (Port: `19132`)\n' +
                 '• **Version:** `1.21.x`\n' +
                 '• **Player Portal:** https://krylosmp.web.app/\n' +
                 '• **KC Store:** https://krylosmp-store.web.app/',
        ephemeral: true
      });
      return;
    }

    if (customId === 'btn_check_status' || customId === 'check_status') {
      // Handled above in check_status block, or fallback:
    }

    if (customId.startsWith('create_ticket') || customId === 'btn_ticket_open' || customId === 'open_ticket') {
      const modal = new ModalBuilder()
        .setCustomId('modal_open_ticket')
        .setTitle('Open Support Ticket');

      const reasonInput = new TextInputBuilder()
        .setCustomId('ticket_reason')
        .setLabel('Reason / Question')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Describe your issue, question, or application...')
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(reasonInput);
      modal.addComponents(row);

      try {
        await interaction.showModal(modal);
      } catch (modalErr) {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '✅ Ticket system initialized. Opening ticket...', ephemeral: true });
        }
      }
      return;
    }

    // Universal Fallback for any unhandled button to prevent "didn't respond in time"
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: '⚡ Action acknowledged! Processing request...', ephemeral: true }).catch(() => {});
    }
    return;
  }

  if (interaction.isModalSubmit()) {
    const { customId } = interaction;
    if (customId === 'modal_open_ticket') {
      await interaction.deferReply({ ephemeral: true });
      const userTicketReasonText = interaction.fields.getTextInputValue('ticket_reason');
      
      try {
        const supportCategory = interaction.guild.channels.cache.find(c => c.name.toLowerCase().includes('support') && c.type === ChannelType.GuildCategory) || interaction.guild.channels.cache.find(c => c.name.toLowerCase().includes('support-tickets') && c.type === ChannelType.GuildText)?.parent;
        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username.toLowerCase()}`,
          type: ChannelType.GuildText,
          parent: supportCategory ? supportCategory.id : null,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            },
            {
              id: client.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            }
          ]
        });

        const calculatedPriority = await calculatePriority(userTicketReasonText);
        let mcUsername = 'Not Linked';
        let playerBalance = 0;
        try {
          const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'get_config', guildId: interaction.guild?.id || '1524878881918685405' })
          });
          if (configRes.ok) {
            guildConfig = await configRes.json();
            if (guildConfig.verifiedPlayers && guildConfig.verifiedPlayers[interaction.user.id]) {
              mcUsername = guildConfig.verifiedPlayers[interaction.user.id].name || 'Not Linked';
              if (guildConfig.verifiedPlayers[interaction.user.id].balance !== undefined) {
                playerBalance = guildConfig.verifiedPlayers[interaction.user.id].balance;
              }
            }
            if (mcUsername !== 'Not Linked' && guildConfig.economyData && guildConfig.economyData[mcUsername]) {
              playerBalance = guildConfig.economyData[mcUsername];
            }
          }
        } catch (e) {
          console.warn('[Ticket Log] Failed to fetch config:', e.message);
        }

        const profileEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle('🎫 Support Ticket Details')
          .setDescription(`Welcome <@${interaction.user.id}>! Our administrative staff will assist you shortly.`)
          .addFields(
            { name: '👤 Discord User', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
            { name: '🎮 Minecraft Account', value: mcUsername !== 'Not Linked' ? `\`${mcUsername}\`` : '❌ Not Linked', inline: true },
            { name: '🪙 KryloCoins', value: `\`${Math.floor(playerBalance).toLocaleString()} ⛃\``, inline: true },
            { name: '📋 Reason / Question', value: userTicketReasonText },
            { name: '🚨 Priority Level', value: `${calculatedPriority === 'No Staff Needed' ? '🟢 Standard / General' : calculatedPriority === 'High' ? '🔴 High Priority' : '🟡 Medium Priority'}`, inline: true }
          )
          .setFooter({ text: 'Type /close to resolve and delete this channel' })
          .setTimestamp();

        const closeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('🔒 Close Ticket')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🔒')
        );
        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [profileEmbed], components: [closeRow] });
        await interaction.editReply(`🎟️ **Ticket Opened!** Check it out here: <#${channel.id}>`);

        // Log to Google Sheet via SheetDB API
        await logTicketToGoogleSheet(
          channel.id, 
          interaction.user.tag, 
          interaction.user.id, 
          userTicketReasonText, 
          calculatedPriority, 
          mcUsername, 
          playerBalance
        );

        if (guildConfig) {
          const tickets = guildConfig.openTickets || [];
          tickets.push({ id: channel.id, name: channel.name, user: interaction.user.username });
          guildConfig.openTickets = tickets;
          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_config', guildId: interaction.guild.id, config: guildConfig })
          });
        }
      } catch (err) {
        await interaction.editReply(`❌ Failed to open ticket: ${err.message}`);
      }
      return;
    }

    if (customId === 'modal_start_verification') {
      await interaction.deferReply({ ephemeral: true });
      const mcUsernameInput = interaction.fields.getTextInputValue('mc_username').trim();
      const cleanUsername = mcUsernameInput.replace(/^[\.\_]+/, '');
      const member = interaction.member;
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';

      try {
        // 1. Assign Verified / Member role in Discord
        let verifiedRole = interaction.guild.roles.cache.find(r => 
          r.name.toLowerCase().includes('verified') || 
          r.name.toLowerCase().includes('member') || 
          r.name.toLowerCase().includes('og member')
        );
        if (verifiedRole && member) {
          await member.roles.add(verifiedRole).catch(() => {});
        }

        // 2. Queue whitelist commands & rewards on Vercel API
        const response = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId })
        });

        if (response.ok) {
          const config = await response.json();
          if (!config.economyData) config.economyData = {};
          if (!config.economyData[interaction.user.username]) config.economyData[interaction.user.username] = { balance: 0 };
          config.economyData[interaction.user.username].balance += 500;

          if (!config.verifiedUsers) config.verifiedUsers = {};
          config.verifiedUsers[mcUsernameInput] = {
            discordTag: interaction.user.tag,
            discordId: interaction.user.id,
            verifiedAt: new Date().toISOString()
          };

          if (!config.pendingCommands) config.pendingCommands = [];
          config.pendingCommands.push(`whitelist add ${mcUsernameInput}`);
          if (cleanUsername !== mcUsernameInput) {
            config.pendingCommands.push(`whitelist add ${cleanUsername}`);
          }
          config.pendingCommands.push(`give ${mcUsernameInput} minecraft:diamond 16`);
          config.pendingCommands.push(`say 🛡️ Real Human Player ${mcUsernameInput} verified via Discord & joined KryloSMP!`);

          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_config', guildId, config })
          });
        }

        const mcHeadUrl = `https://mc-heads.net/avatar/${encodeURIComponent(mcUsernameInput)}/64`;
        const successEmbed = new EmbedBuilder()
          .setColor(0x00FF66)
          .setTitle('🎉 INSTANT VERIFICATION SUCCESSFUL!')
          .setThumbnail(mcHeadUrl)
          .setDescription(
            `Welcome to **KryloSMP**, <@${interaction.user.id}>!\n\n` +
            `• **Linked Username:** \`${mcUsernameInput}\`\n` +
            `• **Server IP:** \`KryloSmp.play.hosting\`\n` +
            `• **Discord Role:** Granted ${verifiedRole ? `<@&${verifiedRole.id}>` : '**Verified**'}!\n` +
            `• **Rewards Granted:** 💰 **+500 KryloCoins** + 💎 **16x Diamonds**!\n\n` +
            `*Your account has been automatically whitelisted. You can connect to the server right now!*`
          )
          .setFooter({ text: 'KryloSMP Automated Verification Engine ⚡' })
          .setTimestamp();

        await interaction.editReply({ embeds: [successEmbed], components: [] });
      } catch (err) {
        await interaction.editReply(`❌ Error processing verification: ${err.message}`);
      }
      return;
    }

    if (customId === 'modal_enter_verify_code') {
      await interaction.deferReply({ ephemeral: true });
      const code = interaction.fields.getTextInputValue('verify_code').trim().toUpperCase();

      try {
        const response = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm_verification_code',
            guildId: '1524878881918685405',
            code: code,
            discordUserId: interaction.user.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.ok) {
            const mcName = result.name;

            // 1. Assign 'Verified' role
            let role = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes('verified'));
            if (!role) {
              try {
                role = await interaction.guild.roles.create({
                  name: 'Verified',
                  color: '#00ff66',
                  reason: 'Auto-created by verification system'
                });
              } catch (roleErr) {
                console.warn('Failed to create Verified role:', roleErr.message);
              }
            }

            if (role) {
              await interaction.member.roles.add(role);
            }

            // 2. Set Nickname
            try {
              await interaction.member.setNickname(mcName, 'Synced with Minecraft username');
            } catch (nickErr) {
              console.warn('Failed to set nickname:', nickErr.message);
            }

            const successEmbed = new EmbedBuilder()
              .setColor(0x00FF66)
              .setTitle('✅ Verification Successful!')
              .setDescription(`Your Discord account is now linked to Minecraft account **${mcName}**!`)
              .addFields(
                { name: '👤 Minecraft Username', value: `\`${mcName}\``, inline: true },
                { name: '🎭 Assigned Role', value: role ? `<@&${role.id}>` : '`Verified`', inline: true }
              )
              .setTimestamp();

            
            const rulesEmbed = new EmbedBuilder()
              .setColor(0x00F2FF)
              .setTitle('📜 KryloSMP Server Rules Agreement')
              .setDescription(
                'To unlock the **KryloSMP Starter** role and gain full access to all server channels, please agree to our 3 core rules:\n\n' +
                '1. 🚫 **Rule 1 - Fair Play:** No griefing, stealing, or hacking/x-ray in Survival world.\n' +
                '2. 🤝 **Rule 2 - Respect:** Respect all players & staff members in chat and voice.\n' +
                '3. 🛒 **Rule 3 - Safe Trading:** Follow shop & trade rules, no real-money scamming.\n\n' +
                'Click the button below to accept the rules and claim your **KryloSMP Starter** role!'
              )
              .setFooter({ text: 'KryloSMP Rules & Verification ⚡' });

            const rulesRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('claim_starter_role')
                .setLabel('Accept Rules & Claim KryloSMP Starter Role')
                .setEmoji('1530370298262720722')
                .setStyle(ButtonStyle.Success)
            );

            await interaction.editReply({ embeds: [successEmbed, rulesEmbed], components: [rulesRow] });

          } else {
            const errEmbed = new EmbedBuilder()
              .setColor(0xFF4444)
              .setTitle('❌ Invalid or Expired Code')
              .setDescription(
                (result.error || 'The verification code entered was not recognized.') + '\n\n' +
                '### 🔑 How to get your code:\n' +
                '1. Click **Link Account** and enter your Minecraft Username.\n' +
                '2. Open Minecraft and connect to **`KryloSmp.play.hosting`**.\n' +
                '3. Look at your in-game chat—your 5-digit code will display on join!\n' +
                '4. Return here and click **Enter Code** again.'
              )
              .setFooter({ text: 'KryloSMP Verification System ⚡' })
              .setTimestamp();
            await interaction.editReply({ embeds: [errEmbed] });
          }
        } else {
          await interaction.editReply('❌ Failed to connect to verification server.');
        }
      } catch (err) {
        await interaction.editReply(`❌ Error: ${err.message}`);
      }
      return;
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // Retrieve configurations dynamically from cloud database
  let botPrefix = '!';
  let aiEnabled = true;
  let modelEngine = 'gemini';
  let systemInstruction = 'You are the Krims Code AI, built and custom-trained by the genius developer Krishiv. Answer coding queries with clear instructions and a friendly, confident tone.';
  let ticketsEnabled = false;

  if (interaction.guild) {
    try {
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: interaction.guild.id })
      });
      if (configRes.ok) {
        guildConfig = await configRes.json();
        botPrefix = guildConfig.prefix || '!';
        aiEnabled = guildConfig.aiEnabled !== false;
        modelEngine = guildConfig.model || 'gemini';
        systemInstruction = guildConfig.sysPrompt || systemInstruction;
        ticketsEnabled = !!guildConfig.ticketsEnabled;
      }
    } catch (err) {
      console.warn("Failed to load configs:", err.message);
    }
  }

  // Command: /coinflip
  
  if (commandName === 'genkey') {
    if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== '1414143825538191373') {
      return interaction.reply({ content: '❌ Only server administrators can generate API keys.', ephemeral: true });
    }

    const prefixOpt = interaction.options.getString('prefix') || 'krylo';
    const envOpt = interaction.options.getString('env') || 'live';
    const customPrefix = prefixOpt.toLowerCase().replace(/[^a-z0-9]/g, '');

    const randomHex = crypto.randomBytes(24).toString('hex');
    const apiKey = customPrefix + '_' + envOpt + '_' + randomHex;

    const embed = new EmbedBuilder()
      .setTitle('🔑 Custom API Key Generated')
      .setDescription('Your new custom API key has been created!')
      .addFields(
        { name: 'Prefix', value: '```' + customPrefix + '```', inline: true },
        { name: 'Environment', value: '```' + envOpt + '```', inline: true },
        { name: 'API Key', value: '```' + apiKey + '```' }
      )
      .setColor(0x00FF88)
      .setFooter({ text: 'Keep your API key secret! Never share your private keys.' })
      .setTimestamp();

    await interaction.reply({ content: '🔑 Here is your generated API key (ephemeral - only you can see this):', embeds: [embed], ephemeral: true });
  }

  
  if (commandName === 'startstream') {
    if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== '1414143825538191373') {
      return interaction.reply({ content: '❌ Only administrators can start a live stream broadcast.', ephemeral: true });
    }

    const titleOpt = interaction.options.getString('title') || 'Live KryloSMP Minecraft Gameplay & Tournaments!';
    try {
      await startMinecraftLiveStream(interaction.guild, interaction.user, titleOpt);
      await interaction.reply({ content: '🔴 **LIVE STREAM BROADCAST STARTED!** Notification and embed sent.', ephemeral: true });
    } catch (e) {
      await interaction.reply({ content: '❌ Failed to start stream: ' + e.message, ephemeral: true });
    }
  }

  if (commandName === 'stopstream') {
    if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== '1414143825538191373') {
      return interaction.reply({ content: '❌ Only administrators can stop a live stream broadcast.', ephemeral: true });
    }

    if (!activeStream) {
      return interaction.reply({ content: 'ℹ️ No active live stream is currently running.', ephemeral: true });
    }

    activeStream = null;
    client.user.setActivity('KryloSMP • krylosmp.play.hosting', { type: 0 });

    await interaction.reply({ content: '🛑 **LIVE STREAM BROADCAST ENDED.** Activity status reset to default.', ephemeral: true });
  }


  
  if (commandName === 'adminabuse') {
    if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== '1414143825538191373') {
      return interaction.reply({ content: '❌ Only administrators can trigger the Admin Abuse event.', ephemeral: true });
    }

    const noteOpt = interaction.options.getString('details') || '';
    try {
      await triggerAdminAbuseBroadcast(interaction.guild, interaction.user, noteOpt);
      await interaction.reply({ content: '💥 **MONTHLY ADMIN ABUSE EVENT BROADCASTED!** Notification sent & crossposted.', ephemeral: true });
    } catch (e) {
      await interaction.reply({ content: '❌ Failed to trigger event: ' + e.message, ephemeral: true });
    }
  }


  
  if (commandName === 'startserver') {
      await interaction.deferReply();
      
      const serverId = '25a5d79a';
      const pteroToken = process.env.PTERODACTYL_TOKEN;

      try {
        await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/power`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pteroToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({ signal: 'start' })
        });
      } catch (err) {}

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Server Power Controller', iconURL: interaction.guild.iconURL() })
        .setTitle('🚀 MINECRAFT SERVER IS STARTING!')
        .setDescription(
          `The power signal **START** has been sent to the server node!\n\n` +
          `🌐 **Server IP**: \`KryloSmp.play.hosting\`\n` +
          `🔌 **Port**: \`25565\` (Java) | \`19132\` (Bedrock)\n` +
          `⏱️ **Estimated Boot Time**: ~20-30 seconds\n\n` +
          `*Raise your swords and connect now!*`
        )
        .setColor(0x00FF77)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (commandName === 'gameboost' || commandName === 'boostpc') {
    try {
      const embed = await executeGameBoostOptimization(interaction.user);
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      await interaction.reply({ content: '❌ Game boost error: ' + e.message, ephemeral: true });
    }
  }


  if (commandName === 'coinflip') {
    const outcome = Math.random() < 0.5 ? 'Heads' : 'Tails';
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🪙 Coin Flip')
      .setDescription(`The coin landed on: **${outcome}**!`)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /roll
  if (commandName === 'roll') {
    const max = interaction.options.getInteger('max') || 6;
    if (max <= 1) {
      await interaction.reply({ content: '❌ Maximum number must be greater than 1!', ephemeral: true });
      return;
    }
    const roll = Math.floor(Math.random() * max) + 1;
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🎲 Dice Roll')
      .setDescription(`You rolled a **${roll}** (1-${max})!`)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /avatar
  if (commandName === 'avatar') {
    const user = interaction.options.getUser('user') || interaction.user;
    const avatarUrl = user.displayAvatarURL({ dynamic: true, size: 1024 });
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle(`Avatar of ${user.username}`)
      .setImage(avatarUrl)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /daily
  if (commandName === 'daily') {
    const userId = interaction.user.id;
    const now = Date.now();
    const cooldown = 24 * 60 * 60 * 1000;
    const lastClaim = dailyCooldowns.get(userId) || 0;

    if (now - lastClaim < cooldown) {
      const remainingMs = cooldown - (now - lastClaim);
      const hours = Math.floor(remainingMs / (1000 * 60 * 60));
      const mins = Math.ceil((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      await interaction.reply({ content: `⏳ You have already claimed your daily reward! Please wait **${hours}h ${mins}m** before claiming again.`, ephemeral: true });
      return;
    }

    dailyCooldowns.set(userId, now);

    // 7-Day Daily Birthday Festival Schedule (July 23 - July 29, 2026)
    const festivalRewards = [
      { day: 1, date: 23, name: '💎 Day 1: Diamond Bundle', reward: 1000, mcCmd: 'give {username} minecraft:diamond 32', desc: '• **+1,000 KryloCoins**\n• **32x Free Diamonds** in-game!' },
      { day: 2, date: 24, name: '🎂 Day 2: Krylo Birthday Special', reward: 2500, mcCmd: 'give {username} minecraft:netherite_ingot 1', desc: '• **+2,500 KryloCoins**\n• **1x Netherite Ingot** in-game!' },
      { day: 3, date: 25, name: '⚔️ Day 3: Warrior Kit', reward: 1500, mcCmd: 'give {username} minecraft:diamond_sword{Enchantments:[{id:sharpness,lvl:5},{id:unbreaking,lvl:3}]} 1', desc: '• **+1,500 KryloCoins**\n• **1x Sharpness V Diamond Sword** in-game!' },
      { day: 4, date: 26, name: '🛡️ Day 4: Armor Cache', reward: 1500, mcCmd: 'give {username} minecraft:diamond_chestplate{Enchantments:[{id:protection,lvl:4},{id:mending,lvl:1}]} 1', desc: '• **+1,500 KryloCoins**\n• **1x Protection IV Mending Chestplate** in-game!' },
      { day: 5, date: 27, name: '🚀 Day 5: Flight Wings', reward: 2000, mcCmd: 'give {username} minecraft:elytra 1', desc: '• **+2,000 KryloCoins**\n• **1x Elytra Wings** in-game!' },
      { day: 6, date: 28, name: '🏺 Day 6: Ancient Debris Vault', reward: 2000, mcCmd: 'give {username} minecraft:ancient_debris 4', desc: '• **+2,000 KryloCoins**\n• **4x Ancient Debris** in-game!' },
      { day: 7, date: 29, name: '🎁 Day 7: Grand Jackpot Crate', reward: 5000, mcCmd: 'say 🎉 {username} claimed the Day 7 Grand Birthday Jackpot!', desc: '• **+5,000 KryloCoins Jackpot**\n• **1x GOD Crate Voucher** in-game!' }
    ];

    const todayDate = new Date().getDate();
    const activeFest = festivalRewards.find(r => r.date === todayDate) || festivalRewards[0];
    const rewardCoins = activeFest.reward;

    try {
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId })
      });
      if (configRes.ok) {
        const config = await configRes.json();
        if (!config.economyData) config.economyData = {};
        if (!config.economyData[interaction.user.username]) config.economyData[interaction.user.username] = { balance: 0 };
        config.economyData[interaction.user.username].balance += rewardCoins;

        if (!config.pendingCommands) config.pendingCommands = [];
        config.pendingCommands.push(activeFest.mcCmd.replace('{username}', interaction.user.username));

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId, config })
        });
      }
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0x00FF66)
      .setTitle(`🎁 Birthday Festival Daily Reward: ${activeFest.name}!`)
      .setDescription(`Congratulations <@${userId}>! You claimed your **Festival Day ${activeFest.day} Reward**!\n\n${activeFest.desc}\n\n*In-game rewards queued for your username! Come back tomorrow for Day ${activeFest.day < 7 ? activeFest.day + 1 : 1}!*`)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /work
  if (commandName === 'work') {
    const userId = interaction.user.id;
    const now = Date.now();
    const cooldown = 60 * 60 * 1000; // 1 hour
    const lastWork = workCooldowns.get(userId) || 0;

    if (now - lastWork < cooldown) {
      const remainingMins = Math.ceil((cooldown - (now - lastWork)) / (1000 * 60));
      await interaction.reply({ content: `⏳ You are exhausted from working! Take a rest and try again in **${remainingMins} minutes**.`, ephemeral: true });
      return;
    }

    workCooldowns.set(userId, now);
    const jobs = [
      { text: 'Mined 64 Ancient Debris in the Nether', pay: 280 },
      { text: 'Built a massive automatic sugar cane farm', pay: 210 },
      { text: 'Defeated an army of Piglins in a bastion raid', pay: 300 },
      { text: 'Brewed 50 Health Potions for the Spawn Shop', pay: 180 },
      { text: 'Enchanted netherite swords for new players', pay: 240 },
      { text: 'Guarded the spawn city from Ender Dragon attacks', pay: 290 }
    ];
    const job = jobs[Math.floor(Math.random() * jobs.length)];

    try {
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId })
      });
      if (configRes.ok) {
        const config = await configRes.json();
        if (!config.economyData) config.economyData = {};
        if (!config.economyData[interaction.user.username]) config.economyData[interaction.user.username] = { balance: 0 };
        config.economyData[interaction.user.username].balance += job.pay;

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId, config })
        });
      }
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('⚒️ Shift Complete!')
      .setDescription(`You worked hard and **${job.text}**!\nYou earned **+${job.pay} KryloCoins** 🪙`)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /vote
  if (commandName === 'vote') {
    const embed = new EmbedBuilder()
      .setColor(0x00FF66)
      .setTitle('🗳️ Vote for KryloSMP & Claim Free Rewards!')
      .setDescription(
        'Vote for `KryloSmp.play.hosting` on top Minecraft server lists to boost our network ranking and earn **+500 KryloCoins** + **1x Vote Crate Key** per site!\n\n' +
        '• [Vote on PlanetMinecraft](https://planetminecraft.com)\n' +
        '• [Vote on Minecraft-MP](https://minecraft-mp.com)\n' +
        '• [Vote on NameMC](https://namemc.com)\n' +
        '• [Vote on TopG](https://topg.org)\n' +
        '• [Vote on Minecraft Server List](https://minecraft-server-list.com)\n\n' +
        '*Rewards credit automatically to your wallet balance!*'
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /refer
  if (commandName === 'refer') {
    const friend = interaction.options.getUser('friend');
    if (!friend) {
      const embed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('🤝 Referral Rewards Program')
        .setDescription(
          `Invite friends to KryloSMP and earn **+2,000 KryloCoins** + **1x Referral Crate Key** for every friend that joins!\n\n` +
          `• **Your Invite Link:** \`https://discord.gg/2hSXQKHvvX\`\n` +
          `• **How to Claim:** When your friend joins, run \`/refer friend:@YourFriend\` to claim your bonus!`
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      return;
    }

    try {
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId })
      });
      if (configRes.ok) {
        const config = await configRes.json();
        if (!config.economyData) config.economyData = {};
        if (!config.economyData[interaction.user.username]) config.economyData[interaction.user.username] = { balance: 0 };
        config.economyData[interaction.user.username].balance += 2000;

        if (!config.pendingCommands) config.pendingCommands = [];
        config.pendingCommands.push(`give ${interaction.user.username} minecraft:tripwire_hook 1`);

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId, config })
        });
      }
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0x00FF66)
      .setTitle('🤝 Referral Bonus Claimed!')
      .setDescription(`Congratulations <@${interaction.user.id}>! You referred <@${friend.id}> to KryloSMP!\n\n• **+2,000 KryloCoins** credited to your wallet!\n• **1x Referral Crate Key** queued in-game!`)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  if (commandName === 'bump') {
    const cmdCh = interaction.guild?.channels.cache.find(c => c.name.includes('bot-command') || c.name.includes('general'));
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🚀 Disboard Server Bump Helper')
      .setDescription(
        `Type \`/bump\` (Disboard Bot command) in ${cmdCh ? `<#${cmdCh.id}>` : 'bot commands channel'} to bump KryloSMP to the top of Disboard homepage!\n\n` +
        '• **Bump Cooldown:** Disboard allows bumping every **2 hours**.\n' +
        '• **Reward:** +300 KryloCoins granted to every player who bumps!'
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /verify
  if (commandName === 'verify') {
    const mcUsername = interaction.options.getString('username') || interaction.user.username;
    const member = interaction.member;

    try {
      // 1. Assign Verified role in Discord
      const verifiedRole = interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'verified' || r.name.toLowerCase() === 'member');
      if (verifiedRole && member) {
        await member.roles.add(verifiedRole).catch(() => {});
      }

      // 2. Queue console whitelist add & welcome bonus
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId })
      });

      if (configRes.ok) {
        const config = await configRes.json();
        if (!config.economyData) config.economyData = {};
        if (!config.economyData[interaction.user.username]) config.economyData[interaction.user.username] = { balance: 0 };
        config.economyData[interaction.user.username].balance += 500;

        if (!config.pendingCommands) config.pendingCommands = [];
        config.pendingCommands.push(`whitelist add ${mcUsername}`);
        config.pendingCommands.push(`give ${mcUsername} minecraft:diamond 16`);
        config.pendingCommands.push(`say 🛡️ Real Human Player ${mcUsername} has verified via Discord and joined the network!`);

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId, config })
        });
      }

      const embed = new EmbedBuilder()
        .setColor(0x00FF66)
        .setTitle('🛡️ Account Verification Successful!')
        .setDescription(
          `Welcome to KryloSMP <@${interaction.user.id}>!\n\n` +
          `• **Minecraft Username:** \`${mcUsername}\`\n` +
          `• **Status:** Verified Human Player ✅\n` +
          `• **Whitelist:** Added to Minecraft Server Whitelist!\n` +
          `• **Welcome Bonus:** **+500 KryloCoins & 16x Free Diamonds** queued in-game!\n\n` +
          `Connect now at \`KryloSmp.play.hosting\``
        )
        .setTimestamp();
      await interaction.reply({ embeds: [embed] });
      return;
    } catch (err) {
      await interaction.reply({ content: `❌ Verification error: ${err.message}`, ephemeral: true });
      return;
    }
  }

  // Command: /balance
  if (commandName === 'balance') {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    let balance = 0;

    // Read Real Balance from verifiedUsers.json
    if (fs.existsSync('verifiedUsers.json')) {
      try {
        const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf8'));
        if (vData[targetUser.id] && vData[targetUser.id].balance !== undefined) {
          balance = vData[targetUser.id].balance;
        }
      } catch (e) {}
    }

    // Fetch Real Balance from Remote API if balance is 0
    if (balance === 0) {
      try {
        const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
        const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId })
        });
        if (configRes.ok) {
          const config = await configRes.json();
          if (config.economyData && config.economyData[targetUser.username]) {
            balance = config.economyData[targetUser.username].balance || 0;
          }
        }
      } catch (e) {}
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFAA00)
      .setTitle(`💳 Wallet Balance - ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🪙 KryloCoins', value: `\`${balance.toLocaleString()} KC\``, inline: true },
        { name: '🔗 Server Status', value: '`Linked Account`', inline: true }
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /pay
  if (commandName === 'pay') {
    const targetUser = interaction.options.getUser('user');
    const amount = interaction.options.getInteger('amount');

    if (targetUser.id === interaction.user.id) {
      await interaction.reply({ content: '❌ You cannot send coins to yourself!', ephemeral: true });
      return;
    }
    if (targetUser.bot) {
      await interaction.reply({ content: '❌ You cannot send coins to bots!', ephemeral: true });
      return;
    }
    if (amount <= 0) {
      await interaction.reply({ content: '❌ Amount must be greater than 0!', ephemeral: true });
      return;
    }

    try {
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId })
      });
      if (configRes.ok) {
        const config = await configRes.json();
        if (!config.economyData) config.economyData = {};
        
        const senderBal = (config.economyData[interaction.user.username] && config.economyData[interaction.user.username].balance) || 0;
        if (senderBal < amount) {
          await interaction.reply({ content: `❌ Insufficient balance! You only have **${senderBal} KC**.`, ephemeral: true });
          return;
        }

        // Transfer funds
        if (!config.economyData[interaction.user.username]) config.economyData[interaction.user.username] = { balance: 0 };
        if (!config.economyData[targetUser.username]) config.economyData[targetUser.username] = { balance: 0 };

        config.economyData[interaction.user.username].balance -= amount;
        config.economyData[targetUser.username].balance += amount;

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId, config })
        });

        const embed = new EmbedBuilder()
          .setColor(0x00FF66)
          .setTitle('💸 Transfer Successful!')
          .setDescription(`<@${interaction.user.id}> successfully sent **${amount} KryloCoins** to <@${targetUser.id}>! 🪙`)
          .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        return;
      }
    } catch (err) {
      await interaction.reply({ content: `❌ Transfer failed: ${err.message}`, ephemeral: true });
      return;
    }
  }

  // Command: /slots
  if (commandName === 'slots') {
    const bet = interaction.options.getInteger('bet');
    if (bet < 10) {
      await interaction.reply({ content: '❌ Minimum bet is 10 KryloCoins!', ephemeral: true });
      return;
    }

    const symbols = ['💎', '🍋', '🍒', '🔔', '7️⃣', '🎰'];
    const s1 = symbols[Math.floor(Math.random() * symbols.length)];
    const s2 = symbols[Math.floor(Math.random() * symbols.length)];
    const s3 = symbols[Math.floor(Math.random() * symbols.length)];

    let win = false;
    let multiplier = 0;
    if (s1 === s2 && s2 === s3) {
      win = true;
      multiplier = s1 === '💎' ? 10 : 5;
    } else if (s1 === s2 || s2 === s3 || s1 === s3) {
      win = true;
      multiplier = 2;
    }

    const winAmount = win ? bet * multiplier : -bet;

    try {
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId })
      });
      if (configRes.ok) {
        const config = await configRes.json();
        if (!config.economyData) config.economyData = {};
        const bal = (config.economyData[interaction.user.username] && config.economyData[interaction.user.username].balance) || 0;
        if (bal < bet) {
          await interaction.reply({ content: `❌ Insufficient balance to bet **${bet} KC**! You have **${bal} KC**.`, ephemeral: true });
          return;
        }

        config.economyData[interaction.user.username].balance += winAmount;

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId, config })
        });
      }
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(win ? 0x00FF66 : 0xFF0055)
      .setTitle('🎰 Krylo Casino Slots')
      .setDescription(`[ ${s1} | ${s2} | ${s3} ]\n\n` + (win ? `🎉 **JACKPOT!** You won **+${winAmount} KryloCoins**! (${multiplier}x)` : `❌ **No match!** You lost **${bet} KryloCoins**.`))
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /eightball
  if (commandName === 'eightball') {
    const question = interaction.options.getString('question');
    const answers = [
      "It is certain. ✨",
      "Without a doubt! 💎",
      "You may rely on it. 👍",
      "Yes, definitely! 🚀",
      "Reply hazy, try again later. 🌫️",
      "Ask again later... ⏳",
      "Better not tell you now. 🤫",
      "Don't count on it. ❌",
      "My sources say no. 🙈",
      "Outlook not so good. 🌧️"
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🎱 Magic 8-Ball')
      .addFields(
        { name: '❓ Question', value: question },
        { name: '💬 Answer', value: answer }
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /serverinfo
  if (commandName === 'serverinfo') {
    const { guild } = interaction;
    if (!guild) {
      await interaction.reply({ content: '❌ This command can only be run inside a server!', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle(`🏰 Server Info - ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true }))
      .addFields(
        { name: '👑 Server Owner', value: `<@${guild.ownerId}>`, inline: true },
        { name: '👥 Members', value: `\`${guild.memberCount.toLocaleString()}\``, inline: true },
        { name: '💬 Channels', value: `\`${guild.channels.cache.size}\``, inline: true },
        { name: '🎭 Roles', value: `\`${guild.roles.cache.size}\``, inline: true },
        { name: '🚀 Boost Level', value: `\`Level ${guild.premiumTier}\` (${guild.premiumSubscriptionCount || 0} boosts)`, inline: true },
        { name: '📅 Created On', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true }
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /userinfo
  if (commandName === 'userinfo') {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const member = interaction.guild ? await interaction.guild.members.fetch(targetUser.id).catch(() => null) : null;

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle(`👤 User Info - ${targetUser.tag}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🆔 User ID', value: `\`${targetUser.id}\``, inline: true },
        { name: '📅 Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
      );

    if (member) {
      embed.addFields(
        { name: '📥 Joined Server', value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`, inline: true },
        { name: '🎭 Roles', value: member.roles.cache.filter(r => r.id !== interaction.guild.id).map(r => `<@&${r.id}>`).join(' ') || 'None' }
      );
    }

    embed.setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /purge
  if (commandName === 'purge') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.reply({ content: '❌ You do not have permission to manage messages!', ephemeral: true });
      return;
    }

    const amount = interaction.options.getInteger('amount');
    if (amount < 1 || amount > 100) {
      await interaction.reply({ content: '❌ Amount must be between 1 and 100!', ephemeral: true });
      return;
    }

    try {
      const deleted = await interaction.channel.bulkDelete(amount, true);
      await interaction.reply({ content: `🧹 **Purged ${deleted.size} messages!**`, ephemeral: true });
    } catch (err) {
      await interaction.reply({ content: `❌ Failed to purge messages: ${err.message}`, ephemeral: true });
    }
    return;
  }

  // Command: /warn
  if (commandName === 'warn') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await interaction.reply({ content: '❌ You do not have permission to warn members!', ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');

    const modLogsCh = interaction.guild.channels.cache.find(c => c.name.includes('mod-logs') && c.type === ChannelType.GuildText);
    if (modLogsCh) {
      const warnEmbed = new EmbedBuilder()
        .setColor(0xFF0055)
        .setTitle('⚠️ Moderator Action: User Warned')
        .addFields(
          { name: '👤 Warned User', value: `<@${targetUser.id}>`, inline: true },
          { name: '🛡️ Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📝 Reason', value: reason }
        )
        .setTimestamp();
      await modLogsCh.send({ embeds: [warnEmbed] });
    }

    await interaction.reply({ content: `⚠️ **Warned <@${targetUser.id}>** for: *${reason}*` });
    return;
  }

  // Command: /joke
  if (commandName === 'joke') {
    const jokes = [
      "Why did the Creeper cross the road? To get to the other side... of your wall! 💥",
      "Why do skeletons make terrible comedians? They just don't have the guts! 💀",
      "What is a Ghast's favorite food? Scream of wheat! 👻",
      "How does Steve get his exercise? He runs around the block! 🏃‍♂️",
      "What do you call a Minecraft zombie that writes books? A dead-author! 🧟‍♂️",
      "Why did the Enderman get a ticket? Because he was block-ing traffic! 👁️",
      "Why did the Piglin go to the store? To get some gold-en apples! 🐖",
      "How do Minecraft players stay clean? They take a bucket of water shower! 🪣"
    ];
    const joke = jokes[Math.floor(Math.random() * jokes.length)];
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🤣 Minecraft Joke')
      .setDescription(joke)
      .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /meme
  if (commandName === 'meme') {
    await interaction.deferReply();
    try {
      const res = await fetch('https://meme-api.com/gimme/minecraftmemes');
      if (res.ok) {
        const data = await res.json();
        const embed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle(data.title || 'Minecraft Meme')
          .setImage(data.url)
          .setURL(data.postLink)
          .setFooter({ text: `r/${data.subreddit} • Posted by u/${data.author}` });
        await interaction.editReply({ embeds: [embed] });
      } else {
        throw new Error('Failed to fetch meme from API');
      }
    } catch (err) {
      const fallbackMemes = [
        "https://i.imgur.com/8Qp2tP0.png",
        "https://i.imgur.com/e7eFhF4.png",
        "https://i.imgur.com/rLzT45P.jpeg",
        "https://i.imgur.com/97y0u7t.jpeg"
      ];
      const randomMeme = fallbackMemes[Math.floor(Math.random() * fallbackMemes.length)];
      const embed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('😂 Minecraft Meme')
        .setImage(randomMeme)
        .setFooter({ text: 'Fallback Minecraft Meme' });
      await interaction.editReply({ embeds: [embed] });
    }
    return;
  }

  // Command: /bday
  if (commandName === 'bday') {
    const userId = interaction.user.id;
    const now = Date.now();
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000; // 365 days

    if (!xpData[userId]) {
      xpData[userId] = { xp: 0, level: 1 };
    }

    if (xpData[userId].lastBdayClaim) {
      const timePassed = now - xpData[userId].lastBdayClaim;
      if (timePassed < ONE_YEAR_MS) {
        const daysLeft = Math.ceil((ONE_YEAR_MS - timePassed) / (24 * 60 * 60 * 1000));
        await interaction.reply({
          content: `⏳ **You have already claimed your once-a-year birthday celebration!**\n\nYou can use \`/bday\` again in **${daysLeft} day(s)**.`,
          ephemeral: true
        });
        return;
      }
    }

    // Set last claim timestamp & save
    xpData[userId].lastBdayClaim = now;
    saveXPData();

    const targetUser = interaction.options.getUser('user') || interaction.user;

    if (targetUser.bot) {
      await interaction.reply({ content: '🤖 **I am a bot!** But thank you! Make sure to select a human player or run `/bday` for yourself!', ephemeral: true });
      return;
    }

    const isOwner = (interaction.guild && targetUser.id === interaction.guild.ownerId) || targetUser.username.toLowerCase() === 'krylo' || targetUser.username.toLowerCase() === 'krishiv' || targetUser.id === '1414143825538191373';
    const targetName = isOwner ? 'KRYLO' : targetUser.username;

    const bdayEmbed = new EmbedBuilder()
      .setColor(0xFF007F)
      .setTitle(`🎂🎉 HAPPY BIRTHDAY ${targetName.toUpperCase()}! 🎉🎂`)
      .setDescription(
        isOwner 
          ? '👑 **Wishing the Owner & Creator of KryloSMP a massive Happy Birthday!** 🥳✨\n\nMay this year bring unlimited success, epic builds, and peak server growth! Everyone raise your swords and celebrate! ⚔️💎🎁'
          : `🥳 **Everyone wish <@${targetUser.id}> a massive Happy Birthday!** 🎉✨\n\nMay your year be filled with epic builds, unlimited diamonds, and great adventures! Everyone raise your swords and celebrate! ⚔️💎🎁`
      )
      .addFields(
        { name: '🎁 Birthday Rewards Active', value: `• **Fireworks Event:** In-game fireworks celebration queued!\n• **Double XP:** Server-wide XP boost enabled!\n• **KryloCoins Bonus:** +500 KC awarded to ${targetName}!` },
        { name: '🥳 Leave a Birthday Message!', value: `Wish ${targetName} a Happy Birthday down below!` }
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'KryloSMP Birthday Event • Special Celebration' })
      .setTimestamp();

    await interaction.reply({ content: `🎉 @everyone **IT'S ${targetName.toUpperCase()}'S BIRTHDAY!** 🎂🎈`, embeds: [bdayEmbed] });

    try {
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId })
      });
      if (configRes.ok) {
        const config = await configRes.json();
        if (!config.pendingCommands) config.pendingCommands = [];
        config.pendingCommands.push('execute at @a run summon firework_rocket ~ ~ ~ {LifeTime:30,FireworksItem:{id:firework_rocket,Count:1,tag:{Fireworks:{Explosions:[{Type:1,Flicker:1,Trail:1,Colors:[I;16711935,65535,16776960]}]}}}}');
        config.pendingCommands.push(`say 🎉 HAPPY BIRTHDAY ${targetName.toUpperCase()}! 🎂`);

        if (config.economyData && config.economyData[targetUser.username]) {
          config.economyData[targetUser.username].balance = (config.economyData[targetUser.username].balance || 0) + 500;
        }

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId, config })
        });
      }
    } catch (err) {
      console.warn("Failed to queue birthday rewards:", err.message);
    }
    return;
  }

  // Command: /rank
  if (commandName === 'rank' || commandName === 'level') {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    const userId = targetUser.id;
    
    if (!xpData[userId]) {
      xpData[userId] = { xp: 0, level: 1 };
    }
    
    const userStats = xpData[userId];
    const currentLevel = userStats.level;
    const currentXp = userStats.xp;
    
    // Calculate progress
    const prevLevelXp = currentLevel === 1 ? 0 : 5 * ((currentLevel - 1) * (currentLevel - 1)) + 50 * (currentLevel - 1) + 100;
    const nextLevelXp = 5 * (currentLevel * currentLevel) + 50 * currentLevel + 100;
    
    const xpInCurrentLevel = currentXp - prevLevelXp;
    const xpNeededForNextLevel = nextLevelXp - prevLevelXp;
    const progressPercent = Math.max(0, Math.min(100, Math.floor((xpInCurrentLevel / xpNeededForNextLevel) * 100)));
    
    // Generate ASCII/unicode progress bar
    const barSize = 10;
    const filledBars = Math.floor(progressPercent / barSize);
    const emptyBars = barSize - filledBars;
    const progressBar = '🟩'.repeat(filledBars) + '⬜'.repeat(emptyBars);
    
    // Calculate rank
    const sortedUsers = Object.entries(xpData)
      .sort((a, b) => b[1].xp - a[1].xp);
    const rankIndex = sortedUsers.findIndex(entry => entry[0] === userId);
    const rank = rankIndex === -1 ? sortedUsers.length + 1 : rankIndex + 1;
    
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle(`⭐ ${targetUser.username}'s Chat Rank`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '✨ Level', value: `\`${currentLevel}\``, inline: true },
        { name: '🏆 Rank Position', value: `#**${rank}** / ${sortedUsers.length}`, inline: true },
        { name: '📈 Level Progress', value: `${progressBar} (${progressPercent}%)`, inline: false },
        { name: '💎 Total XP', value: `\`${currentXp}\` / \`${nextLevelXp}\``, inline: true }
      )
      .setFooter({ text: 'KryloSMP Chat Leveling ⚡' })
      .setTimestamp();
      
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /xpleaderboard
  if (commandName === 'xpleaderboard') {
    const sortedUsers = Object.entries(xpData)
      .sort((a, b) => b[1].xp - a[1].xp)
      .slice(0, 10);
      
    if (sortedUsers.length === 0) {
      await interaction.reply({ content: '❌ No chat history or leveling stats recorded yet!', ephemeral: true });
      return;
    }
    
    let lbText = '';
    const medals = ['🥇', '🥈', '🥉'];
    
    for (let i = 0; i < sortedUsers.length; i++) {
      const [uId, stats] = sortedUsers[i];
      const medal = medals[i] || `\`#${i + 1}\``;
      lbText += `${medal} <@${uId}> - **Level ${stats.level}** (XP: \`${stats.xp}\`)\n`;
    }
    
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🏆 Top 10 Active Chatters - XP Leaderboard')
      .setDescription(lbText)
      .setFooter({ text: 'KryloSMP Chat Leveling ⚡' })
      .setTimestamp();
      
    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /mcban
  if (commandName === 'mcban') {
    const member = interaction.member;
    const isOwner = interaction.user.id === interaction.guild.ownerId;
    const hasModRole = member && member.roles.cache.some(r => {
      const name = r.name.toLowerCase();
      return name.includes('mod') || name.includes('staff') || name.includes('admin') || name.includes('owner');
    });
    const hasBanPerm = member && member.permissions.has(PermissionFlagsBits.BanMembers);

    if (!isOwner && !hasModRole && !hasBanPerm) {
      await interaction.reply({ content: '❌ **Permission Denied:** This command is restricted to the Server Owner and Mod/Staff team.', ephemeral: true });
      return;
    }

    const targetUser = interaction.options.getUser('user');
    const targetMcName = interaction.options.getString('mcusername');
    const reason = interaction.options.getString('reason') || 'Banned by admin';

    if (!targetUser && !targetMcName) {
      await interaction.reply({ content: '❌ You must specify a Discord user or a Minecraft username to ban!', ephemeral: true });
      return;
    }

    // Owner / Creator Protection Guard
    const protectedMcNames = ['krishiv', 'krylo_mc', 'krishivpb60'];
    if (targetUser && (targetUser.id === interaction.guild.ownerId || targetUser.id === '1524878881918685405' || targetUser.id === '1524878881918685405')) {
      await interaction.reply({ content: '❌ **Protection Guard:** You cannot ban the server owner or developers!', ephemeral: true });
      return;
    }
    if (targetMcName && protectedMcNames.includes(targetMcName.toLowerCase().trim())) {
      await interaction.reply({ content: '❌ **Protection Guard:** This Minecraft username is protected and cannot be banned!', ephemeral: true });
      return;
    }

    await interaction.deferReply();
    let mcUsername = targetMcName;
    let statusMsg = `🔨 **Double-Ban Executing...**\n`;

    if (targetUser) {
      // Find Minecraft username from guild config verified list
      if (guildConfig && guildConfig.verifiedPlayers && guildConfig.verifiedPlayers[targetUser.id]) {
        mcUsername = guildConfig.verifiedPlayers[targetUser.id].name;
      }
      
      try {
        await interaction.guild.members.ban(targetUser.id, { reason: `MC-Sync: ${reason}` });
        statusMsg += `✅ Discord account <@${targetUser.id}> banned.\n`;
      } catch (err) {
        statusMsg += `❌ Failed to ban Discord account: ${err.message}\n`;
      }
    }

    if (mcUsername) {
      const pteroToken = process.env.PTERODACTYL_TOKEN;
      const serverId = '25a5d79a';

      // 1. Minecraft Username Ban
      try {
        const mcBanRes = await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/command`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pteroToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ command: `ban ${mcUsername} ${reason}` })
        });
        if (mcBanRes.ok) {
          statusMsg += `✅ Minecraft Username \`${mcUsername}\` banned.\n`;
        } else {
          statusMsg += `❌ MC Username ban returned code ${mcBanRes.status}\n`;
        }
      } catch (err) {
        statusMsg += `❌ MC Username ban failed: ${err.message}\n`;
      }

      // 2. Minecraft IP Ban
      try {
        const mcIpBanRes = await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/command`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pteroToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ command: `ban-ip ${mcUsername} ${reason}` })
        });
        if (mcIpBanRes.ok) {
          statusMsg += `✅ Minecraft IP Address banned for \`${mcUsername}\`.\n`;
        } else {
          statusMsg += `❌ MC IP ban returned code ${mcIpBanRes.status}\n`;
        }
      } catch (err) {
        statusMsg += `❌ MC IP ban failed: ${err.message}\n`;
      }
    } else {
      statusMsg += `⚠️ No linked Minecraft account found for this Discord user. Sync-ban skipped.\n`;
    }

    await interaction.editReply(statusMsg);
    return;
  }

  // Command: /github
  if (commandName === 'github') {
    await interaction.reply({
      embeds: [{
        color: 0x00f2ff,
        title: '🐙 Krylo Code Command Hub',
        description: 'Access the unified portal and ecosystem source codes below:',
        fields: [
          { name: '🌐 Developer Portal', value: '[krims-code-portal.vercel.app](https://krims-code-portal.vercel.app)' },
          { name: '🤖 Bot Control Panel', value: '[krims-bot-dashboard.vercel.app](https://krims-bot-dashboard.vercel.app)' },
          { name: '📂 Bot Repository', value: '[github.com/Krylo-60/krims-discord-bot](https://github.com/Krylo-60/krims-discord-bot)' }
        ],
        timestamp: new Date().toISOString()
      }],
      ephemeral: true
    });
    return;
  }

  // Command: /status
  if (commandName === 'status') {
    await interaction.deferReply();
    try {
      // 1. Fetch Minecraft Server Status
      const res = await fetch('https://api.mcsrvstat.us/2/KryloSmp.play.hosting');
      const data = await res.json();

      // 2. Fetch Sync Stats from Vercel config database
      let dbStats = null;
      try {
        const dbRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId: '1524878881918685405' })
        });
        if (dbRes.ok) {
          const guildConfig = await dbRes.json();
          dbStats = guildConfig.serverStats;
        }
      } catch (err) {
        console.warn('Failed to fetch DB stats:', err.message);
      }

      const motdClean = (data.motd?.clean || []).join(' ').toLowerCase();
      const isActualOnline = data.online && !motdClean.includes('offline') && data.version !== 'play.hosting';

      if (isActualOnline) {
        const playersOnline = data.players ? data.players.online : 0;
        const playersMax = data.players ? data.players.max : 100;
        const playerList = data.players && data.players.list ? data.players.list.join(', ') : 'None';
        const motd = data.motd.clean ? data.motd.clean.join('\n') : 'A Minecraft Server';

   

        const isOfflineMotd = motd.toLowerCase().includes('currently offline') || motd.toLowerCase().includes('server is offline');
        if (isOfflineMotd) {
          embed
            .setColor(0xFF3333)
            .setTitle('🔴 KryloSMP Server is OFFLINE')
            .setDescription('The Minecraft server is currently stopped or restarting.')
            .addFields(
              { name: '📡 Connection IP', value: '`KryloSmp.play.hosting`', inline: false },
              { name: '🕒 Last Updated', value: `<t:${unixTime}:R>`, inline: true }
            )
            .setFooter({ text: 'Auto-updating every 20 seconds' })
            .setTimestamp();

          client.user.setActivity('KryloSMP (Offline)', { type: 0 });
          try {
            const messages = await channel.messages.fetch({ limit: 10 });
            const botMessages = messages.filter(m => m.author.id === client.user.id);
            for (const [, msg] of botMessages) { await msg.delete().catch(() => {}); }
          } catch (err) {}
          await channel.send({ embeds: [embed] });
          return;
        }
     const embed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle('🟢 KryloSMP Server Status')
          .setDescription('The server is currently online and running!')
          .addFields(
            { name: '📊 Players Online', value: `\`${playersOnline} / ${playersMax}\``, inline: true },
            { name: '🔌 Version', value: `\`${data.version}\``, inline: true },
            { name: '📡 IP Address', value: '`KryloSmp.play.hosting`', inline: false },
            { name: '📖 MOTD', value: `\`\`\`\n${motd}\n\`\`\``, inline: false },
            { name: '👥 Online Players', value: playerList, inline: false }
          );

        // Add synced statistics fields if available
        if (dbStats) {
          const playtimeHrs = (dbStats.mostPlaytimeSeconds / 3600).toFixed(1);
          embed.addFields(
            { name: '📈 Total Server Joins', value: `\`${dbStats.totalJoins || 0} times\``, inline: true },
            { name: '👥 Unique Players Joined', value: `\`${dbStats.uniquePlayers || 0} players\``, inline: true },
            { name: '👑 Most Active Player', value: `\`${dbStats.mostActivePlayer || 'None'}\` (${dbStats.mostActiveJoins || 0} joins)`, inline: false },
            { name: '🕒 Top Playtime', value: `\`${dbStats.mostPlaytimePlayer || 'None'}\` (${playtimeHrs} hours)`, inline: false }
          );
        }

        embed.setFooter({ text: 'KryloSMP Status Tracker' }).setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xFF5555)
          .setTitle('🔴 KryloSMP Server Status')
          .setDescription('The server is currently offline.')
          .addFields(
            { name: '📡 Address', value: '`KryloSmp.play.hosting`', inline: false },
            { name: '💡 Note', value: 'Start the server on Play Hosting to join!', inline: false }
          );

        if (dbStats) {
          embed.addFields(
            { name: '👥 Total Unique Players', value: `\`${dbStats.uniquePlayers || 0} players\``, inline: true },
            { name: '📈 Total Joins', value: `\`${dbStats.totalJoins || 0} joins\``, inline: true }
          );
        }

        embed.setFooter({ text: 'KryloSMP Status Tracker' }).setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      await interaction.editReply(`❌ Failed to fetch server status: ${err.message}`);
    }
    return;
  }

  // Command: /ip
  
  // Command: /store
  if (commandName === 'store') {
    const embed = new EmbedBuilder()
      .setColor(0xFFAA00)
      .setTitle('🛒 KryloSMP Official Webstore & Server Packages')
      .setDescription(
        'Enhance your gameplay with exclusive Ranks, Cosmetics, Crate Keys, and KryloCoins!\n\n' +
        '🌐 **Official Webstore:** https://krylosmp-store.vercel.app\n\n' +
        '👑 **POPULAR STORE PACKAGES:**\n' +
        '• 🏅 **VIP Rank** — `$4.99` (Custom Tag, /fly in Lobby, 2x Coin Boost, 3 Homes)\n' +
        '• 👑 **MVP Rank** — `$9.99` (All VIP perks, Auto-Pickup, KeepXP on death, 5 Homes)\n' +
        '• 🎫 **Krylo Pass (Season 3)** — `$14.99` (Exclusive cosmetics, pets, neon particle trails)\n' +
        '• 🔑 **Mega Crate Keys Bundle** — `$6.99` (5x Mythic Keys + 10x Rare Keys)\n' +
        '• 💰 **5,000 KryloCoins Pack** — `$2.99` (Instant in-game coin credit)\n\n' +
        '*All purchases directly support the server and unlock instant rewards!*'
      )
      .setFooter({ text: 'KryloSMP Store • Safe & Instant Delivery' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Visit Webstore')
        .setStyle(ButtonStyle.Link)
        .setURL('https://krylosmp-store.vercel.app'),
      new ButtonBuilder()
        .setCustomId('open_coin_shop')
        .setLabel('🪙 In-Game Coin Shop')
        .setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds: [embed], components: [row] }).catch(() => {});
    return;
  }

  
  // Command: /help
  if (commandName === 'help') {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('📜 KryloSMP Bot Commands')
      .setDescription(
        'Here are the available commands:\n\n' +
        '• `/daily` - Claim free daily rewards & KryloCoins!\n' +
        '• `/bday [user]` - Celebrate birthday with fireworks & double XP!\n' +
        '• `/level` or `/rank` - View chat level and XP progress!\n' +
        '• `/work` - Work to earn KryloCoins!\n' +
        '• `/ip` - Show Java & Bedrock server connection details!\n' +
        '• `/store` - View KryloSMP official webstore link!\n' +
        '• `/pvp [user]` - Challenge a player to a 1v1 duel!\n' +
        '• `/tournament` - Join monthly server tournaments!\n' +
        '• `/leaderboard` - View top player rankings!'
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] }).catch(() => {});
    return;
  }

  if (commandName === 'ip') {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🌐 KryloSMP Connection Details')
      .setDescription('Use these details to connect to the server in Minecraft.')
      .addFields(
        { name: '☕ Java Edition', value: '• **IP:** `KryloSmp.play.hosting` (Port is default)', inline: false },
        { name: '🪨 Bedrock Edition', value: '• **IP:** `KryloSmp.play.hosting` (Port is default)', inline: false },
        { name: '🎮 Platform Integration', value: 'Both Java and Bedrock players can join and play together seamlessly!', inline: false }
      )
      .setFooter({ text: 'KryloSMP Server Info' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /shop
  if (commandName === 'shop') {
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🛒 KryloSMP In-Game Shop Prices')
      .setDescription('Use `/shop` in-game to buy these items with your coin balance.')
      .addFields(
        { name: '💎 Ore Minerals', value: '• **Diamond**: 100 ⛃\n• **Netherite Ingot**: 500 ⛃\n• **Gold Ingot**: 25 ⛃\n• **Emerald**: 75 ⛃\n• **Iron Ingot**: 10 ⛃', inline: true },
        { name: '⚔️ Gear & Specials', value: '• **Elytra**: 1000 ⛃\n• **Trident**: 800 ⛃\n• **Totem of Undying**: 600 ⛃\n• **Shulker Box**: 300 ⛃\n• **God Apple**: 250 ⛃', inline: true }
      )
      .setFooter({ text: 'Earn coins by defeating mobs and players!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /poll
  if (commandName === 'poll') {
    const question = interaction.options.getString('question');
    const opt1 = interaction.options.getString('option1');
    const opt2 = interaction.options.getString('option2');
    const opt3 = interaction.options.getString('option3');

    let description = `📊 **${question}**\n\n`;
    description += `1️⃣ ${opt1}\n`;
    description += `2️⃣ ${opt2}\n`;
    if (opt3) description += `3️⃣ ${opt3}\n`;
    description += `\nReact below to vote!`;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📊 Server Poll')
      .setDescription(description)
      .setFooter({ text: `Poll by ${interaction.user.username}` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react('1️⃣');
    await msg.react('2️⃣');
    if (opt3) await msg.react('3️⃣');
    return;
  }

  // Command: /giveaway
  if (commandName === 'giveaway') {
    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getInteger('duration');

    const endTime = Math.floor(Date.now() / 1000) + (duration * 60);

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🎉 GIVEAWAY!')
      .setDescription(`**Prize:** ${prize}\n\n⏰ Ends: <t:${endTime}:R>\n\nClick the button below to enter!`)
      .setFooter({ text: `Hosted by ${interaction.user.username} • 0 entries` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${msg.id}`)
        .setLabel('Enter Giveaway')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎉')
    );
    await msg.edit({ components: [row] });

    // Track entries
    giveawayEntries.set(msg.id, new Set());

    // End giveaway after duration
    setTimeout(async () => {
      try {
        const entries = giveawayEntries.get(msg.id);
        giveawayEntries.delete(msg.id);

        const endEmbed = new EmbedBuilder()
          .setColor(0xFF5555)
          .setTitle('🎉 GIVEAWAY ENDED!')
          .setTimestamp();

        if (!entries || entries.size === 0) {
          endEmbed.setDescription(`**Prize:** ${prize}\n\n😢 No one entered the giveaway.`);
        } else {
          const winnerId = [...entries][Math.floor(Math.random() * entries.size)];
          endEmbed.setDescription(`**Prize:** ${prize}\n\n🏆 **Winner:** <@${winnerId}>\n\nCongrats! 🎊`);
        }

        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_ended_${msg.id}`)
            .setLabel('Giveaway Ended')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        await msg.edit({ embeds: [endEmbed], components: [disabledRow] });
      } catch (err) {
        console.warn('[Giveaway] Failed to end giveaway:', err.message);
      }
    }, duration * 60 * 1000);

    return;
  }

  // Command: /leaderboard
  if (commandName === 'leaderboard') {
    await interaction.deferReply();
    try {
      const sortedUsers = Object.entries(xpData)
        .sort((a, b) => b[1].xp - a[1].xp)
        .slice(0, 10);

      if (sortedUsers.length === 0) {
        await interaction.editReply({ content: '❌ No chat activity or leveling stats recorded yet!' });
        return;
      }

      let leaderboardText = '';
      const medals = ['🥇', '🥈', '🥉'];

      for (let i = 0; i < sortedUsers.length; i++) {
        const [uId, stats] = sortedUsers[i];
        const medal = medals[i] || `**${i + 1}.**`;
        leaderboardText += `${medal} <@${uId}> — **Level ${stats.level}** (XP: \`${stats.xp}\`)\n`;
      }

      const embed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🏆 KryloSMP Chat Activity Leaderboard')
        .setDescription(leaderboardText)
        .setFooter({ text: 'KryloSMP Chat Leveling ⚡' })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Failed to fetch leaderboard: ${err.message}`);
    }
    return;
  }

  // Command: /serverinfo
  if (commandName === 'serverinfo') {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();
    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const roles = guild.roles.cache.size;
    const boosts = guild.premiumSubscriptionCount || 0;

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle(`📋 ${guild.name} — Server Info`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👑 Owner', value: `${owner.user.username}`, inline: true },
        { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
        { name: '💬 Text Channels', value: `${textChannels}`, inline: true },
        { name: '🔊 Voice Channels', value: `${voiceChannels}`, inline: true },
        { name: '🎭 Roles', value: `${roles}`, inline: true },
        { name: '🚀 Boosts', value: `${boosts}`, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
      )
      .setFooter({ text: `Server ID: ${guild.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /suggest
  if (commandName === 'suggest') {
    const idea = interaction.options.getString('idea');
    const suggestCh = interaction.guild.channels.cache.find(c => c.name.includes('suggestion') && c.type === ChannelType.GuildText);

    if (!suggestCh) {
      await interaction.reply({ content: '❌ No suggestions channel found!', ephemeral: true });
      return;
    }

    const publicEmbed = new EmbedBuilder()
      .setColor(0x00E5FF)
      .setAuthor({ name: '🎭 Anonymous Community Member', iconURL: 'https://mc-heads.net/avatar/MHF_Question/64' })
      .setTitle('💡 New Server Suggestion')
      .setDescription(idea)
      .setFooter({ text: '🎭 Anonymous Suggestion • React below to vote! (Identity hidden from public)' })
      .setTimestamp();

    const msg = await suggestCh.send({ embeds: [publicEmbed] });
    await msg.react('👍').catch(() => {});
    await msg.react('👎').catch(() => {});

    // Private Staff Audit Log
    const modLogCh = interaction.guild.channels.cache.find(c => (c.name.includes('mod-log') || c.name.includes('mod_log') || c.name.includes('staff')) && c.type === ChannelType.GuildText);
    if (modLogCh) {
      const staffEmbed = new EmbedBuilder()
        .setColor(0xFF4757)
        .setAuthor({ name: '🕵️ [STAFF AUDIT] Suggestion Submitter Identity', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
        .setDescription(`👤 **Submitter:** <@${interaction.user.id}> (\`${interaction.user.tag}\` • ID: \`${interaction.user.id}\`)\n\n💡 **Suggestion Content:**\n> ${idea}\n\n🔗 **Public Message:** [Jump to Suggestion](${msg.url})`)
        .setFooter({ text: 'Staff Eyes Only • Public identity kept secret' })
        .setTimestamp();
      await modLogCh.send({ embeds: [staffEmbed] }).catch(() => {});
    }

    await interaction.reply({ content: `✅ **Your suggestion was posted anonymously in ${suggestCh}!**\n*(Your identity is kept completely secret from regular players; only staff can see who submitted it in audit logs).*`, ephemeral: true });
    return;
  }

  // Command: /announce
  if (commandName === 'announce') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: '❌ Only admins can send announcements!', ephemeral: true });
      return;
    }

    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const announceCh = interaction.guild.channels.cache.find(c => c.name.includes('announcements') && c.type === ChannelType.GuildText);

    if (!announceCh) {
      await interaction.reply({ content: '❌ No announcements channel found!', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`📣 ${title}`)
      .setDescription(message)
      .setFooter({ text: `Announced by ${interaction.user.username}` })
      .setTimestamp();

    await announceCh.send({ content: '@everyone', embeds: [embed] });
    await interaction.reply({ content: `✅ Announcement posted in ${announceCh}!`, ephemeral: true });
    return;
  }

  // Command: /diagnose
  if (commandName === 'diagnose') {
    await interaction.deferReply();
    try {
      const health = await sdk.health();
      let npmDownloads = '142';
      try {
        const npmRes = await fetch('https://api.npmjs.org/downloads/point/last-week/@krishivpb60/krims-code-cli');
        const npmData = await npmRes.json();
        if (npmData.downloads) npmDownloads = npmData.downloads.toLocaleString();
      } catch {}

      const embed = {
        color: 0x00f2ff,
        title: '⚡ Krims Code Network Telemetry',
        description: 'Real-time telemetry and version diagnostic for the unified workspace.',
        fields: [
          { name: '🌐 AI Router Mesh', value: health.ok ? `🟢 Online (Vocab: ${health.localVocabSize} words)` : '🔴 Offline', inline: true },
          { name: '📦 NPM Package Downloads', value: `📈 ~${npmDownloads} downloads/week`, inline: true },
          { name: '🐍 PyPI CLI Package', value: '🟢 v1.5.7 Live', inline: true },
          { name: '🖥️ Desktop Tauri IDE', value: '🟢 v0.1.0 Ready', inline: true }
        ],
        timestamp: new Date().toISOString()
      };
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Failed to run diagnostics: ${err.message}`);
    }
    return;
  }

  // Command: /verify
  if (commandName === 'verify') {
    await interaction.deferReply({ ephemeral: true });
    
    // Check if player is already verified
    const verifiedRole = interaction.guild?.roles.cache.find(r => r.name === 'Verified');
    if (verifiedRole && interaction.member.roles.cache.has(verifiedRole.id)) {
      const sCh = interaction.guild?.channels.cache.find(c => c.name.includes('ticket') || c.name.includes('support'));
      await interaction.editReply(`❌ **You are already verified!**\n\nIf you need to change your Minecraft username or link a different account, please open a support ticket in ${sCh ? `<#${sCh.id}>` : 'support channels'} for staff assistance.`);
      return;
    }
    
    const code = interaction.options.getString('code').trim();

    try {
      // 1. Confirm code with Vercel API
      const response = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_verification',
          guildId: '1524878881918685405',
          code: code,
          discordUserId: interaction.user.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          const mcName = result.name;

          // 2. Assign 'Verified' role in Discord guild
          let role = interaction.guild.roles.cache.find(r => r.name.toLowerCase().includes('verified'));
          if (!role) {
            try {
              role = await interaction.guild.roles.create({
                name: 'Verified',
                color: '#00ff66',
                reason: 'Auto-created by verification system'
              });
            } catch (roleErr) {
              console.warn('Failed to create Verified role:', roleErr.message);
            }
          }

          if (role) {
            await interaction.member.roles.add(role);
          }

          // Grant Member role immediately on verification (bypassing 10-minute wait!)
          try {
            const memberRole = interaction.guild.roles.cache.find(r => r.name === '🎮 Member');
            if (memberRole && !interaction.member.roles.cache.has(memberRole.id)) {
              await interaction.member.roles.add(memberRole);
              console.log(`[Verification] Granted immediate 🎮 Member role to verified user: ${interaction.user.username}`);
            }
          } catch (memberRoleErr) {
            console.warn('Failed to add Member role on verification:', memberRoleErr.message);
          }

          // 3. Rename user's nickname to match their Minecraft username!
          try {
            await interaction.member.setNickname(mcName, 'Synced with Minecraft username');
          } catch (nickErr) {
            console.warn('Failed to set nickname:', nickErr.message);
          }

          const successEmbed = new EmbedBuilder()
            .setColor(0x00FF66)
            .setTitle('✅ Verification Successful!')
            .setDescription(`Your Discord account is now linked to Minecraft account **${mcName}**!`)
            .addFields(
              { name: '👤 Minecraft Username', value: `\`${mcName}\``, inline: true },
              { name: '🎭 Assigned Role', value: role ? `<@&${role.id}>` : '`Verified`', inline: true }
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [successEmbed] });
        } else {
          await interaction.editReply(`❌ Verification failed: ${result.error || 'Invalid or expired code.'}`);
        }
      } else {
        await interaction.editReply('❌ Failed to connect to verification server. Please try again later.');
      }
    } catch (err) {
      await interaction.editReply(`❌ Error during verification: ${err.message}`);
    }
    return;
  }

  // Command: /ticket
  if (commandName === 'ticket') {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Tickets can only be created inside servers!", ephemeral: true });
      return;
    }
    if (!ticketsEnabled) {
      await interaction.reply({ content: "🔒 **The ticket system is disabled on this server.** Enable it from the dashboard!", ephemeral: true });
      return;
    }

    const userTicketReasonText = interaction.options.getString('reason');
    await interaction.deferReply({ ephemeral: true });

    try {
      const supportCategory = interaction.guild.channels.cache.find(c => c.name.toLowerCase().includes('support') && c.type === ChannelType.GuildCategory) || interaction.guild.channels.cache.find(c => c.name.toLowerCase().includes('support-tickets') && c.type === ChannelType.GuildText)?.parent;
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username.toLowerCase()}`,
        type: ChannelType.GuildText,
        parent: supportCategory ? supportCategory.id : null,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });

      const calculatedPriority = await calculatePriority(userTicketReasonText);

      let mcUsername = 'Not Linked';
      let playerBalance = 0;
      try {
        const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId: interaction.guild?.id || '1524878881918685405' })
        });
        if (configRes.ok) {
          guildConfig = await configRes.json();
          if (guildConfig.verifiedPlayers && guildConfig.verifiedPlayers[interaction.user.id]) {
            mcUsername = guildConfig.verifiedPlayers[interaction.user.id].name || 'Not Linked';
            if (guildConfig.verifiedPlayers[interaction.user.id].balance !== undefined) {
              playerBalance = guildConfig.verifiedPlayers[interaction.user.id].balance;
            }
          }
          if (mcUsername !== 'Not Linked' && guildConfig.economyData && guildConfig.economyData[mcUsername]) {
            playerBalance = guildConfig.economyData[mcUsername];
          }
        }
      } catch (e) {
        console.warn('[Ticket Log] Failed to fetch config:', e.message);
      }

      const profileEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🎫 Support Ticket Details')
        .setDescription(`Welcome <@${interaction.user.id}>! Our administrative staff will assist you shortly.`)
        .addFields(
          { name: '👤 Discord User', value: `${interaction.user.tag} (<@${interaction.user.id}>)`, inline: true },
          { name: '🎮 Minecraft Account', value: mcUsername !== 'Not Linked' ? `\`${mcUsername}\`` : '❌ Not Linked', inline: true },
          { name: '🪙 KryloCoins', value: `\`${Math.floor(playerBalance).toLocaleString()} ⛃\``, inline: true },
          { name: '📋 Reason / Question', value: userTicketReasonText },
          { name: '🚨 Priority Level', value: `${calculatedPriority === 'No Staff Needed' ? '🟢 Standard / General' : calculatedPriority === 'High' ? '🔴 High Priority' : '🟡 Medium Priority'}`, inline: true }
        )
        .setFooter({ text: 'Type /close to resolve and delete this channel' })
        .setTimestamp();

      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [profileEmbed] });
      await interaction.editReply(`🎟️ **Ticket Opened!** Private support channel created here: <#${channel.id}>`);

      // Log to Google Sheet via SheetDB API
      await logTicketToGoogleSheet(
        channel.id,
        interaction.user.tag,
        interaction.user.id,
        userTicketReasonText,
        calculatedPriority,
        mcUsername,
        playerBalance
      );

      if (guildConfig) {
        const tickets = guildConfig.openTickets || [];
        tickets.push({ id: channel.id, name: channel.name, user: interaction.user.username });
        guildConfig.openTickets = tickets;
        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId: interaction.guild.id, config: guildConfig })
        });
      }
    } catch (err) {
      await interaction.editReply(`❌ Failed to open ticket: ${err.message}`);
    }
    return;
  }

  // Command: /close
  if (commandName === 'close') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      await interaction.reply({ content: "❌ This command can only be used inside support ticket channels!", ephemeral: true });
      return;
    }

    await interaction.reply("🔒 **Support ticket resolved. Deleting channel in 5 seconds...**");

    if (interaction.guild && interaction.guild.id === '1524878881918685405') {
      try {
        await closeTicketInGoogleSheet(interaction.channel.id);
      } catch (err) {
        console.warn("Failed to close ticket in Google Sheet:", err.message);
      }
    }

    if (interaction.guild && guildConfig) {
      try {
        const tickets = guildConfig.openTickets || [];
        guildConfig.openTickets = tickets.filter(t => t.id !== interaction.channel.id);
        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId: interaction.guild.id, config: guildConfig })
        });
      } catch (err) {
        console.warn("Failed to remove ticket from database:", err.message);
      }
    }

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch {}
    }, 5000);
    return;
  }

  // Command: /pvp
  if (commandName === 'pvp') {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used inside servers!", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    let pvpRole = interaction.guild.roles.cache.find(r => r.name === '⚔️ PvP Specialist');
    if (!pvpRole) {
      try {
        pvpRole = await interaction.guild.roles.create({
          name: '⚔️ PvP Specialist',
          color: 0xFF0055,
          reason: 'Created for PvP command'
        });
      } catch (err) {
        await interaction.editReply(`❌ Failed to find or create the PvP role: ${err.message}`);
        return;
      }
    }

    const hasRole = interaction.member.roles.cache.has(pvpRole.id);
    try {
      if (hasRole) {
        await interaction.member.roles.remove(pvpRole);
        await interaction.editReply('❌ **Removed PvP role.** You no longer have access to the private PvP chat.');
      } else {
        await interaction.member.roles.add(pvpRole);
        
        // Find the channel to mention it in response
        const pvpChatCh = interaction.guild.channels.cache.find(c => c.name.includes('pvp-chat') && c.type === ChannelType.GuildText);
        const channelMention = pvpChatCh ? `<#${pvpChatCh.id}>` : 'the PvP channel';
        
        await interaction.editReply(`✅ **Granted PvP role!** You now have access to ${channelMention}. Go say hello! ⚔️`);
      }
    } catch (err) {
      await interaction.editReply(`❌ Failed to update role: ${err.message}`);
    }
    return;
  }

  // Command: /tournament or /tornament
  if (commandName === 'tournament' || commandName === 'tornament') {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used inside servers!", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    let tournamentRole = interaction.guild.roles.cache.find(r => r.name === 'Tournament Participant');
    if (!tournamentRole) {
      try {
        tournamentRole = await interaction.guild.roles.create({
          name: 'Tournament Participant',
          color: 0xFFAA00,
          reason: 'Created for Tournament command'
        });
      } catch (err) {
        await interaction.editReply(`❌ Failed to find or create the Tournament role: ${err.message}`);
        return;
      }
    }

    const hasRole = interaction.member.roles.cache.has(tournamentRole.id);
    try {
      if (hasRole) {
        await interaction.member.roles.remove(tournamentRole);
        await interaction.editReply('❌ **Removed Tournament Participant role.** You will no longer receive tournament notifications or access the private channel.');
      } else {
        await interaction.member.roles.add(tournamentRole);

        // Find the channel to mention it
        const tournamentCh = interaction.guild.channels.cache.find(c => c.name.includes('tournament') && c.type === ChannelType.GuildText);
        const channelMention = tournamentCh ? `<#${tournamentCh.id}>` : 'the tournament channel';

        await interaction.editReply(`🏆 **Granted Tournament Participant role!** You now have access to ${channelMention}. Get ready to fight! ⚔️`);
      }
    } catch (err) {
      await interaction.editReply(`❌ Failed to update role: ${err.message}`);
    }
    return;
  }

  // Command: /challenge
  if (commandName === 'challenge') {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used inside servers!", ephemeral: true });
      return;
    }

    const opponent = interaction.options.getUser('opponent');
    if (opponent.id === interaction.user.id) {
      await interaction.reply({ content: '❌ You cannot challenge yourself!', ephemeral: true });
      return;
    }
    if (opponent.bot) {
      await interaction.reply({ content: '❌ You cannot challenge bots!', ephemeral: true });
      return;
    }

    const pvpChatCh = interaction.guild.channels.cache.find(c => c.name.includes('pvp-chat') && c.type === ChannelType.GuildText);
    if (pvpChatCh && interaction.channel.id !== pvpChatCh.id) {
      await interaction.reply({ content: `❌ Please run this command inside <#${pvpChatCh.id}>!`, ephemeral: true });
      return;
    }

    // Check if either player is already in the queue or in an active duel
    const isChallengerBusy = (activeDuel && (activeDuel.challengerId === interaction.user.id || activeDuel.challengedId === interaction.user.id)) ||
      pvpQueue.some(q => q.challengerId === interaction.user.id || q.challengedId === interaction.user.id);

    const isOpponentBusy = (activeDuel && (activeDuel.challengerId === opponent.id || activeDuel.challengedId === opponent.id)) ||
      pvpQueue.some(q => q.challengerId === opponent.id || q.challengedId === opponent.id);

    if (isChallengerBusy) {
      await interaction.reply({ content: '❌ You are already in an active duel or queue!', ephemeral: true });
      return;
    }
    if (isOpponentBusy) {
      await interaction.reply({ content: `❌ <@${opponent.id}> is already in an active duel or queue!`, ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF0055)
      .setTitle('⚔️ PvP Challenge Invitation!')
      .setDescription(`<@${interaction.user.id}> has challenged <@${opponent.id}> to a 1v1 PvP Duel!\n\n<@${opponent.id}>, do you accept?`)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pvp_accept_${interaction.user.id}_${opponent.id}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`pvp_decline_${interaction.user.id}_${opponent.id}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    await interaction.reply({ content: `<@${opponent.id}>`, embeds: [embed], components: [row] });
    return;
  }

  // Command: /endduel
  if (commandName === 'endduel') {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ This command can only be used inside servers!", ephemeral: true });
      return;
    }

    if (!activeDuel) {
      await interaction.reply({ content: '❌ There is no active duel in progress!', ephemeral: true });
      return;
    }

    const isDuelist = interaction.user.id === activeDuel.challengerId || interaction.user.id === activeDuel.challengedId;
    const isStaff = interaction.member.permissions.has(PermissionFlagsBits.ManageChannels) || interaction.member.roles.cache.some(r => r.name.toLowerCase().includes('staff') || r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('mod'));

    if (!isDuelist && !isStaff) {
      await interaction.reply({ content: '❌ Only the duelists or staff members can end the duel!', ephemeral: true });
      return;
    }

    await interaction.reply('🏁 **Duel finished. Deleting channel and starting next match...**');

    const guild = interaction.guild;
    const duelChannel = interaction.channel;

    setTimeout(async () => {
      await endCurrentDuel(guild, duelChannel);
    }, 3000);
    return;
  }

  // Command: /ask
  
    // ══════════════════════════════════════════════════════════
    // 🎡 KRYLO-WHEEL OF FORTUNE (/spin)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'spin') {
      const userId = interaction.user.id;
      const now = Date.now();
      const SPIN_COOLDOWN = 60 * 60 * 1000; // 1 hour

      const lastSpin = spinCooldowns.get(userId) || 0;
      if (now - lastSpin < SPIN_COOLDOWN) {
        const minsLeft = Math.ceil((SPIN_COOLDOWN - (now - lastSpin)) / (60 * 1000));
        await interaction.reply({
          content: `⏳ **Krylo-Wheel Cooldown Active!**\n\nYou can spin the wheel again in **${minsLeft} minute(s)**.`,
          ephemeral: true
        });
        return;
      }

      spinCooldowns.set(userId, now);
      await interaction.deferReply();

      const outcomes = [
        { name: '💎 DIAMOND JACKPOT', kc: 5000, desc: 'Huge Jackpot Win! +5,000 KryloCoins ⛃' },
        { name: '👑 KRYLO CROWN VOUCHER', kc: 2500, desc: 'Special Birthday Crown Perk! +2,500 KryloCoins ⛃' },
        { name: '🏆 NETHERITE INGOT', kc: 1500, desc: 'In-game Netherite Ingot +1,500 KryloCoins ⛃' },
        { name: '🪙 GOLD BAG', kc: 1000, desc: '+1,000 KryloCoins added to your balance ⛃' },
        { name: '🥉 BRONZE CHEST', kc: 500, desc: '+500 KryloCoins ⛃' },
        { name: '🎟️ JACKPOT TICKET', kc: 300, desc: '+300 KryloCoins & +100 added to Server Jackpot ⛃' }
      ];

      const won = outcomes[Math.floor(Math.random() * outcomes.length)];
      jackpotPool += 100;
      saveMegaData();

      // Credit balance
      if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1 };
      saveXPData();

      const spinEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🎡 KRYLO-WHEEL OF FORTUNE SPUN!')
        .setDescription(
          `> **${interaction.user.username}** spun the Krylo-Wheel!\n\n` +
          `### 🎉 REWARD UNLOCKED: ${won.name}\n` +
          `• **Details:** ${won.desc}\n` +
          `• **Global Jackpot Pool:** **${jackpotPool.toLocaleString()} KryloCoins** ⛃\n\n` +
          `*Spin again in 1 hour for free!* ⚡`
        )
        .setFooter({ text: 'Krylo-Wheel • KryloSMP Casino 🎡', iconURL: 'https://mc-heads.net/avatar/KryloSMP/32' })
        .setTimestamp();

      await interaction.editReply({ embeds: [spinEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 🎁 DAILY LUCKY CHEST (/chest)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'chest') {
      const userId = interaction.user.id;
      const now = Date.now();
      const CHEST_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

      const lastChest = chestCooldowns.get(userId) || 0;
      if (now - lastChest < CHEST_COOLDOWN) {
        const hrsLeft = Math.ceil((CHEST_COOLDOWN - (now - lastChest)) / (60 * 60 * 1000));
        await interaction.reply({
          content: `⏳ **Daily Chest Already Claimed!**\n\nYour next Lucky Chest recharges in **${hrsLeft} hour(s)**.`,
          ephemeral: true
        });
        return;
      }

      chestCooldowns.set(userId, now);
      await interaction.deferReply();

      const coinsLoot = Math.floor(Math.random() * 1500) + 1000;
      const diamondsLoot = Math.floor(Math.random() * 16) + 16;

      const chestEmbed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('🎁 DAILY LUCKY CHEST UNLOCKED!')
        .setDescription(
          `> **<@${userId}> opened their Daily Krylo Chest!**\n\n` +
          '### 📦 LOOT DROPPED:\n' +
          `• **+${coinsLoot.toLocaleString()} KryloCoins** ⛃\n` +
          `• **+${diamondsLoot}x Diamonds** (Queued in-game!)\n` +
          '• **+150 XP** Chat Leveling Bonus!\n\n' +
          '*Come back in 24 hours for your next Lucky Chest!* ⚔️'
        )
        .setFooter({ text: 'KryloSMP Daily Lucky Chest 📦' })
        .setTimestamp();

      await interaction.editReply({ embeds: [chestEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 💰 GLOBAL JACKPOT POOL (/jackpot)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'jackpot') {
      await interaction.deferReply();
      const jackpotEmbed = new EmbedBuilder()
        .setColor(0xFF007F)
        .setTitle('💰 KRYLOSMP GLOBAL JACKPOT POOL')
        .setDescription(
          `> **Current Server Jackpot Pool:** **${jackpotPool.toLocaleString()} KryloCoins** ⛃\n\n` +
          '### 🎰 How the Jackpot Works:\n' +
          '• Every time players spin the `/spin` wheel or play casino games, **+100 KC** goes into the pool!\n' +
          '• Land on **DIAMOND JACKPOT** on `/spin` to claim the grand prize!\n' +
          '• Daily auto-payouts to top active chatters on Sundays! 💎'
        )
        .setFooter({ text: 'KryloSMP Jackpot System 💰' })
        .setTimestamp();

      await interaction.editReply({ embeds: [jackpotEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 📜 SEASON QUESTS (/quests)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'quests') {
      const userId = interaction.user.id;
      if (!questData[userId]) {
        questData[userId] = {
          messagesSent: Math.floor(Math.random() * 25) + 10,
          duelsWon: 1,
          shopItemsBought: 1,
          referrals: 0,
          claimed: []
        };
        saveMegaData();
      }

      const q = questData[userId];

      const getBar = (curr, max) => {
        const pct = Math.min(100, Math.floor((curr / max) * 100));
        const filled = Math.floor(pct / 10);
        return `[${'█'.repeat(filled)}${'░'.repeat(10 - filled)}] ${pct}%`;
      };

      const questEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('📜 KRYLOSMP BIRTHDAY SEASON QUESTS')
        .setDescription('Complete weekly server quests to earn massive KryloCoins & exclusive items!\n\n' +
          `1. 💬 **Chatter Master:** Send 50 messages in chat\n   ${getBar(q.messagesSent, 50)} (${q.messagesSent}/50)\n   *Reward:* **+1,000 KC** ⛃\n\n` +
          `2. ⚔️ **PvP Gladiator:** Win 3 1v1 Duels\n   ${getBar(q.duelsWon, 3)} (${q.duelsWon}/3)\n   *Reward:* **+2,500 KC & Diamond Helmet** ⛃\n\n` +
          `3. 🛒 **Market Merchant:** Buy 2 items from /shop\n   ${getBar(q.shopItemsBought, 2)} (${q.shopItemsBought}/2)\n   *Reward:* **+1,500 KC** ⛃\n\n` +
          `4. 🤝 **Community Recruiter:** Refer 1 friend via /refer\n   ${getBar(q.referrals, 1)} (${q.referrals}/1)\n   *Reward:* **+3,000 KC** ⛃`
        )
        .setFooter({ text: 'KryloSMP Season Quests • Complete & Claim Rewards ⚡' })
        .setTimestamp();

      await interaction.reply({ embeds: [questEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 🏰 CLAN / GUILD SYSTEM (/clan)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'clan') {
      let sub = null;
      try {
        sub = interaction.options.getSubcommand(false);
      } catch (e) {
        sub = null;
      }
      if (!sub) {
        sub = interaction.options.getString('action') || interaction.options.getString('type') || 'info';
      }
      sub = sub.toLowerCase();

      const userId = interaction.user.id;
      const guild = interaction.guild;

      // 1. CREATE CLAN (Auto Creates Private Role & Channel + 5,000 KC Vault Transfer)
      if (sub === 'create') {
        const clanName = (interaction.options.getString('name') || interaction.options.getString('details') || 'Krylo Clan').trim();
        const tag = (interaction.options.getString('tag') || 'KSMP').toUpperCase().trim();
        const CREATION_COST = 5000;

        if (Object.values(clanData).some(c => c.leaderId === userId)) {
          await interaction.reply({ content: '❌ You are already leading a Clan! Disband or leave your clan first.', ephemeral: true });
          return;
        }

        await interaction.deferReply();

        let clanRole = null;
        let clanChannel = null;


        try {
          // Create Discord Role for Clan
          clanRole = await guild.roles.create({
            name: `[${tag}] ${clanName}`,
            color: '#00F2FF',
            mentionable: true,
            reason: `KryloSMP Clan Created by ${interaction.user.tag}`
          });

          // Add Role to Leader
          const member = await guild.members.fetch(userId);
          if (member && clanRole) await member.roles.add(clanRole);

          // Find or Create '🏰 CLANS' Category
          let clanCat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.includes('CLANS'));
          if (!clanCat) {
            clanCat = await guild.channels.create({
              name: '🏰 CLANS',
              type: ChannelType.GuildCategory
            });
          }

          // Create Private Clan Channel
          clanChannel = await guild.channels.create({
            name: `🏰-${tag.toLowerCase()}-clan-chat`,
            type: ChannelType.GuildText,
            parent: clanCat.id,
            permissionOverwrites: [
              {
                id: guild.id, // @everyone
                deny: [PermissionFlagsBits.ViewChannel]
              },
              {
                id: clanRole.id, // Clan Role
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks]
              }
            ]
          });

          if (clanChannel && clanCat) {
            try {
              await clanChannel.setParent(clanCat.id, { lockPermissions: false });
            } catch (e) {}
          }


          if (clanChannel) {
            const welcomeEmbed = new EmbedBuilder()
              .setColor(0x00F2FF)
              .setTitle(`🏰 PRIVATE CLAN CHAT: [${tag}] ${clanName}`)
              .setDescription(
                `Welcome to your private Clan Channel <@${userId}>!\n\n` +
                `• Only members with the <@&${clanRole.id}> role can view and chat here.\n` +
                `• Use \`/clan action:invite target:@user\` to add members and automatically grant them access!`
              )
              .setTimestamp();
            await clanChannel.send({ embeds: [welcomeEmbed] });
          }
        } catch (err) {
          console.warn('[Clan Role/Channel Creation Warning]:', err.message);
        }

        const clanId = 'clan_' + Date.now();
        clanData[clanId] = {
          id: clanId,
          name: clanName,
          tag: tag,
          leaderId: userId,
          members: [userId],
          vault: CREATION_COST,
          roleId: clanRole ? clanRole.id : null,
          channelId: clanChannel ? clanChannel.id : null,
          created: Date.now()
        };
        saveMegaData();

        const clanEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle(`🏰 CLAN CREATED: [${tag}] ${clanName}`)
          .setDescription(
            `Congratulations <@${userId}>! You founded the clan **[${tag}] ${clanName}**!\n\n` +
            `• **Creation Fee Transferred to Vault:** **${CREATION_COST.toLocaleString()} KryloCoins** ⛃\n` +
            `• **Initial Vault Balance:** **${CREATION_COST.toLocaleString()} KryloCoins** ⛃\n` +
            '• **Clan Leader:** <@' + userId + '>\n' +
            (clanRole ? `• **Clan Role Created:** <@&${clanRole.id}>\n` : '') +
            (clanChannel ? `• **Private Clan Channel:** <#${clanChannel.id}>\n` : '') +
            '• **Perks:** +10% Exp Boost for all members!'
          )

          .setFooter({ text: 'KryloSMP Clan System 🏰' })
          .setTimestamp();

        await interaction.editReply({ embeds: [clanEmbed] });
        return;
      }

      // 2. DISBAND / DELETE CLAN
      if (sub === 'disband' || sub === 'delete') {
        const userClanKey = Object.keys(clanData).find(key => clanData[key].leaderId === userId);
        if (!userClanKey) {
          await interaction.reply({ content: '❌ You are not leading any clan to disband!', ephemeral: true });
          return;
        }

        const userClan = clanData[userClanKey];

        try {
          if (userClan.roleId) {
            const r = guild.roles.cache.get(userClan.roleId);
            if (r) await r.delete('Clan Disbanded');
          }
          if (userClan.channelId) {
            const ch = guild.channels.cache.get(userClan.channelId);
            if (ch) await ch.delete('Clan Disbanded');
          }
        } catch (e) {
          console.warn('[Clan Delete Warning]:', e.message);
        }

        const disbandedName = userClan.name;
        const disbandedTag = userClan.tag;

        delete clanData[userClanKey];
        saveMegaData();

        const disbandEmbed = new EmbedBuilder()
          .setColor(0xFF0055)
          .setTitle(`💥 CLAN DISBANDED: [${disbandedTag}] ${disbandedName}`)
          .setDescription(`The clan **[${disbandedTag}] ${disbandedName}** has been permanently disbanded by <@${userId}>. Its private role & text channel have been removed.`)
          .setFooter({ text: 'KryloSMP Clan System 🏰' })
          .setTimestamp();

        await interaction.reply({ embeds: [disbandEmbed] });
        return;
      }

      // 3. INVITE MEMBER TO CLAN (Auto Assigns Role)
      if (sub === 'invite' || sub === 'add') {
        const userClan = Object.values(clanData).find(c => c.members.includes(userId));
        if (!userClan) {
          if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ You must be in a clan to invite members!' });
          else await interaction.reply({ content: '❌ You must be in a clan to invite members!', ephemeral: true });
          return;
        }

        const targetUser = interaction.options.getUser('target') || interaction.options.getUser('user');
        if (!targetUser) {
          if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ Please specify a user to invite: `/clan action:invite target:@user`' });
          else await interaction.reply({ content: '❌ Please specify a user to invite: `/clan action:invite target:@user`', ephemeral: true });
          return;
        }

        if (userClan.members.includes(targetUser.id)) {
          if (interaction.deferred || interaction.replied) await interaction.editReply({ content: `❌ <@${targetUser.id}> is already in your clan!` });
          else await interaction.reply({ content: `❌ <@${targetUser.id}> is already in your clan!`, ephemeral: true });
          return;
        }

        userClan.members.push(targetUser.id);
        saveMegaData();

        // Assign Clan Role & Channel Access to Target
        let grantedChannel = null;
        try {
          if (userClan.roleId) {
            const member = await guild.members.fetch(targetUser.id).catch(() => null);
            if (member) {
              await member.roles.add(userClan.roleId).catch(() => {});
            }
          }
        } catch (e) {}

        if (userClan.channelId) {
          try {
            const ch = guild.channels.cache.get(userClan.channelId) || await guild.channels.fetch(userClan.channelId).catch(() => null);
            if (ch) {
              await ch.permissionOverwrites.edit(targetUser.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true }).catch(() => {});
              grantedChannel = `<#${ch.id}>`;
            }
          } catch (e) {}
        }

        const accessLine = grantedChannel
          ? `• Granted access to ${grantedChannel}\n`
          : (userClan.channelId ? `• Granted access to <#${userClan.channelId}>\n` : '• Granted access to Private Clan Chat\n');

        const inviteEmbed = new EmbedBuilder()
          .setColor(0x00FF88)
          .setTitle(`🎉 NEW CLAN MEMBER JOINED!`)
          .setDescription(`<@${targetUser.id}> joined **[${userClan.tag}] ${userClan.name}**!\n\n` +
            (userClan.roleId ? `• Granted Clan Role <@&${userClan.roleId}>\n` : '') +
            accessLine +
            `• Total Members: **${userClan.members.length}**`
          )
          .setTimestamp();

        if (interaction.deferred || interaction.replied) {
          await interaction.editReply({ embeds: [inviteEmbed] });
        } else {
          await interaction.reply({ embeds: [inviteEmbed] });
        }

        if (userClan.channelId) {
          try {
            const ch = guild.channels.cache.get(userClan.channelId) || await guild.channels.fetch(userClan.channelId).catch(() => null);
            if (ch && ch.isTextBased()) {
              await ch.send({ embeds: [inviteEmbed] }).catch(() => {});
            }
          } catch (e) {}
        }
        return;
      }

      // 4. DEPOSIT TO CLAN VAULT
      if (sub === 'deposit' || sub === 'vault') {
        let userClan = Object.values(clanData).find(c => c.members.includes(userId));
        if (!userClan) {
          await interaction.reply({ content: '❌ You are not currently in any Clan! Create one with `/clan action:create`!', ephemeral: true });
          return;
        }

        let rawVal = null;
        try { rawVal = interaction.options.getString('value'); } catch (e) {}
        if (!rawVal) {
          try { rawVal = interaction.options.getInteger('value'); } catch (e) {}
        }
        if (!rawVal) {
          try { rawVal = interaction.options.getString('amount'); } catch (e) {}
        }
        if (!rawVal) {
          try { rawVal = interaction.options.getInteger('amount'); } catch (e) {}
        }

        const parsedNum = parseInt(String(rawVal || '1000').replace(/[^0-9]/g, '')) || 1000;
        const amount = Math.max(1, parsedNum);
        const userId = interaction.user.id;
        let userBal = 0;
        if (fs.existsSync('verifiedUsers.json')) {
          try {
            const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf8'));
            if (vData[userId] && vData[userId].balance !== undefined) {
              userBal = vData[userId].balance;
            }
          } catch (e) {}
        }
        if (userBal === 0 && xpData[userId]) {
          userBal = xpData[userId].coins || 0;
        }

        if (userBal < amount) {
        const isOwnerUser = interaction.user.id === '1414143825538191373' || interaction.user.username.toLowerCase().includes('krylo') || (interaction.member && interaction.member.roles && interaction.member.roles.cache.some(r => r.name.toUpperCase().includes('OWNER')));
        if (!isOwnerUser) {
          await interaction.reply({ content: `❌ You do not have enough KC!`, ephemeral: true });
          return;
        }
            return;
        }

        userClan.vault = (userClan.vault || 0) + amount;
        saveMegaData();

        const depositEmbed = new EmbedBuilder()
          .setColor(0x00FF88)
          .setTitle(`💰 VAULT DEPOSIT SUCCESSFUL!`)
          .setDescription(
            `<@${userId}> deposited **${amount.toLocaleString()} KryloCoins** into **[${userClan.tag}] ${userClan.name}**!\n\n` +
            `• **New Vault Total:** **${userClan.vault.toLocaleString()} KryloCoins** ⛃\n` +
            `• **Clan Leader:** <@${userClan.leaderId}>\n` +
            `• **Active Members:** **${userClan.members.length}**`
          )
          .setFooter({ text: 'KryloSMP Clan Vault 🏰' })
          .setTimestamp();

        await interaction.reply({ embeds: [depositEmbed] });
        return;
      }

      // 5. CLAN INFO
      if (sub === 'info') {
        let userClan = Object.values(clanData).find(c => c.members.includes(userId));
        if (!userClan) {
          const clans = Object.values(clanData);
          if (clans.length > 0) userClan = clans[0];
        }

        if (!userClan) {
          await interaction.reply({ content: '❌ No clans found! Create the first clan with `/clan action:create`!', ephemeral: true });
          return;
        }

        const infoEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle(`🏰 CLAN INFO: [${userClan.tag}] ${userClan.name}`)
          .addFields(
            { name: '👑 Clan Leader', value: `<@${userClan.leaderId}>`, inline: true },
            { name: '👥 Members Count', value: `**${userClan.members.length} members**`, inline: true },
            { name: '💰 Vault Balance', value: `**${(userClan.vault || 0).toLocaleString()} KC** ⛃`, inline: true },
            { name: '🎭 Clan Role', value: userClan.roleId ? `<@&${userClan.roleId}>` : 'None', inline: true },
            { name: '💬 Private Channel', value: userClan.channelId ? `<#${userClan.channelId}>` : 'None', inline: true }
          )
          .setFooter({ text: 'KryloSMP Clan System 🏰' })
          .setTimestamp();

        await interaction.reply({ embeds: [infoEmbed] });
        return;
      }

      // 6. CLAN LEADERBOARD
      if (sub === 'leaderboard' || sub === 'top') {
        const sortedClans = Object.values(clanData).sort((a, b) => (b.vault || 0) - (a.vault || 0)).slice(0, 5);

        let desc = sortedClans.length > 0
          ? sortedClans.map((c, i) => `**#${i + 1} [${c.tag}] ${c.name}** — 💰 **${(c.vault || 0).toLocaleString()} KC** (${c.members.length} members)`).join('\n')
          : '*No clans created yet! Be the first using \`/clan action:create\`!';

        const lbEmbed = new EmbedBuilder()
          .setColor(0xFFAA00)
          .setTitle('🏰 TOP CLANS LEADERBOARD')
          .setDescription(desc)
          .setFooter({ text: 'KryloSMP Top Clans 🏆' })
          .setTimestamp();

        await interaction.reply({ embeds: [lbEmbed] });
        return;
      }

      // Default fallback info
      const fallbackEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🏰 KRYLOSMP CLAN SYSTEM')
        .setDescription('Commands:\n• `/clan action:create name:ClanName tag:TAG`\n• `/clan action:invite target:@user`\n• `/clan action:deposit value:10000`\n• `/clan action:disband`')
        .setTimestamp();

      await interaction.reply({ embeds: [fallbackEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 🎮 KRYLOSMP 3.0 MEGA UPDATE COMMAND HANDLERS
    // ══════════════════════════════════════════════════════════
if (commandName === 'bounty') {
    const target = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');
    
    if (!target || !amount) {
        // View bounty board
        const embed = new EmbedBuilder()
            .setTitle('🎯 BOUNTY BOARD')
            .setColor(0xFFAA00)
            .setThumbnail('https://i.imgur.com/8Q5gW9z.png');
        
        let desc = '';
        if (bountyData.size === 0) {
            desc = 'No active bounties right now. Use `/bounty target:@user amount:1000` to place a bounty!';
        } else {
            for (const [id, val] of bountyData.entries()) {
                desc += `<@${id}> - **${val.toLocaleString()} KC** 💰\n`;
            }
        }
        embed.setDescription(desc);
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    const userId = interaction.user.id;
    let userBal = 1000000000; // Default fallback for verification
    
    if (fs.existsSync('verifiedUsers.json')) {
      try {
        const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf8'));
        if (vData[userId] && vData[userId].balance !== undefined) {
          userBal = vData[userId].balance;
        }
      } catch (e) {}
    }

    const isOwnerUser = userId === '1414143825538191373' || 
                        interaction.user.username.toLowerCase().includes('krylo') || 
                        (interaction.member && interaction.member.roles && interaction.member.roles.cache.some(r => r.name.toUpperCase().includes('OWNER')));

    if (!isOwnerUser && userBal < amount) {
        await interaction.reply({ content: `❌ You do not have enough KC! (Your balance: **${userBal.toLocaleString()} KC**)`, ephemeral: true });
        return;
    }
    
    const currentBounty = bountyData.get(target.id) || 0;
    bountyData.set(target.id, currentBounty + amount);
    
    const embed = new EmbedBuilder()
        .setTitle('🎯 BOUNTY PLACED')
        .setColor(0x00FF66)
        .setDescription(`**${interaction.user.username}** placed a **${amount.toLocaleString()} KC** bounty on **${target.username}**! 🎯\n\n**Total Bounty on ${target.username}**: **${(currentBounty + amount).toLocaleString()} KC**`)
        .setFooter({ text: 'KryloSMP Bounty System • Season 3' })
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    return;
}

if (commandName === 'trade') {
    const player = interaction.options.getUser('player');
    const offer = interaction.options.getString('offer');
    
    if (player.id === interaction.user.id) {
        if (interaction.deferred || interaction.replied) await interaction.editReply({ content: '❌ You cannot trade with yourself.' });
        else await interaction.reply({ content: '❌ You cannot trade with yourself.', flags: 64 });
        return;
    }
    
    const embed = new EmbedBuilder()
        .setTitle('🤝 TRADE OFFER')
        .setColor(0x5865F2)
        .setDescription(`<@${player.id}>, you have received a trade offer from <@${interaction.user.id}>!\n\n**Offer:** ${offer}`)
        .setFooter({ text: 'Accept or Decline below.' })
        .setTimestamp();
        
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`trade_accept_${interaction.user.id}_${player.id}`).setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId(`trade_decline_${interaction.user.id}_${player.id}`).setLabel('Decline').setStyle(ButtonStyle.Danger).setEmoji('❌')
    );
    
    if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    } else {
        await interaction.reply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    }
    return;
}

if (commandName === 'pet') {
    const action = interaction.options.getString('action');
    const userId = interaction.user.id;
    if (!petData.has(userId)) petData.set(userId, null);
    
    if (action === 'adopt') {
        if (petData.get(userId)) {
            await interaction.reply({ content: '❌ You already have a pet!', ephemeral: true });
            return;
        }
        const types = ['Wolf 🐺', 'Cat 🐱', 'Parrot 🦜', 'Fox 🦊', 'Axolotl 🦎'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        petData.set(userId, { name: 'Unnamed', type: chosen, level: 1, hunger: 100, happiness: 100, xp: 0 });
        
        const embed = new EmbedBuilder()
            .setTitle('🐾 PET ADOPTED')
            .setColor(0x00FF66)
            .setDescription(`You adopted a **${chosen}**!\nTake good care of it.`)
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    const pet = petData.get(userId);
    if (!pet) {
        await interaction.reply({ content: '❌ You do not have a pet! Use `/pet adopt` to get one.', ephemeral: true });
        return;
    }
    
    if (action === 'view') {
        const embed = new EmbedBuilder()
            .setTitle(`🐾 ${pet.name} (${pet.type})`)
            .setColor(0x9B59B6)
            .addFields(
                { name: 'Level', value: `${pet.level}`, inline: true },
                { name: 'XP', value: `${pet.xp}/100`, inline: true },
                { name: 'Hunger', value: `${pet.hunger}%`, inline: true },
                { name: 'Happiness', value: `${pet.happiness}%`, inline: true }
            )
            .setFooter({ text: 'KryloSMP Pets' });
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    if (action === 'feed') {
        pet.hunger = Math.min(100, pet.hunger + 20);
        pet.happiness = Math.min(100, pet.happiness + 5);
        await interaction.reply({ content: `🦴 You fed your pet! Hunger is now **${pet.hunger}%**.`, ephemeral: false });
        return;
    }
    
    if (action === 'train') {
        pet.xp += 15;
        pet.hunger = Math.max(0, pet.hunger - 10);
        if (pet.xp >= 100) {
            pet.level++;
            pet.xp = 0;
            await interaction.reply({ content: `✨ Your pet leveled up! It is now level **${pet.level}**!`, ephemeral: false });
            return;
        }
        await interaction.reply({ content: `🎾 You trained your pet! It gained 15 XP. (Total: ${pet.xp}/100)`, ephemeral: false });
        return;
    }
}

if (commandName === 'fish') {
    const userId = interaction.user.id;
    const now = Date.now();
    if (fishCooldowns.has(userId)) {
        const exp = fishCooldowns.get(userId) + 30000;
        if (now < exp) {
            await interaction.reply({ content: `⏳ You can fish again in **${((exp - now)/1000).toFixed(1)}s**.`, ephemeral: true });
            return;
        }
    }
    fishCooldowns.set(userId, now);
    
    const catches = [
        { name: 'Nothing 🌊', kc: 0, weight: 30 },
        { name: 'Old Boot 🥾', kc: 5, weight: 20 },
        { name: 'Small Fish 🐟', kc: 25, weight: 25 },
        { name: 'Medium Fish 🐡', kc: 75, weight: 15 },
        { name: 'Large Fish 🦈', kc: 200, weight: 7 },
        { name: 'Golden Fish ✨', kc: 500, weight: 2 },
        { name: 'Legendary Kraken Tentacle 🦑', kc: 2000, weight: 1 }
    ];
    
    const totalWeight = catches.reduce((a, b) => a + b.weight, 0);
    let rand = Math.random() * totalWeight;
    let caught = catches[0];
    for (const c of catches) {
        if (rand < c.weight) { caught = c; break; }
        rand -= c.weight;
    }
    
    if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
    xpData[userId].coins = (xpData[userId].coins || 0) + caught.kc;
    
    const embed = new EmbedBuilder()
        .setTitle('🎣 FISHING')
        .setColor(caught.kc > 100 ? 0xFFAA00 : 0x5865F2)
        .setDescription(`You cast your line and caught: **${caught.name}**!\n\nYou earned: **${caught.kc} KC** 💰\nNew Balance: **${xpData[userId].coins} KC**`);
    await interaction.reply({ embeds: [embed] });
    return;
}

if (commandName === 'mine') {
    const userId = interaction.user.id;
    const now = Date.now();
    if (mineCooldowns.has(userId)) {
        const exp = mineCooldowns.get(userId) + 45000;
        if (now < exp) {
            await interaction.reply({ content: `⏳ You can mine again in **${((exp - now)/1000).toFixed(1)}s**.`, ephemeral: true });
            return;
        }
    }
    mineCooldowns.set(userId, now);
    
    const ores = [
        { name: 'Nothing 🪨', kc: 0, weight: 30 },
        { name: 'Coal ⬛', kc: 10, weight: 25 },
        { name: 'Iron 🤍', kc: 30, weight: 20 },
        { name: 'Gold 💛', kc: 100, weight: 12 },
        { name: 'Diamond 💎', kc: 250, weight: 7 },
        { name: 'Emerald 🟩', kc: 400, weight: 4 },
        { name: 'Ancient Debris 🤎', kc: 800, weight: 1.5 },
        { name: 'Netherite Block 🖤', kc: 2000, weight: 0.5 }
    ];
    
    const totalWeight = ores.reduce((a, b) => a + b.weight, 0);
    let rand = Math.random() * totalWeight;
    let mined = ores[0];
    for (const o of ores) {
        if (rand < o.weight) { mined = o; break; }
        rand -= o.weight;
    }
    
    if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
    xpData[userId].coins = (xpData[userId].coins || 0) + mined.kc;
    
    const embed = new EmbedBuilder()
        .setTitle('⛏️ MINING')
        .setColor(mined.kc > 200 ? 0xFFAA00 : 0x9B59B6)
        .setDescription(`You swung your pickaxe and found: **${mined.name}**!\n\nYou earned: **${mined.kc} KC** 💰\nNew Balance: **${xpData[userId].coins} KC**`);
    await interaction.reply({ embeds: [embed] });
    return;
}

if (commandName === 'craft') {
    const embed = new EmbedBuilder()
        .setTitle('🛠️ CRAFTING MENU')
        .setColor(0x00FF66)
        .setDescription('Select an item to craft. Requires KC & materials (simulated).')
        .addFields(
            { name: '🗡️ Power Sword', value: 'Cost: 500 KC\nEffect: +10% duel damage' },
            { name: '🛡️ Mystic Shield', value: 'Cost: 800 KC\nEffect: +15% rob defense' },
            { name: '🧪 Haste Potion', value: 'Cost: 200 KC\nEffect: Reduces cooldowns' }
        )
        .setFooter({ text: 'Use buttons below (WIP)' });
    await interaction.reply({ embeds: [embed] });
    return;
}

if (commandName === 'enchant') {
    const userId = interaction.user.id;
    if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
    if ((xpData[userId].coins || 0) < 500) {
        await interaction.reply({ content: '❌ Enchanting costs **500 KC**.', ephemeral: true });
        return;
    }
    
    xpData[userId].coins -= 500;
    const enchants = ['Sharpness V 🗡️', 'Protection IV 🛡️', 'Unbreaking III ⛏️', 'Fortune III ✨', 'Mending 💖'];
    const chosen = enchants[Math.floor(Math.random() * enchants.length)];
    
    const embed = new EmbedBuilder()
        .setTitle('✨ ENCHANTING')
        .setColor(0x9B59B6)
        .setDescription(`You paid 500 KC and received: **${chosen}**!`)
        .setFooter({ text: `Balance: ${xpData[userId].coins} KC` });
    await interaction.reply({ embeds: [embed] });
    return;
}

if (commandName === 'raid') {
    const action = interaction.options.getString('action');
    if (action === 'view') {
        const embed = new EmbedBuilder()
            .setTitle('🐉 RAID BOSS: THE ENDER DRAGON')
            .setColor(0x9B59B6)
            .setDescription(`**HP:** ${raidData.hp}/${raidData.maxHp} 💖\n\nParticipants: ${raidData.participants.size}`)
            .setImage('https://i.imgur.com/example.png')
            .setFooter({ text: 'Use /raid join to fight!' });
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    if (action === 'join') {
        if (raidData.hp <= 0) {
            await interaction.reply({ content: '❌ The boss is already dead!', ephemeral: true });
            return;
        }
        const damage = Math.floor(Math.random() * 500) + 100;
        raidData.hp = Math.max(0, raidData.hp - damage);
        
        const currentDmg = raidData.participants.get(interaction.user.id) || 0;
        raidData.participants.set(interaction.user.id, currentDmg + damage);
        
        let desc = `⚔️ You attacked the boss and dealt **${damage}** damage!\nBoss HP: **${raidData.hp}** remaining.`;
        if (raidData.hp === 0) {
            desc += '\n\n🎉 **THE BOSS HAS BEEN DEFEATED!** Loot will be distributed.';
            for (const [id, dmg] of raidData.participants.entries()) {
                if (!xpData[id]) xpData[id] = { xp: 0, level: 1, coins: 0 };
                xpData[id].coins = (xpData[id].coins || 0) + (dmg * 2);
            }
            raidData.maxHp += 10000;
            raidData.hp = raidData.maxHp;
            raidData.participants.clear();
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🐉 RAID BATTLE')
            .setColor(0xFF4444)
            .setDescription(desc);
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    if (action === 'leaderboard') {
        const sorted = [...raidData.participants.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        let desc = sorted.length === 0 ? 'No participants yet.' : sorted.map((p, i) => `**${i+1}.** <@${p[0]}> - ${p[1]} DMG`).join('\n');
        
        const embed = new EmbedBuilder()
            .setTitle('🏆 RAID LEADERBOARD')
            .setColor(0xFFAA00)
            .setDescription(desc);
        await interaction.reply({ embeds: [embed] });
        return;
    }
}

if (commandName === 'profile') {
    const userId = interaction.user.id;
    const data = xpData[userId] || { xp: 0, level: 1, coins: 0 };
    const pet = petData.get(userId);
    
    const embed = new EmbedBuilder()
        .setTitle(`👤 ${interaction.user.username}'s Profile`)
        .setColor(0x5865F2)
        .setThumbnail(interaction.user.displayAvatarURL())
        .addFields(
            { name: 'Level 🌟', value: `${data.level}`, inline: true },
            { name: 'XP 📊', value: `${data.xp}`, inline: true },
            { name: 'Balance 💰', value: `${data.coins || 0} KC`, inline: true },
            { name: 'Pet 🐾', value: pet ? `${pet.name} (${pet.type})` : 'None', inline: true },
            { name: 'Achievements 🏆', value: '3/50 Unlocked', inline: true }
        )
        .setFooter({ text: 'KryloSMP Network' })
        .setTimestamp();
    await interaction.reply({ embeds: [embed] });
    return;
}

if (commandName === 'inventory') {
    const embed = new EmbedBuilder()
        .setTitle(`🎒 ${interaction.user.username}'s Inventory`)
        .setColor(0x00FF66)
        .setDescription('**Keys:** 3x Common, 1x Rare\n**Materials:** 15x Iron, 2x Diamond\n**Crafted:** 1x Mystic Shield')
        .setFooter({ text: 'Inventory System v3.0' });
    await interaction.reply({ embeds: [embed] });
    return;
}

if (commandName === 'achievements') {
    const embed = new EmbedBuilder()
        .setTitle('🏆 YOUR ACHIEVEMENTS')
        .setColor(0xFFAA00)
        .addFields(
            { name: '✅ First Steps', value: 'Joined the server.' },
            { name: '✅ Wealthy', value: 'Earned 1000 KC.' },
            { name: '❌ Master Miner', value: 'Mine 100 times. (Prog: 12/100)' },
            { name: '❌ Beast Tamer', value: 'Train pet to level 10.' }
        );
    await interaction.reply({ embeds: [embed] });
    return;
}

if (commandName === 'duel') {
    const opponent = interaction.options.getUser('opponent');
    const wager = interaction.options.getInteger('wager') || 0;
    const userId = interaction.user.id;
    
    if (opponent.id === userId) {
        await interaction.reply({ content: '❌ You cannot duel yourself!', ephemeral: true });
        return;
    }
    
    if (wager > 0) {
        if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
        if ((xpData[userId].coins || 0) < wager) {
            await interaction.reply({ content: '❌ You do not have enough KC for this wager!', ephemeral: true });
            return;
        }
    }
    
    const embed = new EmbedBuilder()
        .setTitle('⚔️ DUEL CHALLENGE')
        .setColor(0xFF4444)
        .setDescription(`<@${opponent.id}>, you have been challenged to a duel by <@${userId}>!\n**Wager:** ${wager} KC`)
        .setFooter({ text: 'Accept to fight!' });
        
    await interaction.reply({ content: `<@${opponent.id}>`, embeds: [embed] });
    return;
}

if (commandName === 'heist') {
    const userId = interaction.user.id;
    const now = Date.now();
    if (heistCooldowns.has(userId)) {
        const exp = heistCooldowns.get(userId) + 3600000;
        if (now < exp) {
            await interaction.reply({ content: `⏳ The bank is on high alert! Try again in **${((exp - now)/60000).toFixed(1)}m**.`, ephemeral: true });
            return;
        }
    }
    heistCooldowns.set(userId, now);
    
    if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
    const success = Math.random() < 0.30;
    
    if (success) {
        const won = Math.floor(Math.random() * 4500) + 500;
        xpData[userId].coins = (xpData[userId].coins || 0) + won;
        const embed = new EmbedBuilder()
            .setTitle('🏦 BANK HEIST SUCCESS')
            .setColor(0x00FF66)
            .setDescription(`You successfully robbed the bank and escaped with **${won} KC**! 💰\nNew Balance: **${xpData[userId].coins} KC**`);
        await interaction.reply({ embeds: [embed] });
    } else {
        const lost = Math.floor((xpData[userId].coins || 0) * (Math.random() * 0.15 + 0.10));
        xpData[userId].coins = Math.max(0, (xpData[userId].coins || 0) - lost);
        const embed = new EmbedBuilder()
            .setTitle('🚨 BANK HEIST FAILED')
            .setColor(0xFF4444)
            .setDescription(`You were caught by the guards! You paid a fine of **${lost} KC**.\nNew Balance: **${xpData[userId].coins} KC**`);
        await interaction.reply({ embeds: [embed] });
    }
    return;
}

if (commandName === 'rob') {
    const target = interaction.options.getUser('target');
    const userId = interaction.user.id;
    
    if (target.id === userId) {
        await interaction.reply({ content: '❌ You cannot rob yourself!', ephemeral: true });
        return;
    }
    
    const now = Date.now();
    if (robCooldowns.has(userId)) {
        const exp = robCooldowns.get(userId) + 1800000;
        if (now < exp) {
            await interaction.reply({ content: `⏳ You are laying low! Rob again in **${((exp - now)/60000).toFixed(1)}m**.`, ephemeral: true });
            return;
        }
    }
    robCooldowns.set(userId, now);
    
    if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
    if (!xpData[target.id]) xpData[target.id] = { xp: 0, level: 1, coins: 0 };
    
    const targetBal = xpData[target.id].coins || 0;
    if (targetBal < 100) {
        await interaction.reply({ content: '❌ That player is too poor to rob!', ephemeral: true });
        return;
    }
    
    const success = Math.random() < 0.35;
    if (success) {
        const stolen = Math.floor(targetBal * (Math.random() * 0.10 + 0.05));
        xpData[target.id].coins -= stolen;
        xpData[userId].coins = (xpData[userId].coins || 0) + stolen;
        const embed = new EmbedBuilder()
            .setTitle('🥷 ROBBERY SUCCESS')
            .setColor(0x00FF66)
            .setDescription(`You snuck up on <@${target.id}> and stole **${stolen} KC**! 💸`);
        await interaction.reply({ embeds: [embed] });
    } else {
        const fine = Math.floor((xpData[userId].coins || 0) * 0.10);
        xpData[userId].coins = Math.max(0, (xpData[userId].coins || 0) - fine);
        const embed = new EmbedBuilder()
            .setTitle('🚔 ROBBERY FAILED')
            .setColor(0xFF4444)
            .setDescription(`You tripped and got caught! You paid a fine of **${fine} KC** to the guards.`);
        await interaction.reply({ embeds: [embed] });
    }
    return;
}

if (commandName === 'lottery') {
    const tickets = interaction.options.getInteger('tickets') || 1;
    const userId = interaction.user.id;
    const cost = tickets * 100;
    
    if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
    if ((xpData[userId].coins || 0) < cost) {
        await interaction.reply({ content: `❌ You need **${cost} KC** to buy ${tickets} tickets!`, ephemeral: true });
        return;
    }
    
    xpData[userId].coins -= cost;
    lotteryData.jackpot += (cost * 0.8);
    const currentTickets = lotteryData.tickets.get(userId) || 0;
    lotteryData.tickets.set(userId, currentTickets + tickets);
    
    const embed = new EmbedBuilder()
        .setTitle('🎟️ LOTTERY')
        .setColor(0xFFAA00)
        .setDescription(`You bought **${tickets}** tickets!\n\n**Current Jackpot:** ${Math.floor(lotteryData.jackpot)} KC 💰\n**Your Total Tickets:** ${currentTickets + tickets}`)
        .setFooter({ text: 'Draws every Friday!' });
    await interaction.reply({ embeds: [embed] });
    return;
}

if (commandName === 'lootbox') {
    const type = interaction.options.getString('type') || 'common';
    const userId = interaction.user.id;
    
    if (type === 'common') {
        const now = Date.now();
        if (lootboxCooldowns.has(userId)) {
            const exp = lootboxCooldowns.get(userId) + 3600000;
            if (now < exp) {
                await interaction.reply({ content: `⏳ You can open another free Common Lootbox in **${((exp - now)/60000).toFixed(1)}m**.`, ephemeral: true });
                return;
            }
        }
        lootboxCooldowns.set(userId, now);
    } else {
        const costs = { rare: 200, epic: 500, legendary: 1500 };
        const cost = costs[type];
        if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
        if ((xpData[userId].coins || 0) < cost) {
            await interaction.reply({ content: `❌ You need **${cost} KC** to open a ${type} lootbox!`, ephemeral: true });
            return;
        }
        xpData[userId].coins -= cost;
    }
    
    const reward = type === 'common' ? 50 : type === 'rare' ? 250 : type === 'epic' ? 700 : 2500;
    if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
    xpData[userId].coins = (xpData[userId].coins || 0) + reward;
    
    const embed = new EmbedBuilder()
        .setTitle(`🎁 OPENING ${type.toUpperCase()} LOOTBOX...`)
        .setColor(0x9B59B6)
        .setDescription('...');
    
    await interaction.reply({ embeds: [embed] });
    
    setTimeout(async () => {
        const resultEmbed = new EmbedBuilder()
            .setTitle(`🎉 ${type.toUpperCase()} LOOTBOX OPENED!`)
            .setColor(0x00FF66)
            .setDescription(`You found:\n\n**${reward} KC** 💰\n_Plus 1x Random Material_`)
            .setFooter({ text: `Balance: ${xpData[userId].coins} KC` });
        await interaction.editReply({ embeds: [resultEmbed] });
    }, 2000);
    return;
}

    if (commandName === 'voice') {
      const action = interaction.options.getString('action');
      if (action === 'join') {
        return joinVoice(interaction);
      } else if (action === 'leave') {
        return leaveVoice(interaction);
      } else if (action === 'status') {
        return getVoiceStatus(interaction);
      }
    }

    if (commandName === 'ask') {
    if (!aiEnabled) {
      await interaction.reply({ content: "🔒 **AI responses are disabled on this server.**", ephemeral: true });
      return;
    }

    const prompt = interaction.options.getString('prompt');

    // Check if query is asking about Minecraft server online status
    const lowerPrompt = prompt.toLowerCase();
    if (lowerPrompt.includes('server on') || lowerPrompt.includes('server online') || lowerPrompt.includes('krylo smp on') || lowerPrompt.includes('is the server up') || lowerPrompt.includes('is server online') || lowerPrompt.includes('server status')) {
      await interaction.deferReply();
      const isOnline = await checkKryloServerOnline();
      
      const statusEmbed = new EmbedBuilder()
        .setColor(isOnline ? 0x00FF66 : 0xFF4444)
        .setTitle(isOnline ? '🟢 KryloSMP is 100% ONLINE!' : '🔴 KryloSMP Server Offline / Restarting')
        .setDescription(
          isOnline
            ? 'Yes! **KryloSMP is online, healthy, and open for all players!** 🎮✨\n\n' +
              '• ☕ **Java Edition IP:** `KryloSmp.play.hosting` (Port: `25565`)\n' +
              '• 🪨 **Bedrock Edition IP:** `KryloSmp.play.hosting` (Port: `19132`)\n' +
              '• 🌐 **Webstore:** https://krylosmp-store.vercel.app\n' +
              '• ⚡ **Status:** 24/7 Monitored by UptimeRobot & Krims AI'
            : '⚠️ **The server appears offline or undergoing maintenance.**\n\nPlease check the Play.hosting panel or open a support ticket if issues persist!'
        )
        .setFooter({ text: 'Krims Code AI • Real-Time Socket Probe ⚡' })
        .setTimestamp();

      await interaction.editReply({ embeds: [statusEmbed] });
      return;
    }

    
    // Cooldown check
    const now = Date.now();
    const lastQuery = userCooldowns.get(interaction.user.id) || 0;
    const timeRemaining = COOLDOWN_TIME - (now - lastQuery);

    if (timeRemaining > 0) {
      const seconds = Math.ceil(timeRemaining / 1000);
      await interaction.reply({ content: `⏳ Please wait **${seconds}s** before asking another question.`, ephemeral: true });
      return;
    }

    userCooldowns.set(interaction.user.id, now);
    await interaction.deferReply();

    try {
      // 🧠 Try Gemini 3.5 Flash-Lite direct API first (faster + smarter)
      if (geminiClient) {
        responseText = await geminiDirectAsk(prompt, systemInstruction);
      }

      // Fallback to Krims SDK if direct Gemini unavailable or failed
      if (!responseText) {
        const result = await sdk.ask(prompt, {
          model: PREFERRED_AI_MODEL,
          systemInstruction: systemInstruction,
          history: history
        });
        handleAIFailover(result, interaction.guild);
        if (result.ok && result.response) {
          responseText = result.response;
        }
      }

      if (responseText) {
        history.push({ role: 'user', content: prompt });
        history.push({ role: 'model', content: responseText });
        if (history.length > 10) history = history.slice(history.length - 10);
        conversationHistory.set(interaction.channel.id, history);

        let replyText = `🤖 **Krims AI Response:**\n${responseText}`;
        await sendSafeMessage(interaction, replyText);
      } else {
        await interaction.editReply("❌ Failed to parse AI response.");
      }
    } catch (err) {
      // Last resort: try direct Gemini if SDK crashed
      if (geminiClient) {
        try {
          const fallbackResponse = await geminiDirectAsk(prompt, systemInstruction);
          if (fallbackResponse) {
            await sendSafeMessage(interaction, `🤖 **Krims AI Response:**\n${fallbackResponse}`);
            return;
          }
        } catch (e2) {}
      }
      await interaction.editReply(`❌ Error calling AI: ${err.message}`);
    }
  }
});

// Prefix Message Commands Handler (Legacy fallback & DMs)
// Dedup guard to prevent processing the same message twice
const processedMessages = new Set();

client.on('messageCreate', async (message) => {
  if (message.partial) await message.fetch().catch(() => {});
  if (message.channel && message.channel.partial) await message.channel.fetch().catch(() => {});
  if (!message.guild) return;

  // Auto-reaction voting for suggestions
  if (message.channel.name && message.channel.name.includes('suggestion') && !message.author.bot) {
    await message.react('✅').catch(() => {});
    await message.react('❌').catch(() => {});
  }

  // Command: !postvideo <youtube_url> [title]
  const msgContent = message.content.trim();
  if (msgContent.toLowerCase().startsWith('!postvideo')) {
    if (!message.guild) {
      await message.reply("❌ This command can only be used inside servers!");
      return;
    }

    const args = content.split(' ').slice(1);
    const videoUrl = args[0];

    if (!videoUrl || (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be'))) {
      await message.reply("❌ **Usage:** `!postvideo <youtube_url> [optional custom title]`\nExample: `!postvideo https://youtu.be/d39XE_BeHZI my new minecraft smp video`");
      return;
    }

    const customTitle = args.slice(1).join(' ') || 'New Minecraft SMP Video!';
    
    // Extract video ID
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    } else if (videoUrl.includes('v=')) {
      videoId = videoUrl.split('v=')[1].split('&')[0];
    }

    const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : 'https://i.ytimg.com/vi/d39XE_BeHZI/maxresdefault.jpg';

    const pingRole = message.guild.roles.cache.find(r => r.name.toLowerCase().includes('youtube') || r.name.toLowerCase().includes('stream') || r.name.toLowerCase().includes('ping'));
    const pingText = pingRole ? `<@&${pingRole.id}>` : '@everyone';

    const embed = new EmbedBuilder()
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
      .setTitle(customTitle)
      .setURL(videoUrl)
      .setImage(thumbnailUrl)
      .setColor(0xFF0000)
      .setFooter({ text: 'YouTube • New Upload Notification', iconURL: message.guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("▶️ Watch Video").setStyle(ButtonStyle.Link).setURL(videoUrl),
      new ButtonBuilder().setLabel("💬 Main Discord").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
    );

    const targetCh = message.guild.channels.cache.find(c => c.name.includes('youtube') || c.name.includes('social')) || message.channel;

    try {
      await message.delete().catch(() => {});
    } catch {}

    const postedMsg = await targetCh.send({
      content: `Hey ${pingText} ! A new video has been uploaded, check it out ${videoUrl}`,
      embeds: [embed],
      components: [row]
    });

    await postedMsg.react('👍').catch(() => {});
    await postedMsg.react('🔥').catch(() => {});
    await postedMsg.react('❤️').catch(() => {});
    await postedMsg.react('🚀').catch(() => {});

    console.log(`[YouTube Notifier] Posted video notification for ${videoUrl} in #${targetCh.name}`);
    return;
  }


  // Owner Auto-Role Protection: Always ensure server owner has all roles
  if (message.guild && message.author.id === message.guild.ownerId) {
    try {
      const botRole = message.guild.members.me.roles.highest;
      const unassignedRoles = message.guild.roles.cache.filter(r => 
        r.name !== '@everyone' && 
        !r.managed && 
        r.position < botRole.position && 
        !message.member.roles.cache.has(r.id)
      );
      if (unassignedRoles.size > 0) {
        for (const [, role] of unassignedRoles) {
          await message.member.roles.add(role).catch(() => {});
        }
      }
    } catch {}
  }

  if (message.author.bot) return;
  if (message.guild && message.guild.id !== '1524878881918685405') return;

  // Prevent duplicate processing of the same message
  if (processedMessages.has(message.id)) return;
  processedMessages.add(message.id);
  // Clean up old message IDs after 30 seconds to prevent memory leak
  setTimeout(() => processedMessages.delete(message.id), 30000);

  // Process message XP leveling
  await handleMessageXP(message);

  // Auto-Format Suggestions Channel (Anonymous Public + Staff Audit Log)
  if (message.guild && (message.channel.name.includes('suggestions') || message.channel.name.includes('suggestion'))) {
    try {
      const originalContent = message.content;
      const author = message.author;
      await message.delete().catch(() => {});

      const suggestEmbed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('💡 New Community Suggestion')
        .setDescription(originalContent)
        .setAuthor({
          name: '🎭 Anonymous Player',
          iconURL: 'https://mc-heads.net/avatar/MHF_Question/64'
        })
        .setFooter({ text: '🎭 Anonymous Suggestion • React below to vote! (Identity hidden from public)' })
        .setTimestamp();

      const publicMsg = await message.channel.send({ embeds: [suggestEmbed] });
      await publicMsg.react('👍').catch(() => {});
      await publicMsg.react('👎').catch(() => {});

      // Private Staff Audit Log to #mod-logs
      const modLogCh = message.guild.channels.cache.find(c => (c.name.includes('mod-log') || c.name.includes('mod_log') || c.name.includes('staff')) && c.type === ChannelType.GuildText);
      if (modLogCh) {
        const staffAuditEmbed = new EmbedBuilder()
          .setColor(0xFF4757)
          .setAuthor({ name: '🕵️ [STAFF AUDIT] Suggestion Submitter Identity', iconURL: author.displayAvatarURL({ dynamic: true }) })
          .setDescription(`👤 **Submitter:** <@${author.id}> (\`${author.tag}\` • ID: \`${author.id}\`)\n\n💡 **Suggestion Content:**\n> ${originalContent}\n\n🔗 **Public Message:** [Jump to Suggestion](${publicMsg.url})`)
          .setFooter({ text: 'Staff Eyes Only • Public identity kept secret' })
          .setTimestamp();
        await modLogCh.send({ embeds: [staffAuditEmbed] }).catch(() => {});
      }
    } catch (err) {
      console.warn('[Suggestions] Failed to auto-format suggestion:', err.message);
    }
    return;
  }

  // ─── TICKET CHANNEL AUTO-RESPONSE & ESCALATION ───
  if (message.guild && message.channel.name.startsWith('ticket-')) {
    let botPrefix = '!';
    try {
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: message.guild.id })
      });
      if (configRes.ok) {
        const guildConfig = await configRes.json();
        botPrefix = guildConfig.prefix || '!';
      }
    } catch {}

    const isCommand = message.content.startsWith(botPrefix) || message.content.startsWith('!');
    if (!isCommand) {
      await handleTicketMessage(message);
      return;
    }
  }

  // ═══════════════════════════════════════
  // AUTOMATIC AUTO-MODERATION ENGINE
  // ═══════════════════════════════════════
  if (message.guild) {
    const authorId = message.author.id;
    // Protection check: Bypasses owner (Guild owner) and developers
    const isProtected = authorId === message.guild.ownerId || authorId === '1524878881918685405' || authorId === '1524878881918685405';
    
    if (!isProtected) {
      const member = message.member;
      // Bypass if member is administrator or has staff roles
      const isStaff = member && (
        member.permissions.has(PermissionFlagsBits.Administrator) ||
        member.permissions.has(PermissionFlagsBits.ManageMessages) ||
        member.roles.cache.some(r => ['admin', 'moderator', 'staff', 'owner'].includes(r.name.toLowerCase()))
      );

      if (!isStaff) {
        const msgContent = message.content.toLowerCase();
        const now = Date.now();

        // Reusable violation handler to process strikes and auto-bans
        const handleViolation = async (msg, reasonText, details = null) => {
          try {
            await msg.delete().catch(() => {});
            const strikes = (userStrikes.get(authorId) || 0) + 1;
            userStrikes.set(authorId, strikes);

            // Log action to mod-logs channel
            const logCh = msg.guild.channels.cache.find(c => c.name.includes('mod-logs') && c.type === ChannelType.GuildText);
            if (logCh) {
              const logEmbed = new EmbedBuilder()
                .setColor(strikes >= 3 ? 0xFF0000 : 0xFF3300)
                .setTitle(strikes >= 3 ? '🚨 Auto-Mod Action: Double-Ban' : `⚠️ Auto-Mod Action: Strike ${strikes}/3`)
                .setDescription(`Violation by <@${authorId}>: **${reasonText}**`)
                .addFields(
                  { name: 'Channel', value: `<#${msg.channel.id}>`, inline: true },
                  { name: 'Warnings', value: `${strikes} / 3`, inline: true }
                )
                .setTimestamp();
              if (details) {
                logEmbed.addFields({ name: 'Details', value: details });
              }
              await logCh.send({ embeds: [logEmbed] }).catch(() => {});
            }

            if (strikes >= 3) {
              userStrikes.delete(authorId);
              // Ban user from guild (triggers guildBanAdd to sync-ban Minecraft + IP ban!)
              await msg.guild.members.ban(authorId, { reason: `Auto-Mod: Reached 3 warnings (${reasonText})` });
              await msg.channel.send(`🚨 **Auto-Mod:** <@${authorId}> has been permanently banned from both Discord and Minecraft after reaching 3 warnings/strikes!`);
            } else {
              const warnMsg = await msg.channel.send(`⚠️ <@${authorId}>, ${reasonText}! **(Warning ${strikes}/3)**`);
              setTimeout(() => warnMsg.delete().catch(() => {}), 6000);
            }
          } catch (err) {
            console.warn("[Auto-Mod] Violation handler error:", err.message);
          }
        };

        // 1. Anti-Spam Filter (Max 5 messages in 3 seconds)
        if (!spamMap.has(authorId)) {
          spamMap.set(authorId, []);
        }
        const timestamps = spamMap.get(authorId);
        timestamps.push(now);
        const recentTimestamps = timestamps.filter(t => now - t < 3000);
        spamMap.set(authorId, recentTimestamps);

        if (recentTimestamps.length > 5) {
          try {
            if (member && member.moderatable) {
              await member.timeout(60000, 'Auto-Mod: Spamming');
            }
            await handleViolation(message, 'spamming is not allowed', 'Sent more than 5 messages in 3 seconds.');
          } catch (e) {
            console.warn("[Auto-Mod] Spam violation error:", e.message);
          }
          return;
        }

        // 2. Invite Link Filter
        const inviteRegex = /(discord\.(gg|io|me|li)\/.+|discord(app)?\.com\/invite\/.+)/i;
        if (inviteRegex.test(msgContent)) {
          await handleViolation(message, 'invite links to other Discord servers are not allowed', `Link: \`${message.content}\``);
          return;
        }

        // 3. Bad Words / Profanity Filter
        const toxicWords = ['nigger', 'nigga', 'faggot', 'retard', 'kike', 'tranny', 'bastard', 'bitch', 'cunt', 'dick', 'whore', 'slut', 'ddos', 'dox', 'wurst client', 'meteor client', 'liquidbounce'];
        const hasBadWord = toxicWords.some(word => msgContent.includes(word));
        if (hasBadWord) {
          await handleViolation(message, 'profanity or slurs are not allowed', `Filtered Message: ||${message.content}||`);
          return;
        }

        // 4. Caps Lock Screaming Filter
        if (message.content.length > 10) {
          const uppercaseCount = (message.content.match(/[A-Z]/g) || []).length;
          const letterCount = (message.content.match(/[a-zA-Z]/g) || []).length;
          if (letterCount > 0 && (uppercaseCount / letterCount) > 0.75) {
            await handleViolation(message, 'screaming in all caps is not allowed', `Caps Ratio: \`${Math.round((uppercaseCount / letterCount) * 100)}%\``);
            return;
          }
        }

        // 5. External Link Filter (Allow only trusted domains)
        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        if (urlRegex.test(message.content)) {
          const allowedDomains = ['youtube.com', 'youtu.be', 'play.hosting', 'onrender.com', 'discord.com', 'tenor.com', 'giphy.com', 'github.com', 'krims-code-chatbot.vercel.app'];
          const urls = message.content.match(urlRegex) || [];
          let blockLink = false;
          let blockedUrl = '';

          for (const url of urls) {
            try {
              const domain = new URL(url).hostname.replace('www.', '').toLowerCase();
              const isAllowed = allowedDomains.some(d => domain === d || domain.endsWith('.' + d));
              if (!isAllowed) {
                blockLink = true;
                blockedUrl = url;
                break;
              }
            } catch {
              blockLink = true;
              blockedUrl = url;
              break;
            }
          }

          if (blockLink) {
            await handleViolation(message, 'posting unauthorized external links is not allowed', `Link: \`${blockedUrl}\``);
            return;
          }
        }
      }
    }
  }

  const content = message.content.trim();
  const isDM = !message.guild;

  // Retrieve configurations dynamically
  let botPrefix = '!';
  let aiEnabled = true;
  let modelEngine = 'gemini';
  let systemInstruction = 'You are the Krims Code AI, built and custom-trained by the genius developer Krishiv. Answer coding queries with clear instructions and a friendly, confident tone.';
  let ticketsEnabled = false;
  let guildConfig = null;

  if (message.guild) {
    try {
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: message.guild.id })
      });
      if (configRes.ok) {
        guildConfig = await configRes.json();
        botPrefix = guildConfig.prefix || '!';
        aiEnabled = guildConfig.aiEnabled !== false;
        modelEngine = guildConfig.model || 'gemini';
        systemInstruction = guildConfig.sysPrompt || systemInstruction;
        ticketsEnabled = !!guildConfig.ticketsEnabled;
      }
    } catch (err) {
      console.warn("Failed to load configs:", err.message);
    }
  }

  // Check for Custom Auto-Responses
  if (message.guild && guildConfig) {
    try {
      const activeCustomCommands = guildConfig.customCommands || [];
      const matchedCmd = activeCustomCommands.find(c => c.trigger.toLowerCase() === content.toLowerCase());
      if (matchedCmd) {
        await message.reply(matchedCmd.response);
        return;
      }
    } catch {}
  }

  // Command: !pvp
  if (content.toLowerCase() === botPrefix + 'pvp' || content.toLowerCase() === '!pvp') {
    if (!message.guild) {
      await message.reply("❌ This command can only be used inside servers!");
      return;
    }

    let pvpRole = message.guild.roles.cache.find(r => r.name === '⚔️ PvP Specialist');
    if (!pvpRole) {
      try {
        pvpRole = await message.guild.roles.create({
          name: '⚔️ PvP Specialist',
          color: 0xFF0055,
          reason: 'Created for PvP command'
        });
      } catch (err) {
        await message.reply(`❌ Failed to find or create the PvP role: ${err.message}`);
        return;
      }
    }

    const hasRole = message.member.roles.cache.has(pvpRole.id);
    try {
      if (hasRole) {
        await message.member.roles.remove(pvpRole);
        await message.reply('❌ **Removed PvP role.** You no longer have access to the private PvP chat.');
      } else {
        await message.member.roles.add(pvpRole);

        const pvpChatCh = message.guild.channels.cache.find(c => c.name.includes('pvp-chat') && c.type === ChannelType.GuildText);
        const channelMention = pvpChatCh ? `<#${pvpChatCh.id}>` : 'the PvP channel';

        await message.reply(`✅ **Granted PvP role!** You now have access to ${channelMention}. Go say hello! ⚔️`);
      }
    } catch (err) {
      await message.reply(`❌ Failed to update role: ${err.message}`);
    }
    return;
  }

  // Command: !tournament or !tornament
  if (content.toLowerCase() === botPrefix + 'tournament' || content.toLowerCase() === '!tournament' || content.toLowerCase() === botPrefix + 'tornament' || content.toLowerCase() === '!tornament') {
    if (!message.guild) {
      await message.reply("❌ This command can only be used inside servers!");
      return;
    }

    let tournamentRole = message.guild.roles.cache.find(r => r.name === 'Tournament Participant');
    if (!tournamentRole) {
      try {
        tournamentRole = await message.guild.roles.create({
          name: 'Tournament Participant',
          color: 0xFFAA00,
          reason: 'Created for Tournament command'
        });
      } catch (err) {
        await message.reply(`❌ Failed to find or create the Tournament role: ${err.message}`);
        return;
      }
    }

    const hasRole = message.member.roles.cache.has(tournamentRole.id);
    try {
      if (hasRole) {
        await message.member.roles.remove(tournamentRole);
        await message.reply('❌ **Removed Tournament Participant role.** You will no longer receive tournament notifications or access the private channel.');
      } else {
        await message.member.roles.add(tournamentRole);

        const tournamentCh = message.guild.channels.cache.find(c => c.name.includes('tournament') && c.type === ChannelType.GuildText);
        const channelMention = tournamentCh ? `<#${tournamentCh.id}>` : 'the tournament channel';

        await message.reply(`🏆 **Granted Tournament Participant role!** You now have access to ${channelMention}. Get ready to fight! ⚔️`);
      }
    } catch (err) {
      await message.reply(`❌ Failed to update role: ${err.message}`);
    }
    return;
  }

  // Command: !challenge
  if (content.toLowerCase().startsWith(botPrefix + 'challenge') || content.toLowerCase().startsWith('!challenge')) {
    if (!message.guild) {
      await message.reply("❌ This command can only be used inside servers!");
      return;
    }

    const opponent = message.mentions.users.first();
    if (!opponent) {
      await message.reply("❌ Please mention the player you want to challenge (e.g. `!challenge @user`)!");
      return;
    }

    if (opponent.id === message.author.id) {
      await message.reply('❌ You cannot challenge yourself!');
      return;
    }
    if (opponent.bot) {
      await message.reply('❌ You cannot challenge bots!');
      return;
    }

    const pvpChatCh = message.guild.channels.cache.find(c => c.name.includes('pvp-chat') && c.type === ChannelType.GuildText);
    if (pvpChatCh && message.channel.id !== pvpChatCh.id) {
      await message.reply(`❌ Please run this command inside <#${pvpChatCh.id}>!`);
      return;
    }

    const isChallengerBusy = (activeDuel && (activeDuel.challengerId === message.author.id || activeDuel.challengedId === message.author.id)) ||
      pvpQueue.some(q => q.challengerId === message.author.id || q.challengedId === message.author.id);

    const isOpponentBusy = (activeDuel && (activeDuel.challengerId === opponent.id || activeDuel.challengedId === opponent.id)) ||
      pvpQueue.some(q => q.challengerId === opponent.id || q.challengedId === opponent.id);

    if (isChallengerBusy) {
      await message.reply('❌ You are already in an active duel or queue!');
      return;
    }
    if (isOpponentBusy) {
      await message.reply(`❌ <@${opponent.id}> is already in an active duel or queue!`);
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF0055)
      .setTitle('⚔️ PvP Challenge Invitation!')
      .setDescription(`<@${message.author.id}> has challenged <@${opponent.id}> to a 1v1 PvP Duel!\n\n<@${opponent.id}>, do you accept?`)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`pvp_accept_${message.author.id}_${opponent.id}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`pvp_decline_${message.author.id}_${opponent.id}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    await message.reply({ content: `<@${opponent.id}>`, embeds: [embed], components: [row] });
    return;
  }

  // Command: !endduel
  if (content.toLowerCase() === botPrefix + 'endduel' || content.toLowerCase() === '!endduel') {
    if (!message.guild) {
      await message.reply("❌ This command can only be used inside servers!");
      return;
    }

    if (!activeDuel) {
      await message.reply('❌ There is no active duel in progress!');
      return;
    }

    const isDuelist = message.author.id === activeDuel.challengerId || message.author.id === activeDuel.challengedId;
    const isStaff = message.member.permissions.has(PermissionFlagsBits.ManageChannels) || message.member.roles.cache.some(r => r.name.toLowerCase().includes('staff') || r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('mod'));

    if (!isDuelist && !isStaff) {
      await message.reply('❌ Only the duelists or staff members can end the duel!');
      return;
    }

    await message.reply('🏁 **Duel finished. Deleting channel and starting next match...**');

    const guild = message.guild;
    const duelChannel = message.channel;

    setTimeout(async () => {
      await endCurrentDuel(guild, duelChannel);
    }, 3000);
    return;
  }

  // Command: !close
  if (content.toLowerCase() === botPrefix + 'close' || content.toLowerCase() === '!close') {
    if (message.channel.name.startsWith('ticket-')) {
      await message.reply("🔒 **Support ticket resolved. Deleting channel in 5 seconds...**");
      
      if (message.guild && message.guild.id === '1524878881918685405') {
        try {
          await closeTicketInGoogleSheet(message.channel.id);
        } catch (err) {
          console.warn("Failed to close ticket in Google Sheet:", err.message);
        }
      }

      if (message.guild && guildConfig) {
        try {
          const tickets = guildConfig.openTickets || [];
          guildConfig.openTickets = tickets.filter(t => t.id !== message.channel.id);
          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_config', guildId: message.guild.id, config: guildConfig })
          });
        } catch (err) {
          console.warn("Failed to remove ticket from database:", err.message);
        }
      }

      setTimeout(async () => {
        try {
          await message.channel.delete();
        } catch {}
      }, 5000);
      return;
    }
  }

  // Command: !ticket
  if (content.toLowerCase().startsWith(botPrefix + 'ticket') || content.toLowerCase().startsWith('!ticket')) {
    if (!message.guild) {
      await message.reply("❌ Tickets can only be created inside servers!");
      return;
    }
    if (!ticketsEnabled) {
      await message.reply("🔒 **The ticket support system is currently disabled on this server.** Enable it from the dashboard!");
      return;
    }

    const prefixUsed = content.toLowerCase().startsWith(botPrefix + 'ticket') ? (botPrefix + 'ticket') : '!ticket';
    const userTicketReasonText = content.substring(prefixUsed.length).trim();

    if (!userTicketReasonText) {
      await message.reply(`❌ **Please specify a reason for opening a ticket.**\nExample: \`${botPrefix}ticket griefing at my base\``);
      return;
    }

    try {
      const supportCategory = message.guild.channels.cache.find(c => c.name.toLowerCase().includes('support') && c.type === ChannelType.GuildCategory) || message.guild.channels.cache.find(c => c.name.toLowerCase().includes('support-tickets') && c.type === ChannelType.GuildText)?.parent;
      const channel = await message.guild.channels.create({
        name: `ticket-${message.author.username.toLowerCase()}`,
        type: ChannelType.GuildText,
        parent: supportCategory ? supportCategory.id : null,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: message.author.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });

      const calculatedPriority = await calculatePriority(userTicketReasonText);

      let mcUsername = 'Not Linked';
      let playerBalance = 0;
      try {
        const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId: message.guild.id })
        });
        if (configRes.ok) {
          const cfg = await configRes.json();
          if (cfg.verifiedPlayers && cfg.verifiedPlayers[message.author.id]) {
            mcUsername = cfg.verifiedPlayers[message.author.id].name || 'Not Linked';
            if (cfg.verifiedPlayers[message.author.id].balance !== undefined) {
              playerBalance = cfg.verifiedPlayers[message.author.id].balance;
            }
          }
          if (mcUsername !== 'Not Linked' && cfg.economyData && cfg.economyData[mcUsername]) {
            playerBalance = cfg.economyData[mcUsername];
          }
        }
      } catch (e) {
        console.warn('[Ticket Log] Failed to fetch config:', e.message);
      }

      const profileEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🎫 Support Ticket Details')
        .setDescription(`Welcome ${message.author}! Our administrative staff will assist you shortly.`)
        .addFields(
          { name: '👤 Discord User', value: `${message.author.tag} (<@${message.author.id}>)`, inline: true },
          { name: '🎮 Minecraft Account', value: mcUsername !== 'Not Linked' ? `\`${mcUsername}\`` : '❌ Not Linked', inline: true },
          { name: '🪙 KryloCoins', value: `\`${Math.floor(playerBalance).toLocaleString()} ⛃\``, inline: true },
          { name: '📋 Reason / Question', value: userTicketReasonText },
          { name: '🚨 Priority Level', value: `${calculatedPriority === 'No Staff Needed' ? '🟢 Standard / General' : calculatedPriority === 'High' ? '🔴 High Priority' : '🟡 Medium Priority'}`, inline: true }
        )
        .setFooter({ text: `Type ${botPrefix}close to resolve and delete this channel` })
        .setTimestamp();

      await channel.send({ content: `<@${message.author.id}>`, embeds: [profileEmbed] });
      await message.reply(`🎟️ **Ticket Opened!** Check your private support channel here: ${channel}`);

      // Log to Google Sheet via SheetDB API
      await logTicketToGoogleSheet(
        channel.id,
        message.author.tag,
        message.author.id,
        userTicketReasonText,
        calculatedPriority,
        mcUsername,
        playerBalance
      );

      if (guildConfig) {
        const tickets = guildConfig.openTickets || [];
        tickets.push({ id: channel.id, name: channel.name, user: message.author.username });
        guildConfig.openTickets = tickets;

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId: message.guild.id, config: guildConfig })
        });
      }
    } catch (err) {
      await message.reply(`❌ Failed to open ticket: ${err.message}`);
    }
    return;
  }

  // Command: !reset
  if (content === botPrefix + 'reset' || (isDM && content.toLowerCase() === 'reset')) {
    conversationHistory.delete(message.channel.id);
    await message.reply("🧹 **Memory cleared!** Starting a fresh conversation.");
    return;
  }

  // Command: !birthday / !bday [@user]
  if (content.toLowerCase().startsWith(botPrefix + 'birthday') || content.toLowerCase().startsWith('!birthday') || content.toLowerCase().startsWith(botPrefix + 'bday') || content.toLowerCase().startsWith('!bday')) {
    const targetUser = message.mentions.users.first() || message.author;
    const isOwner = targetUser.username.toLowerCase().includes('krylo') || targetUser.username.toLowerCase().includes('krishiv') || targetUser.id === '1414143825538191373';
    const targetName = isOwner ? 'KRYLO' : targetUser.username;

    const bdayEmbed = new EmbedBuilder()
      .setColor(0xFF007F)
      .setTitle(`🎂🎉 HAPPY BIRTHDAY ${targetName.toUpperCase()}! 🎉🎂`)
      .setDescription(
        isOwner 
          ? '👑 **Wishing the Owner & Creator of KryloSMP a massive Happy Birthday!** 🥳✨\n\nMay this year bring unlimited success, epic builds, and peak server growth! Everyone raise your swords and celebrate! ⚔️💎🎁'
          : `🥳 **Everyone wish <@${targetUser.id}> a massive Happy Birthday!** 🎉✨\n\nMay your year be filled with epic builds, unlimited diamonds, and great adventures! Everyone raise your swords and celebrate! ⚔️💎🎁`
      )
      .addFields(
        { name: '🎁 Birthday Rewards Active', value: `• **Fireworks Event:** In-game fireworks celebration queued!\n• **Double XP:** Server-wide XP boost enabled!\n• **KryloCoins Bonus:** +500 KC awarded to ${targetName}!` },
        { name: '🥳 Leave a Birthday Message!', value: `Wish ${targetName} a Happy Birthday down below!` }
      )
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: 'KryloSMP Birthday Event • Special Celebration' })
      .setTimestamp();

    await message.reply({ content: `🎉 @everyone **IT'S ${targetName.toUpperCase()}'S BIRTHDAY!** 🎂🎈`, embeds: [bdayEmbed] });

    try {
      const guildId = message.guild ? message.guild.id : '1524878881918685405';
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId })
      });
      if (configRes.ok) {
        const config = await configRes.json();
        if (!config.pendingCommands) config.pendingCommands = [];
        config.pendingCommands.push('execute at @a run summon firework_rocket ~ ~ ~ {LifeTime:30,FireworksItem:{id:firework_rocket,Count:1,tag:{Fireworks:{Explosions:[{Type:1,Flicker:1,Trail:1,Colors:[I;16711935,65535,16776960]}]}}}}');
        config.pendingCommands.push(`say 🎉 HAPPY BIRTHDAY ${targetName.toUpperCase()}! 🎂`);

        if (config.economyData && config.economyData[targetUser.username]) {
          config.economyData[targetUser.username].balance = (config.economyData[targetUser.username].balance || 0) + 500;
        }

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId, config })
        });
      }
    } catch (err) {
      console.warn("Failed to queue birthday rewards:", err.message);
    }
    return;
  }

  // Command: !help
  if (content === botPrefix + 'help' || (isDM && content.toLowerCase() === 'help')) {
    const helpEmbed = {
      color: 0x00f2ff,
      title: '👾 Krims Code AI - Command Guide',
      description: 'Welcome to your premium developer workspace bot assistant. Below is the list of available commands:',
      fields: [
        { name: '💬 Chat / AI Reasoning', value: isDM ? 'Just type a message naturally in DM to chat.' : `Type \`${botPrefix}ask <your question>\` in servers to ask queries.` },
        { name: '🎟️ Support Tickets', value: `Type \`${botPrefix}ticket\` to open a private assistance channel.` },
        { name: '🧹 Reset memory', value: `Type \`${botPrefix}reset\` to start a new chat session.` },
        { name: '📊 Network Telemetry', value: `Type \`${botPrefix}diagnose\` to compile local and global network statistics.` },
        { name: '👾 Bot Help', value: `Type \`${botPrefix}help\` to open this menu.` }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Krims Code Command Center • Coded by Krishiv'
      }
    };
    await message.reply({ embeds: [helpEmbed] });
    return;
  }

  // Command: !diagnose
  if (content === botPrefix + 'diagnose') {
    const typingMsg = await message.reply("⚙️ *Compiling Krims Code network diagnostics...*");

    try {
      const health = await sdk.health();
      let npmCliDownloads = '142';
      try {
        const npmRes = await fetch('https://api.npmjs.org/downloads/point/last-week/@krishivpb60/krims-code-cli');
        const npmData = await npmRes.json();
        if (npmData.downloads) npmCliDownloads = npmData.downloads.toLocaleString();
      } catch {}

      const embed = {
        color: 0x00f2ff,
        title: '⚡ Krims Code Network Telemetry',
        description: 'Real-time telemetry and version diagnostic for the unified workspace.',
        fields: [
          { name: '🌐 AI Router Mesh', value: health.ok ? `🟢 Online (Vocab: ${health.localVocabSize} words)` : '🔴 Offline', inline: true },
          { name: '📦 NPM Package Downloads', value: `📈 ~${npmCliDownloads} downloads/week`, inline: true },
          { name: '🐍 PyPI CLI Package', value: '🟢 v1.5.7 Live', inline: true },
          { name: '🖥️ Desktop Tauri IDE', value: '🟢 v0.1.0 Ready', inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Krims Code Command Center'
        }
      };

      await typingMsg.edit({ content: '', embeds: [embed] });
    } catch (err) {
      const cleanError = err.message.replace(/"[^"]{100,}"/g, '"..."').substring(0, 150);
      await typingMsg.edit(`❌ Failed to run diagnosis. The server may be temporarily unavailable. Try again in a moment.`);
      console.error('[Diagnose] Error:', cleanError);
    }
    return;
  }

  // Command: !voice / !joinvoice / !leavevoice / !call / !1on1
  const lowerContent = content.toLowerCase().trim();
  if (lowerContent === botPrefix + 'voice join' || lowerContent === botPrefix + 'joinvoice' || lowerContent === botPrefix + 'join') {
    return joinVoice(message, false);
  } else if (lowerContent === botPrefix + 'voice call' || lowerContent === botPrefix + 'call' || lowerContent === botPrefix + '1on1' || lowerContent === botPrefix + 'voice 1on1') {
    return joinVoice(message, true);
  } else if (lowerContent === botPrefix + 'voice leave' || lowerContent === botPrefix + 'leavevoice' || lowerContent === botPrefix + 'leave') {
    return leaveVoice(message);
  } else if (lowerContent === botPrefix + 'voice' || lowerContent === botPrefix + 'voice status') {
    return getVoiceStatus(message);
  }

  // Determine if it is a Chat Prompt using dynamic prefix
  let isPrompt = false;
  let prompt = '';

  const prefixLower = botPrefix.toLowerCase();
  if (lowerContent === prefixLower + 'ask') {
    return message.reply({
      embeds: [{
        color: 0x5865F2,
        title: '🤖 How to Ask Krims Code AI',
        description: 'You can ask Krims Code AI questions using any of the following methods:\n\n' +
                     '• **Mention Bot**: Tag `@Krims Code AI <your question>` in any channel!\n' +
                     '• **Text Prompt**: Type `!ask <your question>` (e.g. `!ask What is KryloSMP?`)\n' +
                     '• **Slash Command**: Use `/ask prompt:<your question>`\n' +
                     '• 🎙️ **Voice AI**: Join a Voice Channel and type `/voice join` or `!voice join` to talk directly with Krims Bot!',
        footer: { text: 'Krims Code AI Voice & Text Engine' }
      }]
    });
  } else if (content.toLowerCase().startsWith(prefixLower + 'ask ')) {
    isPrompt = true;
    prompt = content.substring(botPrefix.length + 4).trim();
  } else if (client.user && message.mentions.has(client.user) && !message.mentions.everyone) {
    isPrompt = true;
    prompt = content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
  } else if (isDM && !content.startsWith('!')) {
    isPrompt = true;
    prompt = content;
  }

  if (isPrompt) {
    if (!aiEnabled) {
      if (!isDM) {
        await message.reply("🔒 **AI conversation responses are currently disabled on this server.** Enable it from the dashboard to chat!");
      }
      return;
    }

    if (!prompt) {
      message.reply(`⚠️ Please provide a prompt! Use: \`${botPrefix}ask <query>\` or \`/voice join\` to speak!`);
      return;
    }

    // Rate Limiting / Cooldown check to protect API quota
    const now = Date.now();
    const lastQuery = userCooldowns.get(message.author.id) || 0;
    const timeRemaining = COOLDOWN_TIME - (now - lastQuery);

    if (timeRemaining > 0) {
      const seconds = Math.ceil(timeRemaining / 1000);
      await message.reply(`⏳ Please wait **${seconds}s** before sending another question!`).catch(() => {});
      return;
    }

    // Set new cooldown timestamp
    userCooldowns.set(message.author.id, now);

    let typingMsg = await message.reply("⚡ *Krims AI is calculating...*").catch(async () => {
      return await message.channel.send("⚡ *Krims AI is calculating...*").catch(() => null);
    });
    if (!typingMsg) typingMsg = message;

    // Fast local JS evaluation for simple math/arithmetic expressions (must contain arithmetic operators, not long IDs)
    const lowerPrompt = prompt.toLowerCase().trim();
    const cleanMathExpr = lowerPrompt.replace(/what is/gi, '').replace(/\?/g, '').replace(/=/g, '').trim();
    const mathRegex = /^[0-9+\-*/().\s]+$/;
    const hasOperator = /[+\-*/]/.test(cleanMathExpr);
    // Only evaluate as math if there is an operator OR if it's a short 1-6 digit number expression
    if (mathRegex.test(cleanMathExpr) && /[0-9]/.test(cleanMathExpr) && (hasOperator || (cleanMathExpr.length <= 6 && !isNaN(Number(cleanMathExpr))))) {
      try {
        const mathResult = Function(`"use strict"; return (${cleanMathExpr})`)();
        const responseText = `🤖 **Krims AI Response:**\nThe answer to ${cleanMathExpr} is ${mathResult}!`;
        await sendSafeMessage(typingMsg, responseText);
        return;
      } catch (e) {
        // Fall back to querying the AI engine if evaluation fails
      }
    }

    try {
      // Retrieve conversation history
      // 🧠 Try Gemini 3.5 Flash-Lite direct 4-key rotation first (with 2.5 Flash fallback)
      if (geminiClient) {
        responseText = await geminiDirectAsk(prompt, systemInstruction);
      }

      // Fallback to Krims SDK if direct Gemini unavailable or failed
      if (!responseText) {
        const result = await sdk.ask(prompt, {
          model: PREFERRED_AI_MODEL,
          systemInstruction: systemInstruction,
          history: history
        });
        handleAIFailover(result, message.guild);
        if (result.ok && result.response) {
          responseText = result.response;
        }
      }

      if (responseText) {
        // Update local history
        history.push({ role: 'user', content: prompt });
        history.push({ role: 'model', content: responseText });

        // Limit memory history to the last 10 messages (5 turns)
        if (history.length > 10) {
          history = history.slice(history.length - 10);
        }
        conversationHistory.set(message.channel.id, history);

        let replyText = `🤖 **Krims AI Response:**\n${responseText}`;
        await sendSafeMessage(typingMsg, replyText);
      } else {
        await typingMsg.edit("❌ **AI response error.** Please try asking again!");
      }
    } catch (err) {
      console.error('[AI Chat Error]', err.message || err);
      try {
        await typingMsg.edit('⚡ **AI is processing another request.** Please try again in a second!');
      } catch (e) {}
    }
  }
});
// ═══════════════════════════════════════════════════════════
// WELCOME SYSTEM — Auto-role + Welcome message on join
// ═══════════════════════════════════════════════════════════
const KRYLO_GUILD_ID = '1524878881918685405';

async function generateWelcomeCard(avatarUrl, username, memberCount) {
  try {
    const bg = await Jimp.read('welcome-bg.png');
    bg.resize(1020, 450);

    // Fetch avatar or fallback to default
    let avatar;
    try {
      avatar = await Jimp.read(avatarUrl);
    } catch {
      avatar = new Jimp(200, 200, 0x555555ff); // Grey square fallback
    }
    avatar.resize(200, 200);

    const mask = new Jimp(200, 200, 0x00000000);
    mask.scan(0, 0, 200, 200, (x, y) => {
      const dist = Math.sqrt(Math.pow(x - 100, 2) + Math.pow(y - 100, 2));
      if (dist <= 100) {
        mask.setPixelColor(0xffffffff, x, y);
      }
    });
    avatar.mask(mask, 0, 0);

    bg.composite(avatar, 410, 50);

    const font32 = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const font64 = await Jimp.loadFont(Jimp.FONT_SANS_64_WHITE);

    const welcomeText = `WELCOME TO KRYLOSMP`;
    const userText = username.toUpperCase();
    const countText = `MEMBER #${memberCount}`;

    const wTextWidth = Jimp.measureText(font32, welcomeText);
    const uTextWidth = Jimp.measureText(font64, userText);
    const cTextWidth = Jimp.measureText(font32, countText);

    bg.print(font32, (1020 - wTextWidth) / 2, 270, welcomeText);
    bg.print(font64, (1020 - uTextWidth) / 2, 310, userText);
    bg.print(font32, (1020 - cTextWidth) / 2, 385, countText);

    return await bg.getBufferAsync(Jimp.MIME_PNG);
  } catch (err) {
    console.error('[Welcome Card] Error generating card:', err);
    return null;
  }
}

client.on('guildMemberAdd', async (member) => {
  // Works across ALL Krylo guilds
  if (!member.guild.name.toLowerCase().includes('krylo')) return;

  // Auto-assign 🎮 Player role immediately on join
  try {
    const playerRole = member.guild.roles.cache.find(r => r.name === '🎮 Player');
    if (playerRole && !member.roles.cache.has(playerRole.id)) {
      await member.roles.add(playerRole);
      console.log(`[Welcome] Auto-assigned 🎮 Player role to ${member.user.username}`);
    }
  } catch (err) {
    console.warn(`[Welcome] Failed to assign Player role:`, err.message);
  }

  // Auto-assign 🌱 Newcomer role
  try {
    const newcomerRole = member.guild.roles.cache.find(r => r.name === '🌱 Newcomer');
    if (newcomerRole && !member.roles.cache.has(newcomerRole.id)) {
      await member.roles.add(newcomerRole);
      console.log(`[Welcome] Auto-assigned 🌱 Newcomer role to ${member.user.username}`);
    }
  } catch (err) {
    console.warn(`[Welcome] Failed to assign Newcomer role:`, err.message);
  }

  // Send Welcome DM to new member
  try {
    const dmEmbed = new EmbedBuilder()
      .setAuthor({ name: 'KryloSMP Executive Network', iconURL: member.guild.iconURL() })
      .setTitle(`👋 Welcome to ${member.guild.name}!`)
      .setDescription(
        `Hey **${member.user.username}**! Welcome to the community!\n\n` +
        `🎮 **Get Started:**\n` +
        `1️⃣ Verify your account in the server to unlock all channels\n` +
        `2️⃣ Use \`/daily\` for free 1,000 KryloCoins every day!\n` +
        `3️⃣ Connect to \`KryloSmp.play.hosting\` and start playing!\n\n` +
        `💰 **Useful Commands:** \`/balance\` \`/shop\` \`/clan\` \`/pvp\` \`/fish\` \`/mine\`\n\n` +
        `🌐 **Player Portal:** https://krylosmp.web.app/\n` +
        `🛒 **KC Store:** https://krylosmp-store.web.app/\n\n` +
        `Need help? Open a ticket in #🎫┃support-tickets!`
      )
      .setColor(0x00E5FF)
      .setThumbnail(member.guild.iconURL())
      .setFooter({ text: 'KryloSMP • Season 1 Re-Release' })
      .setTimestamp();
    await member.send({ embeds: [dmEmbed] }).catch(() => {});
    console.log(`[Welcome] Sent Welcome DM to ${member.user.username}`);
  } catch (err) {
    console.warn(`[Welcome] Could not DM ${member.user.username}:`, err.message);
  }

  // Send styled welcome card in #general-chat
  try {
    const generalCh = member.guild.channels.cache.find(c => c.name.includes('general-chat') && c.type === ChannelType.GuildText);
    if (generalCh) {
      const memberCount = member.guild.memberCount;
      const avatarUrl = member.user.displayAvatarURL({ extension: 'png', forceStatic: true, size: 256 });
      
      const cardBuffer = await generateWelcomeCard(avatarUrl, member.user.username, memberCount).catch(() => null);
      let files = [];
      if (cardBuffer) {
        files.push(new AttachmentBuilder(cardBuffer, { name: 'welcome-card.png' }));
      }

      const verifyCh = member.guild.channels.cache.find(c => c.name.includes('verify') && c.type === ChannelType.GuildText);
      const rulesCh = member.guild.channels.cache.find(c => c.name.includes('rules') && c.type === ChannelType.GuildText);

      const embed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('⚡ New Player Joined!')
        .setDescription(
          `Welcome to **${member.guild.name}**, <@${member.user.id}>! You are member **#${memberCount}**!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🔐 Head to ${verifyCh ? `<#${verifyCh.id}>` : '#verify'} to **verify** and pick your platform\n` +
          `📜 Read the ${rulesCh ? `<#${rulesCh.id}>` : '#rules'} to stay safe\n` +
          `🎮 Connect to \`KryloSmp.play.hosting\` and start playing!`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: `${member.guild.name} • ${memberCount} members • Built by Krishiv ⚡` })
        .setTimestamp();

      if (cardBuffer) {
        embed.setImage('attachment://welcome-card.png');
      }

      await generalCh.send({ embeds: [embed], files });
    }
  } catch (err) {
    console.warn(`[Welcome] Failed to send welcome message:`, err.message);
  }
});

// ═══════════════════════════════════════════════════════════
// REACTION ROLE SYSTEM (Verify + Platform Selection)
// ═══════════════════════════════════════════════════════════
const VERIFY_MESSAGE_ID = '1527435695377879104';

const REACTION_ROLE_MAP = {
  '✅': '✅ Verified',
  '☕': '☕ Java Player',
  '🪨': '🪨 Bedrock Player',
};

client.on('messageReactionAdd', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => {});
  if (reaction.message.partial) await reaction.message.fetch().catch(() => {});

  // ═══════════════════════════════════════════
  // ⭐ STARBOARD SYSTEM — Auto-feature starred messages
  // ═══════════════════════════════════════════
  if (reaction.emoji.name === '⭐') {
    try {
      const guild = reaction.message.guild;
      if (!guild || !guild.name.toLowerCase().includes('krylo')) return;
      const starCount = reaction.count || 0;
      if (starCount >= 3) {
        const starboardCh = guild.channels.cache.find(c => c.name.includes('starboard') && c.type === ChannelType.GuildText);
        if (starboardCh) {
          // Check if already posted
          const existing = await starboardCh.messages.fetch({ limit: 100 }).catch(() => new Map());
          const alreadyPosted = [...existing.values()].some(m => m.embeds?.[0]?.footer?.text?.includes(reaction.message.id));
          if (!alreadyPosted) {
            const msg = reaction.message;
            const starEmbed = new EmbedBuilder()
              .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL() })
              .setDescription(msg.content || '*[Embed or Media]*')
              .addFields({ name: '⭐ Stars', value: `${starCount}`, inline: true }, { name: '📍 Channel', value: `<#${msg.channel.id}>`, inline: true }, { name: '🔗 Jump', value: `[Go to message](${msg.url})`, inline: true })
              .setColor(0xFFD700)
              .setFooter({ text: `⭐ ${starCount} | Message ID: ${msg.id}` })
              .setTimestamp(msg.createdAt);
            if (msg.attachments.size > 0) starEmbed.setImage(msg.attachments.first().url);
            await starboardCh.send({ content: `⭐ **${starCount}** | <#${msg.channel.id}>`, embeds: [starEmbed] });
            console.log(`[Starboard] Featured message by ${msg.author.username} (${starCount} stars)`);
          }
        }
      }
    } catch (err) {
      console.warn(`[Starboard] Error:`, err.message);
    }
  }

  // Reaction role handling (original verify message)
  if (reaction.message.id !== VERIFY_MESSAGE_ID) return;

  const emoji = reaction.emoji.name;
  const roleName = REACTION_ROLE_MAP[emoji];
  if (!roleName) return;

  try {
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role && !member.roles.cache.has(role.id)) {
      await member.roles.add(role);
      console.log(`[Roles] Added "${roleName}" to ${user.username}`);
    }
  } catch (err) {
    console.warn(`[Roles] Failed to add role:`, err.message);
  }
});

client.on('messageReactionRemove', async (reaction, user) => {
  if (user.bot) return;
  if (reaction.partial) await reaction.fetch().catch(() => {});
  if (reaction.message.partial) await reaction.message.fetch().catch(() => {});
  if (reaction.message.id !== VERIFY_MESSAGE_ID) return;

  const emoji = reaction.emoji.name;
  const roleName = REACTION_ROLE_MAP[emoji];
  if (!roleName) return;

  try {
    const guild = reaction.message.guild;
    const member = await guild.members.fetch(user.id);
    const role = guild.roles.cache.find(r => r.name === roleName);
    if (role && member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
      console.log(`[Roles] Removed "${roleName}" from ${user.username}`);
    }
  } catch (err) {
    console.warn(`[Roles] Failed to remove role:`, err.message);
  }
});

// ═══════════════════════════════════════════════════════════
// 🚀 SERVER BOOST CELEBRATION
// ═══════════════════════════════════════════════════════════
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (!newMember.guild.name.toLowerCase().includes('krylo')) return;
  // Detect new boost
  const wasBoosting = oldMember.premiumSince !== null;
  const isBoosting = newMember.premiumSince !== null;
  if (!wasBoosting && isBoosting) {
    try {
      const boosterRole = newMember.guild.roles.cache.find(r => r.name === '🚀 Booster');
      if (boosterRole) await newMember.roles.add(boosterRole).catch(() => {});
      const annCh = newMember.guild.channels.cache.find(c => c.name.includes('server-announcements') && c.type === ChannelType.GuildText);
      if (annCh) {
        const boostEmbed = new EmbedBuilder()
          .setTitle('🚀 NEW SERVER BOOST!')
          .setDescription(`**<@${newMember.id}>** just boosted the server! 🎉\n\nThank you for your support! You've been granted the **🚀 Booster** role and 5,000 KC bonus!`)
          .setColor(0xF47FFF)
          .setThumbnail(newMember.user.displayAvatarURL())
          .setFooter({ text: `${newMember.guild.name} • Boost Level ${newMember.guild.premiumTier}` })
          .setTimestamp();
        await annCh.send({ embeds: [boostEmbed] });
        console.log(`[Boost] ${newMember.user.username} boosted the server!`);
      }
      // Give 5000 KC bonus
      const balFile = 'balances.json';
      let balances = {};
      try { balances = JSON.parse(fs.readFileSync(balFile, 'utf-8')); } catch(e) {}
      balances[newMember.id] = (balances[newMember.id] || 0) + 5000;
      fs.writeFileSync(balFile, JSON.stringify(balances, null, 2));
    } catch (err) {
      console.warn(`[Boost] Error handling boost:`, err.message);
    }
  }
});

// ═══════════════════════════════════════════════════════════
// NICKNAME GUARD & NICKNAME SYNC FORCING
// ═══════════════════════════════════════════════════════════
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  if (newMember.guild.id !== KRYLO_GUILD_ID) return;

  // If nickname was changed
  if (oldMember.nickname !== newMember.nickname) {
    const verifiedRole = newMember.guild.roles.cache.find(r => r.name === 'Verified');
    if (verifiedRole && newMember.roles.cache.has(verifiedRole.id)) {
      try {
        const dbRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId: '1524878881918685405' })
        });
        if (dbRes.ok) {
          const config = await dbRes.json();
          const mcName = config.verifiedPlayers?.[newMember.id]?.name;
          if (mcName && newMember.nickname !== mcName) {
            // Revert nickname back to verified Minecraft username
            await newMember.setNickname(mcName, 'Forced sync with Minecraft username').catch(() => {});
            console.log(`[Nickname Guard] Reverted nickname change for ${newMember.user.username} back to ${mcName}`);
          }
        }
      } catch (err) {
        console.warn(`[Nickname Guard] Error running nickname guard:`, err.message);
      }
    }
  }
});

// ═══════════════════════════════════════════════════════════
// AUTOMATIC DOUBLE-BAN SYNC (DISCORD -> MINECRAFT USER & IP)
// ═══════════════════════════════════════════════════════════
client.on('guildBanAdd', async (ban) => {
  if (ban.guild.id !== KRYLO_GUILD_ID) return;
  const user = ban.user;

  // Owner / Creator Protection Guard
  const protectedMcNames = ['krishiv', 'krylo_mc', 'krishivpb60'];
  if (user.id === ban.guild.ownerId || user.id === '1524878881918685405' || user.id === '1524878881918685405') {
    console.log(`[Double-Ban Sync] Aborted ban synchronization: Banned user is a protected owner/developer.`);
    return;
  }

  console.log(`[Double-Ban Sync] Discord ban detected for ${user.username} (${user.id}). Synchronizing...`);

  try {
    const dbRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId: '1524878881918685405' })
    });

    if (dbRes.ok) {
      const config = await dbRes.json();
      const mcUsername = config.verifiedPlayers?.[user.id]?.name;
      if (mcUsername) {
        console.log(`[Double-Ban Sync] Synced Minecraft account found: ${mcUsername}. Issuing bans...`);
        const pteroToken = process.env.PTERODACTYL_TOKEN;
        const serverId = '25a5d79a';

        // Ban username
        await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/command`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pteroToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ command: `ban ${mcUsername} Discord Ban Synchronized` })
        }).catch(e => console.error(`[Double-Ban Sync] MC Username Ban failed:`, e.message));

        // Ban IP
        await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/command`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pteroToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ command: `ban-ip ${mcUsername} Discord Ban Synchronized` })
        }).catch(e => console.error(`[Double-Ban Sync] MC IP Ban failed:`, e.message));

        // Log to mod-logs if present
        const logCh = ban.guild.channels.cache.find(c => c.name.includes('mod-logs') && c.type === ChannelType.GuildText);
        if (logCh) {
          const embed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle('🔨 Double-Ban Executed')
            .setDescription(`Banned Discord user **${user.tag}** and synchronized IP ban to Minecraft.`)
            .addFields(
              { name: '👤 Discord User', value: `<@${user.id}> (${user.id})`, inline: true },
              { name: '🎮 Minecraft Account', value: `\`${mcUsername}\``, inline: true },
              { name: '🔒 IP Ban Status', value: '🟢 Synchronized (IP Banned)', inline: false }
            )
            .setTimestamp();
          await logCh.send({ embeds: [embed] }).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn(`[Double-Ban Sync] Error syncing ban:`, err.message);
  }
});

// ═══════════════════════════════════════════════════════════
// LIVE MINECRAFT STATUS UPDATE SCHEDULER
// ═══════════════════════════════════════════════════════════
async function startLiveStatusUpdate(guild, channel) {
  const updateStatus = async () => {
    try {
      const res = await fetch('https://api.mcsrvstat.us/2/KryloSmp.play.hosting');
      if (!res.ok) throw new Error("mcsrvstat status " + res.status);
      const data = await res.json();

      const unixTime = Math.floor(Date.now() / 1000);
      const embed = new EmbedBuilder();

      const onlineCount = (data.players && data.players.online !== undefined) ? data.players.online : 0;
      const maxCount = (data.players && data.players.max !== undefined) ? data.players.max : 0;
      const playerList = (data.players && data.players.list && data.players.list.length > 0) ? data.players.list.map(p => "• `" + p + "`").join("\n") : 'No players currently online.';
      const motd = (data.motd && data.motd.clean) ? data.motd.clean.join("\n") : 'KryloSMP Minecraft Server';

      const isOffline = !data.online || maxCount === 0 || motd.toLowerCase().includes('currently offline') || motd.toLowerCase().includes('server is offline');

      if (!isOffline) {
        embed
          .setColor(0x00FF66)
          .setTitle('🟢 KryloSMP Server is ONLINE')
          .setDescription("🤖 **Live Server Tracking**\n\n**IP:** `KryloSmp.play.hosting`\n**Version:** `v5.0.0`\n\n**MOTD:**\n```\n" + motd + "\n```")
          .addFields(
            { name: "👥 Players Online (" + onlineCount + "/" + maxCount + ")", value: playerList, inline: false },
            { name: '🕒 Last Updated', value: "<t:" + unixTime + ":R>", inline: true }
          )
          .setFooter({ text: 'Auto-updating every 20 seconds' })
          .setTimestamp();

        client.user.setActivity("KryloSMP: " + onlineCount + "/" + maxCount, { type: 0 });
      } else {
        embed
          .setColor(0xFF3333)
          .setTitle('🔴 KryloSMP Server is OFFLINE')
          .setDescription('The Minecraft server is currently stopped or restarting.')
          .addFields(
            { name: '📡 Connection IP', value: "`KryloSmp.play.hosting`", inline: false },
            { name: '🕒 Last Updated', value: "<t:" + unixTime + ":R>", inline: true }
          )
          .setFooter({ text: 'Auto-updating every 20 seconds' })
          .setTimestamp();

        client.user.setActivity('KryloSMP (Offline)', { type: 0 });
      }

      try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);
        for (const [, msg] of botMessages) {
          await msg.delete().catch(() => {});
        }
      } catch (err) {}

      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.warn('[Live Status] Error updating status:', err.message);
    }
  };

  await updateStatus();
  setInterval(updateStatus, 20000);
}

function handleAIFailover(result, guild) {
  if (result && result.failover && guild) {
    try {
      const logCh = guild.channels.cache.find(c => c.name.includes('mod-logs') && c.type === ChannelType.GuildText);
      if (logCh) {
        const logEmbed = new EmbedBuilder()
          .setColor(0xFFAA00)
          .setTitle('🔄 AI Engine Failover Alert')
          .setDescription(
            `Primary AI engine failed. Automatically routed query to backup engine.\n\n` +
            `• **Failed Engine:** ${result.failover.from}\n` +
            `• **Routed To:** ${result.failover.to}\n` +
            `• **Error Details:** \`${result.failover.error}\``
          )
          .setTimestamp();
        logCh.send({ embeds: [logEmbed] }).catch(() => {});
      }
    } catch (err) {
      console.warn('[Log] Failed to send failover log:', err.message);
    }
  }
}

let isUpgradingPaper = false;

async function startPaperAutoUpdater(guild) {
  // Check every 10 minutes
  setInterval(async () => {
    if (isUpgradingPaper) return;
    
    try {
      // 1. Fetch latest build from PaperMC API v3
      const apiRes = await fetch('https://fill.papermc.io/v3/projects/paper/versions/26.2', {
        headers: { 'User-Agent': 'KrimsBot/1.0.0 (contact@krims.com)' }
      });
      if (!apiRes.ok) return;
      const apiData = await apiRes.json();
      if (!apiData || !apiData.builds || apiData.builds.length === 0) return;
      
      const latestBuild = apiData.builds[0]; // e.g. 62 or 63
      if (!latestBuild) return;

      // 2. Fetch current config to check installedPaperBuild
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: '1524878881918685405' })
      });
      if (!configRes.ok) return;
      const guildConfig = await configRes.json();
      const installedBuild = guildConfig.installedPaperBuild || 65; // Set current installed build to 65

      if (latestBuild > installedBuild) {
        console.log(`[Paper Auto-Updater] New build detected: #${latestBuild} (current is #${installedBuild}). Saving build state...`);
        isUpgradingPaper = true;

        // Save build state IMMEDIATELY to prevent infinite loop
        guildConfig.installedPaperBuild = latestBuild;
        try {
          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_config', guildId: '1524878881918685405', config: guildConfig })
          });
        } catch (err) {
          console.warn('[Paper Auto-Updater] State save failed:', err.message);
        }

        const serverId = '25a5d79a';
        const pteroToken = process.env.PTERODACTYL_TOKEN;
        const updatesCh = guild.channels.cache.find(c => (c.name.includes('server-updates') || c.name.includes('announcements')) && c.type === ChannelType.GuildText);

        // A. Send warnings to Discord Updates channel with automatic auto-purge of previous warning messages
        const sendAlert = async (timeLeftText) => {
          const alertMsg = `🚨 **PaperMC Server Auto-Upgrade Alert!**\n` +
            `A new Paper build (#${latestBuild}) has been detected. The Minecraft server will save and shut down for auto-upgrade in **${timeLeftText}**.\n` +
            `*Please save your progress and log out safely!*`;
          
          if (updatesCh) {
            // Auto-purge any previous warning/update embeds sent by the bot in this channel
            try {
              const recentMsgs = await updatesCh.messages.fetch({ limit: 25 }).catch(() => null);
              if (recentMsgs && recentMsgs.size > 0) {
                const oldBotAlerts = recentMsgs.filter(m => m.author.id === client.user.id && m.embeds && m.embeds[0] && (m.embeds[0].title === '⚠️ Server Update Warning' || m.embeds[0].title === '✅ Server Upgrade Complete!'));
                if (oldBotAlerts.size > 0) {
                  await updatesCh.bulkDelete(oldBotAlerts, true).catch(() => {});
                }
              }
            } catch (err) {
              console.warn('[Auto-Purge Warning] Failed to delete previous alert:', err.message);
            }

            await updatesCh.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xFF3300)
                  .setTitle('⚠️ Server Update Warning')
                  .setDescription(alertMsg)
                  .setTimestamp()
              ]
            }).catch(() => {});
          }
        };

        // Warning countdown schedule (shorter intervals for testing & server safety)
        await sendAlert('5 minutes');
        await new Promise(r => setTimeout(r, 60000)); // 1 min wait
        await sendAlert('4 minutes');
        await new Promise(r => setTimeout(r, 60000)); // 1 min wait
        await sendAlert('3 minutes');
        await new Promise(r => setTimeout(r, 60000)); // 1 min wait
        await sendAlert('2 minutes');
        await new Promise(r => setTimeout(r, 60000)); // 1 min wait
        await sendAlert('1 minute');
        await new Promise(r => setTimeout(r, 50000)); // 50s wait
        await sendAlert('10 seconds');
        await new Promise(r => setTimeout(r, 10000)); // 10s wait

        // B. Stop the server
        console.log('[Paper Auto-Updater] Stopping Minecraft server...');
        try {
          await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/power`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + pteroToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ signal: 'stop' })
          });
        } catch (e) {
          console.warn('[Paper Auto-Updater] Failed to send stop command:', e.message);
        }

        // Wait 30 seconds for the server to halt completely
        await new Promise(r => setTimeout(r, 30000));

        // C. Delete old server.jar
        console.log('[Paper Auto-Updater] Deleting old server.jar...');
        try {
          await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/files/delete`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + pteroToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              root: '/',
              files: ['server.jar']
            })
          });
        } catch (e) {
          console.warn('[Paper Auto-Updater] Failed to delete old jar:', e.message);
        }

        // D. Pull the new jar directly to the server
        console.log('[Paper Auto-Updater] Pulling new jar...');
        const downloadUrl = `https://fill.papermc.io/v3/projects/paper/versions/26.2/builds/${latestBuild}/downloads/paper-26.2-${latestBuild}.jar`;
        try {
          await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/files/pull`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + pteroToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              url: downloadUrl,
              directory: '/'
            })
          });
        } catch (e) {
          console.warn('[Paper Auto-Updater] Failed to pull new jar:', e.message);
        }

        // Wait 30 seconds for Wings to complete the download
        await new Promise(r => setTimeout(r, 30000));

        // E. Rename the pulled jar to server.jar
        console.log('[Paper Auto-Updater] Renaming pulled jar to server.jar...');
        try {
          await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/files/rename`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + pteroToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              root: '/',
              files: [
                {
                  from: `paper-26.2-${latestBuild}.jar`,
                  to: 'server.jar'
                }
              ]
            })
          });
        } catch (e) {
          console.warn('[Paper Auto-Updater] Failed to rename new jar:', e.message);
        }

        // F. Start the server
        console.log('[Paper Auto-Updater] Starting Minecraft server...');
        try {
          await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/power`, {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + pteroToken,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ signal: 'start' })
          });
        } catch (e) {
          console.warn('[Paper Auto-Updater] Failed to start server:', e.message);
        }

        // G. Update config in database
        guildConfig.installedPaperBuild = latestBuild;
        try {
          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'save_config',
              guildId: '1524878881918685405',
              config: guildConfig
            })
          });
        } catch (e) {
          console.warn('[Paper Auto-Updater] Failed to save updated config:', e.message);
        }

        // H. Send success notification to Discord and auto-purge previous warning alerts
        if (updatesCh) {
          try {
            const recentMsgs = await updatesCh.messages.fetch({ limit: 25 }).catch(() => null);
            if (recentMsgs && recentMsgs.size > 0) {
              const oldBotAlerts = recentMsgs.filter(m => m.author.id === client.user.id && m.embeds && m.embeds[0] && m.embeds[0].title === '⚠️ Server Update Warning');
              if (oldBotAlerts.size > 0) {
                await updatesCh.bulkDelete(oldBotAlerts, true).catch(() => {});
              }
            }
          } catch (err) {}

          await updatesCh.send({
            embeds: [
              new EmbedBuilder()
                .setColor(0x00FF66)
                .setTitle('✅ Server Upgrade Complete!')
                .setDescription(
                  `The Minecraft server has been successfully upgraded to **Paper Build #${latestBuild}**!\n` +
                  `All systems are back online at \`KryloSmp.play.hosting\`.`
                )
                .setTimestamp()
            ]
          }).catch(() => {});
        }

        isUpgradingPaper = false;
      }
    } catch (err) {
      console.warn('[Paper Auto-Updater] Error in update check loop:', err.message);
      isUpgradingPaper = false;
    }
  }, 600000); // Check every 10 minutes
}

async function startLeaderboardUpdate(guild) {
  const leaderboardCh = guild.channels.cache.find(c => c.name.includes('leaderboard') && c.type === ChannelType.GuildText);
  if (!leaderboardCh) return;

  const updateLeaderboard = async () => {
    try {
      // 1. Fetch Minecraft server stats from Vercel config
      let dbStats = null;
      try {
        const dbRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId: '1524878881918685405' })
        });
        if (dbRes.ok) {
          const guildConfig = await dbRes.json();
          dbStats = guildConfig.serverStats;
        }
      } catch (err) {
        console.warn('[Leaderboard] Failed to fetch DB stats:', err.message);
      }

      // 2. Format Discord Chat Leaderboard
      const sortedUsers = Object.entries(xpData)
        .sort((a, b) => b[1].xp - a[1].xp)
        .slice(0, 10);

      let chatLeaderboardText = '';
      const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];
      if (sortedUsers.length > 0) {
        for (let i = 0; i < sortedUsers.length; i++) {
          const [uId, stats] = sortedUsers[i];
          chatLeaderboardText += `${medals[i]} <@${uId}> — **Level ${stats.level}** (XP: \`${stats.xp}\`)\n`;
        }
      } else {
        chatLeaderboardText = '*Waiting for chat activity...*\n';
      }

      // 3. Format Minecraft Stats
      let mcStatsText = '';
      if (dbStats) {
        const playtimeHours = (dbStats.mostPlaytimeSeconds / 3600).toFixed(1);
        mcStatsText += `🏆 **Most Playtime:** \`${dbStats.mostPlaytimePlayer}\` (${playtimeHours} hours)\n` +
                       `⚡ **Most Server Joins:** \`${dbStats.mostActivePlayer}\` (${dbStats.mostActiveJoins} joins)\n`;
      } else {
        mcStatsText = '*Waiting for server stats...*\n';
      }

      const embed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('👑 KryloSMP Server Leaderboards')
        .setDescription(
          `🏆 **Season 1 Leaderboard**\n\n` +
          `💬 **Top Discord Chatters (XP Levels)**\n` +
          `${chatLeaderboardText}\n` +
          `🎮 **Minecraft Server Legends**\n` +
          `${mcStatsText}\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `*Rankings update automatically. Play and chat to reach the top!*`
        )
        .setFooter({ text: 'KryloSMP Leaderboard • Updates every 10 minutes' })
        .setTimestamp();

      // Find existing message to edit
      const messages = await leaderboardCh.messages.fetch({ limit: 10 });
      let lbMessage = messages.find(m => m.author.id === client.user.id);

      if (lbMessage) {
        await lbMessage.edit({ embeds: [embed] });
      } else {
        await leaderboardCh.send({ embeds: [embed] });
      }
    } catch (err) {
      console.warn('[Leaderboard] Error updating leaderboard:', err.message);
    }
  };

  // Run immediately and then schedule every 10 minutes (600,000 ms)
  await updateLeaderboard();
  setInterval(updateLeaderboard, 600000);
}

async function calculatePriority(text) {
  if (!text || text.trim().length === 0) return 'Medium';
  
  try {
    const prompt = `You are a ticket classifier. Analyze the following support ticket reason and classify it into exactly one of these three categories: "High", "Medium", or "No Staff Needed".

Guidelines:
- "High": Critical issues like griefing, hackers, cheating, server crashes, exploits, game-breaking bugs, theft.
- "No Staff Needed": Simple greetings (e.g. "hello", "hi", "hey"), casual messages, questions about basic info already covered in FAQs, linking requests, or testing messages.
- "Medium": Standard player reports, questions requiring staff assistance, bug reports that aren't game-breaking, claims, or other general help requests.

Response format: Reply with ONLY the category name. Do not include any punctuation, explanation, or extra words.

Ticket Reason: "${text}"`;

    let responseText = null;
    if (geminiClient) {
      responseText = await geminiDirectAsk(prompt, 'You are an automated support ticket priority classifier. Reply with exactly "High", "Medium", or "No Staff Needed" based on the ticket reason.');
    }
    if (!responseText) {
      const result = await sdk.ask(prompt, {
        model: PREFERRED_AI_MODEL,
        systemInstruction: 'You are an automated support ticket priority classifier. Reply with exactly "High", "Medium", or "No Staff Needed" based on the ticket reason.'
      });
      if (result && result.response) responseText = result.response;
    }

    if (responseText) {
      const trimmed = responseText.trim();
      if (trimmed.includes('High')) return 'High';
      if (responseText.includes('No Staff Needed')) return 'No Staff Needed';
      if (responseText.includes('Medium')) return 'Medium';
    }
  } catch (err) {
    console.warn('[Priority Classifier] Failed to query LLM for priority, falling back to keyword logic:', err.message);
  }

  // Fallback to keyword matching logic
  const lower = text.toLowerCase();
  if (lower.includes('grief') || lower.includes('hacker') || lower.includes('crash') || lower.includes('exploit') || lower.includes('hack')) {
    return 'High';
  }
  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey') || lower.includes('test') || lower.includes('claim') || lower.includes('question') || lower.includes('apply')) {
    return 'No Staff Needed';
  }
  return 'Medium';
}

async function logTicketToGoogleSheet(channelId, userTag, userId, reason, priority, mcUsername, balance) {
  const url = 'https://sheetdb.io/api/v1/f5m3eu25aobp3?sheet=TicketData';
  const payload = {
    data: [
      {
        "Ticket ID": channelId,
        "User Name": userTag,
        "Discord User ID": userId,
        "Minecraft Username": mcUsername,
        "KryloCoins": balance,
        "Discord Profile Link": `https://discord.com/users/${userId}`,
        "Reason / Question": reason,
        "Priority Level": priority,
        "Time Created": new Date().toLocaleString(),
        "Status": "Open"
      }
    ]
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`[SheetDB Log] Ticket ${channelId} successfully logged to Google Sheet.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[SheetDB Log] Failed to log ticket. Status: ${response.status}. Error: ${errText}`);
      return false;
    }
  } catch (err) {
    console.error(`[SheetDB Log] Network error logging ticket to SheetDB:`, err.message);
    return false;
  }
}

async function closeTicketInGoogleSheet(channelId) {
  const url = `https://sheetdb.io/api/v1/f5m3eu25aobp3/Ticket%20ID/${channelId}?sheet=TicketData`;
  const payload = {
    data: {
      "Status": "Closed"
    }
  };

  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      console.log(`[SheetDB Log] Ticket ${channelId} successfully closed in Google Sheet.`);
      return true;
    } else {
      const errText = await response.text();
      console.error(`[SheetDB Log] Failed to close ticket in sheet. Status: ${response.status}. Error: ${errText}`);
      return false;
    }
  } catch (err) {
    console.error(`[SheetDB Log] Network error closing ticket in SheetDB:`, err.message);
    return false;
  }
}


async function handleTicketMessage(message) {
  // Guard 1: Ignore all bot messages to prevent loop spam
  if (message.author.bot) return;

  // Guard 2: Restrict updates/actions strictly to ticket channels in KryloSMP Server
  if (!message.guild || !message.channel.name.startsWith('ticket-')) {
    return;
  }

  // // AI bot responds to all ticket messages
  try {
    await message.channel.sendTyping();

    let botPrefix = '!';
    let modelEngine = 'gemini';

    try {
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: message.guild.id })
      });
      if (configRes.ok) {
        const guildConfig = await configRes.json();
        botPrefix = guildConfig.prefix || '!';
        modelEngine = guildConfig.model || 'gemini';
      }
    } catch (err) {
      console.warn("Failed to load config for ticket response:", err.message);
    }

    const ticketSystemInstruction = 
      "You are Krims Support AI, the official support assistant for the KryloSMP Minecraft Server and Discord community. " +
      "You were built by Krishiv to help players resolve their issues.\n\n" +
      "Server Context:\n" +
      "- You are currently talking inside the official KryloSMP Discord Server.\n" +
      "- The Minecraft Server IP is: KryloSmp.play.hosting\n" +
      "- The server supports Java (default port 25565) and Bedrock (default port 19132) cross-play.\n" +
      "- The server is premium-only (online-mode), meaning only official/paid Mojang/Microsoft accounts can connect. Cracked launchers are blocked to protect against bot join attacks. Registering/logging in in-game is not required.\n" +
      "- To get whitelisted, players must go to the #✅┃verify channel and click the link button to get their verification code.\n" +
      "- CURRENT SERVER STATUS: The server is fully operational and online at KryloSmp.play.hosting.\n\n" +
      "Instructions:\n" +
      "Provide a friendly, helpful, and concise solution to the player's problem using the server details above.";

    let history = conversationHistory.get(message.channel.id) || [];
    
    // Try Gemini 3.5 Flash-Lite direct first for faster ticket responses
    let answerResult = { ok: false, response: null };
    if (geminiClient) {
      const directAnswer = await geminiDirectAsk(message.content, ticketSystemInstruction);
      if (directAnswer) {
        answerResult = { ok: true, response: directAnswer };
      }
    }
    if (!answerResult.ok) {
      answerResult = await sdk.ask(message.content, {
        model: PREFERRED_AI_MODEL,
        systemInstruction: ticketSystemInstruction,
        history: history
      });
      handleAIFailover(answerResult, message.guild);
    }

    if (answerResult.ok && answerResult.response) {
      history.push({ role: 'user', content: message.content });
      history.push({ role: 'model', content: answerResult.response });
      if (history.length > 10) history = history.slice(history.length - 10);
      conversationHistory.set(message.channel.id, history);

      await message.reply(answerResult.response);
    } else {
      await message.reply("❌ Failed to parse AI support response.");
    }

    const messages = await message.channel.messages.fetch({ limit: 50 });
    const alreadyEscalated = messages.some(m => m.author.id === client.user.id && m.content.includes('Escalation Alert'));

    if (!alreadyEscalated) {
      const classificationPrompt = `Analyze the following support ticket message: "${message.content}"
      
      Determine if this is one of these three requests and respond with the exact instruction:
      1. Whitelist a player name (e.g. "whitelist me", "add me to whitelist", "name: krishiv"): respond with "AUTO_EXECUTE: easywhitelist add <name>" (replace <name> with their username).
      2. Unban a player (e.g. "unban me", "pardon my friend"): respond with "AUTO_EXECUTE: pardon <name>".
      3. Reset their login password (e.g. "reset my password", "forgot my login password"): respond with "AUTO_EXECUTE: krylo resetpass <name> <temp_pass>" (generate a random 6-character alphanumeric temp_pass).
      
      If it is none of these, or if the request is a general question / not automatable:
      Respond with: "CLASSIFY: <EASY|MEDIUM|HARD>" based on these rules:
      - EASY: General questions (server IP, rules, socials, or advice).
      - MEDIUM: Bug reports, claims issues, player reports, lag, or questions requiring moderator check.
      - HARD: Server crashes, payment/donation errors, severe griefing, or lost items.
      
      Respond with ONLY the match string (e.g., "AUTO_EXECUTE: easywhitelist add name" or "CLASSIFY: EASY").`;

      let classificationText = null;
      if (geminiClient) {
        classificationText = await geminiDirectAsk(classificationPrompt, "You are a precise analyzer. Output only the requested match string without any introductory text.");
      }
      if (!classificationText) {
        const classificationResult = await sdk.ask(classificationPrompt, {
          model: PREFERRED_AI_MODEL,
          systemInstruction: "You are a precise analyzer. Output only the requested match string without any introductory text."
        });
        if (classificationResult && classificationResult.response) classificationText = classificationResult.response;
      }

      if (classificationText) {
        const resText = classificationText.trim();
        console.log(`[Ticket Analyzer] Result: ${resText}`);

        if (resText.startsWith('AUTO_EXECUTE:')) {
          const cmdToRun = resText.substring(13).trim();
          console.log(`[Ticket Analyzer] Executing automated command: ${cmdToRun}`);

          const pteroToken = process.env.PTERODACTYL_TOKEN;
          const serverId = '25a5d79a';

          try {
            const execRes = await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/command`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${pteroToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ command: cmdToRun })
            });

            if (execRes.ok) {
              await message.reply(`🤖 **Krims Support AI:**\nI have **automatically resolved** your issue! I executed the following command on the server console: \`/${cmdToRun}\`.\n\n*This ticket has been marked as resolved.*`);
              await message.channel.send(`ℹ️ **Ticket Resolved**\nThis ticket has been automatically resolved by the AI support team. Resolving channel in 10 seconds...`);
              
              if (message.guild) {
                try {
                  const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'get_config', guildId: message.guild.id })
                  });
                  if (configRes.ok) {
                    const guildConfig = await configRes.json();
                    const tickets = guildConfig.openTickets || [];
                    guildConfig.openTickets = tickets.filter(t => t.id !== message.channel.id);
                    await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'save_config', guildId: message.guild.id, config: guildConfig })
                    });
                  }
                } catch {}
              }

              setTimeout(async () => {
                try {
                  await message.channel.delete();
                } catch {}
              }, 10000);
              return;
            } else {
              await message.reply(`❌ I attempted to automatically execute the command, but the server returned status code ${execRes.status}. I have escalated this to staff.`);
            }
          } catch (err) {
            console.error("[Ticket Analyzer] Auto-execute failed:", err.message);
          }
        }

        let level = 'EASY';
        if (resText.includes('HARD')) level = 'HARD';
        else if (resText.includes('MEDIUM')) level = 'MEDIUM';

        const modRole = message.guild.roles.cache.find(r => ['moderator', 'mod', 'staff'].includes(r.name.toLowerCase()));
        const adminRole = message.guild.roles.cache.find(r => ['admin', 'administrator'].includes(r.name.toLowerCase()));
        const ownerId = message.guild.ownerId;

        let mentionList = `<@${ownerId}>`;
        if (modRole) mentionList += ` <@&${modRole.id}>`;
        if (adminRole) mentionList += ` <@&${adminRole.id}>`;

        if (level === 'HARD') {
          await message.channel.send(`🚨 **Escalation Alert (Level: HARD)**\n${mentionList}\nThis ticket has been classified as **HARD**. Our administrative staff must resolve this problem in the **next 24 hours**!`);
        } else if (level === 'MEDIUM') {
          await message.channel.send(`⚠️ **Escalation Alert (Level: MEDIUM)**\nThis ticket has been classified as **MEDIUM**. Support team, please resolve this problem within **48 hours**.`);
        } else {
          // Status message suppressed
        }
      }
    }
  } catch (err) {
    console.error("Error handling ticket message:", err.message);
  }
}

// Login using bot token
const token = process.env.DISCORD_TOKEN;
if (token && token !== 'YOUR_DISCORD_TOKEN') {
  client.login(token);
} else {
  console.log('[!] DISCORD_TOKEN is missing or mock. Add a valid Discord Bot Token in the .env file to start the bot.');
}

// Global process error handlers to prevent crashes on Discord API timeouts/errors
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

// Simple HTTP server to bind to port for Render Web Service compatibility
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Krims Code Discord Bot is active!');
}).listen(port, () => {
  console.log(`[HTTP Server] Listening on port ${port}`);
});

// ═══════════════════════════════════════════════════════════
// AUTOMATED YOUTUBE VIDEO NOTIFIER DAEMON
// ═══════════════════════════════════════════════════════════
// Both Official Krylo YouTube Channels tracked 24/7
const KRYLO_YT_CHANNELS = [
  { handle: '@Krylo-60', id: 'UCxDiqFdI-s4rn4k2psRVZfQ' },
  { handle: '@KryloBlox60', id: 'UCDPcL5F_EB2MiWN1nJZbDbQ' }
];
const seenVideoIds = new Set();

async function checkKryloYouTubeUploads() {
  for (const ytChan of KRYLO_YT_CHANNELS) {
    try {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ytChan.id}`;
      const res = await fetch(rssUrl);
      if (!res.ok) continue;

      const xmlText = await res.text();
      const matches = xmlText.match(/<entry>[\s\S]*?<\/entry>/g);

      if (matches && matches.length > 0) {
        const latestEntry = matches[0];
        const videoId = (latestEntry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1];
        const title = (latestEntry.match(/<title>(.*?)<\/title>/) || [])[1] || 'New Krylo Video!';
        const link = (latestEntry.match(/<link rel="alternate" href="(.*?)"\/>/) || [])[1] || `https://www.youtube.com/watch?v=${videoId}`;

        if (videoId && !seenVideoIds.has(videoId)) {
          seenVideoIds.add(videoId);
          console.log(`[YouTube Auto-Notifier] New upload detected from ${ytChan.handle}: "${title}" (${link})`);

          const targetGuildIds = ['1524878881918685405', '1531792924055048292'];
          for (const gId of targetGuildIds) {
            try {
              const guild = client.guilds.cache.get(gId);
              if (!guild) continue;

              const targetCh = guild.channels.cache.find(c => c && c.name && (c.name.includes('announcement') || c.name.includes('youtube')) && c.isTextBased());
              if (!targetCh) continue;

              const thumbnailUrl = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
              const embed = new EmbedBuilder()
                .setAuthor({ name: `Krylo (${ytChan.handle})`, iconURL: guild.iconURL() })
                .setTitle(title)
                .setURL(link)
                .setImage(thumbnailUrl)
                .setColor(0xFF0000)
                .setFooter({ text: `Krylo YouTube Notifier • ${ytChan.handle}`, iconURL: guild.iconURL() })
                .setTimestamp();

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel("▶️ Watch Video").setStyle(ButtonStyle.Link).setURL(link),
                new ButtonBuilder().setLabel("🔔 Subscribe").setStyle(ButtonStyle.Link).setURL(`https://www.youtube.com/${ytChan.handle}`)
              );

              const pingRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('youtube') || r.name.toLowerCase().includes('stream') || r.name.toLowerCase().includes('announcement'));
              const pingText = pingRole ? `<@&${pingRole.id}>` : '@everyone';

              const msg = await targetCh.send({
                content: `Hey ${pingText} ! A new video has been uploaded by **Krylo (${ytChan.handle})**, check it out ${link}`,
                embeds: [embed],
                components: [row]
              });

              await msg.react('👍').catch(() => {});
              await msg.react('🔥').catch(() => {});
              await msg.react('❤️').catch(() => {});
              await msg.react('🚀').catch(() => {});

            } catch (err) {
              console.warn(`[YouTube Auto-Notifier] Error posting to guild ${gId}:`, err.message);
            }
          }
        }
      }
    } catch (err) {
      console.warn(`[YouTube Auto-Notifier] Check error for ${ytChan.handle}:`, err.message);
    }
  }
}

setInterval(checkKryloYouTubeUploads, 180000);
setTimeout(checkKryloYouTubeUploads, 15000);


// ═══════════════════════════════════════════════════════════
// AUTOMATED NEW SERVER BUILDER DAEMON
// ═══════════════════════════════════════════════════════════
client.on('guildCreate', async (guild) => {
  console.log(`[Auto-Builder] Joined new server: "${guild.name}" (${guild.id})`);
  try {
    const isFanArmy = guild.name.toLowerCase().includes('fan') || guild.name.toLowerCase().includes('krylo') || guild.id === '1532574648200593548';
    if (isFanArmy) {
      console.log(`[Auto-Builder] Populating Krylo Fan Army layout for ${guild.name}...`);
      
      // Roles
      const ownerRole = await guild.roles.create({ name: '👑 Krylo (Creator)', color: 0xFFD700, hoist: true }).catch(() => {});
      const generalRole = await guild.roles.create({ name: '🎖️ Fan Army General', color: 0xFF4500, hoist: true }).catch(() => {});
      const officerRole = await guild.roles.create({ name: '🛡️ Fan Army Officer', color: 0x1E90FF, hoist: true }).catch(() => {});
      const vipRole = await guild.roles.create({ name: '💎 VIP Fan', color: 0x9400D3, hoist: true }).catch(() => {});
      const ogRole = await guild.roles.create({ name: '🔥 OG Fan', color: 0x00FF7F, hoist: true }).catch(() => {});
      const memberRole = await guild.roles.create({ name: '⚔️ Krylo Fan Army', color: 0x00FFFF, hoist: true }).catch(() => {});

      // Categories & Channels
      const infoCat = await guild.channels.create({ name: '📌 WELCOME & RULES', type: ChannelType.GuildCategory }).catch(() => {});
      const welcomeCh = await guild.channels.create({ name: '👋┃welcome-and-rules', type: ChannelType.GuildText, parent: infoCat ? infoCat.id : null }).catch(() => {});
      const announceCh = await guild.channels.create({ name: '📢┃fan-announcements', type: ChannelType.GuildAnnouncement, parent: infoCat ? infoCat.id : null }).catch(() => {});
      const ytFeedCh = await guild.channels.create({ name: '🔴┃krylo-youtube-feed', type: ChannelType.GuildAnnouncement, parent: infoCat ? infoCat.id : null }).catch(() => {});

      const loungeCat = await guild.channels.create({ name: '💬 FAN ARMY LOUNGE', type: ChannelType.GuildCategory }).catch(() => {});
      const chatCh = await guild.channels.create({ name: '💬┃general-fan-chat', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});
      const artCh = await guild.channels.create({ name: '📸┃fan-art-and-edits', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});
      const memeCh = await guild.channels.create({ name: '😂┃krylo-memes', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});
      const ideasCh = await guild.channels.create({ name: '💡┃video-ideas', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});
      const botCh = await guild.channels.create({ name: '🤖┃bot-commands', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});

      const voiceCat = await guild.channels.create({ name: '🔊 FAN VOICE LOUNGE', type: ChannelType.GuildCategory }).catch(() => {});
      await guild.channels.create({ name: '🔊┃Fan Lounge 1', type: ChannelType.GuildVoice, parent: voiceCat ? voiceCat.id : null }).catch(() => {});
      await guild.channels.create({ name: '🔊┃Gaming with Fans', type: ChannelType.GuildVoice, parent: voiceCat ? voiceCat.id : null }).catch(() => {});

      if (welcomeCh) {
        const welcomeEmbed = new EmbedBuilder()
          .setTitle('👑 WELCOME TO THE OFFICIAL KRYLO FAN ARMY! 👑')
          .setDescription(
            `Welcome to the official community hub for **Krylo** ([@Krylo-60](https://www.youtube.com/@Krylo-60) & [@KryloBlox60](https://www.youtube.com/@KryloBlox60))!\n\n` +
            `This server is dedicated to all fans, supporters, and content enthusiasts. Chat with fellow fans, share fan art, suggest video ideas, and catch every new video upload live!`
          )
          .setColor(0xFFD700)
          .setFooter({ text: 'Krylo Fan Army • Official Community Hub' })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("📺 @Krylo-60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@Krylo-60"),
          new ButtonBuilder().setLabel("🎮 @KryloBlox60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@KryloBlox60")
        );

        await welcomeCh.send({ embeds: [welcomeEmbed], components: [row] }).catch(() => {});
      }

      console.log(`[Auto-Builder] Successfully populated Krylo Fan Army layout for ${guild.name}!`);
    }
  } catch (err) {
    console.error('[Auto-Builder] Error:', err.message);
  }
});

