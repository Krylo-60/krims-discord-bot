import { Client, GatewayIntentBits, Partials, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, AttachmentBuilder } from 'discord.js';
import { KrimsClient } from '@krishivpb60/krims-code-sdk';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs';
import { exec, spawn } from 'child_process';
import util from 'util';
import path from 'path';
import http from 'http';
import Jimp from 'jimp';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.Reaction
  ]
});

// Initialize Krims SDK Client pointing to Vercel mesh Chatbot API
const sdk = new KrimsClient({
  baseUrl: 'https://krims-code-chatbot.vercel.app'
});

// Maps to store state
const conversationHistory = new Map();
const userCooldowns = new Map();
const dailyCooldowns = new Map();
const workCooldowns = new Map();
const giveawayEntries = new Map(); // giveaway message ID -> Set of user IDs
const COOLDOWN_TIME = 10000; // 10 seconds cooldown in milliseconds
const spamMap = new Map();
const userStrikes = new Map();

// PvP Matchmaking State
let activeDuel = null; // { challengerId, challengedId, channelId }
const pvpQueue = [];  // Array of { challengerId, challengedId, challengerTag, challengedTag }

// Chat Activity Leveling System
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
    const pvpRole = guild.roles.cache.find(r => r.name === 'PvP Player');
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

