import { Client, GatewayIntentBits, ChannelType } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Formatting Script Online as ' + client.user.tag);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[-] No guild found.');
      process.exit(1);
    }

    console.log(`[+] Formatting channels for: ${guild.name}...`);

    // 1. Give Krylo (krylo_plays / Krylo) 1,000,000 KryloCoins in Vercel Backend
    try {
      const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_balance',
          guildId: guild.id,
          username: 'krylo_plays',
          balance: 1000000
        })
      });
      console.log('✅ Updated balance for krylo_plays to 1,000,000 KC!');
    } catch (e) {
      console.warn('[-] Balance update warning:', e.message);
    }

    // 2. Format existing channels with clean emojis
    const channelRenameMap = {
      'marketplace': '🛒-marketplace',
      'media-clips': '🎬-media-clips',
      'marketplace-trading': '🤝-marketplace-trading',
      'polls': '📊-polls',
      'pvp-chat': '⚔️-pvp-chat',
      'tournaments': '🏆-tournaments',
      'build-showcase': '🎨-build-showcase',
      'admin-abuse-events': '💥-admin-abuse-events',
      'giveaways': '🎁-giveaways',
      'general-chat': '💬-general-chat',
      'music-chat': '🎵-music-chat',
      'bot-commands': '🤖-bot-commands',
      'suggestions': '💡-suggestions'
    };

    for (const [oldName, newName] of Object.entries(channelRenameMap)) {
      const ch = guild.channels.cache.find(c => c.name === oldName || c.name === `💬-${oldName}` || c.name === `#${oldName}`);
      if (ch) {
        await ch.edit({ name: newName });
        console.log(`  ✨ Formatted channel: ${oldName} -> ${newName}`);
      }
    }

    console.log(`\n🏆 ALL CHANNELS FORMATTED & 1,000,000 KC GRANTED TO KRYLO!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
