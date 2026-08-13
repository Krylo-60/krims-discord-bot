import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] FORCE ROLE CLEANER SCRIPT ONLINE as ' + client.user.tag);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[-] No guild found.');
      process.exit(1);
    }

    console.log(`\n🔍 INITIAL ROLE COUNT: ${guild.roles.cache.size} Roles on ${guild.name}\n`);

    const official10Roles = [
      '👑 OWNER',
      '⚙️ ADMIN',
      '🛡️ MODERATOR',
      '🎥 CONTENT CREATOR',
      '💎 KRYLO GOD',
      '⚡ VIP+',
      '🏰 CLAN LEADER',
      '⚔️ CLAN MEMBER',
      '🏆 TOURNAMENT CHAMPION',
      '✅ VERIFIED'
    ];

    let deleted = 0;
    const roles = Array.from(guild.roles.cache.values());

    for (const role of roles) {
      if (role.name === '@everyone' || role.managed) {
        console.log(`  🛡️ System Role Kept: ${role.name}`);
        continue;
      }

      if (official10Roles.includes(role.name)) {
        console.log(`  ✨ Official Role Kept: ${role.name}`);
        continue;
      }

      try {
        await role.delete('Force Role Cleanup');
        console.log(`  🗑️ DELETED ROLE: ${role.name} (${role.id})`);
        deleted++;
      } catch (e) {
        console.warn(`  [-] Could not delete ${role.name}: ${e.message}`);
      }
    }

    console.log(`\n🏆 FINAL ROLE COUNT: ${guild.roles.cache.size} Roles remaining! Deleted ${deleted} roles.`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
