import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  console.log(`[+] Phase 4 Upgrader Online as ${client.user.tag}\n`);

  for (const [, guild] of client.guilds.cache) {
    if (!guild.name.toLowerCase().includes('krylo')) continue;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 PHASE 4 UPGRADE: ${guild.name} (${guild.id})`);
    console.log(`${'='.repeat(60)}\n`);

    const channels = await guild.channels.fetch();
    const allChannels = [...channels.values()].filter(c => c !== null);
    const communityCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('COMMUNITY'));
    const infoCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('INFORMATION'));

    // ═══════════════════════════════════════════
    // 1. CHANGELOG CHANNEL
    // ═══════════════════════════════════════════
    console.log('── 1: Changelog Channel ──');
    let changelogCh = allChannels.find(c => c.isTextBased() && c.name.includes('changelog'));
    if (!changelogCh && infoCat) {
      try {
        changelogCh = await guild.channels.create({
          name: '📋┃changelog',
          type: ChannelType.GuildText,
          parent: infoCat.id,
          topic: '📋 Official KryloSMP changelog — every update, fix, and new feature documented here!'
        });
        console.log(`  [+] Created #📋┃changelog`);
      } catch (e) { console.log(`  [-] ${e.message}`); }
    }
    if (changelogCh) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Development', iconURL: guild.iconURL() })
        .setTitle('📋 KRYLOSMP OFFICIAL CHANGELOG')
        .setDescription('**All updates, patches, and new features are documented here.**\n\nStay informed about what\'s new!')
        .addFields(
          { name: '📅 August 12, 2026 — Season 1 Re-Release', value: '• Full server rebuild\n• 65+ slash commands\n• KryloCoin Economy v2.0\n• Clan System with vaults\n• PvP ELO rankings\n• AutoMod protection\n• Premium channel guides\n• XP leveling system', inline: false },
          { name: '📅 August 12, 2026 — Server Upgrade Wave', value: '• Channel topics & slowmode deployed\n• 11 premium roles created\n• Welcome system with verify buttons\n• FAQ, Giveaway, Starboard channels\n• Confession & QOTD channels\n• Verified-only permissions\n• Voice lounges expanded\n• Economy & Level reward guides', inline: false }
        )
        .setColor(0x00E5FF).setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Executive Network', iconURL: guild.iconURL() }).setTimestamp();
      await changelogCh.send({ embeds: [embed] });
      console.log(`  [+] Posted Changelog embed`);
    }

    // ═══════════════════════════════════════════
    // 2. SERVER MAP / WORLD INFO CHANNEL
    // ═══════════════════════════════════════════
    console.log('\n── 2: World Info Channel ──');
    let worldCh = allChannels.find(c => c.isTextBased() && (c.name.includes('world') || c.name.includes('map')));
    if (!worldCh && infoCat) {
      try {
        worldCh = await guild.channels.create({
          name: '🗺️┃world-info',
          type: ChannelType.GuildText,
          parent: infoCat.id,
          topic: '🗺️ Server world info, spawn coordinates, key locations, and world borders!'
        });
        console.log(`  [+] Created #🗺️┃world-info`);
      } catch (e) { console.log(`  [-] ${e.message}`); }
    }
    if (worldCh) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP World Atlas', iconURL: guild.iconURL() })
        .setTitle('🗺️ KRYLOSMP WORLD ATLAS')
        .setDescription('**Explore the KryloSMP world! Key locations and coordinates.**')
        .addFields(
          { name: '🏠 Spawn', value: '`0, 70, 0` — Central hub with portals, shops & NPCs', inline: true },
          { name: '🌍 World Border', value: '`±10,000 blocks` — Overworld\n`±5,000 blocks` — Nether', inline: true },
          { name: '⚔️ PvP Arena', value: 'Near spawn — enter at your own risk!', inline: true },
          { name: '🏪 Shopping District', value: 'Near spawn — buy/sell player shops', inline: true },
          { name: '🌋 Nether Hub', value: 'Linked ice-road highways for fast travel', inline: true },
          { name: '🐉 End Access', value: 'Stronghold location — discovered by players!', inline: true }
        )
        .setColor(0x2ECC71).setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP World Atlas • Season 1', iconURL: guild.iconURL() }).setTimestamp();
      await worldCh.send({ embeds: [embed] });
      console.log(`  [+] Posted World Atlas embed`);
    }

    // ═══════════════════════════════════════════
    // 3. SERVER STATUS DISPLAY CHANNEL
    // ═══════════════════════════════════════════
    console.log('\n── 3: Live Server Status Channel ──');
    let statusCh = allChannels.find(c => c.isTextBased() && c.name.includes('server-status'));
    if (!statusCh && infoCat) {
      try {
        statusCh = await guild.channels.create({
          name: '🟢┃server-status',
          type: ChannelType.GuildText,
          parent: infoCat.id,
          topic: '🟢 Live KryloSMP server status — online/offline indicator and player count!'
        });
        console.log(`  [+] Created #🟢┃server-status`);
      } catch (e) { console.log(`  [-] ${e.message}`); }
    }
    if (statusCh) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Server Monitor', iconURL: guild.iconURL() })
        .setTitle('🟢 LIVE SERVER STATUS')
        .setDescription('**Use `/status` to check the live server status at any time!**')
        .addFields(
          { name: '🌐 Server IP', value: '`KryloSmp.play.hosting`', inline: true },
          { name: '☕ Java', value: '`25565`', inline: true },
          { name: '🪨 Bedrock', value: '`19132`', inline: true },
          { name: '📦 Version', value: '`1.21.x`', inline: true },
          { name: '🔧 Quick Commands', value: '`/status` — Check if online\n`/ip` — Get connection info\n`/gameboost` — Start the server', inline: false }
        )
        .setColor(0x00FF88).setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Server Monitor • Live', iconURL: guild.iconURL() }).setTimestamp();
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('btn_check_status').setLabel('🔍 Check Status').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('btn_startserver_quick').setLabel('🚀 Start Server').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setLabel('🌐 Player Portal').setStyle(ButtonStyle.Link).setURL('https://krylosmp.web.app/')
      );
      await statusCh.send({ embeds: [embed], components: [row] });
      console.log(`  [+] Posted Server Status panel with buttons`);
    }

    // ═══════════════════════════════════════════
    // 4. CONTENT CREATOR SHOWCASE
    // ═══════════════════════════════════════════
    console.log('\n── 4: Content Creator Showcase ──');
    let ccCh = allChannels.find(c => c.isTextBased() && (c.name.includes('content-creator') || c.name.includes('showcase')));
    if (!ccCh && communityCat) {
      try {
        ccCh = await guild.channels.create({
          name: '🎬┃content-creators',
          type: ChannelType.GuildText,
          parent: communityCat.id,
          topic: '🎬 Share your KryloSMP YouTube videos, TikToks, streams, and content here!'
        });
        console.log(`  [+] Created #🎬┃content-creators`);
      } catch (e) { console.log(`  [-] ${e.message}`); }
    }
    if (ccCh) {
      const embed = new EmbedBuilder()
        .setTitle('🎬 CONTENT CREATOR SHOWCASE')
        .setDescription(
          '**Share your KryloSMP content with the community!**\n\n' +
          '📹 Post your YouTube videos, TikToks, and streams\n' +
          '📸 Share epic screenshots and montages\n' +
          '🏆 Best content may get featured in #📢┃server-announcements!\n\n' +
          '🎭 **Want the Content Creator role?**\n' +
          'Open a ticket with links to your content. Requirements:\n' +
          '• 100+ subscribers/followers\n' +
          '• At least 3 KryloSMP videos/posts\n' +
          '• Active community member'
        )
        .setColor(0xE91E63).setTimestamp();
      await ccCh.send({ embeds: [embed] });
      console.log(`  [+] Posted Content Creator Guide embed`);
    }

    // ═══════════════════════════════════════════
    // 5. EVENTS CHANNEL
    // ═══════════════════════════════════════════
    console.log('\n── 5: Events Channel ──');
    let eventsCh = allChannels.find(c => c.isTextBased() && c.name.includes('events') && !c.name.includes('tournament'));
    if (!eventsCh && communityCat) {
      try {
        eventsCh = await guild.channels.create({
          name: '🎪┃events',
          type: ChannelType.GuildText,
          parent: communityCat.id,
          topic: '🎪 Community events, competitions, game nights, build battles, and special occasions!'
        });
        console.log(`  [+] Created #🎪┃events`);
      } catch (e) { console.log(`  [-] ${e.message}`); }
    }
    if (eventsCh) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Events', iconURL: guild.iconURL() })
        .setTitle('🎪 KRYLOSMP EVENT HUB')
        .setDescription(
          '**Community events are posted here!**\n\n' +
          '🏗️ **Build Battles** — Show off your building skills\n' +
          '⚔️ **PvP Tournaments** — Monthly tournament brackets\n' +
          '🎮 **Game Nights** — Community gaming sessions\n' +
          '🎁 **Special Events** — Holiday events, seasonal celebrations\n' +
          '🏆 **Competitions** — Scavenger hunts, speedruns, challenges\n\n' +
          '*Check #📢┃server-announcements for event schedules!*'
        )
        .setColor(0xFF9800).setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Executive Network • Events', iconURL: guild.iconURL() }).setTimestamp();
      await eventsCh.send({ embeds: [embed] });
      console.log(`  [+] Posted Events Hub embed`);
    }

    console.log(`\n🏆 PHASE 4 COMPLETE FOR [${guild.name}]!\n`);
  }

  console.log('\n🏆🏆🏆 ALL SERVERS PHASE 4 COMPLETE! 🏆🏆🏆');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
