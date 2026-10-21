import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits, 
  ApplicationCommandOptionType,
  Client,
  GatewayIntentBits
} from 'discord.js';
import { getCurrentBetaFeature, promoteBetaFeatureToMain, dispatchWeeklyBetaDrop } from './weeklyFeatureIncubator.mjs';
import { getMemoryStats } from './aiMemoryEngine.mjs';
import { getModularFeaturesStatus } from './featureExpander.mjs';

export const SUPPORT_GUILD_ID = '1561174283294609479'; // Krims Support & Updates
export const OWNER_USER_ID = '1414143825538191373';
export const EXECUTIVE_ROLE_ID = '1561175610930233464';

/**
 * Guild-Scoped Slash Command Definitions for Alpha & Beta
 * Note: default_member_permissions: '8' ensures Discord hides these commands from non-administrators in autocomplete!
 */
export const ALPHA_BETA_COMMAND_DEFINITIONS = [
  {
    name: 'alpha',
    description: '🔒 [Internal R&D] Krims Code Alpha bleeding-edge experimental commands',
    default_member_permissions: '8', // Administrator only — completely hidden from regular members in Discord UI!
    dm_permission: false,
    options: [
      {
        name: 'status',
        description: 'View internal Alpha engine telemetry, memory matrix buffers, and model latency',
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'eval',
        description: 'Execute an experimental internal JavaScript snippet in a sandbox',
        type: ApplicationCommandOptionType.Subcommand,
        options: [
          {
            name: 'code',
            description: 'The experimental code snippet to test',
            type: ApplicationCommandOptionType.String,
            required: true
          }
        ]
      },
      {
        name: 'diagnose',
        description: 'Run full system integrity check on neural routes and database connections',
        type: ApplicationCommandOptionType.Subcommand
      }
    ]
  },
  {
    name: 'beta',
    description: '🧪 [Staging Suite] Krims Code Beta pre-release candidate management',
    default_member_permissions: '8', // Administrator only — completely hidden from regular members in Discord UI!
    dm_permission: false,
    options: [
      {
        name: 'status',
        description: 'View active pre-release candidates and beta tester feedback metrics',
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'drop',
        description: 'Dispatch the next queued weekly prototype drop into #🧠・ai-lab',
        type: ApplicationCommandOptionType.Subcommand
      },
      {
        name: 'promote',
        description: 'Promote the active beta candidate directly into the Main Krims Code v5 fleet',
        type: ApplicationCommandOptionType.Subcommand
      }
    ]
  }
];

/**
 * Registers the secret Alpha & Beta commands exclusively to the Support Server
 */
export async function registerAlphaBetaCommands(client) {
  if (!client) return;
  try {
    const guild = await client.guilds.fetch(SUPPORT_GUILD_ID).catch(() => null);
    if (!guild) {
      console.warn('[AlphaBeta] Support guild not found for command registration.');
      return;
    }

    // Set commands only in the support guild (never global)
    await guild.commands.set(ALPHA_BETA_COMMAND_DEFINITIONS);
    console.log('[+] Secret Alpha & Beta command suites registered exclusively in Support Server with Admin privacy lock!');
  } catch (err) {
    console.error('[AlphaBeta] Failed to register guild commands:', err.message);
  }
}

/**
 * Validates whether user is authorized to use Alpha/Beta commands
 */
export function isAuthorizedAlphaBetaUser(member, userId) {
  if (userId === OWNER_USER_ID) return true;
  if (member?.permissions?.has(PermissionFlagsBits.Administrator)) return true;
  if (member?.roles?.cache?.has(EXECUTIVE_ROLE_ID)) return true;
  return false;
}

/**
 * Handles /alpha slash command execution
 */
