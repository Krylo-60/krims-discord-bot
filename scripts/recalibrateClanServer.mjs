import 'dotenv/config';
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
  intents: [GatewayIntentBits.Guilds]
});

await client.login(process.env.DISCORD_TOKEN);

const guildId = '1557852594242719775'; // The_Half_Guys
const guild = await client.guilds.fetch(guildId);
console.log(`Recalibrating Clan/Team Server: ${guild.name} (${guild.id})`);

// 1. UPDATE ROLE NAMES TO TEAM/CLAN SPECIFIC
const roles = await guild.roles.fetch();
const roleRenames = {
  '👑 SMP Commander': '👑 Team Leader',
  '⚔️ Vice Captain': '⚔️ Co-Leader',
  '🛡️ Elite Vanguard': '🛡️ Clan Vanguard',
  '🏹 SMP Veteran': '🏹 Clan Veteran',
  '⛏️ Master Crafter': '⛏️ Builder & Grinder',
  '🗡️ Recruit': '🗡️ Clan Recruit'
};

for (const [oldName, newName] of Object.entries(roleRenames)) {
  const r = roles.find(role => role.name === oldName);
  if (r) {
    await r.setName(newName);
    console.log(`Renamed role "${oldName}" -> "${newName}"`);
  }
}

// 2. CHECK / ADD CLAN DIRECTORY CHANNELS
const channels = await guild.channels.fetch();
const catDirectory = channels.find(c => c && c.type === ChannelType.GuildCategory && c.name.includes('TEAM DIRECTORY'));

let chRoster = channels.find(c => c && c.name.includes('roster'));
if (!chRoster && catDirectory) {
  chRoster = await guild.channels.create({
    name: '📋・𝖱oster',
    type: ChannelType.GuildText,
    parent: catDirectory.id
  });
  console.log('Created #📋・𝖱oster channel');
}

let chSmpInfo = channels.find(c => c && c.name.includes('smp-info'));
if (!chSmpInfo && catDirectory) {
  chSmpInfo = await guild.channels.create({
    name: '🌐・𝖲mp-info',
    type: ChannelType.GuildText,
    parent: catDirectory.id
  });
  console.log('Created #🌐・𝖲mp-info channel');
}

// 3. REFRESH EMBEDS IN #rules AND #announcements
const chRules = channels.find(c => c && c.name.includes('rules'));
const chAnnouncements = channels.find(c => c && c.name.includes('announcements'));
const chCoords = channels.find(c => c && c.name.includes('base-coordinates'));
const chWarRoom = channels.find(c => c && c.name.includes('war-room'));
const chVault = channels.find(c => c && c.name.includes('loot-vault'));

if (chRules) {
  // Purge previous messages in rules
  const msgs = await chRules.messages.fetch({ limit: 10 });
  for (const [id, m] of msgs) {
    await m.delete().catch(() => {});
  }

  const clanRulesEmbed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('⚔️ THE HALF GUYS • TEAM CHARTER & PROTOCOL')
    .setDescription(
      `Welcome to the official Clan Headquarters of **The Half Guys**!\n` +
      `We are a dedicated team competing together on the SMP. This server is our private tactical base for coordinating raids, sharing loot, and defending our territory.\n\n` +
      `🛡️ **1. Base Security & Zero Leaks**\n` +
      `• Never reveal our base coordinates, Nether portal hub, or secret bunkers in global SMP chat.\n` +
      `• All sensitive coordinates must stay strictly inside <#${chCoords?.id}>.\n\n` +
      `💎 **2. Communal Armory & Vault Etiquette**\n` +
      `• Our team loot is stored for everyone in the clan vault. Deposit spare Netherite, Totems, and Mending books in <#${chVault?.id}>.\n` +
      `• Never steal from clan chests or leave chests unlocked.\n\n` +
      `⚔️ **3. PvP & Combat Backup**\n` +
      `• When a teammate is engaged in PvP on the SMP, call it out in voice comms and provide backup.\n` +
      `• Coordinate major raids, faction wars, and hit lists in <#${chWarRoom?.id}>.\n\n` +
      `📜 **4. SMP Server Compliance**\n` +
      `• Follow the host SMP server's rules so our team stays clean and doesn't get penalized or disqualified.\n`
    )
    .addFields(
      { name: '👑 Leadership Structure', value: 'Follow tactical calls from **Team Leaders** and **Co-Leaders** during active wars and raids.', inline: false },
      { name: '📋 Team Roster', value: `Register your Minecraft in-game username (IGN) in <#${chRoster?.id}> so the team recognizes you on the SMP!`, inline: false }
    )
    .setFooter({ text: `${guild.name} • Official SMP Clan Hub` })
    .setTimestamp();

  await chRules.send({ embeds: [clanRulesEmbed] });
  console.log('✅ Updated rules embed for The Half Guys clan!');
}

