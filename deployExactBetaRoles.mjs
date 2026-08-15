import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1538225337048236082';

// Hierarchy from highest to lowest
const ROLES = [
  { name: '👑 Owner', color: 0xFFD700, hoist: true, mentionable: true },
  { name: '🎬 Director', color: 0xE74C3C, hoist: true, mentionable: true },
  { name: '⚡ Senior Admin', color: 0xFF4500, hoist: true, mentionable: true },
  { name: '🛡️ Admin', color: 0xE67E22, hoist: true, mentionable: true },
  { name: '🤝 Junior Admin', color: 0xF39C12, hoist: true, mentionable: true },
  { name: '📚 Admin in training', color: 0xF1C40F, hoist: true, mentionable: false },
  { name: '🔮 Senior Mod', color: 0x9B59B6, hoist: true, mentionable: true },
  { name: '🛡️ Mod', color: 0x3498DB, hoist: true, mentionable: true },
  { name: '🤝 Junior Mod', color: 0x2980B9, hoist: true, mentionable: true },
  { name: '📚 Mod in training', color: 0x1ABC9C, hoist: true, mentionable: false },
  { name: '🚀 Boosters', color: 0xF47FFF, hoist: true, mentionable: false },
  { name: '🌟 Level 100', color: 0xFF007F, hoist: false, mentionable: false },
  { name: '💎 Level 75', color: 0x00E5FF, hoist: false, mentionable: false },
  { name: '🍃 Level 70', color: 0x2ECC71, hoist: false, mentionable: false },
  { name: '💠 Level 60', color: 0x3498DB, hoist: false, mentionable: false },
  { name: '✨ Level 50', color: 0xBDC3C7, hoist: false, mentionable: false }
];

client.once('ready', async () => {
  console.log(`[+] Bot connected: ${client.user.tag}`);
  const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);

  if (!guild) {
    console.error('❌ Guild not found!');
    process.exit(1);
  }

  console.log(`\n👑 Creating Exact Roles Hierarchy for: ${guild.name}`);
  console.log(`================================================`);

  // Create roles in reverse order so higher roles naturally sit at the top of the hierarchy
  const reversed = [...ROLES].reverse();

  for (const r of reversed) {
    const existing = guild.roles.cache.find(role => role.name.toLowerCase() === r.name.toLowerCase());
    if (!existing) {
      const created = await guild.roles.create({
        name: r.name,
        color: r.color,
        hoist: r.hoist,
        mentionable: r.mentionable,
        reason: 'KryloSMP Beta Release exact roles hierarchy setup'
      }).catch(err => {
        console.log(`Error creating ${r.name}:`, err.message);
        return null;
      });
      if (created) {
        console.log(`✅ Created Role: ${created.name} (Color: #${created.color.toString(16).padStart(6, '0').toUpperCase()}, Hoist: ${r.hoist})`);
      }
    } else {
      console.log(`ℹ️ Role already exists: ${existing.name}`);
    }
  }

  console.log(`\n🎉 ALL 16 REQUESTED ROLES HAVE BEEN CREATED IN PERFECT HIERARCHY!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
