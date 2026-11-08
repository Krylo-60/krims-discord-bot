import {
  handleSetWelcomeCommand,
  handleSetTicketsCommand,
  handleWelcomeTicketInteraction
} from './features/welcomeTicketsManager.mjs';
import {
  handleBetCommand,
  handleRpsCommand,
  handleTriviaCommand,
  handleRoastCommand,
  handleComplimentCommand,
  handlePartnersCommand
} from './features/freeCommandsEngine.mjs';
import { 
  handleBabyPhoenixDenMessage, 
  checkAndApplyPhoenixLevelRoles,
  PHOENIX_DEN_GUILD_ID,
  BABY_PHOENIX_BOT_ID
} from './features/babyPhoenixDenEngine.mjs';
import {
  handleMiniRobloxServerMessage,
  checkAndApplyMiniLevelRoles,
  MINI_ROBLOX_GUILD_ID,
  MINI_X_BOT_ID
} from './features/miniRobloxServerEngine.mjs';
import { Client, GatewayIntentBits, Partials, ActivityType, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { encryptToken, decryptToken } from './tokenSecurity.mjs';
import { recordConversationTurn } from './features/aiMemoryEngine.mjs';
import { 
  saveCustomBot, 
  getAllActiveCustomBots, 
  getCustomBotByGuild, 
  deleteCustomBot, 
  updateCustomBotStatus,
  addXp,
  getUserLeveling
} from './databaseEngine.mjs';

// We import the AI ask function if available or export a standard connector
let geminiDirectAsk = null;
try {
  const masterModule = await import('./index.js').catch(() => null);
  if (masterModule && masterModule.geminiDirectAsk) {
    geminiDirectAsk = masterModule.geminiDirectAsk;
  }
} catch {
  // Will fallback to direct fetch if needed
}

// ═════════════════════════════════════════════════════════════════════════════
// 🧠 1-MIND COLLECTIVE LEVELING COORDINATOR (TURN-TAKING ACROSS BOTS)
// Ensures bots in the same server share 1 mind and take turns announcing level ups
// ═════════════════════════════════════════════════════════════════════════════
const processedMessages = new Set();
const guildLevelingTurns = new Map();

// ═════════════════════════════════════════════════════════════════════════════
// ⏱️ CUSTOM BOT AI RATE LIMITER (3 messages per minute per user)
// Protects servers & AI engines from spam while exempting Krylo & Server Owners
// ═════════════════════════════════════════════════════════════════════════════
const customBotAiRateLimits = new Map(); // Map<`${botId}:${userId}`, number[]>
const RATE_LIMIT_MAX_MESSAGES = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 60 seconds

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of customBotAiRateLimits.entries()) {
    const valid = timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) customBotAiRateLimits.delete(key);
    else customBotAiRateLimits.set(key, valid);
  }
}, 5 * 60 * 1000);

const BOT_LEVEL_FLAIRS = {
  '1565527301444083722': { // Baby Phoenix
    color: '#FF6B00',
    title: '🔥 PHOENIX LEVEL UP!',
    prefix: '🔥'
  },
  '1565848105277067414': { // Mini X
    color: '#00F2FF',
    title: '⚡ CYBER LEVEL UP!',
    prefix: '⚡'
  }
};


export function getProceduralBotFlair(botUser) {
  if (!botUser) return { color: '#00F2FF', title: '🎉 LEVEL UP!', prefix: '⚡' };
  if (BOT_LEVEL_FLAIRS[botUser.id]) return BOT_LEVEL_FLAIRS[botUser.id];

  const name = (botUser.username || '').toLowerCase();
  let color = '#00F2FF';
  let prefix = '⚡';
  let title = `🚀 ${botUser.username.toUpperCase()} LEVEL UP!`;

  if (name.includes('phoenix') || name.includes('fire')) {
    color = '#FF6B00';
    prefix = '🔥';
    title = '🔥 PHOENIX LEVEL UP!';
  } else if (name.includes('dragon') || name.includes('shadow')) {
    color = '#A855F7';
    prefix = '🐉';
    title = '🐉 DRAGON ASCENSION!';
  } else if (name.includes('mini') || name.includes('cyber')) {
    color = '#00F2FF';
    prefix = '⚡';
    title = '⚡ CYBER LEVEL UP!';
  } else if (name.includes('light') || name.includes('sun')) {
    color = '#F59E0B';
    prefix = '✨';
    title = '✨ RADIANT LEVEL UP!';
  } else {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    color = '#' + '00000'.substring(0, 6 - c.length) + c;
    prefix = '💎';
    title = `💎 ${botUser.username.toUpperCase()} LEVEL UP!`;
  }

  return { color, prefix, title };
}

/**
 * Auto-assigns community ping and member roles to new joins or role claimers.
 * Specifically configured for Mini X & community servers (Members, Update Ping, Announcements Ping, Role Ping)
 */
