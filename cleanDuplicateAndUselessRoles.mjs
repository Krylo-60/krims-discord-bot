import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 DEEP ROLE CLEANER FOR KRYLOSMP (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const keepExactRoles = [
  '👑 OWNER',
  '💎 ADMIN',
  '🛡️ SENIOR MODERATOR',
  '🛡️ MODERATOR',
  '🎬 CREATOR / YOUTUBER',
  '⭐ VIP / BOOSTER',
  '⚔️ CLAN LEADER',
  '✅ VERIFIED PLAYER',
  '👑 Founder & Studio Lead',
  '🛠️ Developer / Builder',
  '💎 Server Booster',
  '⭐ VIP Client',
  '🏆 Tournament Champion',
  '🌟 Level 50 Legend',
  '🔥 Level 25 Veteran',
  '⚡ Level 10 Active',
  '🔔 Announcement Ping',
  '🎉 Giveaway Ping',
  '🎪 Event Ping',
  '🔴 Stream/YouTube Ping',
  '☕ Java Edition Player',
  '📱 Bedrock Edition Player',
  '⚔️ PvP Specialist',
  '🏰 Master Builder',
  '[KRYLO] Krylo Army',
  '🔥 OG Member',
  'Krims Code AI',
  '🤖 Krims AI',
  'DISBOARD.org',
  '@everyone'
];

client.once('ready', async () => {
  console.log('[+] Deep Role Cleaner Online as ' + client.user.tag + '\n');

  try {
    const guild = client.guilds.cache.get('1524878881918685405');
    if (!guild) {
      console.error('[-] Guild KryloSMP not found.');
      process.exit(1);
    }

    console.log(`=======================================================`);
    console.log(`🧹 DEEP CLEANING UNNECESSARY ROLES FOR: ${guild.name} (${guild.id})`);
    console.log(`=======================================================\n`);

    const roles = Array.from(guild.roles.cache.values());
    let deletedCount = 0;

    for (const r of roles) {
      if (r.managed || r.name === '@everyone' || keepExactRoles.includes(r.name)) continue;

      try {
        await r.delete(`Cleaning unneeded legacy role "${r.name}"`);
        deletedCount++;
        console.log(`  🗑️ Deleted Legacy Role: "${r.name}" (ID: ${r.id})`);
      } catch (e) {
        console.warn(`  [-] Could not delete role "${r.name}": ${e.message}`);
      }
    }

    console.log(`\n🏆 DEEP CLEAN COMPLETE IN [${guild.name}]: ${deletedCount} UNNECESSARY ROLES DELETED!\n\n`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error cleaning roles:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
