// ⚡ SMPLINK SAAS — DISCORD BOT MULTI-TENANT BRANDING MANAGER
// Fetches dynamic Server Name, IP, Accent Color, and Welcome Message per Guild ID from Vercel API

import fetch from 'node-fetch';

const DEFAULT_CONFIG = {
  serverName: "KryloSMP 2.0",
  serverIp: "KryloSmp.play.hosting",
  bedrockPort: 25565,
  accentColor: "#00F2FF",
  logoUrl: "https://raw.githubusercontent.com/Krylo-60/Krylo-60/main/github-contribution-grid-snake.svg",
  customWelcomeMsg: "Welcome to KryloSMP 2.0! Claim free starter rewards with /bday and /spin!"
};

const tenantCache = new Map();

export async function getTenantConfig(guildId) {
  if (!guildId) return DEFAULT_CONFIG;

  if (tenantCache.has(guildId)) {
    const cached = tenantCache.get(guildId);
    if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
      return cached.config;
    }
  }

  try {
    const res = await fetch(`https://smplink-saas.vercel.app/api/config?guildId=${guildId}`);
    if (res.ok) {
      const data = await res.json();
      if (data.ok && data.config) {
        tenantCache.set(guildId, { config: data.config, timestamp: Date.now() });
        return data.config;
      }
    }
  } catch (err) {
    console.error(`[TenantManager] Failed to fetch config for ${guildId}:`, err.message);
  }

  return DEFAULT_CONFIG;
}
