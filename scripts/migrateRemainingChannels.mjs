import dotenv from 'dotenv';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} from 'discord.js';

dotenv.config();

const KRIMS_CODE_ID = '1523794466740371586';
const GUILD_ID = '1538225337048236082';

const STORE_VERCEL_URL = 'https://krylosmp-store-website.vercel.app/';
const MAIN_PORTAL_URL = 'https://krylosmp.web.app/';

const ksmpClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const krimsClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

async function main() {
  await Promise.all([
    ksmpClient.login(process.env.KSMP_BOT_TOKEN),
    krimsClient.login(process.env.DISCORD_TOKEN)
  ]);

  const ksmpGuild = await ksmpClient.guilds.fetch(GUILD_ID);
  const krimsGuild = await krimsClient.guilds.fetch(GUILD_ID);

  async function purgeKrims(channelId) {
    try {
      const ch = await krimsGuild.channels.fetch(channelId).catch(() => null);
      if (!ch || !ch.isTextBased()) return;
      const msgs = await ch.messages.fetch({ limit: 25 }).catch(() => null);
      if (!msgs) return;
      const krimsMsgs = msgs.filter(m => m.author.id === KRIMS_CODE_ID);
      for (const m of krimsMsgs.values()) {
        await m.delete().catch(() => {});
      }
    } catch (_) {}
  }

  // Channel configs for secondary channels
  const channelsToUpgrade = [
    {
      name: '😂・memes',
      title: '😂 KRYLOSMP — MEME VAULT & GAMING HUMOR',
      color: 0xEC4899,
      desc: 'Share your funniest Minecraft memes, KryloSMP gameplay clips, and gamer humor!\n\n• Keep memes friendly and SFW for all ages.\n• No spamming repetitive images or off-topic links.'
    },
    {
      name: '💡・suggestions',
      title: '💡 KRYLOSMP — COMMUNITY SUGGESTIONS & IDEAS',
      color: 0xF59E0B,
      desc: 'Have a cool idea for KryloSMP? Post your suggestions here!\n\n• Suggest new plugins, kits, events, crate rewards, or discord features.\n• Community members can react with 👍 or 👎 to vote on proposals!'
    },
    {
      name: '🎵・music-chat',
      title: '🎵 KRYLOSMP — MUSIC & AUDIO LOUNGE',
      color: 0x8B5CF6,
      desc: 'Share and discuss your favorite songs, Spotify playlists, and music vibes while grinding on KryloSMP!'
    },
    {
      name: '📷・media-clips',
      title: '🎬 KRYLOSMP — MEDIA, CLIPS & SHOWCASE',
      color: 0x3B82F6,
      desc: 'Showcase your greatest KryloSMP moments!\n\n• Share clutch PvP clips, insane builds, megabase screenshots, and stream highlights.\n• Tag your YouTube or Twitch videos!'
    },
    {
      name: '🎁・giveaways',
      title: '🎁 KRYLOSMP — OFFICIAL COMMUNITY GIVEAWAYS',
      color: 0x10B981,
      desc: 'Welcome to the Official KryloSMP Giveaway Arena!\n\n• Win free Sovereign & Overlord Ranks, Godly Crate Keys, and millions of KryloCoins ($Kr)!\n• Stay tuned for weekly drops hosted by server leadership.'
    },
    {
      name: '💭・question-of-the-day',
      title: '💭 KRYLOSMP — QUESTION OF THE DAY',
      color: 0x06B6D4,
      desc: 'Engage with fellow community members with our daily discussion prompts!\n\n• Answer the daily question and chat about your favorite Minecraft memories.'
    },
    {
      name: '⭐・starboard',
      title: '⭐ KRYLOSMP — HALL OF FAME STARBOARD',
      color: 0xEAB308,
      desc: 'The best and funniest community messages get immortalized here!\n\n• React with ⭐ on any legendary message across chat channels to vote it onto the Starboard!'
    },
    {
      name: '🤫・confessions',
      title: '🤫 KRYLOSMP — ANONYMOUS CONFESSIONS',
      color: 0x64748B,
      desc: 'Share your thoughts, hot takes, and funny secrets anonymously!'
    },
    {
      name: '🎬・content-creators',
      title: '🎬 KRYLOSMP — CONTENT CREATORS HUB',
      color: 0xEF4444,
      desc: 'Dedicated creator portal for YouTubers, TikTokers, and Streamers covering KryloSMP!\n\n• Apply for Creator Rank via support tickets once you publish a video on KryloSMP.'
    },
    {
      name: '🎪・events',
      title: '🎪 KRYLOSMP — WEEKLY EVENTS & ACTIVITIES',
      color: 0x8B5CF6,
      desc: 'Stay informed about all upcoming server events!\n\n• Build Battles, Ender Dragon Raids, BoxPvP Tournaments, and Hide & Seek competitions.'
    },
    {
      name: '👤・introductions',
      title: '👤 KRYLOSMP — MEMBER INTRODUCTIONS',
      color: 0x14B8A6,
      desc: 'New to the server? Introduce yourself!\n\n• Share your Minecraft IGN, favorite gamemode, how you found KryloSMP, and what you love doing in-game.'
    },
    {
      name: '💡・tips-and-tricks',
      title: '💡 KRYLOSMP — PRO TIPS & TRICKS',
      color: 0xF59E0B,
      desc: 'Dominate KryloSMP with these pro survival & PvP strategies!\n\n• Level up your gear faster, master crystal PvP, and optimize ore farming in Redish BoxPvP.'
    },
    {
      name: '🛡️・clan-recruitment',
      title: '🏰 KRYLOSMP — CLAN RECRUITMENT & DIRECTORY',
      color: 0x6366F1,
      desc: 'Recruit warriors for your faction or find a clan to join!\n\n• Post clan banners, requirements, Discord invite links, and recruitment applications.'
    },
    {
      name: '🏆・clan-leaderboard',
      title: '🏆 KRYLOSMP — CLANS & FACTIONS LEADERBOARD',
      color: 0xEAB308,
      desc: 'Verified live standings of registered KryloSMP clans!\n\n• Dominate territory, win clan wars, and earn server-wide prestige.'
    },
    {
      name: '🏰・ksmp-clan-chat',
      title: '🏰 KRYLOSMP — OFFICIAL CLAN LOUNGE',
      color: 0x8B5CF6,
      desc: 'Official discussion hub for registered clan leaders, officers, and faction operatives.'
    },
    {
      name: '🤝・item-trading',
      title: '🤝 KRYLOSMP — PLAYER MARKETPLACE & TRADING',
      color: 0x10B981,
      desc: 'Buy, sell, and trade rare in-game gear, crate keys, enchanted books, and materials safely with other players!'
    },
    {
      name: '💰・jackpot-vault',
      title: '🎰 KRYLOSMP — JACKPOT & CASINO VAULT',
      color: 0xF59E0B,
      desc: 'Feeling lucky? Enter the server Jackpot with your KryloCoins ($Kr) to win massive prize pools!'
    },
    {
      name: '🎯・bounty-board',
      title: '🎯 KRYLOSMP — BOUNTY BOARD (HUNT OR BE HUNTED)',
      color: 0xDC2626,
      desc: 'Place KryloCoin bounties on your rivals or hunt down target players in Lifesteal & BoxPvP for instant rewards!'
    },
    {
      name: '⚔️・pvp-chat',
      title: '⚔️ KRYLOSMP — PVP ARENA & DUELS DISCUSSION',
      color: 0xEF4444,
      desc: 'Discuss PvP mechanics, arrange 1v1 duels, challenge rivals, and debate kit tier lists!'
    },
    {
      name: '🏆・monthly-tournament',
      title: '🏆 KRYLOSMP — MONTHLY CHAMPIONSHIP ARENA',
      color: 0xEAB308,
      desc: 'Official announcements, rules, and brackets for our monthly competitive tournaments!'
    },
    {
      name: '🏆・tournament-september-2026',
      title: '🏆 KRYLOSMP — TOURNAMENT CHAMPIONSHIPS',
      color: 0x3B82F6,
      desc: 'Historic tournament archives, brackets, and hall-of-fame victors.'
    },
    {
      name: '🎁・rank-up-rewards',
      title: '🎁 KRYLOSMP — RANK UP REWARDS & MILESTONES',
      color: 0x10B981,
      desc: 'Level up by chatting and hanging out in voice channels to unlock free ranks, roles, and KryloCoins!\n\n• Level 1: Starter (100 Kr)\n• Level 5: Rookie (500 Kr)\n• Level 10: Explorer (1,000 Kr)\n• Level 25: Veteran (2,500 Kr)\n• Level 50: Golden Legend (5,000 Kr)\n• Level 100: Immortal Sovereign (10,000 Kr + Sovereign Rank)'
    },
    {
      name: '🤝・clan-alliances',
      title: '🤝 KRYLOSMP — FACTION ALLIANCES & DIPLOMACY',
      color: 0x06B6D4,
      desc: 'Ratify non-aggression pacts, military alliances, and trade coalitions between registered clans.'
    },
    {
      name: '📺・youtube-announcements',
      title: '📺 KRYLOSMP — OFFICIAL YOUTUBE HUB',
      color: 0xFF0000,
      desc: 'New video uploads, YouTube Shorts, and live streams from @KryloMCYT are broadcast here!'
    },
    {
      name: '📢・new-updates',
      title: '📢 KRYLOSMP — OFFICIAL UPDATES & PATCH NOTES',
      color: 0x10B981,
      desc: 'Track technical improvements, plugin updates, economy balancing, and season changelogs!'
    },
    {
      name: '📊・levels-and-rewards',
      title: '📊 KRYLOSMP — LEVELING & REWARDS DIRECTORY',
      color: 0x3B82F6,
      desc: 'Review all level milestones, XP requirements, and chat progression benefits!'
    },
    {
      name: '🤝・partnerships',
      title: '🤝 KRYLOSMP — OFFICIAL PARTNERSHIP PROGRAM',
      color: 0x8B5CF6,
      desc: 'Interested in partnering with KryloSMP? Open a creator/partner ticket in <#1542646331502366760> to collaborate!'
    },
    {
      name: '📋・changelog',
      title: '📋 KRYLOSMP — COMPLETE SERVER CHANGELOG',
      color: 0x64748B,
      desc: 'Documenting every commit, plugin upgrade, and bug fix deployed across our network.'
    }
  ];

  const allChannels = await ksmpGuild.channels.fetch();

  for (const cfg of channelsToUpgrade) {
    const ch = allChannels.find(c => c && c.type === ChannelType.GuildText && c.name.includes(cfg.name));
    if (!ch) continue;

    console.log(`Processing #${ch.name} (${ch.id})...`);
    await purgeKrims(ch.id);

    const embed = new EmbedBuilder()
      .setColor(cfg.color)
      .setTitle(cfg.title)
      .setAuthor({
        name: 'KryloSMP Official Network Protocol',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(cfg.desc)
      .setFooter({ text: 'KryloSMP • Built for Krylo 亗' })
      .setTimestamp();

    await ch.send({ embeds: [embed] }).catch(err => console.warn(`Send err in #${ch.name}:`, err.message));
    console.log(`  ✅ #${ch.name} successfully upgraded to KryloSMP Bot!`);
  }

  // Also purge level lounges (Level 1..100)
  console.log('Purging Krims embeds from level lounges...');
  const levelLounges = allChannels.filter(c => c && c.type === ChannelType.GuildText && c.name.includes('-lounge'));
  for (const [id, ch] of levelLounges) {
    await purgeKrims(id);
  }

  console.log('\n🎉 ALL SECONDARY CHANNELS SUCCESSFULLY UPGRADED TO KRYLOSMP BOT!');
  process.exit(0);
}

main().catch(err => {
  console.error('[Secondary Migration Error]:', err);
  process.exit(1);
});
