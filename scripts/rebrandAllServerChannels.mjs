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
import { buildTeamApplicationPanel, setupTeamApplicationChannel } from '../features/teamClanApplicationManager.mjs';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

await client.login(process.env.DISCORD_TOKEN);
console.log(`[+] Logged in as ${client.user.tag}`);

const GUILD_ID = '1557852594242719775';
const guild = await client.guilds.fetch(GUILD_ID);
await guild.channels.fetch();
await guild.roles.fetch();

console.log(`[+] Cleaning and updating all channels in: ${guild.name} (${guild.id})`);

// 1. Refresh Team Application Channel with New 12-Question Panel
console.log('--- 1. Updating #📝・𝖳eam-𝖠pply ---');
await setupTeamApplicationChannel(guild);
console.log('✅ Refreshed #📝・𝖳eam-𝖠pply');

// 2. Update #🎫・𝖮pen-𝖳icket (1561109170428842147)
try {
  const ticketCh = await guild.channels.fetch('1561109170428842147');
  if (ticketCh) {
    const msgs = await ticketCh.messages.fetch({ limit: 10 });
    for (const [, msg] of msgs) {
      if (msg.author.id === client.user.id) await msg.delete().catch(() => {});
    }

    const ticketEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('✨ The Light Bearers — Clan Command & Ticket Desk')
      .setDescription(
        `Welcome to the official **Clan Support & Dispatch Center** for **The Light Bearers**!\n\n` +
        `Need a private channel with Leadership (<@&1557855846094999572> & <@&1557855847500091443>)?\n` +
        `Select an option below to open a secure ticket channel:\n\n` +
        `• ⚔️ **General Clan Support** — Base queries, gear distribution, coordination.\n` +
        `• 🚨 **Urgent Base Defense / Raid Alert** — Hostiles spotted near sanctuary coordinates.\n` +
        `• 🤝 **Alliances & Diplomacy** — Clan treaties, non-aggression pacts, merchant trades.\n` +
        `• 🔒 **Private Leadership Inquiry** — Confidential report to Jonesy & KryloMCYT.`
      )
      .setImage('attachment://the_light_bearers_banner.jpg')
      .setFooter({ text: 'The Light Bearers Clan Command • Powered by Krims Bot v5.7.0' })
      .setTimestamp();

    const ticketRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('btn_ticket_general').setLabel('General Support').setStyle(ButtonStyle.Primary).setEmoji('⚔️'),
      new ButtonBuilder().setCustomId('btn_ticket_raid').setLabel('Raid / Defense Alert').setStyle(ButtonStyle.Danger).setEmoji('🚨'),
      new ButtonBuilder().setCustomId('btn_ticket_diplomacy').setLabel('Alliance / Diplomacy').setStyle(ButtonStyle.Success).setEmoji('🤝'),
      new ButtonBuilder().setCustomId('btn_ticket_private').setLabel('Private Leadership').setStyle(ButtonStyle.Secondary).setEmoji('🔒')
    );

    const bannerFile = './assets/the_light_bearers_banner.jpg';
    await ticketCh.send({ embeds: [ticketEmbed], components: [ticketRow], files: [bannerFile] });
    console.log('✅ Updated #🎫・𝖮pen-𝖳icket');
  }
} catch (e) {
  console.error('Error updating ticket channel:', e);
}

// 3. Update #❓・𝖢lan-𝖥aq (1561109171800375438)
try {
  const faqCh = await guild.channels.fetch('1561109171800375438');
  if (faqCh) {
    const msgs = await faqCh.messages.fetch({ limit: 10 });
    for (const [, msg] of msgs) {
      if (msg.author.id === client.user.id) await msg.delete().catch(() => {});
    }

    const faqEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('❓ The Light Bearers — Official Clan Handbook & FAQ')
      .setDescription(
        `Everything you need to know about standing together on **Elite SMP** with **The Light Bearers**:\n\n` +
        `**Q: What is our primary guild goal?**\n` +
        `A: To be a beacon of light in the darkness. We defend innocent players from toxic griefers, engineer unbreakable underground sanctuaries, and dominate economy and redstone farms as a family.\n\n` +
        `**Q: What is the rule on base coordinates?**\n` +
        `A: **ABSOLUTE ZERO LEAKS.** Base coordinates are strictly classified. Leaking coordinates to outsiders or enemy clans results in an instant ban and permanent blacklist.\n\n` +
        `**Q: How do I get verified on the SMP roster?**\n` +
        `A: Simply drop your exact in-game Minecraft username in <#1557858900806738050>. Krims Bot will render your 3D custom skin badge and unlock sanctuary communications.\n\n` +
        `**Q: Who leads the guild?**\n` +
        `A: **Leader:** Jonesy • **Co-Leader:** KryloMCYT.`
      )
      .setImage('attachment://the_light_bearers_banner.jpg')
      .setFooter({ text: 'The Light Bearers • Victory Through Unity & Truth' })
      .setTimestamp();

    await faqCh.send({ embeds: [faqEmbed], files: ['./assets/the_light_bearers_banner.jpg'] });
    console.log('✅ Updated #❓・𝖢lan-𝖥aq');
  }
} catch (e) {
  console.error('Error updating FAQ channel:', e);
}

