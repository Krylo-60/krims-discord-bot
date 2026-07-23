import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import 'dotenv/config';

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    const generalCh = guild.channels.cache.find(c => c && c.name && c.name.includes('general-chat') && c.type === ChannelType.GuildText);

    if (generalCh) {
      // Auto-purge any previous banner embeds sent by the bot in general chat
      const recent = await generalCh.messages.fetch({ limit: 20 }).catch(() => null);
      if (recent && recent.size > 0) {
        const oldBanners = recent.filter(m => m.author.id === client.user.id && m.embeds && m.embeds[0] && m.embeds[0].title && m.embeds[0].title.includes('KRYLOSMP ULTIMATE'));
        if (oldBanners.size > 0) {
          await generalCh.bulkDelete(oldBanners, true).catch(() => {});
        }
      }

      const embed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('👑✨ KRYLOSMP ULTIMATE NETWORK HUB & BIRTHDAY FESTIVAL ✨👑')
        .setDescription(
          '```ansi\n' +
          '\u001b[1;36m====================================================\u001b[0m\n' +
          '\u001b[1;33m       🏰 WELCOME TO THE KRYLOSMP NETWORK 🏰        \u001b[0m\n' +
          '\u001b[1;35m    JAVA & BEDROCK CROSS-PLATFORM SURVIVAL SMP    \u001b[0m\n' +
          '\u001b[1;36m====================================================\u001b[0m\n' +
          '```\n\n' +
          '🥳 **HAPPY BIRTHDAY KRYLO! THE 7-DAY FESTIVAL IS LIVE!** 🎉\n' +
          'Enjoy **2x Double XP**, **Daily Free Item Drops**, **Infinite Fireworks**, and **Casino Double Multipliers** all week long!\n\n' +
          '---\n\n' +
          '### 🌐 Quick Server Connection:\n' +
          '• 🧱 **Java Server IP:** `KryloSmp.play.hosting` (Port: `25565`)\n' +
          '• 📱 **Bedrock Server IP:** `KryloSmp.play.hosting` (Port: `19132`)\n' +
          '• 📦 **PaperMC Version:** 1.26.2 (Paper Build #65)\n\n' +
          '---\n\n' +
          '### ⚡ Essential Quick Commands:\n' +
          '• `/daily` - Claim your Day 1 **32x Diamonds & +1,000 KC**!\n' +
          '• `/work` - Earn 100-300 bonus KryloCoins working jobs!\n' +
          '• `/slots bet:100` - Spin the casino for **10x Payout Multipliers**!\n' +
          '• `/rank` - Check your chat level and active XP progress card!\n\n' +
          '---\n\n' +
          'Visit our webstore at `https://krylosmp-store.vercel.app` to unlock VIP & GOD ranks! ⚔️💎🎁'
        )
        .setThumbnail('https://cdn.discordapp.com/icons/1524878881918685405/a_8a2d1f9b3c4d5e6f.png')
        .setFooter({ text: 'KryloSMP • The Ultimate Minecraft Experience' })
        .setTimestamp();

      const storeBtn = new ButtonBuilder()
        .setLabel('🛒 Official Webstore')
        .setStyle(ButtonStyle.Link)
        .setURL('https://krylosmp-store.vercel.app');

      const verifyBtn = new ButtonBuilder()
        .setLabel('✅ Account Verification')
        .setStyle(ButtonStyle.Link)
        .setURL('https://discord.com/channels/1524878881918685405/1526685112693952568');

      const row = new ActionRowBuilder().addComponents(storeBtn, verifyBtn);

      await generalCh.send({ embeds: [embed], components: [row] });
      console.log(`[✅ Sent] Ultimate Network Banner & Quick Action Buttons posted in #${generalCh.name}!`);
    }

    // 2. Queue Grand Birthday Party Package in Database
    const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId })
    });

    if (configRes.ok) {
      const config = await configRes.json();
      if (!config.pendingCommands) config.pendingCommands = [];

      const partyCommands = [
        'title @a title {"text":"🎂 HAPPY BIRTHDAY KRYLO! 🎂","color":"gold","bold":true}',
        'title @a subtitle {"text":"7-Day Festival Active! Type /daily in Discord!","color":"yellow"}',
        'give @a minecraft:cake 1',
        'give @a minecraft:firework_rocket 64',
        'say 🎉 GRAND BIRTHDAY FESTIVAL IS LIVE! ENJOY FREE CAKE & FIREWORKS! 🎂🎆'
      ];

      config.pendingCommands.push(...partyCommands);

      await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', guildId, config })
      });
      console.log('[✅ Saved] Grand Birthday Party Package queued in database!');
    }

    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error deploying ultimate banner:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
