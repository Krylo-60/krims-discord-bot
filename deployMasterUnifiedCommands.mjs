import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;

const masterCommands = [
  // 🧭 Locator Bar Neighbor Finder
  new SlashCommandBuilder()
    .setName('locator')
    .setDescription('🧭 Calculate Minecraft 90% locator bar color & radar frequency')
    .addStringOption(opt => opt.setName('player_or_color').setDescription('Minecraft Username, UUID, or Hex Color (e.g. Krylo_MC, #00E5FF)').setRequired(true)),

  // 🤖 Dyno Moderation Suite
  new SlashCommandBuilder().setName('warn').setDescription('⚠️ Warn a user (Staff only)').addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true)).addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(false)),
  new SlashCommandBuilder().setName('mute').setDescription('🔇 Timeout / mute a member').addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true)).addIntegerOption(opt => opt.setName('minutes').setDescription('Duration in minutes (default 10)').setRequired(false)).addStringOption(opt => opt.setName('reason').setDescription('Reason for mute').setRequired(false)),
  new SlashCommandBuilder().setName('unmute').setDescription('🔊 Remove timeout / unmute a member').addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true)),
  new SlashCommandBuilder().setName('kick').setDescription('👢 Kick a member from the server').addUserOption(opt => opt.setName('user').setDescription('Target member').setRequired(true)).addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(false)),
  new SlashCommandBuilder().setName('ban').setDescription('🔨 Ban a user from the server').addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(true)).addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false)),
  new SlashCommandBuilder().setName('purge').setDescription('🧹 Bulk delete messages').addIntegerOption(opt => opt.setName('count').setDescription('Number of messages to delete (1-100)').setRequired(true)),
  new SlashCommandBuilder().setName('lockdown').setDescription('🔒 Lock down a channel').addChannelOption(opt => opt.setName('channel').setDescription('Channel to lock').setRequired(false)),
  new SlashCommandBuilder().setName('unlock').setDescription('🔓 Unlock a previously locked channel').addChannelOption(opt => opt.setName('channel').setDescription('Channel to unlock').setRequired(false)),
  new SlashCommandBuilder().setName('slowmode').setDescription('⏳ Set channel slowmode').addIntegerOption(opt => opt.setName('seconds').setDescription('Seconds (0 to disable)').setRequired(true)),
  new SlashCommandBuilder().setName('afk').setDescription('💤 Set your AFK status with custom message').addStringOption(opt => opt.setName('reason').setDescription('AFK reason').setRequired(false)),
  new SlashCommandBuilder().setName('remindme').setDescription('⏰ Set a personal reminder timer').addStringOption(opt => opt.setName('time').setDescription('Time (e.g. 10m, 1h, 30s)').setRequired(true)).addStringOption(opt => opt.setName('reminder').setDescription('Reminder text').setRequired(true)),
  new SlashCommandBuilder().setName('embed').setDescription('📜 Create a custom announcement embed').addStringOption(opt => opt.setName('title').setDescription('Title').setRequired(true)).addStringOption(opt => opt.setName('description').setDescription('Description').setRequired(true)).addStringOption(opt => opt.setName('color').setDescription('Hex Color (e.g. #00E5FF)').setRequired(false)).addStringOption(opt => opt.setName('image_url').setDescription('Image URL').setRequired(false)),

  // 🎮 Original KryloSMP Economy & Server Commands
  new SlashCommandBuilder().setName('spin').setDescription('Spin the Krylo-Wheel of Fortune for Ranks, KryloCoins & Items!'),
  new SlashCommandBuilder().setName('chest').setDescription('Open your Daily Krylo Lucky Chest for coins & diamonds!'),
  new SlashCommandBuilder().setName('jackpot').setDescription('View the live KryloCoins Global Server Jackpot Pool!'),
  new SlashCommandBuilder().setName('quests').setDescription('View Birthday Season Quests & claim KryloCoins rewards!'),
  new SlashCommandBuilder().setName('clan').setDescription('SMP Clan & Faction System')
    .addSubcommand(sub => sub.setName('create').setDescription('Create a new SMP Clan').addStringOption(opt => opt.setName('name').setDescription('Clan Name').setRequired(true)).addStringOption(opt => opt.setName('tag').setDescription('3-4 letter Tag').setRequired(true)))
    .addSubcommand(sub => sub.setName('info').setDescription('View your Clan status & vault'))
    .addSubcommand(sub => sub.setName('leaderboard').setDescription('View top Clans ranked by wealth')),

  new SlashCommandBuilder().setName('bday').setDescription('Celebrate a user birthday (once a year)!').addUserOption(opt => opt.setName('user').setDescription('Birthday user').setRequired(false)),
  new SlashCommandBuilder().setName('daily').setDescription('Claim free daily KryloCoins & diamond rewards!'),
  new SlashCommandBuilder().setName('work').setDescription('Work a shift to earn KryloCoins!'),
  new SlashCommandBuilder().setName('rank').setDescription('View chat level, rank position, and total XP!').addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false)),
  new SlashCommandBuilder().setName('level').setDescription('View chat level, rank position, and total XP!').addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false)),
  new SlashCommandBuilder().setName('xpleaderboard').setDescription('Display top 10 chat active users!'),
  new SlashCommandBuilder().setName('leaderboard').setDescription('View top KryloCoins & XP leaderboards!'),
  new SlashCommandBuilder().setName('ip').setDescription('Get Java & Bedrock IP address and server port!'),
  new SlashCommandBuilder().setName('store').setDescription('Get official KryloSMP Webstore link!'),
  new SlashCommandBuilder().setName('help').setDescription('View full list of all KryloSMP bot commands!'),
  new SlashCommandBuilder().setName('status').setDescription('Check KryloSMP server & bot operational status!'),

  new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin (Heads or Tails)!'),
  new SlashCommandBuilder().setName('roll').setDescription('Roll a random number between 1 and 100!'),
  new SlashCommandBuilder().setName('avatar').setDescription('View a user Discord avatar!').addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false)),
  new SlashCommandBuilder().setName('vote').setDescription('Vote for KryloSMP for free rewards!'),
  new SlashCommandBuilder().setName('refer').setDescription('Refer a friend to earn +2,000 KryloCoins!'),
  new SlashCommandBuilder().setName('bump').setDescription('Bump KryloSMP server listing!'),
  new SlashCommandBuilder().setName('verify').setDescription('Link your Minecraft account with Discord!'),
  new SlashCommandBuilder().setName('balance').setDescription('Check your KryloCoins balance!'),
  new SlashCommandBuilder().setName('pay').setDescription('Pay KryloCoins to another player!').addUserOption(opt => opt.setName('user').setDescription('Recipient player').setRequired(true)).addIntegerOption(opt => opt.setName('amount').setDescription('Amount of KryloCoins').setRequired(true)),
  new SlashCommandBuilder().setName('slots').setDescription('Spin the casino slot machine!').addIntegerOption(opt => opt.setName('bet').setDescription('Amount of KryloCoins to bet').setRequired(true)),
  new SlashCommandBuilder().setName('eightball').setDescription('Ask the Magic 8-Ball a question!').addStringOption(opt => opt.setName('question').setDescription('Your question').setRequired(true)),

  new SlashCommandBuilder().setName('serverinfo').setDescription('Display KryloSMP server information & specs!'),
  new SlashCommandBuilder().setName('userinfo').setDescription('Display user account details & roles!').addUserOption(opt => opt.setName('user').setDescription('Target user').setRequired(false)),
  new SlashCommandBuilder().setName('joke').setDescription('Get a funny Minecraft joke!'),
  new SlashCommandBuilder().setName('meme').setDescription('Get a random Minecraft meme!'),
  new SlashCommandBuilder().setName('github').setDescription('View KryloSMP GitHub repository link!'),
  new SlashCommandBuilder().setName('shop').setDescription('Open in-game KryloCoins item shop!'),

  new SlashCommandBuilder().setName('ticket').setDescription('Open a private support ticket with staff!'),
  new SlashCommandBuilder().setName('close').setDescription('Close and resolve active support ticket!'),
  new SlashCommandBuilder().setName('pvp').setDescription('Toggle PvP Player role and access pvp-chat!'),
  new SlashCommandBuilder().setName('tournament').setDescription('Toggle Tournament Participant role!'),
  new SlashCommandBuilder().setName('challenge').setDescription('Challenge a player to a 1v1 PvP duel!').addUserOption(opt => opt.setName('opponent').setDescription('Player to challenge').setRequired(true)),
  new SlashCommandBuilder().setName('endduel').setDescription('End active 1v1 PvP duel match!'),
  new SlashCommandBuilder().setName('ask').setDescription('Ask Krims Code AI any question or server query!').addStringOption(opt => opt.setName('prompt').setDescription('Your question').setRequired(true)),

  new SlashCommandBuilder().setName('suggest').setDescription('Submit a server suggestion!').addStringOption(opt => opt.setName('idea').setDescription('Your suggestion idea').setRequired(true)),
  new SlashCommandBuilder().setName('mcban').setDescription('Double-ban user on Discord & Minecraft (Admin only)').addUserOption(opt => opt.setName('user').setDescription('Discord user').setRequired(false)).addStringOption(opt => opt.setName('mcusername').setDescription('Minecraft username').setRequired(false)).addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false)).setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  new SlashCommandBuilder().setName('announce').setDescription('Broadcast announcement (Staff only)').addStringOption(opt => opt.setName('message').setDescription('Announcement message').setRequired(true)).setDefaultMemberPermissions(PermissionFlagsBits.MentionEveryone),
  new SlashCommandBuilder().setName('diagnose').setDescription('Run system diagnostics (Admin only)').setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder().setName('poll').setDescription('Create a community poll').addStringOption(opt => opt.setName('question').setDescription('Poll question').setRequired(true)).addStringOption(opt => opt.setName('options').setDescription('Comma-separated options').setRequired(true)),
  new SlashCommandBuilder().setName('giveaway').setDescription('Start a giveaway event').addStringOption(opt => opt.setName('prize').setDescription('Prize description').setRequired(true)).addStringOption(opt => opt.setName('duration').setDescription('Duration e.g. 1h, 1d').setRequired(true)),
  new SlashCommandBuilder().setName('voice').setDescription('Control Krims Bot Voice AI in voice channels').addStringOption(opt => opt.setName('action').setDescription('Action: join, leave, or status').setRequired(true).addChoices({ name: 'join', value: 'join' }, { name: 'leave', value: 'leave' }, { name: 'status', value: 'status' }))
].map(cmd => cmd.toJSON());

async function deploy() {
  console.log(`[🚀 MASTER UNIFIED SLASH COMMANDS] Deploying ALL ${masterCommands.length} commands across guilds...`);
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    const user = await rest.get(Routes.user());
    const appId = user.id;
    console.log(`[+] Bot App ID: ${appId} (${user.username})`);

    const guildsRes = await rest.get(Routes.userGuilds());
    for (const g of guildsRes) {
      console.log(`[+] Registering ${masterCommands.length} commands to guild: ${g.name} (${g.id})...`);
      try {
        await rest.put(Routes.applicationGuildCommands(appId, g.id), { body: masterCommands });
        console.log(`[✅ Successfully registered to ${g.name}!]`);
      } catch (err) {
        console.warn(`[-] Failed on ${g.name}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[-] Failed to deploy:', err);
  }
}

deploy();
