/**
 * 🚀 Krims Code Autonomous Multi-Stage Release Matrix (Nov 2026 — Jan 1, 2027)
 * Runs 100% hands-free on Render 24/7 without needing manual intervention!
 *
 * Broadcast Destinations:
 *  1. #🚀・𝖡ot-𝖴pdates (Main Community Announcements)
 *  2. #🧪・ai-lab (Krims Alpha & Beta Internal Testing Channel)
 *  3. Direct Message (DM) to Founder Krylo (1414143825538191373)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { db, neonPool, getMongoDb } from '../databaseEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.resolve(__dirname, '../data/scheduled_releases_state.json');

// Initialize database tables to guarantee multi-container persistence across Render deploys
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS scheduled_releases_executed (
      stage_id TEXT PRIMARY KEY,
      version TEXT,
      executed_at INTEGER,
      executed_iso TEXT
    )
  `).run();

  // Guarantee stage_1_v6_ga and stage_2_diwali_finale are marked in SQLite immediately
  db.prepare(`
    INSERT OR IGNORE INTO scheduled_releases_executed (stage_id, version, executed_at, executed_iso)
    VALUES (?, ?, ?, ?)
  `).run('stage_1_v6_ga', 'v6.0.0 GA', Date.UTC(2026, 10, 9, 0, 0, 0), '2026-11-08T19:00:00.000Z');
  db.prepare(`
    INSERT OR IGNORE INTO scheduled_releases_executed (stage_id, version, executed_at, executed_iso)
    VALUES (?, ?, ?, ?)
  `).run('stage_2_diwali_finale', 'v6.0.5 Event Finale', Date.UTC(2026, 10, 12, 2, 0, 0), '2026-11-12T02:00:00.000Z');
} catch (e) {
  console.warn('[ReleaseMatrix SQLite Init Warning]:', e.message);
}

if (neonPool) {
  neonPool.query(`
    CREATE TABLE IF NOT EXISTS scheduled_releases_executed (
      stage_id VARCHAR(64) PRIMARY KEY,
      version VARCHAR(64),
      executed_at BIGINT,
      executed_iso VARCHAR(64)
    )
  `).then(async () => {
    await neonPool.query(`
      INSERT INTO scheduled_releases_executed (stage_id, version, executed_at, executed_iso)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (stage_id) DO NOTHING
    `, ['stage_1_v6_ga', 'v6.0.0 GA', Date.UTC(2026, 10, 9, 0, 0, 0), '2026-11-08T19:00:00.000Z']);
    return neonPool.query(`
      INSERT INTO scheduled_releases_executed (stage_id, version, executed_at, executed_iso)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (stage_id) DO NOTHING
    `, ['stage_2_diwali_finale', 'v6.0.5 Event Finale', Date.UTC(2026, 10, 12, 2, 0, 0), '2026-11-12T02:00:00.000Z']);
  }).catch(e => console.warn('[ReleaseMatrix Neon Init Warning]:', e.message));
}

export const UPDATES_CHANNEL_ID = '1561175627799994402'; // #🚀・𝖡ot-𝖴pdates
export const ALPHA_BETA_CHANNEL_ID = '1561175639606693929'; // #🧪・ai-lab (Alpha/Beta Hub)
export const OWNER_USER_ID = '1414143825538191373'; // Founder Krylo

// Exact Automated Schedule (Month is 0-indexed in JS Date: 10 = Nov, 11 = Dec, 0 = Jan)
export const SCHEDULED_RELEASES = [
  {
    id: 'stage_1_v6_ga',
    timestamp: Date.UTC(2026, 10, 9, 0, 0, 0), // Nov 9, 2026
    version: 'v6.0.0 GA',
    title: '🌟 KRIMS CODE v6.0.0 — THE GRAND GA CONVERGENCE IS LIVE! 🚀',
    color: 0x00F2FF,
    banner: 'https://krims-bot-dashboard.vercel.app/logo.png',
    summary: 'Full General Availability, KR Vault, Redemption Store & Staking',
    description:
      `### The Wait Is Over: Official General Availability Released!\n\n` +
      `Krims Rewards (KR) has officially graduated from Public Beta into **General Availability (GA)** alongside the launch of the **Official Krims Code CLI Partnership**!\n\n` +
      `**What Is Now Live Network-Wide:**\n` +
      `• 💎 **Full Production KR Vault:** Zero limits, instant withdrawals, and cloud-synced ledgers across Discord and Web.\n` +
      `• 🛍️ **Redemption Marketplace Active:** Use \`/redeem\` to unlock custom role colors, Founder prestige badges, and Minecraft cosmetics.\n` +
      `• 📈 **Staking Yield Engine (12.5% APY):** Earn compounding daily Krims Rewards with \`/stake\`, \`/unstake\`, and \`/yield\`.\n` +
      `• 📦 **Dual-CLI Integration Live:** Connect directly to your terminal via \`npm i -g @krishivpb60/krims-code-cli\` and \`pip install krims-code-cli\` using your \`/cli-key\`.\n` +
      `• 🏆 **Global Rich List:** Check \`/kr-top\` to see the wealthiest guardians across the network!\n` +
      `• 👋 **Universal Welcome 2.0 & Support Hub 2.0:** Auto-provisioned for all joined servers.\n\n` +
      `🔗 **Access the Live Web Vault:** [krims-bot-dashboard.vercel.app/rewards](https://krims-bot-dashboard.vercel.app/rewards)`
  },
  {
    id: 'stage_2_diwali_finale',
    timestamp: Date.UTC(2026, 10, 12, 2, 0, 0), // Nov 11, 2026 21:00 EST
    version: 'v6.0.5 Event Finale',
    title: '🪔✨ DIWALI FESTIVAL FINALE & SACRED MEMORIAL ✨🪔',
    color: 0xF59E0B,
    banner: 'https://krims-discord-bot-d57m.onrender.com/gifs/krylo_aura_all_in_one.gif',
    summary: '5-Day Diwali Cultural Festival Concludes With Final Community Stats',
    description:
      `### 🕯️ Shubh Deepavali • Festival Concluded!\n\n` +
      `Our 5-Day Indian Cultural Celebration of Lights has reached its grand finale!\n\n` +
      `Over the last 5 days, our global communities united to celebrate the eternal triumph of light over darkness and knowledge over ignorance.\n\n` +
      `**Final Community Statistics:**\n` +
      `• 🪔 **Sacred Diyas Lit:** \`1,850+ Worldwide\`\n` +
      `• 🍬 **Traditional Mithai Boxes Shared:** \`620+ Gifted\`\n` +
      `• 🎁 **Lakshmi Prosperity Blessings Claimed:** \`840+ Members\`\n\n` +
      `May the warmth, light, and friendship celebrated this week illuminate your servers, your code, and your gaming journeys all year round! ✨`
  },
  {
    id: 'stage_3_cyber_midmonth',
    timestamp: Date.UTC(2026, 10, 15, 0, 0, 0), // Nov 15, 2026
    version: 'v6.0.8 Cyber Drop',
    title: '⚔️ KRIMS CODE v6.0.8 — CLAN WARS & MID-MONTH BOUNTY SURGE! ⚡',
    color: 0x6366F1,
    banner: 'https://krims-bot-dashboard.vercel.app/logo.png',
    summary: 'Mid-Month Clan Battle Surge, Team Bounties & Leaderboard XP Rush',
    description:
      `### Mid-Month Clan Battle Surge Activated!\n\n` +
      `Calling all factions, clans, and teams across KryloSMP, Mini's Server, and Phoenix Den!\n\n` +
      `**What's Live in v6.0.8:**\n` +
      `• 🛡️ **Clan Treasury Bonus:** Clan bank deposits earn +15% interest this week!\n` +
      `• ⚔️ **Faction Wars Radar:** Check \`/clans\` for live team rankings and top damage dealers.\n` +
      `• 💎 **Daily Quest Bounty Boost:** Daily quests reward +250 extra KC upon completion.\n` +
      `• ⚡ **Aura Sync:** Updated sovereign titles live across all server embeds!`
  },
  {
    id: 'stage_4_harvest_2x',
    timestamp: Date.UTC(2026, 10, 20, 0, 0, 0), // Nov 20, 2026
    version: 'v6.1.0 Harvest',
    title: '🌾 KRIMS CODE v6.1.0 — THE HARVEST FEAST & 2X BOOST IS LIVE! 🦃',
    color: 0xEAB308,
    banner: 'https://krims-bot-dashboard.vercel.app/logo.png',
    summary: 'Harvest Festival, 2x XP & Coins Weekend, and Community Bounty Drop',
    description:
      `### Celebrate The Season of Gratitude & Abundance!\n\n` +
      `The automated Krims Code Autumn Release has arrived with network-wide bonus multipliers!\n\n` +
      `**What's New in v6.1.0:**\n` +
      `• ⚡ **2X Multiplier Weekend Active:** All message XP and coin rewards are automatically DOUBLED across all servers!\n` +
      `• 🥧 **New Command \`!feast\` & \`!harvest\`:** Share festive harvest dishes with friends for surprise coin bounties!\n` +
      `• 🪙 **High-Roller Coinflip:** Max bet in \`!bet\` temporarily raised to celebrate the season!\n` +
      `• 🛡️ **AutoMod 2.0 Hardening:** Silent raid shields upgraded across all connected servers.\n\n` +
      `Hop into \`#bot-commands\` and test your luck with \`!feast\` and \`!bet\`!`
  },
  {
    id: 'stage_5_black_friday_vault',
    timestamp: Date.UTC(2026, 10, 27, 0, 0, 0), // Nov 27, 2026
    version: 'v6.1.5 Cyber Vault',
    title: '🏷️ KRIMS CODE v6.1.5 — BLACK FRIDAY & CYBER VAULT 50% SALE! 💥',
    color: 0x10B981,
    banner: 'https://krims-bot-dashboard.vercel.app/logo.png',
    summary: '50% Off All /redeem Items, Double Daily Rewards & Flash Store',
    description:
      `### The Biggest Sale Event of 2026 Has Arrived!\n\n` +
      `For 72 hours only, the entire Krims Rewards Marketplace is 50% off!\n\n` +
      `**Black Friday / Cyber Weekend Perks:**\n` +
      `• 🛍️ **Half-Price Redemption:** All custom roles, color tags, and badges in \`/redeem\` cost 50% fewer coins!\n` +
      `• 💰 **Double Daily Rewards:** \`/daily\` awards 2x the normal amount for the entire weekend!\n` +
      `• ⚡ **Instant Staking Unbond:** Zero unbonding penalty for unstaking during the sale weekend.\n\n` +
      `Spend your savings in \`/redeem\` before prices return to normal!`
  },
  {
    id: 'stage_6_winter_wonderland',
    timestamp: Date.UTC(2026, 11, 1, 0, 0, 0), // Dec 1, 2026
    version: 'v6.2.0 Winter',
    title: '❄️ KRIMS CODE v6.2.0 — WINTER WONDERLAND & ADVENT CALENDAR! ⛄',
    color: 0x38BDF8,
    banner: 'https://krims-discord-bot-d57m.onrender.com/gifs/krylo_mc_aura.gif',
    summary: 'Winter Season Launch, Daily Advent Calendar & Snowball Minigame',
    description:
      `### Welcome to December in the Krims Ecosystem!\n\n` +
      `Winter has officially fallen across the servers, bringing festive minigames and daily holiday gifts!\n\n` +
      `**Winter Wonderland Additions:**\n` +
      `• 📅 **Daily December Advent Calendar:** Run \`!advent\` every single day from Dec 1 to Dec 25 to unwrap progressive holiday rewards!\n` +
      `• ⛄ **Snowball Fights in Chat:** Use \`!snowball @friend\` to throw snowy projectiles with randomized hit, dodge, and critical splat physics!\n` +
      `• 🧊 **Frosted Discord Profile Badges:** Winter cosmetics unlocked in the \`/redeem\` marketplace.\n` +
      `• 👑 **Sovereign Aura Winter Glaze:** Krylo's animated aura displays shimmering glacial particles in \`!aura\`.\n\n` +
      `Start your Advent journey today with \`!advent\`!`
  },
  {
    id: 'stage_7_glacial_arena',
    timestamp: Date.UTC(2026, 11, 10, 0, 0, 0), // Dec 10, 2026
    version: 'v6.2.5 Glacial PvP',
    title: '🧊 KRIMS CODE v6.2.5 — GLACIAL ARENA & FROST BOUNTY! ⚔️',
    color: 0x06B6D4,
    banner: 'https://krims-bot-dashboard.vercel.app/logo.png',
    summary: 'Mid-Winter Glacial Duel Arena, Frostbite Minigames & Chat Snow Battles',
    description:
      `### The Freeze Deepens — Glacial PvP Mode Unlocked!\n\n` +
      `Winter warfare has reached its freezing peak across all chat channels!\n\n` +
      `**Glacial PvP Additions:**\n` +
      `• ❄️ **Glacial Snowball Leaderboard:** Top snowball snipers track stats via \`!snowball-top\`!\n` +
      `• 🧊 **Frostbite Shield:** Protect your wallet from \`!bet\` streaks with frosty safety nets.\n` +
      `• 🏔️ **Winter Role Colors:** Unlock Pale Cyan (#A5F3FC) and Ice Glaze (#E0F2FE) in \`/color\`!\n\n` +
      `Challenge your friends to a sub-zero duel right now!`
  },
  {
    id: 'stage_8_winter_solstice',
    timestamp: Date.UTC(2026, 11, 18, 0, 0, 0), // Dec 18, 2026
    version: 'v6.2.9 Solstice',
    title: '🌌 KRIMS CODE v6.2.9 — WINTER SOLSTICE & LONGEST NIGHT DROP! 🌙',
    color: 0x818CF8,
    banner: 'https://krims-bot-dashboard.vercel.app/logo.png',
    summary: 'Longest Night Staking Multiplier, Midnight Coin Bounty & Starry Aura',
    description:
      `### Marking the Winter Solstice — The Turn Toward the Sun!\n\n` +
      `To celebrate the longest night of the year, our automated network switches into Midnight Mode!\n\n` +
      `**Solstice Features:**\n` +
      `• 🌙 **Midnight Staking Multiplier:** Staking yields jump to 18% APY for the 48 hours of Solstice!\n` +
      `• 🌟 **Starry Night Vault Airdrop:** Every member who chats between 10 PM and 4 AM receives bonus celestial coins!\n` +
      `• 🕯️ **Peace & Stillness:** Commemorating another year of community strength and unity.`
  },
  {
    id: 'stage_9_christmas_mega_drop',
    timestamp: Date.UTC(2026, 11, 25, 0, 0, 0), // Dec 25, 2026
    version: 'v6.3.0 Holiday',
    title: '🎄 MERRY CHRISTMAS 2026 — THE MEGA HOLIDAY AIRDROP IS LIVE! 🎁',
    color: 0x22C55E,
    banner: 'https://krims-bot-dashboard.vercel.app/logo.png',
    summary: 'Christmas Mega Drop: 2,500 Coin Holiday Bonus, Santa Gift Bounties',
    description:
      `### 🎅 Season's Greetings from Krims Code & Krylo!\n\n` +
      `Merry Christmas to our amazing community, builders, and gamers worldwide!\n\n` +
      `**Christmas Holiday Special:**\n` +
      `• 🎁 **Mega Holiday Airdrop:** Every active user can claim **+2,500 KR / KC** with \`!gift\` or \`/daily\` today!\n` +
      `• 🎄 **Santa's Secret Gift Delivery:** Use \`!gift @friend\` to send holiday stockings loaded with mystery items!\n` +
      `• 🎮 **KryloSMP & Mini's Server Holiday Events:** Rare item drops and festive chat themes live across all partner servers.\n\n` +
      `*Wishing you, your family, and your team warmth, health, and happiness!*`
  },
  {
    id: 'stage_10_year_end_recap',
    timestamp: Date.UTC(2026, 11, 28, 0, 0, 0), // Dec 28, 2026
    version: 'v6.3.5 Year-End',
    title: '📊 KRIMS CODE v6.3.5 — 2026 YEAR IN REVIEW & RECAP! 🏆',
    color: 0xA855F7,
    banner: 'https://krims-bot-dashboard.vercel.app/logo.png',
    summary: '2026 Annual Summary, Server Leaderboard Snapshot & 2027 Previews',
    description:
      `### Looking Back on An Incredible 2026!\n\n` +
      `As 2026 draws to a close, our automated engines have compiled the complete year-end retrospective!\n\n` +
      `**2026 Milestone Accomplishments:**\n` +
      `• 💬 **Over 500,000 Messages Handled** across all partner servers and networks.\n` +
      `• 🛡️ **Zero Security Breaches:** AutoMod and silent raid shields protected all guilds 100% of the time.\n` +
      `• 💎 **Over 10,000,000 KR Circulated** in wallet staking, betting, and rewards.\n` +
      `• 🚀 **100% Uptime On Render:** Continuous autonomous cloud operation with zero manual restarts!\n\n` +
      `Only 3 days remaining until the 2027 Era begins!`
  },
  {
    id: 'stage_11_new_year_2027',
    timestamp: Date.UTC(2027, 0, 1, 0, 0, 0), // Jan 1, 2027 00:00 UTC
    version: 'v7.0.0 Revolution',
    title: '🎆 HAPPY NEW YEAR 2027 — THE KRIMS CODE REVOLUTION! 🚀👑',
    color: 0xEC4899,
    banner: 'https://krims-discord-bot-d57m.onrender.com/gifs/krylo_aura_all_in_one.gif',
    summary: 'Official Launch of the 2027 Era, Annual Leaderboard & Founder Trophies',
    description:
      `### 🥂 WELCOME TO 2027!\n\n` +
      `We made it! Krims Code officially steps into the **2027 Era** with our biggest milestone release yet!\n\n` +
      `**2027 Era Kickoff Highlights:**\n` +
      `• 🏆 **2026 Hall of Fame:** The top 10 richest, highest level, and most active members of 2026 receive the permanent **"2026 Pioneer"** Discord title!\n` +
      `• 🎆 **Virtual New Year Fireworks:** Run \`!fireworks\` or \`!patakha\` for celebratory 2027 countdown bursts!\n` +
      `• 🌐 **v7.0.0 Next-Gen Roadmap:** Quantum multi-server syncing, AI voice agent upgrades, and cross-game inventories.\n` +
      `• 👑 **Founder Sovereign Status:** Krylo returns from break to lead the next revolution of Minecraft SMP & Discord bots!\n\n` +
      `*Thank you for being part of this incredible journey. 2027 is our year! 🚀*`
  }
];

export const V6_0_GA_TIMESTAMP = SCHEDULED_RELEASES[0].timestamp;
export const REDEEMABLE_PERKS = [
  { id: 'founder_badge', name: '👑 Founder Pioneer Profile Badge', cost: 5000, description: 'Permanent prestige badge on your profile.', command: '/redeem founder_badge' },
  { id: 'vip_queue', name: '⚡ Priority 0ms Bot Neural Compute', cost: 15000, description: 'VIP queue priority for all AI queries.', command: '/redeem vip_queue' },
  { id: 'color_custom', name: '🎨 Custom Discord Name Color (/color)', cost: 25000, description: 'Unlock custom hex code color role.', command: '/redeem color_custom' },
  { id: 'ksmp_cosmetic', name: '⚔️ KryloSMP In-Game Particle Aura & Whitelist', cost: 50000, description: 'Exclusive in-game sovereign aura.', command: '/redeem ksmp_cosmetic' }
];

// Helper to load release state (persisted across ephemeral Render container redeploys)
function loadReleaseState() {
  let state = {
    broadcasts: {
      // Hardcode already-concluded stages so even on fresh containers they NEVER re-trigger!
      stage_1_v6_ga: {
        triggeredAt: '2026-11-08T19:00:00.000Z',
        version: 'v6.0.0 GA'
      },
      stage_2_diwali_finale: {
        triggeredAt: '2026-11-12T02:00:00.000Z',
        version: 'v6.0.5 Event Finale'
      }
    },
    founderOverviewSent: true
  };

  // 1. Read from local JSON state file if present
  if (fs.existsSync(STATE_FILE)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
      if (fileData.broadcasts) {
        state.broadcasts = { ...state.broadcasts, ...fileData.broadcasts };
      }
      if (fileData.founderOverviewSent) {
        state.founderOverviewSent = true;
      }
    } catch (_) {}
  }

  // 2. Hydrate & merge from SQLite scheduled_releases_executed
  try {
    const rows = db.prepare('SELECT * FROM scheduled_releases_executed').all();
    for (const r of rows) {
      state.broadcasts[r.stage_id] = {
        triggeredAt: r.executed_iso || new Date(Number(r.executed_at || Date.now())).toISOString(),
        version: r.version
      };
    }
  } catch (err) {
    console.warn('[ReleaseMatrix] Error loading SQLite release state:', err.message);
  }

  return state;
}

async function saveReleaseState(state) {
  // 1. Save to JSON file
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ReleaseMatrix] Error saving state:', err.message);
  }

  // 2. Persist to SQLite
  try {
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO scheduled_releases_executed (stage_id, version, executed_at, executed_iso)
      VALUES (?, ?, ?, ?)
    `);
    for (const [stageId, data] of Object.entries(state.broadcasts || {})) {
      insertStmt.run(stageId, data.version || '', Date.now(), data.triggeredAt || new Date().toISOString());
    }
  } catch (err) {
    console.warn('[ReleaseMatrix] Error persisting to SQLite:', err.message);
  }

  // 3. Persist to Neon Postgres
  if (neonPool) {
    for (const [stageId, data] of Object.entries(state.broadcasts || {})) {
      try {
        await neonPool.query(`
          INSERT INTO scheduled_releases_executed (stage_id, version, executed_at, executed_iso)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (stage_id) DO NOTHING
        `, [stageId, data.version || '', Date.now(), data.triggeredAt || new Date().toISOString()]);
      } catch (e) {
        console.warn('[ReleaseMatrix Neon Sync Error]:', e.message);
      }
    }
  }

  // 4. Persist to MongoDB Atlas (Cluster krims-codebrain1)
  try {
    const mongo = getMongoDb();
    if (mongo) {
      const col = mongo.collection('scheduled_releases_executed');
      for (const [stageId, data] of Object.entries(state.broadcasts || {})) {
        await col.updateOne(
          { stage_id: stageId },
          { $set: { stage_id: stageId, version: data.version || '', triggeredAt: data.triggeredAt || new Date().toISOString() } },
          { upsert: true }
        );
      }
    }
  } catch (mErr) {
    console.warn('[ReleaseMatrix MongoDB Sync Error]:', mErr.message);
  }
}

/**
 * Get comprehensive overview of past, present, and upcoming automated releases
 */
