import 'dotenv/config';
import fs from 'fs';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} from 'discord.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages
  ]
});

await client.login(process.env.DISCORD_TOKEN);
console.log(`[+] Logged in as ${client.user.tag}`);

// Read invite URL from argument or saved file
let inviteUrl = process.argv[2];
if (!inviteUrl && fs.existsSync('krims_support_invite.txt')) {
  inviteUrl = fs.readFileSync('krims_support_invite.txt', 'utf8').trim();
}

if (!inviteUrl) {
  console.log('\n======================================================');
  console.log('⚠️ NO INVITE URL SPECIFIED');
  console.log('Usage: node scripts/notifyAllOwnersOfSupportServer.mjs <INVITE_URL>');
  console.log('Once the Krims Support server is live, pass its invite link here.');
  console.log('======================================================\n');
  process.exit(1);
}

console.log(`\n📬 DISPATCHING VIP OWNER INVITATIONS TO ALL SERVER OWNERS`);
console.log(`Invite URL: ${inviteUrl}\n`);

// Collect unique owners from all guilds
const ownerIds = new Set();

// Add known server owners & partners
ownerIds.add('1421289200011186176'); // Kevin (KevinMC / TorchWick Games)
ownerIds.add('1533703991882416373'); // st1LLkill3r (Jonesy - The_Half_Lifes Clan Leader)
ownerIds.add('1414143825538191373'); // Krylo (Executive Owner)

// Fetch all owners of guilds the bot is currently in
for (const [id, guild] of client.guilds.cache) {
  try {
    const fetchedGuild = await guild.fetch();
    if (fetchedGuild.ownerId) {
      ownerIds.add(fetchedGuild.ownerId);
    }
  } catch (err) {
    console.warn(`Could not fetch details for guild ${guild.name}:`, err.message);
  }
}

console.log(`[+] Found ${ownerIds.size} unique owners to invite:`, Array.from(ownerIds));

const avatarUrl = client.user.displayAvatarURL({ extension: 'png', size: 512 });

const inviteEmbed = new EmbedBuilder()
  .setTitle('👑 VIP Invitation: Krims Code Support & Updates Headquarters')
  .setDescription(
    `Greetings Server Owner!\n\n` +
    `As a recognized server owner and leader powered by the **Krims Discord Bot Ecosystem (v5.3 Enterprise)**, you are cordially invited to join our brand-new official central hub: **Krims Code Support & Updates**!\n\n` +
    `**🌟 Your VIP Owner Perks & Benefits:**\n` +
    `• **🌟 Certified Server Owner:** Exclusive VIP badge & role recognizing your server.\n` +
    `• **⚡ Priority 1-on-1 Engineering Support:** Direct access to lead bot developers for setup assistance, custom commands, and feature requests.\n` +
    `• **🚀 Early Beta Access & Roadmap Updates:** First access to our next major engine drops (arriving within **1 day to 1 week**!).\n` +
    `• **🌐 24/7 Outage & Health Telemetry:** Live bot uptime status and self-healing diagnostic logs.\n` +
    `• **🤝 Server Owner Lounge:** Connect and collaborate with top community owners and SMP leaders.\n\n` +
    `Click the link below to enter your VIP headquarters:`
  )
  .setColor(0x00F2FF)
  .setThumbnail(avatarUrl)
  .setFooter({ text: 'Krims Code Ecosystem • Dedicated Server Owner Network', iconURL: avatarUrl })
  .setTimestamp();

const buttonRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
    .setLabel('Join Krims Support Server')
    .setURL(inviteUrl)
    .setStyle(ButtonStyle.Link)
    .setEmoji('👑')
);

let sentCount = 0;
for (const ownerId of ownerIds) {
  try {
    const user = await client.users.fetch(ownerId);
    console.log(`[*] Sending invitation to: ${user.tag} (${user.id})...`);
    await user.send({ embeds: [inviteEmbed], components: [buttonRow] });
    console.log(`  ✅ Successfully delivered VIP invitation to ${user.tag}!`);
    sentCount++;
  } catch (err) {
    console.warn(`  ⚠️ Could not DM owner ${ownerId} (DMs may be closed):`, err.message);
  }
}

console.log('\n======================================================');
console.log(`🎉 COMPLETED: Sent VIP invites to ${sentCount}/${ownerIds.size} server owners.`);
console.log('======================================================\n');
process.exit(0);
