import { Client, GatewayIntentBits, Partials, PermissionFlagsBits, ChannelType } from 'discord.js';
import { KrimsClient } from '@krishivpb60/krims-code-sdk';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel
  ]
});

// Initialize Krims SDK Client pointing to Vercel mesh Chatbot API
const sdk = new KrimsClient({
  baseUrl: 'https://krims-code-chatbot.vercel.app'
});

// Maps to store state
const conversationHistory = new Map();
const userCooldowns = new Map();
const COOLDOWN_TIME = 10000; // 10 seconds cooldown in milliseconds

client.once('ready', async () => {
  console.log(`[+] Krims Code Discord Bot online as ${client.user.tag}`);

  // Register Global Slash Commands
  const slashCommands = [
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
      description: 'Open a secure private support ticket channel'
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
    }
  ];

  try {
    await client.application.commands.set(slashCommands);
    console.log('[+] Slash commands registered globally!');
  } catch (err) {
    console.error('[-] Failed to register slash commands:', err.message);
  }

  // Start polling Vercel configuration database for pending actions (Web-to-Discord Embed Broadcaster)
  setInterval(async () => {
    const GUILD_ID = '1420991845546332162';
    try {
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: GUILD_ID })
      });
      if (configRes.ok) {
        const guildConfig = await configRes.json();
        const actions = guildConfig.actions || [];
        if (actions.length > 0) {
          console.log(`[ACTION QUEUE] Found ${actions.length} pending action(s). Processing...`);
          
          for (const action of actions) {
            if (action.type === 'send_embed') {
              try {
                const channel = await client.channels.fetch(action.channelId);
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

          // Clear processed actions from config and save back to database
          guildConfig.actions = [];
          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_config', guildId: GUILD_ID, config: guildConfig })
          });
          console.log(`[ACTION QUEUE] Queue cleared and database synchronized.`);
        }
      }
    } catch (err) {
      console.warn(`[ACTION QUEUE] Polling failed:`, err.message);
    }
  }, 5000); // Poll every 5 seconds
});

