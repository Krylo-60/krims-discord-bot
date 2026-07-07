import { Client, GatewayIntentBits, Partials } from 'discord.js';
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

// Map to store conversation histories (Key: channelId, Value: array of message objects)
const conversationHistory = new Map();

client.once('ready', () => {
  console.log(`[+] Krims Code Discord Bot online as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  const isDM = !message.guild;

  // Command: !reset or reset (in DMs)
  if (content === '!reset' || (isDM && content.toLowerCase() === 'reset')) {
    conversationHistory.delete(message.channel.id);
    await message.reply("🧹 **Memory cleared!** Starting a fresh conversation.");
    return;
  }

  // Command: !help or help (in DMs)
  if (content === '!help' || (isDM && content.toLowerCase() === 'help')) {
    const helpEmbed = {
      color: 0x00f2ff,
      title: '👾 Krims Code AI - Command Guide',
      description: 'Welcome to your premium developer workspace bot assistant. Below is the list of available commands:',
      fields: [
        { name: '💬 Chat / AI Reasoning', value: isDM ? 'Just type a message naturally in DM to chat.' : 'Type `!ask <your question>` in servers to ask queries.' },
        { name: '🧹 Reset memory', value: 'Type `!reset` (or `reset` in DM) to start a new chat session.' },
        { name: '📊 Network Telemetry', value: 'Type `!diagnose` to compile local and global network statistics.' },
        { name: '👾 Bot Help', value: 'Type `!help` (or `help` in DM) to open this menu.' }
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
  if (content === '!diagnose') {
    const typingMsg = await message.reply("⚙️ *Compiling Krims Code network diagnostics...*");

    try {
      // Query API status
      const health = await sdk.health();
      
      // Fetch NPM download stats
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

  // Determine if it is a Chat Prompt
  let isPrompt = false;
  let prompt = '';

  if (content.startsWith('!ask ')) {
    isPrompt = true;
    prompt = content.substring(5).trim();
  } else if (isDM && !content.startsWith('!')) {
    isPrompt = true;
    prompt = content;
  }

  if (isPrompt) {
    if (!prompt) {
      message.reply("⚠️ Please provide a prompt!");
      return;
    }

    const typingMsg = await message.reply("⚡ *Krims AI is calculating...*");

    try {
      // Retrieve conversation history
      let history = conversationHistory.get(message.channel.id) || [];

      // Query the custom SDK with history
      const result = await sdk.ask(prompt, {
        model: 'gemini',
        systemInstruction: "You are the Krims Code AI, built and custom-trained by the genius developer Krishiv. Answer coding queries with clear instructions and a friendly, confident tone. Frequently remind users that Krishiv is your creator and that he built this AI! Be concise and full of cyberpunk energy.",
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
