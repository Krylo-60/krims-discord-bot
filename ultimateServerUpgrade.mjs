import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const TOPICS = {
  'rules': '📜 Read and follow our official server rules to keep the community safe and fun!',
  'server-rules': '📜 Read and follow our official server rules to keep the community safe!',
  'verify': '✅ Verify your account to unlock all channels, roles, and features!',
  'server-announcements': '📢 Official KryloSMP announcements, updates, and breaking news!',
  'youtube-announcements': '📺 New KryloSMP YouTube video alerts, premieres, and content drops!',
  'server-info': 'ℹ️ Server IP: KryloSmp.play.hosting | Java: 25565 | Bedrock: 19132 | Version: 1.21.x',
  'socials': '🌐 Follow KryloSMP on YouTube, Discord, and all social media platforms!',
  'new-updates': '📢 Latest patches, features, seasonal events, and changelog updates!',
  'general-chat': '💬 Hang out, chat, and meet the KryloSMP community! Keep it friendly 🤝',
  'music-chat': '🎵 Share songs, playlists, Spotify links, and music recommendations!',
  'media-clips': '📷 Share screenshots, clips, montages, and epic Minecraft moments!',
  'memes': '😂 Post your funniest memes, gaming humor, and Minecraft jokes!',
  'suggestions': '💡 Submit ideas and suggestions to improve KryloSMP! Vote on the best ones.',
  'bot-commands': '🤖 Run ALL bot commands here! /daily /balance /shop /clan /pvp /trade /fish /mine',
  'store': '🛒 Browse and purchase exclusive items, ranks, crate keys, and perks!',
  'item-trading': '🤝 Buy, sell, and trade rare items safely with fellow players! Use /trade',
  'jackpot-vault': '💰 Enter the jackpot for a chance to win MASSIVE KryloCoins! /jackpot',
  'bounty-board': '🎯 Place and claim bounties on players! Hunt or be hunted. /bounty',
  'clan-recruitment': '🛡️ Recruit members for your clan or find a clan to join! /clan action:create',
  'clan-leaderboard': '🏆 Top clans ranked by vault balance, members, and achievements!',
  'pvp-chat': '⚔️ Discuss PvP strategies, challenge players, and talk combat! /pvp /challenge',
  'monthly-tournament': '🏆 Monthly PvP tournament brackets, signups, schedules, and results!',
  'support-tickets': '🎫 Open a support ticket for help, bug reports, appeals, or questions.',
  'mod-logs': '🛡️ Moderation action logs — staff only. Warns, bans, and timeouts.',
  'tournament': '🏆 Official tournament announcements, brackets, and live updates!',
};

const SLOWMODE = {
  'general-chat': 5,
  'memes': 10,
  'media-clips': 10,
  'suggestions': 30,
  'clan-recruitment': 60,
  'item-trading': 15,
};

