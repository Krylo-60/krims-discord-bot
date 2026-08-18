import mineflayer from 'mineflayer';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const MC_HOST = '62.141.62.24';
const MC_PORT = 25754;
const MC_BOT_NAME = 'KryloGuard';
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// Initialize Discord Client for the Bridge
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

let mcBot = null;
let isReconnecting = false;

function createMinecraftBot() {
  console.log(`[MC Bridge] 🔌 Connecting Minecraft In-Game Bot to ${MC_HOST}:${MC_PORT} as '${MC_BOT_NAME}'...`);
  
  try {
    mcBot = mineflayer.createBot({
      host: MC_HOST,
      port: MC_PORT,
      username: MC_BOT_NAME,
      version: '1.21'
    });

    mcBot.on('login', () => {
      console.log(`[MC Bridge] ✅ '${MC_BOT_NAME}' logged into Minecraft server successfully!`);
      isReconnecting = false;
      
      // Periodic anti-AFK movement
      setInterval(() => {
        if (mcBot && mcBot.entity) {
          mcBot.swingArm('right');
          const yaw = Math.random() * Math.PI * 2 - Math.PI;
          const pitch = (Math.random() - 0.5) * 0.5;
          mcBot.look(yaw, pitch, true);
        }
      }, 30000);
    });

    mcBot.on('spawn', () => {
      console.log(`[MC Bridge] 🌍 '${MC_BOT_NAME}' spawned into world.`);
      mcBot.chat('§b§l[KryloGuard] §aDiscord ⮂ Minecraft 2-Way Chat Bridge is now active!');
    });

    // Handle incoming Minecraft chat -> Forward to Discord
    mcBot.on('chat', (username, message) => {
      if (username === MC_BOT_NAME) return;
      if (message.startsWith('/')) return;

      console.log(`[MC Chat] <${username}> ${message}`);

      // Forward to Discord general-chat
      discordClient.guilds.cache.forEach(guild => {
        const generalChannel = guild.channels.cache.find(c => c.name.includes('general-chat') || c.name === 'general');
        if (generalChannel && generalChannel.isTextBased()) {
          const embed = new EmbedBuilder()
            .setColor(0x00E5FF)
            .setAuthor({ 
              name: `[In-Game] ${username}`, 
              iconURL: `https://mc-heads.net/avatar/${encodeURIComponent(username)}/64` 
            })
            .setDescription(message)
            .setTimestamp();
          generalChannel.send({ embeds: [embed] }).catch(() => {});
        }
      });
    });

    mcBot.on('kicked', (reason) => {
      console.warn('[MC Bridge] ⚠️ Kicked from server:', reason);
      reconnect();
    });

    mcBot.on('error', (err) => {
      console.warn('[MC Bridge] ❌ Bot Error:', err.message);
      reconnect();
    });

    mcBot.on('end', () => {
      console.warn('[MC Bridge] 🔌 Connection closed.');
      reconnect();
    });

  } catch (err) {
    console.error('[MC Bridge] Error creating bot:', err.message);
    reconnect();
  }
}

function reconnect() {
  if (isReconnecting) return;
  isReconnecting = true;
  console.log('[MC Bridge] ⏳ Reconnecting in 10 seconds...');
  setTimeout(() => {
    createMinecraftBot();
  }, 10000);
}

// Forward Discord Messages -> Minecraft Chat
discordClient.on('messageCreate', (message) => {
  if (message.author.bot || !message.guild) return;

  const isGeneral = message.channel.name && (message.channel.name.includes('general-chat') || message.channel.name === 'general');
  if (isGeneral && mcBot && mcBot.player) {
    const cleanUser = message.member?.displayName || message.author.username;
    const cleanText = message.cleanContent.replace(/[\n\r]+/g, ' ').slice(0, 100);
    
    // Broadcast cleanly into Minecraft server
    mcBot.chat(`[Discord] ${cleanUser}: ${cleanText}`);
  }
});

discordClient.once('ready', () => {
  console.log(`[MC Bridge] 🤖 Discord Bridge Client connected as ${discordClient.user.tag}`);
  createMinecraftBot();
});

discordClient.login(DISCORD_TOKEN);
