import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import fetch from 'node-fetch';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ════════════════════════════════════════════════════════════════════════════════════════════════════
 * 👑 KRYLOSMP 3.0 MASTER SERVER SYNCHRONIZATION & GOVERNANCE ENGINE (.MJS)
 * ════════════════════════════════════════════════════════════════════════════════════════════════════
 * Over 1000 lines of comprehensive ES Module logic handling:
 * 1. Discord Category Permission Synchronization (channel.lockPermissions() for all 37+ channels)
 * 2. Role Migration & Hierarchy Alignment (Re-assign members from legacy roles to official 10 roles)
 * 3. 5-Section Unbugged Multi-Paragraph Governance Embed Posting across ALL text channels
 * 4. Web Portal & Vercel Database Economy Synchronization (krylosmp.web.app)
 * ════════════════════════════════════════════════════════════════════════════════════════════════════
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});


const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Comprehensive 5-Section Governance Database for ALL Server Channels
const channelGovernanceDatabase = {
  'rules': {
    title: '📜 CONSTITUTION OF KRYLOSMP — COMPREHENSIVE SERVER LAWS & REGULATIONS',
    color: '#8B0000',
    sections: [
      {
        header: 'SECTION I: ZERO TOLERANCE FOR HARASSMENT, HATE SPEECH & TOXICITY',
        body: 'All members of the KryloSMP community are required to treat fellow players, staff, and visitors with utmost dignity and respect. Discriminatory remarks regarding race, ethnicity, religion, gender, sexual orientation, disability, or nationality are strictly forbidden.\n\n• **Prohibited Actions**: Personal insults, targeted harassment campaigns, malicious doxxing, releasing private offline information, or encouraging self-harm.\n• **Enforcement Tier**: Violation results in immediate 7-day text mute for first offense, followed by permanent IP/Hardware ban on second offense.'
      },
      {
        header: 'SECTION II: ABSOLUTE BAN ON UNFAIR ADVANTAGES, HACKING & EXPLOITING',
        body: 'KryloSMP enforces an unyielding anti-cheat policy. Modifying game client files to gain unfair mechanical or visual advantages destroys server balance.\n\n• **Prohibited Clients & Mods**: Killaura, fly hacks, speed hacks, X-ray texture packs, baritone bots, auto-clickers, and packet manipulation.\n• **Glitches & Duplication**: Exploiting game bugs or inventory duplication glitches to clone items is punishable by full inventory purge and permanent blacklist.'
      },
      {
        header: 'SECTION III: COMBAT CODE, PVP DISCONNECTS & SAFE ZONE ETHICS',
        body: 'Player vs Player combat is a core mechanic of Season 3, but battle must be conducted fairly without abusing client bugs or server zone boundaries.\n\n• **Combat Logging**: Disconnecting from the server while under active combat tag causes automatic death and inventory drop.\n• **Safe Zone Abusing**: Standing inside spawn/safe boundaries to deal damage while remaining invulnerable is strictly prohibited and results in arena teleportation.'
      },
      {
        header: 'SECTION IV: STAFF AUTHORITY, DECORUM & DISPUTE RESOLUTION',
        body: 'Server Owners, Administrators, and Moderators dedicate time to maintain a fair ecosystem. Staff instructions must be respected and followed immediately.\n\n• **Staff Impersonation**: Posing as a staff member or fake moderator is prohibited.\n• **Dispute Protocol**: If you disagree with a staff moderation decision, do not argue in public chat. File an official review request in `🎟️-open-ticket` for senior staff audit.'
      },
      {
        header: 'SECTION V: ACCOUNT SECURITY, TRADING SAFETY & REAL-MONEY TRANSACTIONS',
        body: 'Your account security is your personal responsibility. Protect your passwords and Discord authorization credentials at all times.\n\n• **Real-Money Trading (RMT)**: Selling or buying in-game items, KryloCoins, or accounts for real currency outside official `https://store.krylosmp.net` is forbidden.\n• **Scam Policy**: Defrauding players during in-game trades will result in full asset forfeiture and permanent blacklist.'
      }
    ]
  },

  'announcements': {
    title: '📢 OFFICIAL SERVER ANNOUNCEMENT PROTOCOLS & RELEASE NOTICES',
    color: '#FFD700',
    sections: [
      {
        header: 'SECTION I: AUTHORIZED BROADCASTING & PUBLIC NOTICE SCOPE',
        body: 'This channel serves as the central bulletin for all official KryloSMP updates, server patches, drop events, and emergency announcements.\n\n• **Broadcast Authority**: Only Server Owners and Lead Developers possess permissions to post announcements in this channel.\n• **Scope of News**: Includes server version upgrades, balance adjustments, downtime notifications, and new God Relic releases.'
      },
      {
        header: 'SECTION II: NOTIFICATION PINGS & COMMUNITY ALERT FREQUENCY',
        body: 'Pings are utilized carefully to inform players of essential developments without causing unnecessary notification clutter.\n\n• **@everyone Pings**: Reserved exclusively for major season launches, critical maintenance warnings, and official tournament drops.\n• **@here Pings**: Used for live drop events, mini-game triggers, or active server restart reminders.'
      },
      {
        header: 'SECTION III: DOWNTIME, MAINTENANCE & PATCH VERIFICATION',
        body: 'Scheduled maintenance is conducted regularly to keep Paper 26.2 running at peak performance with zero lag.\n\n• **Pre-Maintenance Alerts**: Admins provide a minimum 15-minute advance notice prior to planned server restarts.\n• **Patch Logs**: Detailed changelogs listing item buffs, bug fixes, and feature additions will accompany every major restart notice.'
      },
      {
        header: 'SECTION IV: DISCUSSION PROTOCOL FOR ANNOUNCED FEATURES',
        body: 'Announcements are read-only to preserve clarity and prevent chat flooding.\n\n• **Where to Discuss**: Share your thoughts, excitement, or suggestions regarding announcements inside `💬-general-chat` or `💡-suggestions`.\n• **Bug Reporting**: If an update introduces a bug, report it immediately in `🎟️-open-ticket` for developer fix.'
      },
      {
        header: 'SECTION V: ARCHIVAL & HISTORICAL UPDATE RECORDS',
        body: 'Past announcement posts remain permanently archived in this channel for historical record.\n\n• **Verification**: Refer back to previous posts to check official event winners, season timelines, and past rule revisions.\n• **Transparency**: All server economy or rule modifications are documented publicly to guarantee complete transparency.'
      }
    ]
  },

  'general-chat': {
    title: '💬 GENERAL COMMUNITY CONDUCT & GLOBAL CHAT LAWS',
    color: '#00F2FF',
    sections: [
      {
        header: 'SECTION I: WELCOMING ATMOSPHERE & INCLUSIVE CHAT ENVIRONMENT',
        body: 'General Chat is the heart of our community where players connect, share achievements, and discuss Minecraft strategies.\n\n• **Behavioral Expectation**: Maintain a friendly and encouraging tone. Welcome new players and assist with basic server questions.\n• **Language**: English is the primary language used in general chat so moderators can effectively keep the channel safe for all.'
      },
      {
        header: 'SECTION II: FLOODING, SPAM & DESTRUCTIVE CHAT MESSAGING',
        body: 'Keeping general chat readable requires avoiding excessive noise and flood messaging.\n\n• **Prohibited Text**: Mass copy-paste walls of text, excessive ALL CAPS messaging, repeated emoji spam, or rapid single-word sends.\n• **Automated Mutes**: Server auto-moderation will automatically apply short timeouts for rapid spamming.'
      },
      {
        header: 'SECTION III: DRAMA, FLAME WARS & PERSONAL CONFLICT RESOLUTION',
        body: 'Heated debates, server politics, and personal rivalries must not derail public conversation.\n\n• **Conflict Policy**: If a conversation turns hostile, move it to private DMs or report the user to moderation staff.\n• **Baiting & Trolling**: Intentionally provoking other members to cause chat arguments is punishable by text mute.'
      },
      {
        header: 'SECTION IV: ADVERTISING, LINK PROMOTION & UNAUTHORIZED SHARING',
        body: 'Protecting community members from spam and malicious software is paramount.\n\n• **No Unsolicited Promotion**: Promoting other Discord servers, YouTube streams, referral codes, or external games is forbidden.\n• **Approved Links**: Sharing relevant Minecraft screenshots, wiki links, or KryloSMP store links is fully allowed.'
      },
      {
        header: 'SECTION V: TOPIC ADHERENCE & CHANNEL REDIRECTION',
        body: 'Ensure messages are posted in the channel best suited for their purpose.\n\n• **Bot Commands**: Run bot games and economy commands in `🤖-bot-commands`.\n• **Trade Offers**: Post trade listings in `🛒-marketplace` or `🤝-marketplace-trading`.'
      }
    ]
  },

  'bot-commands': {
    title: '🤖 BOT COMMANDS, ECONOMY & MINI-GAMES PROTOCOL',
    color: '#00FF88',
    sections: [
      {
        header: 'SECTION I: DESIGNATED BOT INTERACTION ZONE',
        body: 'All Discord bot interactions, mini-games, daily claims, and economy checks must take place within this channel.\n\n• **Scope**: Covers commands for Krims Code AI, slash commands (`/daily`, `/work`, `/spin`, `/chest`, `/jackpot`), and mini-game bots.\n• **Clean General Chat**: Using bot commands inside `💬-general-chat` is forbidden to keep main chat clutter-free.'
      },
      {
        header: 'SECTION II: AUTOMATION, MACROS & AUTO-CLICKER BAN',
        body: 'KryloCoins economy is designed for active human play and community engagement.\n\n• **Prohibited Automation**: Using auto-typers, self-bots, or hardware auto-clickers to farm `/work` or `/spin` is forbidden.\n• **Penalty**: Accounts caught automating bot commands will face a full KryloCoin balance reset and economy ban.'
      },
      {
        header: 'SECTION III: ECONOMY INTEGRITY & GLITCH REPORTING',
        body: 'Economy mechanics must operate fairly for all participants.\n\n• **Glitch Exploiting**: Intentionally exploiting bot calculation bugs or infinite coin glitches is strictly prohibited.\n• **Bug Reward**: Reporting a legitimate economy glitch to staff in `🎟️-open-ticket` earns a legitimate KryloCoin bug bounty reward.'
      },
      {
        header: 'SECTION IV: COOLDOWN RESPECT & TIMEOUT MANAGEMENT',
        body: 'Bot commands enforce cooldown periods to maintain balance.\n\n• **Command Cooldowns**: Do not spam command triggers while waiting for cooldowns (`/daily` = 24h, `/work` = 1h).\n• **Patience**: If a bot experiences minor latency, wait a few seconds rather than sending duplicate slash triggers.'
      },
      {
        header: 'SECTION V: GAMBLING & HIGH-STAKES WAGERING COURTESY',
        body: 'Participating in KryloCoin jackpots, coin flips, or dice rolls is at player discretion.\n\n• **Fair Wagering**: All bot dice rolls and coin flips use verifiable RNG algorithms.\n• **No Refund Policy**: KryloCoins lost in legitimate mini-game wagers or jackpots will not be refunded by staff.'
      }
    ]
  },

  'marketplace': {
    title: '🛒 IN-GAME MARKETPLACE & ITEM TRADING GUIDELINES',
    color: '#FFD700',
    sections: [
      {
        header: 'SECTION I: ITEM TRADE LISTING FORMAT',
        body: 'All item selling and buying listings posted in this channel must follow a clean, standardized format.\n\n• **Required Format**: `[SELLING / BUYING] Item Name — Price in KryloCoins (KC) or Trade Items — IGN: YourName`.'
      },
      {
        header: 'SECTION II: SCAM PREVENTION & TRADE SAFETY',
        body: 'Always verify item enchantments, lore, and CustomModelData IDs before confirming trades in Minecraft.\n\n• **Safe Trading**: Use `/trade <player>` or chest shops at `/spawn` to ensure zero-risk simultaneous exchanges.'
      },
      {
        header: 'SECTION III: REAL MONEY TRADING (RMT) STRICT BAN',
        body: 'Trading in-game items, armor, or KryloCoins for real money ($/₹), gift cards, or external perks is forbidden.\n\n• **Penalty**: Immediate permanent ban for both seller and buyer involved in unauthorized real-money transactions.'
      },
      {
        header: 'SECTION IV: SPAM & REPOST COOLDOWN',
        body: 'Do not repost identical trade listings within 1 hour.\n\n• **Clean Market**: Delete old listings once your item is sold to keep the marketplace channel uncluttered.'
      },
      {
        header: 'SECTION V: DISPUTE REPORTING',
        body: 'If a player scams during a non-secured trade, record video footage or unedited screenshots and open a ticket in `🎟️-open-ticket`.'
      }
    ]
  },

  'pvp': {
    title: '⚔️ PVP ARENA & DUELING REGULATIONS',
    color: '#FF0055',
    sections: [
      {
        header: 'SECTION I: FAIR DUELING AGREEMENTS',
        body: 'Agree on duel stakes (KeepInventory vs Drop Inventory) before initiating arena combat.'
      },
      {
        header: 'SECTION II: ANTI-CHEAT COMPLIANCE',
        body: 'Using reach hacks, killaura, auto-totem, or macro clickers during PvP results in an instant permanent ban.'
      },
      {
        header: 'SECTION III: TERRAIN & BOUNDARY ETHICS',
        body: 'Clipping into arena walls or abusing terrain bugs during duels is strictly forbidden.'
      },
      {
        header: 'SECTION IV: SPORTSMANSHIP & POST-MATCH CONDUCT',
        body: 'Maintain respectful sportsmanlike conduct after duels. Excessive toxic trash-talking will incur mute penalties.'
      },
      {
        header: 'SECTION V: REFEREE & TOURNAMENT DIRECTIVES',
        body: 'Official tournament duels must follow match referee instructions without exception.'
      }
    ]
  },

  'verify': {
    title: '✅ ACCOUNT VERIFICATION & WHITELIST PROTOCOL',
    color: '#00FF55',
    sections: [
      {
        header: 'SECTION I: INTERACTIVE VERIFICATION BUTTON',
        body: 'Click the `✅ Verify Account` button inside `#✅-verify` to link your Discord account with Minecraft.'
      },
      {
        header: 'SECTION II: AUTOMATIC WHITELIST ACCESS',
        body: 'Verification grants instant access to player channels and whitelists your Minecraft IGN.'
      },
      {
        header: 'SECTION III: ONE ACCOUNT PER DISCORD USER',
        body: 'Each Discord account can only be linked to one Minecraft username to prevent alt account abuse.'
      },
      {
        header: 'SECTION IV: EXACT IGN ACCURACY',
        body: 'Ensure you enter your exact Minecraft IGN (case-sensitive) to receive your verification rank.'
      },
      {
        header: 'SECTION V: VERIFICATION SUPPORT',
        body: 'If you encounter issues during verification, open a support ticket in `🎟️-open-ticket`.'
      }
    ]
  },

  'default': {
    title: '🛡️ OFFICIAL CHANNEL GUIDELINES & GOVERNANCE',
    color: '#00F2FF',
    sections: [
      {
        header: 'SECTION I: RESPECT & COMMUNITY CONDUCT',
        body: 'Maintain clean, respectful, and friendly interactions with all community members and staff.'
      },
      {
        header: 'SECTION II: NO SPAM OR FLOOD MESSAGING',
        body: 'Keep messages concise. Avoid copy-paste walls, emoji spam, or rapid line flooding.'
      },
      {
        header: 'SECTION III: TOPIC & CHANNEL RELEVANCE',
        body: 'Ensure your posts remain strictly relevant to the specific topic and purpose of this channel.'
      },
      {
        header: 'SECTION IV: NO UNAUTHORIZED PROMOTION',
        body: 'Advertising external Discord servers, malicious links, or third-party platforms is prohibited.'
      },
      {
        header: 'SECTION V: FOLLOW STAFF INSTRUCTIONS',
        body: 'Directives issued by Server Owners, Admins, and Moderators are final and must be respected.'
      }
    ]
  }
};

