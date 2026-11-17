import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  PermissionFlagsBits,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder
} from 'discord.js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { setPlayerVerification, getPlayer, addCoins, getBalance } from '../databaseEngine.mjs';
import { getFalixStatus, sendFalixPowerSignal, sendFalixCommand } from '../falixServerEngine.mjs';

dotenv.config();

const KSMP_TOKEN = process.env.KSMP_BOT_TOKEN;
const KSMP_CLIENT_ID = process.env.DISCORD_CLIENT_ID || '1540725967864201446';
const KSMP_GUILD_ID = process.env.DISCORD_GUILD_ID || '1538225337048236082';

export const ksmpClient = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const DATA_FILE = path.join(process.cwd(), 'linked_players.json');

function loadLocalLinked() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (_) {}
  return {};
}

function saveLocalLinked(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (_) {}
}

const commands = [
  new SlashCommandBuilder()
    .setName('link')
    .setDescription('🔗 Link your Discord account to your Minecraft account!')
    .addStringOption(opt =>
      opt.setName('username').setDescription('Your Minecraft In-Game Name (IGN)').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('unlink')
    .setDescription('🔓 Unlink your currently connected Minecraft account.'),
  new SlashCommandBuilder()
    .setName('profile')
    .setDescription('👤 View your linked Minecraft profile, stats, and KryloCoins ($Kr).')
    .addUserOption(opt =>
      opt.setName('user').setDescription('User to view (defaults to yourself)').setRequired(false)
    ),
  new SlashCommandBuilder()
    .setName('mc-status')
    .setDescription('Show live Minecraft server status on Falix.'),
  new SlashCommandBuilder()
    .setName('mc-power')
    .setDescription('Start, stop, restart, or kill the Minecraft server.')
    .addStringOption(opt =>
      opt.setName('signal')
        .setDescription('Power action')
        .setRequired(true)
        .addChoices(
          { name: 'start', value: 'start' },
          { name: 'stop', value: 'stop' },
          { name: 'restart', value: 'restart' },
          { name: 'kill', value: 'kill' }
        )
    ),
  new SlashCommandBuilder()
    .setName('mc-command')
    .setDescription('Send one console command to the Minecraft server.')
    .addStringOption(opt =>
      opt.setName('command').setDescription('Single console command').setRequired(true)
    )
].map(c => c.toJSON());

async function registerCommands() {
  if (!KSMP_TOKEN) return;
  try {
    const rest = new REST({ version: '10' }).setToken(KSMP_TOKEN);
    await rest.put(Routes.applicationGuildCommands(KSMP_CLIENT_ID, KSMP_GUILD_ID), { body: commands });
    console.log('[⚡ KSMP BOT ENGINE] Slash commands registered successfully in guild', KSMP_GUILD_ID);
  } catch (err) {
    console.warn('[⚡ KSMP BOT ENGINE] Failed to register slash commands:', err.message);
  }
}

async function processLink(interaction, rawIgn, isModal = false) {
  const cleanIgn = (rawIgn || '').trim();

  if (!cleanIgn || cleanIgn.length < 3 || cleanIgn.length > 16 || !/^[a-zA-Z0-9_.]+$/.test(cleanIgn)) {
    const errorMsg = '❌ **Invalid Minecraft Username!**\nIGN must be 3–16 characters (alphanumeric, underscores, or leading dot for Bedrock).';
    return interaction.reply({ content: errorMsg, ephemeral: true });
  }

  // 1. Save in database (SQLite + Neon Postgres)
  try {
    setPlayerVerification(interaction.user.id, cleanIgn);
    addCoins(interaction.user.id, 1000);
  } catch (dbErr) {
    console.warn('[KSMP DB Error]:', dbErr.message);
  }

  // 2. Save in local JSON
  const users = loadLocalLinked();
  const existing = users[interaction.user.id];
  const balance = (existing?.balance || 0) + (existing ? 0 : 1000);

  users[interaction.user.id] = {
    discordId: interaction.user.id,
    tag: interaction.user.tag || interaction.user.username,
    ign: cleanIgn,
    balance: balance,
    linkedAt: existing?.linkedAt || new Date().toISOString()
  };
  saveLocalLinked(users);

  // 3. Assign Discord Roles
  const member = interaction.member;
  if (member && member.roles) {
    const rolesToAdd = [];
    if (!member.roles.cache.has('1538228607644737546')) rolesToAdd.push('1538228607644737546'); // Verified
    if (!member.roles.cache.has('1538230669467979846')) rolesToAdd.push('1538230669467979846'); // Member

    if (cleanIgn.startsWith('.')) {
      if (!member.roles.cache.has('1542662171937472594')) rolesToAdd.push('1542662171937472594'); // Bedrock
    } else {
      if (!member.roles.cache.has('1542662169575817321')) rolesToAdd.push('1542662169575817321'); // Java
    }

    if (rolesToAdd.length > 0) {
      await member.roles.add(rolesToAdd).catch(() => {});
    }

    // Attempt nickname change
    try {
      if (interaction.guild?.members.me?.permissions.has(PermissionFlagsBits.ManageNicknames)) {
        await member.setNickname(cleanIgn).catch(() => {});
      }
    } catch (_) {}
  }

  // 4. Send console commands to Falix
  sendFalixCommand(`whitelist add ${cleanIgn}`).catch(() => {});
  sendFalixCommand(`tellraw ${cleanIgn} {"text":"§a§l[KryloSMP] §eLinked with Discord! (+1,000 Kr)","color":"green"}`).catch(() => {});

  const isBedrock = cleanIgn.startsWith('.');
  const editionTag = isBedrock ? '📱 Bedrock Edition' : '☕ Java Edition';

  const successEmbed = new EmbedBuilder()
    .setColor(0x10B981)
    .setTitle('🎮 Account Linked Successfully!')
    .setAuthor({
      name: 'KryloSMP Network • Account Verification',
      iconURL: interaction.guild?.iconURL() || interaction.user.displayAvatarURL()
    })
    .setThumbnail(`https://mc-heads.net/avatar/${encodeURIComponent(cleanIgn)}/128`)
    .setDescription(
      `Hey <@${interaction.user.id}>! Your Discord account is now linked to **\`${cleanIgn}\`**!\n\n` +
      `• ⛏️ **Minecraft IGN:** \`${cleanIgn}\` (${editionTag})\n` +
      `• 💎 **Link Reward:** **+1,000 KryloCoins ($Kr)** deposited to your wallet!\n` +
      `• 🛡️ **Roles Granted:** <@&1538228607644737546> & <@&${isBedrock ? '1542662171937472594' : '1542662169575817321'}>\n` +
      `• 🚀 **Server Status:** Pre-registered & whitelisted for server launch!\n\n` +
      `*KryloSMP is launching soon! Keep an eye on announcements for the new server IP!* 🌟`
    )
    .setFooter({ text: 'KryloSMP • Powered by Krims Code AI' })
    .setTimestamp();

  return interaction.reply({ embeds: [successEmbed], ephemeral: isModal });
}

ksmpClient.on('interactionCreate', async interaction => {
  if (interaction.isModalSubmit() && interaction.customId === 'modal_link_minecraft') {
    const ign = interaction.fields.getTextInputValue('link_mc_ign');
    return processLink(interaction, ign, true);
  }

  if (!interaction.isChatInputCommand()) return;

  try {
    if (interaction.commandName === 'link') {
      const ignOption = interaction.options.getString('username');
      if (!ignOption) {
        const modal = new ModalBuilder()
          .setCustomId('modal_link_minecraft')
          .setTitle('🎮 Link Minecraft Account');

        const ignInput = new TextInputBuilder()
          .setCustomId('link_mc_ign')
          .setLabel('Minecraft Username (IGN)')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('e.g. Krylo_Plays, Steve, Notch')
          .setMinLength(3)
          .setMaxLength(16)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(ignInput));
        return interaction.showModal(modal);
      }
      return processLink(interaction, ignOption, false);
    }

    if (interaction.commandName === 'unlink') {
      const users = loadLocalLinked();
      const record = users[interaction.user.id];
      if (!record) {
        return interaction.reply({ content: "❌ You don't have any linked Minecraft account.", ephemeral: true });
      }
      const oldIgn = record.ign;
      delete users[interaction.user.id];
      saveLocalLinked(users);
      if (interaction.member) {
        await interaction.member.roles.remove(['1538228607644737546', '1542662169575817321', '1542662171937472594']).catch(() => {});
      }
      const unlinkEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('🔓 Account Unlinked')
        .setDescription(`Your Discord has been unlinked from **\`${oldIgn}\`**.\nYou can link a new account anytime with \`/link\`!`)
        .setFooter({ text: 'KryloSMP Network' })
        .setTimestamp();
      return interaction.reply({ embeds: [unlinkEmbed], ephemeral: true });
    }

    if (interaction.commandName === 'profile') {
      const targetUser = interaction.options.getUser('user') || interaction.user;
      const users = loadLocalLinked();
      const record = users[targetUser.id];
      if (!record) {
        return interaction.reply({
          content: targetUser.id === interaction.user.id
            ? '❌ You have not linked your Minecraft account yet! Use `/link` to connect.'
            : `❌ <@${targetUser.id}> has not linked their Minecraft account yet.`,
          ephemeral: true
        });
      }
      const isBedrock = record.ign.startsWith('.');
      const edition = isBedrock ? '📱 Bedrock Edition' : '☕ Java Edition';
      const linkedDate = record.linkedAt ? new Date(record.linkedAt).toLocaleDateString() : 'Recently';

      const profileEmbed = new EmbedBuilder()
        .setColor(0x3B82F6)
        .setTitle(`👤 ${record.ign}'s KryloSMP Profile`)
        .setAuthor({ name: `${targetUser.username}'s Player Card`, iconURL: targetUser.displayAvatarURL() })
        .setThumbnail(`https://mc-heads.net/body/${encodeURIComponent(record.ign)}/128`)
        .addFields(
          { name: '⛏️ In-Game Name', value: `\`${record.ign}\``, inline: true },
          { name: '🎮 Platform', value: edition, inline: true },
          { name: '💰 Balance', value: `\`${Number(record.balance || 0).toLocaleString()} Kr\``, inline: true },
          { name: '📅 Member Since', value: linkedDate, inline: true },
          { name: '🛡️ Verification Status', value: '✅ Verified Human Player', inline: true }
        )
        .setFooter({ text: 'KryloSMP Network • Profile System' })
        .setTimestamp();
      return interaction.reply({ embeds: [profileEmbed] });
    }

    if (interaction.commandName === 'mc-status') {
      await interaction.deferReply();
      const statusRes = await getFalixStatus();
      if (!statusRes.success) {
        return interaction.editReply(`Could not read status: ${statusRes.error}`);
      }
      const status = statusRes.data;
      const state = status.state || 'unknown';
      const cpu = status.cpu_absolute ? `${status.cpu_absolute.toFixed(1)}%` : 'unknown';
      return interaction.editReply(`KryloSMP status: **${state}**\nCPU: ${cpu}`);
    }

    if (interaction.commandName === 'mc-power') {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply('You need Manage Server permission to use this command.');
      }
      const signal = interaction.options.getString('signal', true);
      const res = await sendFalixPowerSignal(signal);
      if (!res.success) {
        return interaction.editReply(`Power action failed: ${res.error}`);
      }
      return interaction.editReply(`Sent \`${signal}\` signal to server.`);
    }

    if (interaction.commandName === 'mc-command') {
      await interaction.deferReply({ ephemeral: true });
      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
        return interaction.editReply('You need Manage Server permission to use this command.');
      }
      const cmd = interaction.options.getString('command', true);
      const res = await sendFalixCommand(cmd);
      if (!res.success) {
        return interaction.editReply(`Command failed: ${res.error}`);
      }
      return interaction.editReply(`Sent command to server.`);
    }
  } catch (err) {
    console.error('[KSMP Interaction Error]:', err.message);
  }
});

export async function startKsmpBot() {
  if (!KSMP_TOKEN) {
    console.log('[⚡ KSMP BOT ENGINE] No KSMP_BOT_TOKEN provided, skipping secondary bot launch.');
    return;
  }

  ksmpClient.once('ready', () => {
    console.log('==================================================');
    console.log(`⚡ [KSMP BOT ENGINE] ONLINE as ${ksmpClient.user.tag}`);
    console.log(`🛡️ Running seamlessly inside Krims Code Master Host!`);
    console.log('==================================================');
  });

  try {
    await registerCommands();
    await ksmpClient.login(KSMP_TOKEN);
  } catch (err) {
    console.error('[⚡ KSMP BOT ENGINE ERROR]', err.message);
  }
}
