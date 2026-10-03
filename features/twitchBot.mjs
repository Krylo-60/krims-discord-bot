import tmi from 'tmi.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { processTwitchChatCode } from './twitchVerificationEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'twitch-users.json');
const CHANNELS_FILE = path.join(__dirname, '..', 'data', 'twitch-channels.json');

// In-memory data store with JSON persistence for user stats
let users = {};
try {
  if (fs.existsSync(DATA_FILE)) {
    users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  }
} catch (e) {
  console.error('[TwitchBot] Error loading users database:', e.message);
  users = {};
}

function saveUsers() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (e) {
    console.error('[TwitchBot] Error saving users database:', e.message);
  }
}

function getUser(username) {
  const key = username.toLowerCase();
  if (!users[key]) {
    users[key] = {
      username: key,
      points: 150, // Starting welcome bonus!
      messages: 0,
      lastDaily: null,
      wins: 0
    };
    saveUsers();
  }
  return users[key];
}

// Multi-Channel Persistence
let joinedChannels = [];
function loadChannels(defaultChannel) {
  try {
    if (fs.existsSync(CHANNELS_FILE)) {
      joinedChannels = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[TwitchBot] Error loading channels list:', e.message);
  }

  if (!Array.isArray(joinedChannels) || joinedChannels.length === 0) {
    joinedChannels = [defaultChannel ? defaultChannel.toLowerCase() : 'kryloplaysmc'];
    saveChannels();
  } else if (defaultChannel && !joinedChannels.includes(defaultChannel.toLowerCase())) {
    joinedChannels.push(defaultChannel.toLowerCase());
    saveChannels();
  }
  return joinedChannels;
}

function saveChannels() {
  try {
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(joinedChannels, null, 2), 'utf8');
  } catch (e) {
    console.error('[TwitchBot] Error saving channels list:', e.message);
  }
}

// Active Duels: key = targetUsername, val = { challenger, amount, expiresAt }
const activeDuels = new Map();

// Active Heist: { inProgress: false, participants: Map(username -> amount), timer: null }
let activeHeist = {
  inProgress: false,
  participants: new Map(),
  timer: null
};

// Active Trivia: { question, answer, reward, active: false }
let activeTrivia = null;

const TRIVIA_QUESTIONS = [
  { q: "What is the rarest ore in Minecraft overworld?", a: "emerald" },
  { q: "How many obsidian blocks are needed to make a minimal Nether Portal?", a: "10" },
  { q: "What item do you feed a pig to breed it?", a: "carrot" },
  { q: "What dimension does the Ender Dragon live in?", a: "end" },
  { q: "What is the crafting recipe for a cake? (Which animal provides the milk?)", a: "cow" },
  { q: "Which mob explodes when it gets close to the player?", a: "creeper" },
  { q: "What is the max enchanting level in vanilla Minecraft?", a: "30" },
  { q: "What tool is best for mining obsidian?", a: "diamond pickaxe" }
];

let globalTwitchClient = null;

export function getJoinedChannels() {
  return [...joinedChannels];
}

