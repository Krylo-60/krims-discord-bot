import dotenv from 'dotenv';
dotenv.config();
import {
  Client,
  GatewayIntentBits,
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

const GUILD_ID = '1561174283294609479';

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(GUILD_ID);
    console.log(`\n🚀 SUPERCHARGING: ${guild.name} (${guild.id})`);

    // 1. ROLES DEFINITION
    const notificationRoles = [
      { name: '📢 Bot Updates & Drops', color: 0x00F2FF, mentionable: false },
      { name: '🚀 Beta Announcements', color: 0xE67E22, mentionable: false },
      { name: '🌐 Uptime & Maintenance Alerts', color: 0x2ECC71, mentionable: false }
    ];

    const personaRoles = [
      { name: '🎮 SMP / Minecraft Owner', color: 0x5865F2, mentionable: false },
      { name: '🤖 Community Admin', color: 0x9B59B6, mentionable: false },
      { name: '💻 Bot Developer', color: 0x00E5FF, mentionable: false }
    ];

    const colorRoles = [
      { name: '⚡ Electric Cyan', color: 0x00F2FF },
      { name: '🟣 Mystic Purple', color: 0x9B59B6 },
      { name: '🟡 Neon Gold', color: 0xFFD700 },
      { name: '🔴 Crimson Red', color: 0xFF1E27 },
      { name: '🟢 Emerald Green', color: 0x2ECC71 },
      { name: '🌸 Hot Pink', color: 0xFF69B4 },
      { name: '🤍 Ghost White', color: 0xF8F9FA }
    ];

    await guild.roles.fetch();
    const createdRoles = {};

    const allNewRoles = [...notificationRoles, ...personaRoles, ...colorRoles];
    for (const rc of allNewRoles) {
      let r = guild.roles.cache.find(x => x && x.name === rc.name);
      if (!r) {
        r = await guild.roles.create({
          name: rc.name,
          color: rc.color,
          mentionable: rc.mentionable || false,
          reason: 'Krims Support Hub Supercharge'
        });
        console.log(`  ✅ Created role: ${r.name} (${r.id})`);
      } else {
        console.log(`  ℹ️ Role exists: ${r.name} (${r.id})`);
      }
      createdRoles[rc.name] = r;
    }

    // 2. CHANNELS & CATEGORIES
    const channels = await guild.channels.fetch();
    const catWelcome = guild.channels.cache.find(c => c && c.type === ChannelType.GuildCategory && c.name.includes('WELCOME & INFO'));

    // Create #🏷️・roles in Welcome category
    let chRoles = guild.channels.cache.find(c => c && c.name.includes('roles'));
    if (!chRoles && catWelcome) {
      chRoles = await guild.channels.create({
        name: '🏷️・𝗋𝗈𝗅𝖾𝗌',
        type: ChannelType.GuildText,
        parent: catWelcome.id,
        permissionOverwrites: [
          {
            id: guild.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory],
            deny: [PermissionFlagsBits.SendMessages]
          }
        ]
      });
      console.log('  ✅ Created #🏷️・𝗋𝗈𝗅𝖾𝗌');
    }

    // Create Voice Category
    let catVoice = guild.channels.cache.find(c => c && c.type === ChannelType.GuildCategory && c.name.includes('VOICE & STAGES'));
    if (!catVoice) {
      catVoice = await guild.channels.create({
        name: '🔊 ─── VOICE & STAGES ───',
        type: ChannelType.GuildCategory
      });
      console.log('  📁 Created category: 🔊 ─── VOICE & STAGES ───');
    }

    // Voice channels
    const voiceChannels = [
      { name: '🎙️・Dev-Stage', type: ChannelType.GuildVoice },
      { name: '🔊・Support-Voice-1', type: ChannelType.GuildVoice },
      { name: '🔊・Support-Voice-2', type: ChannelType.GuildVoice },
      { name: '🎮・Community-Lounge', type: ChannelType.GuildVoice }
    ];

    for (const vc of voiceChannels) {
      let ch = guild.channels.cache.find(c => c && c.name === vc.name);
      if (!ch) {
        ch = await guild.channels.create({
          name: vc.name,
          type: vc.type,
          parent: catVoice.id
        });
        console.log(`  🔊 Created voice channel: ${vc.name}`);
      }
    }

    // 3. POST ROLE SELECTION PANELS IN #🏷️・roles
    if (chRoles) {
      // Purge old messages
      const oldMsgs = await chRoles.messages.fetch({ limit: 10 });
      for (const [, m] of oldMsgs) {
        await m.delete().catch(() => {});
      }

      const notifEmbed = new EmbedBuilder()
        .setTitle('🔔 NOTIFICATIONS & COMMUNITY ROLES')
        .setDescription(
          `Customize your pings and community identity! React below to toggle your roles.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `### 📢 Notification Preferences\n` +
          `📢 • <@&${createdRoles['📢 Bot Updates & Drops'].id}> — *Get pinged for new bot releases & features*\n` +
          `🚀 • <@&${createdRoles['🚀 Beta Announcements'].id}> — *Early previews, beta testing opportunities*\n` +
          `🌐 • <@&${createdRoles['🌐 Uptime & Maintenance Alerts'].id}> — *Scheduled maintenance & status alerts*\n\n` +
          `### 👥 Your Platform / Identity\n` +
          `🎮 • <@&${createdRoles['🎮 SMP / Minecraft Owner'].id}> — *Minecraft SMP & Clan Owner*\n` +
          `🤖 • <@&${createdRoles['🤖 Community Admin'].id}> — *Discord Server Admin / Community Leader*\n` +
          `💻 • <@&${createdRoles['💻 Bot Developer'].id}> — *Developer & Bot Integrator*\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `👉 *Click the corresponding emoji below to claim or remove your role!*`
        )
        .setColor(0x00F2FF)
        .setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 512 }))
        .setFooter({ text: 'Krims Code Support • Automated Role Dispatcher' })
        .setTimestamp();

      const notifMsg = await chRoles.send({ embeds: [notifEmbed] });
      const notifEmojis = ['📢', '🚀', '🌐', '🎮', '🤖', '💻'];
      for (const emoji of notifEmojis) {
        await notifMsg.react(emoji).catch(() => {});
      }

      const colorEmbed = new EmbedBuilder()
        .setTitle('🎨 CHAT ACCENT COLOR ROLES')
        .setDescription(
          `Give your username a vibrant color in chat and the member list!\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `⚡ • <@&${createdRoles['⚡ Electric Cyan'].id}> — **Electric Cyan**\n` +
          `🟣 • <@&${createdRoles['🟣 Mystic Purple'].id}> — **Mystic Purple**\n` +
          `🟡 • <@&${createdRoles['🟡 Neon Gold'].id}> — **Neon Gold**\n` +
          `🔴 • <@&${createdRoles['🔴 Crimson Red'].id}> — **Crimson Red**\n` +
          `🟢 • <@&${createdRoles['🟢 Emerald Green'].id}> — **Emerald Green**\n` +
          `🌸 • <@&${createdRoles['🌸 Hot Pink'].id}> — **Hot Pink**\n` +
          `🤍 • <@&${createdRoles['🤍 Ghost White'].id}> — **Ghost White**\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `👉 *Click an emoji below to equip that color! Selecting another color swaps it automatically.*`
        )
        .setColor(0x9B59B6)
        .setFooter({ text: 'Krims Code Support • Color Customization' })
        .setTimestamp();

      const colorMsg = await chRoles.send({ embeds: [colorEmbed] });
      const colorEmojis = ['⚡', '🟣', '🟡', '🔴', '🟢', '🌸', '🤍'];
      for (const emoji of colorEmojis) {
        await colorMsg.react(emoji).catch(() => {});
      }

      console.log('  ✅ Deployed interactive role panels to #🏷️・roles!');
    }

    // 4. POST RICH SHOWCASE INSTRUCTIONS IN #💻・server-showcase
    const chShowcase = guild.channels.cache.find(c => c && c.name.includes('showcase'));
    if (chShowcase) {
      const showcaseMsgs = await chShowcase.messages.fetch({ limit: 5 });
      if (showcaseMsgs.size === 0) {
        const showcaseEmbed = new EmbedBuilder()
          .setTitle('💻 KRIMS BOT POWERED SERVERS — SHOWCASE & DIRECTORY')
          .setDescription(
            `Welcome to the Community Showcase channel!\n\n` +
            `Does your Discord community or Minecraft SMP run the **Krims Discord Bot**? Showcase your server here for hundreds of members to explore!\n\n` +
            `📋 **How to Feature Your Community:**\n` +
            `1. Server Name & Brief Tagline\n` +
            `2. Minecraft Server IP / Website *(if applicable)*\n` +
            `3. Favorite Krims Bot Features *(e.g. 3D Skin Cards, Economy, AI Banter)*\n` +
            `4. Clean Permanent Discord Invite Link\n` +
            `5. Screenshot or banner of your community!\n\n` +
            `🌟 **Verified Server Owners:** Server owners verified in our ticket system receive the **🌟 Certified Server Owner** role and a permanent pin on their showcase post!`
          )
          .setColor(0x2ECC71)
          .setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 512 }))
          .setFooter({ text: 'Krims Code Community Showcase' })
          .setTimestamp();

        const sMsg = await chShowcase.send({ embeds: [showcaseEmbed] });
        await sMsg.pin().catch(() => {});
        console.log('  ✅ Posted & pinned showcase guide embed!');
      }
    }

    // 5. POST GRAND LAUNCH EMBED IN #📢・announcements
    const chAnnouncements = guild.channels.cache.find(c => c && c.name.includes('announcements'));
    if (chAnnouncements) {
      const announceMsgs = await chAnnouncements.messages.fetch({ limit: 5 });
      if (announceMsgs.size === 0) {
        const launchEmbed = new EmbedBuilder()
          .setTitle('🚀 OFFICIAL LAUNCH — KRIMS CODE SUPPORT & UPDATES HEADQUARTERS')
          .setDescription(
            `Welcome everyone to the official **Krims Code Support & Updates** headquarters! 🎉\n\n` +
            `We are excited to bring server owners, creators, developers, and players together in one centralized powerhouse network.\n\n` +
            `**🌟 What We Offer:**\n` +
            `• **⚡ 24/7 Dedicated Bot Assistance:** Instant 1-on-1 private tickets in <#1561175618589167738> with our core engineering team.\n` +
            `• **🚀 Cutting-Edge Engine Releases:** Real-time changelogs and beta tests for v5.3 Enterprise and beyond in <#1561175618199093370>.\n` +
            `• **🤝 Server Owner Network:** Connect with Minecraft SMP leaders and community admins across our ecosystem.\n` +
            `• **🧠 AI-Powered Automation:** Experience zero-crash self-healing technology and intelligent contextual conversation.\n\n` +
            `👉 **First Step:** Head over to <#${chRoles ? chRoles.id : '0'}> to grab your notification pings and chat color roles!`
          )
          .setColor(0x00F2FF)
          .setImage('https://krims-discord-bot-d57m.onrender.com/gifs/the_half_lifes.gif')
          .setThumbnail(client.user.displayAvatarURL({ extension: 'png', size: 512 }))
          .setFooter({ text: 'Krims Code Studio • Executive Command', iconURL: client.user.displayAvatarURL({ extension: 'png', size: 512 }) })
          .setTimestamp();

        await chAnnouncements.send({ embeds: [launchEmbed] });
        console.log('  ✅ Posted official launch announcement in #announcements!');
      }
    }

    // 6. POST AI LAB DIRECTORY IN #🧠・ai-lab
    const chAiLab = guild.channels.cache.find(c => c && c.name.includes('ai-lab'));
    if (chAiLab) {
      const aiMsgs = await chAiLab.messages.fetch({ limit: 5 });
      if (aiMsgs.size === 0) {
        const aiEmbed = new EmbedBuilder()
          .setTitle('🧠 KRIMS AI NEURAL LAB & SANDBOX')
          .setDescription(
            `Welcome to the **AI Neural Laboratory**! Here, you can test and explore the intelligent capabilities powering the Krims Bot Ecosystem.\n\n` +
            `**🔬 Active AI Subsystems:**\n` +
            `• **Gemini 2.5 Multi-turn Memory:** Learns server context, player identities, and Minecraft IGNs across chats.\n` +
            `• **Zero-Crash Self-Healing:** Catches runtime exceptions, analyzes stack traces, and auto-patches state.\n` +
            `• **Contextual Chat Banter:** Periodically monitors server activity and chimes in with tactical advice and humor.\n` +
            `• **Dual-Phase Welcome Card Renderer:** Dynamically draws custom 3D Minecraft heads and cyber cards.\n\n` +
            `*Feel free to test commands and ask questions here!*`
          )
          .setColor(0x00F2FF)
          .setFooter({ text: 'Krims Code AI Lab • Experimental Zone' })
          .setTimestamp();

        await chAiLab.send({ embeds: [aiEmbed] });
        console.log('  ✅ Posted AI Lab embed!');
      }
    }

    console.log('\n======================================================');
    console.log('🏆 KRIMS CODE SUPPORT SERVER SUPERCHARGE COMPLETE!');
    console.log('======================================================\n');
  } catch (err) {
    console.error('Supercharge error:', err);
  } finally {
    client.destroy();
  }
});

client.login(process.env.DISCORD_TOKEN);
