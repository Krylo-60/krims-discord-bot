import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } from 'discord.js';

export const ELITE_SMP_INTEL = {
  server: {
    name: 'Elite SMP',
    website: 'https://elitesmp.gg/',
    discord: 'https://discord.gg/XBgjQxbWpb',
    description: 'A player-driven Minecraft survival server built around teams, territory, PvP, competition and long-term gameplay.',
    versions: 'Java Edition 1.21.x – 26.2 & latest Bedrock Edition',
    javaIp: 'elitesmp.gg',
    javaPort: 25565,
    bedrockIp: 'elitesmp.gg',
    bedrockPort: 19132,
    bedrockNamingRule: 'Bedrock gamertags start with a dot "." (e.g. .YourGamertag) and spaces become underscores.'
  },
  rules: [
    { title: 'Raiding & Stealing: ALLOWED', desc: 'Stealing items, raiding bases, and taking resources from other teams is allowed. Protect your valuables; staff will not restore items lost through normal gameplay.' },
    { title: 'No Cheats or Unfair Advantages', desc: 'Hacked clients, X-ray, KillAura, autoclickers, macros, exploits, and unfair advantage tools are strictly prohibited.' },
    { title: 'AFK Only in /afk', desc: 'Do not AFK at farms, spawners, or resource generators. The only permitted AFK location is /afk.' },
    { title: 'No Exploiting Server Bugs', desc: 'Duplication glitches, economy exploits, and unintended mechanics are strictly bannable. Report bugs to staff.' },
    { title: 'Team & Territory Conflicts Allowed', desc: 'Teams may fight, raid, defend territory, and compete for resources. PvP is an intended server mechanic.' },
    { title: 'No Real-World Harassment', desc: 'In-game rivalries are allowed, but doxxing, harassment, threats, hate speech, and discrimination outside gameplay are prohibited.' },
    { title: 'Keep Content Appropriate', desc: 'NSFW or extremely offensive builds, skins, signs, books, and names are prohibited.' },
    { title: 'No Punishment Evasion', desc: 'Do not use alternate accounts to bypass bans or mutes.' },
    { title: 'No Intentionally Damaging the Server', desc: 'Lag machines, crash attempts, or overloading server infrastructure are prohibited.' },
    { title: 'No Economy Abuse', desc: 'Trading and player shops are encouraged; abusing technical issues for infinite items/currency is prohibited.' }
  ],
  wiki: [
    {
      id: 'getting-started',
      title: 'Getting Started',
      summary: 'No whitelist, no application. Direct drop into survival world with NO starter kits. Every command is case-insensitive (/HOME = /home).'
    },
    {
      id: 'homes-warps',
      title: 'Homes & Warps',
      summary: '3 homes by default (ranks grant more). 3-second warmup (moving cancels). Commands: /sethome <name>, /home [name], /homes, /delhome <name>, /warp <name>, /warps, /spawn.'
    },
    {
      id: 'getting-around',
      title: 'Getting Around & Teleports',
      summary: 'TPA requests expire in 60s. /tpa <player>, /tpahere <player>, /tpaccept, /tpdeny. /rtp (random wilderness, 30s cooldown), /rtp queue.'
    },
    {
      id: 'combat-rules',
      title: 'Combat Tag & Grace Period',
      summary: 'Hitting or being hit tags you in combat for 15s. Logging out while tagged KILLS you, drops items, costs money, and alerts the server! Grace period: 5 min on first join, 2 min on respawn (attacking someone ends grace immediately).'
    },
    {
      id: 'economy',
      title: 'Economy & Shop',
      summary: 'Every sellable item shows its price directly on hover in inventory! /shop, /sell, /sell hand, /sell all, /sellhistory. Storage blocks sell for exact loose item price.'
    },
    {
      id: 'bounties-pvp',
      title: 'Bounties & PvP Rewards',
      summary: 'PvP kills pay money. /bounty place <player> <amount> (min 10), /bounties, /bounty cancel. Killstreaks trigger automatic server-announced bounties. Farming same victim pauses for 15 min.'
    },
    {
      id: 'legendary-kits',
      title: 'Legendary Kits',
      summary: '5 signature items rotating weekly: 1) 3x3 Mining Pickaxe, 2) Multishot Crossbow, 3) Nearest Player Tracking Compass, 4) One-Shot Mace, 5) Name-Hiding Invisibility Potion. /lk claim (Elite rank only, once per 7-day rotation).'
    },
    {
      id: 'afk',
      title: 'AFK Lobby',
      summary: 'Idle for 1 min auto-moves to safe AFK world and returns you to exact coordinates when back. /afk, /afklobby status. Pays out small rewards every 5 min.'
    },
    {
      id: 'crafting',
      title: 'Custom Spawner Crafting',
      summary: 'Craft custom mob spawners: 1) Skeleton Spawner, 2) Zombie Spawner, 3) Spider Spawner, 4) Cave Spider Spawner, 5) Magma Cube Spawner.'
    },
    {
      id: 'ranks-referrals',
      title: 'Ranks & Referrals',
      summary: '/referral (get code), /referral setcode <code>, /code <code> (redeem within 30m of joining). Unlocks custom chat color once referred player reaches 2 hours active playtime.'
    }
  ],
  staff: {
    owners: ['MCCurios', 'Fiforious_'],
    adminsDevs: ['Wilczek015', 'vowless_'],
    moderators: ['IkarAviator', 'OhYellow', 'swananito']
  },
  craftings: [
    { name: 'Skeleton Spawner', category: 'Spawners', image: 'https://i.imgur.com/9eOgFHO.png' },
    { name: 'Zombie Spawner', category: 'Spawners', image: 'https://i.imgur.com/4fJ9dBw.png' },
    { name: 'Spider Spawner', category: 'Spawners', image: 'https://i.imgur.com/CIq7C8V.png' },
    { name: 'Cave Spider Spawner', category: 'Spawners', image: 'https://i.imgur.com/YElW6C8.png' },
    { name: 'Magma Cube Spawner', category: 'Spawners', image: 'https://i.imgur.com/WJJoZcI.png' }
  ]
};

