import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const EXACT_PERMITTED_NAMES = new Set([
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
  console.log('[+] Pipe & Dot Purge Online as ' + client.user.tag + '\n');

  try {
    for (const [, guild] of client.guilds.cache) {
      if (!guild.name.toLowerCase().includes('krylo')) continue;
      console.log(`=======================================================`);
      console.log(`AUDITING CHANNELS IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const channels = await guild.channels.fetch();

      for (const [, channel] of channels) {
        if (!channel || channel.type === 4) continue; // Skip categories

        // Print channel name
        console.log(`Channel: "${channel.name}" (ID: ${channel.id})`);

        if (!EXACT_PERMITTED_NAMES.has(channel.name)) {
          try {
            await channel.delete('Purging duplicate or old format channel');
            console.log(`  [🗑️ DELETED]: "${channel.name}"`);
          } catch (e) {
            console.warn(`  [-] Could not delete "${channel.name}": ${e.message}`);
          }
        }
      }
    }

    console.log('\n🏆 ALL LEGACY DUPLICATE CHANNELS PURGED!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