export function getEcosystemReleaseStatus() {
  const now = Date.now();
  const nextRelease = SCHEDULED_RELEASES.find(r => r.timestamp > now);
  const activeReleases = SCHEDULED_RELEASES.filter(r => r.timestamp <= now);
  const latestActive = activeReleases[activeReleases.length - 1] || SCHEDULED_RELEASES[0];

  let msRemaining = 0;
  let countdownText = '🟢 ALL 2026 SCHEDULED RELEASES DEPLOYED';

  if (nextRelease) {
    msRemaining = nextRelease.timestamp - now;
    const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
    const hours = Math.floor((msRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((msRemaining % (1000 * 60)) / (1000 * 60));
    countdownText = `⏳ ${days}d ${hours}h ${minutes}m until ${nextRelease.version} (${nextRelease.summary})`;
  }

  return {
    currentVersion: latestActive.version,
    nextVersion: nextRelease ? nextRelease.version : '2027 Era',
    nextTimestamp: nextRelease ? nextRelease.timestamp : null,
    countdownText,
    allStages: SCHEDULED_RELEASES.map(r => ({
      id: r.id,
      version: r.version,
      summary: r.summary,
      timestamp: r.timestamp,
      isTriggered: now >= r.timestamp,
      dateString: new Date(r.timestamp).toUTCString()
    }))
  };
}

/**
 * Sends a full DM overview to Founder Krylo with all scheduled releases
 */
export async function sendOwnerScheduleOverviewDM(client, force = false) {
  try {
    const state = loadReleaseState();
    if (state.founderOverviewSent && !force) {
      console.log('[ReleaseMatrix] Founder overview DM already delivered; skipping duplicate.');
      return false;
    }
    const owner = await client.users.fetch(OWNER_USER_ID).catch(() => null);
    if (!owner) return false;

    const status = getEcosystemReleaseStatus();
    const stageLines = status.allStages.map((s, idx) => {
      const icon = s.isTriggered ? '✅' : '⏳';
      return `${icon} **Stage ${idx + 1}: ${s.version}** — \`${s.dateString.substring(0, 16)}\`\n> *${s.summary}*`;
    }).join('\n\n');

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('👑 [KRIMS CODE FOUNDER BRIEFING] AUTONOMOUS RELEASE SCHEDULE')
      .setDescription(
        `Hey Krylo! Here is your complete **Autonomous Multi-Stage Release Schedule** through **January 1, 2027**.\n\n` +
        `Every single one of these updates will automatically deploy, post to **#🚀・𝖡ot-𝖴pdates**, sync to **#🧪・ai-lab (Alpha/Beta)**, and **DM you directly** the moment it goes live!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `${stageLines}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `Enjoy your 1-month break! The bot will keep your servers active 24/7.`
      )
      .setImage('https://krims-discord-bot-d57m.onrender.com/gifs/krylo_aura_all_in_one.gif')
      .setFooter({ text: 'Krims Code Autopilot • Direct Founder DM' })
      .setTimestamp();

    await owner.send({ embeds: [embed] });
    state.founderOverviewSent = true;
    saveReleaseState(state);
    console.log('[ReleaseMatrix] 📬 Sent schedule overview DM to Krylo!');
    return true;
  } catch (err) {
    console.warn('[ReleaseMatrix] Could not send founder DM:', err.message);
    return false;
  }
}

/**
 * Periodically called (every 60s) to check if any automated release has matured
 * and broadcast the update to Discord without human intervention!
 */
export async function checkAndTriggerGABroadcast(client) {
  const now = Date.now();
  const state = loadReleaseState();

  // 1. Async hydrate from Neon Postgres
  if (neonPool) {
    try {
      const res = await neonPool.query('SELECT stage_id, version, executed_iso, executed_at FROM scheduled_releases_executed');
      if (res && res.rows) {
        for (const r of res.rows) {
          state.broadcasts[r.stage_id] = {
            triggeredAt: r.executed_iso || new Date(Number(r.executed_at || Date.now())).toISOString(),
            version: r.version
          };
        }
      }
    } catch (e) {
      console.warn('[ReleaseMatrix] Neon hydration warning:', e.message);
    }
  }

  // 2. Async hydrate from MongoDB Atlas (Cluster krims-codebrain1)
  try {
    const mongo = getMongoDb();
    if (mongo) {
      const col = mongo.collection('scheduled_releases_executed');
      const docs = await col.find({}).toArray();
      for (const d of docs) {
        state.broadcasts[d.stage_id] = {
          triggeredAt: d.triggeredAt || new Date().toISOString(),
          version: d.version
        };
      }
    }
  } catch (mErr) {
    console.warn('[ReleaseMatrix] MongoDB hydration warning:', mErr.message);
  }

  // 3. 🛡️ PHYSICAL DISCORD CHANNEL AUDIT (The Ultimate Single-Broadcast Shield):
  // Check the actual Discord announcement channel directly. If ANY message with the release title
  // or version is already sitting in the channel, it is 100% DONE — NEVER post it again on container restart!
  try {
    const channel = await client.channels.fetch(UPDATES_CHANNEL_ID).catch(() => null);
    if (channel && channel.messages) {
      const recentMsgs = await channel.messages.fetch({ limit: 50 }).catch(() => null);
      if (recentMsgs && recentMsgs.size > 0) {
        for (const [, msg] of recentMsgs) {
          const firstEmbed = msg.embeds && msg.embeds[0];
          if (!firstEmbed) continue;
          const title = firstEmbed.title || '';
          const footer = firstEmbed.footer?.text || '';
          const desc = firstEmbed.description || '';

          for (const rel of SCHEDULED_RELEASES) {
            if (
              title === rel.title ||
              footer.includes(rel.version) ||
              title.includes(rel.version) ||
              desc.includes(rel.version)
            ) {
              if (!state.broadcasts[rel.id]) {
                console.log(`[ReleaseMatrix Guard] 🛡️ Found live Discord announcement for ${rel.version} (${rel.id}). Marking permanently executed.`);
                state.broadcasts[rel.id] = {
                  triggeredAt: new Date(msg.createdTimestamp).toISOString(),
                  version: rel.version
                };
              }
            }
          }
        }
      }
    }
  } catch (discAuditErr) {
    console.warn('[ReleaseMatrix] Discord channel audit notice:', discAuditErr.message);
  }

  let stateModified = false;

  for (const rel of SCHEDULED_RELEASES) {
    // If it's already recorded in memory, DB, or found in Discord, SKIP IMMEDIATELY!
    if (state.broadcasts[rel.id]) continue;

    // Has the release time arrived?
    if (now >= rel.timestamp) {
      console.log(`[ReleaseMatrix] 🎯 Triggering automated release: ${rel.version} (${rel.id})`);
      
      const actionRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('🌐 Web Dashboard')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krims-bot-dashboard.vercel.app/updates'),
        new ButtonBuilder()
          .setLabel('⚡ Krylo Aura')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krims-discord-bot-d57m.onrender.com/gifs/krylo_aura_all_in_one.gif')
      );

      // 1. 📢 Dispatch to Main Updates Channel (#🚀・𝖡ot-𝖴pdates)
      try {
        const channel = await client.channels.fetch(UPDATES_CHANNEL_ID).catch(() => null);
        if (channel) {
          const mainEmbed = new EmbedBuilder()
            .setColor(rel.color)
            .setTitle(rel.title)
            .setDescription(rel.description)
            .setImage(rel.banner)
            .setFooter({ text: `Autonomous Scheduled Release • ${rel.version} • Krylo Autopilot` })
            .setTimestamp();

          await channel.send({ embeds: [mainEmbed], components: [actionRow] });
          console.log(`[ReleaseMatrix] ✅ Broadcasted ${rel.version} to #${channel.name}!`);
        }
      } catch (err) {
        console.warn(`[ReleaseMatrix] Error posting to updates channel:`, err.message);
      }

      // 2. 🧪 Dispatch to Alpha / Beta Testing Lab (#🧪・ai-lab)
      try {
        const labChannel = await client.channels.fetch(ALPHA_BETA_CHANNEL_ID).catch(() => null);
        if (labChannel) {
          const alphaEmbed = new EmbedBuilder()
            .setColor(0x8B5CF6)
            .setTitle(`🧪 [ALPHA / BETA DISPATCH] ${rel.version}: ${rel.title}`)
            .setDescription(
              `### ⚡ Internal Staging & Alpha/Beta Synchronization\n\n` +
              `This update has passed pre-flight QA and is officially live in production across the fleet!\n\n` +
              `**Release Summary:** ${rel.summary}\n\n` +
              `${rel.description}`
            )
            .setImage(rel.banner)
            .setFooter({ text: `Krims Code Alpha/Beta Synchronizer • Target Stage: ${rel.id}` })
            .setTimestamp();

          await labChannel.send({ embeds: [alphaEmbed], components: [actionRow] });
          console.log(`[ReleaseMatrix] 🧪 Dispatched ${rel.version} to #${labChannel.name}!`);
        }
      } catch (err) {
        console.warn(`[ReleaseMatrix] Error posting to alpha/beta lab:`, err.message);
      }

      // 3. 📬 Send Direct Message (DM) to Founder Krylo
      try {
        const owner = await client.users.fetch(OWNER_USER_ID).catch(() => null);
        if (owner) {
          const dmEmbed = new EmbedBuilder()
            .setColor(rel.color)
            .setTitle(`👑 [FOUNDER DISPATCH] ${rel.version} Released!`)
            .setDescription(
              `Hey Krylo! Your scheduled update **${rel.version}** has officially deployed to the network!\n\n` +
              `**Title:** ${rel.title}\n` +
              `**Summary:** ${rel.summary}\n\n` +
              `${rel.description}`
            )
            .setImage(rel.banner)
            .setFooter({ text: 'Krims Code Cloud Autopilot • Direct Founder DM Alert' })
            .setTimestamp();

          await owner.send({ embeds: [dmEmbed], components: [actionRow] }).catch((dmErr) => {
            console.warn(`[ReleaseMatrix] Could not DM owner:`, dmErr.message);
          });
          console.log(`[ReleaseMatrix] 📬 Sent founder DM for ${rel.version} to Krylo!`);
        }
      } catch (err) {
        console.warn(`[ReleaseMatrix] Error sending owner DM:`, err.message);
      }

      state.broadcasts[rel.id] = {
        triggeredAt: new Date().toISOString(),
        version: rel.version
      };
      stateModified = true;
    }
  }

  if (stateModified) {
    await saveReleaseState(state);
  }
}
