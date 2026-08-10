import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ══════════════════════════════════════════════════════════════════════════
 * 👑 KRYLOSMP COMPREHENSIVE CHANNEL GOVERNANCE POSTER (.MJS ENGINE)
 * ══════════════════════════════════════════════════════════════════════════
 * This script iterates over EVERY text channel on the server and posts an
 * unbugged, multi-paragraph, 5-section governance rules embed tailored
 * to each channel's specific theme.
 * ══════════════════════════════════════════════════════════════════════════
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

// Helper delay function to avoid Discord API rate-limiting bugs
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Comprehensive Rules Data Dictionary for ALL Server Channels
const channelRulesDatabase = {
  'rules': {
    title: '📜 CONSTITUTION OF KRYLOSMP — SERVER LAWS & CODE OF CONDUCT',
    color: '#8B0000',
    sections: [
      {
        num: 'I',
        header: '1. ZERO TOLERANCE FOR HARASSMENT, HATE SPEECH & TOXICITY',
        body: 'All members of the KryloSMP community are required to treat fellow players, staff, and visitors with utmost dignity and respect. Discriminatory remarks regarding race, ethnicity, religion, gender, sexual orientation, disability, or nationality are strictly forbidden.\n\n• **Prohibited Actions**: Personal insults, targeted harassment campaigns, malicious doxxing, releasing private offline information, or encouraging self-harm.\n• **Enforcement**: Violation results in immediate 7-day mute for first offense, followed by permanent IP/Hardware ban on second offense.'
      },
      {
        num: 'II',
        header: '2. ABSOLUTE BAN ON UNFAIR ADVANTAGES, HACKING & EXPLOITING',
        body: 'KryloSMP enforces an unyielding anti-cheat policy. Modifying game client files to gain unfair mechanical or visual advantages destroys server balance.\n\n• **Prohibited Clients & Mods**: Killaura, fly hacks, speed hacks, X-ray texture packs, baritone bots, auto-clickers, and packet manipulation.\n• **Glitches & Duplication**: Exploiting game bugs or inventory duplication glitches to clone items is punishable by full inventory purge and permanent blacklist.'
      },
      {
        num: 'III',
        header: '3. COMBAT CODE, PVP DISCONNECTS & SAFE ZONE ETHICS',
        body: 'Player vs Player combat is a core mechanic of Season 3, but battle must be conducted fairly without abusing client bugs or server zone boundaries.\n\n• **Combat Logging**: Disconnecting from the server while under active combat tag causes automatic death and inventory drop.\n• **Safe Zone Abusing**: Standing inside spawn/safe boundaries to deal damage while remaining invulnerable is strictly prohibited and results in arena teleportation.'
      },
      {
        num: 'IV',
        header: '4. STAFF AUTHORITY, DECORUM & DISPUTE RESOLUTION',
        body: 'Server Owners, Administrators, and Moderators dedicate time to maintain a fair ecosystem. Staff instructions must be respected and followed immediately.\n\n• **Staff Impersonation**: Posing as a staff member or fake moderator is prohibited.\n• **Dispute Protocol**: If you disagree with a staff moderation decision, do not argue in public chat. File an official review request in `🎟️-open-ticket` for senior staff audit.'
      },
      {
        num: 'V',
        header: '5. ACCOUNT SECURITY, TRADING SAFETY & REAL-MONEY TRANSACTIONS',
        body: 'Your account security is your personal responsibility. Protect your passwords and Discord authorization credentials at all times.\n\n• **Real-Money Trading (RMT)**: Selling or buying in-game items, KryloCoins, or accounts for real currency outside official `https://store.krylosmp.net` is forbidden.\n• **Scam Policy**: Defrauding players during in-game trades will result in full asset forfeiture and permanent blacklist.'
      }
    ]
  },

  'announcements': {
    title: '📢 OFFICIAL SERVER ANNOUNCEMENT PROTOCOLS & RELEASE NOTICES',
    color: '#FFD700',
    sections: [
      {
        num: 'I',
        header: '1. AUTHORIZED BROADCASTING & PUBLIC NOTICE SCOPE',
        body: 'This channel serves as the central bulletin for all official KryloSMP updates, server patches, drop events, and emergency announcements.\n\n• **Broadcast Authority**: Only Server Owners and Lead Developers possess permissions to post announcements in this channel.\n• **Scope of News**: Includes server version upgrades, balance adjustments, downtime notifications, and new God Relic releases.'
      },
      {
        num: 'II',
        header: '2. NOTIFICATION PINGS & COMMUNITY ALERT FREQUENCY',
        body: 'Pings are utilized carefully to inform players of essential developments without causing unnecessary notification clutter.\n\n• **@everyone Pings**: Reserved exclusively for major season launches, critical maintenance warnings, and official tournament drops.\n• **@here Pings**: Used for live drop events, mini-game triggers, or active server restart reminders.'
      },
      {
        num: 'III',
        header: '3. DOWNTIME, MAINTENANCE & PATCH VERIFICATION',
        body: 'Scheduled maintenance is conducted regularly to keep Paper 26.2 running at peak performance with zero lag.\n\n• **Pre-Maintenance Alerts**: Admins provide a minimum 15-minute advance notice prior to planned server restarts.\n• **Patch Logs**: Detailed changelogs listing item buffs, bug fixes, and feature additions will accompany every major restart notice.'
      },
      {
        num: 'IV',
        header: '4. DISCUSSION PROTOCOL FOR ANNOUNCED FEATURES',
        body: 'Announcements are read-only to preserve clarity and prevent chat flooding.\n\n• **Where to Discuss**: Share your thoughts, excitement, or suggestions regarding announcements inside `💬-general-chat` or `💡-suggestions`.\n• **Bug Reporting**: If an update introduces a bug, report it immediately in `🎟️-open-ticket` for developer fix.'
      },
      {
        num: 'V',
        header: '5. ARCHIVAL & HISTORICAL UPDATE RECORDS',
        body: 'Past announcement posts remain permanently archived in this channel for historical record.\n\n• **Verification**: Refer back to previous posts to check official event winners, season timelines, and past rule revisions.\n• **Transparency**: All server economy or rule modifications are documented publicly to guarantee complete transparency.'
      }
    ]
  },

  'general-chat': {
    title: '💬 GENERAL COMMUNITY CONDUCT & GLOBAL CHAT LAWS',
    color: '#00F2FF',
    sections: [
      {
        num: 'I',
        header: '1. WELCOMING ATMOSPHERE & INCLUSIVE CHAT ENVIRONMENT',
        body: 'General Chat is the heart of our community where players connect, share achievements, and discuss Minecraft strategies.\n\n• **Behavioral Expectation**: Maintain a friendly and encouraging tone. Welcome new players and assist with basic server questions.\n• **Language**: English is the primary language used in general chat so moderators can effectively keep the channel safe for all.'
      },
      {
        num: 'II',
        header: '2. FLOODING, SPAM & DESTRUCTIVE CHAT MESSAGING',
        body: 'Keeping general chat readable requires avoiding excessive noise and flood messaging.\n\n• **Prohibited Text**: Mass copy-paste walls of text, excessive ALL CAPS messaging, repeated emoji spam, or rapid single-word sends.\n• **Automated Mutes**: Server auto-moderation will automatically apply short timeouts for rapid spamming.'
      },
      {
        num: 'III',
        header: '3. DRAMA, FLAME WARS & PERSONAL CONFLICT RESOLUTION',
        body: 'Heated debates, server politics, and personal rivalries must not derail public conversation.\n\n• **Conflict Policy**: If a conversation turns hostile, move it to private DMs or report the user to moderation staff.\n• **Baiting & Trolling**: Intentionally provoking other members to cause chat arguments is punishable by text mute.'
      },
      {
        num: 'IV',
        header: '4. ADVERTISING, LINK PROMOTION & UNAUTHORIZED SHARING',
        body: 'Protecting community members from spam and malicious software is paramount.\n\n• **No Unsolicited Promotion**: Promoting other Discord servers, YouTube streams, referral codes, or external games is forbidden.\n• **Approved Links**: Sharing relevant Minecraft screenshots, wiki links, or KryloSMP store links is fully allowed.'
      },
      {
        num: 'V',
        header: '5. TOPIC ADHERENCE & CHANNEL REDIRECTION',
        body: 'Ensure messages are posted in the channel best suited for their purpose.\n\n• **Bot Commands**: Run bot games and economy commands in `🤖-bot-commands`.\n• **Trade Offers**: Post trade listings in `🛒-marketplace` or `🤝-marketplace-trading`.'
      }
    ]
  },

  'bot-commands': {
    title: '🤖 BOT COMMANDS, ECONOMY & MINI-GAMES PROTOCOL',
    color: '#00FF88',
    sections: [
      {
        num: 'I',
        header: '1. DESIGNATED BOT INTERACTION ZONE',
        body: 'All Discord bot interactions, mini-games, daily claims, and economy checks must take place within this channel.\n\n• **Scope**: Covers commands for Krims Code AI, slash commands (`/daily`, `/work`, `/spin`, `/chest`, `/jackpot`), and mini-game bots.\n• **Clean General Chat**: Using bot commands inside `💬-general-chat` is forbidden to keep main chat clutter-free.'
      },
      {
        num: 'II',
        header: '2. AUTOMATION, MACROS & AUTO-CLICKER BAN',
        body: 'KryloCoins economy is designed for active human play and community engagement.\n\n• **Prohibited Automation**: Using auto-typers, self-bots, or hardware auto-clickers to farm `/work` or `/spin` is forbidden.\n• **Penalty**: Accounts caught automating bot commands will face a full KryloCoin balance reset and economy ban.'
      },
      {
        num: 'III',
        header: '3. ECONOMY INTEGRITY & GLITCH REPORTING',
        body: 'Economy mechanics must operate fairly for all participants.\n\n• **Glitch Exploiting**: Intentionally exploiting bot calculation bugs or infinite coin glitches is strictly prohibited.\n• **Bug Reward**: Reporting a legitimate economy glitch to staff in `🎟️-open-ticket` earns a legitimate KryloCoin bug bounty reward.'
      },
      {
        num: 'IV',
        header: '4. COOLDOWN RESPECT & TIMEOUT MANAGEMENT',
        body: 'Bot commands enforce cooldown periods to maintain balance.\n\n• **Command Cooldowns**: Do not spam command triggers while waiting for cooldowns (`/daily` = 24h, `/work` = 1h).\n• **Patience**: If a bot experiences minor latency, wait a few seconds rather than sending duplicate slash triggers.'
      },
      {
        num: 'V',
        header: '5. GAMBLING & HIGH-STAKES WAGERING COURTESY',
        body: 'Participating in KryloCoin jackpots, coin flips, or dice rolls is at player discretion.\n\n• **Fair Wagering**: All bot dice rolls and coin flips use verifiable RNG algorithms.\n• **No Refund Policy**: KryloCoins lost in legitimate mini-game wagers or jackpots will not be refunded by staff.'
      }
    ]
  },

  'marketplace': {
    title: '🛒 IN-GAME MARKETPLACE & ITEM TRADING GUIDELINES',
    color: '#FFD700',
    sections: [
      {
        num: 'I',
        header: '1. ITEM TRADE LISTING FORMAT',
        body: 'All item selling and buying listings posted in this channel must follow a clean, standardized format.\n\n• **Required Format**: `[SELLING / BUYING] Item Name — Price in KryloCoins (KC) or Trade Items — IGN: YourName`.'
      },
      {
        num: 'II',
        header: '2. SCAM PREVENTION & TRADE SAFETY',
        body: 'Always verify item enchantments, lore, and CustomModelData IDs before confirming trades in Minecraft.\n\n• **Safe Trading**: Use `/trade <player>` or chest shops at `/spawn` to ensure zero-risk simultaneous exchanges.'
      },
      {
        num: 'III',
        header: '3. REAL MONEY TRADING (RMT) STRICT BAN',
        body: 'Trading in-game items, armor, or KryloCoins for real money ($/₹), gift cards, or external perks is forbidden.\n\n• **Penalty**: Immediate permanent ban for both seller and buyer involved in unauthorized real-money transactions.'
      },
      {
        num: 'IV',
        header: '4. SPAM & REPOST COOLDOWN',
        body: 'Do not repost identical trade listings within 1 hour.\n\n• **Clean Market**: Delete old listings once your item is sold to keep the marketplace channel uncluttered.'
      },
      {
        num: 'V',
        header: '5. DISPUTE REPORTING',
        body: 'If a player scams during a non-secured trade, record video footage or unedited screenshots and open a ticket in `🎟️-open-ticket`.'
      }
    ]
  },

  'default': {
    title: '🛡️ OFFICIAL CHANNEL GUIDELINES & GOVERNANCE',
    color: '#00F2FF',
    sections: [
      {
        num: 'I',
        header: '1. RESPECT & COMMUNITY CONDUCT',
        body: 'Maintain clean, respectful, and friendly interactions with all community members and staff.'
      },
      {
        num: 'II',
        header: '2. NO SPAM OR FLOOD MESSAGING',
        body: 'Keep messages concise. Avoid copy-paste walls, emoji spam, or rapid line flooding.'
      },
      {
        num: 'III',
        header: '3. TOPIC & CHANNEL RELEVANCE',
        body: 'Ensure your posts remain strictly relevant to the specific topic and purpose of this channel.'
      },
      {
        num: 'IV',
        header: '4. NO UNAUTHORIZED PROMOTION',
        body: 'Advertising external Discord servers, malicious links, or third-party platforms is prohibited.'
      },
      {
        num: 'V',
        header: '5. FOLLOW STAFF INSTRUCTIONS',
        body: 'Directives issued by Server Owners, Admins, and Moderators are final and must be respected.'
      }
    ]
  }
};

