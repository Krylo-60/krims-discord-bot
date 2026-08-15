import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1538225337048236082';

// Desired order from Top (highest position) to Bottom (lowest position)
const DESIRED_ORDER = [
  '👑 Owner',
  '🎬 Director',
  '⚡ Senior Admin',
  '🛡️ Admin',
  '🤝 Junior Admin',
  '📚 Admin in training',
  '🔮 Senior Mod',
  '🛡️ Mod',
  '🤝 Junior Mod',
  '📚 Mod in training',
  '🚀 Boosters',
  '🤖 Bots',
  '🌟 Level 100',
  '💎 Level 75',
  '🍃 Level 70',
  '💠 Level 60',
  '✨ Level 50',
  '🔮 Level 45',
  '🔷 Level 40',
  '🌊 Level 25',
  '🐬 Level 20',
  '🌿 Level 15',
  '🌱 Level 10',
  '⚡ Level 5',
  '🌱 Level 1',
  '✅ Verified'
];

client.once('ready', async () => {
  const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) {
    console.error('Guild not found');
    process.exit(1);
  }

  console.log(`[+] Re-ordering all roles in ${guild.name} to 100% PERFECT hierarchy...`);

  const roles = await guild.roles.fetch();
  const botMember = await guild.members.fetch(client.user.id);
  const botHighestPos = botMember.roles.highest.position;
  console.log(`Bot highest role position: ${botHighestPos}`);

  // Build position array (Discord sets position from bottom up: 1 is lowest above @everyone)
  // Reversed desired order so lowest gets position 1, 2, ...
  const rolePositions = [];
  const reversed = [...DESIRED_ORDER].reverse();

  let pos = 1;
  for (const name of reversed) {
    const r = roles.find(role => role.name.toLowerCase() === name.toLowerCase());
    if (r && !r.managed && r.position < botHighestPos) {
      rolePositions.push({ role: r.id, position: pos });
      pos++;
    }
  }

  if (rolePositions.length > 0) {
    try {
      await guild.roles.setPositions(rolePositions);
      console.log('✅ Successfully updated role positions via setPositions!');
    } catch (e) {
      console.log('setPositions notice:', e.message);
    }
  }

  // Verify new order
  const updatedRoles = await guild.roles.fetch();
  const sorted = Array.from(updatedRoles.values()).sort((a, b) => b.position - a.position);
  console.log('\n=== NEW VERIFIED ROLE HIERARCHY (TOP TO BOTTOM) ===');
  sorted.forEach((r, idx) => {
    console.log(`${idx + 1}. [Pos ${r.position}] ${r.name}`);
  });

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