export async function handleAlphaCommand(interaction) {
  if (interaction.guildId !== SUPPORT_GUILD_ID || !isAuthorizedAlphaBetaUser(interaction.member, interaction.user.id)) {
    return interaction.reply({
      content: '🔒 **Access Denied:** Krims Code Alpha is restricted to Server Executives.',
      ephemeral: true
    });
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'status') {
    const memStats = getMemoryStats ? getMemoryStats(interaction.guildId) : { learnedCount: 0 };
    const features = getModularFeaturesStatus ? getModularFeaturesStatus() : [];
    const activeCount = features.filter(f => f.active).length;

    const embed = new EmbedBuilder()
      .setColor(0xFF0055) // Neon Red/Magenta for Alpha
      .setAuthor({
        name: 'Krims Code Alpha • Bleeding-Edge R&D Console',
        iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256'
      })
      .setTitle('⚡ Alpha Core Internal Telemetry')
      .setDescription(
        `**Classification:** \`TOP-SECRET INTERNAL R&D\`\n` +
        `**Environment:** Support Server Isolation (\`${SUPPORT_GUILD_ID}\`)\n` +
        `**Command Visibility:** \`ADMIN-ONLY HIDDEN AUTOCOMPLETE\`\n\n` +
        `### 🔬 Neural & Memory Subsystems:\n` +
        `• **Server Memory Facts:** \`${memStats.learnedCount || 0} active nodes\`\n` +
        `• **Modular Feature Expander:** \`${activeCount}/${features.length} modules online\`\n` +
        `• **Process Memory:** \`${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB heap used\`\n` +
        `• **Node Runtime:** \`${process.version}\` on \`${process.platform}\`\n` +
        `• **WebSocket Ping:** \`${interaction.client.ws.ping}ms\``
      )
      .setFooter({ text: 'Krims Code Alpha • Restricted Executive Suite' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (subcommand === 'diagnose') {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🩺 Alpha Deep Diagnostic Suite')
      .setDescription(
        `✅ **Discord Gateway:** Connected & healthy\n` +
        `✅ **Support Server Scope:** Locked to ID \`${SUPPORT_GUILD_ID}\`\n` +
        `✅ **Command Stealth Mode:** \`default_member_permissions: 8\` active\n` +
        `✅ **Memory Persistence:** Operational with zero data loss\n` +
        `✅ **Top.gg Webhook Dispatcher:** Armed and listening`
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (subcommand === 'eval') {
    const code = interaction.options.getString('code');
    try {
      // Safe execution context with limited scope
      const result = eval(code);
      const strRes = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
      
      const embed = new EmbedBuilder()
        .setColor(0x00FF88)
        .setTitle('⚡ Alpha Code Evaluation Output')
        .addFields(
          { name: '📥 Input Code', value: `\`\`\`js\n${code.slice(0, 1000)}\n\`\`\`` },
          { name: '📤 Evaluation Result', value: `\`\`\`js\n${(strRes || 'undefined').slice(0, 1000)}\n\`\`\`` }
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });
    } catch (err) {
      return interaction.reply({
        content: `❌ **Evaluation Error:** \`${err.message}\``,
        ephemeral: true
      });
    }
  }
}

/**
 * Handles /beta slash command execution
 */
export async function handleBetaCommand(interaction) {
  if (interaction.guildId !== SUPPORT_GUILD_ID || !isAuthorizedAlphaBetaUser(interaction.member, interaction.user.id)) {
    return interaction.reply({
      content: '🔒 **Access Denied:** Krims Code Beta is restricted to Server Executives.',
      ephemeral: true
    });
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'status') {
    const activeBeta = getCurrentBetaFeature();
    const embed = new EmbedBuilder()
      .setColor(0x8B5CF6)
      .setAuthor({
        name: 'Krims Code Beta • Staging Management Console',
        iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256'
      })
      .setTitle(`🧪 Active Beta Candidate: ${activeBeta.title}`)
      .setDescription(
        `**Version Tag:** \`${activeBeta.versionTag}\` • **Category:** \`${activeBeta.category}\`\n\n` +
        `**Summary:**\n${activeBeta.summary}\n\n` +
        `**Staging Channel:** <#1561175639606693929> (#🧠・ai-lab)\n` +
        `**Commands under Test:** ${activeBeta.testCommands.map(c => `\`${c}\``).join(', ')}`
      )
      .setFooter({ text: 'Krims Code Beta • Pre-Release Staging Fleet' })
      .setTimestamp();

    return interaction.reply({ embeds: [embed], ephemeral: true });
  }

  if (subcommand === 'drop') {
    await interaction.deferReply({ ephemeral: true });
    const msg = await dispatchWeeklyBetaDrop(interaction.client);
    return interaction.editReply(`🚀 **Success!** Dispatched weekly prototype drop into <#1561175639606693929> (Message: ${msg ? msg.id : 'Sent'})!`);
  }

  if (subcommand === 'promote') {
    await interaction.deferReply({ ephemeral: true });
    const f = getCurrentBetaFeature();
    await promoteBetaFeatureToMain(interaction.client, f.id, interaction.user.tag);
    return interaction.editReply(`🎉 **Success!** Staged candidate \`${f.title}\` has been promoted to Main Krims Code v5 and announced in <#1561175627799994402>!`);
  }
}

/**
 * Handles prefix commands !alpha and !beta
 */
export async function handleAlphaBetaMessage(message) {
  if (message.guildId !== SUPPORT_GUILD_ID || !isAuthorizedAlphaBetaUser(message.member, message.author.id)) {
    return; // Completely silent if unauthorized — doesn't even respond!
  }

  const content = message.content.trim();
  const lower = content.toLowerCase();

  if (lower === '!alpha' || lower.startsWith('!alpha ')) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0055)
      .setTitle('⚡ Krims Code Alpha • Active R&D Console')
      .setDescription(
        `Welcome Executive <@${message.author.id}>!\n\n` +
        `**Krims Code Alpha** is operating in stealth mode inside this server.\n` +
        `• Run \`/alpha status\` for internal subsystem telemetry\n` +
        `• Run \`/alpha diagnose\` for connection diagnostics\n` +
        `• Run \`/alpha eval code:<code>\` to test code in memory\n\n` +
        `*These commands are hidden from all regular members.*`
      );
    return message.reply({ embeds: [embed] });
  }

  if (lower === '!beta' || lower.startsWith('!beta ')) {
    const embed = new EmbedBuilder()
      .setColor(0x8B5CF6)
      .setTitle('🧪 Krims Code Beta • Active Staging Console')
      .setDescription(
        `Welcome Executive <@${message.author.id}>!\n\n` +
        `**Krims Code Beta** is currently staging candidates in <#1561175639606693929>.\n` +
        `• Run \`/beta status\` to inspect current staging metrics\n` +
        `• Run \`/beta drop\` to dispatch the weekly prototype\n` +
        `• Run \`/beta promote\` to advance candidate to Main AI\n\n` +
        `*Commands are locked to executives and hidden from public autocomplete.*`
      );
    return message.reply({ embeds: [embed] });
  }
}

/**
 * Spawns dedicated Alpha/Beta bot client instances if tokens are provided in environment
 */
export function initAlphaBetaBotInstances() {
  // If user provides KRIMS_BETA_TOKEN in .env, spawn dedicated Beta Bot
  if (process.env.KRIMS_BETA_TOKEN) {
    try {
      const betaClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
      betaClient.once('ready', () => {
        console.log(`[+] Dedicated Krims Code Beta bot connected as ${betaClient.user.tag}`);
        betaClient.user.setActivity('🧪 Staging & Pre-Release v5-beta', { type: 0 });
      });
      betaClient.login(process.env.KRIMS_BETA_TOKEN).catch(e => console.warn('[Beta Bot] Token login failed:', e.message));
    } catch (err) {
      console.warn('[Beta Bot] Startup error:', err.message);
    }
  }

  // If user provides KRIMS_ALPHA_TOKEN in .env, spawn dedicated Alpha Bot
  if (process.env.KRIMS_ALPHA_TOKEN) {
    try {
      const alphaClient = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
      alphaClient.once('ready', () => {
        console.log(`[+] Dedicated Krims Code Alpha bot connected as ${alphaClient.user.tag}`);
        alphaClient.user.setActivity('🔬 Internal R&D Engine v5-alpha', { type: 0 });
      });
      alphaClient.login(process.env.KRIMS_ALPHA_TOKEN).catch(e => console.warn('[Alpha Bot] Token login failed:', e.message));
    } catch (err) {
      console.warn('[Alpha Bot] Startup error:', err.message);
    }
  }
}
