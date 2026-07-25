import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

const commands = [
  new SlashCommandBuilder()
    .setName('bday')
    .setDescription('Celebrate a user birthday with fireworks, double XP & bonus KryloCoins!')
    .addUserOption(opt => opt.setName('user').setDescription('The birthday user to celebrate').setRequired(false)),

  new SlashCommandBuilder()
    .setName('daily')
    .setDescription('Claim your free daily KryloCoins and item rewards!'),

  new SlashCommandBuilder()
    .setName('work')
    .setDescription('Work a shift to earn KryloCoins!'),

  new SlashCommandBuilder()
    .setName('rank')
    .setDescription('View your current server rank and perks!'),

  new SlashCommandBuilder()
    .setName('level')
    .setDescription('View your chat activity level and XP progression!'),

  new SlashCommandBuilder()
    .setName('ip')
    .setDescription('Get Java & Bedrock IP address and server port for KryloSMP!'),

  new SlashCommandBuilder()
    .setName('store')
    .setDescription('Get official KryloSMP Webstore link!'),

  new SlashCommandBuilder()
    .setName('help')
    .setDescription('View list of all available KryloSMP bot commands!'),

  new SlashCommandBuilder()
    .setName('pvp')
    .setDescription('Challenge another player to a 1v1 PvP Duel!')
    .addUserOption(opt => opt.setName('opponent').setDescription('Player to challenge').setRequired(true)),

  new SlashCommandBuilder()
    .setName('tournament')
    .setDescription('Join official monthly KryloSMP tournaments!'),

  new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('View top chat activity level & KryloCoins leaderboards!')
].map(cmd => cmd.toJSON());

async function deploySlashCommands() {
  console.log(`[🚀 REGISTERING SLASH COMMANDS] Deploying ${commands.length} slash commands to Discord...`);
  const rest = new REST({ version: '10' }).setToken(token);

  try {
    // Get bot application ID
    const user = await rest.get(Routes.user());
    const appId = user.id;
    console.log(`[+] Bot App ID: ${appId} (${user.username})`);

    // Register Guild Slash Commands
    console.log(`[+] Registering commands for Guild ${GUILD_ID}...`);
    await rest.put(Routes.applicationGuildCommands(appId, GUILD_ID), { body: commands });
    console.log(`[✅ GUILD SLASH COMMANDS REGISTERED SUCCESSFULLY!]`);

    // Register Global Slash Commands
    console.log(`[+] Registering global commands...`);
    await rest.put(Routes.applicationCommands(appId), { body: commands });
    console.log(`[✅ GLOBAL SLASH COMMANDS REGISTERED SUCCESSFULLY!]`);
  } catch (err) {
    console.error('[-] Failed to deploy slash commands:', err);
  }
}

deploySlashCommands();
