import { 
  Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder 
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUILD_ID = '1538225337048236082';

client.once('ready', async () => {
  console.log(`[+] Bot connected: ${client.user.tag}`);
  const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) {
    console.error('Guild not found');
    process.exit(1);
  }

  console.log(`\n👑 Creating Secure Staff & Admin Logging Channels in: ${guild.name}`);

  const roles = await guild.roles.fetch();
  const everyoneRole = guild.roles.everyone;

  const ownerRole = roles.find(r => r.name.includes('Owner'));
  const directorRole = roles.find(r => r.name.includes('Director'));
  const srAdminRole = roles.find(r => r.name.includes('Senior Admin'));
  const adminRole = roles.find(r => r.name.includes('Admin') && !r.name.includes('Senior') && !r.name.includes('Junior') && !r.name.includes('training'));
  const jrAdminRole = roles.find(r => r.name.includes('Junior Admin'));
  const adminTrainRole = roles.find(r => r.name.includes('Admin in training'));

  const srModRole = roles.find(r => r.name.includes('Senior Mod'));
  const modRole = roles.find(r => r.name.includes('Mod') && !r.name.includes('Senior') && !r.name.includes('Junior') && !r.name.includes('training'));
  const jrModRole = roles.find(r => r.name.includes('Junior Mod'));
  const modTrainRole = roles.find(r => r.name.includes('Mod in training'));
  const botRole = roles.find(r => r.name.includes('Bots'));

  const allStaff = [ownerRole, directorRole, srAdminRole, adminRole, jrAdminRole, adminTrainRole, srModRole, modRole, jrModRole, modTrainRole, botRole].filter(Boolean);
  const adminOnlyStaff = [ownerRole, directorRole, srAdminRole, adminRole, jrAdminRole, adminTrainRole, botRole].filter(Boolean);

  // 1. Create Category
  console.log('[+] Creating Locked Category: 🛡️ STAFF & AUDIT LOGS...');
  const cat = await guild.channels.create({
    name: '🛡️ STAFF & AUDIT LOGS',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      {
        id: everyoneRole.id,
        deny: [PermissionFlagsBits.ViewChannel]
      }
    ]
  });

  // 2. Create #mod-logs
  console.log('[+] Creating #🛡️┃mod-logs...');
  const modOverwrites = [
    { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] }
  ];
  allStaff.forEach(r => {
    modOverwrites.push({
      id: r.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks
      ]
    });
  });

  const modLogsCh = await guild.channels.create({
    name: '🛡️┃mod-logs',
    type: ChannelType.GuildText,
    parent: cat.id,
    topic: '🛡️ Staff moderation action logs, timeouts, kicks, bans, and anonymous suggestion audits.',
    permissionOverwrites: modOverwrites
  });

  const modEmbed = new EmbedBuilder()
    .setColor(0x3498DB)
    .setTitle('🛡️ MODERATION AUDIT LOG CHANNEL INITIALIZED')
    .setDescription(
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔒 **Access Level:** Moderation Team & Higher (Mods, Admins, Directors, Owner)\n\n` +
      `📋 **Logged Actions:**\n` +
      `• Member Warnings, Timeouts, Kicks & Bans\n` +
      `• Message Deletions & Purge Audits\n` +
      `• Anonymous Suggestion Real-Author Identity Logs\n` +
      `• AutoMod Trigger Alerts & Anti-Spam Detections\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .setFooter({ text: 'KryloSMP Security Protocol • Staff Eyes Only' })
    .setTimestamp();

  await modLogsCh.send({ embeds: [modEmbed] });

  // 3. Create #admin-logs
  console.log('[+] Creating #⚡┃admin-logs...');
  const adminOverwrites = [
    { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] }
  ];
  // Explicitly deny mod roles from viewing admin-logs
  [srModRole, modRole, jrModRole, modTrainRole].filter(Boolean).forEach(r => {
    adminOverwrites.push({ id: r.id, deny: [PermissionFlagsBits.ViewChannel] });
  });
  // Allow admin and executive roles
  adminOnlyStaff.forEach(r => {
    adminOverwrites.push({
      id: r.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks
      ]
    });
  });

  const adminLogsCh = await guild.channels.create({
    name: '⚡┃admin-logs',
    type: ChannelType.GuildText,
    parent: cat.id,
    topic: '⚡ Executive administration logs, role changes, server config audits, and staff management.',
    permissionOverwrites: adminOverwrites
  });

  const adminEmbed = new EmbedBuilder()
    .setColor(0xFF4500)
    .setTitle('⚡ EXECUTIVE ADMIN LOG CHANNEL INITIALIZED')
    .setDescription(
      `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🔒 **Access Level:** Administration Team Only (Admins, Directors, Owner)\n\n` +
      `📋 **Logged Actions:**\n` +
      `• Staff Role Grants & Promotions\n` +
      `• Channel & Category Permission Changes\n` +
      `• Bot Configuration & Economy Balance Adjustments\n` +
      `• Server Blacklist & Executive Override Actions\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .setFooter({ text: 'KryloSMP Executive Administration • Classified' })
    .setTimestamp();

  await adminLogsCh.send({ embeds: [adminEmbed] });

  console.log(`\n🎉 BOTH SECURE LOGGING CHANNELS CREATED & LOCKED SUCCESSFULLY!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