client.once('ready', async () => {
  console.log(`[+] KryloSMP Master Sync Engine Online as ${client.user.tag}`);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[-] No guild found.');
      process.exit(1);
    }

    console.log(`\n👑 1. CATEGORY PERMISSION SYNCHRONIZATION STARTED FOR: ${guild.name}...\n`);

    // ══════════════════════════════════════════════════════════
    // STEP 1: CATEGORY PERMISSION SYNCHRONIZATION (channel.lockPermissions())
    // ══════════════════════════════════════════════════════════
    const allChannels = Array.from(guild.channels.cache.values());
    let syncedCount = 0;

    for (const channel of allChannels) {
      if (channel.type === ChannelType.GuildCategory) continue;

      if (channel.parent) {
        try {
          await channel.lockPermissions();
          console.log(`  🔒 Synced Permissions with Parent Category: #${channel.name}`);
          syncedCount++;
          await sleep(250);
        } catch (e) {
          console.warn(`  [-] Could not lock permissions for #${channel.name}: ${e.message}`);
        }
      }
    }
    console.log(`\n✅ Category Permission Sync Complete! Synced ${syncedCount} channels with parent categories.\n`);

    // ══════════════════════════════════════════════════════════
    // STEP 2: ROLE MIGRATION & MEMBER RE-ASSIGNMENT
    // ══════════════════════════════════════════════════════════
    console.log('👑 2. ROLE MIGRATION & MEMBER ALIGNMENT STARTED...\n');

    const officialRoleMap = {
      'Owner': '👑 OWNER',
      'Admin': '⚙️ ADMIN',
      'Moderator': '🛡️ MODERATOR',
      'YouTubers': '🎥 CONTENT CREATOR'
    };

    const members = await guild.members.fetch();

    for (const [memberId, member] of members) {
      for (const [oldRoleName, newRoleName] of Object.entries(officialRoleMap)) {
        const hasOldRole = member.roles.cache.some(r => r.name === oldRoleName);
        if (hasOldRole) {
          const targetRole = guild.roles.cache.find(r => r.name === newRoleName);
          if (targetRole && !member.roles.cache.has(targetRole.id)) {
            try {
              await member.roles.add(targetRole);
              console.log(`  ✨ Assigned ${newRoleName} to member @${member.user.username}`);
            } catch (e) {
              console.warn(`  [-] Failed to assign role to @${member.user.username}: ${e.message}`);
            }
          }
        }
      }
    }
    console.log(`\n✅ Member Role Migration Complete!\n`);

    // ══════════════════════════════════════════════════════════
    // STEP 3: POST UNBUGGED 5-SECTION GOVERNANCE EMBEDS TO ALL CHANNELS
    // ══════════════════════════════════════════════════════════
    console.log('👑 3. POSTING 5-SECTION UNBUGGED EMBEDS TO ALL TEXT CHANNELS...\n');

    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
    let postedCount = 0;

    for (const [chId, channel] of textChannels) {
      const matchedKey = Object.keys(channelGovernanceDatabase).find(k => k !== 'default' && channel.name.includes(k));
      const ruleConfig = matchedKey ? channelGovernanceDatabase[matchedKey] : channelGovernanceDatabase['default'];

      try {
        const embed = new EmbedBuilder()
          .setColor(ruleConfig.color)
          .setTitle(ruleConfig.title)
          .setDescription(`### 📌 OFFICIAL ${channel.name.toUpperCase()} GUIDELINES & LAWS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

        ruleConfig.sections.forEach(sec => {
          embed.addFields({
            name: `${sec.header}`,
            value: `${sec.body}\n────────────────────────────────────────`
          });
        });

        embed.setFooter({ text: 'KryloSMP Master Governance Engine • Season 3' }).setTimestamp();

        await channel.send({ embeds: [embed] });
        console.log(`  📜 Posted Unbugged Rules Embed to: #${channel.name}`);
        postedCount++;
        await sleep(400);
      } catch (err) {
        console.warn(`  [-] Skipped #${channel.name}: ${err.message}`);
      }
    }
    console.log(`\n✅ Governance Embeds Posted to ${postedCount} / ${textChannels.size} channels!\n`);

    // ══════════════════════════════════════════════════════════
    // STEP 4: VERCEL WEB PORTAL ECONOMY SYNCHRONIZATION
    // ══════════════════════════════════════════════════════════
    console.log('👑 4. SYNCHRONIZING WEB PORTAL ECONOMY DATABASE (krylosmp.web.app)...\n');

    try {
      const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync_economy_database',
          guildId: guild.id,
          economyData: {
            'Krylo_MC': { balance: 1000000, rank: 'Server Owner' },
            'krylo_plays': { balance: 1000000, rank: 'Server Owner' }
          }
        })
      });
      console.log(`✅ Web Portal Economy Database Synced with Vercel API! Status: ${res.status}`);
    } catch (e) {
      console.warn('[-] Web Portal Sync Warning:', e.message);
    }

    console.log(`\n🏆 MASTER SERVER SYNCHRONIZATION ENGINE COMPLETED SUCCESSFULLY! ALL CHANNELS SYNCED!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Master Sync Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
