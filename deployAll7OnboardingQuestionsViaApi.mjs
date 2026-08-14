import dotenv from 'dotenv';
dotenv.config();

const GUILD_ID = '1524878881918685405';

async function deploy7Questions() {
  console.log("🚀 Deploying full 7 Onboarding & Customization Questions via Discord REST API...");

  // 1. Fetch current guild channels & roles to link exact IDs
  const chRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
  });
  const channels = await chRes.json();

  const roleRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/roles`, {
    headers: { Authorization: `Bot ${process.env.DISCORD_TOKEN}` }
  });
  const roles = await roleRes.json();

  const getCh = (name) => {
    const found = channels.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
    return found ? [found.id] : [];
  };

  const getRole = (name) => {
    const found = roles.find(r => r.name.toLowerCase().includes(name.toLowerCase()));
    return found ? [found.id] : [];
  };

  const defaultChannels = [
    ...getCh('rules'),
    ...getCh('welcome'),
    ...getCh('server-info'),
    ...getCh('server-announcements'),
    ...getCh('general-chat'),
    ...getCh('bot-commands')
  ].filter(id => id);

  let idCounter = 1;
  const generateId = () => String(BigInt(Date.now()) * 4194304n + BigInt(idCounter++));

  const prompts = [
    // Question 1: What brings you to KryloSMP?
    {
      id: "1531846686480269427",
      title: "What brings you to KryloSMP? 🎯",
      single_select: false,
      required: true,
      in_onboarding: true,
      type: 0,
      options: [
        { id: "1531846686480269430", title: "💬 Chatting & community", description: "Join survival discussions", role_ids: [], channel_ids: getCh('general-chat') },
        { id: "1531846686480269431", title: "🏰 Building & creating", description: "Show off your mega-builds", role_ids: [], channel_ids: getCh('media-clips') },
        { id: "1531846686480269432", title: "⚔️ PvP & competitive play", description: "Duels, clans, and tournaments", role_ids: [], channel_ids: getCh('pvp-chat') },
        { id: "1531846686480269433", title: "🎁 Giveaways & events", description: "Win ranks, items, and prizes", role_ids: getRole('giveaway'), channel_ids: getCh('giveaways') }
      ]
    },
    // Question 2: What platform do you play on?
    {
      id: "1531846686480269434",
      title: "What platform do you play on? 🎮",
      single_select: true,
      required: false,
      in_onboarding: true,
      type: 0,
      options: [
        { id: "1531846686614356002", title: "☕ Java Edition", description: "PC / Mac / Linux (Port 25565)", role_ids: getRole('java'), channel_ids: getCh('server-info') },
        { id: "1531846686614356003", title: "📱 Bedrock Edition", description: "Mobile / Console / Windows (Port 19132)", role_ids: getRole('bedrock'), channel_ids: getCh('server-info') },
        { id: "1531846686614356004", title: "🖥️ Both / Cross-play", description: "I play on both editions", role_ids: [], channel_ids: getCh('server-info') }
      ]
    },
    // Question 3: What notifications do you want?
    {
      id: "1537613233190600826",
      title: "🔔 What notifications do you want to receive?",
      single_select: false,
      required: false,
      in_onboarding: true,
      type: 0,
      options: [
        { id: "1537613233190600829", title: "📢 Major Server Announcements", description: "Updates and patch notes", role_ids: getRole('announcement'), channel_ids: getCh('server-announcements') },
        { id: "1537613233190600830", title: "📺 YouTube & Video Alerts", description: "New KryloSMP video premieres", role_ids: getRole('announcement'), channel_ids: getCh('youtube-announcements') },
        { id: "1537613233190600831", title: "🎁 Giveaways & Free KC Drops", description: "Daily rewards & VIP giveaways", role_ids: getRole('giveaway'), channel_ids: getCh('giveaways') },
        { id: "1537613233190600832", title: "🏆 Tournaments & PvP Events", description: "Monthly tournaments & brackets", role_ids: [], channel_ids: getCh('tournament') }
      ]
    },
    // Question 4: What is your playstyle?
    {
      id: "1537613233190600833",
      title: "👑 What is your primary playstyle on KryloSMP?",
      single_select: false,
      required: false,
      in_onboarding: true,
      type: 0,
      options: [
        { id: "1537613233454719088", title: "⚔️ Clan Leader / PvP Warrior", description: "Factions, outposts, and duels", role_ids: [], channel_ids: getCh('clan-recruitment') },
        { id: "1537613233454719089", title: "💰 Economy Tycoon & Trader", description: "Shop, trade items, and jackpot", role_ids: [], channel_ids: getCh('item-trading') },
        { id: "1537613233454719090", title: "🎬 Content Creator / Streamer", description: "Media clips and partnerships", role_ids: getRole('creator'), channel_ids: getCh('partnerships') },
        { id: "1537613233454719091", title: "🌲 Chill Survival Builder", description: "Resource gathering and mega builds", role_ids: [], channel_ids: getCh('general-chat') }
      ]
    },
    // Question 5: What region do you play from?
    {
      id: generateId(),
      title: "🌍 What region or timezone do you play from?",
      single_select: true,
      required: false,
      in_onboarding: false, // In Channels & Roles Customize tab
      type: 0,
      options: [
        { id: generateId(), title: "🇺🇸 North America (NA East / West)", description: "EST / CST / PST", role_ids: [], channel_ids: getCh('general-chat') },
        { id: generateId(), title: "🇪🇺 Europe (EU / UK)", description: "GMT / CET / BST", role_ids: [], channel_ids: getCh('general-chat') },
        { id: generateId(), title: "🇮🇳 Asia / India (IST)", description: "IST / Asia Timezones", role_ids: [], channel_ids: getCh('general-chat') },
        { id: generateId(), title: "🇦🇺 Oceania / Australia (OCE)", description: "AEST / NZST", role_ids: [], channel_ids: getCh('general-chat') }
      ]
    },
    // Question 6: Which community activities interest you?
    {
      id: generateId(),
      title: "🎨 Which community activities interest you the most?",
      single_select: false,
      required: false,
      in_onboarding: false, // In Channels & Roles Customize tab
      type: 0,
      options: [
        { id: generateId(), title: "📷 Screenshots, Clips & Fan Art", description: "Post epic gameplay clips", role_ids: [], channel_ids: getCh('media-clips') },
        { id: generateId(), title: "😂 Memes & Gaming Humor", description: "Share funny Minecraft memes", role_ids: [], channel_ids: getCh('memes') },
        { id: generateId(), title: "🎵 Music & Listening Lounges", description: "Share playlists and tracks", role_ids: [], channel_ids: getCh('music-chat') },
        { id: generateId(), title: "🤖 Bot Games & Casino Economy", description: "Play /blackjack, /slots, and /work", role_ids: [], channel_ids: getCh('bot-commands') }
      ]
    }
  ];

  // Default channels matching Discord verified permissions
  const defaultChannelIds = [
    "1524882716468842720",
    "1537229821120352288",
    "1537229824702025828",
    "1537264469217120337",
    "1537263896937893948",
    "1537229823515033661"
  ];

  const payload = {
    prompts: prompts,
    default_channel_ids: defaultChannelIds,
    enabled: true,
    mode: 1 // ONBOARDING_ADVANCED
  };

  const putRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/onboarding`, {
    method: 'PUT',
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  console.log('PUT Onboarding Response Status:', putRes.status);
  const resData = await putRes.json();
  if (putRes.ok) {
    console.log(`✅ Successfully deployed ${resData.prompts.length} Onboarding Questions in ADVANCED Mode!`);
  } else {
    console.warn('API Error Response:', JSON.stringify(resData, null, 2));
  }

  process.exit(0);
}

deploy7Questions();
