import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder, 
  ChannelType, 
  InviteTargetType,
  PermissionFlagsBits
} from 'discord.js';

/**
 * Official Discord Voice Activities & Embedded Applications Directory
 */
export const DISCORD_ACTIVITIES = {
  youtube: {
    id: 'youtube',
    name: 'YouTube Together',
    appId: '880218394199220234',
    emoji: '📺',
    category: 'Media & Videos',
    description: 'Watch YouTube videos synchronously with your friends in voice chat!',
    color: 0xFF0000,
    banner: 'https://cdn.discordapp.com/app-icons/880218394199220234/a_d714ce9bf13de554b72ec184d2f62363.png'
  },
  chess: {
    id: 'chess',
    name: 'Chess in the Park',
    appId: '832012774040141824',
    emoji: '♟️',
    category: 'Strategy & Board Games',
    description: 'Play competitive or casual chess against server members with classic time controls.',
    color: 0x8B5A2B,
    banner: 'https://cdn.discordapp.com/app-icons/832012774040141824/60a2b02ef0a02f354f7389a444f6f369.png'
  },
  poker: {
    id: 'poker',
    name: 'Poker Night',
    appId: '755827207812677713',
    emoji: '🃏',
    category: 'Cards & Casino',
    description: 'Texas Hold\'em poker with custom bets, spectator mode, and chips.',
    color: 0x1E7E34,
    banner: 'https://cdn.discordapp.com/app-icons/755827207812677713/a_b19ef16eb8842188ff7b713ee0055ce2.png'
  },
  gartic: {
    id: 'gartic',
    name: 'Gartic on Discord',
    appId: '1007373802981822582',
    emoji: '🎨',
    category: 'Party & Drawing',
    description: 'Draw, guess, and laugh together with the classic Gartic drawing party game!',
    color: 0x3498DB,
    banner: 'https://cdn.discordapp.com/app-icons/1007373802981822582/d0ee1f40dca475965ca48ee8a6fa2e75.png'
  },
  puttparty: {
    id: 'puttparty',
    name: 'Putt Party (Mini Golf)',
    appId: '945737671539415040',
    emoji: '⛳',
    category: 'Sports & Arcade',
    description: 'Fast-paced multiplayer mini-golf with courses, obstacles, and wild powerups.',
    color: 0x2ECC71,
    banner: 'https://cdn.discordapp.com/app-icons/945737671539415040/4d552684803964ee7149a65f97f74ea7.png'
  },
  bobble: {
    id: 'bobble',
    name: 'Bobble League',
    appId: '947957217959759964',
    emoji: '⚽',
    category: 'Sports & Action',
    description: 'Physics-based RC car soccer showdown with your squad in voice chat!',
    color: 0xE67E22,
    banner: 'https://cdn.discordapp.com/app-icons/947957217959759964/67f70b7f8c057630713ffc3d9a13b632.png'
  },
  sketchheads: {
    id: 'sketchheads',
    name: 'Sketch Heads',
    appId: '902271654783242291',
    emoji: '✏️',
    category: 'Party & Trivia',
    description: 'Classic party doodle and rapid-fire sketch guessing showdown.',
    color: 0x9B59B6,
    banner: 'https://cdn.discordapp.com/app-icons/902271654783242291/9ac85514f77cbb6509f485db1f13ae91.png'
  },
  letterleague: {
    id: 'letterleague',
    name: 'Letter League',
    appId: '879863686565621790',
    emoji: '🔤',
    category: 'Word & Puzzle',
    description: 'Multiplayer word crossword tile game similar to Scrabble.',
    color: 0xF39C12,
    banner: 'https://cdn.discordapp.com/app-icons/879863686565621790/32d0c2664ef852a229a990ec8268ad33.png'
  },
  wordsnacks: {
    id: 'wordsnacks',
    name: 'Word Snacks',
    appId: '879863976006127627',
    emoji: '🍪',
    category: 'Word & Puzzle',
    description: 'Find as many words as possible from letter cookies before time runs out!',
    color: 0xD35400,
    banner: 'https://cdn.discordapp.com/app-icons/879863976006127627/c253b216964177dfd2ef74e50ab52cf3.png'
  },
  spellcast: {
    id: 'spellcast',
    name: 'SpellCast',
    appId: '852509694341283840',
    emoji: '🧙',
    category: 'Word & Magic',
    description: 'Cast mystical spells by assembling magical letter grids and words.',
    color: 0x8E44AD,
    banner: 'https://cdn.discordapp.com/app-icons/852509694341283840/c0205837be9d8dcfbfb2c3d0b2db48d5.png'
  },
  checkers: {
    id: 'checkers',
    name: 'Checkers in the Park',
    appId: '832013003968348200',
    emoji: '🏁',
    category: 'Classic Board Games',
    description: 'Traditional checkers with quick rules and casual jump-in play.',
    color: 0xC0392B,
    banner: 'https://cdn.discordapp.com/app-icons/832013003968348200/a_6c11dbb5b7e889b657ba6131cfa068e3.png'
  },
  blazing8s: {
    id: 'blazing8s',
    name: 'Blazing 8s',
    appId: '832025144384774184',
    emoji: '🎴',
    category: 'Cards & Uno',
    description: 'Crazy Eights / Uno card game with action cards, color shifts, and fast rounds.',
    color: 0xE74C3C,
    banner: 'https://cdn.discordapp.com/app-icons/832025144384774184/a_ec8eb496057ff744fc8dbd30a846c406.png'
  },
  landio: {
    id: 'landio',
    name: 'Land-io',
    appId: '903100365269786695',
    emoji: '🗺️',
    category: 'Arcade & Battle',
    description: 'Claim territory, encircle rivals, and dominate the arena in real time.',
    color: 0x16A085,
    banner: 'https://cdn.discordapp.com/app-icons/903100365269786695/d5bcfdca6469cf36fc5fa1248c8b4172.png'
  },
  colonist: {
    id: 'colonist',
    name: 'Colonist (Catan)',
    appId: '1107689953867010118',
    emoji: '🌾',
    category: 'Strategy & Trading',
    description: 'Strategic board game based on Catan. Harvest resources, trade, and build settlements!',
    color: 0xF1C40F,
    banner: 'https://cdn.discordapp.com/app-icons/1107689953867010118/38a08c0efee7b6058097b69c4c23ba7d.png'
  },
  meme: {
    id: 'meme',
    name: 'Know What I Meme',
    appId: '950536550771327016',
    emoji: '🧠',
    category: 'Party & Humor',
    description: 'Match hilarious captions with trending GIF memes and vote on the champion meme!',
    color: 0x00CEC9,
    banner: 'https://cdn.discordapp.com/app-icons/950536550771327016/547e12e2c07ef4f0a2ba19e48fa3959c.png'
  },
  jamspace: {
    id: 'jamspace',
    name: 'Jamspace (Whiteboard)',
    appId: '1070088174712123493',
    emoji: '📝',
    category: 'Collaboration & Art',
    description: 'Collaborative infinite digital whiteboard for brainstorming, notes, diagrams, and doodles.',
    color: 0x6C5CE7,
    banner: 'https://cdn.discordapp.com/app-icons/1070088174712123493/9c2ba43491fba3d527ca36b3e34b9d5c.png'
  },
  krimscode: {
    id: 'krimscode',
    name: 'Krims Code AI Portal',
    appId: '1523794466740371586',
    emoji: '⚡',
    category: 'AI Assistant & Games',
    description: 'Launch the official Krims Code AI Web Console and Community Portal inside Discord!',
    color: 0x00E5FF,
    banner: 'https://krims-bot-dashboard.vercel.app/logo.png'
  }
};

