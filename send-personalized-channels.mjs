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

// Comprehensive 5-Section Master Headers for ALL 27 Channels
const masterChannelHeaders = {
  'rules': {
    title: '📜 #rules • KryloSMP Master Network Guidelines',
    color: 0xFF0055,
    fields: [
      { name: '1. Welcome & Network Vision', value: 'Welcome to the official KryloSMP Minecraft & Discord community! Our network is built to provide an immersive, competitive, and friendly SMP experience for Java and Bedrock players alike. To keep our server thriving, every player must uphold our core values of respect, sportsmanship, and fair play.' },
      { name: '2. Behavioral Ethics & Community Conduct', value: 'Treat all members and staff with courtesy. Toxicity, harassment, hate speech, discrimination, slurs, excessive caps lock, wall of text spamming, and NSFW content are strictly prohibited. Respect player privacy and refrain from posting personal information (doxxing) or malicious links.' },
      { name: '3. Fair Play, Anti-Cheat & Exploits Policy', value: 'KryloSMP enforces a zero-tolerance policy against cheating. Modified clients (X-Ray, Fly, KillAura, Auto-Clickers > 15 CPS), duping items, glitching through bedrock/barriers, and macro automation result in an immediate permanent ban. Report any discovered bugs to staff in <#1524882738123903168> for KryloCoins rewards!' },
      { name: '4. Advertising & External Promotion Rules', value: 'Promoting external Discord servers, competitor Minecraft networks, commercial websites, or self-promotional social media links without explicit administrator authorization is forbidden. Violators will receive automated warnings log entries in <#1524890354988617758> followed by server mutes.' },
      { name: '5. Moderation Enforcement & Appeals Process', value: 'Our administration team and Krims AI system actively enforce these rules. If you believe a warning, mute, or ban was issued in error, do not argue in general chat. Open an official support ticket in **<#1524882737230774332>** to submit your ban appeal to staff.' }
    ]
  },
  'server-info': {
    title: 'ℹ️ #server-info • Complete Technical Infrastructure & IP Specifications',
    color: 0x00FF66,
    fields: [
      { name: '1. Network Architecture Overview', value: 'KryloSMP is a state-of-the-art survival multiplayer network engineered on high-performance dedicated hardware running custom PaperMC server software (Build #65) with Cloudflare DDoS protection.' },
      { name: '2. Connection IP Addresses & Ports', value: '• **Java Edition IP:** `KryloSmp.play.hosting` (Port: `25565`)\n• **Bedrock Edition IP:** `KryloSmp.play.hosting` (Port: `19132`)\n• **Supported Client Versions:** 1.26.2 (ViaVersion supports 1.16 through 1.26.x!)' },
      { name: '3. In-Game Economy & Key Features', value: 'Features custom player land claims, player-driven economy (`/marketplace`), custom enchantments, PvP combat duels, monthly network tournaments, and automated server-wide XP boosters.' },
      { name: '4. Live Telemetry & Server Monitoring', value: 'Our network status and active player counts are monitored 24/7. Check live player counts in **<#1524890352979415242>** and technical patch logs in **<#1528407098122309935>**.' },
      { name: '5. Official Resource Links', value: '• **Webstore:** `https://krylosmp-store.vercel.app`\n• **Account Link Verification:** <#1526685112693952568>\n• **Support Tickets:** <#1524882737230774332>' }
    ]
  },
  'verify': {
    title: '✅ #verify • Account Integration & Link Verification Portal',
    color: 0x00FF66,
    fields: [
      { name: '1. Why Link Your Account?', value: 'Linking your Discord account with your Minecraft in-game username bridges your player profile across our network, allowing automated synchronization of ranks, coins, and chat privileges.' },
      { name: '2. Exclusive Account Linking Rewards', value: '• **Instant Discord Role:** Unlocks the `@Verified` member role.\n• **Bonus KryloCoins:** Instantly grants **+500 KryloCoins** to your wallet.\n• **Chat XP Multiplier:** Enables 2x XP leveling progression in Discord chat.' },
      { name: '3. Verification Rules & Requirements', value: 'You may only link ONE Discord account per Minecraft username. Alternate account linking or attempting to spoof codes will result in verification revocation.' },
      { name: '4. Step-by-Step Verification Guide', value: '1. Join `KryloSmp.play.hosting` in Minecraft.\n2. Copy your 5-digit verification code displayed on join.\n3. Type `!verify <code>` in Discord or click the **Enter Code** button below.\n4. Enjoy your linked rank perks!' },
      { name: '5. Troubleshooting & Support', value: 'If your code expires or fails to sync, run `!verify` again in-game to generate a fresh code, or open a support ticket in <#1524882737230774332>.' }
    ]
  },
  'announcements': {
    title: '📢 #announcements • Official KryloSMP Network News Portal',
    color: 0x00F2FF,
    fields: [
      { name: '1. Welcome to Announcements', value: 'This channel serves as the central news hub for KryloSMP. All critical server updates, store sales, seasonal events, and network announcements are broadcast here.' },
      { name: '2. Notification Settings & Roles', value: 'We respect your ping preferences! `@everyone` pings are reserved strictly for major event launches, network maintenance, and emergency announcements.' },
      { name: '3. Community Feedback & Discussions', value: 'To keep news threads easy to read, member chatter is restricted here. Discuss announcement topics in <#1526685114795298931> or leave suggestions in <#1526685117202825297>.' },
      { name: '4. Event Calendars & Patch Notes', value: 'Look out for our weekend PvP tournaments, holiday bonus XP events, and seasonal crate giveaways posted directly in this channel!' },
      { name: '5. Archival & Update Logs', value: 'Past patch notes and technical server build logs can also be audited in **<#1528407098122309935>**.' }
    ]
  },
  'general-chat': {
    title: '💬 #general-chat • The Main KryloSMP Community Lounge',
    color: 0x00F2FF,
    fields: [
      { name: '1. Welcome to General Chat', value: 'This is the beating heart of the KryloSMP community! Here, players gather to talk about Minecraft strategies, base designs, server adventures, and general gaming topics.' },
      { name: '2. Conversation Scope & Topics', value: 'Feel free to discuss anything gaming or community related! Keep conversations inclusive, friendly, and welcoming to new players.' },
      { name: '3. General Chat Etiquette & Rules', value: '• Speak English so everyone can participate.\n• Avoid excessive caps, wall-of-text spam, or repeating messages.\n• No toxic arguments or political debates.\n• **Keep bot commands in <#1526685119375478997>!**' },
      { name: '4. Krims Code AI Assistance', value: 'Our AI assistant **Krims Code AI** listens in general chat! Mention `@Krims Code AI` or type `/ask` to ask questions about server features, crafting recipes, or tech support.' },
      { name: '5. Important Redirections', value: '• **Need Staff Help?** <#1524882737230774332>\n• **Bot Games & Economy:** <#1526685119375478997>\n• **Trade Items:** <#1528406572210848055>' }
    ]
  },
  'bot-commands': {
    title: '🤖 #bot-commands • KryloCoins Economy & Mini-Games Center',
    color: 0x00F2FF,
    fields: [
      { name: '1. Command Hub Overview', value: 'Welcome to the official bot playground! To keep general chat clean, all bot slash commands, casino games, and economy tasks MUST be executed inside this channel.' },
      { name: '2. KryloCoins Economy & Wallet Commands', value: '• `/balance [user]` - Check your wallet balance and linked status.\n• `/pay user:@player amount:500` - Securely transfer KryloCoins to another player.' },
      { name: '3. Daily Rewards & Work Minigames', value: '• `/daily` - Claim your free daily **+250 KryloCoins** reward (24h cooldown).\n• `/work` - Work minigame jobs (mining, nether raids, brewing) to earn **100-300 KC** (1h cooldown).' },
      { name: '4. Casino Slots & Games', value: '• `/slots bet:100` - Spin the 3-reel casino slot machine (`💎 🍋 🍒 🔔 7️⃣ 🎰`) for up to **10x payout multipliers**!\n• `/eightball question:...` - Ask the Magic 8-Ball for instant predictions.' },
      { name: '5. Chat Activity Level & Ranks', value: '• `/rank [user]` - View your server activity level, total chat XP, and progress card.\n• `/xpleaderboard` - Display the top 10 most active chatters in the server!' }
    ]
  },
  'pvp-chat': {
    title: '⚔️ #pvp-chat • Arena Gladiator Lounge & Combat Matchmaking',
    color: 0xFF0055,
    fields: [
      { name: '1. Welcome to the Combat Hub', value: 'The official battlefield discussion channel for KryloSMP warriors! Discuss kit setups, weapon enchantments, arena coordinates, and PvP tactics.' },
      { name: '2. Duel Challenge System', value: 'Ready to fight? Issue a direct duel challenge to any member by typing `!challenge @username` in chat! The challenged player can accept or decline.' },
      { name: '3. Combat Rules & Honor Code', value: '• Combat logging (disconnecting mid-fight) results in inventory loss and a temporary ban.\n• No auto-clickers or KillAura modifications allowed.\n• Honor agreed duel stakes and wager terms.' },
      { name: '4. Kit Recommendations & Strategy', value: 'Discuss optimal Netherite protection, Sharpness VI swords, potion brewing recipes, and Ender Pearl movement techniques with top fighters.' },
      { name: '5. Tournament Standings & Clips', value: 'Check out official tournament announcements in **<#1528407093227556948>** and submit epic PvP combo clips in **<#1528407089205088518>**!' }
    ]
  },
  'tournament-july-2026': {
    title: '🏆 #tournament-july-2026 • July 2026 Championship Master Guide',
    color: 0xFF0055,
    fields: [
      { name: '1. July 2026 Tournament Overview', value: 'Welcome to the July 2026 KryloSMP Championship! This high-stakes tournament brings together the top fighters on the network to battle for glory, ranks, and massive KryloCoin rewards.' },
      { name: '2. Tournament Format & Single Elimination Rules', value: 'The tournament runs a Single Elimination Bracket format. Each match consists of a Best-of-3 (BO3) duel inside the Spawn Arena under administrator supervision.' },
      { name: '3. Kit Regulations & Allowed Equipment', value: '• **Provided Kits:** Standard Diamond/Netherite Protection IV gear provided by staff.\n• **Prohibited:** Chorus fruit, Notch apples, and custom modified clients.\n• **CPS Limit:** Maximum 15 CPS click rate enforced by anti-cheat.' },
      { name: '4. Schedule, Check-In & Match Timings', value: 'Matches begin at 18:00 UTC. Participants must check in 15 minutes prior in this channel. Failure to check in results in an automatic forfeiture.' },
      { name: '5. Prize Pool & Champion Rewards', value: '• 🥇 **1st Place:** GOD Rank Upgrade + 10,000 KryloCoins + Champion Role\n• 🥈 **2nd Place:** MVP Rank Upgrade + 5,000 KryloCoins\n• 🥉 **3rd Place:** 2,500 KryloCoins + Seasonal Crate Key' }
    ]
  },
  'store': {
    title: '🛒 #store • Official KryloSMP Webstore & Rank Directory',
    color: 0xFFAA00,
    fields: [
      { name: '1. Support the KryloSMP Network', value: 'Welcome to the store overview! Every purchase directly supports server hosting, dedicated hardware upgrades, and custom plugin development for the network.' },
      { name: '2. Server Rank Tiers & Exclusive Perks', value: '• **VIP:** Special prefix, `/fly` in claims, +5 Home sethomes, VIP Kit.\n• **MVP:** MVP prefix, `/feed`, `/heal`, 10 sethomes, MVP Kit.\n• **GOD:** GOD prefix, `/workbench`, `/enderchest`, GOD Kit.\n• **Krylo God:** Ultimate prefix, custom particle trails, max claim blocks, Krylo Kit.' },
      { name: '3. Webstore Checkout Address', value: 'Visit our official online storefront at: **`https://krylosmp-store.vercel.app`**' },
      { name: '4. Instant Fulfillment & SheetDB Verification', value: 'Purchases are processed automatically via SheetDB database webhooks (`wqiphi0bug49j`). Your rank commands are executed in-game within seconds of checkout!' },
      { name: '5. Customer Support & Voucher Redemption', value: 'Have a question before buying or redeeming a voucher code? Open a ticket in **<#1524882737230774332>** for instant staff help.' }
    ]
  },
  'support-tickets': {
    title: '🎫 #support-tickets • Private Assistance & Customer Service Portal',
    color: 0x00F2FF,
    fields: [
      { name: '1. Welcome to Support Tickets', value: 'Need private assistance from staff, lost items due to a server crash, or need to report a payment issue? Open a ticket here.' },
      { name: '2. How to Create a Ticket', value: '• Type `/ticket reason:Your Reason Here` in chat.\n• Or click the **Create Ticket** button below.\n• A private text channel will be generated automatically.' },
      { name: '3. Ticket Guidelines & Conduct', value: 'Please be patient after opening a ticket. Provide all relevant screenshots, usernames, and transaction IDs so staff can resolve your issue quickly.' },
      { name: '4. Automated AI Pre-Resolution', value: 'Our Krims AI engine inspects ticket reasons and attempts instant automated resolution (such as un-sticking players or checking balance logs).' },
      { name: '5. Closing Tickets', value: 'Once your issue is solved, staff or the player can type `/close` or click **Close Ticket** to save the log and archive the channel.' }
    ]
  },
  'bug-reports': {
    title: '🐛 #bug-reports • Technical Bug & Vulnerability Tracker',
    color: 0xFFCC00,
    fields: [
      { name: '1. Bug Tracker Overview', value: 'Help us maintain a flawless server experience by reporting glitches, duplication exploits, website errors, or plugin bugs here.' },
      { name: '2. How to Submit a Detailed Bug Report', value: 'Include:\n1. Your Minecraft Username.\n2. Server region or coordinates.\n3. Exact steps to reproduce the glitch.' },
      { name: '3. Bug Bounty Rewards', value: 'Reporting severe vulnerabilities or dupe glitches awards major KryloCoin bounties and special Discord bug hunter badges!' },
      { name: '4. Exploitative Conduct Warning', value: 'Using bugs for personal advantage or distributing dupes will result in an immediate network-wide ban and inventory wipe.' },
      { name: '5. Review & Patch Workflow', value: 'Our development team reviews bug submissions daily. Approved patches are logged in <#1528407098122309935>.' }
    ]
  },
  'staff-chat': {
    title: '📝 #staff-chat • Internal Moderator & Administrator Operations',
    color: 0x9900FF,
    fields: [
      { name: '1. Staff Operations Lounge', value: 'Private channel for KryloSMP Moderators, Senior Mods, and Network Administrators.' },
      { name: '2. Responsibilities & Standards', value: 'Maintain professionalism, fairness, and prompt support across tickets and in-game chat.' },
      { name: '3. Player Infractions & Logging', value: 'Log all ban actions, warning strikes, and mute durations in <#1524890354988617758>.' },
      { name: '4. Shift Coordination & Events', value: 'Coordinate event monitoring, tournament refereeing, and server update deployments.' },
      { name: '5. Confidentiality Policy', value: 'Internal staff discussions and security procedures must remain strictly confidential.' }
    ]
  },
  'polls': {
    title: '📊 #polls • Community Feedback & Network Decision Voting',
    color: 0x00F2FF,
    fields: [
      { name: '1. Voice Your Opinion', value: 'We shape KryloSMP based on player feedback! Vote on official network polls posted here.' },
      { name: '2. Voting Rules', value: 'Each player receives 1 vote per poll. Use the reaction buttons below the poll embed.' },
      { name: '3. Suggesting New Polls', value: 'Have a topic you want surveyed? Submit your poll idea in <#1526685117202825297>.' },
      { name: '4. Poll Results & Implementation', value: 'Winning options in community polls are directly implemented in upcoming server patches.' },
      { name: '5. Discussion Conduct', value: 'Keep poll discussions respectful and focused on server improvement.' }
    ]
  },
  'leaderboards': {
    title: '👑 #leaderboards • Network Hall of Fame & Rankings',
    color: 0xFFAA00,
    fields: [
      { name: '1. Hall of Fame Overview', value: 'Displays the top active players, richest economy moguls, and PvP champions on KryloSMP.' },
      { name: '2. Chat Activity Ranks', value: 'Earn XP by chatting in text channels! Type `/rank` to view your level card and `/xpleaderboard` for top 10.' },
      { name: '3. KryloCoins Wealth Rankings', value: 'Top holders of KryloCoins are featured here and receive exclusive store discount vouchers monthly.' },
      { name: '4. PvP Leaderboards', value: 'Top arena combatants with the highest kill/death ratios are ranked at the end of each season.' },
      { name: '5. Seasonal Leaderboard Resets', value: 'Leaderboards refresh seasonally with grand prize giveaways for top rankers!' }
    ]
  },
  'mod-logs': {
    title: '🛡️ #mod-logs • Public Moderation Audit & Warning Ledger',
    color: 0xFF0055,
    fields: [
      { name: '1. Audit Transparency Log', value: 'Automated channel recording moderation actions to ensure server safety and accountability.' },
      { name: '2. Logged Infractions', value: 'Displays automated warnings issued via `/warn`, message purges via `/purge`, mutes, and bans.' },
      { name: '3. Warning Strike System', value: 'Players receiving 3 warning strikes receive an automatic 24-hour server mute.' },
      { name: '4. Staff Accountability', value: 'Every action records the moderator ID, target player, reason, and timestamp.' },
      { name: '5. Questions & Appeals', value: 'Submit appeal inquiries regarding logged warnings in <#1524882737230774332>.' }
    ]
  },
  'suggestions': {
    title: '💡 #suggestions • Community Feature Requests & Ideas',
    color: 0x00F2FF,
    fields: [
      { name: '1. Submit Your Ideas', value: 'Have an idea for a new plugin, kit rebalance, or website feature? Post it here!' },
      { name: '2. Submission Format', value: 'Provide a clear title, description of the feature, and why it benefits the server.' },
      { name: '3. Voting & Upvotes', value: 'Community members can vote using 👍 and 👎 reactions.' },
      { name: '4. Developer Review', value: 'Suggestions reaching +15 net upvotes are reviewed by our lead developers.' },
      { name: '5. Accepted Features', value: 'Approved suggestions are added to our development roadmap and logged upon release!' }
    ]
  },
  'memes': {
    title: '😂 #memes • Funny Minecraft Memes & Gaming Clips',
    color: 0xFF007F,
    fields: [
      { name: '1. Welcome to the Meme Zone', value: 'Share your favorite Minecraft memes, funny server screenshots, and gaming humor!' },
      { name: '2. Bot Commands', value: 'Type `/meme` or `/joke` to fetch hilarious Minecraft memes and jokes automatically!' },
      { name: '3. Content Guidelines', value: 'Keep memes friendly, non-offensive, and safe for all community members.' },
      { name: '4. No Spamming', value: 'Limit image attachments to 3 per batch to keep chat clean.' },
      { name: '5. Meme of the Week', value: 'Top voted community memes win 500 bonus KryloCoins every Friday!' }
    ]
  },
  'players-online': {
    title: '🟢 #players-online • Live Server Status & Telemetry',
    color: 0x00FF66,
    fields: [
      { name: '1. Server Telemetry Monitor', value: 'Provides real-time updates on Minecraft server online state and active player counts.' },
      { name: '2. Direct Connection IP', value: 'Connect anytime at `KryloSmp.play.hosting`!' },
      { name: '3. Ping & Latency', value: 'Hosted on low-latency gigabit fiber nodes with 99.9% uptime guarantees.' },
      { name: '4. Maintenance Alerts', value: 'Scheduled restart pings and maintenance notices display here.' },
      { name: '5. Cross-Platform Support', value: 'Java & Bedrock players are tracked live in the telemetry feed.' }
    ]
  },
  'faq': {
    title: '❓ #faq • Frequently Asked Questions & Knowledge Base',
    color: 0x9900FF,
    fields: [
      { name: '1. How do I join KryloSMP?', value: 'Add server address `KryloSmp.play.hosting` in Minecraft Java (1.26.x) or Bedrock (Port: 19132).' },
      { name: '2. How do I earn KryloCoins?', value: 'Claim daily rewards with `/daily`, work jobs with `/work`, win casino slots (`/slots`), or participate in events!' },
      { name: '3. How do I buy store ranks?', value: 'Visit `https://krylosmp-store.vercel.app` to purchase VIP, MVP, GOD, or Krylo God ranks.' },
      { name: '4. How do I report a player or cheater?', value: 'Open a support ticket in <#1524882737230774332> with video evidence.' },
      { name: '5. How do I link my account?', value: 'Follow instructions in <#1526685112693952568> or run `!verify` in-game.' }
    ]
  },
  'music-chat': {
    title: '🎵 #music-chat • Music Recommendations & Playlist Lounge',
    color: 0xFF007F,
    fields: [
      { name: '1. Music Lounge', value: 'Share your favorite songs, Spotify playlists, YouTube music tracks, and gaming vibes!' },
      { name: '2. Voice Channel Sync', value: 'Join our Voice Lobbies to listen together while grinding on the server.' },
      { name: '3. Genre Variety', value: 'All genres welcome! Lofi, synthwave, EDM, hip-hop, rock, and gaming OSTs.' },
      { name: '4. Respectful Sharing', value: 'Avoid loud/earrape audio links or offensive lyrics.' },
      { name: '5. Weekly Playlist', value: 'Top recommended tracks are featured in our official community Spotify playlist!' }
    ]
  },
  'marketplace': {
    title: '🛒 #marketplace • In-Game Player Trading & Economy Hub',
    color: 0xFFAA00,
    fields: [
      { name: '1. Player Economy Hub', value: 'Buy, sell, and trade items, netherite armor, enchanted books, and shop coordinates!' },
      { name: '2. Trading Rules', value: 'Scamming in player trades is strictly bannable. Always verify trades before confirming.' },
      { name: '3. Secure Currency Transfers', value: 'Transfer KryloCoins safely using `/pay user:@player amount:500` in <#1526685119375478997>.' },
      { name: '4. Shop Advertisements', value: 'Advertise your spawn shop location and item price lists here!' },
      { name: '5. Price Checking', value: 'Ask experienced traders for market value advice on rare items and elytra kits.' }
    ]
  },
  'media-clips': {
    title: '📷 #media-clips • Community YouTube & TikTok Highlights',
    color: 0x00F2FF,
    fields: [
      { name: '1. Showcase Your Content', value: 'Post your YouTube videos, TikTok clips, Twitch streams, and epic gameplay highlights recorded on KryloSMP!' },
      { name: '2. Creator Roles', value: 'Active content creators can apply for the `@Creator` role in support tickets!' },
      { name: '3. Video Requirements', value: 'Ensure videos feature KryloSMP IP (`KryloSmp.play.hosting`) in the video description.' },
      { name: '4. Community Upvotes', value: 'Leave likes and comments on fellow creators content.' },
      { name: '5. Featured Creator of the Month', value: 'Top performing videos are pinned in announcements and rewarded with store vouchers!' }
    ]
  },
  'tournaments': {
    title: '🏆 #tournaments • Network Events & Championship Schedules',
    color: 0xFFAA00,
    fields: [
      { name: '1. Event Schedules', value: 'Official hub for server tournaments, build contests, parkour races, and PvP championships.' },
      { name: '2. Tournament Registrations', value: 'Register for upcoming events by following registration links posted in event threads.' },
      { name: '3. Tournament Rules', value: 'All events strictly enforce anti-cheat guidelines and staff referee rulings.' },
      { name: '4. Rewards & Prizes', value: 'Compete for real store rank upgrades, cash voucher codes, and exclusive Discord roles.' },
      { name: '5. Past Champions', value: 'View tournament archives and past championship hall of fame winners!' }
    ]
  },
  'giveaways': {
    title: '🎉 #giveaways • Server Rank & KryloCoins Giveaways',
    color: 0x00FF66,
    fields: [
      { name: '1. Free Server Rewards', value: 'Participate in official KryloSMP giveaways to win free rank upgrades, crate keys, and KryloCoins!' },
      { name: '2. How to Enter', value: 'Click the 🎉 reaction button on active giveaway messages to enter automatically.' },
      { name: '3. Entry Eligibility', value: 'Open to all verified Discord members. No purchase necessary.' },
      { name: '4. Winner Selection', value: 'Winners are chosen randomly by our automated giveaway bot upon timer expiration.' },
      { name: '5. Claiming Prizes', value: 'Prizes are credited automatically to your linked account or sent via ticket.' }
    ]
  },
  'server-updates': {
    title: '📰 #server-updates • PaperMC Build Logs & Patch Notes',
    color: 0x00F2FF,
    fields: [
      { name: '1. Technical Update Logs', value: 'Official channel for server updates, PaperMC build upgrades, and technical changelogs.' },
      { name: '2. Automated Restart Alerts', value: 'Server update warnings and maintenance restart schedules are logged here.' },
      { name: '3. PaperMC Build Version', value: 'Currently updated to **PaperMC Build #65** (Minecraft 1.26.2).' },
      { name: '4. Performance Enhancements', value: 'Logs details on lag optimizations, plugin updates, and bug fixes.' },
      { name: '5. Developer Notes', value: 'Direct insights from our lead network engineers.' }
    ]
  },
  'build-showcase': {
    title: '🏗️ #build-showcase • Architectural Showcase & Designs',
    color: 0x00FF66,
    fields: [
      { name: '1. Builder Lounge', value: 'Showcase your spawn bases, mega structures, redstone contraptions, and terraforming!' },
      { name: '2. Media Sharing', value: 'Attach screenshots, shaders preview clips, and Litematica build schematics.' },
      { name: '3. Constructive Feedback', value: 'Provide helpful design feedback and building techniques.' },
      { name: '4. Build Contests', value: 'Monthly building theme contests announced here with store prize rewards.' },
      { name: '5. Master Builder Rank', value: 'Top showcase contributors earn the elite `@Master Builder` Discord role!' }
    ]
  }
};

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    const channels = await guild.channels.fetch();

    console.log(`\n[+] Purging old messages and posting 5-section MASTER headers across ${channels.size} channels...\n`);

    for (const [id, channel] of channels) {
      if (!channel || channel.type !== ChannelType.GuildText) continue;

      try {
        // Fetch existing messages & purge old bot embeds
        const existing = await channel.messages.fetch({ limit: 50 }).catch(() => null);
        if (existing && existing.size > 0) {
          const botMsgs = existing.filter(m => m.author.id === client.user.id);
          if (botMsgs.size > 0) {
            await channel.bulkDelete(botMsgs, true).catch(() => {});
          }
        }

        // Find master header content
        let matchedHeader = null;
        for (const key of Object.keys(masterChannelHeaders)) {
          if (channel.name.toLowerCase().includes(key)) {
            matchedHeader = masterChannelHeaders[key];
            break;
          }
        }

        if (!matchedHeader) {
          matchedHeader = {
            title: `📌 Welcome to #${channel.name}`,
            color: 0x00F2FF,
            fields: [
              { name: '1. Welcome & Channel Purpose', value: `Welcome to official channel #${channel.name} on KryloSMP!` },
              { name: '2. Community Guidelines', value: 'Keep discussions friendly, constructive, and respectful at all times.' },
              { name: '3. Rules & Etiquette', value: 'No toxicity, excessive spamming, or advertising allowed.' },
              { name: '4. Support & Help', value: 'Need assistance? Open a support ticket in <#1524882737230774332>.' },
              { name: '5. Network Resources', value: 'Webstore: `https://krylosmp-store.vercel.app` | IP: `KryloSmp.play.hosting`' }
            ]
          };
        }

        const embed = new EmbedBuilder()
          .setColor(matchedHeader.color)
          .setTitle(matchedHeader.title)
          .addFields(matchedHeader.fields)
          .setFooter({ text: `${guild.name} • Master Channel Handbook & Guidelines` })
          .setTimestamp();

        await channel.send({ embeds: [embed] });
        console.log(`[✅ Sent Master Embed] Updated 5-section master header in #${channel.name}`);
      } catch (err) {
        console.warn(`[❌ Failed] Could not update #${channel.name}: ${err.message}`);
      }
    }

    console.log('\n[🎉 MASTER COMPLETE] 5-Section master headers deployed across all 27 channels!');
    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Error during master broadcast:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
