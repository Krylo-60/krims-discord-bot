import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits,
  Client,
  GatewayIntentBits,
  ApplicationCommandOptionType,
  REST,
  Routes
} from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREMIUM_DB_FILE = path.resolve(__dirname, '../data/premium_guilds.json');

export const OWNER_USER_ID = '1414143825538191373';
export const SUPPORT_GUILD_ID = '1561174283294609479';
export const EXECUTIVE_ROLE_ID = '1561175610930233464';

let premiumStore = {
  guilds: {
    // Grandfather the Official Support Server as Lifetime Enterprise Premium
    '1561174283294609479': {
      tier: 'enterprise',
      tierName: '💎 Enterprise Lifetime VIP',
      multiplier: 3.0,
      activatedAt: Date.now(),
      expiresAt: null, // Never expires
      customBotsAllowed: 10,
      licenseKey: 'KRIMS-ENTERPRISE-FOUNDER'
    },
    // Grandfather The_Half_Lifes as Lifetime Enterprise Premium
    '1557852594242719775': {
      tier: 'enterprise',
      tierName: '💎 Enterprise Lifetime VIP',
      multiplier: 3.0,
      activatedAt: Date.now(),
      expiresAt: null,
      customBotsAllowed: 10,
      licenseKey: 'KRIMS-HALF-LIFES-FOUNDER'
    }
  },
  issuedKeys: {}
};

function loadPremiumStore() {
  try {
    if (fs.existsSync(PREMIUM_DB_FILE)) {
      premiumStore = JSON.parse(fs.readFileSync(PREMIUM_DB_FILE, 'utf8'));
    } else {
      savePremiumStore();
    }
  } catch (err) {
    console.warn('[PremiumManager] Initializing defaults:', err.message);
    savePremiumStore();
  }
}

