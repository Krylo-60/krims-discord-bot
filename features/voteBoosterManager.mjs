import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const VOTE_DB_PATH = path.resolve(__dirname, '../data/vote_boosters.json');

// Ensure data directory exists
const dataDir = path.dirname(VOTE_DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// In-memory vote store
let voteDb = {};

function loadVoteDb() {
  try {
    if (fs.existsSync(VOTE_DB_PATH)) {
      voteDb = JSON.parse(fs.readFileSync(VOTE_DB_PATH, 'utf-8'));
    }
  } catch (err) {
    console.warn('[VoteBoosterManager] Error loading vote db, starting fresh:', err.message);
    voteDb = {};
  }
}

function saveVoteDb() {
  try {
    fs.writeFileSync(VOTE_DB_PATH, JSON.stringify(voteDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('[VoteBoosterManager] Error saving vote db:', err.message);
  }
}

loadVoteDb();

/**
 * Checks if a user has an active Vote Booster
 */
export function hasActiveVoteBooster(userId) {
  if (!userId) return false;
  const userVote = voteDb[userId];
  if (!userVote || !userVote.boosterExpiresAt) return false;
  return Date.now() < userVote.boosterExpiresAt;
}

/**
 * Returns current XP multiplier for user (default 1.0, 2.0 if vote booster active)
 */
export function getVoteMultiplier(userId) {
  if (hasActiveVoteBooster(userId)) {
    return voteDb[userId].multiplier || 2.0;
  }
  return 1.0;
}

/**
 * Gets detailed booster telemetry for a user
 */
export function getVoteBoosterInfo(userId) {
  const userVote = voteDb[userId] || {
    userId,
    lastVotedAt: 0,
    boosterExpiresAt: 0,
    multiplier: 1.0,
    streak: 0,
    totalVotes: 0
  };

  const now = Date.now();
  const isActive = now < userVote.boosterExpiresAt;
  const remainingMs = Math.max(0, userVote.boosterExpiresAt - now);

  // Formatted duration string
  let remainingFormatted = '0m';
  if (isActive) {
    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    remainingFormatted = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  // Top.gg allows voting every 12 hours (43,200,000 ms)
  const VOTE_COOLDOWN_MS = 12 * 60 * 60 * 1000;
  const nextVoteMs = Math.max(0, (userVote.lastVotedAt + VOTE_COOLDOWN_MS) - now);
  const canVoteAgain = nextVoteMs <= 0;

  return {
    isActive,
    multiplier: isActive ? (userVote.multiplier || 2.0) : 1.0,
    remainingMs,
    remainingFormatted,
    streak: userVote.streak || 0,
    totalVotes: userVote.totalVotes || 0,
    lastVotedAt: userVote.lastVotedAt,
    canVoteAgain,
    nextVoteMs
  };
}

/**
 * Records an official vote for a user and activates their 2x XP booster
 */
export async function recordUserVote(userId, options = {}) {
  const { isWeekend = false, client = null, source = 'Top.gg' } = options;
  const now = Date.now();

  if (!voteDb[userId]) {
    voteDb[userId] = {
      userId,
      lastVotedAt: 0,
      boosterExpiresAt: 0,
      multiplier: 2.0,
      streak: 0,
      totalVotes: 0
    };
  }

  const record = voteDb[userId];
  
  // Calculate streak (within 36h counts as continuous streak since voting is every 12h)
  const STREAK_WINDOW_MS = 36 * 60 * 60 * 1000;
  if (record.lastVotedAt > 0 && (now - record.lastVotedAt) <= STREAK_WINDOW_MS) {
    record.streak = (record.streak || 0) + 1;
  } else {
    record.streak = 1;
  }

  record.totalVotes = (record.totalVotes || 0) + 1;
  record.lastVotedAt = now;
  // Booster lasts 12 Hours (or 24 Hours on weekends)
  const boosterDurationMs = isWeekend ? (24 * 60 * 60 * 1000) : (12 * 60 * 60 * 1000);
  record.boosterExpiresAt = now + boosterDurationMs;
  record.multiplier = 2.0;

  saveVoteDb();

  // Economy rewards: base 1,000 KC + 100 per streak point (capped at +500)
  const baseReward = 1000;
  const streakBonus = Math.min((record.streak - 1) * 100, 500);
  const totalCoins = baseReward + streakBonus;

  console.log(`[VoteBoosterEngine] Vote recorded for ${userId}! Streak: ${record.streak}, Multiplier: 2.0x, Coins: +${totalCoins}`);

  // Send Direct Message Notification to Voter
  if (client) {
    try {
      const user = await client.users.fetch(userId);
      if (user) {
        const dmEmbed = new EmbedBuilder()
          .setColor(0x00E5FF)
          .setTitle('⚡ 2X XP VOTE BOOSTER ACTIVATED!')
          .setDescription(
            `Thank you for voting for **Krims Code AI** on **${source}**! 🚀\n\n` +
            `**🎁 Your Vote Rewards Have Been Applied:**\n` +
            `• ⚡ **2.0x XP Multiplier:** Active for the next **${isWeekend ? '24' : '12'} Hours** across all chat & voice channels!\n` +
            `• 💰 **KryloCoins:** **+${totalCoins.toLocaleString()} KC** (Includes +${streakBonus} streak bonus)\n` +
            `• 💎 **Rare Diamonds:** **+5 Diamonds** added to your vault\n` +
            `• 📦 **Mystery Vote Crate:** Claimable via \`/lootbox\`\n` +
            `• 🔥 **Vote Streak:** **${record.streak} in a row** (Vote again in 12h to continue!)\n\n` +
            `*Check your active multiplier anytime using \`/rank\` or \`/vote\`!*`
          )
          .setFooter({ text: 'Krims Code AI • Vote Multiplier Engine' })
          .setTimestamp();

        await user.send({ embeds: [dmEmbed] }).catch(() => {});
      }
    } catch (e) {
      console.warn(`[VoteBoosterEngine] Could not DM user ${userId}:`, e.message);
    }
  }

  return {
    success: true,
    multiplier: record.multiplier,
    streak: record.streak,
    totalCoins,
    boosterExpiresAt: record.boosterExpiresAt
  };
}

/**
 * Interactive /vote Slash Command Handler
 */
export async function handleVoteCommand(interaction) {
  const userId = interaction.user.id;
  const info = getVoteBoosterInfo(userId);

  const voteUrl = 'https://top.gg/bot/1523794466740371586/vote';

  const embed = new EmbedBuilder()
    .setColor(info.isActive ? 0x00E5FF : 0xF59E0B)
    .setTitle('🗳️ Krims Code AI — Vote Booster & Rewards')
    .setDescription(
      `Support **Krims Code AI** by voting to unlock instant game rewards and power up your server progression!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### ⚡ YOUR ACTIVE VOTE STATUS:\n` +
      `• **Vote Booster:** ${info.isActive ? `🟢 **ACTIVE — 2.0x XP** (Ends in \`${info.remainingFormatted}\`)` : `🔴 **INACTIVE** (Vote now to activate 2.0x XP!)`}\n` +
      `• **Vote Streak:** 🔥 **${info.streak} ${info.streak === 1 ? 'Vote' : 'Votes'} in a row**\n` +
      `• **Lifetime Votes:** 🏆 **${info.totalVotes} Total**\n` +
      `• **Next Vote Available:** ${info.canVoteAgain ? `✅ **Available Right Now!**` : `⏳ In \`${Math.ceil(info.nextVoteMs / 60000)} minutes\``}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🎁 VOTER REWARDS (Every 12 Hours):\n` +
      `• ⚡ **2x Chat & Voice XP Multiplier** for 12 Hours\n` +
      `• 💰 **+1,000 KryloCoins** (plus streak bonuses)\n` +
      `• 💎 **+5 Rare Mining Diamonds**\n` +
      `• 📦 **+1 Vote Mystery Crate**\n` +
      `• ⭐ **Exclusive Voter Badge** on your \`/rank\` card!`
    )
    .setFooter({ text: 'Votes reset every 12 hours • Double vote weekends active!' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🗳️ Vote on Top.gg (Get 2x XP)')
      .setStyle(ButtonStyle.Link)
      .setURL(voteUrl),
    new ButtonBuilder()
      .setCustomId('btn_refresh_vote_status')
      .setLabel('🔄 Refresh Status')
      .setStyle(ButtonStyle.Secondary)
  );

  return await interaction.reply({ embeds: [embed], components: [row] });
}

/**
 * Top.gg Webhook Endpoint Handler
 * Receives incoming POST webhook requests when users vote
 */
export async function handleTopggWebhook(req, res, client) {
  // 1. Support GET requests (when opened in a browser or pinged by healthcheck)
  if (req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      service: 'Krims Code AI Vote Booster Engine',
      endpoint: '/api/topgg/webhook',
      supportedMethods: ['GET', 'POST'],
      message: 'Top.gg Webhook Endpoint is operational and ready to receive vote notifications!'
    }, null, 2));
    return;
  }

  const authHeader = req.headers['authorization'];
  const expectedAuth = process.env.TOPGG_WEBHOOK_AUTH || process.env.TOPGG_AUTH;

  // Verify webhook authorization token if configured
  if (expectedAuth && authHeader !== expectedAuth) {
    console.warn('[TopggWebhook] Unauthorized webhook request rejected');
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized webhook' }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const payload = JSON.parse(body || '{}');
      const voterId = payload.user;

      // Top.gg test ping or validation check
      if (!voterId || payload.type === 'test') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          message: 'Top.gg webhook test ping received successfully! Endpoint is active.'
        }));
        return;
      }

      console.log(`[TopggWebhook] Received vote notification for user: ${voterId} (Weekend: ${payload.isWeekend})`);

      const result = await recordUserVote(voterId, {
        isWeekend: payload.isWeekend || false,
        client,
        source: 'Top.gg'
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ 
        success: true, 
        message: 'Vote booster activated successfully',
        voter: voterId,
        multiplier: result.multiplier,
        streak: result.streak
      }));
    } catch (err) {
      console.error('[TopggWebhook Error]:', err.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal server error processing vote' }));
    }
  });
}