client.once('ready', async () => {
  console.log(`[+] KryloSMP Rules Engine Online as ${client.user.tag}`);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[-] No guild found.');
      process.exit(1);
    }

    console.log(`\n🚀 POSTING UNBUGGED 5-SECTION RULES TO ALL TEXT CHANNELS ON: ${guild.name}...\n`);

    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    console.log(`[+] Total Text Channels Discovered: ${textChannels.size}\n`);

    let postedCount = 0;

    for (const [chId, channel] of textChannels) {
      // Find matching rule config or fallback to default
      const matchedKey = Object.keys(channelRulesDatabase).find(k => k !== 'default' && channel.name.includes(k));
      const ruleConfig = matchedKey ? channelRulesDatabase[matchedKey] : channelRulesDatabase['default'];

      try {
        const embed = new EmbedBuilder()
          .setColor(ruleConfig.color)
          .setTitle(ruleConfig.title)
          .setDescription(`### 📌 OFFICIAL ${channel.name.toUpperCase()} GUIDELINES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        ruleConfig.sections.forEach(sec => {
          embed.addFields({
            name: `${sec.header}`,
            value: `${sec.body}\n────────────────────────────────────────`
          });
        });

        embed.setFooter({ text: 'KryloSMP Official Channel Governance • Season 3' }).setTimestamp();

        await channel.send({ embeds: [embed] });
        console.log(`  ✅ Posted Unbugged 5-Section Rules to: #${channel.name} (${channel.id})`);
        postedCount++;

        // 500ms delay to prevent Discord API rate-limiting bugs
        await sleep(500);
      } catch (err) {
        console.warn(`  [-] Skipped #${channel.name}: ${err.message}`);
      }
    }

    console.log(`\n🏆 COMPLETED! Posted Rules Embeds to ${postedCount} / ${textChannels.size} Channels with 0 Bugs!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Script Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
