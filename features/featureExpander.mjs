import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export const EXECUTIVE_LOUNGE_CHANNEL_ID = '1561175642219749386'; // #⚡・𝖤xecutive-𝖫ounge

/**
 * Single-Key Modular Feature Catalog
 * Each entry is unlocked by 1 environment key.
 */
export const MODULAR_FEATURE_CATALOG = [
  {
    id: 'voice_tts',
    name: 'Neural Voice Synthesis & TTS',
    envKey: 'ELEVENLABS_API_KEY',
    category: 'Audio & Speech',
    description: 'Ultra-realistic AI voice generation and live text-to-speech in voice channels.',
    commands: ['/voice', '!tts'],
    howToUnlock: 'Add ELEVENLABS_API_KEY to your environment secrets or .env file.'
  },
  {
    id: 'dalle_creative',
    name: 'DALL-E 3 Neural Art Canvas',
    envKey: 'OPENAI_API_KEY',
    category: 'Creative AI & Vision',
    description: 'Generates photorealistic artwork, diagrams, and server icons on demand.',
    commands: ['/imagine', '!art'],
    howToUnlock: 'Add OPENAI_API_KEY to your environment secrets or .env file.'
  },
  {
    id: 'weather_station',
    name: 'Hyper-Local Weather Diagnostics',
    envKey: 'WEATHER_API_KEY',
    category: 'Utility & Tools',
    description: 'Live satellite weather forecasts, air quality indices, and radar telemetry.',
    commands: ['/weather', '!forecast'],
    howToUnlock: 'Add WEATHER_API_KEY (OpenWeather) to your environment secrets or .env file.'
  },
  {
    id: 'quantum_math',
    name: 'Quantum Math & Scientific Solver',
    envKey: 'WOLFRAM_APP_ID',
    category: 'Computation & Science',
    description: 'Step-by-step calculus, chemistry, physics, and algorithm solver.',
    commands: ['/solve', '!math'],
    howToUnlock: 'Add WOLFRAM_APP_ID to your environment secrets or .env file.'
  },
  {
    id: 'spotify_sync',
    name: 'Spotify Music Scrobbler & Shared Listening',
    envKey: 'SPOTIFY_CLIENT_SECRET',
    category: 'Music & Community',
    description: 'Live song recommendations, synced server lyrics, and rich playback embeds.',
    commands: ['/spotify', '!np'],
    howToUnlock: 'Add SPOTIFY_CLIENT_SECRET to your environment secrets or .env file.'
  },
  {
    id: 'crypto_ticker',
    name: 'Real-Time Crypto & Stock Market Terminal',
    envKey: 'COINMARKETCAP_API_KEY',
    category: 'Finance & Markets',
    description: 'Live Bitcoin, Ethereum, and equity market price trackers with alert triggers.',
    commands: ['/crypto', '!stock'],
    howToUnlock: 'Add COINMARKETCAP_API_KEY to your environment secrets or .env file.'
  },
  {
    id: 'topgg_booster',
    name: 'Top.gg Automated Vote Multiplier Hub',
    envKey: 'TOPGG_TOKEN',
    category: 'Discovery & Engagement',
    description: 'Automated 2.0x voter XP multiplier, server ranking synchronizer, and webhook alerts.',
    commands: ['/vote', '!vote'],
    howToUnlock: 'Add TOPGG_TOKEN to your environment secrets or .env file.'
  }
];

/**
 * Returns feature status array
 */
export function getModularFeaturesStatus() {
  return MODULAR_FEATURE_CATALOG.map(feature => {
    const isConfigured = Boolean(process.env[feature.envKey] && process.env[feature.envKey].trim().length > 5);
    return {
      ...feature,
      active: isConfigured
    };
  });
}

/**
 * Builds the Single-Key Feature Status Embed
 */