function savePremiumStore() {
  try {
    const dir = path.dirname(PREMIUM_DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(PREMIUM_DB_FILE, JSON.stringify(premiumStore, null, 2), 'utf8');
  } catch (err) {
    console.error('[PremiumManager] Save error:', err.message);
  }
}

loadPremiumStore();

/**
 * Checks if a guild has active Premium status
 */
export function getGuildPremiumStatus(guildId) {
  const g = premiumStore.guilds[guildId];
  if (!g) return { isPremium: false, tier: 'free', tierName: 'Standard Free Tier', multiplier: 1.0 };

  // Check if expired
  if (g.expiresAt && g.expiresAt < Date.now()) {
    delete premiumStore.guilds[guildId];
    savePremiumStore();
    return { isPremium: false, tier: 'free', tierName: 'Standard Free Tier', multiplier: 1.0 };
  }

  return {
    isPremium: true,
    tier: g.tier,
    tierName: g.tierName,
    multiplier: g.multiplier || 2.0,
    expiresAt: g.expiresAt,
    customBotsAllowed: g.customBotsAllowed || 1
  };
}

/**
 * Generates a cryptographic Premium License Key
 */
export function generateLicenseKey(tier = 'premium', days = 30) {
  const segment1 = tier.toUpperCase().slice(0, 4);
  const segment2 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const segment3 = crypto.randomBytes(3).toString('hex').toUpperCase();
  const key = `KRIMS-${segment1}-${segment2}-${segment3}`;

  premiumStore.issuedKeys[key] = {
    tier,
    days,
    created: Date.now(),
    redeemed: false,
    redeemedByGuild: null,
    redeemedAt: null
  };
  savePremiumStore();
  return key;
}

/**
 * Redeems a License Key for a Guild
 */
export function redeemLicenseKey(guildId, key) {
  const cleanKey = key.trim().toUpperCase();
  const keyData = premiumStore.issuedKeys[cleanKey];

  if (!keyData) {
    return { success: false, error: 'Invalid license key. Please check formatting.' };
  }
  if (keyData.redeemed) {
    return { success: false, error: 'This license key has already been redeemed.' };
  }

  const durationMs = keyData.days ? keyData.days * 86400000 : null;
  const expiresAt = durationMs ? Date.now() + durationMs : null;

  const tierMap = {
    pro: { name: '⚡ Krims Pro Tier', multiplier: 2.0, bots: 2 },
    premium: { name: '💎 Krims Premium VIP', multiplier: 3.0, bots: 5 },
    enterprise: { name: '👑 Krims Enterprise Cluster', multiplier: 3.0, bots: 25 }
  };

  const selectedTier = tierMap[keyData.tier] || tierMap.premium;

  premiumStore.guilds[guildId] = {
    tier: keyData.tier,
    tierName: selectedTier.name,
    multiplier: selectedTier.multiplier,
    activatedAt: Date.now(),
    expiresAt,
    customBotsAllowed: selectedTier.bots,
    licenseKey: cleanKey
  };

  keyData.redeemed = true;
  keyData.redeemedByGuild = guildId;
  keyData.redeemedAt = Date.now();

  savePremiumStore();
  return { success: true, tierName: selectedTier.name, expiresAt };
}

/**
 * Builds the lavish Premium Perks Embed
 */
export function buildPremiumPerksEmbed(guildId = null) {
  const status = guildId ? getGuildPremiumStatus(guildId) : { isPremium: false };

  const embed = new EmbedBuilder()
    .setColor(0x8B5CF6) // Royal Violet / Amethyst
    .setAuthor({
      name: 'Krims Code v5 • Premium & Enterprise VIP Architecture',
      iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256'
    })
    .setTitle('💎 Unlock Next-Generation Power with Krims Code Premium')
    .setDescription(
      `Take your Discord community to the absolute pinnacle with **Krims Code Premium**.\n` +
      `Built on dedicated high-speed cloud clusters with guaranteed **0ms queue latency**, custom bot white-labeling, and advanced AI persona control.\n\n` +
      `**Current Server Status:** ${status.isPremium ? `🟢 \`${status.tierName}\` (ACTIVE)` : '⚪ `Standard Free Tier`'}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .addFields(
      {
        name: '⚡ Pro Tier ($4.99 / mo)',
        value: 
          `• **1 Custom-Branded Bot:** Host under your server name & avatar\n` +
          `• **2.0x Universal XP Multiplier:** Stacking permanent server boost\n` +
          `• **Custom AI Persona:** Custom system prompt & persona name\n` +
          `• **Standard Cloud Priority:** Fast responses without cooldowns`,
        inline: false
      },
      {
        name: '💎 Premium VIP Tier ($14.99 / mo)',
        value: 
          `• **Up to 5 Custom Bots:** Spawn dedicated bots for events & departments\n` +
          `• **3.0x Leveling Multiplier:** Maximum progression speed for all members\n` +
          `• **0ms Dedicated Compute Pipeline:** Zero queue delay even during peak hours\n` +
          `• **Full White-Labeling:** Remove all Krims branding if desired\n` +
          `• **Priority Ticket Routing:** Automatic escalation to Lead Developers`,
        inline: false
      },
      {
        name: '👑 Enterprise Cluster (Custom Fleet)',
        value: 
          `• **Unlimited Bot Spawning:** Fleet orchestration up to 50+ instances\n` +
          `• **Dedicated Private Node.js / Python Cluster:** Isolated memory space\n` +
          `• **Custom API Integration:** Sync with your own web platform & databases\n` +
          `• **24/7 VIP SLA & Direct Developer Hotline**`,
        inline: false
      }
    )
    .setFooter({
      text: 'Krims Code v5 Enterprise Architecture • Zero Downtime',
      iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256'
    })
    .setTimestamp();

  return embed;
}

/**
 * Builds interactive Action Row for Premium
 */
export function buildPremiumActionRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('🎛️ Open Dashboard')
      .setStyle(ButtonStyle.Link)
      .setURL('https://krims-bot-dashboard.vercel.app/'),
    new ButtonBuilder()
      .setLabel('📖 View Wiki Pricing')
      .setStyle(ButtonStyle.Link)
      .setURL('https://krims-bot-dashboard.vercel.app/wiki#pricing'),
    new ButtonBuilder()
      .setLabel('🎫 Contact Executive Support')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/EYHTgJX')
  );
}

/**
 * Handles /premium command execution
 */
