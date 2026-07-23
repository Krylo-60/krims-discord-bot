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

// Ultra-personalized custom messages for EVERY SINGLE text channel (27 total)
const personalizedMessages = {
  'rules': {
    title: '📜 #rules • Official KryloSMP Network Guidelines',
    description: 'Welcome to KryloSMP! To ensure an enjoyable and fair gaming environment for all players, please review our official rules:\n\n' +
      '1. **Respect Everyone:** No toxicity, hate speech, racism, or harassment.\n' +
      '2. **Fair Play Only:** Hacked clients (Fly, KillAura, X-Ray), duping, and macros result in an instant permanent ban.\n' +
      '3. **No Advertising:** Do not post IPs, invite links, or self-promotion for external servers.\n' +
      '4. **Staff Decisions:** Respect staff members. If you wish to appeal a moderation action, open a ticket in <#1524882737230774332>.\n\n' +
      '*By staying in the server, you agree to follow these rules at all times.*',
    color: 0xFF0055
  },
  'build-showcase': {
    title: '🏗️ #build-showcase • Share Your Epic Minecraft Creations',
    description: 'Proud of your mega base, automatic redstone farm, or custom spawn build?\n\n' +
      '• **Post Screenshots & Videos:** Share your screenshots and Litematica schematics!\n' +
      '• **Get Feedback:** Ask fellow builders for tips and aesthetic advice.\n' +
      '• **Build of the Month:** Top voted builds featured in our official showcase announcements!',
    color: 0x00FF66
  },
  'support-tickets': {
    title: '🎫 #support-tickets • Staff Support & Assistance Center',
    description: 'Need help from our administration team, lost items, or found a severe bug?\n\n' +
      '• **How to open a ticket:** Type `/ticket reason:Your Reason Here` or click the button below.\n' +
      '• **Private Support:** A private channel will be created between you and staff.\n' +
      '• **Response Time:** Our Krims AI auto-assists instantly, and staff will review your case shortly!',
    color: 0x00F2FF
  },
  'bug-reports': {
    title: '🐛 #bug-reports • Issue Tracking & Glitch Reports',
    description: 'Encountered a bug on the server or webstore? Help us fix it!\n\n' +
      '• **Include Details:** Mention your Minecraft username, location coordinates, and steps to reproduce.\n' +
      '• **Reward:** Reporting game-breaking bugs awards bonus KryloCoins!\n' +
      '• **Do Not Exploit:** Exploiting bugs for personal gain will result in account reset.',
    color: 0xFFCC00
  },
  'staff-chat': {
    title: '📝 #staff-chat • Private Staff Operations Lounge',
    description: 'Internal communication channel for KryloSMP Moderators and Administrators.\n\n' +
      '• Coordinate server maintenance and player moderation.\n' +
      '• Discuss player appeals and ticket escalations.\n' +
      '• Review server logs and anti-cheat alerts.',
    color: 0x9900FF
  },
  'polls': {
    title: '📊 #polls • Community Voting & Server Direction',
    description: 'Your voice matters! Vote on official polls regarding new plugins, game modes, and seasonal server events.\n\n' +
      '• Click the reactions below to cast your vote.\n' +
      '• Top voted community features are prioritized for development!',
    color: 0x00F2FF
  },
  'leaderboards': {
    title: '👑 #leaderboards • KryloSMP Hall of Fame',
    description: 'Check out the top chatters, wealthiest players, and highest-ranked activity leaders!\n\n' +
      '• **XP Rank:** Type `/rank` or `/xpleaderboard` to check your chat activity placement.\n' +
      '• **Wealth Leaders:** Top KryloCoin holders are rewarded monthly with free store voucher codes!',
    color: 0xFFAA00
  },
  'mod-logs': {
    title: '🛡️ #mod-logs • Security & Audit Logging',
    description: 'Automated channel for logging staff warnings, message purges, and moderation actions.\n\n' +
      '• Keeps our server safe, transparent, and audited 24/7.',
    color: 0xFF0055
  },
  'announcements': {
    title: '📢 #announcements • Major Network News & Events',
    description: 'Stay up to date with the latest KryloSMP releases, patch notes, store sales, and community events!\n\n' +
      '• Make sure to turn on notifications for this channel so you never miss an event!',
    color: 0x00F2FF
  },
  'server-info': {
    title: 'ℹ️ #server-info • Connection Specs & Network Details',
    description: 'Everything you need to connect to KryloSMP:\n\n' +
      '• **Java Server IP:** `KryloSmp.play.hosting` (Port: `25565`)\n' +
      '• **Bedrock IP & Port:** `KryloSmp.play.hosting` (Port: `19132`)\n' +
      '• **Minecraft Version:** 1.26.2 (ViaVersion compatible with 1.16+)\n' +
      '• **Host Location:** High-performance dedicated server with DDoS protection.',
    color: 0x00FF66
  },
  'socials': {
    title: '🌐 #socials • Official Portals & Social Media',
    description: 'Follow KryloSMP across all official community platforms:\n\n' +
      '• **Official Store:** `https://krylosmp-store.vercel.app`\n' +
      '• **GitHub Source:** `https://github.com/Krylo-60`\n' +
      '• **YouTube & TikTok:** Search `@KryloSMP` for build showcases & clips!',
    color: 0xFFAA00
  },
  'verify': {
    title: '✅ #verify • Link Your Minecraft Account',
    description: 'Link your Discord tag with your Minecraft username to receive bonus rewards!\n\n' +
      '• **Perks:** Unlocks Verified role, syncs in-game KryloCoins balance, and unlocks chat XP rewards.\n' +
      '• **How:** Join `KryloSmp.play.hosting`, copy your 5-digit link code in-game, and click the Verify button!',
    color: 0x00FF66
  },
  'general-chat': {
    title: '💬 #general-chat • The Main Community Hub',
    description: 'The central chatroom for the KryloSMP community!\n\n' +
      '• Talk about your Minecraft adventures, share stories, and make friends.\n' +
      '• **Note:** Keep bot commands in <#1526685119375478997> to maintain a clean general chat!',
    color: 0x00F2FF
  },
  'suggestions': {
    title: '💡 #suggestions • Submit Feature Ideas',
    description: 'Have an awesome idea to improve KryloSMP?\n\n' +
      '• Submit plugin ideas, kit balances, or website improvements.\n' +
      '• Upvote suggestions you agree with!',
    color: 0x00F2FF
  },
  'memes': {
    title: '😂 #memes • Funny Clips & Minecraft Humor',
    description: 'Share your favorite Minecraft memes, funny server moments, and jokes!\n\n' +
      '• Type `/meme` or `/joke` to fetch random gaming memes instantly!',
    color: 0xFF007F
  },
  'bot-commands': {
    title: '🤖 #bot-commands • Command & Economy Center',
    description: 'Run all Krims Code AI bot commands here!\n\n' +
      '• `/daily` - Claim free daily +250 KryloCoins!\n' +
      '• `/work` - Work minigames for 100-300 KC!\n' +
      '• `/slots bet:100` - Spin the casino slot machine!\n' +
      '• `/bday` - Celebrate birthdays & get bonus KC!\n' +
      '• `/rank` - View chat level, rank & XP progress!',
    color: 0x00F2FF
  },
  'players-online': {
    title: '🟢 #players-online • Live Player Count Telemetry',
    description: 'Displays real-time Minecraft server status and online player count.\n\n' +
      '• Server Address: `KryloSmp.play.hosting`',
    color: 0x00FF66
  },
  'faq': {
    title: '❓ #faq • Frequently Asked Questions',
    description: 'Quick answers to common questions:\n\n' +
      '• **Q: How do I claim daily coins?** Type `/daily` in <#1526685119375478997>!\n' +
      '• **Q: Where is the store?** Visit `https://krylosmp-store.vercel.app`!\n' +
      '• **Q: How do I report a player?** Open a ticket in <#1524882737230774332>.',
    color: 0x9900FF
  },
  'music-chat': {
    title: '🎵 #music-chat • Music, Playlists & Vibes',
    description: 'Share your favorite songs, Spotify playlists, and gaming music vibes with the server!',
    color: 0xFF007F
  },
  'pvp-chat': {
    title: '⚔️ #pvp-chat • PvP Arena & Duel Matchmaking',
    description: 'The home for KryloSMP gladiators and PvP combatants!\n\n' +
      '• **Challenge Players:** Type `!challenge @user` to issue a duel invitation.\n' +
      '• **Discuss Tactics:** Share kit setups, sword enchantments, and arena strategies.',
    color: 0xFF0055
  },
  'marketplace': {
    title: '🛒 #marketplace • In-Game Player Trading',
    description: 'Buy, sell, and trade items with other players!\n\n' +
      '• Advertise your player shop coordinates.\n' +
      '• Transfer KryloCoins securely using `/pay user:@player amount:500`.',
    color: 0xFFAA00
  },
  'media-clips': {
    title: '📷 #media-clips • YouTube Videos & Highlights',
    description: 'Share your YouTube videos, TikTok clips, and stream highlights recorded on KryloSMP!',
    color: 0x00F2FF
  },
  'tournaments': {
    title: '🏆 #tournaments • Event Schedule & Brackets',
    description: 'Official announcements for seasonal PvP tournaments, parkour races, and building contests!',
    color: 0xFFAA00
  },
  'giveaways': {
    title: '🎉 #giveaways • Active Giveaways & Prizes',
    description: 'Win free VIP rank upgrades, crate keys, and massive KryloCoin bundles!\n\n' +
      '• Click the 🎉 reaction to enter active giveaways.',
    color: 0x00FF66
  },
  'server-updates': {
    title: '📰 #server-updates • Technical Build & Patch Logs',
    description: 'Automated updates regarding PaperMC builds, server restart alerts, and technical patch notes.',
    color: 0x00F2FF
  },
  'tournament-july-2026': {
    title: '🏆 #tournament-july-2026 • July 2026 PvP Championship',
    description: 'Special channel for the July 2026 KryloSMP PvP Tournament! View brackets, match schedules, and prize pools.',
    color: 0xFF0055
  },
  'store': {
    title: '🛒 #store • Webstore Ranks & Crate Packages',
    description: 'Support the network and unlock exclusive perks!\n\n' +
      '• **Ranks Available:** VIP, MVP, GOD, Krylo God\n' +
      '• **Perks:** Special chat prefixes, fly access, claim blocks, and kit unlocks!\n' +
      '• **Website:** `https://krylosmp-store.vercel.app`',
    color: 0xFFAA00
  }
};

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    console.log(`\n[+] Found ${channels.size} total channels. Broadcasting personalized messages...\n`);

    for (const [id, channel] of channels) {
      if (!channel || channel.type !== ChannelType.GuildText) continue;

      let matchedInfo = null;
      for (const key of Object.keys(personalizedMessages)) {
        if (channel.name.toLowerCase().includes(key)) {
          matchedInfo = personalizedMessages[key];
          break;
        }
      }

      if (!matchedInfo) {
        matchedInfo = {
          title: `📌 Welcome to #${channel.name}`,
          description: `Official channel for ${guild.name}. Keep all discussions friendly and respectful!`,
          color: 0x00F2FF
        };
      }

      const embed = new EmbedBuilder()
        .setColor(matchedInfo.color)
        .setTitle(matchedInfo.title)
        .setDescription(matchedInfo.description)
        .setFooter({ text: `${guild.name} • Official Channel Header` })
        .setTimestamp();

      try {
        await channel.send({ embeds: [embed] });
        console.log(`[✅ Sent] Personalized header sent to #${channel.name}`);
      } catch (err) {
        console.warn(`[❌ Failed] Could not send to #${channel.name}: ${err.message}`);
      }
    }

    console.log('\n[🎉 COMPLETE] Ultra-personalized broadcast finished across all 27 channels!');
    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error during personalized broadcast:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
