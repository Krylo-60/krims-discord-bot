/**
 * 🛰️ Krims Code Time-Gated Release Engine (v5.9.0 RC ➔ v6.0.0 GA)
 * Orchestrates automated stage activation and timed convergence:
 *   - Stage 1 (v5.9.0 RC): Staking Engine, Global Rich List, Dual-CLI Handshake Tokens (Active Now)
 *   - Stage 2 (v6.0.0 GA): General Availability Launch & Redemption Marketplace (Nov 9, 2026 00:00:00 UTC)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATE_FILE = path.resolve(__dirname, '../data/ga_release_state.json');

// Exact target timestamp: Monday, November 9, 2026 00:00:00 UTC
export const V6_0_GA_TIMESTAMP = Date.UTC(2026, 10, 9, 0, 0, 0); // 1794268800000
export const UPDATES_CHANNEL_ID = '1561175627799994402'; // #🚀・𝖡ot-𝖴pdates

export const REDEEMABLE_PERKS = [
  {
    id: 'founder_badge',
    name: '👑 Founder Pioneer Profile Badge',
    cost: 5000,
    description: 'Permanent prestige badge on your Krims Web Vault profile and Discord linked role.',
    command: '/redeem founder_badge'
  },
  {
    id: 'vip_queue',
    name: '⚡ Priority 0ms Bot Neural Compute',
    cost: 15000,
    description: 'VIP queue priority for all AI queries, quantum calculations, and image generation.',
    command: '/redeem vip_queue'
  },
  {
    id: 'color_custom',
    name: '🎨 Custom Discord Name Color (/color)',
    cost: 25000,
    description: 'Unlock custom hex code color role assignment in supported community servers.',
    command: '/redeem color_custom'
  },
  {
    id: 'ksmp_cosmetic',
    name: '⛏️ KryloSMP In-Game Particle Aura & Whitelist',
    cost: 50000,
    description: 'Exclusive in-game sovereign aura and priority server join slot on KryloSMP.',
    command: '/redeem ksmp_cosmetic'
  }
];

export function getEcosystemReleaseStatus() {
  const now = Date.now();
  const isGA = now >= V6_0_GA_TIMESTAMP;
  const msRemaining = Math.max(0, V6_0_GA_TIMESTAMP - now);

  const days = Math.floor(msRemaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((msRemaining / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((msRemaining / (1000 * 60)) % 60);

  return {
    version: isGA ? 'v6.0.0' : 'v5.9.0',
    phase: isGA ? 'General Availability (GA)' : 'Release Candidate (RC)',
    isGA,
    targetTimestamp: V6_0_GA_TIMESTAMP,
    msRemaining,
    countdownText: isGA
      ? '🟢 FULL PRODUCTION GENERAL AVAILABILITY ACTIVE'
      : `${days}d ${hours}h ${minutes}m until v6.0.0 GA Convergence (Nov 9, 2026)`,
    redemptionUnlocked: isGA
  };
}

/**
 * Check and auto-broadcast when the clock strikes v6.0.0 GA!
 */
export async function checkAndTriggerGABroadcast(client) {
  const status = getEcosystemReleaseStatus();
  if (!status.isGA) return false;

  let state = { broadcastSent: false };
  if (fs.existsSync(STATE_FILE)) {
    try {
      state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'));
    } catch (_) {}
  }

  if (state.broadcastSent) return false;

  try {
    const channel = await client.channels.fetch(UPDATES_CHANNEL_ID).catch(() => null);
    if (!channel) return false;

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🌟 KRIMS CODE v6.0.0 — THE GRAND GA CONVERGENCE IS LIVE! 🚀')
      .setDescription(
        `### The Wait Is Over: Official General Availability Released!\n\n` +
        `Krims Rewards (KR) has officially graduated from Public Beta into **General Availability (GA)** alongside the launch of the **Official Krims Code CLI Partnership**!\n\n` +
        `**What Is Now Live Network-Wide:**\n` +
        `• 💎 **Full Production KR Vault:** Zero limits, instant withdrawals, and cloud-synced ledgers across Discord and Web.\n` +
        `• 🛍️ **Redemption Marketplace Active:** Use \`/redeem\` to unlock custom role colors, Founder prestige badges, and Minecraft cosmetics.\n` +
        `• 📈 **Staking Yield Engine (12.5% APY):** Earn compounding daily Krims Rewards with \`/stake\`, \`/unstake\`, and \`/yield\`.\n` +
        `• 📦 **Dual-CLI Integration Live:** Connect directly to your terminal via \`npm i -g @krishivpb60/krims-code-cli\` and \`pip install krims-code-cli\` using your \`/cli-key\`.\n` +
        `• 🏆 **Global Rich List:** Check \`/kr-top\` to see the wealthiest guardians across the network!\n\n` +
        `🔗 **Access the Live Web Vault:** [krims-bot-dashboard.vercel.app/rewards](https://krims-bot-dashboard.vercel.app/rewards)`
      )
      .setImage('https://krims-bot-dashboard.vercel.app/logo.png')
      .setFooter({ text: 'Krims Code v6.0.0 • GA Convergence • Supreme Mastermind: Krylo' })
      .setTimestamp();

    await channel.send({ embeds: [embed] });

    state.broadcastSent = true;
    state.broadcastAt = new Date().toISOString();
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

    console.log('[TimeGatedRelease] 🚀 Broadcasted v6.0.0 GA Launch to #🚀・𝖡ot-𝖴pdates!');
    return true;
  } catch (err) {
    console.warn('[TimeGatedRelease] Failed to send GA broadcast:', err.message);
    return false;
  }
}
