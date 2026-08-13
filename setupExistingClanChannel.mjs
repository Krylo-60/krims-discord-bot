import fs from 'fs';
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
  console.log('[+] Setup Script Online as ' + client.user.tag);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[-] No guild found.');
      process.exit(1);
    }

    console.log(`[+] Found Guild: ${guild.name} (${guild.id})`);

    const clansFile = 'clans.json';
    if (!fs.existsSync(clansFile)) {
      console.error('[-] clans.json not found.');
      process.exit(1);
    }

    const clanData = JSON.parse(fs.readFileSync(clansFile, 'utf8'));
    const leaderId = "1414143825538191373"; // @Krylo

    const userClanKey = Object.keys(clanData).find(k => clanData[k].leaderId === leaderId);
    if (!userClanKey) {
      console.error('[-] Clan for leader not found.');
      process.exit(1);
    }

    const clan = clanData[userClanKey];
    console.log(`[+] Setting up private role & channel for Clan: [${clan.tag}] ${clan.name}...`);

    // 1. Create or Find Clan Role
    let clanRole = guild.roles.cache.find(r => r.name.includes(clan.tag) || r.name.includes(clan.name));
    if (!clanRole) {
      clanRole = await guild.roles.create({
        name: `[${clan.tag}] ${clan.name}`,
        color: '#00F2FF',
        mentionable: true,
        reason: `Auto Setup for Krylo Clan`
      });
      console.log(`✅ Created Clan Role: ${clanRole.name} (${clanRole.id})`);
    } else {
      console.log(`ℹ️ Existing Clan Role Found: ${clanRole.name} (${clanRole.id})`);
    }

    // Assign Role to Leader
    try {
      const leaderMember = await guild.members.fetch(leaderId);
      if (leaderMember && clanRole) {
        await leaderMember.roles.add(clanRole);
        console.log(`✅ Assigned Clan Role to Leader <@${leaderId}>`);
      }
    } catch (e) {
      console.warn('[-] Could not fetch leader member:', e.message);
    }

    // 2. Find or Create Category '🏰 CLANS'
    let clanCat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.includes('CLANS'));
    if (!clanCat) {
      clanCat = await guild.channels.create({
        name: '🏰 CLANS',
        type: ChannelType.GuildCategory
      });
      console.log(`✅ Created Category: 🏰 CLANS (${clanCat.id})`);
    }

    // 3. Create or Find Private Text Channel
    let clanChannel = guild.channels.cache.find(c => c.name.includes('ksmp-clan-chat') || c.name.includes('krylo-clan'));
    if (!clanChannel) {
      clanChannel = await guild.channels.create({
        name: `🏰-ksmp-clan-chat`,
        type: ChannelType.GuildText,
        parent: clanCat.id,
        permissionOverwrites: [
          {
            id: guild.id, // @everyone
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: clanRole.id, // Clan Role
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks]
          }
        ]
      });
      console.log(`✅ Created Private Clan Channel: ${clanChannel.name} (${clanChannel.id})`);
    }

    // Save IDs in clans.json
    clan.roleId = clanRole.id;
    clan.channelId = clanChannel.id;
    fs.writeFileSync(clansFile, JSON.stringify(clanData, null, 2), 'utf8');

    console.log(`\n🏆 CLAN SETUP COMPLETE FOR [${clan.tag}] ${clan.name}!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Setup Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
