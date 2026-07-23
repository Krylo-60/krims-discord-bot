import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';
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
    const channels = await guild.channels.fetch();
    const announceCh = channels.find(c => c && c.name && c.name.includes('announcements') && c.type === ChannelType.GuildText);

    if (!announceCh) {
      console.error("[-] Announcements channel not found!");
      process.exit(1);
    }

    const embed = new EmbedBuilder()
      .setColor(0xFF007F)
      .setTitle('🎂🎉 EARLY BIRTHDAY SPECIAL EVENT & NETWORK ANNOUNCEMENT 🎉🎂')
      .setDescription(
        '👑 **Attention KryloSMP Community!**\n\n' +
        'Tomorrow (**July 24th**) is **Krylo\'s Birthday**! To celebrate the Creator & Owner of our network, an **Early Birthday Bonus Event** is NOW LIVE across the entire server! 🥳✨\n\n' +
        '---\n\n' +
        '### 🎁 Birthday Event Perks Active NOW:\n' +
        '• 🎇 **In-Game Fireworks Display:** Fireworks celebrations queued on the server!\n' +
        '• ⚡ **2x Double XP Boost:** All chat activity & in-game XP doubled!\n' +
        '• 🪙 **Bonus KryloCoins:** Type `/bday` or `/daily` in <#1526685119375478997> to claim free coins!\n\n' +
        '---\n\n' +
        '### 📜 Server Channel Guidelines & Purpose:\n' +
        'To keep our server clean, friendly, and structured, please note the purpose of each channel category:\n\n' +
        '1. **📌 INFORMATION (`#rules`, `#server-info`, `#store`):**\n' +
        '   Check IP address (`KryloSmp.play.hosting`), read guidelines, and browse rank perks.\n' +
        '2. **💬 COMMUNITY ZONE (`#general-chat`, `#bot-commands`, `#memes`):**\n' +
        '   Talk with players in `#general-chat`. Run all bot commands (`/daily`, `/work`, `/slots`, `/bday`) inside **<#1526685119375478997>** to keep general chat clean!\n' +
        '3. **🎟️ SUPPORT TICKETS (`#support-tickets`):**\n' +
        '   Need staff help or found a bug? Open a private ticket in **<#1524882737230774332>**.\n' +
        '4. **🎪 ACTIVITIES (`#pvp-chat`, `#tournaments`, `#giveaways`):**\n' +
        '   Compete in duels, join network tournaments, and enter active giveaways!\n\n' +
        '---\n\n' +
        'Everyone raise your swords and wish Krylo a Happy Birthday! ⚔️💎🎁'
      )
      .setThumbnail('https://cdn.discordapp.com/icons/1524878881918685405/a_8a2d1f9b3c4d5e6f.png')
      .setFooter({ text: 'KryloSMP Birthday Special • Event Live' })
      .setTimestamp();

    await announceCh.send({
      content: '🎉 @everyone **EARLY BIRTHDAY BONUS EVENT IS NOW LIVE!** 🎂🎈',
      embeds: [embed]
    });

    console.log(`[✅ Sent] Birthday event & channel guideline announcement posted in #${announceCh.name}!`);
    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error sending announcement:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