/**
 * Builds high-density context prompt for LLM neural injection
 */
export function getEliteSmpSystemPrompt() {
  return `
[ELITE SMP OFFICIAL DATABASE (SOURCE: https://elitesmp.gg/)]
• Server Overview: Cross-platform Minecraft survival (Java 1.21.x-26.2, Bedrock).
  - Java IP: elitesmp.gg:25565
  - Bedrock IP: elitesmp.gg:19132 (Gamertags prefixed with '.', spaces are '_').
  - No whitelist, no application, no starter kits.
• Core Rules:
  - RAIDING & STEALING ARE 100% ALLOWED. Base raiding, resource taking, and team wars are core gameplay mechanics.
  - AFK allowed ONLY in /afk lobby (idle 1 min auto-moves to AFK world, rewards every 5 min). No AFKing at farms/spawners.
  - Cheats, X-ray, KillAura, autoclickers, macros, dupe exploits = permanent ban.
• Combat & Tactics:
  - Combat Tag = 15s. Combat logging = INSTANT DEATH + lost money + drops items + server broadcast!
  - Grace Period = 5 min on first join, 2 min after respawn. Attacking anyone cancels grace immediately.
  - Tracking Compass / Legendary Kits (/lk claim): 5 rotating weekly items (3x3 mining pickaxe, player tracking compass, multishot crossbow, one-shot mace, invisibility potion that hides kill feed name).
• Economy & Bounties:
  - Hovering any item in inventory shows sell value. /shop, /sell, /sell hand, /sell all.
  - Bounties: /bounty place <player> <amount> (min 10). Killstreaks spawn automatic server bounties. Kill farming capped (15m pause).
• Custom Spawner Crafting:
  - 5 Craftable Spawners: Skeleton, Zombie, Spider, Cave Spider, Magma Cube Spawners.
• Key Commands: /sethome, /home, /homes (3 default), /tpa, /tpaccept, /rtp (30s cooldown), /referral, /code, /afk.
• Staff: Owners (MCCurios, Fiforious_), Admins (Wilczek015, vowless_), Mods (IkarAviator, OhYellow, swananito).
`;
}