/**
 * Creates an activity invite for a voice channel
 */
export async function createActivityInvite(voiceChannel, appId) {
  try {
    const invite = await voiceChannel.createInvite({
      maxAge: 86400,
      maxUses: 0,
      targetType: InviteTargetType.EmbeddedApplication,
      targetApplication: appId
    });
    return invite;
  } catch (err) {
    console.warn(`[Activity Engine] Failed to create invite for ${appId} in ${voiceChannel.name}:`, err.message);
    throw err;
  }
}

/**
 * Builds the interactive Activity Selector Dropdown
 */
export function buildActivitySelectMenu(customId = 'activity_select_game') {
  const options = Object.values(DISCORD_ACTIVITIES).slice(0, 25).map(act => ({
    label: act.name,
    description: act.description.slice(0, 100),
    value: act.id,
    emoji: act.emoji
  }));

  const select = new StringSelectMenuBuilder()
    .setCustomId(customId)
    .setPlaceholder('🎮 Select a game or activity to launch...')
    .addOptions(options);

  return new ActionRowBuilder().addComponents(select);
}

/**
 * Builds the Rich Launch Embed and Action Buttons
 */
export function buildActivityLaunchPayload(activity, voiceChannel, invite, launcherUser) {
  const launchUrl = `https://discord.gg/${invite.code}`;

  const embed = new EmbedBuilder()
    .setColor(activity.color || 0x00E5FF)
    .setTitle(`${activity.emoji} ${activity.name.toUpperCase()} — ACTIVITY READY!`)
    .setDescription(
      `**${activity.name}** has been initialized in <#${voiceChannel.id}>! 🚀\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• **Category:** \`${activity.category}\`\n` +
      `• **Voice Channel:** <#${voiceChannel.id}>\n` +
      `• **Started By:** <@${launcherUser.id}>\n` +
      `• **Description:** ${activity.description}\n\n` +
      `👉 **Click the button below to join the voice room and open the activity immediately!**`
    )
    .setThumbnail(activity.banner)
    .setFooter({ text: 'Krims Code AI • Discord Voice Activities' })
    .setTimestamp();

  const launchBtn = new ButtonBuilder()
    .setLabel(`🚀 Launch ${activity.name}`)
    .setStyle(ButtonStyle.Link)
    .setURL(launchUrl);

  const channelBtn = new ButtonBuilder()
    .setLabel(`🔊 Join <#${voiceChannel.name}>`)
    .setStyle(ButtonStyle.Link)
    .setURL(`https://discord.com/channels/${voiceChannel.guild.id}/${voiceChannel.id}`);

  const row = new ActionRowBuilder().addComponents(launchBtn, channelBtn);

  return { embeds: [embed], components: [row] };
}

