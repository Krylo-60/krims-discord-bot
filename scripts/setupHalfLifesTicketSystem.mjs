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
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

await client.login(process.env.DISCORD_TOKEN);
console.log(`[+] Logged in as ${client.user.tag}`);

const GUILD_ID = '1557852594242719775'; // The_Half_Lifes
const guild = await client.guilds.fetch(GUILD_ID);
await guild.channels.fetch();
await guild.roles.fetch();
console.log(`[+] Configuring Clan Tickets & FAQ for: ${guild.name} (${guild.id})`);

const everyoneRole = guild.roles.everyone;

// Find Categories
const teamDirectoryCat = guild.channels.cache.find(c => c.name.includes('TEAM DIRECTORY') && c.type === ChannelType.GuildCategory);

// 1. Ensure Active Tickets Category
let activeTicketsCat = guild.channels.cache.find(c => c.name.includes('ACTIVE CLAN TICKETS') && c.type === ChannelType.GuildCategory);
if (!activeTicketsCat) {
  activeTicketsCat = await guild.channels.create({
    name: '📂 ACTIVE CLAN TICKETS',
    type: ChannelType.GuildCategory,
    permissionOverwrites: [
      { id: everyoneRole.id, deny: [PermissionFlagsBits.ViewChannel] }
    ]
  });
  console.log('  ✅ Created "📂 ACTIVE CLAN TICKETS" category');
}

// 2. Ensure #🎫・𝗈𝗉𝖾𝗇-𝗍𝗂𝖼𝗄𝖾𝗍 channel under TEAM DIRECTORY
let chTicket = guild.channels.cache.find(c => c.name.includes('ticket') && c.guild.id === GUILD_ID);
if (!chTicket) {
  chTicket = await guild.channels.create({
    name: '🎫・𝗈𝗉𝖾𝗇-𝗍𝗂𝖼𝗄𝖾𝗍',
    type: ChannelType.GuildText,
    parent: teamDirectoryCat ? teamDirectoryCat.id : null,
    permissionOverwrites: [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
    ]
  });
  console.log('  ✅ Created "#🎫・𝗈𝗉𝖾𝗇-𝗍𝗂𝖼𝗄𝖾𝗍" channel');
} else {
  console.log(`  ℹ️ Found existing ticket channel: #${chTicket.name}`);
}

// 3. Ensure #❓・𝖿𝖺𝗊 channel under TEAM DIRECTORY
let chFaq = guild.channels.cache.find(c => (c.name.includes('faq') || c.name.includes('clan-guide')) && c.guild.id === GUILD_ID);
if (!chFaq) {
  chFaq = await guild.channels.create({
    name: '❓・𝖼𝗅𝖺𝗇-𝖿𝖺𝗊',
    type: ChannelType.GuildText,
    parent: teamDirectoryCat ? teamDirectoryCat.id : null,
    permissionOverwrites: [
      { id: everyoneRole.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory], deny: [PermissionFlagsBits.SendMessages] }
    ]
  });
  console.log('  ✅ Created "#❓・𝖼𝗅𝖺𝗇-𝖿𝖺𝗊" channel');
} else {
  console.log(`  ℹ️ Found existing FAQ channel: #${chFaq.name}`);
}

// 4. Dispatch Clan Ticket Panel
const avatarUrl = client.user.displayAvatarURL({ extension: 'png', size: 512 });

const ticketEmbed = new EmbedBuilder()
  .setTitle('🛡️ The Half Life\'s — Clan Command & Ticket Desk')
  .setDescription(
    `Welcome to the official **Clan Support & Dispatch Center** for **The Half Life's**!\n\n` +
    `Need a private discussion with Clan Leadership, need to report an urgent base security emergency, or want to requisition war gear and supplies?\n\n` +
    `Click a button below to open an **isolated private ticket channel** with Team Leader **St1llkill3r**, Co-Leader **Krylo**, and Clan Command.\n\n` +
    `**🛡️ Available Departments:**\n` +
    `• **👑 Contact Leaders:** Direct private line to Jonesy (\`st1LLkill3r\`) and Krylo.\n` +
    `• **🚨 Emergency Base Alert:** Leaked coords, traitor suspicions, or active raids.\n` +
    `• **⚔️ Gear & Supply Requisition:** Kits, totems, potions, and mining materials.\n` +
    `• **❓ General Clan Support:** Verification issues, role questions, and squad info.`
  )
  .setColor(0x00F2FF)
  .setThumbnail(avatarUrl)
  .setFooter({ text: 'The Half Life\'s Clan Command • Powered by Krims Bot v5.3', iconURL: avatarUrl })
  .setTimestamp();

