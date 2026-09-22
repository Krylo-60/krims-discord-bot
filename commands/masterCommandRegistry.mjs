import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

/**
 * MASTER COMMAND REGISTRY
 * Single source of truth for all Krims Code AI & KryloSMP slash commands.
 */
export const masterCommandBuilders = [
  // ──────────────────────────────────────────────────────────
  // 1. 🤖 KRIMS CODE AI & MULTI-BOT ENGINE
  // ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('setupbot')
    .setDescription('Deploy your own custom Discord bot with the Krims Code AI brain!'),

  new SlashCommandBuilder()
    .setName('custombot')
    .setDescription('Deploy your own custom Discord bot with the Krims Code AI brain! (Alias)'),

  new SlashCommandBuilder()
    .setName('about')
    .setDescription('Learn about the Krims Code AI Multi-Bot Engine and get your own free bot!'),

  new SlashCommandBuilder()
    .setName('getbot')
    .setDescription('Claim a FREE custom-branded bot for your server!'),

  new SlashCommandBuilder()
    .setName('pricing')
    .setDescription('View Krims Code AI tiers (Founder, Pro, Premium, Enterprise)!'),

  new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask the Krims Code AI neural brain any question or query!')
    .addStringOption(opt => opt.setName('prompt').setDescription('Your question or prompt').setRequired(true)),

  new SlashCommandBuilder()
    .setName('diagnose')
    .setDescription('Compile local and global network diagnostic telemetry (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('github')
    .setDescription('View Krims Code and KryloSMP official GitHub repositories!'),

  // ──────────────────────────────────────────────────────────
  // 2. 🎬 SKYBASE FILM CREW & APPLICATIONS
  // ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('startcrewapp')
    .setDescription('🎬 Open Skybase Film Crew applications and activate recruitment panel (Admin only)'),

  new SlashCommandBuilder()
    .setName('stopcrewapp')
    .setDescription('🔒 Close Skybase Film Crew applications and lock recruitment panel (Admin only)'),

  new SlashCommandBuilder()
    .setName('startcrew')
    .setDescription('🎬 Open Skybase Film Crew applications and activate recruitment panel (Admin only)'),

  new SlashCommandBuilder()
    .setName('stopcrew')
    .setDescription('🔒 Close Skybase Film Crew applications and lock recruitment panel (Admin only)'),

  new SlashCommandBuilder()
    .setName('crewapp')
    .setDescription('🎬 Manage Skybase Film Crew applications status and panel (Admin only)')
    .addSubcommand(sub => sub.setName('start').setDescription('Open Skybase Film Crew applications'))
    .addSubcommand(sub => sub.setName('stop').setDescription('Close Skybase Film Crew applications'))
    .addSubcommand(sub => sub.setName('status').setDescription('View current application status')),

  new SlashCommandBuilder()
    .setName('crew')
    .setDescription('🎬 Manage Skybase Film Crew applications status and panel (Admin only)')
    .addSubcommand(sub => sub.setName('start').setDescription('Open Skybase Film Crew applications'))
    .addSubcommand(sub => sub.setName('stop').setDescription('Close Skybase Film Crew applications'))
    .addSubcommand(sub => sub.setName('status').setDescription('View current application status')),

  // ──────────────────────────────────────────────────────────
  // 3. 🌐 SERVER, COMMUNITY & SUPPORT
  // ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('ip')
    .setDescription('📡 Get the official Java & Bedrock Minecraft IP addresses and server port!'),

  new SlashCommandBuilder()
    .setName('status')
    .setDescription('📊 Check the real-time online status and player count of the Minecraft server!'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('View the full directory of all available Krims Code AI bot commands & features!'),

  new SlashCommandBuilder()
    .setName('rules')
    .setDescription('📜 View the official server rules, behavior guidelines & strike policy!'),

  new SlashCommandBuilder()
    .setName('apply')
    .setDescription('📋 Apply for Staff, Builder, Developer or Media Creator!'),

  new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('🎫 Open a secure private support ticket channel with staff!')
    .addStringOption(opt => opt.setName('reason').setDescription('The reason or question for opening this ticket').setRequired(false)),

  new SlashCommandBuilder()
    .setName('close')
    .setDescription('🔒 Resolve and close the current support ticket channel!'),

  new SlashCommandBuilder()
    .setName('suggest')
    .setDescription('💡 Submit an official suggestion or improvement idea for the server!')
    .addStringOption(opt => opt.setName('idea').setDescription('Your suggestion idea').setRequired(true)),

  new SlashCommandBuilder()
    .setName('announce')
    .setDescription('📢 Broadcast an announcement to the community (Staff only)')
    .addStringOption(opt => opt.setName('message').setDescription('Announcement message').setRequired(true))
    .addStringOption(opt => opt.setName('title').setDescription('Announcement title header').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),

  new SlashCommandBuilder()
    .setName('poll')
    .setDescription('📊 Create an interactive community voting poll!')
    .addStringOption(opt => opt.setName('question').setDescription('The poll question').setRequired(true))
    .addStringOption(opt => opt.setName('options').setDescription('Comma-separated choices (e.g. Red, Blue, Green)').setRequired(false))
    .addStringOption(opt => opt.setName('option1').setDescription('First option').setRequired(false))
    .addStringOption(opt => opt.setName('option2').setDescription('Second option').setRequired(false))
    .addStringOption(opt => opt.setName('option3').setDescription('Third option (optional)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('giveaway')
    .setDescription('🎉 Launch an interactive server giveaway event!')
    .addStringOption(opt => opt.setName('prize').setDescription('What is the giveaway prize?').setRequired(true))
    .addStringOption(opt => opt.setName('duration').setDescription('Duration in minutes or format like 30m, 1h, 1d').setRequired(true)),

  new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('🏰 Display detailed server statistics, member counts, boost level & specs!'),

  new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('👤 Display user account details, joined date, avatar & assigned roles!')
    .addUserOption(opt => opt.setName('user').setDescription('The user to inspect').setRequired(false)),

  new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('🖼️ View and download high-resolution user avatar image!')
    .addUserOption(opt => opt.setName('user').setDescription('The user to get the avatar of').setRequired(false)),

  new SlashCommandBuilder()
    .setName('link')
    .setDescription('🔗 Link your Discord account to your Minecraft account!'),

  new SlashCommandBuilder()
    .setName('verify')
    .setDescription('✅ Link your Minecraft account or submit in-game verification code!')
    .addStringOption(opt => opt.setName('code').setDescription('Verification code from Minecraft (or your IGN)').setRequired(false))
    .addStringOption(opt => opt.setName('username').setDescription('Your Minecraft In-Game Username').setRequired(false)),

  new SlashCommandBuilder()
    .setName('startstream')
    .setDescription('🔴 Broadcast live stream notification to the server (Admin only)')
    .addStringOption(opt => opt.setName('title').setDescription('Stream title / topic').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('stopstream')
    .setDescription('🛑 End active live stream broadcast and reset activity (Admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('adminabuse')
    .setDescription('⚡ Trigger the official Monthly Admin Abuse & Chaos Event (Admin only)')
    .addStringOption(opt => opt.setName('details').setDescription('Custom drop party details or rewards').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName('genkey')
    .setDescription('🔑 Generate a custom API key for integrations (Admin only)')
    .addStringOption(opt => opt.setName('prefix').setDescription('Custom key prefix (e.g. krylo, krims)').setRequired(false))
    .addStringOption(opt => opt.setName('env').setDescription('Environment (live, dev, admin)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // ──────────────────────────────────────────────────────────
  // 4. 🛡️ DYNO MODERATION & SECURITY SUITE
  // ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚠️ Issue an official warning strike to a user (Staff only)')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for the warning').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Timeout / mute a member from sending messages (Staff only)')
    .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Duration in minutes (default 10)').setRequired(false))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for timeout').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('🔊 Remove timeout / unmute a member (Staff only)')
    .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Kick a member from the server (Staff only)')
    .addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Ban a user from the server (Staff only)')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 Bulk delete messages from the channel (Staff only)')
    .addIntegerOption(opt => opt.setName('count').setDescription('Number of messages to delete (1-100)').setRequired(false))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Number of messages to delete (1-100)').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('🔒 Lock down a text channel to prevent messages (Staff only)')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to lock down').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Unlock a previously locked channel (Staff only)')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to unlock').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('⏳ Set channel slowmode cooldown in seconds (Staff only)')
    .addIntegerOption(opt => opt.setName('seconds').setDescription('Cooldown in seconds (0 to disable)').setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName('afk')
    .setDescription('💤 Set your AFK status with an automated notification message!')
    .addStringOption(opt => opt.setName('reason').setDescription('AFK reason / notice').setRequired(false)),

  new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('⏰ Set a personal reminder notification timer!')
    .addStringOption(opt => opt.setName('time').setDescription('Time duration (e.g. 10m, 1h, 30s)').setRequired(true))
    .addStringOption(opt => opt.setName('reminder').setDescription('Reminder message').setRequired(true)),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('📜 Create a custom styled announcement embed message (Staff only)')
    .addStringOption(opt => opt.setName('title').setDescription('Embed Title').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('Embed Description').setRequired(true))
    .addStringOption(opt => opt.setName('color').setDescription('Hex color (e.g. #00E5FF)').setRequired(false))
    .addStringOption(opt => opt.setName('image_url').setDescription('Optional image attachment URL').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  new SlashCommandBuilder()
    .setName('mcban')
    .setDescription('🔨 Double-ban user on Discord & Minecraft including IP ban (Admin only)')
    .addUserOption(opt => opt.setName('user').setDescription('Discord user').setRequired(false))
    .addStringOption(opt => opt.setName('mcusername').setDescription('Minecraft username').setRequired(false))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  // ──────────────────────────────────────────────────────────
  // 5. 🧭 UTILITY, RADAR & FUN
  // ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('locator')
    .setDescription('🧭 Calculate Minecraft 90% normalized radar locator bar color!')
    .addStringOption(opt => opt.setName('player_or_color').setDescription('Minecraft Username, UUID, or Hex Color (#00E5FF)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('coinflip')
    .setDescription('🪙 Flip a coin — Heads or Tails!'),

  new SlashCommandBuilder()
    .setName('roll')
    .setDescription('🎲 Roll a random dice number!')
    .addIntegerOption(opt => opt.setName('max').setDescription('Maximum number (default 6)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('eightball')
    .setDescription('🎱 Ask the Magic 8-Ball a fortune question!')
    .addStringOption(opt => opt.setName('question').setDescription('Your question for the 8-Ball').setRequired(true)),

  new SlashCommandBuilder()
    .setName('joke')
    .setDescription('😂 Get a funny Minecraft or gaming joke!'),

  new SlashCommandBuilder()
    .setName('meme')
    .setDescription('🐸 Fetch a random funny Minecraft meme!'),

  new SlashCommandBuilder()
    .setName('bday')
    .setDescription('🎂 Celebrate a user birthday with fireworks, double XP & bonus coins!')
    .addUserOption(opt => opt.setName('user').setDescription('The birthday user (leave blank for yourself)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('gameboost')
    .setDescription('⚡ Optimize PC RAM & close background apps for 100+ FPS Minecraft gaming!'),

  new SlashCommandBuilder()
    .setName('voice')
    .setDescription('🔊 Control Krims Bot Voice AI in voice channels')
    .addStringOption(opt => opt.setName('action').setDescription('Action: join, leave, or status').setRequired(true)
      .addChoices(
        { name: 'join', value: 'join' },
        { name: 'leave', value: 'leave' },
        { name: 'status', value: 'status' }
      )),

  // ──────────────────────────────────────────────────────────
  // 6. ⚔️ PVP & DUELS SUITE
  // ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('pvp')
    .setDescription('⚔️ Toggle your access to the private PvP combat channel!'),

  new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('🏆 Toggle your access to the private tournaments channel!'),

  new SlashCommandBuilder()
    .setName('challenge')
    .setDescription('⚔️ Challenge another player to an official 1v1 PvP duel!')
    .addUserOption(opt => opt.setName('opponent').setDescription('The player you want to challenge').setRequired(true)),

  new SlashCommandBuilder()
    .setName('endduel')
    .setDescription('🏁 End the current PvP duel match and clear queue!'),

  new SlashCommandBuilder()
    .setName('duel')
    .setDescription('⚔️ Challenge a player to a 1v1 KC wager duel!')
    .addUserOption(opt => opt.setName('opponent').setDescription('Player to challenge').setRequired(true))
    .addIntegerOption(opt => opt.setName('wager').setDescription('KC wager amount (min 50)').setRequired(false)),

  // ──────────────────────────────────────────────────────────
  // 7. 💰 ECONOMY & MEE6 PROGRESSION
  // ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('⭐ View your chat level, rank position, and total XP card!')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false)),

  new SlashCommandBuilder()
    .setName('level')
    .setDescription('⭐ View your chat level, rank position, and total XP card! (Alias)')
    .addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false)),

  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('🎁 Claim your free daily KryloCoins & diamond reward streak!'),

  new SlashCommandBuilder()
    .setName('work')
    .setDescription('💼 Work a minigame shift to earn KryloCoins!'),

  new SlashCommandBuilder()
    .setName('bal')
    .setDescription('💰 Check your current KryloCoins & economy balance!')
    .addUserOption(opt => opt.setName('user').setDescription('User to check balance of').setRequired(false)),

  new SlashCommandBuilder()
    .setName('balance')
    .setDescription('💰 Check your current KryloCoins & economy balance! (Alias)')
    .addUserOption(opt => opt.setName('user').setDescription('User to check balance of').setRequired(false)),

  new SlashCommandBuilder()
    .setName('coins')
    .setDescription('💰 Check your current KryloCoins & economy balance! (Alias)')
    .addUserOption(opt => opt.setName('user').setDescription('User to check balance of').setRequired(false)),

  new SlashCommandBuilder()
    .setName('pay')
    .setDescription('💸 Transfer KryloCoins securely to another player!')
    .addUserOption(opt => opt.setName('user').setDescription('Recipient player').setRequired(true))
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount of KryloCoins to send').setRequired(true)),

  new SlashCommandBuilder()
    .setName('slots')
    .setDescription('🎰 Spin the casino slot machine to win big KryloCoins!')
    .addIntegerOption(opt => opt.setName('bet').setDescription('Amount of KryloCoins to bet (min 10)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('spin')
    .setDescription('🎡 Spin the Krylo Wheel of Fortune for free daily prizes & ranks!'),

  new SlashCommandBuilder()
    .setName('chest')
    .setDescription('🧰 Open your FREE Daily Lucky Chest for random loot and coins!'),

  new SlashCommandBuilder()
    .setName('jackpot')
    .setDescription('💎 View the live KryloCoins Global Server Jackpot Pool!'),

  new SlashCommandBuilder()
    .setName('quests')
    .setDescription('📜 View active Season Quests and claim KryloCoins rewards!'),

  new SlashCommandBuilder()
    .setName('shop')
    .setDescription('🛍️ Open the official in-game KryloCoins item shop & perks!'),

  new SlashCommandBuilder()
    .setName('store')
    .setDescription('🛒 Get official KryloSMP Webstore link and store catalog!'),

  new SlashCommandBuilder()
    .setName('vote')
    .setDescription('🗳️ Vote for the server to earn free +500 KC and voting keys!'),

  new SlashCommandBuilder()
    .setName('refer')
    .setDescription('👥 Refer a friend to earn +2,000 KC and referral keys!')
    .addUserOption(opt => opt.setName('friend').setDescription('Friend you invited').setRequired(false)),

  new SlashCommandBuilder()
    .setName('bump')
    .setDescription('📢 Check Disboard bump status and set a 2-hour reminder!'),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 View top community chat activity level & KryloCoins leaderboards!'),

  new SlashCommandBuilder()
    .setName('xpleaderboard')
    .setDescription('🏆 View top 10 chat active users ranked by XP!'),

  new SlashCommandBuilder()
    .setName('clan')
    .setDescription('🏰 SMP Clan & Faction System')
    .addSubcommand(sub => sub.setName('create').setDescription('Create a new clan')
      .addStringOption(opt => opt.setName('name').setDescription('Clan Name').setRequired(true))
      .addStringOption(opt => opt.setName('tag').setDescription('3-4 letter Tag').setRequired(true)))
    .addSubcommand(sub => sub.setName('info').setDescription('View your Clan status & vault'))
    .addSubcommand(sub => sub.setName('leaderboard').setDescription('View top Clans ranked by wealth')),

  // ──────────────────────────────────────────────────────────
  // 8. 🏹 KRYLOSMP RPG UNIVERSE
  // ──────────────────────────────────────────────────────────
  new SlashCommandBuilder()
    .setName('bounty')
    .setDescription('🎯 Place or view active bounties on players for KC rewards!')
    .addUserOption(opt => opt.setName('target').setDescription('Player to bounty').setRequired(false))
    .addIntegerOption(opt => opt.setName('amount').setDescription('KC bounty amount (min 100)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('trade')
    .setDescription('🤝 Trade items and KryloCoins with another player securely!')
    .addUserOption(opt => opt.setName('player').setDescription('Player to trade with').setRequired(true))
    .addStringOption(opt => opt.setName('offer').setDescription('What you are offering').setRequired(true)),

  new SlashCommandBuilder()
    .setName('pet')
    .setDescription('🐾 View, feed or train your virtual companion pet!')
    .addStringOption(opt => opt.setName('action').setDescription('Pet action').setRequired(false)
      .addChoices(
        { name: 'View', value: 'view' },
        { name: 'Feed', value: 'feed' },
        { name: 'Train', value: 'train' },
        { name: 'Adopt', value: 'adopt' }
      )),

  new SlashCommandBuilder()
    .setName('fish')
    .setDescription('🎣 Go fishing in KryloSMP waters for rare catches and KC rewards!'),

  new SlashCommandBuilder()
    .setName('mine')
    .setDescription('⛏️ Go mining in caves for ores, gems and KC rewards!'),

  new SlashCommandBuilder()
    .setName('craft')
    .setDescription('🔨 Craft items from gathered materials for special rewards!'),

  new SlashCommandBuilder()
    .setName('enchant')
    .setDescription('✨ Enchant your gear with magical abilities for combat bonuses!'),

  new SlashCommandBuilder()
    .setName('raid')
    .setDescription('⚔️ Launch or join a server-wide raid boss event for epic loot!')
    .addStringOption(opt => opt.setName('action').setDescription('Raid action').setRequired(false)
      .addChoices(
        { name: 'View', value: 'view' },
        { name: 'Join', value: 'join' },
        { name: 'Leaderboard', value: 'leaderboard' }
      )),

  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('📜 View your full player profile, rank, wealth and stats!')
    .addUserOption(opt => opt.setName('player').setDescription('Player to view').setRequired(false)),

  new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('🎒 View your inventory of items, keys, and collectibles!'),

  new SlashCommandBuilder()
    .setName('achievements')
    .setDescription('🏅 View your unlocked achievements and milestone badges!'),

  new SlashCommandBuilder()
    .setName('heist')
    .setDescription('🏦 Attempt a KC heist on the Bank vault for massive payouts!'),

  new SlashCommandBuilder()
    .setName('rob')
    .setDescription('🦹 Attempt to pickpocket KryloCoins from another player!')
    .addUserOption(opt => opt.setName('target').setDescription('Player to rob').setRequired(true)),

  new SlashCommandBuilder()
    .setName('lottery')
    .setDescription('🎟️ Buy a lottery ticket for the weekly mega jackpot!')
    .addIntegerOption(opt => opt.setName('tickets').setDescription('Number of tickets (100 KC each)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('lootbox')
    .setDescription('📦 Open a mystery lootbox for random items and KC rewards!')
    .addStringOption(opt => opt.setName('type').setDescription('Lootbox tier').setRequired(false)
      .addChoices(
        { name: 'Common (FREE)', value: 'common' },
        { name: 'Rare (500 KC)', value: 'rare' },
        { name: 'Epic (2,000 KC)', value: 'epic' },
        { name: 'Legendary (5,000 KC)', value: 'legendary' }
      ))
];

/**
 * Array of raw JSON definitions ready for Discord REST API registration
 */
export const masterCommandJson = masterCommandBuilders.map(cmd => cmd.toJSON());
