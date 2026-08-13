import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Master Server Cleanup & Rules Poster Script Online as ' + client.user.tag);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[-] No guild found.');
      process.exit(1);
    }

    console.log(`\n🚀 MASTER CLEANUP & RULES POSTING STARTED FOR: ${guild.name}...\n`);

    // ══════════════════════════════════════════════════════════
    // 1. DELETE REPEATED & UNUSED ROLES (KEEP ONLY OFFICIAL 10)
    // ══════════════════════════════════════════════════════════
    const officialRoleNames = [
      '👑 OWNER',
      '⚙️ ADMIN',
      '🛡️ MODERATOR',
      '🎥 CONTENT CREATOR',
      '💎 KRYLO GOD',
      '⚡ VIP+',
      '🏰 CLAN LEADER',
      '⚔️ CLAN MEMBER',
      '🏆 TOURNAMENT CHAMPION',
      '✅ VERIFIED'
    ];

    console.log('--- 1. CLEANING UP REPEATED ROLES ---');
    let rolesDeleted = 0;
    const rolesArray = Array.from(guild.roles.cache.values());

    for (const role of rolesArray) {
      if (
        role.name === '@everyone' ||
        role.managed ||
        officialRoleNames.includes(role.name) ||
        role.name.includes('Booster') ||
        role.name.includes('KSMP') ||
        role.name.includes('Krylo')
      ) {
        continue;
      }

      try {
        await role.delete('Master Role Cleanup');
        console.log(`  🗑️ Deleted Duplicate Role: ${role.name}`);
        rolesDeleted++;
      } catch (e) {
        console.warn(`  [-] Skipping role ${role.name}: ${e.message}`);
      }
    }
    console.log(`✅ Roles Cleanup Complete! Deleted ${rolesDeleted} duplicate roles.\n`);

    // ══════════════════════════════════════════════════════════
    // 2. DELETE REPEATED & DUPLICATE CHANNELS
    // ══════════════════════════════════════════════════════════
    console.log('--- 2. CLEANING UP DUPLICATE CHANNELS ---');
    const seenChannelNames = new Set();
    let channelsDeleted = 0;
    const channelsArray = Array.from(guild.channels.cache.values());

    for (const ch of channelsArray) {
      if (ch.type === ChannelType.GuildCategory) continue;

      const normName = ch.name.replace(/[^a-z0-9]/g, '');
      if (seenChannelNames.has(normName) && normName.length > 2) {
        try {
          await ch.delete('Duplicate Channel Cleanup');
          console.log(`  🗑️ Deleted Duplicate Channel: ${ch.name}`);
          channelsDeleted++;
        } catch (e) {
          console.warn(`  [-] Could not delete channel ${ch.name}: ${e.message}`);
        }
      } else {
        seenChannelNames.add(normName);
      }
    }
    console.log(`✅ Channel Cleanup Complete! Deleted ${channelsDeleted} duplicate channels.\n`);

    // ══════════════════════════════════════════════════════════
    // 3. POST UNIQUE 5-POINT PARAGRAPH RULES EMBEDS TO EACH CHANNEL
    // ══════════════════════════════════════════════════════════
    console.log('--- 3. POSTING UNIQUE 5-POINT RULES EMBEDS ---');

    const channelRulesMap = {
      'rules': {
        title: '📜 OFFICIAL KRYLOSMP SERVER LAWS & REGULATIONS',
        color: '#8B0000',
        points: [
          '1. **Absolute Respect & Zero Tolerance**: Toxic behavior, hate speech, racism, and harassment are strictly prohibited across all text and voice channels.',
          '2. **No Hacking, X-Ray, or Unfair Exploits**: Using hacked clients, X-ray texture packs, dupe glitches, or automated scripts results in an instant permanent ban.',
          '3. **Fair Combat & No Combat Logging**: Disconnecting during active PvP combat or abusing safe zones during battle is strictly penalized.',
          '4. **Staff Authority is Final**: Follow all directives issued by Server Owners, Admins, and Moderators. Staff decisions are enforced for server balance.',
          '5. **Account & Trading Security**: Protect your credentials. Real-money transactions outside the official website are strictly at your own risk.'
        ]
      },
      'server-announcements': {
        title: '📢 SERVER ANNOUNCEMENTS & UPDATE PROTOCOLS',
        color: '#FFD700',
        points: [
          '1. **Official News Channel**: All official KryloSMP Season updates, patches, maintenance times, and server drops are posted exclusively here.',
          '2. **Read-Only Information**: Only authorized Server Administrators and Owners are permitted to broadcast announcements in this channel.',
          '3. **Notification Pings**: Important updates use `@everyone` or `@here` sparingly for critical server releases and event drop announcements.',
          '4. **Community Feedback**: Discuss announced updates and new features inside the `💬-general-chat` or `💡-suggestions` channels.',
          '5. **Patch Notes Verification**: Always check patch notes posted here before reporting bugs or missing items after server maintenance.'
        ]
      },
      'youtube-announcements': {
        title: '📺 CREATOR & LIVE STREAM ALERTS',
        color: '#FF0055',
        points: [
          '1. **Official Creator Content**: Highlights and live streams from verified KryloSMP Content Creators and YouTubers are featured here.',
          '2. **Stream Courtesy**: Avoid spamming creator stream chats or stream-sniping creators while they are live on KryloSMP.',
          '3. **Content Applications**: Players wishing to apply for creator role perks must maintain consistent KryloSMP content.',
          '4. **No Unapproved Self-Promotion**: Promoting non-KryloSMP channels or external discord servers without approval is prohibited.',
          '5. **Live Event Broadcasts**: Official KryloSMP tournament streams and drop parties will be linked live in this channel.'
        ]
      },
      'server-info': {
        title: 'ℹ️ SERVER SPECIFICATIONS & CONNECTION GUIDE',
        color: '#00F2FF',
        points: [
          '1. **Server Connection Address**: Primary Server IP: `krylosmp.play.hosting` | Default Java Port: `25565`.',
          '2. **Minecraft Version Compatibility**: Compatible with Minecraft Java 1.21.0 through 1.21.4 (Lunar Client 26.2 supported).',
          '3. **Resource Pack Integration**: Download and load `KryloSMP_ResourcePack.zip` for full 3D God Relic model textures.',
          '4. **Server Hardware Specs**: High-performance Paper 26.2 engine with dedicated RAM allocation for 100+ FPS gameplay.',
          '5. **Uptime & Maintenance**: Server restarts automatically every 24 hours to optimize performance and clear temporary logs.'
        ]
      },
      'socials': {
        title: '🌐 OFFICIAL COMMUNITY LINKS & MEDIA',
        color: '#AA00FF',
        points: [
          '1. **Official Web Store**: Purchase KryloCoins, Ranks, and God Relics at `https://store.krylosmp.net`.',
          '2. **Official Discord Server**: Bookmark `https://discord.gg/krylosmp` for instant community access and ticket support.',
          '3. **YouTube & Twitch Channels**: Subscribe to our official media handles for exclusive sneak peeks and monthly giveaways.',
          '4. **Official Links Only**: Never click untrusted third-party links. Official staff will only post links inside this channel.',
          '5. **Community Engagement**: Share our official links with friends to earn bonus KryloCoins through the referral system.'
        ]
      },
      'verify': {
        title: '✅ ACCOUNT VERIFICATION & WHITELIST PROTOCOL',
        color: '#00FF55',
        points: [
          '1. **Interactive Verification**: Click the `✅ Verify Account` button below to link your Discord account with Minecraft.',
          '2. **Automatic Whitelist**: Verification grants instant access to player chat channels and whitelists your Minecraft username.',
          '3. **One Account Limit**: Each Discord account can only be linked to one Minecraft username to prevent alt account abuse.',
          '4. **Username Accuracy**: Ensure you enter your exact Minecraft IGN (case-sensitive) to receive your verification rank.',
          '5. **Verification Support**: If you encounter issues during verification, open a support ticket in `🎟️-open-ticket`.'
        ]
      },
      'general-chat': {
        title: '💬 GENERAL COMMUNITY CONDUCT & CHAT RULES',
        color: '#00F2FF',
        points: [
          '1. **Friendly Conversation**: Keep conversations clean, welcoming, and enjoyable for all members of the KryloSMP community.',
          '2. **No Text Spamming**: Refrain from flood-messaging, excessive caps, emoji spam, or repeating messages in quick succession.',
          '3. **English Primary Language**: Please use English in main public text channels so moderators can effectively assist everyone.',
          '4. **No Drama or Flame Wars**: Arguments and personal disputes must be taken to private direct messages or resolved peacefully.',
          '5. **Respect Channel Topics**: Keep gameplay discussions, trade offers, and bot commands in their designated channels.'
        ]
      },
      'music-chat': {
        title: '🎵 MUSIC BOT COMMANDS & LOUNGE RULES',
        color: '#FF00FF',
        points: [
          '1. **Dedicated Music Commands**: Use music bot commands (`/play`, `/skip`, `/queue`) exclusively inside this channel.',
          '2. **Respect Voice Audio**: Avoid queuing ear-rape, excessively loud tracks, or offensive audio clips in public voice lounges.',
          '3. **Fair Playlists**: Keep song queues reasonable so other members in the voice lounge can request their favorite tracks.',
          '4. **No Spamming Skip**: Do not vote-skip or force-skip other members\' songs without agreement from the voice channel.',
          '5. **Voice Channel Courtesy**: Mute your microphone when eating, or when background noise is present in your room.'
        ]
      },
      'bot-commands': {
        title: '🤖 BOT COMMANDS & MINI-GAMES CONDUCT',
        color: '#00FF88',
        points: [
          '1. **All Bot Interaction Allowed**: Execute all mini-game commands, daily spins, chest opens, and balance checks here.',
          '2. **No Macro Spamming**: Using automated clickers or macros to repeatedly trigger bot commands is strictly prohibited.',
          '3. **Respect Cooldowns**: Wait for command cooldown timers (`/daily`, `/work`, `/spin`) to expire naturally.',
          '4. **Economy Fair Play**: Exploiting economy glitches or bot bugs results in an immediate balance reset and economy ban.',
          '5. **Report Bot Glitches**: If a bot command fails or outputs an error, report it promptly inside `🎟️-open-ticket`.'
        ]
      },
      'suggestions': {
        title: '💡 SUGGESTION & FEATURE FEEDBACK GUIDELINES',
        color: '#FFFF00',
        points: [
          '1. **Constructive Ideas**: Submit detailed ideas for new KryloSMP features, God Relics, custom events, or balance tweaks.',
          '2. **Community Voting**: React with 👍 or 👎 on suggestions submitted by other players to help staff gauge interest.',
          '3. **No Troll Submissions**: Submitting meme suggestions, offensive text, or duplicate ideas will result in suggestion mute.',
          '4. **Clear Title & Purpose**: Explain what feature you want added, why it benefits the server, and how it should work.',
          '5. **Staff Review**: Top-voted suggestions are reviewed weekly by the Owner and Admin team for implementation.'
        ]
      },
      'store-info': {
        title: '🛒 KRYLOSMP WEB STORE & PURCHASING POLICY',
        color: '#FFD700',
        points: [
          '1. **Instant Automated Delivery**: All purchases from `store.krylosmp.net` are delivered directly to your Minecraft inventory.',
          '2. **KryloCoins & Real Money Modes**: Spend in-game KryloCoins or toggle Real Money ($/₹) payment options on the store.',
          '3. **Non-Refundable Purchases**: All digital items, ranks, and God Relics are final purchases once delivered to your account.',
          '4. **Correct IGN Input**: Double-check your Minecraft IGN before completing checkout to ensure items reach your character.',
          '5. **Purchase Assistance**: If items do not arrive within 5 minutes of checkout, open a support ticket with your transaction ID.'
        ]
      },
      'pvp-chat': {
        title: '⚔️ PVP ARENA & DUELING REGULATIONS',
        color: '#FF0055',
        points: [
          '1. **Fair Dueling**: Agree on duel stakes (KeepInventory vs Drop Inventory) before initiating arena combat.',
          '2. **No Hacked Clients or Auto-Clickers**: Reach hacks, killaura, auto-totem, and macro clickers result in permanent bans.',
          '3. **No Glitch Abusing**: Enderpearl clipping into arena walls or abusing terrain bugs during duels is strictly forbidden.',
          '4. **GG Conduct**: Maintain sportsmanlike conduct after duels. Toxic trash-talking in global chat will incur mute penalties.',
          '5. **Tournament Matchmaking**: Official tournament duels must follow match referee instructions without exception.'
        ]
      },
      'open-ticket': {
        title: '🎟️ SUPPORT TICKET PROTOCOL & COURTESY',
        color: '#00F2FF',
        points: [
          '1. **Private Support Channel**: Opening a ticket creates a private channel visible only to you and Server Moderators.',
          '2. **State Your Issue Clearly**: Provide your Minecraft IGN, detailed problem description, and relevant screenshot evidence.',
          '3. **No Duplicate Tickets**: Do not open multiple tickets for the same issue. Staff will respond as quickly as possible.',
          '4. **Respect Staff Time**: Be patient while waiting for an Admin response. Avoid tagging staff repeatedly inside tickets.',
          '5. **Close Upon Resolution**: Click the `🔒 Close Ticket` button once your question or issue has been fully resolved.'
        ]
      }
    };

    for (const [chKey, rData] of Object.entries(channelRulesMap)) {
      const ch = guild.channels.cache.find(c => c.name.includes(chKey) && c.type === ChannelType.GuildText);
      if (ch) {
        try {
          const rulesEmbed = new EmbedBuilder()
            .setColor(rData.color)
            .setTitle(rData.title)
            .setDescription(
              `### 📌 CHANNEL RULES & GUIDELINES\n\n` +
              rData.points.join('\n\n') +
              `\n\n*Please adhere to all guidelines above to keep KryloSMP enjoyable for everyone!*`
            )
            .setFooter({ text: 'KryloSMP Official Channel Guidelines 🛡️' })
            .setTimestamp();

          await ch.send({ embeds: [rulesEmbed] });
          console.log(`  📜 Posted 5-Point Rules to: #${ch.name}`);
        } catch (e) {
          console.warn(`  [-] Could not post to #${ch.name}: ${e.message}`);
        }
      }
    }

    console.log(`\n🏆 MASTER CLEANUP & 5-POINT RULES POSTING COMPLETED SUCCESSFULLY!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Master Cleanup Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
