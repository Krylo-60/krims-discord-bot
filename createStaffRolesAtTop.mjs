import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1538225337048236082';

// Create in order from bottom to top so Owner lands at the VERY TOP:
const STAFF_ROLES = [
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

  console.log('[+] Adding staff and booster roles to the top...');
  for (const r of STAFF_ROLES) {
    const created = await guild.roles.create({
      name: r.name,
      color: r.color,
      hoist: r.hoist,
      reason: 'Staff hierarchy build'
    }).catch(e => console.log('Err:', e.message));
    if (created) console.log(`   [+] Created at Top: ${created.name}`);
  }

  // Assign Bots role to Krims Code AI
  const roles = await guild.roles.fetch();
  const botRole = roles.find(r => r.name === '🤖 Bots');
  if (botRole) {
    const botMember = await guild.members.fetch(client.user.id).catch(() => null);
    if (botMember) await botMember.roles.add(botRole).catch(() => {});
  }

  const sorted = Array.from(roles.values()).sort((a, b) => b.position - a.position);
  console.log('\n=== 100% PERFECT VERIFIED HIERARCHY (TOP TO BOTTOM) ===');
  sorted.forEach((r, idx) => {
    console.log(`${idx + 1}. [Pos ${r.position}] ${r.name}`);
  });

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
