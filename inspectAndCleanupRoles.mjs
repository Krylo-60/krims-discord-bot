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
  console.log('[+] Role Cleaner Script Online as ' + client.user.tag);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[-] No guild found.');
      process.exit(1);
    }

    console.log(`\n🔍 INSPECTING ROLES ON: ${guild.name} (Total Roles: ${guild.roles.cache.size})...\n`);

    const officialRoleNames = [
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

    let deletedCount = 0;
    const rolesArray = Array.from(guild.roles.cache.values());

    for (const role of rolesArray) {
      // Skip @everyone, bot integration roles, booster roles, or official roles
      if (
        role.name === '@everyone' ||
        role.managed || 
        officialRoleNames.includes(role.name) ||
        role.name.includes('Booster') ||
        role.name.includes('KSMP') ||
        role.name.includes('Krylo Army')
      ) {
        console.log(`  🛡️ Kept Official/System Role: ${role.name} (${role.id})`);
        continue;
      }

      try {
        await role.delete('KryloSMP Role Cleanup');
        console.log(`  🗑️ Deleted Unused Duplicate Role: ${role.name} (${role.id})`);
        deletedCount++;
      } catch (e) {
        console.warn(`  [-] Could not delete role ${role.name}: ${e.message}`);
      }
    }

    console.log(`\n🏆 ROLE CLEANUP COMPLETE! Deleted ${deletedCount} unused roles. Remaining roles: ${guild.roles.cache.size}`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
