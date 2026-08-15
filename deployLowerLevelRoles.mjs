import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1538225337048236082';

const LOWER_LEVEL_ROLES = [
  { name: '🔮 Level 45', color: 0x9B59B6 },
  { name: '🔷 Level 40', color: 0x3F51B5 },
  { name: '🌊 Level 25', color: 0x009688 },
  { name: '🐬 Level 20', color: 0x00BCD4 },
  { name: '🌿 Level 15', color: 0x4CAF50 },
  { name: '🌱 Level 10', color: 0x8BC34A },
  { name: '⚡ Level 5', color: 0xCDDC39 },
  { name: '🌱 Level 1', color: 0x95A5A6 }
];

client.once('ready', async () => {
  console.log(`[+] Bot connected: ${client.user.tag}`);
  const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);

  if (!guild) {
    console.error('❌ Guild not found!');
    process.exit(1);
  }

  console.log(`\n👑 Adding Lower Level Progression Roles for: ${guild.name}`);
  console.log(`========================================================`);

  const reversed = [...LOWER_LEVEL_ROLES].reverse();

  for (const r of reversed) {
    const existing = guild.roles.cache.find(role => role.name.toLowerCase() === r.name.toLowerCase());
    if (!existing) {
      const created = await guild.roles.create({
        name: r.name,
        color: r.color,
        hoist: false,
        mentionable: false,
        reason: 'KryloSMP Beta Release level progression setup'
      }).catch(err => {
        console.log(`Error creating ${r.name}:`, err.message);
        return null;
      });
      if (created) {
        console.log(`✅ Created Role: ${created.name} (Color: #${created.color.toString(16).padStart(6, '0').toUpperCase()})`);
      }
    } else {
      console.log(`ℹ️ Role already exists: ${existing.name}`);
    }
  }

  console.log(`\n🎉 ALL LOWER LEVEL ROLES CREATED SUCCESSFULLY!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
