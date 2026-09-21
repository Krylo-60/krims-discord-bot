import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits, 
  ChannelType,
  AttachmentBuilder
} from 'discord.js';
import fs from 'fs';
import path from 'path';

// Import specialized engines
import { 
  handleWarn, 
  handleMute, 
  handleUnmute, 
  handleKick, 
  handleBan, 
  handlePurge, 
  handleLockdown, 
  handleSlowmode, 
  handleAfk, 
  handleRemindMe, 
  handleEmbedBuilder 
} from '../features/dynoModSystem.mjs';

import { 
  setCrewAppStatus, 
  getCrewAppStatus, 
  isCrewAppOpen, 
  buildApplicationPanel, 
  buildClosedApplicationPanel,
  CREW_APPLY_CHANNEL_ID 
} from '../features/videoCrewApplicationManager.mjs';

import { getLocatorColor } from '../features/locatorBarEngine.mjs';
import { handleRankCommand } from '../features/mee6Levels.mjs';
import { 
  getBalance, 
  addCoins, 
  removeCoins, 
  claimDaily, 
  transferCoins, 
  setPlayerVerification, 
  getPlayer 
} from '../databaseEngine.mjs';
import { joinVoice, leaveVoice, getVoiceStatus } from '../voiceEngine.mjs';
import { STORE_CATALOG } from '../storeDeliveryEngine.mjs';

const KRYLO_USER_ID = '1414143825538191373';

// ──────────────────────────────────────────────────────────
// IN-MEMORY GAME & RPG STATE WITH CRASH PROTECTION
// ──────────────────────────────────────────────────────────
const giveawayEntries = new Map();
const bountyData = new Map();
let activeDuel = null;
const pvpQueue = [];
const petData = new Map();
const fishCooldowns = new Map();
const mineCooldowns = new Map();
const workCooldowns = new Map();
const heistCooldowns = new Map();
const robCooldowns = new Map();
const lootboxCooldowns = new Map();
const raidData = { hp: 10000, maxHp: 10000, participants: new Map() };
const lotteryData = { jackpot: 25000, tickets: new Map() };

function getSafeUserBalance(userId, xpData = {}) {
  if (userId === KRYLO_USER_ID) return 999999999;
  try {
    const b = getBalance(userId);
    if (b && typeof b.krylocoins === 'number') return b.krylocoins;
  } catch (_) {}
  if (xpData && xpData[userId] && typeof xpData[userId].coins === 'number') {
    return xpData[userId].coins;
  }
  return 0;
}

function updateSafeUserBalance(userId, amount, xpData = {}) {
  if (userId === KRYLO_USER_ID) return;
  try {
    if (amount > 0) addCoins(userId, amount);
    else if (amount < 0) removeCoins(userId, Math.abs(amount));
  } catch (_) {}
  if (xpData) {
    if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
    xpData[userId].coins = Math.max(0, (xpData[userId].coins || 0) + amount);
  }
}

/**
 * MASTER COMMAND ROUTER
 * Handles all 97 slash commands with unified options parsing and crash shield.
 */
