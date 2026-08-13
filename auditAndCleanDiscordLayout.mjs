import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 MULTI-GUILD DISCORD LAYOUT DE-DUPLICATOR (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Multi-Guild Layout Auditor Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🧹 DE-DUPLICATING SIDEBAR CHANNELS FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const allChannels = Array.from(guild.channels.cache.values());
      let deletedCount = 0;

      for (const ch of allChannels) {
        if (ch.type === ChannelType.GuildCategory) continue;

        const name = ch.name;

        // Legacy duplicate channel names to remove
        const isLegacyDuplicate = 
          name === '✅┃verify' ||
          name === '🛒┃store' ||
          name === '📢┃server-announcements' ||
          name === '📺-youtube-announcements' ||
          name === 'ℹ️┃server-info' ||
          name === '🌐┃socials' ||
          name === '🎫┃support-tickets' ||
          name === '💬┃general-chat' ||
          name === '🎵┃music-chat' ||
          name === '📷┃media-clips' ||
          name === '🛡️┃clan-recruitment' ||
          name === '🏆┃duels-leaderboard' ||
          name === '🏰-krylo-clan-chat' ||
          name === '🏰・ksmp-clan-chat' ||
          name === 'New-updates' ||
          name === '📈┃polls' ||
          name === '🛒┃marketplace' ||
          name === '⚔️┃pvp-chat' ||
          name === '🏆┃tournament-august-2026' ||
          name === '📖┃server-rules' ||
          name === '🛒-store-info' ||
          name === '🏆-clan-leaderboard' ||
          name === '🎯-bounties-board' ||
          name === '📢-server-announcements' ||
          name === '📺-youtube-announcements' ||
          name === '📷-media-showcase' ||
          name === '🎵-music-chat' ||
          name === '🚀┃boosts' ||
          name === '🌐-socials' ||
          name === '✅-verify' ||
          name === '📫┃tickets';

        if (isLegacyDuplicate) {
          try {
            await ch.delete('Deleting legacy duplicate channel to clean sidebar layout');
            deletedCount++;
            console.log(`  🗑️ Deleted legacy duplicate channel: #${name} in [${guild.name}]`);
          } catch (e) {
            console.warn(`  [-] Could not delete #${name}: ${e.message}`);
          }
        }
      }

      console.log(`\n🏆 DE-DUPLICATION COMPLETE IN [${guild.name}]: ${deletedCount} LEGACY CHANNELS REMOVED!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