// 4. Update #📜・𝖢reed (1557863770792136774)
try {
  const creedCh = await guild.channels.fetch('1557863770792136774');
  if (creedCh) {
    const msgs = await creedCh.messages.fetch({ limit: 10 });
    for (const [, msg] of msgs) {
      if (msg.author.id === client.user.id) await msg.delete().catch(() => {});
    }

    const creedEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('✨ THE LIGHT BEARERS CREED')
      .setDescription(
        `*From the ashes of destruction, we rise as one.*\n\n` +
        `**I. We Are The Light in the Darkness**\n` +
        `In a server poisoned by griefing and unchecked tyranny, we refuse to become bullies. We are guardians, merchants, builders, and allies.\n\n` +
        `**II. Unbreakable Trust**\n` +
        `A Light Bearer never steals from their kin. A Light Bearer never leaks the sanctuary. Our word is our covenant.\n\n` +
        `**III. Subterranean Mastery**\n` +
        `We build beneath the bedrock, conceal our vaults, and master the shadows so the light may thrive undisturbed.\n\n` +
        `**IV. Strength Through Brotherhood**\n` +
        `We fight not for cheap glory, but to defend our members and protect those who cannot protect themselves.`
      )
      .setFooter({ text: 'The Light Bearers • Official Guild Creed' })
      .setTimestamp();

    await creedCh.send({ embeds: [creedEmbed] });
    console.log('✅ Updated #📜・𝖢reed');
  }
} catch (e) {
  console.error('Error updating creed channel:', e);
}

// 5. Rename & Update #🌑・𝖢reed-of-𝖣arkness (1558287666003312670) to ✨・𝖼𝗋𝖾𝖾𝖽-𝗈𝖿-𝗅𝗂𝗀𝗁𝗍
try {
  const darkCh = await guild.channels.fetch('1558287666003312670');
  if (darkCh) {
    await darkCh.setName('✨・𝖼𝗋𝖾𝖾𝖽-𝗈𝖿-𝗅𝗂𝗀𝗁𝗍').catch(() => {});
    const msgs = await darkCh.messages.fetch({ limit: 10 });
    for (const [, msg] of msgs) {
      if (msg.author.id === client.user.id) await msg.delete().catch(() => {});
    }

    const lightCreedEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('✨ THE CREED OF LIGHT • THE LIGHT BEARERS')
      .setDescription(
        `*That darkness dies today. The shadows have broken, and the light has taken hold.*\n\n` +
        `1. **No Betrayal:** Loyalty to our guild is sacred.\n` +
        `2. **No Toxic Griefing:** We strike only in defense or righteous warfare.\n` +
        `3. **Mutual Growth:** Share farms, pool resources, and elevate every recruit.\n` +
        `4. **Perseverance:** When our walls fall, we build deeper, stronger, and greater.`
      )
      .setFooter({ text: 'The Light Bearers • The Dawn of a New Era' })
      .setTimestamp();

    await darkCh.send({ embeds: [lightCreedEmbed] });
    console.log('✅ Transformed #🌑・𝖢reed-of-𝖣arkness into #✨・𝖼𝗋𝖾𝖾𝖽-𝗈𝖿-𝗅𝗂𝗀𝗁𝗍');
  }
} catch (e) {
  console.error('Error updating dark creed channel:', e);
}

// 6. Update #🎯・𝖶anted-and-𝖡ounties (1558113541729558578)
try {
  const bountyCh = await guild.channels.fetch('1558113541729558578');
  if (bountyCh) {
    const msgs = await bountyCh.messages.fetch({ limit: 10 });
    for (const [, msg] of msgs) {
      if (msg.author.id === client.user.id) await msg.delete().catch(() => {});
    }

    const bountyEmbed = new EmbedBuilder()
      .setColor(0xF59E0B)
      .setTitle('🎯 THE LIGHT BEARERS • OFFICIAL BOUNTY BOARD & DEFENSE LIST')
      .setDescription(
        `Track high-value targets, griefer bounties, and hostile players targeted for guild counter-operations.\n\n` +
        `Claim rewards in Krims Rewards (KR) or netherite ingots upon verified combat elimination proofs.`
      )
      .setFooter({ text: 'The Light Bearers Warfare • Defense Ledger' })
      .setTimestamp();

    await bountyCh.send({ embeds: [bountyEmbed] });
    console.log('✅ Updated #🎯・𝖶anted-and-𝖡ounties');
  }
} catch (e) {
  console.error('Error updating bounty channel:', e);
}

console.log('[+] Channel rebranding script finished successfully!');
client.destroy();
