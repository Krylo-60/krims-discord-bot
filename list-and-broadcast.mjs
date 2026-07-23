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

const channelAnnouncements = {
  'rules': {
    title: '📜 Server Rules & Community Guidelines',
    description: 'Welcome to KryloSMP! Please abide by the following rules to maintain a safe and fun environment for everyone:\n\n1. **Be Respectful:** No harassment, hate speech, toxic behavior, or harassment.\n2. **No Cheating:** X-Ray, hacked clients, duping, and macros are strictly prohibited.\n3. **No Spamming:** Avoid excessive caps, wall of text, or self-promotion.\n4. **Listen to Staff:** Staff decisions are final. Open a support ticket if you need assistance.',
    color: 0xFF0055
  },
  'announcements': {
    title: '📢 Official Server Announcements',
    description: 'Stay tuned here for major KryloSMP network updates, event notices, maintenance schedules, and new features!',
    color: 0x00F2FF
  },
  'server-info': {
    title: '🌐 KryloSMP Network Information',
    description: '• **Server IP:** `KryloSmp.play.hosting` (Port: `25565`)\n• **Bedrock Port:** `19132` (ViaVersion Enabled!)\n• **Minecraft Version:** 1.26.2 (PaperMC Build #65)\n• **Store:** `https://krylosmp-store.vercel.app`',
    color: 0x00FF66
  },
  'socials': {
    title: '📱 KryloSMP Official Social Links',
    description: 'Connect with our community across all official social portals!\n\n• **Website & Store:** `https://krylosmp-store.vercel.app`\n• **GitHub Portal:** `https://github.com/Krylo-60`\n• **YouTube & TikTok:** `@KryloSMP`',
    color: 0xFFAA00
  },
  'faq': {
    title: '❓ Frequently Asked Questions (FAQ)',
    description: '• **Q: How do I join the server?**\n  A: Connect to `KryloSmp.play.hosting` on Minecraft 1.26.x Java or Bedrock!\n\n• **Q: How do I get KryloCoins?**\n  A: Type `/daily` and `/work` in Discord, or link your account in-game!\n\n• **Q: How do I open a support ticket?**\n  A: Type `/ticket` or visit `#support-tickets`!',
    color: 0x9900FF
  },
  'verify': {
    title: '✅ Minecraft Account Verification',
    description: 'Link your Discord account with your Minecraft in-game username to earn bonus KryloCoins, role sync, and rank rewards!\n\nType `/verify` or click the button below in-game to start!',
    color: 0x00FF66
  },
  'suggestions': {
    title: '💡 Community Suggestions Channel',
    description: 'Have a cool idea for KryloSMP? Share your plugin requests, kit suggestions, and feature ideas here! Staff review all top voted posts.',
    color: 0x00F2FF
  },
  'support-tickets': {
    title: '🎟️ Support & Assistance Tickets',
    description: 'Need help from staff, lost items, or found a bug?\nType `/ticket reason:...` or click the **Create Ticket** button to open a private assistance channel with staff!',
    color: 0xFF0055
  },
  'store': {
    title: '🛒 KryloSMP Official Webstore',
    description: 'Upgrade your in-game experience! Purchase VIP, MVP, GOD, and Krylo God ranks, seasonal crate keys, and claim coins!\n\nVisit: `https://krylosmp-store.vercel.app`',
    color: 0xFFAA00
  },
  'general-chat': {
    title: '💬 Welcome to General Chat!',
    description: 'This is the heart of the KryloSMP community! Chat with other players, discuss your builds, and make new friends.\n\nType `/help` or `/ask` to chat with **Krims Code AI**!',
    color: 0x00F2FF
  },
  'polls': {
    title: '📊 Server Polls & Community Voting',
    description: 'Vote on upcoming server features, game modes, and seasonal events in this channel!',
    color: 0x9900FF
  },
  'memes': {
    title: '😂 Minecraft Memes & Gaming Fun',
    description: 'Share your funniest Minecraft memes and clip moments here! Use `/meme` or `/joke` to get started.',
    color: 0x00FF66
  },
  'music-chat': {
    title: '🎵 Music & Lounge Chat',
    description: 'Share your favorite songs, playlists, and music vibes with the community!',
    color: 0xFF007F
  },
  'bot-commands': {
    title: '🤖 Bot Commands Hub',
    description: 'Test all Discord bot commands here!\n\nTry:\n• `/daily` & `/work` - Claim free KryloCoins!\n• `/slots bet:50` - Play casino slots!\n• `/bday` - Celebrate birthdays!\n• `/rank` - View chat level & XP leaderboard!',
    color: 0x00F2FF
  },
  'marketplace': {
    title: '🏪 In-Game Player Marketplace',
    description: 'Trade items, advertise shop coordinates, and buy/sell goods with other players using KryloCoins!',
    color: 0xFFAA00
  }
};

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    console.log('\n--- 📋 KRYLOSMP GUILD CHANNELS LIST ---');
    const textChannels = [];

    channels.forEach(c => {
      if (c && c.type === ChannelType.GuildText) {
        textChannels.push(c);
        console.log(`• ID: ${c.id} | #${c.name} (Category: ${c.parent ? c.parent.name : 'None'})`);
      }
    });

    console.log(`\n[+] Found ${textChannels.length} text channels. Broadcasting messages...\n`);

    for (const channel of textChannels) {
      const matchKey = Object.keys(channelAnnouncements).find(k => channel.name.toLowerCase().includes(k));
      const info = matchKey ? channelAnnouncements[matchKey] : {
        title: `📌 Welcome to #${channel.name}`,
        description: `Official channel for ${guild.name}. Keep all discussions friendly and respectful!`,
        color: 0x00F2FF
      };

      const embed = new EmbedBuilder()
        .setColor(info.color)
        .setTitle(info.title)
        .setDescription(info.description)
        .setFooter({ text: `${guild.name} • Official Channel Header` })
        .setTimestamp();

      try {
        await channel.send({ embeds: [embed] });
        console.log(`[✅ Sent] Broadcast sent to #${channel.name}`);
      } catch (err) {
        console.warn(`[❌ Failed] Could not send to #${channel.name}: ${err.message}`);
      }
    }

    console.log('\n[🎉 COMPLETE] Broadcast finished across all channels!');
    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error during broadcast:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
