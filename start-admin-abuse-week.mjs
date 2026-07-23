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

    // 1. Post 7-Day Admin Abuse Week Announcement
    const embed = new EmbedBuilder()
      .setColor(0xFF3300)
      .setTitle('⚡🚨 ADMIN ABUSE WEEK & BIRTHDAY FESTIVAL IS LIVE FOR 7 DAYS! 🚨⚡')
      .setDescription(
        '👑 **Owner Krylo has extended ADMIN ABUSE MODE for 7 FULL DAYS!** 🥳💥💎\n\n' +
        'Starting today (**July 23rd**) through **July 30th**, our network is celebrating Krylo\'s Birthday with a week-long Admin Abuse Festival!\n\n' +
        '---\n\n' +
        '### 🎁 7-Day Festival Perks Active ALL WEEK:\n' +
        '• ⚡ **7-Day Double XP Boost:** 2x Chat & In-Game XP enabled for 7 full days!\n' +
        '• 💎 **Daily Free Diamond Drops:** Claim free diamonds & golden apples daily!\n' +
        '• 🪙 **Daily +1000 KryloCoins Bonus:** Type `/daily`, `/work`, and `/bday` for 10x rewards!\n' +
        '• 🎇 **Continuous Spawn Fireworks:** Server-wide fireworks displays!\n' +
        '• 🎰 **Casino Double Payouts:** Slots & casino games pay out 2x multipliers!\n\n' +
        '---\n\n' +
        'Join the celebration now at `KryloSmp.play.hosting`! ⚔️💎💥'
      )
      .setThumbnail('https://cdn.discordapp.com/icons/1524878881918685405/a_8a2d1f9b3c4d5e6f.png')
      .setFooter({ text: 'KryloSMP Admin Abuse Week • July 23 - July 30, 2026' })
      .setTimestamp();

    if (announceCh) {
      await announceCh.send({
        content: '⚡ @everyone **ADMIN ABUSE WEEK IS NOW LIVE FOR 7 FULL DAYS! (JULY 23 - JULY 30)** 💎🥳',
        embeds: [embed]
      });
      console.log(`[✅ Sent] 7-Day Admin Abuse Week Announcement posted in #${announceCh.name}!`);
    }

    // 2. Persist 7-Day Admin Abuse Week state in Vercel config database
    const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId })
    });

    if (configRes.ok) {
      const config = await configRes.json();
      config.adminAbuseWeek = true;
      config.doubleXpActive = true;
      config.eventExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      if (!config.pendingCommands) config.pendingCommands = [];
      config.pendingCommands.push('say ⚡ ADMIN ABUSE WEEK IS NOW ACTIVE FOR 7 DAYS! (JULY 23 - JULY 30) 💎⚡');
      config.pendingCommands.push('effect give @a minecraft:speed 86400 2');
      config.pendingCommands.push('effect give @a minecraft:regeneration 86400 1');

      await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', guildId, config })
      });
      console.log('[✅ Saved] 7-Day Admin Abuse Week state saved in cloud database!');
    }

    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error launching Admin Abuse Week:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