export async function handlePremiumCommand(interaction) {
  const subcommand = interaction.options?.getSubcommand() || 'perks';

  if (subcommand === 'perks') {
    const embed = buildPremiumPerksEmbed(interaction.guildId);
    const row = buildPremiumActionRow();
    return interaction.reply({ embeds: [embed], components: [row] });
  }

  if (subcommand === 'status') {
    const status = getGuildPremiumStatus(interaction.guildId);
    const embed = new EmbedBuilder()
      .setColor(status.isPremium ? 0x00F2FF : 0x718096)
      .setTitle(`💎 Premium Subscription Status: ${interaction.guild.name}`)
      .setDescription(
        `**Tier:** \`${status.tierName}\`\n` +
        `**Status:** ${status.isPremium ? '🟢 ACTIVE & ONLINE' : '⚪ Free Tier'}\n` +
        `**Server XP Multiplier:** \`${status.multiplier}x Multiplier\`\n` +
        `**Custom Bots Allowed:** \`${status.customBotsAllowed || 1} instance(s)\`\n` +
        `**Expires:** ${status.expiresAt ? `<t:${Math.floor(status.expiresAt / 1000)}:R>` : '`Never (Lifetime Access)`'}`
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (subcommand === 'activate') {
    const key = interaction.options.getString('key');
    const result = redeemLicenseKey(interaction.guildId, key);

    if (!result.success) {
      return interaction.reply({
        content: `❌ **Activation Failed:** ${result.error}`,
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🎉 PREMIUM ACTIVATION SUCCESSFUL!')
      .setDescription(
        `👑 Congratulations! **${interaction.guild.name}** has unlocked **${result.tierName}**!\n\n` +
        `• **Perpetual XP Multiplier:** Active for all server members\n` +
        `• **Custom Bot Spawner:** Unlocked in \`/setupbot\`\n` +
        `• **VIP Compute Node:** Connected with 0ms priority routing\n` +
        `• **Expires:** ${result.expiresAt ? `<t:${Math.floor(result.expiresAt / 1000)}:R>` : '`Lifetime Access`'}`
      )
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }

  if (subcommand === 'genkey') {
    const isOwner = interaction.user.id === OWNER_USER_ID || 
                    interaction.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
                    interaction.member?.roles?.cache?.has(EXECUTIVE_ROLE_ID);

    if (!isOwner) {
      return interaction.reply({
        content: '🔒 Only Server Executives can mint cryptographic license keys.',
        ephemeral: true
      });
    }

    const tier = interaction.options.getString('tier') || 'premium';
    const days = interaction.options.getInteger('days') || 30;
    const key = generateLicenseKey(tier, days);

    return interaction.reply({
      content: `🔑 **New License Key Generated!**\n\`\`\`\n${key}\n\`\`\`\n**Tier:** \`${tier.toUpperCase()}\` • **Duration:** \`${days === 0 ? 'Lifetime' : `${days} Days`}\`\n*Give this key to a server owner to activate via \`/premium activate key:${key}\`!*`,
      ephemeral: true
    });
  }
}

/**
 * Handles prefix command !premium
 */
export async function handlePremiumMessage(message, args = []) {
  if (args[0] === 'status') {
    const status = getGuildPremiumStatus(message.guildId);
    const embed = new EmbedBuilder()
      .setColor(status.isPremium ? 0x00F2FF : 0x718096)
      .setTitle(`💎 Premium Subscription Status: ${message.guild.name}`)
      .setDescription(
        `**Tier:** \`${status.tierName}\`\n` +
        `**Status:** ${status.isPremium ? '🟢 ACTIVE & ONLINE' : '⚪ Free Tier'}\n` +
        `**Server XP Multiplier:** \`${status.multiplier}x Multiplier\`\n` +
        `**Custom Bots Allowed:** \`${status.customBotsAllowed || 1} instance(s)\`\n` +
        `**Expires:** ${status.expiresAt ? `<t:${Math.floor(status.expiresAt / 1000)}:R>` : '`Never (Lifetime Access)`'}`
      );
    return message.reply({ embeds: [embed] });
  }

  if (args[0] === 'activate' && args[1]) {
    const result = redeemLicenseKey(message.guildId, args[1]);
    if (!result.success) {
      return message.reply(`❌ **Activation Failed:** ${result.error}`);
    }
    return message.reply(`🎉 **Success!** Unlocked **${result.tierName}** on this server!`);
  }

  const embed = buildPremiumPerksEmbed(message.guildId);
  const row = buildPremiumActionRow();
  return message.reply({ embeds: [embed], components: [row] });
}

export let premClient = null;

export const PREMIUM_COMMAND_DEFINITION = {
  name: 'premium',
  description: '💎 Krims Code Premium VIP commands & perks',
  options: [
    {
      name: 'status',
      description: 'Check this server\'s VIP tier, XP multiplier, and fleet allocations',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'perks',
      description: 'View all Premium, Pro, and Enterprise VIP features',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'activate',
      description: 'Activate a cryptographic VIP license key for this server',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'key',
          description: 'The cryptographic license key (KRIMS-...)',
          type: ApplicationCommandOptionType.String,
          required: true
        }
      ]
    },
    {
      name: 'genkey',
      description: '👑 [Executive] Mint a new cryptographic VIP license key',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'tier',
          description: 'License tier (pro, premium, enterprise)',
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: 'Pro Tier ($4.99/mo)', value: 'pro' },
            { name: 'Premium VIP ($14.99/mo)', value: 'premium' },
            { name: 'Enterprise Lifetime VIP', value: 'enterprise' }
          ]
        },
        {
          name: 'days',
          description: 'Duration in days (0 for permanent lifetime)',
          type: ApplicationCommandOptionType.Integer,
          required: false
        }
      ]
    }
  ]
};