export async function joinChannel(channelName) {
  const cleanName = channelName.replace('#', '').toLowerCase().trim();
  if (!cleanName) return { success: false, error: 'Invalid channel name' };

  if (!joinedChannels.includes(cleanName)) {
    joinedChannels.push(cleanName);
    saveChannels();
  }

  if (globalTwitchClient) {
    try {
      await globalTwitchClient.join(cleanName);
      globalTwitchClient.say(cleanName, `👋 Hey everyone! Krims Code (by Krylo) has joined the stream! 🎮 Type !commands for games, slots, duels, trivia, and AI chat. Don't forget to /mod ${globalTwitchClient.getUsername()}!`);
      return { success: true, channel: cleanName };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  return { success: true, channel: cleanName, pending: true };
}

export async function leaveChannel(channelName) {
  const cleanName = channelName.replace('#', '').toLowerCase().trim();
  joinedChannels = joinedChannels.filter(c => c !== cleanName);
  saveChannels();

  if (globalTwitchClient) {
    try {
      await globalTwitchClient.say(cleanName, `👋 Krims Code is now leaving this channel. Thanks for having me! Type !join in twitch.tv/kryloplaysmc to invite me back anytime.`);
      await globalTwitchClient.part(cleanName);
      return { success: true, channel: cleanName };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
  return { success: true, channel: cleanName };
}

let globalDiscordClient = null;

export async function initTwitchBot(discordClient = null) {
  if (discordClient) globalDiscordClient = discordClient;
  const botUsername = process.env.TWITCH_BOT_USERNAME || 'kryloplaysmc';
  const token = process.env.TWITCH_OAUTH_TOKEN;
  const homeChannel = process.env.TWITCH_CHANNEL || 'kryloplaysmc';

  const initialChannels = loadChannels(homeChannel);
  const formattedToken = token ? (token.startsWith('oauth:') ? token : `oauth:${token}`) : null;

  const clientOptions = {
    options: { debug: false },
    connection: {
      reconnect: true,
      secure: true
    },
    channels: initialChannels
  };

  if (token && formattedToken) {
    clientOptions.identity = {
      username: botUsername.toLowerCase(),
      password: formattedToken
    };
  }

  const client = new tmi.Client(clientOptions);
  globalTwitchClient = client;

  // Safe wrapper for client.say to prevent crashes when running in anonymous listener mode
  const rawSay = client.say.bind(client);
  client.say = async (channel, message) => {
    if (process.env.TWITCH_OAUTH_TOKEN) {
      try {
        return await rawSay(channel, message);
      } catch (e) {
        console.error('[TwitchBot Say Error]', e.message);
      }
    }
    return Promise.resolve();
  };

  client.on('connected', (addr, port) => {
    if (token) {
      console.log(`[TwitchBot] 🟣 Public Bot active! Connected as ${botUsername} in ${initialChannels.length} channels: ${initialChannels.join(', ')}`);
    } else {
      console.log(`[TwitchBot] 🟣 Anonymous Chat Listener active in ${initialChannels.length} channel(s): ${initialChannels.join(', ')} (Real-time Stream Verification Ready!)`);
    }
  });

  client.on('message', async (targetChannel, tags, message, self) => {
    if (self) return; // Don't reply to self

    const cleanChannel = targetChannel.replace('#', '').toLowerCase();
    const username = tags.username.toLowerCase();
    const displayName = tags['display-name'] || username;
    const isBroadcaster = tags.badges?.broadcaster === '1' || username === cleanChannel;
    const isMod = tags.mod || isBroadcaster || username === 'kryloplaysmc';

    const user = getUser(username);
    user.messages += 1;
    saveUsers();

    const trimmed = message.trim();
    const args = trimmed.split(' ');
    const cmd = args[0].toLowerCase();

    // === Twitch Stream Verification Command ===
    // Matches: !link <code>, !verify <code>, or direct <code> (e.g. SKY-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX)
    const codeMatch = trimmed.match(/\b(sky-[a-z0-9-]+)\b/i);
    if (cmd === '!link' || cmd === '!verify' || codeMatch) {
      const targetCode = (cmd === '!link' || cmd === '!verify') ? (args[1] || (codeMatch ? codeMatch[1] : '')) : (codeMatch ? codeMatch[1] : cmd);
      if (targetCode && targetCode.toLowerCase().startsWith('sky-')) {
        // Auto-delete the message from stream chat so no one else sees or copies the code!
        if (tags && tags.id && process.env.TWITCH_OAUTH_TOKEN) {
          try {
            client.deletemessage(targetChannel, tags.id).catch(() => {});
          } catch (delErr) {}
        }

        try {
          const res = await processTwitchChatCode(username, displayName, targetCode, globalDiscordClient, tags);
          if (res.success) {
            console.log(`[TwitchBot] ✅ Successfully verified Twitch ${displayName} (Sub: ${res.isSubscribed}) -> Discord @${res.entry.discordTag}`);
            let replyMsg = res.isSubscribed
              ? `🎉 @${displayName} Verification successful! Verified as an official Twitch SUBSCRIBER & FOLLOWER! VIP Sub & Follower roles equipped on Discord! 👑🟣`
              : `🎉 @${displayName} Verification successful! Verified as an official Twitch FOLLOWER! Follower role equipped on Discord! 🟣 (Subscribe on Twitch anytime to unlock the VIP Subbed role!)`;
            if (res.nicknameStatus === 'blocked_krylo') {
              replyMsg += ` (Note: Discord nickname was kept because 'Krylo' is a protected name)`;
            } else if (res.nicknameStatus === 'updated') {
              replyMsg += ` (Discord nickname updated to "${displayName}")`;
            }
            client.say(targetChannel, replyMsg);
          } else {
            console.log(`[TwitchBot] Verification attempt by ${displayName} with code "${targetCode}": ${res.reason}`);
            if (res.reason === 'invalid_code') {
              client.say(targetChannel, `@${displayName} Invalid or unknown verification code! Click "Verify Twitch" in Discord #🟣・𝖳𝗐𝗂𝗍𝖼𝗁-𝗏𝖾𝗋𝗂𝖿𝗒 to get your unique code.`);
            } else if (res.reason === 'code_expired') {
              client.say(targetChannel, `@${displayName} Verification code has expired. Please get a fresh code in Discord!`);
            }
          }
        } catch (verErr) {
          console.error('[TwitchBot] Verification error:', verErr);
        }
        return;
      }
    }

    // 0. Public Multi-Channel Commands: !join and !leave
    if (cmd === '!join') {
      const targetJoin = (args[1] || username).replace('@', '').toLowerCase().trim();
      if (!joinedChannels.includes(targetJoin)) {
        joinedChannels.push(targetJoin);
        saveChannels();
        try {
          await client.join(targetJoin);
          client.say(targetChannel, `✅ @${displayName} Krims Code has joined #${targetJoin}! Make sure to "/mod ${botUsername}" in your chat so I can talk without limits! 🎮`);
          client.say(targetJoin, `👋 Hey everyone! Krims Code (by Krylo) has officially arrived! 🎮 Type !commands for games, slots, duels, trivia, and AI chat!`);
        } catch (e) {
          client.say(targetChannel, `❌ @${displayName} Could not join #${targetJoin}: ${e.message}`);
        }
      } else {
        client.say(targetChannel, `@${displayName} Krims Code is already active in #${targetJoin}!`);
      }
      return;
    }

    if (cmd === '!leave' || cmd === '!part') {
      if (!isMod) {
        client.say(targetChannel, `@${displayName} Only the channel broadcaster or moderator can use !leave.`);
        return;
      }

      if (cleanChannel === homeChannel && username !== 'kryloplaysmc' && !args[1]) {
        client.say(targetChannel, `@${displayName} You cannot remove Krims Code from its home channel!`);
        return;
      }

      const channelToLeave = (args[1] || cleanChannel).replace('#', '').toLowerCase().trim();
      client.say(targetChannel, `👋 Krims Code is now leaving #${channelToLeave}. Type !join in twitch.tv/kryloplaysmc anytime to invite me back!`);
      
      joinedChannels = joinedChannels.filter(c => c !== channelToLeave);
      saveChannels();
      try {
        await client.part(channelToLeave);
      } catch (e) {}
      return;
    }

    if (cmd === '!channels') {
      client.say(targetChannel, `🟣 Krims Code is currently active in ${joinedChannels.length} Twitch channels! Type !join to add me to your stream.`);
      return;
    }

    // 1. AI Chat Co-Host (@kryloplaysmc or !ask)
    const isBotMentioned = trimmed.toLowerCase().includes(`@${botUsername.toLowerCase()}`);
    if (cmd === '!ask' || isBotMentioned) {
      const prompt = cmd === '!ask' ? args.slice(1).join(' ') : trimmed.replace(new RegExp(`@${botUsername}`, 'gi'), '').trim();
      if (!prompt) {
        client.say(targetChannel, `@${displayName} Yo! What's up? Ask me anything with !ask <question> or challenge someone with !duel!`);
        return;
      }

      try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
        if (apiKey) {
          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are Krims Code, a witty, chill, and hype stream AI companion for Krylo and friends. Keep responses under 200 characters, no hashtags, no markdown formatting, directly address @${displayName}: ${prompt}`
          });
          const reply = response.text ? response.text.replace(/\n/g, ' ').trim() : "I'm drawing a blank right now, stream's too hype!";
          client.say(targetChannel, reply.substring(0, 300));
        } else {
          client.say(targetChannel, `@${displayName} Krims Code AI is hyped and watching the stream!`);
        }
      } catch (err) {
        console.error('[TwitchBot AI Error]', err.message);
        client.say(targetChannel, `@${displayName} My brain glitched for a second, ask me again!`);
      }
      return;
    }

    // 2. Active Trivia Answer Checking
    if (activeTrivia && activeTrivia.active) {
      if (trimmed.toLowerCase().includes(activeTrivia.answer)) {
        activeTrivia.active = false;
        user.points += activeTrivia.reward;
        saveUsers();
        client.say(targetChannel, `🎉 GGs @${displayName}! You got the correct answer: "${activeTrivia.answer.toUpperCase()}"! You won +${activeTrivia.reward} KryloCoins! 🪙`);
        activeTrivia = null;
        return;
      }
    }

    // 3. Economy & Wallet Commands
    if (cmd === '!points' || cmd === '!coins' || cmd === '!wallet' || cmd === '!bal') {
      const tier = getTier(user.points);
      client.say(targetChannel, `@${displayName} You have 🪙 ${user.points} KryloCoins! Rank: ${tier} | Level ${Math.floor(user.messages / 20) + 1}`);
      return;
    }

    if (cmd === '!daily') {
      const today = new Date().toISOString().slice(0, 10);
      if (user.lastDaily === today) {
        client.say(targetChannel, `@${displayName} You already claimed your daily coins today! Come back tomorrow for +100 coins ⏳`);
        return;
      }
      user.lastDaily = today;
      user.points += 100;
      saveUsers();
      client.say(targetChannel, `🎁 @${displayName} claimed their daily bonus of +100 KryloCoins! Total: 🪙 ${user.points}`);
      return;
    }

    // 4. Gamble / Slots Game
    if (cmd === '!gamble' || cmd === '!slots') {
      const amountStr = args[1];
      let bet = 0;
      if (amountStr === 'all') {
        bet = user.points;
      } else {
        bet = parseInt(amountStr);
      }

      if (isNaN(bet) || bet <= 0) {
        client.say(targetChannel, `@${displayName} Usage: !gamble <amount> (e.g. !gamble 50 or !gamble all)`);
        return;
      }

      if (bet > user.points) {
        client.say(targetChannel, `@${displayName} You only have 🪙 ${user.points} coins! You can't bet that much.`);
        return;
      }

      const symbols = ['🍒', '💎', '👑', '🔥', '⭐', '💀'];
      const r1 = symbols[Math.floor(Math.random() * symbols.length)];
      const r2 = symbols[Math.floor(Math.random() * symbols.length)];
      const r3 = symbols[Math.floor(Math.random() * symbols.length)];
      const reel = `[ ${r1} | ${r2} | ${r3} ]`;

      if (r1 === r2 && r2 === r3) {
        // JACKPOT: 5x
        const won = bet * 4;
        user.points += won;
        user.wins += 1;
        saveUsers();
        client.say(targetChannel, `🎰 @${displayName} spun ${reel} -> JACKPOT TRIPLE ${r1}! Won +🪙 ${won} coins! Total: 🪙 ${user.points} 🎉`);
      } else if (r1 === r2 || r2 === r3 || r1 === r3) {
        // DOUBLE: 2x
        const won = bet;
        user.points += won;
        user.wins += 1;
        saveUsers();
        client.say(targetChannel, `🎰 @${displayName} spun ${reel} -> DOUBLE MATCH! Won +🪙 ${won} coins! Total: 🪙 ${user.points} ✨`);
      } else {
        // LOSS
        user.points -= bet;
        saveUsers();
        client.say(targetChannel, `🎰 @${displayName} spun ${reel} -> Bust! Lost 🪙 ${bet} coins. Balance: 🪙 ${user.points}`);
      }
      return;
    }

    // 5. 1v1 Chat Duels
    if (cmd === '!duel') {
      const targetUser = (args[1] || '').replace('@', '').toLowerCase();
      const amount = parseInt(args[2]);

      if (!targetUser || isNaN(amount) || amount <= 0) {
        client.say(targetChannel, `@${displayName} Usage: !duel @username <amount> (e.g. !duel @steve 50)`);
        return;
      }

      if (targetUser === username) {
        client.say(targetChannel, `@${displayName} You can't duel yourself!`);
        return;
      }

      if (amount > user.points) {
        client.say(targetChannel, `@${displayName} You don't have enough coins for that duel! (Balance: 🪙 ${user.points})`);
        return;
      }

      const targetUserData = getUser(targetUser);
      if (amount > targetUserData.points) {
        client.say(targetChannel, `@${displayName} @${targetUser} only has 🪙 ${targetUserData.points} coins!`);
        return;
      }

      activeDuels.set(targetUser, {
        challenger: username,
        challengerName: displayName,
        amount,
        expiresAt: Date.now() + 60000
      });

      client.say(targetChannel, `⚔️ DUEL CHALLENGE: @${displayName} challenged @${targetUser} to a 🪙 ${amount} coin duel! Type !accept within 60s!`);
      return;
    }

    if (cmd === '!accept') {
      const duel = activeDuels.get(username);
      if (!duel) {
        client.say(targetChannel, `@${displayName} You don't have any pending duel challenges!`);
        return;
      }

      if (Date.now() > duel.expiresAt) {
        activeDuels.delete(username);
        client.say(targetChannel, `@${displayName} That duel challenge expired!`);
        return;
      }

      const challengerUser = getUser(duel.challenger);
      if (challengerUser.points < duel.amount || user.points < duel.amount) {
        activeDuels.delete(username);
        client.say(targetChannel, `@${displayName} One of the players no longer has enough coins! Duel cancelled.`);
        return;
      }

      activeDuels.delete(username);
      const challengerWon = Math.random() < 0.5;

      if (challengerWon) {
        challengerUser.points += duel.amount;
        user.points -= duel.amount;
        saveUsers();
        client.say(targetChannel, `⚔️ DUEL FINISH: @${duel.challengerName} defeated @${displayName} and took 🪙 ${duel.amount} KryloCoins! 🏆`);
      } else {
        user.points += duel.amount;
        challengerUser.points -= duel.amount;
        saveUsers();
        client.say(targetChannel, `⚔️ DUEL FINISH: @${displayName} defeated @${duel.challengerName} and took 🪙 ${duel.amount} KryloCoins! 🏆`);
      }
      return;
    }

    // 6. Group Vault Heist
    if (cmd === '!heist') {
      const amount = parseInt(args[1]) || 50;
      if (user.points < amount) {
        client.say(targetChannel, `@${displayName} You need at least 🪙 ${amount} coins to join the vault heist!`);
        return;
      }

      if (!activeHeist.inProgress) {
        activeHeist.inProgress = true;
        activeHeist.participants.clear();
        activeHeist.participants.set(username, { name: displayName, amount });

        client.say(targetChannel, `🚨 HEIST STARTED by @${displayName}! A bank heist is assembling! Type "!heist <amount>" in the next 45 seconds to join the crew!`);

        activeHeist.timer = setTimeout(() => {
          executeHeist(targetChannel, client);
        }, 45000);
      } else {
        activeHeist.participants.set(username, { name: displayName, amount });
        client.say(targetChannel, `💼 @${displayName} joined the heist with 🪙 ${amount} coins! (${activeHeist.participants.size} crew members ready)`);
      }
      return;
    }

    // 7. Trivia Game
    if (cmd === '!trivia') {
      if (activeTrivia && activeTrivia.active) {
        client.say(targetChannel, `❓ A trivia question is already active: "${activeTrivia.question}"`);
        return;
      }
      const randomQ = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
      activeTrivia = {
        question: randomQ.q,
        answer: randomQ.a.toLowerCase(),
        reward: 50,
        active: true
      };
      client.say(targetChannel, `🧠 TRIVIA TIME (Reward: 🪙 50 coins): ${randomQ.q} — Type the answer in chat!`);
      return;
    }

    // 8. Leaderboard
    if (cmd === '!leaderboard' || cmd === '!top') {
      const sorted = Object.values(users).sort((a, b) => b.points - a.points).slice(0, 5);
      const board = sorted.map((u, i) => `#${i + 1} ${u.username} (🪙${u.points})`).join(' | ');
      client.say(targetChannel, `🏆 TOP CHATTERS: ${board || 'No stats yet!'}`);
      return;
    }

    // 9. Interactive Fun Commands
    if (cmd === '!hug') {
      const target = args[1] ? args[1] : 'everyone';
      client.say(targetChannel, `🤗 @${displayName} gives a big cozy hug to ${target}! ❤️`);
      return;
    }

    if (cmd === '!coinflip') {
      const res = Math.random() < 0.5 ? '🪙 HEADS' : '🪙 TAILS';
      client.say(targetChannel, `@${displayName} flipped a coin: ${res}!`);
      return;
    }

    if (cmd === '!ratebuild') {
      const desc = args.slice(1).join(' ') || 'this build';
      const score = Math.floor(Math.random() * 5) + 6; // 6 to 10
      const remarks = ['Absolute masterpiece!', 'Clean detailing!', 'Solid survival starter!', 'Skybase approved!', 'Director Krylo would love this!'];
      const remark = remarks[Math.floor(Math.random() * remarks.length)];
      client.say(targetChannel, `🏗️ Krims Code rates "${desc}": ${score}/10! — ${remark}`);
      return;
    }

    if (cmd === '!commands' || cmd === '!help') {
      client.say(targetChannel, `🎮 KRIMS CODE COMMANDS: !join, !leave, !points, !daily, !gamble <amt>, !duel @user <amt>, !heist <amt>, !trivia, !leaderboard, !ratebuild, !ask <question>`);
      return;
    }
  });

  try {
    await client.connect();
    return client;
  } catch (err) {
    console.error('[TwitchBot] Connection error:', err.message);
    return null;
  }
}

function getTier(points) {
  if (points >= 2000) return '👑 Skybase Legend';
  if (points >= 1000) return '🥇 Gold VIP';
  if (points >= 500) return '🥈 Silver Regular';
  return '🥉 Bronze Chatter';
}

function executeHeist(targetChannel, client) {
  const crew = Array.from(activeHeist.participants.values());
  activeHeist.inProgress = false;
  activeHeist.participants.clear();

  if (crew.length === 0) return;

  // Chance of success scales from 50% up to 80% with more crew
  const successRate = Math.min(0.85, 0.50 + (crew.length * 0.05));
  const success = Math.random() < successRate;

  if (success) {
    let summary = [];
    for (const member of crew) {
      const u = getUser(member.name);
      const won = Math.floor(member.amount * 1.5);
      u.points += won;
      summary.push(`@${member.name} (+🪙${won})`);
    }
    saveUsers();
    client.say(targetChannel, `🚨 HEIST SUCCESS! The crew cracked the vault! Payouts: ${summary.join(', ')} 🎉💰`);
  } else {
    for (const member of crew) {
      const u = getUser(member.name);
      u.points = Math.max(0, u.points - member.amount);
    }
    saveUsers();
    client.say(targetChannel, `🚨 HEIST BUSTED! The vault guards caught the crew! All ${crew.length} members lost their entry fee. Better luck next time! 🚔`);
  }
}