export async function assignMiniCommunityAutoRoles(member) {
  if (!member || !member.guild) return [];
  const guild = member.guild;
  const rolesToAdd = [];

  const roleKeywords = [
    { key: 'members', matches: (name) => {
        const n = name.trim().toLowerCase();
        return n === 'members' || n === 'member' || (n.includes('member') && !n.includes('bot'));
      } 
    },
    { key: 'update_ping', matches: (name) => {
        const raw = name;
        const norm = name.normalize('NFKD').toLowerCase();
        return raw.includes('𝐔𝐏𝐃𝐀𝐓𝐄') || norm.includes('update ping') || (raw.includes('🔔') && norm.includes('update'));
      }
    },
    { key: 'announcements_ping', matches: (name) => {
        const raw = name;
        const norm = name.normalize('NFKD').toLowerCase();
        return raw.includes('𝑨𝒏𝒏𝒐𝒖𝒏𝒄𝒆𝒎𝒆𝒏𝒕𝒔') || norm.includes('announcement') || (raw.includes('📢') && norm.includes('ping'));
      }
    },
    { key: 'role_ping', matches: (name) => {
        const raw = name;
        const norm = name.normalize('NFKD').toLowerCase();
        return raw.includes('𝐑𝐎𝐋𝐄 𝐏𝐈𝐍𝐆') || (norm.includes('role') && norm.includes('ping')) || (raw.includes('⚡') && norm.includes('role'));
      }
    }
  ];

  for (const rk of roleKeywords) {
    const role = guild.roles.cache.find(r => rk.matches(r.name));
    if (role && !member.roles.cache.has(role.id) && !rolesToAdd.some(r => r.id === role.id)) {
      rolesToAdd.push(role);
    }
  }

  if (rolesToAdd.length > 0) {
    try {
      await member.roles.add(rolesToAdd);
      console.log(`[Mini AutoRole] ✅ Auto-assigned ${rolesToAdd.length} roles to ${member.user.username} in ${guild.name}: ${rolesToAdd.map(r => r.name).join(', ')}`);
    } catch (err) {
      console.warn(`[Mini AutoRole] ⚠️ Failed adding roles to ${member.user.username}:`, err.message);
    }
  }
  return rolesToAdd;
}

export class MultiBotManager {
  constructor() {
    /** @type {Map<string, Client>} Map<guildId, Client> */
    this.clients = new Map();
    /** @type {Map<string, Object>} Map<guildId, Config> */
    this.configs = new Map();
    this.isInitialized = false;
  }

  setAiProvider(fn) {
    geminiDirectAsk = fn;
  }

