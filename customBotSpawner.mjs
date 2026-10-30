import { Client, GatewayIntentBits, Partials, ActivityType, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import { encryptToken, decryptToken } from './tokenSecurity.mjs';
import { 
  saveCustomBot, 
  getAllActiveCustomBots, 
  getCustomBotByGuild, 
  deleteCustomBot, 
  updateCustomBotStatus,
  addXp
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
          botName: 'ᴍɪɴɪ々X',
          aiPersona: "You are ᴍɪɴɪ々X, the sharp, stylish, futuristic mecha-clan mascot and gaming tactician for Mini's community! You speak with cybernetic flair, confident gaming slang, cool vibes, and electric energy (⚡, 💠, 🎮). You are powered by Krims Code Neural AI. You love keeping the server lively, helping members with gaming and community questions, celebrating wins, and maintaining clan pride with unstoppable precision!",
          activityName: 'Guarding ᴍɪɴɪ々X HQ ⚡ • Krims Code AI',
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
    });

    // 1. Message Event Listener (AI Chat + Leveling XP)
    client.on('messageCreate', async (message) => {
      if (!message.guild || message.author.bot) return;

      // Only respond to messages in the registered guild (or all if multi-server/global)
      if (guildId && guildId !== 'global' && !guildId.startsWith('global_') && message.guild.id !== guildId) return;

      // A. Krims-Style Leveling XP
      try {
        const xpEarned = Math.floor(Math.random() * 10) + 15;
        const xpResult = addXp(message.author.id, xpEarned);
        if (xpResult && xpResult.leveledUp) {
          const levelEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎉 LEVEL UP!')
            .setDescription(`GG **${message.author.username}**, you just advanced to **Level ${xpResult.level}**!`)
            .setFooter({ text: '⚡ Powered by Krims Code AI • Type /about for your free bot' });
          message.channel.send({ embeds: [levelEmbed] }).catch(() => {});
        }
      } catch (err) {
        // Continue silently if DB busy
      }

      // B. Google Gemini AI Chat (Triggered when bot is mentioned or replied to)
      const directMentionRegex = new RegExp(`<@!?${client.user.id}>`);
      const isMentioned = (message.mentions.users.has(client.user.id) || directMentionRegex.test(message.content)) && !message.mentions.everyone;
      if (isMentioned) {
        try {
          await message.channel.sendTyping();
          const cleanPrompt = message.content.replace(new RegExp(`<@!?${client.user.id}>`, 'g'), '').trim();
          
          if (!cleanPrompt) {
            return message.reply({
              content: `👋 Hey **${message.author.username}**! I am **${client.user.username}**, powered by the **Krims Code AI Engine**.\nAsk me anything or use \`/about\`!`,
              allowedMentions: { repliedUser: false }
            });
          }

          // System instructions with custom personality if configured
          const systemInstruction = aiPersona || 
            `You are ${client.user.username}, an intelligent and helpful Discord bot powered by Krims Code AI. Answer clearly, accurately, and politely. Always be friendly and helpful.`;

          let aiResponse = '';
          const askFunction = geminiDirectAsk || (await import('./index.js').then(m => m.geminiDirectAsk).catch(() => null));
          if (typeof askFunction === 'function') {
            aiResponse = await askFunction(cleanPrompt, systemInstruction, message.guild.name, message.guild.id, message.author.id, message.member?.displayName || message.author.username);
          } else {
            // Direct in-character fallback response
            aiResponse = `🔥 Hey **${message.author.username}**! I'm **${client.user.username}**, guardian of **${message.guild.name}**! Ask me anything or explore commands with \`/about\`! 🚀`;
          }

          const replyEmbed = new EmbedBuilder()
            .setColor('#5865F2')
            .setDescription(aiResponse.slice(0, 4000))
            .setFooter({ text: `⚡ Powered by Krims Code AI • Type /about to get this bot for free!` });

          await message.reply({ embeds: [replyEmbed], allowedMentions: { repliedUser: false } });
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
            { name: '🚀 Powered By', value: 'Krims Code AI & Krylo', inline: true }
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
