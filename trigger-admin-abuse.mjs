import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';
import 'dotenv/config';

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    const announceCh = guild.channels.cache.find(c => c && c.name && c.name.includes('announcements') && c.type === ChannelType.GuildText);

    // 1. Post Discord Event Embed
    const embed = new EmbedBuilder()
      .setColor(0xFF3300)
      .setTitle('⚡🚨 ADMIN ABUSE EVENT IS NOW LIVE! 🚨⚡')
      .setDescription(
        '👑 **Owner Krylo has unleashed ADMIN ABUSE MODE on KryloSMP!** 💥💎\n\n' +
        'For the next 30 minutes, normal rules are suspended for chaotic fun! Join the server now to claim your free OP boosts and rewards!\n\n' +
        '---\n\n' +
        '### 🎁 Admin Abuse Event Drops & Perks:\n' +
        '• 💎 **Free Diamond Drops:** 32x Diamonds & 16x Golden Apples granted to all players!\n' +
        '• ⚡ **Super Powers Active:** Speed II, Jump Boost II, and Regeneration II enabled!\n' +
        '• 🎇 **Spawn Fireworks Rain:** Non-stop celebration fireworks at Spawn!\n' +
        '• 🪙 **KryloCoins Bonus:** +1000 KryloCoins credited to everyone participating!\n\n' +
        '---\n\n' +
        'Join NOW at `KryloSmp.play.hosting`! ⚔️💎💥'
      )
      .setThumbnail('https://cdn.discordapp.com/icons/1524878881918685405/a_8a2d1f9b3c4d5e6f.png')
      .setFooter({ text: 'KryloSMP Admin Abuse Event • Chaos Mode Active' })
      .setTimestamp();

    if (announceCh) {
      await announceCh.send({
        content: '⚡ @everyone **ADMIN ABUSE EVENT IS NOW LIVE! FREE DIAMONDS & SPEED BOOSTS!** 💎💥',
        embeds: [embed]
      });
      console.log(`[✅ Sent] Admin Abuse Announcement posted in #${announceCh.name}!`);
    }

    // 2. Queue in-game commands via Vercel config database
    const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId })
    });

    if (configRes.ok) {
      const config = await configRes.json();
      if (!config.pendingCommands) config.pendingCommands = [];

      const adminCommands = [
        'say ⚡ ADMIN ABUSE EVENT IS LIVE! FREE DIAMONDS & SPEED BOOSTS GRANTED! 💎⚡',
        'effect give @a minecraft:speed 600 2',
        'effect give @a minecraft:jump_boost 600 1',
        'effect give @a minecraft:regeneration 600 2',
        'give @a minecraft:diamond 32',
        'give @a minecraft:golden_apple 16',
        'execute at @a run summon firework_rocket ~ ~ ~ {LifeTime:30,FireworksItem:{id:firework_rocket,Count:1,tag:{Fireworks:{Explosions:[{Type:1,Flicker:1,Trail:1,Colors:[I;16711935,65535,16776960]}]}}}}'
      ];

      config.pendingCommands.push(...adminCommands);

      // Award +1000 KC to economy users
      if (config.economyData) {
        for (const user of Object.keys(config.economyData)) {
          config.economyData[user].balance = (config.economyData[user].balance || 0) + 1000;
        }
      }

      await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', guildId, config })
      });
      console.log('[✅ Saved] Admin Abuse commands and +1000 KC bonuses queued in database!');
    }

    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error starting Admin Abuse event:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