// Slash Commands Interaction Handler
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // Retrieve configurations dynamically from cloud database
  let botPrefix = '!';
  let aiEnabled = true;
  let modelEngine = 'gemini';
  let systemInstruction = 'You are the Krims Code AI, built and custom-trained by the genius developer Krishiv. Answer coding queries with clear instructions and a friendly, confident tone.';
  let ticketsEnabled = false;
  let guildConfig = null;

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

  // Command: /github
  if (commandName === 'github') {
    await interaction.reply({
      embeds: [{
        color: 0x00f2ff,
        title: '🐙 Krims Code Command Hub',
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

    await interaction.deferReply({ ephemeral: true });

    try {
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username.toLowerCase()}`,
        type: ChannelType.GuildText,
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

      await channel.send(`🎟️ **Support Ticket Created**\nWelcome <@${interaction.user.id}>! Our administrative staff will assist you shortly. Type \`/close\` to resolve and delete this channel.`);
      await interaction.editReply(`🎟️ **Ticket Opened!** Private support channel created here: <#${channel.id}>`);

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

  // Command: /ask
  if (commandName === 'ask') {
    if (!aiEnabled) {
      await interaction.reply({ content: "🔒 **AI responses are disabled on this server.**", ephemeral: true });
      return;
    }

    const prompt = interaction.options.getString('prompt');
    
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
      let history = conversationHistory.get(interaction.channel.id) || [];
      const result = await sdk.ask(prompt, {
        model: modelEngine,
        systemInstruction: systemInstruction,
        history: history
      });

      if (result.ok && result.response) {
        history.push({ role: 'user', content: prompt });
        history.push({ role: 'model', content: result.response });
        if (history.length > 10) history = history.slice(history.length - 10);
        conversationHistory.set(interaction.channel.id, history);

        let replyText = `🤖 **Krims AI Response:**\n${result.response}`;
        if (result.stats) {
          replyText += `\n\n*Latency: ${result.stats.latency}*`;
        }
        await interaction.editReply(replyText);
      } else {
        await interaction.editReply("❌ Failed to parse AI response.");
      }
    } catch (err) {
      await interaction.editReply(`❌ Error calling Krims API: ${err.message}`);
    }
  }
});

// Prefix Message Commands Handler (Legacy fallback & DMs)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

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

  // Command: !close
  if (content.toLowerCase() === botPrefix + 'close' || content.toLowerCase() === '!close') {
    if (message.channel.name.startsWith('ticket-')) {
      await message.reply("🔒 **Support ticket resolved. Deleting channel in 5 seconds...**");
      
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
  if (content.toLowerCase() === botPrefix + 'ticket' || content.toLowerCase() === '!ticket') {
    if (!message.guild) {
      await message.reply("❌ Tickets can only be created inside servers!");
      return;
    }
    if (!ticketsEnabled) {
      await message.reply("🔒 **The ticket support system is currently disabled on this server.** Enable it from the dashboard!");
      return;
    }

    try {
      const channel = await message.guild.channels.create({
        name: `ticket-${message.author.username.toLowerCase()}`,
        type: ChannelType.GuildText,
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

      await channel.send(`🎟️ **Support Ticket Created**\nWelcome ${message.author}! Our administrative staff will assist you shortly. Type \`${botPrefix}close\` to resolve and delete this channel.`);
      await message.reply(`🎟️ **Ticket Opened!** Check your private support channel here: ${channel}`);

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
      await typingMsg.edit(`❌ Failed to run diagnosis: ${err.message}`);
    }
    return;
  }

  // Determine if it is a Chat Prompt using dynamic prefix
  let isPrompt = false;
  let prompt = '';

  const prefixLower = botPrefix.toLowerCase();
  if (content.toLowerCase().startsWith(prefixLower + 'ask ')) {
    isPrompt = true;
    prompt = content.substring(botPrefix.length + 4).trim();
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
      message.reply(`⚠️ Please provide a prompt! Use: \`${botPrefix}ask <query>\``);
      return;
    }

    // Rate Limiting / Cooldown check to protect API quota
    const now = Date.now();
    const lastQuery = userCooldowns.get(message.author.id) || 0;
    const timeRemaining = COOLDOWN_TIME - (now - lastQuery);

    if (timeRemaining > 0) {
      const seconds = Math.ceil(timeRemaining / 1000);
      await message.reply(`⏳ **Rate Limit Active!** Please wait **${seconds}s** before asking another question to protect API quotas.`);
      return;
    }

    // Set new cooldown timestamp
    userCooldowns.set(message.author.id, now);

    const typingMsg = await message.reply("⚡ *Krims AI is calculating...*");

    // Fast local JS evaluation for simple math/arithmetic expressions
    const lowerPrompt = prompt.toLowerCase().trim();
    const cleanMathExpr = lowerPrompt.replace(/what is/gi, '').replace(/\?/g, '').replace(/=/g, '').trim();
    const mathRegex = /^[0-9+\-*/().\s]+$/;
    if (mathRegex.test(cleanMathExpr) && /[0-9]/.test(cleanMathExpr)) {
      try {
        const mathResult = Function(`"use strict"; return (${cleanMathExpr})`)();
        const responseText = `🤖 **Krims AI Response:**\nThe answer to ${cleanMathExpr} is ${mathResult}!`;
        await typingMsg.edit(responseText);
        return;
      } catch (e) {
        // Fall back to querying the SDK if evaluation fails
      }
    }

    try {
      // Retrieve conversation history
      let history = conversationHistory.get(message.channel.id) || [];

      // Query the custom SDK with history, dynamic model, and prompt
      const result = await sdk.ask(prompt, {
        model: modelEngine,
        systemInstruction: systemInstruction,
        history: history
      });

      if (result.ok && result.response) {
        // Update local history
        history.push({ role: 'user', content: prompt });
        history.push({ role: 'model', content: result.response });

        // Limit memory history to the last 10 messages (5 turns)
        if (history.length > 10) {
          history = history.slice(history.length - 10);
        }
        conversationHistory.set(message.channel.id, history);

        let replyText = `🤖 **Krims AI Response:**\n${result.response}`;
        if (result.stats) {
          replyText += `\n\n*Latency: ${result.stats.latency}*`;
        }
        await typingMsg.edit(replyText);
      } else {
        await typingMsg.edit("❌ Failed to parse AI response.");
      }
    } catch (err) {
      console.error(err);
      await typingMsg.edit(`❌ Error calling Krims API: ${err.message}`);
    }
  }
});

// Login using bot token
const token = process.env.DISCORD_TOKEN;
if (token && token !== 'YOUR_DISCORD_TOKEN') {
  client.login(token);
} else {
  console.log('[!] DISCORD_TOKEN is missing or mock. Add a valid Discord Bot Token in the .env file to start the bot.');
}