/**
 * Main Slash Command Handler for /activity
 */
export async function handleActivityCommand(interaction) {
  const guild = interaction.guild;
  if (!guild) {
    return await interaction.reply({ content: '❌ This command can only be used in a server.', ephemeral: true });
  }

  // 1. Determine target Voice Channel
  let voiceChannel = interaction.options.getChannel('channel');

  if (!voiceChannel) {
    // Check if user is currently inside a voice channel in this server
    const memberVoice = interaction.member?.voice?.channel;
    if (memberVoice && (memberVoice.type === ChannelType.GuildVoice || memberVoice.type === ChannelType.GuildStageVoice)) {
      voiceChannel = memberVoice;
    }
  }

  // If still no voice channel, find available voice channels to prompt user
  if (!voiceChannel) {
    const availableVoiceChannels = guild.channels.cache
      .filter(c => c.type === ChannelType.GuildVoice)
      .first(5);

    const embed = new EmbedBuilder()
      .setColor(0xF59E0B)
      .setTitle('🔊 Join a Voice Channel First!')
      .setDescription(
        `Discord Activities run directly inside **Voice Channels**! 🎙️\n\n` +
        `**To launch an activity:**\n` +
        `1. Join any voice channel (like ${availableVoiceChannels.map(c => `<#${c.id}>`).join(' or ') || 'General'})\n` +
        `2. Run \`/activity game:<name>\` or select an activity below!\n\n` +
        `*(Or run \`/activity channel:<#voice_channel>\` to launch in a specific channel!)*`
      )
      .setFooter({ text: 'Krims Code AI • Voice Activities' });

    const menu = buildActivitySelectMenu('activity_select_game_no_vc');
    return await interaction.reply({ embeds: [embed], components: [menu], ephemeral: true });
  }

  // Check bot permissions in voice channel
  const perms = voiceChannel.permissionsFor(guild.members.me);
  if (perms && !perms.has(PermissionFlagsBits.CreateInstantInvite)) {
    return await interaction.reply({
      content: `❌ I need \`Create Invite\` permission in <#${voiceChannel.id}> to launch Discord Activities!`,
      ephemeral: true
    });
  }

  // 2. Determine target Game / Activity
  const gameKey = (interaction.options.getString('game') || '').toLowerCase().trim();

  if (!gameKey || !DISCORD_ACTIVITIES[gameKey]) {
    // Show catalog menu
    const catalogEmbed = new EmbedBuilder()
      .setColor(0x00E5FF)
      .setTitle('🚀 DISCORD VOICE ACTIVITIES & GAMES CATALOG')
      .setDescription(
        `Select an activity from the menu below to launch it inside <#${voiceChannel.id}>!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `• 📺 **YouTube Together:** Watch YouTube videos in sync with friends\n` +
        `• ♟️ **Chess in the Park:** Play multiplayer chess matches\n` +
        `• 🃏 **Poker Night:** Classic Texas Hold'em with chips & spectators\n` +
        `• 🎨 **Gartic on Discord:** Multiplayer drawing & hilarious guessing\n` +
        `• ⛳ **Putt Party:** Fast-paced mini-golf tournaments\n` +
        `• ⚽ **Bobble League:** RC Car soccer in voice chat\n` +
        `• 🌾 **Colonist:** Catan strategy board game\n` +
        `• ⚡ **Krims Code AI Portal:** Launch our official embedded web app!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👇 *Choose any game below to generate your instant launch button:*`
      )
      .setFooter({ text: `Target Room: #${voiceChannel.name}` });

    const menu = buildActivitySelectMenu(`activity_launch_${voiceChannel.id}`);
    return await interaction.reply({ embeds: [catalogEmbed], components: [menu] });
  }

  const activity = DISCORD_ACTIVITIES[gameKey];

  await interaction.deferReply();
  try {
    const invite = await createActivityInvite(voiceChannel, activity.appId);
    const payload = buildActivityLaunchPayload(activity, voiceChannel, invite, interaction.user);
    return await interaction.editReply(payload);
  } catch (err) {
    return await interaction.editReply({
      content: `❌ Failed to launch **${activity.name}** in <#${voiceChannel.id}>: \`${err.message}\`. Ensure the bot has \`Create Invite\` permission!`
    });
  }
}