if (chAnnouncements) {
  const msgs = await chAnnouncements.messages.fetch({ limit: 10 });
  for (const [id, m] of msgs) {
    await m.delete().catch(() => {});
  }

  const clanWelcomeEmbed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle('🛡️ THE HALF GUYS • CLAN HEADQUARTERS')
    .setDescription(
      `Welcome to the private operations bunker for **The Half Guys** on the SMP!\n\n` +
      `📌 **Clan Quick Links:**\n` +
      `• **Team Rules:** <#${chRules?.id}>\n` +
      `• **Member Roster:** <#${chRoster?.id}> *(Drop your Minecraft IGN here!)*\n` +
      `• **SMP Server Info:** <#${chSmpInfo?.id}> *(Server IP & rules)*\n` +
      `• **Secret Base Coords:** <#${chCoords?.id}> *(Team only)*\n` +
      `• **War & Raid Planning:** <#${chWarRoom?.id}>\n\n` +
      `🔥 *Let's dominate the SMP and protect the base!*`
    )
    .setFooter({ text: `${guild.name} • Private Team Discord` })
    .setTimestamp();

  await chAnnouncements.send({ embeds: [clanWelcomeEmbed] });
  console.log('✅ Updated announcement embed for The Half Guys clan!');
}

if (chSmpInfo) {
  const smpInfoEmbed = new EmbedBuilder()
    .setColor(0x2ECC71)
    .setTitle('🌐 SMP SERVER CONNECTION & DETAILS')
    .setDescription(
      `Here is the connection info for the SMP our clan plays on:\n\n` +
      `🖥️ **Server IP:** *(Edit or pin the SMP IP here)*\n` +
      `🌍 **Version:** 1.21+\n` +
      `⚔️ **PvP Status:** Enabled\n` +
      `🛡️ **Clan Status:** Official Team • The Half Guys\n\n` +
      `*Make sure you are whitelisted/verified on the SMP before joining!*`
    )
    .setFooter({ text: 'The Half Guys • SMP Info' });

  await chSmpInfo.send({ embeds: [smpInfoEmbed] });
}

if (chRoster) {
  const rosterEmbed = new EmbedBuilder()
    .setColor(0x9B59B6)
    .setTitle('📋 THE HALF GUYS • OFFICIAL ROSTER')
    .setDescription(
      `Drop your **Minecraft In-Game Name (IGN)** and timezone below so the team can whitelist you and add you to the clan base!\n\n` +
      `**Template:**\n` +
      `• **Minecraft IGN:** \`YourIGN\`\n` +
      `• **Role / Specialization:** *(PvP / Builder / Miner / Redstone)*\n` +
      `• **Timezone:** *(EST / GMT / etc.)*`
    )
    .setFooter({ text: 'The Half Guys • Team Roster' });

  await chRoster.send({ embeds: [rosterEmbed] });
}

console.log('🏆 Recalibration complete! Perfectly tailored for a Team inside the SMP!');
process.exit(0);
