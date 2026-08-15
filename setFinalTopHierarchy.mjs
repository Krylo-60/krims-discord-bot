import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1538225337048236082';

// TOP-TO-BOTTOM desired hierarchy:
// In Discord, if you create from Bottom to Top, the last one created is at the HIGHEST position!
// Order to create: Level 1 -> Level 5 -> ... -> Director -> Owner
const ROLES_TO_CREATE = [
  { name: '✅ Verified', color: 0x00FF88, hoist: false },
  { name: '🌱 Level 1', color: 0x95A5A6, hoist: false },
  { name: '⚡ Level 5', color: 0xCDDC39, hoist: false },
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

  console.log('[+] Cleaning roles for exact order build...');
  const roles = await guild.roles.fetch();
  for (const [, r] of roles) {
    if (r.name !== '@everyone' && !r.managed) {
      await r.delete().catch(() => {});
    }
  }

  console.log('[+] Creating roles in order: lowest to highest...');
  for (const r of ROLES_TO_CREATE) {
    const created = await guild.roles.create({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      reason: 'Perfect top-to-bottom hierarchy'
    }).catch(e => console.log('Err:', e.message));
    if (created) console.log(`   [+] Created at top: ${created.name}`);
  }

  // Assign Bots role
  const updatedRoles = await guild.roles.fetch();
  const botRole = updatedRoles.find(r => r.name === '🤖 Bots');
  if (botRole) {
    const botMember = await guild.members.fetch(client.user.id).catch(() => null);
    if (botMember) await botMember.roles.add(botRole).catch(() => {});
  }

  const sorted = Array.from(updatedRoles.values()).sort((a, b) => b.position - a.position);
  console.log('\n=== FINAL VERIFIED HIERARCHY (TOP TO BOTTOM) ===');
  sorted.forEach((r, idx) => {
    console.log(`${idx + 1}. [Pos ${r.position}] ${r.name}`);
  });

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