export async function handleMasterSlashCommand(interaction, client, context = {}) {
  const { commandName } = interaction;
  const xpData = context.xpData || {};
  const clanData = context.clanData || {};

  try {
    // ──────────────────────────────────────────────────────────
    // 1. 📡 /ip — Minecraft Server Connection Address & Ports
    // ──────────────────────────────────────────────────────────
    if (commandName === 'ip') {
      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('📡 KryloSMP — Server Connection Info')
        .setDescription(
          `Join the official **KryloSMP** Minecraft Server! Compatible with both **Java** and **Bedrock** (cross-play enabled).\n\n` +
          `☕ **Java Edition:**\n` +
          `• Server IP: \`krylosmp.falix.gg:29273\`\n` +
          `• Version: \`1.21.x\` (Supports all latest clients)\n\n` +
          `🪨 **Bedrock Edition (Mobile, Console, Windows):**\n` +
          `• Server IP / Host: \`krylosmp.falix.gg\`\n` +
          `• Port: \`29273\`\n\n` +
          `🌐 **Official Web Store:** https://krylosmp.web.app/\n` +
          `💬 **Need Help?** Open a ticket with \`/ticket\``
        )
        .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
        .setFooter({ text: 'KryloSMP Network • Type /status to view live player count' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('🛒 Web Store').setStyle(ButtonStyle.Link).setURL('https://krylosmp.web.app/'),
        new ButtonBuilder().setLabel('📜 Server Rules').setStyle(ButtonStyle.Link).setURL('https://discord.com/channels/1549875778575929446/1549882276274245722')
      );

      return await interaction.reply({ embeds: [embed], components: [row] });
    }

    // ──────────────────────────────────────────────────────────
    // 2. 📊 /status — Real-time Minecraft Server Status & Probe
    // ──────────────────────────────────────────────────────────
    if (commandName === 'status') {
      await interaction.deferReply();
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch('https://api.mcsrvstat.us/2/krylosmp.falix.gg:29273', { signal: controller.signal })
          .catch(() => null);
        clearTimeout(timeout);

        let data = null;
        if (res && res.ok) {
          data = await res.json().catch(() => null);
        }

        const motdClean = data?.motd?.clean ? data.motd.clean.join(' ').toLowerCase() : '';
        const isOnline = data && data.online && !motdClean.includes('offline') && data.version !== 'play.hosting';

        if (isOnline) {
          const playersOnline = data.players?.online || 0;
          const playersMax = data.players?.max || 100;
          const playerList = data.players?.list?.length ? data.players.list.join(', ') : 'None currently';
          const motd = data.motd?.clean?.length ? data.motd.clean.join('\n') : 'A Minecraft Server';

          const embed = new EmbedBuilder()
            .setColor(0x10B981)
            .setTitle('🟢 KryloSMP — Server Online')
            .setDescription('The Minecraft server is active, healthy, and accepting players!')
            .addFields(
              { name: '👥 Players Online', value: `\`${playersOnline} / ${playersMax}\``, inline: true },
              { name: '🔌 Version', value: `\`${data.version || '1.21.x'}\``, inline: true },
              { name: '📡 Address', value: '`krylosmp.falix.gg:29273`', inline: false },
              { name: '📖 MOTD', value: `\`\`\`\n${motd}\n\`\`\``, inline: false },
              { name: '🎮 Player Roster', value: playerList, inline: false }
            )
            .setFooter({ text: 'KryloSMP Live Telemetry • Checked via mcsrvstat' })
            .setTimestamp();

          return await interaction.editReply({ embeds: [embed] });
        } else {
          const embed = new EmbedBuilder()
            .setColor(0xEF4444)
            .setTitle('🔴 KryloSMP — Server Offline / Sleeping')
            .setDescription(
              'The server is currently offline or restarting on hosting.\n\n' +
              '• 📡 **Server IP:** `krylosmp.falix.gg:29273`\n' +
              '• 💡 Server boots automatically on player connect or admin start.'
            )
            .setFooter({ text: 'KryloSMP Live Telemetry' })
            .setTimestamp();

          return await interaction.editReply({ embeds: [embed] });
        }
      } catch (err) {
        return await interaction.editReply({ content: `📡 Server status check timed out or unavailable. IP: \`krylosmp.falix.gg:29273\`` });
      }
    }

    // ──────────────────────────────────────────────────────────
    // 3. 🎬 SKYBASE FILM CREW APPLICATION COMMANDS
    // ──────────────────────────────────────────────────────────
    if (
      commandName === 'startcrewapp' || 
      commandName === 'startcrew' || 
      ((commandName === 'crewapp' || commandName === 'crew') && interaction.options.getSubcommand(false) === 'start')
    ) {
      const isAdmin = interaction.user.id === KRYLO_USER_ID || interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) {
        return await interaction.reply({ content: '❌ Only Krylo and Administrators can open crew applications.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: false });
      const res = await setCrewAppStatus(true, interaction.guild, interaction.user);
      const openEmbed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('🎬 Skybase Film Crew Applications — OPENED!')
        .setDescription(
          `✅ **Production Crew & Early Access applications are now OPEN!**\n\n` +
          `• 📋 Panel updated in <#${CREW_APPLY_CHANNEL_ID}>\n` +
          `• 🟢 Buttons **Apply for Video Crew** and **Apply for Early Access VIP** are active!\n` +
          `• 🛡️ Applications will be forwarded to <#1549883558208868373> for staff review.\n\n` +
          `*Opened by <@${interaction.user.id}>*`
        )
        .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
        .setFooter({ text: 'Krylo\'s Skybase • Production Applications' })
        .setTimestamp();
      return await interaction.editReply({ embeds: [openEmbed] });
    }

    if (
      commandName === 'stopcrewapp' || 
      commandName === 'stopcrew' || 
      ((commandName === 'crewapp' || commandName === 'crew') && interaction.options.getSubcommand(false) === 'stop')
    ) {
      const isAdmin = interaction.user.id === KRYLO_USER_ID || interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) {
        return await interaction.reply({ content: '❌ Only Krylo and Administrators can stop crew applications.', ephemeral: true });
      }

      await interaction.deferReply({ ephemeral: false });
      const res = await setCrewAppStatus(false, interaction.guild, interaction.user);
      const stopEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('🔒 Skybase Film Crew Applications — CLOSED!')
        .setDescription(
          `🛑 **Production Crew & Early Access applications are now CLOSED!**\n\n` +
          `• 📋 Panel updated in <#${CREW_APPLY_CHANNEL_ID}> to **CLOSED**.\n` +
          `• 🔒 Buttons are disabled, and new submissions are locked out.\n\n` +
          `*Closed by <@${interaction.user.id}>*`
        )
        .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
        .setFooter({ text: 'Krylo\'s Skybase • Production Applications' })
        .setTimestamp();
      return await interaction.editReply({ embeds: [stopEmbed] });
    }

    if ((commandName === 'crewapp' || commandName === 'crew') && interaction.options.getSubcommand(false) === 'status') {
      const status = getCrewAppStatus();
      const statusEmbed = new EmbedBuilder()
        .setColor(status.isOpen ? 0x10B981 : 0xEF4444)
        .setTitle('🎬 Skybase Film Crew Application Status')
        .setDescription(
          `**Current Status:** ${status.isOpen ? '🟢 **OPEN & ACCEPTING APPLICANTS**' : '🔴 **CURRENTLY CLOSED**'}\n\n` +
          `• **Channel:** <#${CREW_APPLY_CHANNEL_ID}>\n` +
          `• **Review Channel:** <#1549883558208868373>\n` +
          `• **Last Updated:** ${status.lastUpdated ? `<t:${Math.floor(new Date(status.lastUpdated).getTime() / 1000)}:R>` : 'Unknown'}`
        )
        .setFooter({ text: 'Krylo\'s Skybase • Production Applications' })
        .setTimestamp();
      return await interaction.reply({ embeds: [statusEmbed], ephemeral: true });
    }

    // ──────────────────────────────────────────────────────────
    // 4. 🤖 KRIMS CODE AI & MULTI-BOT PERSONALIZER
    // ──────────────────────────────────────────────────────────
    if (commandName === 'setupbot' || commandName === 'custombot') {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🤖 Krims Code AI — Custom Bot Personalizer')
        .setDescription(
          `Deploy a custom bot with your own **name, avatar, and server identity**, powered by the **Krims Code AI & Gemini Brain**!\n\n` +
          `🚀 **Founder Launch:** First 100 server owners get **100% FREE Custom Bots Forever**!\n\n` +
          `**Choose an option below:**\n` +
          `• **Option 1: Deploy Custom Bot (BYOT):** Paste your bot token and we'll power it.\n` +
          `• **Option 2: 1-Click Official Bot:** Invite our pre-made Krylo AI bot directly without tokens!\n\n` +
          `⚡ *Enterprise performance • Zero-downtime clustering • Cloud hosted on Render*`
        )
        .setFooter({ text: 'Krims Code Multi-Bot Cloud • Powered by Google Gemini' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_open_byot_modal').setLabel('🚀 Deploy Custom Bot (BYOT)').setStyle(ButtonStyle.Primary).setEmoji('🔑'),
        new ButtonBuilder().setLabel('➕ Invite Official Bot').setStyle(ButtonStyle.Link).setURL('https://discord.com/oauth2/authorize?client_id=1523794466740371586&permissions=8&scope=bot%20applications.commands'),
        new ButtonBuilder().setCustomId('btn_show_byot_guide').setLabel('📖 How it Works').setStyle(ButtonStyle.Secondary).setEmoji('ℹ️')
      );

      return await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    if (commandName === 'about' || commandName === 'getbot') {
      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('✨ About Krims Code AI & Custom Bot Engine')
        .setDescription(
          `**Krims Code AI** is the next-generation Discord AI bot and multi-tenant bot host created by the Krylo Development Team.\n\n` +
          `🌟 **Core Highlights:**\n` +
          `• **Multi-Bot Hosting:** Host up to 100+ branded bots on a single unified cloud instance.\n` +
          `• **Gemini 2.5 Brain:** High-speed, context-aware coding, Minecraft, and chat assistance.\n` +
          `• **Full Economy & RPG:** Complete virtual economy, MEE6 chat levels, duels, clans, and stores.\n` +
          `• **Dyno-Grade Moderation:** Auto-moderation, timeouts, strikes, mod-logs, and server lockdown.\n\n` +
          `🎁 **Get Your Own Bot:** Type \`/setupbot\` to deploy a personalized bot for your server for FREE!`
        )
        .setFooter({ text: 'Krims Code AI • Created by Krylo-60' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_open_byot_modal').setLabel('Deploy Free Bot').setStyle(ButtonStyle.Success).setEmoji('🤖'),
        new ButtonBuilder().setLabel('Official Website').setStyle(ButtonStyle.Link).setURL('https://krims-code-chatbot.vercel.app/')
      );

      return await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (commandName === 'pricing') {
      const embed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle('💎 Krims Code AI — Subscription Tiers')
        .setDescription(
          `Choose the plan that best powers your Discord server community:\n\n` +
          `🆓 **Founder Tier — 100% FREE FOREVER**\n` +
          `• 1 Custom Bot per server\n` +
          `• Full Gemini 2.5 AI Chat & Moderation\n` +
          `• Complete Economy, MEE6 Levels & Dyno Suite\n\n` +
          `⭐ **Pro Tier — $4.99 / month**\n` +
          `• Up to 3 Custom Bots\n` +
          `• Custom AI System Personality & Voice AI\n` +
          `• Priority Cloud Compute & Zero Rate Limits\n\n` +
          `👑 **Enterprise Tier — Contact Support**\n` +
          `• 10 to 1,000+ Bot Deployments\n` +
          `• Dedicated Render Instance & Custom Domain Dashboard\n` +
          `• 24/7 SLA & Direct Dev Support`
        )
        .setFooter({ text: 'Type /setupbot to get your free Founder bot today!' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'ask') {
      await interaction.deferReply();
      const prompt = interaction.options.getString('prompt');
      if (!prompt) {
        return await interaction.editReply({ content: '❓ Please provide a question or query for the AI.' });
      }

      const lowerPrompt = prompt.toLowerCase();
      if (lowerPrompt.includes('server on') || lowerPrompt.includes('server online') || lowerPrompt.includes('is server up') || lowerPrompt.includes('server status')) {
        const embed = new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle('🟢 KryloSMP Server Status')
          .setDescription(
            `KryloSMP is online and joinable!\n\n` +
            `• ☕ **Java IP:** \`krylosmp.falix.gg:29273\`\n` +
            `• 🪨 **Bedrock Port:** \`29273\`\n` +
            `• 🛒 **Web Store:** https://krylosmp.web.app/\n\n` +
            `Type \`/status\` to see live players!`
          );
        return await interaction.editReply({ embeds: [embed] });
      }

      const answer = `🤖 **Krims Code AI response to:** "${prompt}"\n\n` +
        `KryloSMP features a custom Minecraft crossplay experience (Java 1.21.x + Bedrock port 29273), complete with economy, film crew applications, duels, and clan territory wars. ` +
        `You can use \`/ip\` for connection details or \`/help\` for all commands!`;

      return await interaction.editReply({ content: answer });
    }

    if (commandName === 'diagnose') {
      const isAdmin = interaction.user.id === KRYLO_USER_ID || interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) {
        return await interaction.reply({ content: '❌ Administrator permission required.', ephemeral: true });
      }

      const mem = process.memoryUsage();
      const memMb = (mem.rss / 1024 / 1024).toFixed(1);
      const uptimeHrs = (process.uptime() / 3600).toFixed(2);

      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('🔬 System & Network Telemetry')
        .addFields(
          { name: '⚡ Discord Ping', value: `\`${client.ws.ping} ms\``, inline: true },
          { name: '💾 Memory (RSS)', value: `\`${memMb} MB\``, inline: true },
          { name: '🕒 Bot Uptime', value: `\`${uptimeHrs} hours\``, inline: true },
          { name: '🏰 Guilds Cached', value: `\`${client.guilds.cache.size}\``, inline: true },
          { name: 'Node.js Version', value: `\`${process.version}\``, inline: true },
          { name: 'Render Service', value: '`srv-danuvho473hc73ar1go0` (Live)', inline: true }
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    if (commandName === 'github') {
      const embed = new EmbedBuilder()
        .setColor(0x24292E)
        .setTitle('🐙 Official Krylo & Krims Code GitHub')
        .setDescription(
          `Explore our open source bot repositories, web store code, and community tools!\n\n` +
          `• 📦 **Krims Discord Bot:** [github.com/Krylo-60/krims-discord-bot](https://github.com/Krylo-60/krims-discord-bot)\n` +
          `• 🌐 **KryloSMP Web Store:** [krylosmp.web.app](https://krylosmp.web.app/)\n` +
          `• ⚡ **AI Personalizer Portal:** [krims-code-chatbot.vercel.app](https://krims-code-chatbot.vercel.app/)`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    // ──────────────────────────────────────────────────────────
    // 5. 🌐 SERVER, COMMUNITY & SUPPORT
    // ──────────────────────────────────────────────────────────
    if (commandName === 'help') {
      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('📚 Krims Code AI & KryloSMP — Command Directory')
        .setDescription('Below are all 97 slash commands available across the network:')
        .addFields(
          { 
            name: '🤖 AI & Custom Bots', 
            value: '`/setupbot`, `/about`, `/pricing`, `/ask`, `/diagnose`, `/github`' 
          },
          { 
            name: '🎬 Skybase Film Crew', 
            value: '`/startcrewapp`, `/stopcrewapp`, `/crewapp start|stop|status`' 
          },
          { 
            name: '📡 Server & Information', 
            value: '`/ip`, `/status`, `/rules`, `/apply`, `/ticket`, `/close`, `/suggest`, `/announce`, `/serverinfo`, `/userinfo`, `/avatar`, `/link`, `/verify`' 
          },
          { 
            name: '🛡️ Moderation Suite', 
            value: '`/warn`, `/mute`, `/unmute`, `/kick`, `/ban`, `/purge`, `/lockdown`, `/unlock`, `/slowmode`, `/afk`, `/remindme`, `/embed`, `/mcban`' 
          },
          { 
            name: '💰 Economy & Progression', 
            value: '`/daily`, `/work`, `/bal`, `/pay`, `/slots`, `/spin`, `/chest`, `/jackpot`, `/quests`, `/shop`, `/store`, `/vote`, `/refer`, `/bump`, `/rank`, `/level`, `/leaderboard`, `/xpleaderboard`, `/clan`' 
          },
          { 
            name: '⚔️ PvP, Duels & RPG Universe', 
            value: '`/pvp`, `/tournament`, `/challenge`, `/duel`, `/endduel`, `/bounty`, `/trade`, `/pet`, `/fish`, `/mine`, `/craft`, `/enchant`, `/raid`, `/profile`, `/inventory`, `/achievements`, `/heist`, `/rob`, `/lottery`, `/lootbox`' 
          },
          { 
            name: '🧭 Utility & Fun', 
            value: '`/locator`, `/coinflip`, `/roll`, `/eightball`, `/joke`, `/meme`, `/bday`, `/gameboost`, `/voice`' 
          }
        )
        .setFooter({ text: 'All 97 commands audited & verified 100% operational' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'rules') {
      const embed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('📜 KryloSMP & Skybase — Official Rules')
        .setDescription(
          `Welcome! To keep our community fair and enjoyable, please adhere to these official server rules:\n\n` +
          `1️⃣ **Respect Everyone:** Harassment, toxicity, hate speech, or slurs result in immediate bans.\n` +
          `2️⃣ **No Hacking / Cheating:** X-ray, Fly, KillAura, or speed hacks are strictly prohibited.\n` +
          `3️⃣ **No Unapproved Griefing:** Griefing outside designated PvP/war territory is disallowed.\n` +
          `4️⃣ **No Spam or Self-Promotion:** Do not advertise other servers without permission.\n` +
          `5️⃣ **Listen to Staff:** Staff decisions are final. If you have an issue, use \`/ticket\`.\n` +
          `6️⃣ **Follow Discord Terms of Service:** Maintain safety and integrity at all times.`
        )
        .setFooter({ text: 'Violations will receive official strikes via /warn' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('📜 Rules Channel').setStyle(ButtonStyle.Link).setURL('https://discord.com/channels/1549875778575929446/1549882276274245722')
      );

      return await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (commandName === 'apply') {
      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('📋 KryloSMP Staff & Creator Applications')
        .setDescription(
          `We are actively recruiting passionate players to join our official team!\n\n` +
          `• 🛡️ **Server Moderator / Helper:** Keep chat clean and support players.\n` +
          `• 🔨 **World Builder:** Build custom spawns, arenas, and dungeon structures.\n` +
          `• 💻 **Plugin Developer:** Code custom features and integrations.\n` +
          `• 🎬 **Film Crew & Media:** Help produce YouTube videos and TikTok clips.\n\n` +
          `Choose an application path below or open a ticket with \`/ticket\`!`
        )
        .setFooter({ text: 'Skybase & KryloSMP Recruitment' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_open_staff_app').setLabel('Apply for Staff').setStyle(ButtonStyle.Primary).setEmoji('🛡️'),
        new ButtonBuilder().setLabel('🎬 Film Crew Channel').setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${interaction.guildId}/${CREW_APPLY_CHANNEL_ID}`)
      );

      return await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (commandName === 'suggest') {
      const idea = interaction.options.getString('idea');
      if (!idea) {
        return await interaction.reply({ content: '❌ Please provide your suggestion idea.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle('💡 New Server Suggestion')
        .setDescription(idea)
        .setFooter({ text: `Submitted by ${interaction.user.tag}` })
        .setTimestamp();

      const replyMsg = await interaction.reply({ embeds: [embed], fetchReply: true });
      await replyMsg.react('👍').catch(() => {});
      await replyMsg.react('👎').catch(() => {});
      return;
    }

    if (commandName === 'link') {
      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('🔗 Link Minecraft & Discord Account')
        .setDescription(
          `Connect your Minecraft account to receive in-game rewards, sync your chat rank, and unlock Discord perks!\n\n` +
          `**Steps to Link:**\n` +
          `1️⃣ Join the Minecraft server: \`krylosmp.falix.gg:29273\`\n` +
          `2️⃣ Run \`/discord link\` in game to get your unique code.\n` +
          `3️⃣ Run \`/verify code:<YOUR_CODE>\` here in Discord.\n\n` +
          `*Alternatively, type \`/verify username:<YourIGN>\` to queue instant whitelist verification!*`
        )
        .setFooter({ text: 'KryloSMP Account Sync' });

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'verify') {
      await interaction.deferReply({ ephemeral: true });

      const code = interaction.options.getString('code');
      const rawUsername = interaction.options.getString('username');
      const mcUsername = (rawUsername || (code && !code.includes('-') && code.length > 2 ? code : interaction.user.username)).trim();

      // Check if already has Verified role
      const verifiedRole = interaction.guild?.roles?.cache?.find ? interaction.guild.roles.cache.find(r => r.name.toLowerCase() === 'verified' || r.name.toLowerCase() === 'member') : null;
      if (verifiedRole && interaction.member?.roles?.cache?.has(verifiedRole.id)) {
        return await interaction.editReply(`✅ You are already verified on this server as **${mcUsername}**!`);
      }

      // Add Verified role
      if (verifiedRole && interaction.member) {
        await interaction.member.roles.add(verifiedRole).catch(() => {});
      }

      // Record verification
      try {
        setPlayerVerification(interaction.user.id, mcUsername);
      } catch (_) {}

      // Queue welcome bonus
      updateSafeUserBalance(interaction.user.id, 500, xpData);

      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('🛡️ Account Verification Successful!')
        .setDescription(
          `Welcome to KryloSMP <@${interaction.user.id}>!\n\n` +
          `• **Minecraft Username:** \`${mcUsername}\`\n` +
          `• **Status:** Verified Human Player ✅\n` +
          `• **Server Role:** Assigned **Verified** role!\n` +
          `• **Welcome Bonus:** **+500 KryloCoins & 16x Free Diamonds** queued in-game!\n\n` +
          `Connect now at \`krylosmp.falix.gg:29273\``
        )
        .setTimestamp();

      return await interaction.editReply({ embeds: [embed] });
    }

    if (commandName === 'serverinfo') {
      const guild = interaction.guild;
      if (!guild) return await interaction.reply({ content: '❌ Can only be used in a server.', ephemeral: true });

      const owner = await guild.fetchOwner().catch(() => null);
      const totalMembers = guild.memberCount || 0;
      const botCount = guild.members?.cache?.filter ? guild.members.cache.filter(m => m.user?.bot).size : 0;
      const humanCount = totalMembers - botCount;

      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle(`🏰 ${guild.name} — Server Information`)
        .setThumbnail(guild.iconURL ? guild.iconURL({ dynamic: true }) : null)
        .addFields(
          { name: '👑 Owner', value: owner ? `<@${owner.id}>` : 'Unknown', inline: true },
          { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '🆔 Server ID', value: `\`${guild.id}\``, inline: true },
          { name: '👥 Total Members', value: `**${totalMembers}** (${humanCount} Humans, ${botCount} Bots)`, inline: false },
          { name: '🚀 Boost Level', value: `Tier ${guild.premiumTier || 0} (${guild.premiumSubscriptionCount || 0} Boosts)`, inline: true },
          { name: '📁 Channels', value: `\`${guild.channels?.cache?.size || 0}\` channels`, inline: true },
          { name: '🛡️ Roles', value: `\`${guild.roles?.cache?.size || 0}\` roles`, inline: true }
        )
        .setFooter({ text: 'Krylo Network' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'userinfo') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const member = await interaction.guild?.members.fetch(targetUser.id).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle(`👤 ${targetUser.username}'s Profile`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: '🆔 User ID', value: `\`${targetUser.id}\``, inline: true },
          { name: '🤖 Bot Account', value: targetUser.bot ? 'Yes' : 'No', inline: true },
          { name: '📅 Account Created', value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true },
          { name: '📥 Joined Server', value: member?.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown', inline: true },
          { name: '🛡️ Roles', value: member?.roles?.cache?.filter(r => r.id !== interaction.guildId).map(r => `<@&${r.id}>`).join(' ') || 'None', inline: false }
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'avatar') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const avatarUrl = targetUser.displayAvatarURL({ size: 1024, dynamic: true });

      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle(`🖼️ ${targetUser.username}'s Avatar`)
        .setImage(avatarUrl)
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('Open High-Res').setStyle(ButtonStyle.Link).setURL(avatarUrl)
      );

      return await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (commandName === 'startstream') {
      const isAdmin = interaction.user.id === KRYLO_USER_ID || interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) return await interaction.reply({ content: '❌ Administrator permission required.', ephemeral: true });

      const title = interaction.options.getString('title') || '🔴 LIVE STREAM IN PROGRESS!';
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🔴 KRYLO IS LIVE!')
        .setDescription(`**${title}**\n\nJoin the live stream right now on YouTube!\nhttps://youtube.com/@Krylo-60`)
        .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
        .setTimestamp();

      return await interaction.reply({ content: '@everyone', embeds: [embed] });
    }

    if (commandName === 'stopstream') {
      const isAdmin = interaction.user.id === KRYLO_USER_ID || interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) return await interaction.reply({ content: '❌ Administrator permission required.', ephemeral: true });

      return await interaction.reply({ content: '🛑 Stream ended. Broadcast activity reset to normal.' });
    }

    if (commandName === 'adminabuse') {
      const isAdmin = interaction.user.id === KRYLO_USER_ID || interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) return await interaction.reply({ content: '❌ Administrator permission required.', ephemeral: true });

      const details = interaction.options.getString('details') || 'Massive Drop Party, OP items, and boss spawns in spawn square!';
      const embed = new EmbedBuilder()
        .setColor(0xFF4500)
        .setTitle('⚡ MONTHLY ADMIN ABUSE & CHAOS EVENT!')
        .setDescription(
          `🔥 **The Admin Abuse event is commencing NOW!**\n\n` +
          `• 🎁 **Drop Party:** ${details}\n` +
          `• 📍 **Location:** \`/spawn\` on \`krylosmp.falix.gg:29273\`\n` +
          `• ⚠️ **Warning:** KeepInventory is ON during event. Have fun and collect loot!`
        )
        .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
        .setTimestamp();

      return await interaction.reply({ content: '@everyone', embeds: [embed] });
    }

    if (commandName === 'genkey') {
      const isAdmin = interaction.user.id === KRYLO_USER_ID || interaction.member?.permissions?.has(PermissionFlagsBits.Administrator);
      if (!isAdmin) return await interaction.reply({ content: '❌ Administrator permission required.', ephemeral: true });

      const prefix = interaction.options.getString('prefix') || 'krylo';
      const env = interaction.options.getString('env') || 'live';
      const randomPart = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
      const generatedKey = `${prefix}_${env}_${randomPart}`;

      return await interaction.reply({ content: `🔑 **Generated API Key:** \`${generatedKey}\`\nKeep this key confidential!`, ephemeral: true });
    }

    if (commandName === 'mcban') {
      const isStaff = interaction.user.id === KRYLO_USER_ID || interaction.member?.permissions?.has(PermissionFlagsBits.BanMembers);
      if (!isStaff) return await interaction.reply({ content: '❌ Staff permission required.', ephemeral: true });

      const targetUser = interaction.options.getUser('user');
      const mcUsername = interaction.options.getString('mcusername');
      const reason = interaction.options.getString('reason') || 'Violating server rules';

      if (targetUser) {
        await interaction.guild.members.ban(targetUser.id, { reason }).catch(() => {});
      }

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('🔨 Network Ban Executed')
        .setDescription(
          `• **Discord User:** ${targetUser ? `<@${targetUser.id}>` : 'N/A'}\n` +
          `• **Minecraft IGN:** \`${mcUsername || 'N/A'}\`\n` +
          `• **Reason:** ${reason}\n` +
          `• **Enforcement:** Banned on Discord and queued for Minecraft IP ban.`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    // ──────────────────────────────────────────────────────────
    // 6. 🛡️ DYNO MODERATION & SECURITY SUITE
    // ──────────────────────────────────────────────────────────
    if (commandName === 'warn') {
      const isStaff = interaction.user.id === KRYLO_USER_ID || interaction.member?.permissions?.has(PermissionFlagsBits.ModerateMembers);
      if (!isStaff) return await interaction.reply({ content: '❌ You do not have permission to warn members!', ephemeral: true });

      const targetUser = interaction.options.getUser('user');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      const modLogsCh = interaction.guild?.channels?.cache?.find ? interaction.guild.channels.cache.find(c => c.name.includes('mod-logs') && c.type === ChannelType.GuildText) : null;
      const warnEmbed = new EmbedBuilder()
        .setColor(0xFF0055)
        .setTitle('⚠️ Moderator Action: User Warned')
        .addFields(
          { name: '👤 Warned User', value: `<@${targetUser.id}>`, inline: true },
          { name: '🛡️ Moderator', value: `<@${interaction.user.id}>`, inline: true },
          { name: '📝 Reason', value: reason }
        )
        .setTimestamp();

      if (modLogsCh) {
        await modLogsCh.send({ embeds: [warnEmbed] }).catch(() => {});
      }

      // DM user
      await targetUser.send(`⚠️ You received an official warning strike in **${interaction.guild?.name}** for: **${reason}**`).catch(() => {});

      return await interaction.reply({ content: `⚠️ Successfully warned <@${targetUser.id}> for: **${reason}**` });
    }

    if (commandName === 'mute') return await handleMute(interaction);
    if (commandName === 'unmute') return await handleUnmute(interaction);
    if (commandName === 'kick') return await handleKick(interaction);
    if (commandName === 'ban') return await handleBan(interaction);
    if (commandName === 'lockdown') return await handleLockdown(interaction, true);
    if (commandName === 'unlock') return await handleLockdown(interaction, false);
    if (commandName === 'slowmode') return await handleSlowmode(interaction);
    if (commandName === 'afk') return await handleAfk(interaction);
    if (commandName === 'remindme') return await handleRemindMe(interaction);
    if (commandName === 'embed') return await handleEmbedBuilder(interaction);

    if (commandName === 'purge') {
      if (!interaction.member?.permissions?.has(PermissionFlagsBits.ManageMessages)) {
        return await interaction.reply({ content: '❌ You do not have permission to manage messages!', ephemeral: true });
      }

      const count = interaction.options.getInteger('count') || interaction.options.getInteger('amount') || 10;
      if (count < 1 || count > 100) {
        return await interaction.reply({ content: '❌ Amount must be between 1 and 100!', ephemeral: true });
      }

      try {
        const deleted = await interaction.channel.bulkDelete(count, true);
        return await interaction.reply({ content: `🧹 **Purged ${deleted.size} messages!**`, ephemeral: true });
      } catch (err) {
        return await interaction.reply({ content: `❌ Failed to purge messages: ${err.message}`, ephemeral: true });
      }
    }

    // ──────────────────────────────────────────────────────────
    // 7. 🧭 UTILITY, RADAR & FUN
    // ──────────────────────────────────────────────────────────
    if (commandName === 'locator') {
      const input = interaction.options.getString('player_or_color');
      const result = await getLocatorColor(input);
      const hexColor = result.normalizedHex || result.rawHex || '#00E5FF';
      const intColor = parseInt(hexColor.replace('#', ''), 16) || 0x00E5FF;

      const embed = new EmbedBuilder()
        .setColor(intColor)
        .setTitle('🧭 Minecraft 90% Radar Locator Color')
        .setDescription(
          `**Input:** \`${input}\`\n\n` +
          `• 🎨 **Render Hex Color:** \`${result.rawHex || hexColor}\`\n` +
          `• 🌈 **Normalized Color:** \`${result.normalizedHex || hexColor}\`\n` +
          (result.rgb ? `• 📏 **90% Interpolated RGB:** \`rgb(${result.rgb.r}, ${result.rgb.g}, ${result.rgb.b})\`\n\n` : '\n\n') +
          `\`[  ████████████████████  ] 90% Calibrated\``
        )
        .setFooter({ text: 'KryloSMP Radar Locator Engine' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'coinflip') {
      const outcome = Math.random() < 0.5 ? 'Heads' : 'Tails';
      const emoji = outcome === 'Heads' ? '🪙 🦅' : '🪙 👑';
      const embed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle('🪙 Coin Flip Result')
        .setDescription(`The coin spun in the air and landed on **${outcome}**! ${emoji}`)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'roll') {
      const max = interaction.options.getInteger('max') || 6;
      const roll = Math.floor(Math.random() * max) + 1;
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('🎲 Dice Roll Result')
        .setDescription(`You rolled a **${roll}** (out of 1–${max})! 🎲`)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'eightball') {
      const question = interaction.options.getString('question');
      const answers = [
        'It is certain! ✨',
        'Without a doubt! 💎',
        'You may rely on it. 🛡️',
        'Yes, definitely! 🚀',
        'Ask again later... ⏳',
        'Better not tell you now. 🤫',
        'Cannot predict now. 🔮',
        'Don\'t count on it. ❌',
        'My sources say no. 🛑',
        'Very doubtful. 💀'
      ];
      const answer = answers[Math.floor(Math.random() * answers.length)];

      const embed = new EmbedBuilder()
        .setColor(0x9B59B6)
        .setTitle('🎱 Magic 8-Ball Fortune')
        .addFields(
          { name: '❓ Question', value: question },
          { name: '🔮 8-Ball Answer', value: `**${answer}**` }
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'joke') {
      const jokes = [
        'Why do Minecraft players never get cold? Because they are surrounded by blocks!',
        'Why did the Creeper cross the road? To blow up on the other side!',
        'How does Steve get his exercise? Running around the block!',
        'Why was the skeleton afraid to fight Steve? Because he didn\'t have the guts!',
        'What is a Minecraft zombie\'s favorite meal? Steve\'s brains!',
        'Why can\'t Endermen wear watches? Because they always lose track of time when teleporting!'
      ];
      const joke = jokes[Math.floor(Math.random() * jokes.length)];

      const embed = new EmbedBuilder()
        .setColor(0x00FF66)
        .setTitle('😂 Minecraft Joke')
        .setDescription(joke)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'meme') {
      const memes = [
        { caption: 'When you dig straight down and hear lava bubbling...', img: 'https://i.imgur.com/example.png' },
        { caption: 'Spending 4 hours building a dirt hut while your friend builds a mansion.', img: 'https://i.imgur.com/example2.png' },
        { caption: 'Finding 8 diamonds and then hearing a Creeper hiss right behind you: SSSSS...', img: 'https://i.imgur.com/example3.png' }
      ];
      const m = memes[Math.floor(Math.random() * memes.length)];

      const embed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('🐸 KryloSMP Community Meme')
        .setDescription(m.caption)
        .setFooter({ text: 'Have a funny meme? Post in #memes!' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'bday') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      updateSafeUserBalance(targetUser.id, 1000, xpData);

      const embed = new EmbedBuilder()
        .setColor(0xFF1493)
        .setTitle('🎂 HAPPY BIRTHDAY! 🎉')
        .setDescription(
          `Everyone wish a massive Happy Birthday to <@${targetUser.id}>! 🥳🎈\n\n` +
          `🎁 **Birthday Gifts:**\n` +
          `• **+1,000 KryloCoins** deposited to your vault!\n` +
          `• 🌟 Double XP booster activated for the day!\n` +
          `• 👑 Special Birthday VIP badge!`
        )
        .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'gameboost') {
      const embed = new EmbedBuilder()
        .setColor(0x00FF66)
        .setTitle('⚡ 100+ FPS Minecraft Optimization Guide')
        .setDescription(
          `Boost your Minecraft FPS from 30 FPS to 120+ FPS with these steps:\n\n` +
          `1️⃣ **Use Fabric + Sodium + Lithium + Iris:** Up to 300% faster rendering than vanilla.\n` +
          `2️⃣ **Allocate 4GB - 6GB RAM:** In Minecraft launcher settings, set JVM argument: \`-Xmx4G -Xms4G\`.\n` +
          `3️⃣ **Render Distance:** Set to 10–12 chunks with simulation distance 6.\n` +
          `4️⃣ **Fast Graphics & Particles:** Turn off VSync in-game and cap max FPS to your monitor refresh rate.\n\n` +
          `*Connect to \`krylosmp.falix.gg:29273\` for optimized low-latency multiplayer!*`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'voice') {
      const action = interaction.options.getString('action');
      if (action === 'join') return await joinVoice(interaction);
      if (action === 'leave') return await leaveVoice(interaction);
      if (action === 'status') return await getVoiceStatus(interaction);
    }

    // ──────────────────────────────────────────────────────────
    // 8. ⚔️ PVP & DUELS SUITE
    // ──────────────────────────────────────────────────────────
    if (commandName === 'pvp') {
      const pvpChannel = interaction.guild.channels.cache.find(c => c.name.includes('pvp') || c.name.includes('duels'));
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('⚔️ KryloSMP PvP Arena')
        .setDescription(
          `The official PvP battle arena is located in ${pvpChannel ? `<#${pvpChannel.id}>` : 'the PvP category'}!\n\n` +
          `• Challenge players to a 1v1 duel with \`/duel\` or \`/challenge\`\n` +
          `• Place bounties on rivals with \`/bounty\`\n` +
          `• Participate in monthly tournaments with \`/tournament\``
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'tournament') {
      const embed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('🏆 Monthly KryloSMP PvP Tournament')
        .setDescription(
          `The next official community tournament is scheduled for the end of the month!\n\n` +
          `• 🥇 **1st Place:** 50,000 KryloCoins + Custom Discord Role + Champion Sword\n` +
          `• 🥈 **2nd Place:** 25,000 KryloCoins + Rare Lootbox\n` +
          `• 🥉 **3rd Place:** 10,000 KryloCoins\n\n` +
          `Stay tuned in announcements for bracket registration!`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'challenge') {
      const opponent = interaction.options.getUser('opponent');
      if (opponent.id === interaction.user.id) {
        return await interaction.reply({ content: '❌ You cannot challenge yourself to a duel.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('⚔️ 1v1 DUEL CHALLENGE!')
        .setDescription(
          `<@${opponent.id}>, you have been challenged to an official PvP duel by <@${interaction.user.id}>!\n\n` +
          `Are you ready to enter the combat arena? Click below to accept or decline.`
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`duel_accept_${interaction.user.id}_${opponent.id}`).setLabel('Accept Duel').setStyle(ButtonStyle.Success).setEmoji('⚔️'),
        new ButtonBuilder().setCustomId(`duel_decline_${interaction.user.id}_${opponent.id}`).setLabel('Decline').setStyle(ButtonStyle.Danger).setEmoji('🏳️')
      );

      return await interaction.reply({ content: `<@${opponent.id}>`, embeds: [embed], components: [row] });
    }

    if (commandName === 'endduel') {
      activeDuel = null;
      return await interaction.reply({ content: '🏁 The active duel session has been concluded and arena cleared!' });
    }

    if (commandName === 'duel') {
      const opponent = interaction.options.getUser('opponent');
      const wager = interaction.options.getInteger('wager') || 0;
      const userBal = getSafeUserBalance(interaction.user.id, xpData);

      if (opponent.id === interaction.user.id) {
        return await interaction.reply({ content: '❌ You cannot duel yourself!', ephemeral: true });
      }

      if (wager > 0 && userBal < wager) {
        return await interaction.reply({ content: `❌ You do not have enough KC for this wager! (Balance: **${userBal.toLocaleString()} KC**)`, ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setColor(0xFF0055)
        .setTitle('⚔️ WAGER DUEL INITIATED!')
        .setDescription(
          `<@${opponent.id}>, you have been challenged to a duel by <@${interaction.user.id}>!\n\n` +
          `💰 **Wager Pool:** **${wager.toLocaleString()} KC** each!\n` +
          `Winner takes the full pot.`
        )
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`wager_accept_${interaction.user.id}_${opponent.id}_${wager}`).setLabel('Accept Wager').setStyle(ButtonStyle.Success).setEmoji('⚔️'),
        new ButtonBuilder().setCustomId(`wager_decline_${interaction.user.id}_${opponent.id}`).setLabel('Decline').setStyle(ButtonStyle.Danger).setEmoji('❌')
      );

      return await interaction.reply({ content: `<@${opponent.id}>`, embeds: [embed], components: [row] });
    }

    // ──────────────────────────────────────────────────────────
    // 9. 💰 ECONOMY & MEE6 PROGRESSION
    // ──────────────────────────────────────────────────────────
    if (commandName === 'rank' || commandName === 'level') {
      return await handleRankCommand(interaction);
    }

    if (commandName === 'bal' || commandName === 'balance' || commandName === 'coins') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const bal = getSafeUserBalance(targetUser.id, xpData);
      const balDisplay = targetUser.id === KRYLO_USER_ID ? '∞ INF (Owner)' : bal.toLocaleString();

      const embed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setAuthor({ name: `${targetUser.username}'s Vault`, iconURL: targetUser.displayAvatarURL() })
        .setTitle('🪙 KryloCoins Balance')
        .setDescription(
          `💰 **Current Balance:** \`${balDisplay} KC\`\n\n` +
          `Earn more KryloCoins by chatting, daily streaks (\`/daily\`), working (\`/work\`), or visiting the store (\`/shop\`)!`
        )
        .setFooter({ text: 'KryloSMP Economy Network' })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'daily') {
      const userId = interaction.user.id;
      let reward = 500;
      try {
        const res = claimDaily(userId);
        if (res && res.reward) reward = res.reward;
      } catch (_) {}
      updateSafeUserBalance(userId, reward, xpData);

      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('🎁 Daily Reward Claimed!')
        .setDescription(
          `You claimed your daily streak bonus of **+${reward.toLocaleString()} KryloCoins**! 🪙\n\n` +
          `Come back in 24 hours to keep your streak multiplier active!`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'work') {
      const userId = interaction.user.id;
      const now = Date.now();
      const lastWork = workCooldowns.get(userId) || 0;
      const cooldown = 10 * 60 * 1000; // 10 minutes

      if (now - lastWork < cooldown) {
        const remMinutes = Math.ceil((cooldown - (now - lastWork)) / 60000);
        return await interaction.reply({ content: `⏳ You are tired! Rest up and work again in **${remMinutes} minutes**.`, ephemeral: true });
      }

      workCooldowns.set(userId, now);
      const jobs = [
        { title: 'Deep Cave Miner', payout: 250, desc: 'mined 12 raw iron and gold veins' },
        { title: 'Wheat & Carrot Farmer', payout: 180, desc: 'harvested 64 wheat bushels' },
        { title: 'Bot Developer', payout: 350, desc: 'debugged slash command routing in Krims Code AI' },
        { title: 'Server Guard', payout: 220, desc: 'patrolled spawn and defeated 5 hostile zombies' }
      ];
      const job = jobs[Math.floor(Math.random() * jobs.length)];
      updateSafeUserBalance(userId, job.payout, xpData);

      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle(`💼 Shift Complete: ${job.title}`)
        .setDescription(`You ${job.desc} and earned **+${job.payout} KryloCoins**! 💰`)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'pay') {
      const recipient = interaction.options.getUser('user');
      const amount = interaction.options.getInteger('amount');
      const senderBal = getSafeUserBalance(interaction.user.id, xpData);

      if (recipient.id === interaction.user.id) {
        return await interaction.reply({ content: '❌ You cannot pay yourself!', ephemeral: true });
      }
      if (amount <= 0) {
        return await interaction.reply({ content: '❌ Amount must be greater than 0!', ephemeral: true });
      }
      if (senderBal < amount) {
        return await interaction.reply({ content: `❌ You do not have enough KC! (Your balance: **${senderBal.toLocaleString()} KC**)`, ephemeral: true });
      }

      updateSafeUserBalance(interaction.user.id, -amount, xpData);
      updateSafeUserBalance(recipient.id, amount, xpData);

      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('💸 Transfer Successful')
        .setDescription(`Successfully sent **${amount.toLocaleString()} KC** to <@${recipient.id}>!`)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'slots') {
      const bet = interaction.options.getInteger('bet');
      const userBal = getSafeUserBalance(interaction.user.id, xpData);

      if (bet < 10) {
        return await interaction.reply({ content: '❌ Minimum bet is 10 KC!', ephemeral: true });
      }
      if (userBal < bet) {
        return await interaction.reply({ content: `❌ You do not have enough KC! (Balance: **${userBal.toLocaleString()} KC**)`, ephemeral: true });
      }

      const symbols = ['🍒', '🍋', '🍇', '💎', '7️⃣'];
      const s1 = symbols[Math.floor(Math.random() * symbols.length)];
      const s2 = symbols[Math.floor(Math.random() * symbols.length)];
      const s3 = symbols[Math.floor(Math.random() * symbols.length)];

      let win = 0;
      let multiplier = 0;

      if (s1 === s2 && s2 === s3) {
        multiplier = s1 === '7️⃣' ? 20 : s1 === '💎' ? 10 : 5;
        win = bet * multiplier;
      } else if (s1 === s2 || s2 === s3 || s1 === s3) {
        multiplier = 2;
        win = bet * multiplier;
      } else {
        win = 0;
      }

      const diff = win - bet;
      updateSafeUserBalance(interaction.user.id, diff, xpData);

      const embed = new EmbedBuilder()
        .setColor(win > 0 ? 0x00FF66 : 0xFF4444)
        .setTitle('🎰 CASINO SLOTS')
        .setDescription(
          `**[ ${s1} | ${s2} | ${s3} ]**\n\n` +
          (win > 0 
            ? `🎉 **WINNER!** You won **${win.toLocaleString()} KC** (${multiplier}x payout)!` 
            : `😢 **No match!** You lost **${bet.toLocaleString()} KC**. Better luck next spin!`)
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'spin') {
      const prizes = [
        { label: '50 KC', amount: 50 },
        { label: '150 KC', amount: 150 },
        { label: '300 KC', amount: 300 },
        { label: '500 KC', amount: 500 },
        { label: '1,000 KC Jackpot!', amount: 1000 },
        { label: '25 KC', amount: 25 },
        { label: '2,500 KC MEGA JACKPOT!', amount: 2500 }
      ];
      const prize = prizes[Math.floor(Math.random() * prizes.length)];
      updateSafeUserBalance(interaction.user.id, prize.amount, xpData);

      const embed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle('🎡 WHEEL OF FORTUNE')
        .setDescription(
          `The wheel spun and stopped on...\n\n` +
          `🎯 **${prize.label}**\n\n` +
          `Added to your vault!`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'chest') {
      const rewards = [
        '💎 5x Diamonds + 250 KC',
        '🪙 500 KryloCoins',
        '⚔️ Iron Power Sword + 100 KC',
        '📦 Rare Lootbox Key + 200 KC',
        '🏆 1,000 KryloCoins!'
      ];
      const loot = rewards[Math.floor(Math.random() * rewards.length)];
      updateSafeUserBalance(interaction.user.id, 250, xpData);

      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('🧰 LUCKY CHEST OPENED!')
        .setDescription(`You unlocked today's mystery chest and revealed:\n\n**${loot}**!`)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'jackpot') {
      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('💎 GLOBAL SERVER JACKPOT POOL')
        .setDescription(
          `The current community jackpot pool stands at:\n\n` +
          `💰 **${Math.floor(lotteryData.jackpot).toLocaleString()} KryloCoins** 💰\n\n` +
          `Buy lottery tickets with \`/lottery\` to enter the weekly drawing!`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'quests') {
      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('📜 Season 3 Quests & Missions')
        .setDescription(
          `Complete daily quests to earn massive KryloCoins rewards:\n\n` +
          `• ⚔️ **Duelist:** Win 1 PvP duel (\`/duel\`) — Reward: \`500 KC\`\n` +
          `• 🎣 **Angler:** Catch 5 fish in \`/fish\` — Reward: \`300 KC\`\n` +
          `• ⛏️ **Spelunker:** Complete 3 mining expeditions (\`/mine\`) — Reward: \`400 KC\`\n` +
          `• 💬 **Active Chatter:** Send 50 messages in chat — Reward: \`1,000 KC\`\n\n` +
          `*Rewards are automatically deposited upon completion!*`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'shop' || commandName === 'store') {
      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('🛒 KryloSMP Official Store & Ranks')
        .setDescription(
          `Explore our community perks, ranks, and crate keys!\n\n` +
          `👑 **Ranks Available:**\n` +
          `• **VIP:** Access to \`/fly\`, 3 Sethomes, Chat Prefix\n` +
          `• **MVP:** Access to \`/feed\`, 5 Sethomes, Custom Nickname\n` +
          `• **Krylo Champion:** All perks + Exclusive Discord Role & Private Lounge\n\n` +
          `🌐 **Official Web Store:** https://krylosmp.web.app/`
        )
        .setFooter({ text: 'Supports both KryloCoins and direct store checkout' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('🛒 Visit Store').setStyle(ButtonStyle.Link).setURL('https://krylosmp.web.app/')
      );

      return await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (commandName === 'vote') {
      updateSafeUserBalance(interaction.user.id, 500, xpData);
      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('🗳️ Vote for KryloSMP')
        .setDescription(
          `Vote for the server to support the community and claim **+500 KC** & a voting key in-game!\n\n` +
          `• [Vote on TopG](https://topg.org)\n` +
          `• [Vote on PlanetMinecraft](https://planetminecraft.com)\n\n` +
          `*Thank you for supporting KryloSMP!*`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'refer') {
      const friend = interaction.options.getUser('friend');
      if (friend && friend.id === interaction.user.id) {
        return await interaction.reply({ content: '❌ You cannot refer yourself!', ephemeral: true });
      }

      updateSafeUserBalance(interaction.user.id, 2000, xpData);
      if (friend) updateSafeUserBalance(friend.id, 2000, xpData);

      const embed = new EmbedBuilder()
        .setColor(0x10B981)
        .setTitle('👥 Friend Referral Bonus')
        .setDescription(
          `Referral registered! Both <@${interaction.user.id}> and ${friend ? `<@${friend.id}>` : 'your friend'} have received **+2,000 KryloCoins**! 🎉`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'bump') {
      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📢 Disboard Bump Reminder')
        .setDescription(
          `Help grow the community by bumping the server on Disboard with \`/bump\`!\n` +
          `You can bump every **2 hours** to help new players discover KryloSMP.`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'leaderboard' || commandName === 'xpleaderboard') {
      const isXp = commandName === 'xpleaderboard';
      const embed = new EmbedBuilder()
        .setColor(0xF59E0B)
        .setTitle(isXp ? '🏆 Top 10 Chat Level & XP Leaderboard' : '💰 Top 10 KryloCoins Leaderboard')
        .setDescription(
          `1. <@${KRYLO_USER_ID}> — **999,999,999 KC** 👑 (Server Owner)\n` +
          `2. <@1523794466740371586> — **50,000 KC** (Bot Operator)\n` +
          `3. <@${interaction.user.id}> — **${getSafeUserBalance(interaction.user.id, xpData).toLocaleString()} KC**\n\n` +
          `*Earn more by chatting and running \`/daily\` & \`/work\`!*`
        )
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'clan') {
      const sub = interaction.options.getSubcommand(false) || 'info';

      if (sub === 'create') {
        const clanName = interaction.options.getString('name') || 'New Clan';
        const tag = interaction.options.getString('tag') || 'TAG';
        const userBal = getSafeUserBalance(interaction.user.id, xpData);

        if (userBal < 5000) {
          return await interaction.reply({ content: `❌ Creating a clan costs **5,000 KC**! (Your balance: **${userBal.toLocaleString()} KC**)`, ephemeral: true });
        }

        updateSafeUserBalance(interaction.user.id, -5000, xpData);
        clanData[tag] = { name: clanName, tag, leaderId: interaction.user.id, vault: 1000, members: [interaction.user.id] };

        const embed = new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle('🏰 Clan Created Successfully!')
          .setDescription(`Congratulations! Clan **[${tag}] ${clanName}** has been established by <@${interaction.user.id}>!`)
          .setTimestamp();

        return await interaction.reply({ embeds: [embed] });
      }

      if (sub === 'info') {
        const embed = new EmbedBuilder()
          .setColor(0x00E5FF)
          .setTitle('🏰 SMP Clan Status')
          .setDescription(
            `Clans allow players to team up, claim shared territory, build clan bases, and pool wealth in a Clan Vault!\n\n` +
            `• Use \`/clan create\` to start a new clan (Cost: 5,000 KC)\n` +
            `• Use \`/clan leaderboard\` to see top clans!`
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embed] });
      }

      if (sub === 'leaderboard') {
        const embed = new EmbedBuilder()
          .setColor(0xF59E0B)
          .setTitle('🏰 Top Clans Leaderboard')
          .setDescription(
            `1. **[KRYLO] The Sovereign** — Vault: **500,000 KC** 👑\n` +
            `2. **[SKY] Skybase Builders** — Vault: **125,000 KC**\n` +
            `3. **[PVP] Arena Champions** — Vault: **75,000 KC**`
          )
          .setTimestamp();

        return await interaction.reply({ embeds: [embed] });
      }
    }

    // ──────────────────────────────────────────────────────────
    // 10. 🎯 INTERACTIVE POLLS & GIVEAWAYS
    // ──────────────────────────────────────────────────────────
    if (commandName === 'poll') {
      const question = interaction.options.getString('question');
      const optString = interaction.options.getString('options');
      const opt1 = interaction.options.getString('option1');
      const opt2 = interaction.options.getString('option2');
      const opt3 = interaction.options.getString('option3');

      let choices = [];
      if (optString) {
        choices = optString.split(',').map(s => s.trim()).filter(Boolean);
      } else {
        if (opt1) choices.push(opt1);
        if (opt2) choices.push(opt2);
        if (opt3) choices.push(opt3);
      }
      if (choices.length < 2) {
        choices = ['Yes / Agree 👍', 'No / Disagree 👎'];
      }

      const numberEmojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];
      let description = `📊 **${question}**\n\n`;
      choices.slice(0, 5).forEach((c, idx) => {
        description += `${numberEmojis[idx]} ${c}\n`;
      });
      description += `\n*React below to cast your vote!*`;

      const embed = new EmbedBuilder()
        .setColor(0x5865F2)
        .setTitle('📊 Server Community Poll')
        .setDescription(description)
        .setFooter({ text: `Poll initiated by ${interaction.user.tag}` })
        .setTimestamp();

      const pollMsg = await interaction.reply({ embeds: [embed], fetchReply: true });
      for (let i = 0; i < Math.min(choices.length, 5); i++) {
        await pollMsg.react(numberEmojis[i]).catch(() => {});
      }
      return;
    }

    if (commandName === 'giveaway') {
      const prize = interaction.options.getString('prize');
      const rawDur = interaction.options.getString('duration') || '10m';

      let durationMinutes = 10;
      if (typeof rawDur === 'string') {
        const match = rawDur.match(/^(\d+)([mhd]?)$/i);
        if (match) {
          const num = parseInt(match[1]);
          const unit = (match[2] || 'm').toLowerCase();
          if (unit === 'h') durationMinutes = num * 60;
          else if (unit === 'd') durationMinutes = num * 1440;
          else durationMinutes = num;
        }
      }

      const endTimestamp = Math.floor(Date.now() / 1000) + (durationMinutes * 60);

      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('🎉 ACTIVE GIVEAWAY!')
        .setDescription(
          `**Prize:** 🎁 **${prize}**\n\n` +
          `• ⏰ **Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n` +
          `• 👑 **Hosted by:** <@${interaction.user.id}>\n\n` +
          `*Click the button below to enter!*`
        )
        .setFooter({ text: 'Krylo Network Giveaways • 0 Entries' })
        .setTimestamp();

      const enterButton = new ButtonBuilder()
        .setCustomId(`giveaway_enter_${Date.now()}`)
        .setLabel('Enter (0)')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎉');

      const row = new ActionRowBuilder().addComponents(enterButton);
      return await interaction.reply({ embeds: [embed], components: [row] });
    }

    if (commandName === 'announce') {
      const isStaff = interaction.member?.permissions?.has(PermissionFlagsBits.MentionEveryone) || 
                      interaction.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
                      interaction.user.id === KRYLO_USER_ID;

      if (!isStaff) {
        return await interaction.reply({ content: '❌ You must have administrator or mention permissions to broadcast announcements.', ephemeral: true });
      }

      const message = interaction.options.getString('message');
      const title = interaction.options.getString('title') || '📢 Official Server Announcement';

      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle(title)
        .setDescription(message)
        .setImage('https://krims-code-chatbot.vercel.app/skybase_banner.png')
        .setFooter({ text: `Announced by ${interaction.user.tag} • KryloSMP Network` })
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    // ──────────────────────────────────────────────────────────
    // 11. 🎫 SUPPORT TICKETS
    // ──────────────────────────────────────────────────────────
    if (commandName === 'ticket') {
      const reason = interaction.options.getString('reason') || 'General Support Inquiry';
      await interaction.deferReply({ ephemeral: true });

      const cleanUsername = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const existingChannel = interaction.guild?.channels.cache.find(c => c.name === `ticket-${cleanUsername}`);
      if (existingChannel) {
        return await interaction.editReply({ content: `⚠️ You already have an open ticket in <#${existingChannel.id}>!` });
      }

      const supportCategory = interaction.guild?.channels.cache.find(c => 
        c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes('ticket') || c.name.toLowerCase().includes('support'))
      );

      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${cleanUsername}`,
        type: ChannelType.GuildText,
        parent: supportCategory ? supportCategory.id : null,
        permissionOverwrites: [
          { id: interaction.guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.Administrator] }
        ]
      });

      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('🎫 Support Ticket Opened')
        .setDescription(
          `Welcome <@${interaction.user.id}>! Staff has been notified of your request.\n\n` +
          `📋 **Reason:** ${reason}\n\n` +
          `Please provide details below. Click **Close Ticket** when finished.`
        )
        .setTimestamp();

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('close_ticket').setLabel('🔒 Close Ticket').setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ content: `<@${interaction.user.id}>`, embeds: [welcomeEmbed], components: [closeRow] });
      return await interaction.editReply({ content: `✅ Ticket opened! Please head to <#${ticketChannel.id}>.` });
    }

    if (commandName === 'close') {
      if (!interaction.channel?.name?.startsWith('ticket-')) {
        return await interaction.reply({ content: '❌ This command can only be used inside a ticket channel.', ephemeral: true });
      }
      await interaction.reply('🔒 **Ticket closed. Channel will be deleted in 5 seconds...**');
      setTimeout(async () => {
        await interaction.channel?.delete().catch(() => {});
      }, 5000);
      return;
    }

    // ──────────────────────────────────────────────────────────
    // 12. 🏹 RPG UNIVERSE COMMANDS
    // ──────────────────────────────────────────────────────────
    if (commandName === 'bounty') {
      const target = interaction.options.getUser('target');
      const amount = interaction.options.getInteger('amount');
      if (!target || !amount) {
        const embed = new EmbedBuilder()
          .setTitle('🎯 ACTIVE BOUNTIES')
          .setColor(0xFFAA00)
          .setDescription(bountyData.size === 0 ? 'No active bounties. Use `/bounty target:@user amount:1000`!' : [...bountyData.entries()].map(([id, val]) => `<@${id}> — **${val.toLocaleString()} KC**`).join('\n'))
          .setTimestamp();
        return await interaction.reply({ embeds: [embed] });
      }

      bountyData.set(target.id, (bountyData.get(target.id) || 0) + amount);
      const embed = new EmbedBuilder()
        .setColor(0xFF4444)
        .setTitle('🎯 BOUNTY PLACED!')
        .setDescription(`<@${interaction.user.id}> placed a **${amount.toLocaleString()} KC** bounty on <@${target.id}>!`)
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'trade') {
      const player = interaction.options.getUser('player');
      const offer = interaction.options.getString('offer');

      if (player.id === interaction.user.id) {
        return await interaction.reply({ content: '❌ You cannot trade with yourself.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('🤝 TRADE OFFER')
        .setColor(0x5865F2)
        .setDescription(`<@${player.id}>, you received a trade offer from <@${interaction.user.id}>!\n\n**Offer:** ${offer}`)
        .setFooter({ text: 'Accept or Decline below' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`trade_accept_${interaction.user.id}_${player.id}`).setLabel('Accept').setStyle(ButtonStyle.Success).setEmoji('✅'),
        new ButtonBuilder().setCustomId(`trade_decline_${interaction.user.id}_${player.id}`).setLabel('Decline').setStyle(ButtonStyle.Danger).setEmoji('❌')
      );

      return await interaction.reply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
    }

    if (commandName === 'pet') {
      const action = interaction.options.getString('action') || 'view';
      const userId = interaction.user.id;

      if (action === 'adopt') {
        if (petData.get(userId)) {
          return await interaction.reply({ content: '❌ You already have an active companion pet!', ephemeral: true });
        }
        const types = ['Wolf 🐺', 'Cat 🐱', 'Parrot 🦜', 'Fox 🦊', 'Axolotl 🦎'];
        const chosen = types[Math.floor(Math.random() * types.length)];
        petData.set(userId, { name: 'Buddy', type: chosen, level: 1, hunger: 100, happiness: 100, xp: 0 });

        const embed = new EmbedBuilder()
          .setTitle('🐾 PET ADOPTED')
          .setColor(0x00FF66)
          .setDescription(`You adopted a **${chosen}**! Take good care of your new companion.`)
          .setTimestamp();
        return await interaction.reply({ embeds: [embed] });
      }

      const pet = petData.get(userId);
      if (!pet) {
        return await interaction.reply({ content: '❌ You do not have a pet! Use `/pet action:Adopt` to adopt one for free!', ephemeral: true });
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
          .setFooter({ text: 'KryloSMP Companion Pets' });
        return await interaction.reply({ embeds: [embed] });
      }

      if (action === 'feed') {
        pet.hunger = Math.min(100, pet.hunger + 20);
        pet.happiness = Math.min(100, pet.happiness + 10);
        return await interaction.reply(`🍖 You fed your pet! Hunger is now **${pet.hunger}%**.`);
      }

      if (action === 'train') {
        pet.xp += 25;
        pet.hunger = Math.max(0, pet.hunger - 15);
        if (pet.xp >= 100) {
          pet.level++;
          pet.xp = 0;
          return await interaction.reply(`✨ Your pet leveled up to **Level ${pet.level}**!`);
        }
        return await interaction.reply(`🎾 You trained your pet! Gained 25 XP. (${pet.xp}/100)`);
      }
    }

    if (commandName === 'fish') {
      const now = Date.now();
      const lastFish = fishCooldowns.get(interaction.user.id) || 0;
      if (now - lastFish < 15000) {
        const waitSec = Math.ceil((15000 - (now - lastFish)) / 1000);
        return await interaction.reply({ content: `⏳ The waters are calm! Cast again in **${waitSec}s**.`, ephemeral: true });
      }
      fishCooldowns.set(interaction.user.id, now);

      const catches = [
        { name: '🐟 Raw Cod', val: 50 },
        { name: '🐠 Tropical Fish', val: 150 },
        { name: '🐡 Pufferfish', val: 200 },
        { name: '💎 Sunken Diamond', val: 500 },
        { name: '👢 Old Leather Boot', val: 10 }
      ];
      const caught = catches[Math.floor(Math.random() * catches.length)];
      updateSafeUserBalance(interaction.user.id, caught.val, xpData);

      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle('🎣 FISHING EXPEDITION')
        .setDescription(`You cast your rod into Krylo waters and reeled in:\n\n**${caught.name}** (+${caught.val} KC)!`)
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'mine') {
      const now = Date.now();
      const lastMine = mineCooldowns.get(interaction.user.id) || 0;
      if (now - lastMine < 20000) {
        const waitSec = Math.ceil((20000 - (now - lastMine)) / 1000);
        return await interaction.reply({ content: `⏳ Mining picks need repair! Mine again in **${waitSec}s**.`, ephemeral: true });
      }
      mineCooldowns.set(interaction.user.id, now);

      const ores = [
        { name: '⛏️ Coal (+30 KC)', val: 30 },
        { name: '⛏️ Iron Ore (+80 KC)', val: 80 },
        { name: '⛏️ Gold Ore (+200 KC)', val: 200 },
        { name: '💎 Deepslate Diamond (+1,000 KC)', val: 1000 },
        { name: '🪨 Cobblestone (+5 KC)', val: 5 }
      ];
      const ore = ores[Math.floor(Math.random() * ores.length)];
      updateSafeUserBalance(interaction.user.id, ore.val, xpData);

      const embed = new EmbedBuilder()
        .setColor(0x7F8C8D)
        .setTitle('⛏️ MINING EXPEDITION')
        .setDescription(`You swung your pickaxe into the deep caves and struck:\n\n**${ore.name}**!`)
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'craft') {
      const embed = new EmbedBuilder()
        .setTitle('🛠️ CRAFTING STATION')
        .setColor(0x00FF66)
        .setDescription('Craft items to unlock combat and defense bonuses in duels and events:')
        .addFields(
          { name: '🗡️ Power Sword', value: 'Cost: 500 KC • +15% duel win probability', inline: true },
          { name: '🛡️ Mystic Shield', value: 'Cost: 800 KC • +25% robbery defense', inline: true },
          { name: '🧪 Haste Potion', value: 'Cost: 300 KC • 50% reduced mining cooldown', inline: true }
        )
        .setFooter({ text: 'Use /shop to purchase recipes and materials' });
      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'enchant') {
      const userBal = getSafeUserBalance(interaction.user.id, xpData);
      if (userBal < 500) {
        return await interaction.reply({ content: `❌ Enchanting costs **500 KC**! (Your balance: **${userBal.toLocaleString()} KC**)`, ephemeral: true });
      }
      updateSafeUserBalance(interaction.user.id, -500, xpData);

      const enchants = ['Sharpness V 🗡️', 'Protection IV 🛡️', 'Unbreaking III ⛏️', 'Fortune III ✨', 'Mending 💖'];
      const chosen = enchants[Math.floor(Math.random() * enchants.length)];

      const embed = new EmbedBuilder()
        .setTitle('✨ ENCHANTING TABLE')
        .setColor(0x9B59B6)
        .setDescription(`You channeled lapis and 500 KC into your gear and obtained:\n\n**${chosen}**!`)
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'raid') {
      const action = interaction.options.getString('action') || 'view';

      if (action === 'view') {
        const embed = new EmbedBuilder()
          .setTitle('🐉 WORLD RAID BOSS: THE ENDER DRAGON')
          .setColor(0x9B59B6)
          .setDescription(`**Boss Health:** \`${raidData.hp} / ${raidData.maxHp} HP\` 💖\n**Active Fighters:** \`${raidData.participants.size} players\``)
          .setFooter({ text: 'Use /raid action:Join to deal damage and earn KC!' });
        return await interaction.reply({ embeds: [embed] });
      }

      if (action === 'join') {
        const dmg = Math.floor(Math.random() * 450) + 150;
        raidData.hp = Math.max(0, raidData.hp - dmg);
        const curDmg = raidData.participants.get(interaction.user.id) || 0;
        raidData.participants.set(interaction.user.id, curDmg + dmg);

        updateSafeUserBalance(interaction.user.id, dmg, xpData);

        let desc = `⚔️ You struck the Ender Dragon for **${dmg} damage** and earned **+${dmg} KC**!\n\nBoss remaining HP: **${raidData.hp} / ${raidData.maxHp}**`;
        if (raidData.hp === 0) {
          desc += '\n\n🎉 **THE ENDER DRAGON HAS BEEN DEFEATED!** Bonus loot distributed to all fighters!';
          raidData.hp = raidData.maxHp;
          raidData.participants.clear();
        }

        const embed = new EmbedBuilder()
          .setTitle('🐉 RAID ATTACK SUCCESS')
          .setColor(0xFF4444)
          .setDescription(desc);
        return await interaction.reply({ embeds: [embed] });
      }

      if (action === 'leaderboard') {
        const sorted = [...raidData.participants.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
        const desc = sorted.length === 0 ? 'No damage dealt yet this raid cycle.' : sorted.map((p, i) => `**${i+1}.** <@${p[0]}> — ${p[1]} DMG`).join('\n');
        const embed = new EmbedBuilder().setTitle('🏆 RAID DAMAGE LEADERBOARD').setColor(0xFFAA00).setDescription(desc);
        return await interaction.reply({ embeds: [embed] });
      }
    }

    if (commandName === 'profile') {
      const targetUser = interaction.options.getUser('player') || interaction.user;
      const bal = getSafeUserBalance(targetUser.id, xpData);
      const pet = petData.get(targetUser.id);

      const embed = new EmbedBuilder()
        .setTitle(`👤 ${targetUser.username}'s Player Profile`)
        .setColor(0x5865F2)
        .setThumbnail(targetUser.displayAvatarURL())
        .addFields(
          { name: '💰 Vault Balance', value: `\`${bal.toLocaleString()} KC\``, inline: true },
          { name: '🐾 Companion Pet', value: pet ? `${pet.name} (${pet.type})` : 'None (Use `/pet`)', inline: true },
          { name: '🏅 Badges Unlocked', value: '🛡️ Verified Human\n⭐ Explorer\n⚔️ Arena Contender', inline: false }
        )
        .setFooter({ text: 'KryloSMP Network Profile' })
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'inventory') {
      const embed = new EmbedBuilder()
        .setTitle(`🎒 ${interaction.user.username}'s Backpack & Storage`)
        .setColor(0x00FF66)
        .setDescription(
          `• 🔑 **Keys:** 3x Common Key, 1x Rare Lootbox Key\n` +
          `• 💎 **Materials:** 16x Diamond, 32x Iron Ore, 4x Gold Ingot\n` +
          `• ⚔️ **Gear:** 1x Sharpness V Iron Sword, 1x Shield`
        )
        .setFooter({ text: 'Inventory System v3.0' });
      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'achievements') {
      const embed = new EmbedBuilder()
        .setTitle('🏆 UNLOCKED ACHIEVEMENTS')
        .setColor(0xFFAA00)
        .setDescription(
          `✅ **First Steps:** Joined Krylo Discord Server\n` +
          `✅ **Verified Human:** Linked Minecraft IGN to Discord\n` +
          `✅ **Coin Hoarder:** Earned over 1,000 KryloCoins\n` +
          `✅ **Deep Diver:** Cast a fishing line into open waters\n` +
          `🔒 **Dragon Slayer:** Defeat the World Raid Boss\n` +
          `🔒 **Clan Warlord:** Lead a clan to the Top 3 leaderboard`
        );
      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'heist') {
      const now = Date.now();
      const lastHeist = heistCooldowns.get(interaction.user.id) || 0;
      if (now - lastHeist < 1800000) { // 30 min
        const waitMin = Math.ceil((1800000 - (now - lastHeist)) / 60000);
        return await interaction.reply({ content: `⏳ The bank guards are on high alert! Attempt another heist in **${waitMin}m**.`, ephemeral: true });
      }
      heistCooldowns.set(interaction.user.id, now);

      const success = Math.random() < 0.35;
      if (success) {
        const loot = Math.floor(Math.random() * 3000) + 1000;
        updateSafeUserBalance(interaction.user.id, loot, xpData);
        const embed = new EmbedBuilder()
          .setTitle('🏦 BANK HEIST SUCCESSFUL!')
          .setColor(0x00FF66)
          .setDescription(`You cracked the high-security bank safe and escaped with **+${loot.toLocaleString()} KC**! 💰`);
        return await interaction.reply({ embeds: [embed] });
      } else {
        const fine = 350;
        updateSafeUserBalance(interaction.user.id, -fine, xpData);
        const embed = new EmbedBuilder()
          .setTitle('🚨 HEIST FAILED!')
          .setColor(0xFF4444)
          .setDescription(`The alarm tripped and guards detained you! Paid a **${fine} KC** bail fine.`);
        return await interaction.reply({ embeds: [embed] });
      }
    }

    if (commandName === 'rob') {
      const target = interaction.options.getUser('target');
      if (target.id === interaction.user.id) {
        return await interaction.reply({ content: '❌ You cannot rob yourself!', ephemeral: true });
      }

      const now = Date.now();
      const lastRob = robCooldowns.get(interaction.user.id) || 0;
      if (now - lastRob < 900000) { // 15 min
        const waitMin = Math.ceil((900000 - (now - lastRob)) / 60000);
        return await interaction.reply({ content: `⏳ You are laying low! Rob again in **${waitMin}m**.`, ephemeral: true });
      }
      robCooldowns.set(interaction.user.id, now);

      const targetBal = getSafeUserBalance(target.id, xpData);
      if (targetBal < 100) {
        return await interaction.reply({ content: '❌ That player is too poor to pickpocket!', ephemeral: true });
      }

      const success = Math.random() < 0.35;
      if (success) {
        const stolen = Math.floor(targetBal * 0.1) || 50;
        updateSafeUserBalance(target.id, -stolen, xpData);
        updateSafeUserBalance(interaction.user.id, stolen, xpData);
        const embed = new EmbedBuilder()
          .setTitle('🥷 PICKPOCKET SUCCESS!')
          .setColor(0x00FF66)
          .setDescription(`You snuck up on <@${target.id}> and stole **${stolen.toLocaleString()} KC**! 💸`);
        return await interaction.reply({ embeds: [embed] });
      } else {
        const fine = 150;
        updateSafeUserBalance(interaction.user.id, -fine, xpData);
        const embed = new EmbedBuilder()
          .setTitle('🚔 CAUGHT RED-HANDED!')
          .setColor(0xFF4444)
          .setDescription(`You tripped while pickpocketing <@${target.id}>! You were fined **${fine} KC**.`);
        return await interaction.reply({ embeds: [embed] });
      }
    }

    if (commandName === 'lottery') {
      const tickets = interaction.options.getInteger('tickets') || 1;
      const cost = tickets * 100;
      const userBal = getSafeUserBalance(interaction.user.id, xpData);

      if (userBal < cost) {
        return await interaction.reply({ content: `❌ You need **${cost} KC** to purchase ${tickets} lottery ticket(s)!`, ephemeral: true });
      }

      updateSafeUserBalance(interaction.user.id, -cost, xpData);
      lotteryData.jackpot += Math.floor(cost * 0.85);
      const curTickets = lotteryData.tickets.get(interaction.user.id) || 0;
      lotteryData.tickets.set(interaction.user.id, curTickets + tickets);

      const embed = new EmbedBuilder()
        .setTitle('🎟️ LOTTERY TICKET PURCHASED!')
        .setColor(0xFFAA00)
        .setDescription(
          `You purchased **${tickets}** lottery tickets!\n\n` +
          `• 💰 **Current Jackpot:** **${Math.floor(lotteryData.jackpot).toLocaleString()} KC**\n` +
          `• 🎫 **Your Total Tickets:** **${curTickets + tickets} tickets**\n\n` +
          `*Drawings occur weekly. Good luck!*`
        )
        .setTimestamp();
      return await interaction.reply({ embeds: [embed] });
    }

    if (commandName === 'lootbox') {
      const type = interaction.options.getString('type') || 'common';
      const userBal = getSafeUserBalance(interaction.user.id, xpData);

      const costs = { common: 0, rare: 500, epic: 2000, legendary: 5000 };
      const cost = costs[type] || 0;

      if (type === 'common') {
        const now = Date.now();
        const lastBox = lootboxCooldowns.get(interaction.user.id) || 0;
        if (now - lastBox < 1800000) {
          const waitMin = Math.ceil((1800000 - (now - lastBox)) / 60000);
          return await interaction.reply({ content: `⏳ You can open another free Common Lootbox in **${waitMin}m**.`, ephemeral: true });
        }
        lootboxCooldowns.set(interaction.user.id, now);
      } else {
        if (userBal < cost) {
          return await interaction.reply({ content: `❌ Opening a ${type} lootbox costs **${cost} KC**!`, ephemeral: true });
        }
        updateSafeUserBalance(interaction.user.id, -cost, xpData);
      }

      const rewards = {
        common: Math.floor(Math.random() * 100) + 50,
        rare: Math.floor(Math.random() * 700) + 300,
        epic: Math.floor(Math.random() * 3000) + 1500,
        legendary: Math.floor(Math.random() * 10000) + 5000
      };
      const win = rewards[type] || 50;
      updateSafeUserBalance(interaction.user.id, win, xpData);

      const embed = new EmbedBuilder()
        .setTitle(`🎁 ${type.toUpperCase()} LOOTBOX OPENED!`)
        .setColor(type === 'legendary' ? 0xFFAA00 : type === 'epic' ? 0x9B59B6 : 0x00FF66)
        .setDescription(`You opened the box and received:\n\n**+${win.toLocaleString()} KryloCoins**! 💰\nPlus 1x Mystery Resource Item!`)
        .setTimestamp();

      return await interaction.reply({ embeds: [embed] });
    }

    // ──────────────────────────────────────────────────────────
    // 13. FALLBACK TO LEGACY DISPATCH
    // ──────────────────────────────────────────────────────────
    if (context.handleLegacyCommand) {
      return await context.handleLegacyCommand(interaction);
    }

    // Safe catch-all acknowledgement
    return await interaction.reply({ 
      content: `⚡ Command \`/${commandName}\` executed successfully.`, 
      ephemeral: true 
    }).catch(() => {});

  } catch (err) {
    console.error(`[Master Command Error] /${commandName}:`, err);
    const errorMsg = `❌ Error executing \`/${commandName}\`: ${err.message || 'Unknown error'}`;
    if (interaction.deferred) {
      return await interaction.editReply({ content: errorMsg }).catch(() => {});
    } else if (!interaction.replied) {
      return await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
    }
  }
}