export const ELITE_SMP_COMMAND_DEFINITION = {
  name: 'elitesmp',
  description: '⚔️ Official Elite SMP server guide, rules, craftings & live wiki',
  options: [
    {
      name: 'join',
      description: 'View Elite SMP connection addresses, ports, and version compatibility',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'rules',
      description: 'View Elite SMP server rules, raiding permissions, and combat regulations',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'wiki',
      description: 'Browse Elite SMP mechanics, homes, bounties, combat tag, and commands',
      type: ApplicationCommandOptionType.Subcommand,
      options: [
        {
          name: 'topic',
          description: 'Specific topic to read about',
          type: ApplicationCommandOptionType.String,
          required: false,
          choices: [
            { name: 'Combat Tag & Grace Period', value: 'combat-rules' },
            { name: 'Homes & Warps', value: 'homes-warps' },
            { name: 'Economy & Sell Prices', value: 'economy' },
            { name: 'Bounties & PvP Rewards', value: 'bounties-pvp' },
            { name: 'Legendary Kits & Tracking Compass', value: 'legendary-kits' },
            { name: 'Custom Spawner Crafting', value: 'crafting' },
            { name: 'AFK Lobby & Rewards', value: 'afk' }
          ]
        }
      ]
    },
    {
      name: 'craftings',
      description: 'View custom craftable mob spawners (Skeleton, Zombie, Spider, Magma Cube)',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'staff',
      description: 'View Elite SMP Owners, Developers, and Moderators',
      type: ApplicationCommandOptionType.Subcommand
    }
  ]
};

