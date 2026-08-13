import { Client, GatewayIntentBits, ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
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
  console.log(`Logged in as ${client.user.tag} - Starting Master Server Polish...`);

  const guildIds = [
    '1524878881918685405', // KryloSMP
    '1420991845546332162', // Krylo's Discord server
    '1532574925356007525'  // Krylo Fan Army 👑
  ];

  for (const guildId of guildIds) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) continue;

    console.log(`\n======================================================`);
    console.log(`🌟 Polishing Guild: ${guild.name} (${guild.id})`);
    console.log(`======================================================`);

    const channels = await guild.channels.fetch();
    const roles = await guild.roles.fetch();
    const verifiedRole = roles.find(r => r.name === 'Verified' || r.name === '🎮 Player');

    // 1. Check for and clean up accidental duplicate channels
    const nameMap = new Map();
    for (const [, ch] of channels) {
      if (!ch) continue;
      const normalizedName = ch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (nameMap.has(normalizedName) && ch.type === ChannelType.GuildText) {
        const existing = nameMap.get(normalizedName);
        console.log(`⚠️ Possible duplicate detected: "${ch.name}" (${ch.id}) vs "${existing.name}" (${existing.id})`);
        
        // If one is unformatted (e.g. "New-Updates" vs "📢┃new-updates"), delete the unformatted empty one
        if (!ch.name.includes('┃') && existing.name.includes('┃')) {
          const msgs = await ch.messages.fetch({ limit: 5 }).catch(() => new Map());
          if (msgs.size <= 2) {
            console.log(`   🗑️ Deleting redundant plain channel: #${ch.name}`);
            await ch.delete('Cleaning redundant channel').catch(() => {});
          }
        }
      } else {
        nameMap.set(normalizedName, ch);
      }
    }

    // 2. Ensure verified-only channel permissions for private/active areas
    const publicChannelNames = [
      'welcome', 'rules', 'verify', 'server-info', 'socials', 'server-announcements', 'youtube-announcements', 'new-updates', 'faq-how-to-play'
    ];

    const staffChannelNames = [
      'mod-logs', 'moderator-only', 'staff-only'
    ];

    for (const [, ch] of channels) {
      if (!ch || ch.type === ChannelType.GuildCategory) continue;
      
      const isPublic = publicChannelNames.some(p => ch.name.toLowerCase().includes(p));
      const isStaff = staffChannelNames.some(s => ch.name.toLowerCase().includes(s));

      if (isStaff) {
        // Staff channel: hide from @everyone and Verified
        await ch.permissionOverwrites.edit(guild.roles.everyone, {
          ViewChannel: false
        }).catch(() => {});
        console.log(`   🔒 Secured staff channel: #${ch.name}`);
      } else if (!isPublic && verifiedRole) {
        // Community channel: require Verified role to talk/view properly
        await ch.permissionOverwrites.edit(guild.roles.everyone, {
          SendMessages: false
        }).catch(() => {});
      }
    }

    console.log(`✅ Permissions secured and optimized for ${guild.name}!`);
  }

  console.log(`\n🎉 MASTER SERVER POLISH COMPLETE!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
