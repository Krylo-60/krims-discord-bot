import dotenv from 'dotenv';
import { REST, Routes, SlashCommandBuilder, Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { getLocatorColor } from './features/locatorBarEngine.mjs';
import { handleRankCommand, handleLeaderboardCommand } from './features/mee6Levels.mjs';
import { 
  handleWarn, handleMute, handleUnmute, handleKick, handleBan, 
  handlePurge, handleLockdown, handleSlowmode, handleAfk, handleRemindMe, handleEmbedBuilder 
} from './features/dynoModSystem.mjs';

dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const rest = new REST({ version: '10' }).setToken(TOKEN);

// Define all new slash commands
const newCommands = [
  // 1. Locator Bar Neighbor Finder
  new SlashCommandBuilder()
    .setName('locator')
    .setDescription('🧭 Calculate Minecraft in-game 90% locator bar color & find neighbors')
    .addStringOption(opt => opt.setName('player_or_color').setDescription('Minecraft Username, UUID, or Hex Color (e.g. Krylo_MC, #00E5FF)').setRequired(true)),

  // 2. MEE6 Leveling Suite
  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('⭐ View your or another member’s MEE6 level, total XP, and rank card')
    .addUserOption(opt => opt.setName('user').setDescription('Target member to view').setRequired(false)),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('🏆 View the Top 10 XP Leaderboard for this server'),

  // 3. Dyno Moderation Suite
  new SlashCommandBuilder()
    .setName('warn')
    .setDescription('⚠️ Issue a formal warning to a member')
    .addUserOption(opt => opt.setName('user').setDescription('Target member to warn').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for warning').setRequired(false)),

  new SlashCommandBuilder()
    .setName('mute')
    .setDescription('🔇 Timeout / mute a member')
    .addUserOption(opt => opt.setName('user').setDescription('Target member to mute').setRequired(true))
    .addIntegerOption(opt => opt.setName('minutes').setDescription('Duration in minutes (default 10)').setRequired(false))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for mute').setRequired(false)),

  new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('🔊 Remove timeout / unmute a member')
    .addUserOption(opt => opt.setName('user').setDescription('Target member to unmute').setRequired(true)),

  new SlashCommandBuilder()
    .setName('kick')
    .setDescription('👢 Kick a member from the server')
    .addUserOption(opt => opt.setName('user').setDescription('Target member to kick').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for kick').setRequired(false)),

  new SlashCommandBuilder()
    .setName('ban')
    .setDescription('🔨 Ban a user from the server')
    .addUserOption(opt => opt.setName('user').setDescription('Target user to ban').setRequired(true))
    .addStringOption(opt => opt.setName('reason').setDescription('Reason for ban').setRequired(false)),

  new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🧹 Bulk delete messages from the channel')
    .addIntegerOption(opt => opt.setName('count').setDescription('Number of messages to delete (1-100)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('🔒 Lock down a channel to prevent regular members from sending messages')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to lock (default current)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('🔓 Unlock a previously locked channel')
    .addChannelOption(opt => opt.setName('channel').setDescription('Channel to unlock (default current)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('⏳ Set channel slowmode rate limit')
    .addIntegerOption(opt => opt.setName('seconds').setDescription('Seconds of slowmode (0 to disable)').setRequired(true)),

  new SlashCommandBuilder()
    .setName('afk')
    .setDescription('💤 Set your AFK status with custom message')
    .addStringOption(opt => opt.setName('reason').setDescription('AFK reason (e.g. Studying, Playing Minecraft)').setRequired(false)),

  new SlashCommandBuilder()
    .setName('remindme')
    .setDescription('⏰ Set a personal reminder timer')
    .addStringOption(opt => opt.setName('time').setDescription('Time (e.g. 10m, 1h, 30s)').setRequired(true))
    .addStringOption(opt => opt.setName('reminder').setDescription('Reminder message').setRequired(true)),

  new SlashCommandBuilder()
    .setName('embed')
    .setDescription('📜 Create and send a custom rich embed announcement')
    .addStringOption(opt => opt.setName('title').setDescription('Embed Title').setRequired(true))
    .addStringOption(opt => opt.setName('description').setDescription('Embed Description (supports \\n for line breaks)').setRequired(true))
    .addStringOption(opt => opt.setName('color').setDescription('Hex Color Code (e.g. #00E5FF)').setRequired(false))
    .addStringOption(opt => opt.setName('image_url').setDescription('Image URL').setRequired(false))
];

async function deploy() {
  console.log('🚀 Fetching Bot User ID...');
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers
    ]
  });

  await client.login(TOKEN);
  console.log(`🤖 Logged in as ${client.user.tag} (${client.user.id})`);

  const rawCommands = newCommands.map(cmd => cmd.toJSON());

  for (const [guildId, guild] of client.guilds.cache) {
    try {
      console.log(`📡 Registering ${rawCommands.length} MEE6, Dyno & Locator commands to Guild: ${guild.name} (${guildId})...`);
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, guildId),
        { body: rawCommands }
      );
      console.log(`✅ Successfully registered commands to ${guild.name}!`);
    } catch (err) {
      console.error(`❌ Failed on ${guild.name}:`, err.message);
    }
  }

  // Test locator color computation for Krylo_MC
  const testLocator = await getLocatorColor('Krylo_MC');
  console.log('\n🧭 [LOCATOR ENGINE TEST]:', testLocator);

  console.log('\n🎉 ALL MEE6, DYNO & LOCATOR BAR FEATURES DEPLOYED!');
  process.exit(0);
}

deploy().catch(err => {
  console.error('Fatal Deployment Error:', err);
  process.exit(1);
});