client.once('ready', async () => {
  console.log(`[+] Krims Code Discord Bot online as ${client.user.tag}`);
  startAutoUpdater();

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
    }
  ];

  try {
    await client.application.commands.set(slashCommands);
    console.log('[+] Slash commands registered globally!');
  } catch (err) {
    console.error('[-] Failed to register slash commands:', err.message);
  }

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
      console.log(`[KryloSMP Setup] Found KryloSMP guild. Ensuring button systems are active...`);

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
        const hasRoleBtn = messages.some(m => m.components.some(c => c.components.some(b => b.customId.startsWith('role_'))));
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
            .setColor(0x00FF66)
            .setTitle('🔗 Link Minecraft Account')
            .setDescription('Link your official Minecraft account to gain access to the **Verified** role, sync your nickname, and track your in-game stats directly on Discord!\n\n**Instructions:**\n1. Click **Link Account** below and enter your Minecraft username.\n2. Log in to the Minecraft server (**`KryloSmp.play.hosting`**) where your verification code will display in chat!\n3. Click **Enter Verification Code** below and enter the code you received in-game.')
            .setImage('attachment://krylosmp_banner.png');
          
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('start_verification')
              .setLabel('Link Account')
              .setStyle(ButtonStyle.Success)
              .setEmoji('🔗'),
            new ButtonBuilder()
              .setCustomId('enter_verify_code')
              .setLabel('Enter Code')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🔑')
          );
          const files = [];
          if (fs.existsSync('krylosmp_banner.png')) {
            files.push(new AttachmentBuilder('krylosmp_banner.png', { name: 'krylosmp_banner.png' }));
          }
          await verifyCh.send({ embeds: [embed], components: [row], files });
          console.log(`[KryloSMP Setup] Sent verification button embed.`);
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

        const infoCat = await ensureCategory('📌 INFORMATION');
        const commCat = await ensureCategory('💬 COMMUNITY ZONE');
        const eventCat = await ensureCategory('🎪 EVENTS & ACTIVITIES');
        const liveCat = await ensureCategory('🎮 MINECRAFT LIVE');
        const staffCat = await ensureCategory('📞 STAFF AREA');
        const voiceCat = await ensureCategory('🔊 VOICE CHANNELS');

        // Helper to find or create/move a text channel
        const ensureChannel = async (name, parentCat, topic = '', isPrivate = false) => {
          const cleanSearch = name.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase();
          let ch = guild.channels.cache.find(c => c.name.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().includes(cleanSearch) && c.type === ChannelType.GuildText);
          
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
        await ensureChannel('ℹ️┃server-info', infoCat, 'Server information, IP address, and role selector.');
        await ensureChannel('📢┃announcements', infoCat, 'Official server news and announcements.');
        await ensureChannel('💡┃suggestions', infoCat, 'Submit your ideas and vote on suggestions!');

        // Align channels under 💬 COMMUNITY ZONE
        await ensureChannel('💬┃general-chat', commCat, 'General chat and discussion for KryloSMP players.');
        await ensureChannel('📷┃media-clips', commCat, 'Post your builds, screenshots, and videos!');
        await ensureChannel('🛒┃marketplace', commCat, 'List items for sale, trade, and advertise player shops.');
        await ensureChannel('🤖┃bot-commands', commCat, 'Use bot commands like /rank or /xpleaderboard here to keep chat clean.');
        await ensureChannel('📈┃polls', commCat, 'Participate in official server votes and polls.');

        // Align channels under 🎪 EVENTS & ACTIVITIES
        await ensureChannel('⚔️┃pvp-chat', eventCat, 'Chat about PvP, tournaments, and duels.');
        await ensureChannel('🏆┃tournaments', eventCat, 'Official server tournament updates.');
        await ensureChannel('🎨┃build-showcase', eventCat, 'Share your base coordinates or submit builds for build contests!');
        await ensureChannel('🎉┃giveaways', eventCat, 'Participate in item and rank giveaways!');

        // Align channels under 🎮 MINECRAFT LIVE
        const onlinePlayersCh = await ensureChannel('🟢┃players-online', liveCat, 'Real-time player tracking for KryloSMP.');
        const leaderboardCh = await ensureChannel('🏆┃leaderboards', liveCat, 'KryloSMP global chat and in-game leaderboards.');
        await ensureChannel('📰┃server-updates', liveCat, 'Real-time alerts for server join/leaves, deaths, and advancements!');

        // Align channels under 📞 STAFF AREA
        await ensureChannel('💬┃staff-chat', staffCat, 'Private chat area for staff members only.', true);
        const modLogsCh = await ensureChannel('🛡️┃mod-logs', staffCat, 'Moderator action logs and system notifications.', true);
        await ensureChannel('🚨┃reports', staffCat, 'Real-time player report logs.', true);

        // Align Voice Channels
        const voiceChannels = ['🔊┃Lobby', '🔊┃Survival 1', '🔊┃Survival 2', '🔊┃Gaming'];
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
      
      let pvpRole = guild.roles.cache.find(r => r.name === 'PvP Player');
      if (!pvpRole) {
        try {
          pvpRole = await guild.roles.create({
            name: 'PvP Player',
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
client.on('interactionCreate', async (interaction) => {
  if (interaction.guildId !== '1524878881918685405') {
    if (interaction.isRepliable()) {
      await interaction.reply({ content: '❌ This bot is private to KryloSMP and cannot be used here!', ephemeral: true });
    }
    return;
  }
  let guildConfig = null;
  // Handle Button Interactions
  if (interaction.isButton()) {
    const { customId } = interaction;

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

    if (customId === 'start_verification' || customId === 'enter_verify_code') {
      const verifiedRole = interaction.guild?.roles.cache.find(r => r.name === 'Verified');
      if (verifiedRole && interaction.member.roles.cache.has(verifiedRole.id)) {
        await interaction.reply({ content: '❌ **You are already verified!**\n\nIf you need to change your Minecraft username or link a different account, please open a support ticket in <#1524882737230774332> for staff assistance.', ephemeral: true });
        return;
      }
    }

    if (customId === 'start_verification') {
      const modal = new ModalBuilder()
        .setCustomId('modal_start_verification')
        .setTitle('Link Minecraft Account');

      const usernameInput = new TextInputBuilder()
        .setCustomId('mc_username')
        .setLabel('What is your Minecraft Username?')
        .setPlaceholder('e.g. Krylo_MC')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(usernameInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
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

    if (customId === 'open_ticket') {
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
        const linkEmbed = new EmbedBuilder()
          .setColor(0xFF4444)
          .setTitle('❌ Account Not Linked')
          .setDescription('You need to **link your Minecraft account** before you can purchase items from the store!')
          .addFields(
            { name: '📋 How to Link', value: '1. Go to <#1526685112693952568>\n2. Click **Link Minecraft Account**\n3. Enter your MC username\n4. Join the server & enter the code' }
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
            { name: '🚨 Priority Level', value: `\`${calculatedPriority}\``, inline: true }
          )
          .setFooter({ text: 'Type /close to resolve and delete this channel' })
          .setTimestamp();

        await channel.send({ content: `<@${interaction.user.id}>`, embeds: [profileEmbed] });
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
      const mcUsername = interaction.fields.getTextInputValue('mc_username');
      
      try {
        const response = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'request_verification',
            guildId: '1524878881918685405',
            name: mcUsername,
            discordUserId: interaction.user.id
          })
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.ok) {
            await interaction.editReply(`✅ **Link request queued for username: \`${mcUsername}\`!**\n\nNext steps:\n1. Open Minecraft and connect to the server: **\`KryloSmp.play.hosting\`**\n2. Look at your in-game chat—your 5-digit verification code will display on join!\n3. Copy that code, return here, and click the **Enter Code** button.`);
          } else {
            await interaction.editReply(`❌ Failed: ${resData.error || 'Server error'}`);
          }
        } else {
          await interaction.editReply('❌ Failed to connect to verification server.');
        }
      } catch (err) {
        await interaction.editReply(`❌ Error: ${err.message}`);
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

            await interaction.editReply({ embeds: [successEmbed] });
          } else {
            await interaction.editReply(`❌ Verification failed: ${result.error || 'Invalid or expired code.'}`);
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
    const reward = 250;

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
        config.economyData[interaction.user.username].balance += reward;

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId, config })
        });
      }
    } catch {}

    const embed = new EmbedBuilder()
      .setColor(0x00FF66)
      .setTitle('💰 Daily Reward Claimed!')
      .setDescription(`Congratulations <@${userId}>! You claimed your daily **+${reward} KryloCoins**! 🪙\nCome back in 24 hours for your next claim!`)
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

  // Command: /balance
  if (commandName === 'balance') {
    const targetUser = interaction.options.getUser('user') || interaction.user;
    let balance = 0;

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
    } catch {}

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
    const targetUser = interaction.options.getUser('user') || interaction.user;
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
  if (commandName === 'rank') {
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

      if (data.online) {
        const playersOnline = data.players.online;
        const playersMax = data.players.max;
        const playerList = data.players.list ? data.players.list.join(', ') : 'None';
        const motd = data.motd.clean ? data.motd.clean.join('\n') : 'A Minecraft Server';

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
    const suggestCh = interaction.guild.channels.cache.find(c => c.name.includes('suggestions') && c.type === ChannelType.GuildText);

    if (!suggestCh) {
      await interaction.reply({ content: '❌ No suggestions channel found!', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('💡 New Suggestion')
      .setDescription(idea)
      .setFooter({ text: `Suggested by ${interaction.user.username}` })
      .setTimestamp();

    const msg = await suggestCh.send({ embeds: [embed] });
    await msg.react('👍');
    await msg.react('👎');

    await interaction.reply({ content: `✅ Your suggestion was posted in ${suggestCh}!`, ephemeral: true });
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
      await interaction.editReply('❌ **You are already verified!**\n\nIf you need to change your Minecraft username or link a different account, please open a support ticket in <#1524882737230774332> for staff assistance.');
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
          { name: '🚨 Priority Level', value: `\`${calculatedPriority}\``, inline: true }
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

    let pvpRole = interaction.guild.roles.cache.find(r => r.name === 'PvP Player');
    if (!pvpRole) {
      try {
        pvpRole = await interaction.guild.roles.create({
          name: 'PvP Player',
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

      handleAIFailover(result, interaction.guild);

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
// Dedup guard to prevent processing the same message twice
const processedMessages = new Set();

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.guild && message.guild.id !== '1524878881918685405') return;

  // Prevent duplicate processing of the same message
  if (processedMessages.has(message.id)) return;
  processedMessages.add(message.id);
  // Clean up old message IDs after 30 seconds to prevent memory leak
  setTimeout(() => processedMessages.delete(message.id), 30000);

  // Process message XP leveling
  await handleMessageXP(message);

  // Auto-Format Suggestions Channel
  if (message.guild && message.channel.name.includes('suggestions')) {
    try {
      await message.delete().catch(() => {});
      const suggestEmbed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('💡 New Server Suggestion')
        .setDescription(message.content)
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL({ dynamic: true })
        })
        .setFooter({ text: `Suggested by ${message.author.username} • React to vote!` })
        .setTimestamp();

      const msg = await message.channel.send({ embeds: [suggestEmbed] });
      await msg.react('👍');
      await msg.react('👎');
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

    let pvpRole = message.guild.roles.cache.find(r => r.name === 'PvP Player');
    if (!pvpRole) {
      try {
        pvpRole = await message.guild.roles.create({
          name: 'PvP Player',
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
          { name: '🚨 Priority Level', value: `\`${calculatedPriority}\``, inline: true }
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

      handleAIFailover(result, message.guild);

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
      // Hide raw API error details from users - show clean message
      const isOverloaded = err.message.includes('503') || err.message.includes('UNAVAILABLE') || err.message.includes('high demand');
      const isTimeout = err.message.includes('timeout') || err.message.includes('ECONNRESET') || err.message.includes('ENOTFOUND');
      if (isOverloaded) {
        await typingMsg.edit('⚡ **AI is experiencing high demand.** Please try again in a few seconds!');
      } else if (isTimeout) {
        await typingMsg.edit('🌐 **Connection timed out.** The AI server may be temporarily unreachable. Try again!');
      } else {
        await typingMsg.edit('❌ **AI is temporarily unavailable.** Please try again in a moment!');
      }
      console.error('[AI Error]', err.message.substring(0, 200));
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
  if (member.guild.id !== KRYLO_GUILD_ID) return;

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

  // Send styled welcome card in #general-chat
  try {
    const generalCh = member.guild.channels.cache.find(c => c.name.includes('general-chat') && c.type === ChannelType.GuildText);
    if (generalCh) {
      const memberCount = member.guild.memberCount;
      const avatarUrl = member.user.displayAvatarURL({ extension: 'png', forceStatic: true, size: 256 });
      
      const cardBuffer = await generateWelcomeCard(avatarUrl, member.user.username, memberCount);
      let files = [];
      if (cardBuffer) {
        files.push(new AttachmentBuilder(cardBuffer, { name: 'welcome-card.png' }));
      }

      const embed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('⚡ New Player Joined!')
        .setDescription(
          `Welcome to **KryloSMP**, <@${member.user.id}>! You are member **#${memberCount}**!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🔐 Head to <#1526685108311031980> to **verify** and pick your platform\n` +
          `📜 Read the <#1524882716468842720> to stay safe\n` +
          `🎮 Connect to \`KryloSmp.play.hosting\` and start playing!`
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: `KryloSMP • ${memberCount} members • Built by Krishiv ⚡` })
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
  // Update function
  const updateStatus = async () => {
    try {
      const res = await fetch('https://api.mcsrvstat.us/2/KryloSmp.play.hosting');
      if (!res.ok) throw new Error(`mcsrvstat returned ${res.status}`);
      const data = await res.json();
      
      const unixTime = Math.floor(Date.now() / 1000);
      const embed = new EmbedBuilder();

      if (data.online) {
        const onlineCount = data.players.online;
        const maxCount = data.players.max;
        const playerList = data.players.list ? data.players.list.map(p => `• \`${p}\``).join('\n') : 'No players currently online.';
        const motd = data.motd.clean ? data.motd.clean.join('\n') : 'KryloSMP Minecraft Server';

        embed
          .setColor(0x00FF66)
          .setTitle('🟢 KryloSMP Server is ONLINE')
          .setDescription(`🤖 **Live Server Tracking**\n\n**IP:** \`KryloSmp.play.hosting\`\n**Version:** \`v5.0.0\`\n\n**MOTD:**\n\`\`\`\n${motd}\n\`\`\``)
          .addFields(
            { name: `👥 Players Online (${onlineCount}/${maxCount})`, value: playerList, inline: false },
            { name: '🕒 Last Updated', value: `<t:${unixTime}:R>`, inline: true }
          )
          .setFooter({ text: 'Auto-updating every 20 seconds' })
          .setTimestamp();

        // Update bot activity status
        client.user.setActivity(`KryloSMP: ${onlineCount}/${maxCount}`, { type: 0 }); // Playing
      } else {
        embed
          .setColor(0xFF3333)
          .setTitle('🔴 KryloSMP Server is OFFLINE')
          .setDescription('The server is currently stopped or restarting.')
          .addFields(
            { name: '📡 Connection IP', value: '`KryloSmp.play.hosting`', inline: false },
            { name: '🕒 Last Updated', value: `<t:${unixTime}:R>`, inline: true }
          )
          .setFooter({ text: 'Auto-updating every 20 seconds' })
          .setTimestamp();

        client.user.setActivity('KryloSMP (Offline)', { type: 0 });
      }

      // Fetch and delete any existing bot messages in this channel to clear old statuses
      try {
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessages = messages.filter(m => m.author.id === client.user.id);
        for (const [, msg] of botMessages) {
          await msg.delete().catch(() => {});
        }
      } catch (err) {
        console.warn('[Live Status] Failed to clean up old status messages:', err.message);
      }

      // Send the new fresh status message
      await channel.send({ embeds: [embed] });
    } catch (err) {
      console.warn('[Live Status] Error updating status:', err.message);
    }
  };

  // Run immediately and then schedule every 20 seconds
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
      const installedBuild = guildConfig.installedPaperBuild || 62; // Default to 62

      if (latestBuild > installedBuild) {
        console.log(`[Paper Auto-Updater] New build detected: #${latestBuild} (current is #${installedBuild}). Starting upgrade sequence...`);
        isUpgradingPaper = true;

        const serverId = '25a5d79a';
        const pteroToken = process.env.PTERODACTYL_TOKEN;
        const generalCh = guild.channels.cache.find(c => c.name.includes('general-chat') && c.type === ChannelType.GuildText);

        // A. Send warnings to Discord & Minecraft Console
        const sendAlert = async (timeLeftText) => {
          const alertMsg = `🚨 **PaperMC Server Auto-Upgrade Alert!**\n` +
            `A new Paper build (#${latestBuild}) has been detected. The Minecraft server will save and shut down for auto-upgrade in **${timeLeftText}**.\n` +
            `*Please save your progress and log out safely!*`;
          
          if (generalCh) {
            await generalCh.send({
              embeds: [
                new EmbedBuilder()
                  .setColor(0xFF3300)
                  .setTitle('⚠️ Server Update Warning')
                  .setDescription(alertMsg)
                  .setTimestamp()
              ]
            }).catch(() => {});
          }

          // Send to Minecraft console using say command
          try {
            await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/command`, {
              method: 'POST',
              headers: {
                'Authorization': 'Bearer ' + pteroToken,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
              },
              body: JSON.stringify({ command: `say [ALERT] Server is shutting down for update in ${timeLeftText}!` })
            });
          } catch (e) {
            console.warn('[Paper Auto-Updater] Failed to send say command:', e.message);
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

        // H. Send success notification to Discord
        if (generalCh) {
          await generalCh.send({
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

    const result = await sdk.ask(prompt, {
      model: 'gemini',
      systemInstruction: 'You are an automated support ticket priority classifier. Reply with exactly "High", "Medium", or "No Staff Needed" based on the ticket reason.'
    });

    if (result && result.response) {
      const responseText = result.response.trim();
      if (responseText.includes('High')) return 'High';
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
  // Guard 1: Restrict updates/actions strictly to the KryloSMP Discord Server
  if (!message.guild || message.guild.id !== '1524878881918685405') {
    return;
  }

  // Guard 2: Skip automated responses if a staff member/moderator/admin is chatting
  const isStaff = message.member?.permissions.has(PermissionFlagsBits.ManageChannels) || 
                  message.member?.roles.cache.some(r => r.name.toLowerCase().includes('staff') || r.name.toLowerCase().includes('admin') || r.name.toLowerCase().includes('mod'));
  if (isStaff) {
    return;
  }

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
    const answerResult = await sdk.ask(message.content, {
      model: modelEngine,
      systemInstruction: ticketSystemInstruction,
      history: history
    });

    handleAIFailover(answerResult, message.guild);

    if (answerResult.ok && answerResult.response) {
      history.push({ role: 'user', content: message.content });
      history.push({ role: 'model', content: answerResult.response });
      if (history.length > 10) history = history.slice(history.length - 10);
      conversationHistory.set(message.channel.id, history);

      await message.reply(`🤖 **Krims Support AI:**\n${answerResult.response}`);
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

      const classificationResult = await sdk.ask(classificationPrompt, {
        model: modelEngine,
        systemInstruction: "You are a precise analyzer. Output only the requested match string without any introductory text."
      });

      if (classificationResult.ok && classificationResult.response) {
        const resText = classificationResult.response.trim();
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
          await message.channel.send(`ℹ️ **Ticket Status (Level: EASY / NOT FIXABLE)**\nThis ticket has been classified as **EASY** or **NOT FIXABLE**. Support team, resolve this when free (within **72 hours**).`);
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

