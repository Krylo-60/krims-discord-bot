import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const ALLOWED_CHANNELS = new Set([
  '📌┃rules',
  '📢┃server-announcements',
  '📺┃youtube-announcements',
  'ℹ️┃server-info',
  '🌐┃socials',
  '✅┃verify',
  '📢┃new-updates',
  '💬┃general-chat',
  '🎵┃music-chat',
  '📷┃media-clips',
  '😂┃memes',
  '💡┃suggestions',
  '🤖┃bot-commands',
  '🛒┃store',
  '🤝┃item-trading',
  '💰┃jackpot-vault',
  '🎯┃bounty-board',
  '🛡️┃clan-recruitment',
  '🏆┃clan-leaderboard',
  '⚔️┃pvp-chat',
  '🏆┃monthly-tournament',
  '🎫┃support-tickets'
]);

client.once('ready', async () => {
  console.log('[+] Purge Script Online as ' + client.user.tag + '\n');

  try {
    for (const [, guild] of client.guilds.cache) {
      console.log(`Checking guild: ${guild.name} (${guild.id})`);
      const channels = await guild.channels.fetch();

      for (const [, channel] of channels) {
        if (!channel || channel.type === 4) continue; // Skip categories

        // If channel name does NOT match our preferred line separator list or has legacy dot bullets
        const isLegacy = channel.name.includes('・') || 
                         channel.name === 'youtube-alerts' || 
                         channel.name === 'official-links' || 
                         channel.name === 'verify here' || 
                         channel.name.toLowerCase() === 'new updates' ||
                         (!ALLOWED_CHANNELS.has(channel.name) && (channel.name.includes('rules') || channel.name.includes('announcements') || channel.name.includes('verify') || channel.name.includes('store') || channel.name.includes('info') || channel.name.includes('socials')));

        if (isLegacy) {
          try {
            await channel.delete('Purging legacy duplicate channel shown in user screenshot');
            console.log(`  [🗑️ DELETED LEGACY CHANNEL]: #${channel.name} (${channel.id})`);
          } catch (e) {
            console.warn(`  [-] Failed to delete #${channel.name}: ${e.message}`);
          }
        }
      }
    }

    console.log('\n🏆 Legacy channel purge complete!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error during purge:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
