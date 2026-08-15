import { 
  Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, 
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle 
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

async function configureBetaGuild(guild) {
  console.log(`\n========================================`);
  console.log(`👑 Building Complete Architecture for: ${guild.name} (${guild.id})`);
  console.log(`========================================`);

  // 1. Create Roles
  console.log('[+] Creating Beta Roles Hierarchy...');
  const rolesToCreate = [
    { name: '👑 Founder & Owner', color: 0xFFD700, hoist: true },
    { name: '🛡️ Beta Moderator', color: 0x3498DB, hoist: true },
    { name: '⚔️ Pioneer (Beta Veteran)', color: 0x00E5FF, hoist: true },
    { name: '🧪 Beta Tester', color: 0x00FFCC, hoist: true },
    { name: '✅ Whitelisted', color: 0x00FF88, hoist: false },
    { name: '☕ Java Player', color: 0xC2185B, hoist: false },
    { name: '🪨 Bedrock Player', color: 0x8D6E63, hoist: false }
  ];

  for (const r of rolesToCreate) {
    const exists = guild.roles.cache.find(role => role.name.toLowerCase() === r.name.toLowerCase());
    if (!exists) {
      await guild.roles.create(r).catch(() => null);
      console.log(`   [+] Created Role: ${r.name}`);
    }
  }

  // 2. Categories & Channels Structure
  const structure = [
    {
      category: '📢 BETA INFORMATION',
      channels: [
        { name: '📢┃beta-announcements', topic: 'Official KryloSMP Beta testing announcements and update notes.' },
        { name: '📌┃beta-rules', topic: 'Rules and guidelines for all Beta Testers.' },
        { name: 'ℹ️┃beta-server-info', topic: 'Connection IP: KryloSmp.play.hosting | Port: 25565 (Java) / 19132 (Bedrock)' }
      ]
    },
    {
      category: '💬 TESTER COMMUNITY',
      channels: [
        { name: '💬┃tester-chat', topic: 'Chat with fellow Beta Testers and developers!' },
        { name: '📷┃screenshots-clips', topic: 'Share spawn builds, testing clips, and game moments.' },
        { name: '💡┃feature-feedback', topic: 'Suggest new mechanics, balance changes, and crate ideas.' }
      ]
    },
    {
      category: '🐛 TESTING & AUDIT DESK',
      channels: [
        { name: '🐛┃bug-reports', topic: 'Report bugs and glitches found during testing.' },
        { name: '🧪┃pioneer-whitelist', topic: 'Submit your Minecraft IGN to get whitelisted on the Beta Server!' },
        { name: '🎫┃tester-support', topic: 'Private support tickets for beta inquiries.' }
      ]
    },
    {
      category: '🔊 VOICE TESTING',
      channels: [
        { name: '🔊┃Beta Voice Lounge', type: ChannelType.GuildVoice },
        { name: '🔊┃Proximity VC Testing', type: ChannelType.GuildVoice }
      ]
    }
  ];

  for (const group of structure) {
    let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === group.category.toLowerCase());
    if (!cat) {
      cat = await guild.channels.create({
        name: group.category,
        type: ChannelType.GuildCategory
      }).catch(() => null);
      console.log(`[+] Created Category: ${group.category}`);
    }

    if (cat) {
      for (const ch of group.channels) {
        const chType = ch.type || ChannelType.GuildText;
        const exists = guild.channels.cache.find(c => c.name === ch.name && c.parentId === cat.id);
        if (!exists) {
          await guild.channels.create({
            name: ch.name,
            type: chType,
            parent: cat.id,
            topic: ch.topic || ''
          }).catch(() => null);
          console.log(`   [+] Created Channel: #${ch.name}`);
        }
      }
    }
  }

  // 3. Post Info & Whitelist Embeds
  const infoCh = guild.channels.cache.find(c => c.name.includes('beta-server-info'));
  if (infoCh && infoCh.type === ChannelType.GuildText) {
    const infoEmbed = new EmbedBuilder()
      .setColor(0x00E5FF)
      .setTitle('🌐 KRYLOSMP BETA TEST NETWORK — CONNECTION HUB')
      .setDescription(
        `Welcome to the official **KryloSMP Beta Testing Ground**!\n\n` +
        `This server is dedicated to testing upcoming features, custom spawns, voice chat, and economy balance before the official public launch.\n\n` +
        `☕ **Java Edition Connection:**\n` +
        `• **Server IP:** \`KryloSmp.play.hosting\`\n` +
        `• **Port:** \`25565\` (Default)\n` +
        `• **Version:** 1.21.x (Paper)\n\n` +
        `🪨 **Bedrock Edition (Mobile / Console):**\n` +
        `• **Server IP:** \`KryloSmp.play.hosting\`\n` +
        `• **Port:** \`19132\` (Geyser Crossplay)\n\n` +
        `🎙️ **Proximity Voice Chat:**\n` +
        `• **Mod:** Simple Voice Chat (Press \`V\` in-game to configure)\n\n` +
        `🔒 **Whitelist Status:** **PRIVATE BETA** (Submit IGN in <#${guild.channels.cache.find(c => c.name.includes('whitelist'))?.id || 'pioneer-whitelist'}>)`
      )
      .setImage('https://krylosmp.web.app/banner.jpg')
      .setFooter({ text: 'KryloSMP Beta Testing Protocol • Season 1 Staging' });

    await infoCh.send({ embeds: [infoEmbed] }).catch(() => {});
  }

  console.log(`🎉 BETA SERVER ARCHITECTURE FULLY CONFIGURED FOR: ${guild.name}!`);
}

client.once('ready', async () => {
  console.log(`[+] Bot connected as: ${client.user.tag}`);
  console.log(`[+] Scanning for 'KryloSMP Beta Release' guild...`);

  const betaGuild = client.guilds.cache.find(g => 
    g.name.toLowerCase().includes('beta') || 
    g.name.toLowerCase().includes('krylosmp beta')
  );

  if (betaGuild) {
    await configureBetaGuild(betaGuild);
  } else {
    console.log(`[!] Beta guild not joined yet.`);
    console.log(`👉 Please create the server and invite the bot using this link:`);
    console.log(`https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot%20applications.commands`);
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