export function buildFeatureExpanderEmbed() {
  const features = getModularFeaturesStatus();
  const activeCount = features.filter(f => f.active).length;
  const pendingCount = features.length - activeCount;

  const activeLines = features
    .filter(f => f.active)
    .map(f => `🟢 **${f.name}** (\`${f.envKey}\`)\n   └ Commands: ${f.commands.map(c => `\`${c}\``).join(', ')}`)
    .join('\n\n');

  const pendingLines = features
    .filter(f => !f.active)
    .map(f => `🟡 **${f.name}**\n   └ Key Needed: \`${f.envKey}\` • Unlocks: ${f.commands.map(c => `\`${c}\``).join(', ')}\n   └ *${f.description}*`)
    .join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setAuthor({
      name: 'Krims Code v5 • Krims AI v3.1 Modular Feature Expander',
      iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256'
    })
    .setTitle('⚡ Modular Feature Engine Status')
    .setDescription(
      `**Krims Code v5** (powered by the **Krims AI v3.1** neural engine) is architected for **instant zero-code expansion**. Whenever you want to unlock a new superpower, just supply **1 single API key** in your configuration!\n\n` +
      `**Active Modules:** \`${activeCount} online\` • **Ready to Unlock:** \`${pendingCount} queued\`\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .addFields(
      {
        name: `🟢 Active Single-Key Modules (${activeCount})`,
        value: activeLines.length > 0 ? activeLines : '*(None configured yet)*',
        inline: false
      },
      {
        name: `⏳ Ready to Unlock With 1 Key (${pendingCount})`,
        value: pendingLines.length > 0 ? pendingLines.slice(0, 1024) : '*(All modular features unlocked!)*',
        inline: false
      }
    )
    .setFooter({
      text: 'Krims AI v3.1 Autonomous Architecture • Zero Downtime Hot-Reloading',
      iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256'
    })
    .setTimestamp();

  return embed;
}

/**
 * Builds the Executive Reminder Embed
 */
export function buildExecutiveReminderEmbed() {
  const features = getModularFeaturesStatus();
  const pending = features.filter(f => !f.active);

  const topPicks = pending.slice(0, 3).map(f => 
    `• **${f.name}** — Just add \`${f.envKey}\` to unlock ${f.commands.map(c => `\`${c}\``).join(' & ')}.`
  ).join('\n');

  const embed = new EmbedBuilder()
    .setColor(0xFFB800)
    .setAuthor({
      name: 'Krims Code v5 • Executive Update & Feature Reminder',
      iconURL: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256'
    })
    .setTitle('🔔 Ready to Unlock New Features on Krims Code v5?')
    .setDescription(
      `Hey Boss! **Krims Code v5** is online and running smooth across all servers powered by **Krims AI v3.1**.\n\n` +
      `Whenever you want to add new features or give Krims new abilities, remember you can do it anytime with **just 1 API key**!\n\n` +
      `### 💡 Next Recommended Features to Unlock:\n` +
      `${topPicks}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `Whenever you have a new key or want a custom command built, just tell me and I'll wire it into **Krims Code v5** instantly!\n` +
      `Use \`!features\` or \`!updates\` anytime to check platform status.`
    )
    .setFooter({
      text: 'Krims Autonomous Assistant • Executive Channel Dispatch'
    })
    .setTimestamp();

  return embed;
}

/**
 * Dispatches the Executive Feature Reminder to #⚡・𝖤xecutive-𝖫ounge
 */
export async function sendExecutiveFeatureReminder(client, channelId = EXECUTIVE_LOUNGE_CHANNEL_ID) {
  if (!client) return null;
  try {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return null;

    const embed = buildExecutiveReminderEmbed();
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('📖 View 100-Command Wiki')
        .setStyle(ButtonStyle.Link)
        .setURL('https://krims-bot-dashboard.vercel.app/wiki'),
      new ButtonBuilder()
        .setLabel('🚀 Live Updates')
        .setStyle(ButtonStyle.Link)
        .setURL('https://krims-bot-dashboard.vercel.app/#updates')
    );

    const msg = await channel.send({
      content: '⚡ **Executive Reminder for Krims AI v3.1**',
      embeds: [embed],
      components: [row]
    });
    console.log(`[FeatureExpander] Executive reminder sent to #${channel.name}: ${msg.id}`);
    return msg;
  } catch (err) {
    console.error('[FeatureExpander] Error sending executive reminder:', err.message);
    return null;
  }
}