export async function handleEliteSmpCommand(interaction) {
  const sub = interaction.options?.getSubcommand() || 'join';

  if (sub === 'join') {
    const embed = new EmbedBuilder()
      .setColor(0xEF4444) // Elite Crimson
      .setTitle('⚔️ Elite SMP // Connection & Join Intel')
      .setDescription(
        `**Official Website:** [elitesmp.gg](https://elitesmp.gg/)\n` +
        `**Official Discord:** [discord.gg/XBgjQxbWpb](https://discord.gg/XBgjQxbWpb)\n\n` +
        `### ☕ Java Edition\n` +
        `• **Server Address:** \`elitesmp.gg\`\n` +
        `• **Port:** \`25565\` (Default)\n` +
        `• **Versions:** \`1.21.x – 26.2\`\n\n` +
        `### 📱 Bedrock Edition (Mobile, Console, Windows)\n` +
        `• **Server Address:** \`elitesmp.gg\`\n` +
        `• **Port:** \`19132\`\n` +
        `• **Gamertag Note:** Bedrock names start with a dot \`.\` (e.g. \`.YourGamertag\`) and spaces convert to underscores.\n\n` +
        `*No whitelist • No application • Pure player-driven survival*`
      )
      .setFooter({ text: 'Data sourced live from elitesmp.gg' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel('🌐 Open Website').setStyle(ButtonStyle.Link).setURL('https://elitesmp.gg/'),
      new ButtonBuilder().setLabel('📖 View Wiki').setStyle(ButtonStyle.Link).setURL('https://elitesmp.gg/wiki'),
      new ButtonBuilder().setLabel('💬 Official Discord').setStyle(ButtonStyle.Link).setURL('https://discord.gg/XBgjQxbWpb')
    );

    return interaction.reply({ embeds: [embed], components: [row] });
  }

  if (sub === 'rules') {
    const embed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('⚔️ Elite SMP // Official Rules & Combat Protocol')
      .setDescription(
        `Every player agrees to these terms by joining **Elite SMP**:\n\n` +
        `**1. Raiding & Stealing: ALLOWED ⚔️**\n` +
        `Taking items, raiding player bases, and seizing territory is 100% permitted. Protect your valuables; staff will NOT restore items lost in normal gameplay.\n\n` +
        `**2. Combat Logging = Instant Death 💀**\n` +
        `Hitting or taking damage tags you for 15s. Logging out while tagged kills your character, drops items, costs money, and broadcasts to the server!\n\n` +
        `**3. AFK Permitted ONLY in \`/afk\` ⏳**\n` +
        `No AFK at farms or spawners. Idle 1 min auto-moves to safe AFK world (rewards every 5 min).\n\n` +
        `**4. Zero Tolerance on Cheats 🚫**\n` +
        `Hacked clients, X-ray, KillAura, autoclickers, macros, dupe exploits = permanent ban.\n\n` +
        `**5. No Real-World Harassment 🤝**\n` +
        `In-game conflict is encouraged; doxxing, harassment, or hate speech is strictly banned.`
      )
      .setFooter({ text: 'Rules enforced by Elite SMP Staff • https://elitesmp.gg/rules' });

    return interaction.reply({ embeds: [embed] });
  }

  if (sub === 'craftings') {
    const embed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('🛠️ Elite SMP // Custom Spawner Crafting')
      .setDescription(
        `Elite SMP features custom craftable mob spawners! You can craft:\n\n` +
        `• 💀 **Skeleton Spawner:** [View Recipe](https://i.imgur.com/9eOgFHO.png)\n` +
        `• 🧟 **Zombie Spawner:** [View Recipe](https://i.imgur.com/4fJ9dBw.png)\n` +
        `• 🕷️ **Spider Spawner:** [View Recipe](https://i.imgur.com/CIq7C8V.png)\n` +
        `• 🕸️ **Cave Spider Spawner:** [View Recipe](https://i.imgur.com/YElW6C8.png)\n` +
        `• 🌋 **Magma Cube Spawner:** [View Recipe](https://i.imgur.com/WJJoZcI.png)\n\n` +
        `*Click any link above to inspect the exact crafting grid!*`
      )
      .setImage('https://i.imgur.com/9eOgFHO.png')
      .setFooter({ text: 'Source: https://elitesmp.gg/crafting' });

    return interaction.reply({ embeds: [embed] });
  }

  if (sub === 'staff') {
    const embed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('👑 Elite SMP // Official Staff Roster')
      .setDescription(
        `The leadership and administration team managing Elite SMP:\n\n` +
        `**👑 Owners & Direction:**\n` +
        `• \`MCCurios\`\n` +
        `• \`Fiforious_\`\n\n` +
        `**⚡ Admins & Developers:**\n` +
        `• \`Wilczek015\`\n` +
        `• \`vowless_\`\n\n` +
        `**🛡️ Moderators:**\n` +
        `• \`IkarAviator\`\n` +
        `• \`OhYellow\`\n` +
        `• \`swananito\``
      )
      .setFooter({ text: 'Source: https://elitesmp.gg/staff' });

    return interaction.reply({ embeds: [embed] });
  }

  if (sub === 'wiki') {
    const topicKey = interaction.options?.getString('topic') || 'combat-rules';
    const topic = ELITE_SMP_INTEL.wiki.find(w => w.id === topicKey) || ELITE_SMP_INTEL.wiki[0];

    const embed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle(`📖 Elite SMP Wiki // ${topic.title}`)
      .setDescription(
        `**Overview:**\n${topic.summary}\n\n` +
        `🔗 Read all 12 wiki sections at: [elitesmp.gg/wiki](https://elitesmp.gg/wiki)`
      )
      .setFooter({ text: `Topic ID: ${topic.id} • https://elitesmp.gg/wiki` });

    return interaction.reply({ embeds: [embed] });
  }
}
