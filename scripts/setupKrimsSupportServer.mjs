import 'dotenv/config';
import fs from 'fs';
import path from 'path';
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

export async function deployKrimsSupportServer(guildId, customClient = null, callerChannelId = null) {
  let activeClient = customClient;
  let shouldDestroy = false;

  if (!activeClient) {
    activeClient = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
      ]
    });
    await activeClient.login(process.env.DISCORD_TOKEN);
    console.log(`[+] Logged in as ${activeClient.user.tag}`);
    shouldDestroy = true;
  }

  const guild = await activeClient.guilds.fetch(guildId);
  console.log(`\n🚀 DEPLOYING KRIMS CODE SUPPORT & UPDATES SERVER FOR: ${guild?.name || guildId} (${guild.id})`);

  // 1. UPDATE SERVER ICON (Using current bot logo reference design)
  const iconPath = path.resolve('assets/krims_support_server_icon.jpg');
  if (fs.existsSync(iconPath)) {
    try {
      console.log('[*] Setting official server icon from bot logo reference...');
      await guild.setIcon(fs.readFileSync(iconPath));
      console.log('  ✅ Server icon updated successfully!');
    } catch (err) {
      console.warn('  ⚠️ Could not set server icon directly (Check bot permissions/rate limits):', err.message);
    }
  }

  // 2. CREATE ROLES
  console.log('[*] Creating server roles...');
  const roleConfigs = [
    { name: '👑 Krims Executive', color: 0xFFD700, hoist: true, mentionable: true },
    { name: '💻 Lead Bot Developer', color: 0x00F2FF, hoist: true, mentionable: true },
    { name: '🛡️ Support Specialist', color: 0x9B59B6, hoist: true, mentionable: true },
    { name: '🌟 Certified Server Owner', color: 0x2ECC71, hoist: true, mentionable: true },
    { name: '🧪 Beta Tester', color: 0xE67E22, hoist: true, mentionable: true },
    { name: '🤖 Krims Bot Ecosystem', color: 0x5865F2, hoist: false, mentionable: false },
    { name: '👥 Community Member', color: 0x95A5A6, hoist: false, mentionable: false }
  ];

  await guild.roles.fetch().catch(() => {});
  const roles = {};
  for (const rc of roleConfigs) {
    let r = guild.roles.cache.find(x => x && x.name === rc.name);
    if (!r) {
      r = await guild.roles.create({
        name: rc.name,
        color: rc.color,
        hoist: rc.hoist,
        mentionable: rc.mentionable,
        reason: 'Krims Code Support Hub Architecture'
      });
      console.log(`  ✅ Created role: ${r.name}`);
    } else {
      console.log(`  ℹ️ Role exists: ${r.name}`);
    }
    roles[rc.name] = r;
  }

  // 3. CLEAN UP DEFAULT PLACEHOLDER CHANNELS (do not delete caller channel)
  console.log('[*] Cleaning up default discord channels...');
  const existingChannels = await guild.channels.fetch();
  for (const [id, ch] of existingChannels) {
    if (ch && ch.id !== callerChannelId && ['general', 'General', 'Text Channels', 'Voice Channels'].includes(ch.name)) {
      await ch.delete().catch(() => {});
    }
  }

  // Helpers to ensure channels and categories
  async function getOrCreateCategory(name) {
    let cat = guild.channels.cache.find(c => c && c.type === ChannelType.GuildCategory && c.name === name);
    if (!cat) {
      cat = await guild.channels.create({
        name,
        type: ChannelType.GuildCategory
      });
      console.log(`  📁 Created category: ${name}`);
    }
    return cat;
  }

  async function getOrCreateChannel(name, type, parentId, permissionOverwrites = []) {
    let ch = guild.channels.cache.find(c => c && c.name === name && c.parentId === parentId);
    if (!ch) {
      ch = await guild.channels.create({
        name,
        type,
        parent: parentId,
        permissionOverwrites
      });
      console.log(`  📄 Created channel: #${name}`);
    }
    return ch;
  }

  // 4. CATEGORY: WELCOME & INFO
  const catWelcome = await getOrCreateCategory('📌 ─── WELCOME & INFO ───');
  
  const chWelcome = await getOrCreateChannel('👋・𝗐𝖾𝗅𝖼𝗈𝗆𝖾', ChannelType.GuildText, catWelcome.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
  ]);

  const chRules = await getOrCreateChannel('📜・𝗋𝗎𝗅𝖾𝗌', ChannelType.GuildText, catWelcome.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
  ]);

  const chAnnounce = await getOrCreateChannel('📢・𝖺𝗇𝗇𝗈𝗎𝗇𝖼𝖾𝗆𝖾𝗇𝗍𝗌', ChannelType.GuildText, catWelcome.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
  ]);

  const chUpdates = await getOrCreateChannel('🚀・𝖻𝗈𝗍-𝗎𝗉𝖽𝖺𝗍𝖾𝗌', ChannelType.GuildText, catWelcome.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
  ]);

  const chStatus = await getOrCreateChannel('🌐・𝖻𝗈𝗍-𝗌𝗍𝖺𝗍𝗎𝗌', ChannelType.GuildText, catWelcome.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
  ]);

  // 5. CATEGORY: SUPPORT & TICKETS
  const catSupport = await getOrCreateCategory('🎫 ─── SUPPORT & TICKETS ───');

  const chOpenTicket = await getOrCreateChannel('🎫・𝗈𝗉𝖾𝗇-𝗍𝗂𝖼𝗄𝖾𝗍', ChannelType.GuildText, catSupport.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
  ]);

  const chFaq = await getOrCreateChannel('❓・𝖿𝖺𝗊', ChannelType.GuildText, catSupport.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
  ]);

  const chFeatureRequests = await getOrCreateChannel('💡・𝖿𝖾𝖺𝗍𝗎𝗋𝖾-𝗋𝖾𝗊𝗎𝖾𝗌𝗍𝗌', ChannelType.GuildText, catSupport.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages] }
  ]);

  const chBugReports = await getOrCreateChannel('🐛・𝖻𝗎𝗀-𝗋𝖾𝗉𝗈𝗋𝗍𝗌', ChannelType.GuildText, catSupport.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages] }
  ]);

  // 6. CATEGORY: COMMUNITY & CODE
  const catCommunity = await getOrCreateCategory('💬 ─── COMMUNITY & SERVERS ───');

  const chGeneral = await getOrCreateChannel('💬・𝗀𝖾𝗇𝖾𝗋𝖺𝗅-𝖼𝗁𝖺𝗍', ChannelType.GuildText, catCommunity.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages] }
  ]);

  const chBotCommands = await getOrCreateChannel('🤖・𝖻𝗈𝗍-𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝗌', ChannelType.GuildText, catCommunity.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages] }
  ]);

  const chServerShowcase = await getOrCreateChannel('💻・𝗌𝖾𝗋𝗏𝖾𝗋-𝗌𝗁𝗈𝗐𝖼𝖺𝗌𝖾', ChannelType.GuildText, catCommunity.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.SendMessages] }
  ]);

  const chAiLab = await getOrCreateChannel('🧠・𝖺𝗂-𝗅𝖺𝖻', ChannelType.GuildText, catCommunity.id, [
    { id: guild.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
  ]);

  // 7. CATEGORY: STAFF HEADQUARTERS
  const catStaff = await getOrCreateCategory('🛡️ ─── STAFF HEADQUARTERS ───');

  const staffOverwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: roles['👑 Krims Executive'].id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    { id: roles['💻 Lead Bot Developer'].id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    { id: roles['🛡️ Support Specialist'].id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
  ];

  await getOrCreateChannel('⚡・𝖾𝗑𝖾𝖼𝗎𝗍𝗂𝗏𝖾-𝗅𝗈𝗎𝗇𝗀𝖾', ChannelType.GuildText, catStaff.id, [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: roles['👑 Krims Executive'].id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
    { id: roles['💻 Lead Bot Developer'].id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
  ]);

  await getOrCreateChannel('🛡️・𝗌𝗎𝗉𝗉𝗈𝗋𝗍-𝖼𝗁𝖺𝗍', ChannelType.GuildText, catStaff.id, staffOverwrites);
  await getOrCreateChannel('📋・𝗌𝗎𝗉𝗉𝗈𝗋𝗍-𝗅𝗈𝗀𝗌', ChannelType.GuildText, catStaff.id, staffOverwrites);

  // 8. DISPATCH OFFICIAL EMBEDS (Reference Bot Official Avatar)
  const avatarUrl = activeClient.user.displayAvatarURL({ extension: 'png', size: 512 });

  // Welcome Embed
  const welcomeEmbed = new EmbedBuilder()
    .setTitle('⚡ Welcome to Krims Code Support & Updates')
    .setDescription(
      `Welcome to the official headquarters for **Krims Code Studio** and the **Krims Bot Ecosystem**!\n\n` +
      `Here, server owners, developers, and community members get **24/7 dedicated assistance**, direct interaction with the engineering team, real-time update changelogs, and custom bot integration for their communities.\n\n` +
      `**📌 Essential Channels:**\n` +
      `• <#${chRules.id}> — Review our community guidelines & support terms.\n` +
      `• <#${chUpdates.id}> — Latest bot releases, patch notes & upcoming drops.\n` +
      `• <#${chOpenTicket.id}> — Open a private 1-on-1 assistance ticket with our staff.\n` +
      `• <#${chFaq.id}> — Quick answers to frequently asked configuration questions.\n` +
      `• <#${chGeneral.id}> — Chill and chat with fellow server owners.\n\n` +
      `**👑 Server Owners:** If your server runs Krims Bot, open a ticket or ping staff to claim your **🌟 Certified Server Owner** role!`
    )
    .setColor(0x00F2FF)
    .setThumbnail(avatarUrl)
    .setFooter({ text: 'Krims Code Ecosystem • All Rights Reserved', iconURL: avatarUrl })
    .setTimestamp();

  await chWelcome.send({ embeds: [welcomeEmbed] }).catch(() => {});

  // Rules Embed
  const rulesEmbed = new EmbedBuilder()
    .setTitle('📜 Official Server Rules & Conduct')
    .setDescription(
      `To ensure a professional and supportive atmosphere, all members and server owners must adhere to the following rules:\n\n` +
      `**1. Mutual Respect & Professionalism**\n` +
      `Treat all members, server owners, and staff with courtesy. Toxicity, harassment, hate speech, and drama are strictly prohibited.\n\n` +
      `**2. No Unauthorized Advertising or DM Solicitations**\n` +
      `Do not post unprompted server invite links or self-promotions in general channels. Showcases are permitted exclusively in <#${chServerShowcase.id}>.\n\n` +
      `**3. Appropriate Ticket Usage**\n` +
      `Use <#${chOpenTicket.id}> for genuine bot issues, bugs, and configuration support. Spamming tickets or opening frivolous tickets will result in ticket privileges being revoked.\n\n` +
      `**4. Bug & Vulnerability Disclosure**\n` +
      `If you discover an exploit or severe bug, report it immediately in private via a support ticket. Exploiting bugs or sharing exploit instructions is strictly forbidden.\n\n` +
      `**5. Respect Discord Terms of Service**\n` +
      `All actions within this server and in connection with our bot must comply with the Discord Community Guidelines and Terms of Service.\n\n` +
      `*Violations may lead to warnings, kicks, or permanent bans across the entire Krims Bot network.*`
    )
    .setColor(0x9B59B6)
    .setThumbnail(avatarUrl)
    .setFooter({ text: 'Krims Code Studio • Guidelines', iconURL: avatarUrl })
    .setTimestamp();

  await chRules.send({ embeds: [rulesEmbed] }).catch(() => {});

  // Ticket Panel Embed with Action Buttons
  const ticketEmbed = new EmbedBuilder()
    .setTitle('🎫 Krims Support & Ticket Dispatch Center')
    .setDescription(
      `Need assistance with the Krims Discord Bot or want to request custom configurations for your server?\n\n` +
      `Click one of the buttons below to create a **private support channel** directly with our development and support staff.\n\n` +
      `**Available Departments:**\n` +
      `• **🎫 General Support:** Setup help, command troubleshooting, and role setup.\n` +
      `• **🐛 Bug Report:** Report unexpected bot behaviors, crash traces, or sync issues.\n` +
      `• **💡 Feature Request:** Propose new ideas, slash commands, or integrations.\n` +
      `• **⚙️ Server Integration:** Request custom bot features or SMP linking for your server.`
    )
    .setColor(0x00F2FF)
    .setThumbnail(avatarUrl)
    .setFooter({ text: 'AI-Powered Ticket Classifier Active', iconURL: avatarUrl });

  const ticketButtons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('krims_ticket_support')
      .setLabel('Open Support Ticket')
      .setEmoji('🎫')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('krims_ticket_bug')
      .setLabel('Report a Bug')
      .setEmoji('🐛')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('krims_ticket_feature')
      .setLabel('Suggest Feature')
      .setEmoji('💡')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('krims_ticket_setup')
      .setLabel('Server Integration')
      .setEmoji('⚙️')
      .setStyle(ButtonStyle.Secondary)
  );

  await chOpenTicket.send({ embeds: [ticketEmbed], components: [ticketButtons] }).catch(() => {});

  // Bot Updates Embed
  const updatesEmbed = new EmbedBuilder()
    .setTitle('🚀 Krims Discord Bot — Version 5.3 Enterprise')
    .setDescription(
      `**Official Release Notes & Architecture Upgrade**\n\n` +
      `**🌟 Key Additions in v5.3:**\n` +
      `• **Dual-Phase Welcome Card Engine:** High-tech cyber visual cards with real-time 3D Minecraft skin head rendering.\n` +
      `• **AI Self-Healing Engine:** Full zero-crash exception interception with automated Gemini root-cause diagnosis.\n` +
      `• **30-Minute Context Watcher:** Automated active channel monitoring and context-aware chat banter.\n` +
      `• **Dynamic Server Footers:** Dynamic per-guild branding across all slash commands.\n` +
      `• **Ledgy Elite SMP Core Integration:** Dedicated server stats, IP status, and clan roster sync.\n\n` +
      `**⏳ Roadmap Drop:**\n` +
      `The next major ecosystem update arrives in **1 day to 1 week**! Stay tuned to this channel for release announcements.`
    )
    .setColor(0x2ECC71)
    .setThumbnail(avatarUrl)
    .setFooter({ text: 'Krims Bot v5.3 Enterprise • Continuous Deployment', iconURL: avatarUrl })
    .setTimestamp();

  await chUpdates.send({ embeds: [updatesEmbed] }).catch(() => {});

  // Bot Status Embed
  const statusEmbed = new EmbedBuilder()
    .setTitle('🌐 Krims Bot Global Infrastructure Status')
    .setDescription(
      `**System Metrics & Health Overview**\n\n` +
      `• **Status:** 🟢 100% Operational\n` +
      `• **Version:** \`v5.3 Enterprise\`\n` +
      `• **AI Core:** Gemini 2.5 Flash / Groq Llama-3.3 70B Versatile\n` +
      `• **AI Self-Healing:** ✅ ACTIVE (0 Crashes Recorded)\n` +
      `• **30-Min Server Watcher:** ✅ ACTIVE\n` +
      `• **Connected Guilds:** ${activeClient.guilds.cache.size}\n` +
      `• **WebSocket Latency:** ~${Math.round(activeClient.ws.ping)}ms\n` +
      `• **Database:** Neon PostgreSQL Cloud + SheetDB Failover`
    )
    .setColor(0x00F2FF)
    .setThumbnail(avatarUrl)
    .setFooter({ text: 'Real-time Telemetry', iconURL: avatarUrl })
    .setTimestamp();

  await chStatus.send({ embeds: [statusEmbed] }).catch(() => {});

  // FAQ Embed
  const faqEmbed = new EmbedBuilder()
    .setTitle('❓ Frequently Asked Questions (FAQ)')
    .setDescription(
      `**Q: How do I invite the Krims Bot to my Discord server?**\n` +
      `> **A:** Add Krims Code AI to your server using our official authorized link:\n` +
      `> 🔗 **[Invite Krims Code AI with Admin Permissions](https://discord.com/api/oauth2/authorize?client_id=1523794466740371586&permissions=8&scope=bot%20applications.commands)**\n\n` +
      `**Q: How do I claim the 'Certified Server Owner' role?**\n` +
      `A: Open a ticket in <#${chOpenTicket.id}> and mention your server name and invite link. Our staff will verify and grant your VIP perks!\n\n` +
      `**Q: What should I do if a bot command is not responding?**\n` +
      `A: The bot features an automated Self-Healing Engine. If an error occurs, it isolates the issue and auto-restarts within seconds without crashing. If problems persist, file a bug report in <#${chOpenTicket.id}>.\n\n` +
      `**Q: Can I request custom commands or Minecraft sync for my server?**\n` +
      `A: Absolutely! We specialize in custom integrations for clans, SMPs, and communities. Open an Integration ticket to discuss.`
    )
    .setColor(0x5865F2)
    .setThumbnail(avatarUrl)
    .setFooter({ text: 'Krims Code Knowledgebase', iconURL: avatarUrl });

  await chFaq.send({ embeds: [faqEmbed] }).catch(() => {});

  // 9. CREATE PERMANENT SERVER INVITE
  let inviteUrl = '';
  try {
    const invite = await chWelcome.createInvite({
      maxAge: 0, // Permanent
      maxUses: 0, // Unlimited
      reason: 'Official Krims Code Support Hub Permanent Invite'
    });
    inviteUrl = invite.url;
    console.log(`\n🎉 SERVER INVITE GENERATED: ${inviteUrl}`);
    fs.writeFileSync('krims_support_invite.txt', inviteUrl, 'utf8');
  } catch (err) {
    console.warn('⚠️ Could not generate permanent invite automatically:', err.message);
  }

  console.log('\n======================================================');
  console.log(`✅ KRIMS CODE SUPPORT & UPDATES SERVER FULLY PROVISIONED!`);
  console.log(`Guild: ${guild.name} (${guild.id})`);
  if (inviteUrl) console.log(`Invite Link: ${inviteUrl}`);
  console.log('======================================================\n');

  if (shouldDestroy) {
    await activeClient.destroy();
  }

  return { guild, inviteUrl };
}

// Run if called directly
if (process.argv[1]?.endsWith('setupKrimsSupportServer.mjs')) {
  let targetGuildId = process.argv[2] || process.env.KRIMS_SUPPORT_GUILD_ID;
  const tempClient = new Client({ intents: [GatewayIntentBits.Guilds] });
  await tempClient.login(process.env.DISCORD_TOKEN);

  if (!targetGuildId) {
    const candidate = tempClient.guilds.cache.find(g => 
      g.name.toLowerCase().includes('krims') || 
      g.name.toLowerCase().includes('support')
    );
    if (candidate) {
      targetGuildId = candidate.id;
      console.log(`[+] Auto-detected target guild: "${candidate.name}" (${candidate.id})`);
    }
  }

  if (!targetGuildId) {
    console.log('\n======================================================');
    console.log('⚠️ NO TARGET GUILD ID SPECIFIED');
    console.log('Usage: node scripts/setupKrimsSupportServer.mjs <GUILD_ID>');
    console.log('Available Guilds:');
    tempClient.guilds.cache.forEach(g => {
      console.log(` - ${g.name} (ID: ${g.id}) [Owner: ${g.ownerId}]`);
    });
    console.log('======================================================\n');
    await tempClient.destroy();
    process.exit(1);
  }

  try {
    await deployKrimsSupportServer(targetGuildId, tempClient);
    await tempClient.destroy();
    process.exit(0);
  } catch (err) {
    console.error('Fatal error deploying server:', err);
    await tempClient.destroy();
    process.exit(1);
  }
}
