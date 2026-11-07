import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.resolve(__dirname, '../data/scheduled_releases_state.json');

export const UPDATES_CHANNEL_ID = '1561175627799994402'; // #🚀・𝖡ot-𝖴pdates

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
    id: 'stage_3_harvest_2x',
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
    id: 'stage_4_winter_wonderland',
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
    id: 'stage_5_christmas_mega_drop',
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
    id: 'stage_6_new_year_2027',
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

// Helper to load release state
function loadReleaseState() {
  if (fs.existsSync(STATE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch (_) {}
  }
  return { broadcasts: {} };
}

function saveReleaseState(state) {
  try {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[ReleaseMatrix] Error saving state:', err.message);
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
 * Periodically called (every 60s) to check if any automated release has matured
 * and broadcast the update to Discord without human intervention!
 */
export async function checkAndTriggerGABroadcast(client) {
  const now = Date.now();
  const state = loadReleaseState();
  let stateModified = false;

  for (const rel of SCHEDULED_RELEASES) {
    // Has the release time arrived and hasn't been broadcasted yet?
    if (now >= rel.timestamp && !state.broadcasts[rel.id]) {
      console.log(`[ReleaseMatrix] 🎯 Triggering automated release: ${rel.version} (${rel.id})`);
      
      try {
        const channel = await client.channels.fetch(UPDATES_CHANNEL_ID).catch(() => null);
        if (channel) {
          const embed = new EmbedBuilder()
            .setColor(rel.color)
            .setTitle(rel.title)
            .setDescription(rel.description)
            .setImage(rel.banner)
            .setFooter({ text: `Autonomous Scheduled Release • ${rel.version} • Krylo Autopilot` })
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setLabel('🌐 Web Dashboard')
              .setStyle(ButtonStyle.Link)
              .setURL('https://krims-bot-dashboard.vercel.app/updates'),
            new ButtonBuilder()
              .setLabel('⚡ Krylo Aura')
              .setStyle(ButtonStyle.Link)
              .setURL('https://krims-discord-bot-d57m.onrender.com/gifs/krylo_aura_all_in_one.gif')
          );

          await channel.send({ embeds: [embed], components: [row] });
          console.log(`[ReleaseMatrix] ✅ Broadcasted ${rel.version} to #${channel.name}!`);
        }

        state.broadcasts[rel.id] = {
          triggeredAt: new Date().toISOString(),
          version: rel.version
        };
        stateModified = true;
      } catch (err) {
        console.warn(`[ReleaseMatrix] Notice while broadcasting ${rel.id}:`, err.message);
      }
    }
  }

  if (stateModified) {
    saveReleaseState(state);
  }
}
