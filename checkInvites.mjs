import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

async function api(endpoint) {
  const res = await fetch(`https://discord.com/api/v10${endpoint}`, {
    headers: { 'Authorization': `Bot ${TOKEN}`, 'Content-Type': 'application/json' }
  });
  if (!res.ok) { console.error(`API Error ${res.status}: ${await res.text()}`); return null; }
  return await res.json();
}

async function main() {
  // Get existing invites
  console.log('[1] Fetching existing server invites...');
  const invites = await api(`/guilds/${GUILD_ID}/invites`);
  if (invites && invites.length > 0) {
    console.log(`Found ${invites.length} invites:`);
    invites.forEach(inv => {
      console.log(`  https://discord.gg/${inv.code} (uses: ${inv.uses}, max_uses: ${inv.max_uses || 'unlimited'}, expires: ${inv.expires_at || 'never'}, channel: ${inv.channel?.name})`);
    });
  } else {
    console.log('No existing invites found.');
  }

  // Check vanity URL
  console.log('\n[2] Checking vanity URL...');
  const vanity = await api(`/guilds/${GUILD_ID}/vanity-url`);
  if (vanity && vanity.code) {
    console.log(`Vanity URL: https://discord.gg/${vanity.code}`);
  } else {
    console.log('No vanity URL (requires server boost level 3).');
  }

  // Get guild info for boost level
  console.log('\n[3] Checking guild boost level...');
  const guild = await api(`/guilds/${GUILD_ID}?with_counts=true`);
  if (guild) {
    console.log(`  Server: ${guild.name}`);
    console.log(`  Boost Level: ${guild.premium_tier}`);
    console.log(`  Boost Count: ${guild.premium_subscription_count}`);
    console.log(`  Members: ${guild.approximate_member_count}`);
  }
}

main();
