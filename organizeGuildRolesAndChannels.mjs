import { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits } from 'discord.js';
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
  console.log('[+] Guild Organizer Script Online as ' + client.user.tag);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[-] No guild found.');
      process.exit(1);
    }

    console.log(`\n👑 ORGANIZING GUILD: ${guild.name} (${guild.id})...\n`);

    // ══════════════════════════════════════════════════════════
    // 1. REORGANIZE & CREATE ROLES WITH EXACT COLOR & PERMISSIONS
    // ══════════════════════════════════════════════════════════
    const rolesConfig = [
      { name: '👑 OWNER', color: '#8B0000', hoist: true, mentionable: true, position: 10 },
      { name: '⚙️ ADMIN', color: '#FF0000', hoist: true, mentionable: true, position: 9 },
      { name: '🛡️ MODERATOR', color: '#9900FF', hoist: true, mentionable: true, position: 8 },
      { name: '🎥 CONTENT CREATOR', color: '#FF00FF', hoist: true, mentionable: false, position: 7 },
      { name: '💎 KRYLO GOD', color: '#FFD700', hoist: true, mentionable: false, position: 6 },
      { name: '⚡ VIP+', color: '#00F2FF', hoist: true, mentionable: false, position: 5 },
      { name: '🏰 CLAN LEADER', color: '#00FF88', hoist: true, mentionable: true, position: 4 },
      { name: '⚔️ CLAN MEMBER', color: '#0088FF', hoist: false, mentionable: false, position: 3 },
      { name: '🏆 TOURNAMENT CHAMPION', color: '#FFFF00', hoist: true, mentionable: false, position: 2 },
      { name: '✅ VERIFIED', color: '#00FF55', hoist: false, mentionable: false, position: 1 }
    ];

    for (const rCfg of rolesConfig) {
      let role = guild.roles.cache.find(r => r.name === rCfg.name || r.name.includes(rCfg.name.split(' ')[1]));
      if (!role) {
        role = await guild.roles.create({
          name: rCfg.name,
          color: rCfg.color,
          hoist: rCfg.hoist,
          mentionable: rCfg.mentionable,
          reason: 'KryloSMP Role Hierarchy Setup'
        });
        console.log(`  ✅ Created Role: ${role.name}`);
      } else {
        await role.edit({
          name: rCfg.name,
          color: rCfg.color,
          hoist: rCfg.hoist,
          mentionable: rCfg.mentionable
        });
        console.log(`  🔄 Updated Role: ${role.name}`);
      }
    }

    // Assign OWNER role to Krylo (1414143825538191373)
    try {
      const ownerRole = guild.roles.cache.find(r => r.name.includes('OWNER'));
      const ownerMember = await guild.members.fetch('1414143825538191373');
      if (ownerRole && ownerMember) {
        await ownerMember.roles.add(ownerRole);
        console.log(`  👑 Assigned OWNER role to @Krylo!`);
      }
    } catch (e) {}

    // ══════════════════════════════════════════════════════════
    // 2. REORGANIZE CATEGORIES & CHANNELS
    // ══════════════════════════════════════════════════════════
    const categoryStructure = [
      {
        name: '📌 INFORMATION',
        position: 1,
        channels: [
          { name: '📌-rules', type: ChannelType.GuildText, readonly: true },
          { name: '📢-server-announcements', type: ChannelType.GuildText, readonly: true },
          { name: '📺-youtube-announcements', type: ChannelType.GuildText, readonly: true },
          { name: 'ℹ️-server-info', type: ChannelType.GuildText, readonly: true },
          { name: '🌐-socials', type: ChannelType.GuildText, readonly: true },
          { name: '✅-verify', type: ChannelType.GuildText, readonly: true }
        ]
      },
      {
        name: '💬 COMMUNITY ZONE',
        position: 2,
        channels: [
          { name: '💬-general-chat', type: ChannelType.GuildText },
          { name: '🎵-music-chat', type: ChannelType.GuildText },
          { name: '🤖-bot-commands', type: ChannelType.GuildText },
          { name: '📷-media-showcase', type: ChannelType.GuildText },
          { name: '💡-suggestions', type: ChannelType.GuildText }
        ]
      },
      {
        name: '🛒 STORE & ECONOMY',
        position: 3,
        channels: [
          { name: '🛒-store-info', type: ChannelType.GuildText, readonly: true },
          { name: '💰-jackpot-vault', type: ChannelType.GuildText },
          { name: '🎯-bounties-board', type: ChannelType.GuildText }
        ]
      },
      {
        name: '🏰 CLANS & FACTIONS',
        position: 4,
        channels: [
          { name: '🏆-clan-leaderboard', type: ChannelType.GuildText }
        ]
      },
      {
        name: '⚔️ PVP & TOURNAMENTS',
        position: 5,
        channels: [
          { name: '⚔️-pvp-arena-chat', type: ChannelType.GuildText },
          { name: '🏆-monthly-tournament', type: ChannelType.GuildText }
        ]
      },
      {
        name: '🎟️ SUPPORT TICKETS',
        position: 6,
        channels: [
          { name: '🎟️-open-ticket', type: ChannelType.GuildText }
        ]
      },
      {
        name: '🔊 VOICE LOUNGES',
        position: 7,
        channels: [
          { name: '🔊 General Lounge', type: ChannelType.GuildVoice },
          { name: '🔊 Gaming Squad 1', type: ChannelType.GuildVoice },
          { name: '🔊 Gaming Squad 2', type: ChannelType.GuildVoice },
          { name: '💤 AFK Zone', type: ChannelType.GuildVoice }
        ]
      }
    ];

    for (const catConfig of categoryStructure) {
      let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.includes(catConfig.name.split(' ')[1] || catConfig.name));
      if (!cat) {
        cat = await guild.channels.create({
          name: catConfig.name,
          type: ChannelType.GuildCategory,
          position: catConfig.position
        });
        console.log(`  📁 Created Category: ${cat.name}`);
      } else {
        await cat.edit({ name: catConfig.name, position: catConfig.position });
        console.log(`  🔄 Updated Category: ${cat.name}`);
      }

      for (const chCfg of catConfig.channels) {
        let ch = guild.channels.cache.find(c => c.name.includes(chCfg.name.replace(/[^a-z0-9-]/g, '')) || c.name === chCfg.name);
        if (!ch) {
          ch = await guild.channels.create({
            name: chCfg.name,
            type: chCfg.type,
            parent: cat.id
          });
          console.log(`    ✅ Created Channel: ${ch.name}`);
        } else {
          await ch.edit({ name: chCfg.name, parent: cat.id });
          console.log(`    🔄 Organized Channel: ${ch.name}`);
        }
      }
    }

    console.log(`\n🏆 ALL ROLES & CHANNELS ORGANIZED SUCCESSFULLY!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Organization Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