const ticketButtons = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setCustomId('halflife_ticket_leadership')
    .setLabel('Contact Leaders')
    .setEmoji('👑')
    .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
    .setCustomId('halflife_ticket_emergency')
    .setLabel('Base Compromise Alert')
    .setEmoji('🚨')
    .setStyle(ButtonStyle.Danger),
  new ButtonBuilder()
    .setCustomId('halflife_ticket_gear')
    .setLabel('Gear Requisition')
    .setEmoji('⚔️')
    .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
    .setCustomId('halflife_ticket_general')
    .setLabel('General Clan Help')
    .setEmoji('❓')
    .setStyle(ButtonStyle.Secondary)
);

// Clear old messages in ticket channel and post fresh
try {
  const existingMsgs = await chTicket.messages.fetch({ limit: 10 });
  for (const [id, msg] of existingMsgs) {
    if (msg.author.id === client.user.id) await msg.delete().catch(() => {});
  }
} catch (err) {}

await chTicket.send({ embeds: [ticketEmbed], components: [ticketButtons] });
console.log('  ✅ Dispatched Clan Ticket Panel to #' + chTicket.name);

// 5. Dispatch Clan FAQ Embed
const faqEmbed = new EmbedBuilder()
  .setTitle('❓ The Half Life\'s — Official Clan Handbook & FAQ')
  .setDescription(
    `Everything you need to know about dominating on **Ledgy\'s Elite SMP** with **The Half Life\'s**:\n\n` +
    `**🌐 1. Server Connection Info**\n` +
    `• **Java Edition IP:** \`EliteSmp.gg\`\n` +
    `• **Bedrock Edition IP:** \`Mc.eliteSmp.gg\` | Port: \`19132\`\n` +
    `• **Ledgy\'s Elite SMP Discord:** https://discord.gg/XBgjQxbWpb\n\n` +
    `**📋 2. How to Get Verified on Discord**\n` +
    `Head over to <#1557858900806738050> and state your in-game Minecraft username (IGN). Our automated system will generate your **Phase 2 Verified Cyber Card** with 3D skin head rendering and grant you verified clan status!\n\n` +
    `**🔒 3. Base Security & Anti-Leak Protocol**\n` +
    `• Never disclose base coordinates outside <#1557855864549806150>.\n` +
    `• Never bring untrusted non-clan players within render distance of clan bases or outposts.\n` +
    `• If you suspect a traitor or notice unusual players near our perimeter, click **🚨 Base Compromise Alert** in <#${chTicket.id}> immediately!\n\n` +
    `**⚔️ 4. Clan Ranks & Progression**\n` +
    `• **🗡️ Clan Recruit:** Newly verified squad members.\n` +
    `• **⛏️ Builder & Grinder:** Active contributors who farm resources and construct base projects.\n` +
    `• **🏹 Clan Veteran:** Battle-tested warriors with trusted base access.\n` +
    `• **🛡️ Clan Vanguard:** Elite frontline fighters leading raids.\n` +
    `• **⚔️ Co-Leader / 👑 Team Leader:** High Command (\`Krylo\` & \`st1LLkill3r\`).\n\n` +
    `**🎫 5. Need Personal Assistance?**\n` +
    `Head to <#${chTicket.id}> to open a ticket directly with leadership!`
  )
  .setColor(0xFFD700)
  .setThumbnail(avatarUrl)
  .setFooter({ text: 'The Half Life\'s • Victory Through Unity', iconURL: avatarUrl })
  .setTimestamp();

try {
  const existingFaqMsgs = await chFaq.messages.fetch({ limit: 10 });
  for (const [id, msg] of existingFaqMsgs) {
    if (msg.author.id === client.user.id) await msg.delete().catch(() => {});
  }
} catch (err) {}

await chFaq.send({ embeds: [faqEmbed] });
console.log('  ✅ Dispatched Clan FAQ to #' + chFaq.name);

console.log('\n[+] Completed Half Life\'s Ticket System & Clan Guide Setup!');
await client.destroy();
process.exit(0);
