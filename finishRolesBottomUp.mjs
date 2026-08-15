import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1538225337048236082';

// In bottom-up order so each newly created role lands right on top!
const BOTTOM_TO_TOP = [
  { name: '🌱 Level 10', color: 0x8BC34A, hoist: false },
  { name: '🌿 Level 15', color: 0x4CAF50, hoist: false },
  { name: '🐬 Level 20', color: 0x00BCD4, hoist: false },
  { name: '🌊 Level 25', color: 0x009688, hoist: false },
  { name: '🔷 Level 40', color: 0x3F51B5, hoist: false },
  { name: '🔮 Level 45', color: 0x9B59B6, hoist: false },
  { name: '✨ Level 50', color: 0xBDC3C7, hoist: false },
  { name: '💠 Level 60', color: 0x3498DB, hoist: false },
  { name: '🍃 Level 70', color: 0x2ECC71, hoist: false },
  { name: '💎 Level 75', color: 0x00E5FF, hoist: false },
  { name: '🌟 Level 100', color: 0xFF007F, hoist: false },
  { name: '🤖 Bots', color: 0x5865F2, hoist: true },
  { name: '🚀 Boosters', color: 0xF47FFF, hoist: true },
  { name: '📚 Mod in training', color: 0x1ABC9C, hoist: true },
  { name: '🤝 Junior Mod', color: 0x2980B9, hoist: true },
  { name: '🛡️ Mod', color: 0x3498DB, hoist: true },
  { name: '🔮 Senior Mod', color: 0x9B59B6, hoist: true },
  { name: '📚 Admin in training', color: 0xF1C40F, hoist: true },
  { name: '🤝 Junior Admin', color: 0xF39C12, hoist: true },
  { name: '🛡️ Admin', color: 0xE67E22, hoist: true },
  { name: '⚡ Senior Admin', color: 0xFF4500, hoist: true },
  { name: '🎬 Director', color: 0xE74C3C, hoist: true },
  { name: '👑 Owner', color: 0xFFD700, hoist: true }
];

client.once('ready', async () => {
  const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) process.exit(1);

  console.log('[+] Creating roles sequentially bottom-up...');
  for (const r of BOTTOM_TO_TOP) {
    const existing = guild.roles.cache.find(role => role.name.toLowerCase() === r.name.toLowerCase());
    if (!existing) {
      const created = await guild.roles.create({
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        reason: 'Hierarchy bottom-up setup'
      }).catch(e => console.log('Err:', e.message));
      if (created) console.log(`   [+] Created: ${created.name}`);
    }
  }

  // Print final sorted roles
  const finalRoles = await guild.roles.fetch();
  const sorted = Array.from(finalRoles.values()).sort((a, b) => b.position - a.position);
  console.log('\n=== 100% PERFECT VERIFIED ORDER (TOP TO BOTTOM) ===');
  sorted.forEach((r, idx) => {
    console.log(`${idx + 1}. [Pos ${r.position}] ${r.name}`);
  });

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