/**
 * Handles StringSelectMenu interactions for activity selection
 */
export async function handleActivitySelectInteraction(interaction) {
  if (!interaction.isStringSelectMenu()) return false;
  const customId = interaction.customId;
  if (!customId.startsWith('activity_select_game') && !customId.startsWith('activity_launch_')) {
    return false;
  }

  const selectedKey = interaction.values[0];
  const activity = DISCORD_ACTIVITIES[selectedKey];
  if (!activity) return false;

  const guild = interaction.guild;
  if (!guild) return false;

  let voiceChannel = null;

  // Check if channel ID was encoded in customId
  if (customId.startsWith('activity_launch_')) {
    const channelId = customId.replace('activity_launch_', '');
    voiceChannel = guild.channels.cache.get(channelId);
  }

  if (!voiceChannel) {
    const memberVoice = interaction.member?.voice?.channel;
    if (memberVoice && (memberVoice.type === ChannelType.GuildVoice || memberVoice.type === ChannelType.GuildStageVoice)) {
      voiceChannel = memberVoice;
    }
  }

  if (!voiceChannel) {
    return await interaction.reply({
      content: `⚠️ You must join a Voice Channel first to launch **${activity.emoji} ${activity.name}**!`,
      ephemeral: true
    });
  }

  await interaction.deferReply();
  try {
    const invite = await createActivityInvite(voiceChannel, activity.appId);
    const payload = buildActivityLaunchPayload(activity, voiceChannel, invite, interaction.user);
    return await interaction.editReply(payload);
  } catch (err) {
    return await interaction.editReply({
      content: `❌ Could not launch **${activity.name}**: \`${err.message}\`.`
    });
  }
}