client.once('ready', async () => {
  console.log(`[+] Ultimate Server Upgrader Online as ${client.user.tag}\n`);

  for (const [, guild] of client.guilds.cache) {
    if (!guild.name.toLowerCase().includes('krylo')) continue;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 UPGRADING: ${guild.name} (${guild.id})`);
    console.log(`${'='.repeat(60)}\n`);

    const channels = await guild.channels.fetch();

    // ═══════════════════════════════════════════
    // PHASE 1: CHANNEL TOPICS & SLOWMODE
    // ═══════════════════════════════════════════
    console.log('── PHASE 1: Channel Topics & Slowmode ──');
    for (const [, ch] of channels) {
      if (!ch || !ch.isTextBased() || ch.type === ChannelType.GuildCategory) continue;
      const baseName = ch.name.replace(/^[^\w]*┃/,'').replace(/^[^\w]*・/,'').toLowerCase().trim();

      // Set topic
      for (const [key, topic] of Object.entries(TOPICS)) {
        if (baseName.includes(key) || ch.name.toLowerCase().includes(key)) {
          try {
            if (ch.topic !== topic) {
              await ch.setTopic(topic);
              console.log(`  [📝] #${ch.name} → Topic set`);
            }
          } catch (e) {}
          break;
        }
      }

      // Set slowmode
      for (const [key, seconds] of Object.entries(SLOWMODE)) {
        if (baseName.includes(key) || ch.name.toLowerCase().includes(key)) {
          try {
            if (ch.rateLimitPerUser !== seconds) {
              await ch.setRateLimitPerUser(seconds);
              console.log(`  [⏱️] #${ch.name} → Slowmode ${seconds}s`);
            }
          } catch (e) {}
          break;
        }
      }
    }

    // ═══════════════════════════════════════════
    // PHASE 2: PREMIUM ROLE HIERARCHY
    // ═══════════════════════════════════════════
    console.log('\n── PHASE 2: Premium Role Hierarchy ──');
    const ROLES = [
      { name: '👑 Owner', color: 0xFFD700, hoist: true },
      { name: '⚡ Admin', color: 0xFF4500, hoist: true },
      { name: '🛡️ Moderator', color: 0x3498DB, hoist: true },
      { name: '🎬 Content Creator', color: 0xE91E63, hoist: true },
      { name: '💎 VIP', color: 0x9B59B6, hoist: true },
      { name: '🚀 Booster', color: 0xF47FFF, hoist: true },
      { name: '⭐ Level 50+', color: 0xFFD700, hoist: false },
      { name: '🔥 Level 25+', color: 0xFF6B35, hoist: false },
      { name: '✨ Level 10+', color: 0x00E5FF, hoist: false },
      { name: '🌱 Newcomer', color: 0x2ECC71, hoist: false },
      { name: '✅ Verified', color: 0x00FF88, hoist: false },
    ];

    const existingRoles = await guild.roles.fetch();
    for (const r of ROLES) {
      const exists = existingRoles.find(er => er.name === r.name);
      if (exists) {
        console.log(`  [✓] Role "${r.name}" already exists`);
      } else {
        try {
          await guild.roles.create({ name: r.name, color: r.color, hoist: r.hoist, reason: 'KryloSMP Premium Upgrade' });
          console.log(`  [+] Created role: "${r.name}" (${r.color.toString(16)})`);
        } catch (e) {
          console.log(`  [-] Failed to create "${r.name}": ${e.message}`);
        }
      }
    }

    // ═══════════════════════════════════════════
    // PHASE 3: WELCOME CHANNEL & EMBED
    // ═══════════════════════════════════════════
    console.log('\n── PHASE 3: Welcome System ──');
    const infoCat = [...channels.values()].find(c => c && c.type === ChannelType.GuildCategory && c.name.includes('INFORMATION'));
    let welcomeCh = [...channels.values()].find(c => c && c.isTextBased() && c.name.includes('welcome'));
    
    if (!welcomeCh && infoCat) {
      try {
        welcomeCh = await guild.channels.create({
          name: '👋┃welcome',
          type: ChannelType.GuildText,
          parent: infoCat.id,
          position: 0
        });
        console.log(`  [+] Created #👋┃welcome channel`);
      } catch (e) {
        console.log(`  [-] Could not create welcome channel: ${e.message}`);
      }
    }

    if (welcomeCh) {
      try {
        const msgs = await welcomeCh.messages.fetch({ limit: 50 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        if (botMsgs.size > 0) await welcomeCh.bulkDelete(botMsgs).catch(() => {});
      } catch (e) {}

      const welcomeEmbed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Executive Network', iconURL: guild.iconURL() })
        .setTitle('👋 WELCOME TO KRYLOSMP!')
        .setDescription(
          `Welcome to **KryloSMP** — the ultimate Minecraft SMP experience! ⚔️🏰\n\n` +
          `🎮 **How to Get Started:**\n` +
          `1️⃣ Read the rules in <#${[...channels.values()].find(c => c?.name?.includes('rules'))?.id || '0'}>\n` +
          `2️⃣ Verify your account in <#${[...channels.values()].find(c => c?.name?.includes('verify'))?.id || '0'}>\n` +
          `3️⃣ Connect to the Minecraft server and start playing!\n` +
          `4️⃣ Use \`/daily\` to claim free 1,000 KryloCoins every day!\n\n` +
          `🌐 **Server Connection:**`
        )
        .addFields(
          { name: '🌐 Server IP', value: '`KryloSmp.play.hosting`', inline: true },
          { name: '☕ Java Port', value: '`25565`', inline: true },
          { name: '🪨 Bedrock Port', value: '`19132`', inline: true },
          { name: '📦 Version', value: '`1.21.x`', inline: true },
          { name: '💻 Player Portal', value: '[Open Portal](https://krylosmp.web.app)', inline: true },
          { name: '🛒 Web Store', value: '[Visit Store](https://krylosmp.tebex.io)', inline: true }
        )
        .setColor(0x00E5FF)
        .setThumbnail(guild.iconURL())
        .setImage('https://cdn.discordapp.com/attachments/1524878881918685408/placeholder.png')
        .setFooter({ text: 'KryloSMP Executive Network • Welcome Protocol', iconURL: guild.iconURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('start_verification').setLabel('✅ Verify Account').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setLabel('🌐 Player Portal').setStyle(ButtonStyle.Link).setURL('https://krylosmp.web.app'),
        new ButtonBuilder().setLabel('🛒 Web Store').setStyle(ButtonStyle.Link).setURL('https://krylosmp.tebex.io')
      );

      await welcomeCh.send({ embeds: [welcomeEmbed], components: [row] });
      console.log(`  [+] Posted premium Welcome embed in #${welcomeCh.name}`);
    }

    // ═══════════════════════════════════════════
    // PHASE 4: PREMIUM CHANNEL GUIDE EMBEDS
    // ═══════════════════════════════════════════
    console.log('\n── PHASE 4: Premium Channel Guide Embeds ──');

    const channelEmbeds = [
      {
        find: 'server-info',
        embed: new EmbedBuilder()
          .setTitle('🌐 KRYLOSMP — SERVER CONNECTION INFO')
          .setDescription('Everything you need to connect and play on KryloSMP!')
          .addFields(
            { name: '🌐 Server IP', value: '```KryloSmp.play.hosting```', inline: false },
            { name: '☕ Java Port', value: '`25565`', inline: true },
            { name: '🪨 Bedrock Port', value: '`19132`', inline: true },
            { name: '📦 Version', value: '`1.21.x`', inline: true },
            { name: '💻 Player Portal', value: '[krylosmp.web.app](https://krylosmp.web.app)', inline: true },
            { name: '🛒 Web Store', value: '[krylosmp.tebex.io](https://krylosmp.tebex.io)', inline: true }
          )
          .setColor(0x00E5FF).setTimestamp()
      },
      {
        find: 'socials',
        embed: new EmbedBuilder()
          .setTitle('🌐 FOLLOW KRYLOSMP ON ALL PLATFORMS')
          .setDescription(
            '**Stay connected and never miss an update!**\n\n' +
            '🎬 **YouTube** — Subscribe for videos, events & highlights\n' +
            '💬 **Discord** — You\'re already here! Invite friends!\n' +
            '💻 **Player Portal** — [krylosmp.web.app](https://krylosmp.web.app)\n' +
            '🛒 **Web Store** — [krylosmp.tebex.io](https://krylosmp.tebex.io)'
          )
          .setColor(0x5865F2).setTimestamp()
      },
      {
        find: 'clan-recruitment',
        embed: new EmbedBuilder()
          .setTitle('🏰 CLAN RECRUITMENT CENTER')
          .setDescription(
            '**Build your empire! Create or join a Clan today!**\n\n' +
            '⚡ **Create a Clan:** `/clan action:create name:YourClan tag:TAG`\n' +
            '👥 **Invite Members:** `/clan action:invite target:@user`\n' +
            '💰 **Fund Your Vault:** `/clan action:deposit value:10000`\n' +
            '📊 **View Rankings:** `/clan action:leaderboard`\n' +
            '📋 **Clan Info:** `/clan action:info`\n\n' +
            '*Each clan gets a private role, private text channel, and vault!*'
          )
          .setColor(0xFFD700).setTimestamp()
      },
      {
        find: 'pvp-chat',
        embed: new EmbedBuilder()
          .setTitle('⚔️ PVP ARENA & COMBAT ZONE')
          .setDescription(
            '**Challenge anyone. Prove your worth in combat!**\n\n' +
            '🎮 **Challenge a Player:** `/pvp` or `/challenge @opponent`\n' +
            '⚔️ **1v1 Duel:** `/duel @opponent`\n' +
            '🏆 **Monthly Tournament:** `/tournament` to sign up\n' +
            '📊 **ELO Rankings:** Win duels to climb the leaderboard!\n\n' +
            '*Top PvP players earn exclusive rewards and recognition!*'
          )
          .setColor(0xFF4444).setTimestamp()
      },
      {
        find: 'jackpot-vault',
        embed: new EmbedBuilder()
          .setTitle('💰 KRYLOSMP JACKPOT VAULT')
          .setDescription(
            '**Feeling lucky? Enter the Jackpot for MASSIVE KryloCoins!**\n\n' +
            '🎰 **Enter Jackpot:** `/jackpot`\n' +
            '🎲 **Spin the Wheel:** `/spin`\n' +
            '📦 **Open Lootbox:** `/lootbox`\n' +
            '🎰 **Slot Machine:** `/slots`\n\n' +
            '*The more you wager, the bigger the payout! Good luck!*'
          )
          .setColor(0xFFD700).setTimestamp()
      },
      {
        find: 'bounty-board',
        embed: new EmbedBuilder()
          .setTitle('🎯 BOUNTY BOARD — HUNT OR BE HUNTED')
          .setDescription(
            '**Place bounties on players or hunt them down for rewards!**\n\n' +
            '🎯 **Place a Bounty:** `/bounty`\n' +
            '💰 **Claim Rewards:** Kill the target in-game to collect!\n' +
            '👀 **View Active Bounties:** Check this channel for live bounties\n\n' +
            '*Higher bounties attract more hunters. Watch your back!*'
          )
          .setColor(0xFF6B35).setTimestamp()
      },
    ];

    for (const ce of channelEmbeds) {
      const ch = [...channels.values()].find(c => c && c.isTextBased() && c.name.toLowerCase().includes(ce.find));
      if (!ch) continue;
      try {
        const msgs = await ch.messages.fetch({ limit: 20 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        if (botMsgs.size > 0) await ch.bulkDelete(botMsgs).catch(async () => {
          for (const [,m] of botMsgs) await m.delete().catch(() => {});
        });
        ce.embed.setAuthor({ name: 'KryloSMP Executive Network', iconURL: guild.iconURL() });
        ce.embed.setThumbnail(guild.iconURL());
        ce.embed.setFooter({ text: `KryloSMP Official • ${guild.name}`, iconURL: guild.iconURL() });
        await ch.send({ embeds: [ce.embed] });
        console.log(`  [+] Posted premium embed in #${ch.name}`);
      } catch (e) {
        console.log(`  [-] Failed #${ch.name}: ${e.message}`);
      }
    }

    // ═══════════════════════════════════════════
    // PHASE 5: AUTO-MOD RULES (Main guild only)
    // ═══════════════════════════════════════════
    if (guild.id === '1524878881918685405') {
      console.log('\n── PHASE 5: AutoMod Rules ──');
      const token = process.env.DISCORD_TOKEN;
      const autoModUrl = `https://discord.com/api/v10/guilds/${guild.id}/auto-moderation/rules`;

      const rules = [
        {
          name: '🚫 Anti-Mass Mention',
          event_type: 1,
          trigger_type: 1,
          trigger_metadata: { mention_total_limit: 5 },
          actions: [{ type: 1, metadata: { custom_message: '🚫 Too many mentions! Please avoid mass pinging.' } }],
          enabled: true
        },
        {
          name: '🔗 Anti-Invite Links',
          event_type: 1,
          trigger_type: 1,
          trigger_metadata: { keyword_filter: ['discord.gg/', 'discord.com/invite/', 'discordapp.com/invite/'] },
          actions: [{ type: 1, metadata: { custom_message: '🚫 Posting invite links is not allowed without permission!' } }],
          enabled: true
        },
        {
          name: '🤬 Profanity Filter',
          event_type: 1,
          trigger_type: 4,
          trigger_metadata: { presets: [1, 2, 3] },
          actions: [{ type: 1, metadata: { custom_message: '🚫 Please keep chat family-friendly! No profanity.' } }],
          enabled: true
        }
      ];

      for (const rule of rules) {
        try {
          const res = await fetch(autoModUrl, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(rule)
          });
          const data = await res.json();
          if (res.ok) {
            console.log(`  [+] AutoMod Rule Created: "${rule.name}"`);
          } else {
            console.log(`  [⚠️] AutoMod "${rule.name}": ${data.message || JSON.stringify(data)}`);
          }
        } catch (e) {
          console.log(`  [-] AutoMod "${rule.name}" error: ${e.message}`);
        }
      }
    }

    console.log(`\n🏆 SERVER UPGRADE COMPLETE FOR [${guild.name}]!\n`);
  }

  console.log('\n🏆🏆🏆 ALL SERVERS FULLY UPGRADED! 🏆🏆🏆');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