export async function registerPremiumCommands(token, clientId = '1562586215822266599') {
  if (!token) return;
  try {
    const rest = new REST({ version: '10' }).setToken(token);
    // Guild commands deploy instantly without caching delay
    const targetGuilds = ['1557852594242719775', '1561174283294609479'];
    for (const gId of targetGuilds) {
      await rest.put(Routes.applicationGuildCommands(clientId, gId), {
        body: [PREMIUM_COMMAND_DEFINITION]
      }).catch(e => console.warn(`[Premium Bot] Guild command register warning for ${gId}:`, e.message));
    }
    await rest.put(Routes.applicationCommands(clientId), {
      body: [PREMIUM_COMMAND_DEFINITION]
    }).catch(e => console.warn('[Premium Bot] Global register warning:', e.message));
    console.log('[+] Krims Code Premium slash commands synced successfully!');
  } catch (err) {
    console.warn('[Premium Bot] Slash command registration notice:', err.message);
  }
}

/**
 * Standalone Krims Code Premium Bot Client Runner
 * Will automatically connect whenever KRIMS_PREMIUM_TOKEN is configured in environment!
 */
export function initPremiumBotInstance() {
  const token = process.env.KRIMS_PREMIUM_TOKEN || process.env.DISCORD_PREMIUM_TOKEN;
  if (token) {
    try {
      premClient = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
      });

      premClient.on('ready', async () => {
        console.log(`[+] Dedicated Krims Code Premium bot online as ${premClient.user.tag}`);
        premClient.user.setPresence({
          status: 'online',
          activities: [{ name: '💎 /premium • Dedicated VIP Cluster', type: 3 }]
        });
        registerPremiumCommands(token, premClient.user.id).catch(() => {});
      });

      premClient.on('interactionCreate', async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (interaction.commandName === 'premium') return handlePremiumCommand(interaction);
      });

      premClient.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        // Prefix !premium command handling
        if (message.content.toLowerCase().startsWith('!premium')) {
          const args = message.content.slice(8).trim().split(/\s+/).filter(Boolean);
          return handlePremiumMessage(message, args);
        }

        // Direct mention response
        if (premClient?.user && message.mentions.has(premClient.user)) {
          const status = getGuildPremiumStatus(message.guildId);
          const embed = new EmbedBuilder()
            .setColor(0xF59E0B) // Golden Amber
            .setTitle('💎 Krims Code Premium • Dedicated VIP Cluster')
            .setDescription(
              `**Server:** **${message.guild?.name || 'VIP Server'}**\n` +
              `**Status:** ${status.isPremium ? `🟢 \`${status.tierName}\` (ACTIVE)` : '⚪ `Standard Tier`'}\n` +
              `**XP Multiplier:** \`${status.multiplier}x Multiplier\`\n` +
              `**Priority Compute:** \`0ms VIP Dedicated Pipeline\`\n\n` +
              `Type \`/premium perks\` or \`/premium status\` to view all capabilities!`
            )
            .setFooter({ text: 'Krims Code Enterprise Architecture • 100% Uptime' })
            .setTimestamp();

          const row = buildPremiumActionRow();
          return message.reply({ embeds: [embed], components: [row] });
        }
      });

      premClient.login(token).catch(e => console.warn('[Premium Bot] Login warning:', e.message));
    } catch (err) {
      console.warn('[Premium Bot] Startup error:', err.message);
    }
  }
}