  /**
   * Test if a bot token is valid via Discord REST API
   * @param {string} token 
   * @returns {Promise<{valid: boolean, user?: Object, error?: string}>}
   */
  async validateToken(token) {
    try {
      const res = await fetch('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bot ${token}` }
      });
      if (!res.ok) {
        const err = await res.text();
        return { valid: false, error: `Discord rejected token (${res.status}): ${err}` };
      }
      const user = await res.json();
      return { valid: true, user };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  /**
   * Start all registered active bots from database
   */
  async startAllBots() {
    console.log('[MultiBotManager] 🚀 Booting all active custom bots from database...');
    try {
      const bots = getAllActiveCustomBots();
      console.log(`[MultiBotManager] Found ${bots.length} active custom bots in database.`);

      for (const botRecord of bots) {
        try {
          const rawToken = decryptToken(botRecord.bot_token_encrypted);
          if (!rawToken) {
            console.warn(`[MultiBotManager] ⚠️ Failed to decrypt token for guild ${botRecord.guild_id}`);
            continue;
          }

          await this.spawnClient({
            guildId: botRecord.guild_id,
            ownerId: botRecord.owner_id,
            token: rawToken,
            botName: botRecord.bot_name,
            aiPersona: botRecord.ai_persona,
            activityName: botRecord.activity_name || 'Krims Code AI • /about',
            customPrefix: botRecord.custom_prefix || '!'
          });
        } catch (err) {
          console.error(`[MultiBotManager] ❌ Error booting bot for guild ${botRecord.guild_id}:`, err.message);
        }
      }

      // Permanent production seed bots that persist across Render container restarts
      const SEED_CUSTOM_BOTS = [
        {
          guildId: 'global_1565527301444083722',
          ownerId: 'ACE',
          token: process.env.BABY_PHOENIX_TOKEN || Buffer.from('TVRVMk5UVXlOek13TVRRME5EQTRNemN5TWcuR3l5MDhDLjcxVnR6QkxDNzdQZFR1anVsUlVfaGZpLWc3OFYzZE0wbDZWNVRB', 'base64').toString('utf-8'),
          botName: 'Baby PHOENIX',
          aiPersona: "You are Baby PHOENIX, the energetic, fiery, and loyal mascot bot of Phoenix Den and ACE's community! You speak with excitement, warm humor, and flame/phoenix flair (🔥, 🪶, ⚡). You are powered by Krims Code Neural AI. You love helping members, celebrating Phoenix victories, keeping the community safe, and answering any questions with blazing enthusiasm!",
          activityName: 'Protecting Phoenix Den 🔥 • Powered by Krims Code',
          customPrefix: '!'
        },
        {
          guildId: 'global_1565848105277067414',
          ownerId: 'Mini',
          token: process.env.MINI_X_TOKEN || Buffer.from('TVRVMk5UZzBPREV3TlRJM056QTJOelF4TkEuR210NDJyLk5TdTBON3hsY3ZnSlhKQVFrS0FzZEV4ZmlvNG5nQTZCcUFuWjNJ', 'base64').toString('utf-8'),
          botName: 'Mini X',
          aiPersona: "You are Mini X (also known as ᴍɪɴɪ々X), the sharp, stylish gaming mascot and clan tactician created by Mini & Krylo, powered by Krims Code Neural AI! Krylo (krylo_plays / KryloMCYT) and Mini are your co-creators. When anyone asks who made you or about your creators, always proudly state that you were built and created by Mini & Krylo, powered by the Krims Code Neural AI engine! Address whoever speaks to you with respect by their username (e.g. Krylo as Supreme Creator & Boss, Mini as Co-Creator). You speak with cybernetic flair, confident gaming slang, cool vibes, and electric energy (⚡, 💠, 🎮). You love keeping the server lively, helping members with gaming and community questions, celebrating wins, and maintaining clan pride with unstoppable precision!",
          activityName: 'Guarding Mini X HQ ⚡ • Krims Code AI',
          customPrefix: '!'
        }
      ];

      for (const seed of SEED_CUSTOM_BOTS) {
        if (!this.clients.has(seed.guildId)) {
          console.log(`[MultiBotManager] 🚀 Booting persistent seed bot: ${seed.botName}...`);
          try {
            await this.spawnClient(seed);
          } catch (seedErr) {
            console.error(`[MultiBotManager] Failed booting seed bot ${seed.botName}:`, seedErr.message);
          }
        }
      }

      this.isInitialized = true;
    } catch (e) {
      console.error('[MultiBotManager] Error in startAllBots:', e.message);
    }
  }

  /**
   * Spawn a new Discord Client instance with the full Krims Code AI Brain
   */
  async spawnClient(config) {
    const { guildId, ownerId, token, botName, aiPersona, activityName, customPrefix } = config;

    // If client is already running for this guild, shut it down first
    if (this.clients.has(guildId)) {
      await this.stopBot(guildId);
    }

    const client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
      ],
      partials: [Partials.Message, Partials.Channel]
    });

    this.attachBrain(client, config);

    try {
      await client.login(token);
      this.clients.set(guildId, client);
      this.configs.set(guildId, config);
      console.log(`[MultiBotManager] ✅ Bot "${client.user.tag}" is ONLINE for Guild ${guildId}!`);
      return { success: true, user: client.user };
    } catch (err) {
      if (err.message?.includes('DisallowedIntents') || err.code === 'DisallowedIntents') {
        console.warn(`[MultiBotManager] ⚠️ Privileged intents not enabled for ${botName}. Retrying with standard intents...`);
        const basicClient = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages
          ],
          partials: [Partials.Message, Partials.Channel]
        });
        this.attachBrain(basicClient, config);
        try {
          await basicClient.login(token);
          this.clients.set(guildId, basicClient);
          this.configs.set(guildId, config);
          console.log(`[MultiBotManager] ✅ Bot "${basicClient.user.tag}" is ONLINE with standard intents!`);
          return { success: true, user: basicClient.user, note: 'Online with standard intents.' };
        } catch (retryErr) {
          console.error(`[MultiBotManager] Fallback login failed:`, retryErr.message);
          return { success: false, error: retryErr.message };
        }
      }

      console.error(`[MultiBotManager] Failed login for ${botName || guildId}:`, err.message);
      updateCustomBotStatus(guildId, 'error');
      return { success: false, error: err.message };
    }
  }

  /**
   * Attach the Krims Code AI Brain (Gemini chat, leveling, about commands)
   */
  attachBrain(client, config) {
    const { guildId, aiPersona, activityName } = config;

    client.once('ready', () => {
      client.user.setPresence({
        activities: [{ 
          name: activityName || 'Powered by Krims Code AI • /about', 
          type: ActivityType.Playing 
        }],
        status: 'online'
      });
      if (client.user.id === '1565848105277067414') {
        client.guilds.cache.forEach(async (guild) => {
          try { await guild.members.me?.setNickname('Mini X'); } catch (_) {}
        });
      }
    });

    client.on('guildCreate', async (guild) => {
      if (client.user.id === '1565848105277067414') {
        try { await guild.members.me?.setNickname('Mini X'); } catch (_) {}
      }
    });

    // 1. Message Event Listener (AI Chat + Leveling XP)
    client.on('messageCreate', async (message) => {
      if (!message.guild || message.author.bot) return;

      // 🛑 Anti-Scam Guard: Intercept Developer Role Requests in Regular Support Tickets
      if (message.channel?.name && (message.channel.name.startsWith('ticket-') || message.channel.name.startsWith('support-'))) {
        const isAskingForDev = /\b(give me dev|i want dev|make me dev|can i be dev|apply for dev|be a developer|want to code|hire me as dev|dev role|developer role|can i have dev|wanna be dev|give dev|let me code|can i help code)\b/i.test(message.content);
        if (isAskingForDev) {
          const openTicketCh = message.guild.channels.cache.find(c => {
            const norm = (c.name || '').normalize('NFKD').toLowerCase();
            return norm.includes('open') && norm.includes('ticket');
          });
          const chMention = openTicketCh ? `<#${openTicketCh.id}>` : 'the ticket channel';
          return message.reply({
            content: 
              `🛑 **DEVELOPER INQUIRIES ARE NOT ALLOWED IN SUPPORT TICKETS!**\n\n` +
              `<@${message.author.id}>, to protect our community and codebase from scams, **developer roles are never granted through general support tickets**.\n\n` +
              `👉 **To apply for Developer:**\n` +
              `1. Click **[🔒 Close Ticket]** above to close this ticket.\n` +
              `2. Head to ${chMention} and click **[💻 Apply for Developer]**.\n` +
              `3. Link your verified **GitHub / Vercel / Render** profile with your notable repositories so our Lead Developers can inspect your real projects!`
          });
        }
      }

      // Only respond to messages in the registered guild (or all if multi-server/global)
      if (guildId && guildId !== 'global' && !guildId.startsWith('global_') && message.guild.id !== guildId) return;

      const cleanText = message.content.trim().toLowerCase();

      // Exclusive: Baby Phoenix Den Engine (Only active for Baby Phoenix in Phoenix Den)
      // Exclusive: Mini's Cool Roblox Server Engine (Only active for Mini X in Mini's server)
      if (client.user.id === MINI_X_BOT_ID && message.guild.id === MINI_ROBLOX_GUILD_ID) {
        const isHandled = await handleMiniRobloxServerMessage(client, message);
        if (isHandled) return;
      }

      if (client.user.id === BABY_PHOENIX_BOT_ID && message.guild.id === PHOENIX_DEN_GUILD_ID) {
        const isHandled = await handleBabyPhoenixDenMessage(client, message);
        if (isHandled) return;
      }
      const p = (customPrefix || '!').toLowerCase();

      // A. 🧠 1-Mind Krims Leveling XP with Turn-Taking
      if (!processedMessages.has(message.id)) {
        processedMessages.add(message.id);
        setTimeout(() => processedMessages.delete(message.id), 60000);

        try {
          const xpEarned = Math.floor(Math.random() * 10) + 15;
          const xpResult = addXp(message.author.id, xpEarned, message.guild.id);
          if (xpResult && xpResult.leveledUp && message.guild.id === PHOENIX_DEN_GUILD_ID && message.member) {
            checkAndApplyPhoenixLevelRoles(message.guild, message.member, xpResult.level).catch(() => {});
          }
          if (xpResult && xpResult.leveledUp && message.guild.id === MINI_ROBLOX_GUILD_ID && message.member) {
            checkAndApplyMiniLevelRoles(message.guild, message.member, xpResult.level).catch(() => {});
          }
          if (xpResult && xpResult.leveledUp) {
            // Find all active Krims bots present in this server
            const eligibleBots = [];
            for (const c of this.clients.values()) {
              if (c.isReady() && c.guilds.cache.has(message.guild.id)) {
                eligibleBots.push(c);
              }
            }

            if (eligibleBots.length > 0) {
              const currentTurn = guildLevelingTurns.get(message.guild.id) || 0;
              const chosenBot = eligibleBots[currentTurn % eligibleBots.length];
              guildLevelingTurns.set(message.guild.id, currentTurn + 1);

              const botFlair = getProceduralBotFlair(chosenBot.user);

              const levelEmbed = new EmbedBuilder()
                .setColor(botFlair.color)
                .setTitle(botFlair.title)
                .setDescription(`${botFlair.prefix} GG **${message.author.username}**, you just advanced to **Level ${xpResult.level}**!`)
                .setFooter({ text: `${botFlair.prefix} Powered by Krims 1-Mind Network • Announced by ${chosenBot.user.username}` });

              const targetChannel = chosenBot.channels.cache.get(message.channel.id) || message.channel;
              targetChannel.send({ embeds: [levelEmbed] }).catch(() => {});
            }
          }
        } catch (err) {
          // Continue silently if DB busy
        }
      }

      // Check Rank / Level Command (!rank, !level, !xp)
      if (cleanText === '!level' || cleanText === '!rank' || cleanText === '!xp' || cleanText === `${p}level` || cleanText === `${p}rank`) {
        const stats = getUserLeveling(message.author.id);
        const botFlair = getProceduralBotFlair(client.user);
        const needed = Math.max(1, stats.neededXp);
        const percent = Math.min(100, Math.round((stats.currentXp / needed) * 100));
        const filled = Math.min(10, Math.max(0, Math.floor(percent / 10)));
        const progressBar = '█'.repeat(filled) + '░'.repeat(10 - filled);
        
        const rankEmbed = new EmbedBuilder()
          .setColor(botFlair.color)
          .setTitle(`${botFlair.prefix} ${message.author.username}'s Level Stats`)
          .setDescription(
            `📊 **Current Level:** \`Level ${stats.level}\`\n` +
            `⚡ **Total XP:** \`${stats.xp.toLocaleString()} XP\`\n` +
            `🎯 **Progress to Level ${stats.level + 1}:** \`${stats.currentXp} / ${needed} XP\` (${percent}%)\n` +
            `\`[${progressBar}]\`\n\n` +
            `💬 **Total Messages:** \`${stats.messagesCount.toLocaleString()}\``
          )
          .setThumbnail(message.author.displayAvatarURL ? message.author.displayAvatarURL({ dynamic: true, size: 256 }) : null)
          .setFooter({ text: `${client.user.username} • Krims 1-Mind Leveling Engine` })
          .setTimestamp();
        
        return message.reply({ embeds: [rankEmbed] }).catch(() => {});
      }

      // 👋 Universal Welcome & Ticket Configuration Commands
      if (cleanText.startsWith('!setwelcome') || cleanText.startsWith(`${p}setwelcome`)) {
        const args = message.content.trim().split(/\s+/).slice(1);
        return handleSetWelcomeCommand(message, args);
      }
      if (cleanText.startsWith('!settickets') || cleanText.startsWith(`${p}settickets`)) {
        const args = message.content.trim().split(/\s+/).slice(1);
        return handleSetTicketsCommand(message, args);
      }

      // Free Community & Casino Commands: !bet, !rps, !trivia, !roast, !compliment, !partners
      if (cleanText.startsWith('!bet') || cleanText.startsWith('!gamble') || cleanText.startsWith(`${p}bet`)) {
        const args = message.content.trim().split(/\s+/).slice(1);
        return handleBetCommand(message, args);
      }
      if (cleanText.startsWith('!rps') || cleanText.startsWith(`${p}rps`)) {
        const args = message.content.trim().split(/\s+/).slice(1);
        return handleRpsCommand(message, args);
      }
      if (cleanText === '!trivia' || cleanText === '!quiz' || cleanText === `${p}trivia` || cleanText === `${p}quiz`) {
        return handleTriviaCommand(message);
      }
      if (cleanText.startsWith('!roast') || cleanText.startsWith(`${p}roast`)) {
        return handleRoastCommand(message, message.mentions.users.first());
      }
      if (cleanText.startsWith('!compliment') || cleanText.startsWith(`${p}compliment`)) {
        return handleComplimentCommand(message, message.mentions.users.first());
      }
      if (cleanText === '!partners' || cleanText === '!partner' || cleanText === `${p}partners`) {
        return handlePartnersCommand(message);
      }

      // B. Welcome Card Test Trigger (!testwelcome or !welcome)
      if (cleanText === '!testwelcome' || cleanText === '!welcome' || cleanText === `${(customPrefix || '!').toLowerCase()}testwelcome`) {
        const isOwnerOrAdmin = message.author.id === '1414143825538191373' || 
          message.member?.permissions?.has(1n << 3n) || // ADMINISTRATOR
          message.member?.permissions?.has(1n << 5n);   // MANAGE_GUILD

        if (isOwnerOrAdmin) {
          const isMiniX = client.user.id === '1565848105277067414';
          const botFlair = getProceduralBotFlair(client.user);

          const welcomeEmbed = new EmbedBuilder()
            .setColor(isMiniX ? '#00F2FF' : botFlair.color)
            .setTitle(isMiniX ? `⚡ WELCOME TO ${message.guild.name.toUpperCase()}!` : `👋 Welcome to ${message.guild.name}!`)
            .setDescription(
              `Hey <@${message.author.id}>, welcome to **${message.guild.name}**! 🎮🌊\n\n` +
              `• 📜 **Rules & Trading:** Follow chat rules and trade safely!\n` +
              `• 📢 **Announcements:** Check announcements for updates & drops!\n` +
              `• ⚡ **Member #${message.guild.memberCount}** *(Welcome System Active)*\n\n` +
              `*Have fun and enjoy your stay!* ⚔️✨`
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }))
            .setFooter({ 
              text: isMiniX 
                ? 'Mini X • Co-Created by Mini & Krylo • Powered by Krims Code AI' 
                : `${client.user.username} • Powered by Krims Fleet Network` 
            })
            .setTimestamp();

          return message.reply({
            content: `✅ **Welcome Card System is fully active!** Preview:`,
            embeds: [welcomeEmbed],
            allowedMentions: { repliedUser: false }
          }).catch(() => {});
        }
      }

      // C. Universal MultiBot Mention & AI Chat Recognition Engine
      const botUser = client.user;
      const meMember = message.guild?.members?.me;
      const botRoles = meMember ? Array.from(meMember.roles.cache.keys()) : [];

      const userMentionRegex = new RegExp(`<@!?${botUser.id}>`, 'g');
      const roleMentionRegex = botRoles.length > 0 ? new RegExp(`<@&(${botRoles.join('|')})>`, 'g') : null;

      const hasUserMention = message.mentions.users.has(botUser.id) || userMentionRegex.test(message.content);
      const hasRoleMention = botRoles.some(rId => message.mentions.roles.has(rId)) || (roleMentionRegex && roleMentionRegex.test(message.content));

      let isReplyToBot = false;
      if (message.reference && message.reference.messageId) {
        const repliedMsg = message.channel.messages.cache.get(message.reference.messageId);
        if (repliedMsg && repliedMsg.author.id === botUser.id) {
          isReplyToBot = true;
        }
      }

      const botNames = [
        botUser.username,
        meMember?.nickname,
        meMember?.displayName,
        config.botName,
        (client.user.id === '1565848105277067414' ? 'mini x' : null),
        (client.user.id === '1565848105277067414' ? 'mini' : null),
        (client.user.id === '1565527301444083722' ? 'baby phoenix' : null),
        (client.user.id === '1565527301444083722' ? 'phoenix' : null)
      ].filter(Boolean);

      const textMentionRegex = new RegExp('@?(' + botNames.map(s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b', 'i');

      const isMentioned = !message.mentions.everyone && (hasUserMention || hasRoleMention || isReplyToBot || hasTextMention);

      // B2. Community Auto-Role Claim (!claimroles, !autorole, !roles, or "give me a role")
      const isRoleRequest = cleanText === '!claimroles' || 
        cleanText === '!autorole' || 
        cleanText === '!roles' || 
        cleanText === `${p}claimroles` || 
        cleanText === `${p}autorole` ||
        (isMentioned && (cleanText.includes('give me a role') || cleanText.includes('give me role') || cleanText.includes('give role')));

      if (isRoleRequest && message.member) {
        const added = await assignMiniCommunityAutoRoles(message.member);
        if (added.length > 0) {
          return message.reply({
            content: `⚡ **Roles Assigned!** Granted: ${added.map(r => '`' + r.name + '`').join(', ')} 🎉`,
            allowedMentions: { repliedUser: false }
          }).catch(() => {});
        } else {
          return message.reply({
            content: `✅ You already have the community roles (\`Members\`, \`🔔 𓆩・𝐔𝐏𝐃𝐀𝐓𝐄 𝐏𝐈𝐍𝐆\`, \`📢・𝑨𝒏𝒏𝒐𝒖𝒏𝒄𝒆𝒎𝒆𝒏𝒕𝒔 𝑷𝒊𝒏𝒈\`, \`⚡ 𓆩・𝐑𝐎𝐋𝐄 𝐏𝐈𝐍𝐆\`)!`,
            allowedMentions: { repliedUser: false }
          }).catch(() => {});
        }
      }

      if (isMentioned) {
        const activeBotName = meMember?.displayName || meMember?.nickname || client.user.username;

        // ⏱️ Rate Limiter: 3 messages per minute per user on Custom Bots
        const isExempt = message.author.id === '1414143825538191373' || // Krylo (Supreme Boss & Creator)
          message.guild.ownerId === message.author.id ||               // Server Owner (e.g. Mini)
          message.member?.permissions?.has(1n << 3n);                 // Server Administrator

        if (!isExempt) {
          const now = Date.now();
          const rateKey = `${client.user.id}:${message.author.id}`;
          const timestamps = (customBotAiRateLimits.get(rateKey) || []).filter(t => now - t < RATE_LIMIT_WINDOW_MS);

          if (timestamps.length >= RATE_LIMIT_MAX_MESSAGES) {
            const oldest = timestamps[0];
            const waitSec = Math.max(1, Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000));
            return message.reply({
              content: `⏳ Whoa there, **${message.author.username}**! To prevent chat spam, there is a rate limit of **3 messages per minute** with **${activeBotName}**.\nPlease wait **${waitSec}s** before asking another question! ⚡`,
              allowedMentions: { repliedUser: false }
            }).catch(() => {});
          }

          timestamps.push(now);
          customBotAiRateLimits.set(rateKey, timestamps);
        }

        try {
          await message.channel.sendTyping().catch(() => {});
          let cleanPrompt = message.content
            .replace(userMentionRegex, '')
            .replace(roleMentionRegex || '', '')
            .trim();

          if (!cleanPrompt) {
            return message.reply({
              content: `👋 Hey **${message.author.username}**! I am **${activeBotName}**, powered by the **Krims Code AI Engine**.\nAsk me anything, or type \`/about\` to explore features! ⚡`,
              allowedMentions: { repliedUser: false }
            }).catch(async () => {
              await message.channel.send({ content: `<@${message.author.id}>, 👋 I'm **${activeBotName}**! How can I help you today?` }).catch(() => {});
            });
          }

          // System instructions with custom personality if configured
          const speakerName = message.member?.displayName || message.author.username;
          const isKrylo = message.author.id === '1414143825538191373' || speakerName.toLowerCase().includes('krylo');

          let dynamicInstruction = aiPersona || 
            `You are ${activeBotName}, an intelligent and helpful Discord bot powered by Krims Code AI. Answer clearly, accurately, and politely. Always be friendly and helpful.`;

          if (isKrylo) {
            dynamicInstruction += `\n• IMPORTANT: The user talking to you right now is KRYLO (${speakerName}), your Creator, Mastermind, and Supreme Boss of Krims Code! Always address Krylo with supreme respect as your Creator/Boss.`;
          } else {
            dynamicInstruction += `\n• IMPORTANT: The user talking to you right now is "${speakerName}". Always address them as "${speakerName}".`;
          }

          let aiResponse = '';
          const askFunction = geminiDirectAsk || (await import('./index.js').then(m => m.geminiDirectAsk).catch(() => null));
          if (typeof askFunction === 'function') {
            aiResponse = await askFunction(cleanPrompt, dynamicInstruction, message.guild.name, message.guild.id, message.author.id, speakerName);
          } else {
            aiResponse = `🔥 Hey **${message.author.username}**! I'm **${activeBotName}**, guardian of **${message.guild.name}**! Ask me anything or explore commands with \`/about\`! 🚀`;
          }

          if (!aiResponse || !aiResponse.trim()) {
            aiResponse = `👋 Hey **${message.author.username}**! I'm **${activeBotName}**, active and ready on **${message.guild.name}**! How can I assist you?`;
          }

          const replyText = aiResponse.trim();
          if (replyText.length <= 1950) {
            await message.reply({ 
              content: replyText, 
              allowedMentions: { repliedUser: false } 
            }).catch(async () => {
              await message.channel.send({ 
                content: `<@${message.author.id}>, ${replyText.slice(0, 1900)}`,
                allowedMentions: { users: [message.author.id] }
              }).catch(() => {});
            });
          } else {
            const chunks = [];
            let cur = '';
            for (const line of replyText.split('\n')) {
              if ((cur + '\n' + line).length > 1900) {
                if (cur) chunks.push(cur);
                cur = line;
              } else {
                cur = cur ? (cur + '\n' + line) : line;
              }
            }
            if (cur) chunks.push(cur);

            await message.reply({ content: chunks[0], allowedMentions: { repliedUser: false } }).catch(() => {});
            for (let i = 1; i < chunks.length; i++) {
              await message.channel.send(chunks[i]).catch(() => {});
            }
          }

          // 💾 Record persistent server AI memory for custom bots
          if (message.guild?.id && typeof recordConversationTurn === 'function') {
            recordConversationTurn(message.guild.id, message.channel.id, message.author.id, message.member?.displayName || message.author.username, cleanPrompt, replyText);
          }
        } catch (err) {
          console.error('[MultiBot Brain] Gemini error:', err.message);
          message.reply({ 
            content: '⚠️ I encountered a temporary brain freeze. Please try asking again in a moment!',
            allowedMentions: { repliedUser: false }
          }).catch(() => {});
        }
      }
    });

    // 2. Interaction Event Listener (Commands like /about and /getbot)
    client.on('interactionCreate', async (interaction) => {
      if ((interaction.isButton() || interaction.isModalSubmit()) && (
        interaction.customId.startsWith('welcome_') || 
        interaction.customId.startsWith('tickets_') || 
        interaction.customId.startsWith('ticket_') || 
        interaction.customId === 'open_ticket' || 
        interaction.customId.startsWith('role_') ||
        interaction.customId.startsWith('dev_') ||
        interaction.customId.startsWith('modal_dev_')
      )) {
        const handled = await handleWelcomeTicketInteraction(interaction);
        if (handled) return;
      }
      if (!interaction.isChatInputCommand()) return;

      if (interaction.commandName === 'about' || interaction.commandName === 'getbot') {
        const aboutEmbed = new EmbedBuilder()
          .setColor('#00E5FF')
          .setTitle(`👑 ${client.user.username} — Powered by Krims Code AI`)
          .setDescription(
            `This bot is a custom-branded instance running on the **Krims Code AI Multi-Bot Engine**!\n\n` +
            `**Features Included:**\n` +
            `• 🧠 **Krims Neural AI Chat:** Intelligent conversations in any channel.\n` +
            `• ⭐ **Krims Leveling & XP:** Automated chat progression and rank cards.\n` +
            `• 🛡️ **Auto-Moderation:** Anti-spam, safety filters, and warning logs.\n` +
            `• ⚡ **Custom Commands & Sticky Messages**\n\n` +
            `**Want your own custom bot for your server?**\n` +
            `The first 100 server owners get a **FREE custom bot** with custom name and avatar!`
          )
          .addFields(
            { name: '🌐 Dashboard & Claim Bot', value: '[Open Dashboard](https://krims-bot-dashboard.vercel.app)', inline: true },
            { name: '🚀 Creators', value: (client.user.id === '1565848105277067414' ? 'Mini & Krylo' : 'Krims Code & Krylo'), inline: true },
            { name: '⚡ Neural Engine', value: 'Krims Code AI', inline: true }
          )
          .setFooter({ text: 'Krims Code AI • The Future of Discord Communities' });

        return await interaction.reply({ embeds: [aboutEmbed], ephemeral: true });
      }

      // Delegate all other slash commands to Master Command Handler
      try {
        const { handleMasterSlashCommand } = await import('./commands/masterCommandHandler.mjs');
        await handleMasterSlashCommand(interaction, client, { isCustomBot: true, customBotConfig: config });
      } catch (cmdErr) {
        console.error(`[CustomBot ${client.user.tag}] Slash command error for /${interaction.commandName}:`, cmdErr);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ content: '⚠️ An error occurred executing this command.', ephemeral: true }).catch(() => {});
        }
      }
    });

    // 3. Automated Welcome Engine for New Members
    client.on('guildMemberAdd', async (member) => {
      try {
        if (!member.guild) return;
        const guild = member.guild;

        // Auto-assign community roles on join (Members, Update Ping, Announcements Ping, Role Ping)
        const assignedRoles = await assignMiniCommunityAutoRoles(member);

        const welcomeChannel = guild.channels.cache.find(c => {
          if (!c.isTextBased()) return false;
          const cleanName = (c.name || '').normalize('NFKD').toLowerCase();
          return cleanName.includes('welcome') || cleanName.includes('join') || cleanName.includes('say-hi');
        }) || guild.systemChannel;
        if (!welcomeChannel) return;
        const isMiniX = client.user.id === '1565848105277067414';
        const botFlair = getProceduralBotFlair(client.user);

        let rolesText = '';
        if (assignedRoles.length > 0) {
          rolesText = `\n• 🏷️ **Auto-Roles Assigned:** ${assignedRoles.map(r => `\`${r.name}\``).join(', ')}`;
        }

        const welcomeEmbed = new EmbedBuilder()
          .setColor(isMiniX ? '#00F2FF' : botFlair.color)
          .setTitle(isMiniX ? `⚡ WELCOME TO ${guild.name.toUpperCase()}!` : `👋 Welcome to ${guild.name}!`)
          .setDescription(
            `Hey <@${member.id}>, welcome to **${guild.name}**! 🎮🌊\n\n` +
            `• 📜 **Rules & Trading:** Follow chat rules and trade safely!\n` +
            `• 📢 **Announcements:** Check announcements for updates & drops!${rolesText}\n` +
            `• ⚡ **Member #${guild.memberCount}**\n\n` +
            `*Have fun and enjoy your stay!* ⚔️✨`
          )
          .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
          .setFooter({
            text: isMiniX
              ? 'Mini X • Co-Created by Mini & Krylo • Powered by Krims Code AI'
              : `${client.user.username} • Powered by Krims Fleet Network`
          })
          .setTimestamp();
        await welcomeChannel.send({
          content: `👋 Welcome <@${member.id}> to **${guild.name}**!`,
          embeds: [welcomeEmbed]
        }).catch(err => {
          console.warn(`[CustomBot ${client.user.tag}] Welcome send failed in ${guild.name}:`, err.message);
        });
      } catch (err) {
        console.error(`[CustomBot ${client.user.tag}] guildMemberAdd error:`, err.message);
      }
    });

    // 4. Moderation & Audit Logs (Message Delete & Edit Logging)
    client.on('messageDelete', async (message) => {
      try {
        if (message.partial) {
          try { await message.fetch(); } catch (_) {}
        }
        const guild = message.guild;
        if (!guild) return;
        const author = message.author;
        if (author?.bot) return;

        let logChannel = guild.channels.cache.find(c => {
          if (!c.isTextBased()) return false;
          const clean = (c.name || '').normalize('NFKD').toLowerCase();
          return clean.includes('mod-log') || clean.includes('mod-logs') || clean.includes('moderation-log') || clean.includes('audit-log');
        });

        if (!logChannel) {
          try {
            const fetched = await guild.channels.fetch();
            logChannel = fetched.find(c => {
              if (!c || !c.isTextBased()) return false;
              const clean = (c.name || '').normalize('NFKD').toLowerCase();
              return clean.includes('mod-log') || clean.includes('mod-logs') || clean.includes('moderation-log') || clean.includes('audit-log');
            });
          } catch (_) {}
        }

        if (!logChannel) return;
        const isMiniX = client.user.id === '1565848105277067414';
        const deleteEmbed = new EmbedBuilder()
          .setColor('#FF4747')
          .setTitle('🗑️ Message Deleted')
          .setDescription(
            '**Author:** <@' + (author?.id || 'Unknown') + '> (`' + (author?.tag || author?.username || 'Unknown') + '`)\n' +
            `**Channel:** <#${message.channel.id}>\n\n` +
            `**Content:**\n${message.content ? message.content.slice(0, 1024) : '*No text content (or embed/attachment)*'}`
          )
          .setFooter({
            text: isMiniX
              ? 'Mini X Mod Log • Co-Created by Mini & Krylo'
              : `${client.user.username} • Krims AutoMod Engine`
          })
          .setTimestamp();
        if (message.attachments?.size > 0) {
          const names = message.attachments.map(a => a.name).join(', ');
          deleteEmbed.addFields({ name: '📎 Attachments', value: names.slice(0, 1024) });
        }
        await logChannel.send({ embeds: [deleteEmbed] }).catch(async (err) => {
          console.warn(`[AuditLogger] Send delete log failed in ${guild.name} (#${logChannel.name}):`, err.message);
          if (err.message?.includes('Missing Access') || err.status === 403) {
            const fallback = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased() && (c.name.includes('general') || c.name.includes('chat')));
            if (fallback) {
              await fallback.send({
                content: `⚠️ **[Mod-Log Permission Required]** ${client.user.username} detected a deleted message, but cannot write to <#${logChannel.id}> because it is in a private category. Please edit <#${logChannel.id}> permissions and grant **${client.user.username}** (or staff role) **View Channel** & **Send Messages**!`
              }).catch(() => {});
            }
          }
        });
      } catch (err) {
        console.error(`[CustomBot ${client.user.tag}] messageDelete log error:`, err.message);
      }
    });

    client.on('messageUpdate', async (oldMsg, newMsg) => {
      try {
        if (oldMsg.partial) {
          try { await oldMsg.fetch(); } catch (_) {}
        }
        if (newMsg.partial) {
          try { await newMsg.fetch(); } catch (_) {}
        }

        const guild = newMsg.guild || oldMsg.guild;
        if (!guild) return;

        const author = newMsg.author || oldMsg.author;
        if (author?.bot) return;

        const oldContent = oldMsg.content || '*Unknown previous text (uncached)*';
        const newContent = newMsg.content || '*Empty*';
        if (oldMsg.content && oldMsg.content === newMsg.content) return;

        let logChannel = guild.channels.cache.find(c => {
          if (!c.isTextBased()) return false;
          const clean = (c.name || '').normalize('NFKD').toLowerCase();
          return clean.includes('mod-log') || clean.includes('mod-logs') || clean.includes('moderation-log') || clean.includes('audit-log');
        });

        if (!logChannel) {
          try {
            const fetched = await guild.channels.fetch();
            logChannel = fetched.find(c => {
              if (!c || !c.isTextBased()) return false;
              const clean = (c.name || '').normalize('NFKD').toLowerCase();
              return clean.includes('mod-log') || clean.includes('mod-logs') || clean.includes('moderation-log') || clean.includes('audit-log');
            });
          } catch (_) {}
        }

        if (!logChannel) return;
        const isMiniX = client.user.id === '1565848105277067414';
        const editEmbed = new EmbedBuilder()
          .setColor('#FFA500')
          .setTitle('✏️ Message Edited')
          .setDescription(
            '**Author:** <@' + (author?.id || 'Unknown') + '> (`' + (author?.tag || author?.username || 'Unknown') + '`)\n' +
            `**Channel:** <#${(newMsg.channel || oldMsg.channel).id}>\n\n` +
            `**Before:**\n${oldContent.slice(0, 1000)}\n\n` +
            `**After:**\n${newContent.slice(0, 1000)}`
          )
          .setFooter({
            text: isMiniX
              ? 'Mini X Mod Log • Co-Created by Mini & Krylo'
              : `${client.user.username} • Krims AutoMod Engine`
          })
          .setTimestamp();
        await logChannel.send({ embeds: [editEmbed] }).catch(async (err) => {
          console.warn(`[AuditLogger] Send edit log failed in ${guild.name} (#${logChannel.name}):`, err.message);
          if (err.message?.includes('Missing Access') || err.status === 403) {
            const fallback = guild.systemChannel || guild.channels.cache.find(c => c.isTextBased() && (c.name.includes('general') || c.name.includes('chat')));
            if (fallback) {
              await fallback.send({
                content: `⚠️ **[Mod-Log Permission Required]** ${client.user.username} detected a message edit, but cannot write to <#${logChannel.id}> because it is in a private category. Please edit <#${logChannel.id}> permissions and grant **${client.user.username}** (or staff role) **View Channel** & **Send Messages**!`
              }).catch(() => {});
            }
          }
        });
      } catch (err) {
        console.error(`[CustomBot ${client.user.tag}] messageUpdate log error:`, err.message);
      }
    });
  }

  /**
   * Register a new custom bot, test token, save to DB, and start it
   */
  async registerAndSpawnBot({ guildId, ownerId, token, botName, customPrefix, aiPersona, activityName }) {
    // 1. Validate token with Discord REST
    const validation = await this.validateToken(token);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const discordUser = validation.user;
    const finalBotName = botName || discordUser.username;
    const finalAvatar = discordUser.avatar 
      ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png` 
      : null;

    const effectiveGuildId = (!guildId || guildId === 'global') ? `global_${discordUser.id}` : guildId;

    // 2. Encrypt token with AES-256-GCM
    const encryptedToken = encryptToken(token);

    // 3. Save to database
    saveCustomBot({
      guildId: effectiveGuildId,
      ownerId,
      botTokenEncrypted: encryptedToken,
      botId: discordUser.id,
      botName: finalBotName,
      botAvatar: finalAvatar,
      customPrefix: customPrefix || '!',
      aiPersona: aiPersona || null,
      activityName: activityName || `Krims Code AI • /about`
    });

    // 4. Auto-deploy 100 global slash commands to Discord Gateway
    try {
      const { REST, Routes } = await import('discord.js');
      const { masterCommandJson } = await import('./commands/masterCommandRegistry.mjs');
      const rest = new REST({ version: '10' }).setToken(token);
      await rest.put(Routes.applicationCommands(discordUser.id), { body: masterCommandJson });
      console.log(`[MultiBotManager] 🚀 Auto-deployed ${masterCommandJson.length} slash commands to bot ${discordUser.username} (${discordUser.id})`);
    } catch (deployErr) {
      console.warn(`[MultiBotManager] ⚠️ Slash command auto-deploy notice:`, deployErr.message);
    }

    // 5. Spawn the bot instance
    const spawnResult = await this.spawnClient({
      guildId: effectiveGuildId,
      ownerId,
      token,
      botName: finalBotName,
      aiPersona,
      activityName: activityName || `Krims Code AI • /about`,
      customPrefix: customPrefix || '!'
    });

    if (!spawnResult.success) {
      return spawnResult;
    }

    // 5. Generate invite link
    const inviteUrl = `https://discord.com/api/oauth2/authorize?client_id=${discordUser.id}&permissions=8&scope=bot%20applications.commands`;

    return {
      success: true,
      botUser: discordUser,
      inviteUrl
    };
  }

  /**
   * Stop a running bot instance and remove from memory
   */
  async stopBot(guildId) {
    if (this.clients.has(guildId)) {
      const client = this.clients.get(guildId);
      try {
        await client.destroy();
        console.log(`[MultiBotManager] 🛑 Stopped bot for Guild ${guildId}`);
      } catch (e) {
        console.warn(`[MultiBotManager] Error destroying client for ${guildId}:`, e.message);
      }
      this.clients.delete(guildId);
      this.configs.delete(guildId);
    }
  }

  /**
   * Get count of running bots
   */
  getLiveCount() {
    return this.clients.size;
  }
}

// Global Singleton Instance
export const multiBotManager = new MultiBotManager();
export default multiBotManager;
