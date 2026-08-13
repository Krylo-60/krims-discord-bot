import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';
const KRYLO_EMOJI_ID = '1530370298262720722';
const KRYLO_EMOJI = `<:KryloSMP:${KRYLO_EMOJI_ID}>`;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('KryloSMP guild not found!');
      process.exit(1);
    }

    console.log(`\n🏰 ORGANIZING ALL CHANNELS & ENSURING 2 DISTINCT ANNOUNCEMENT CHANNELS...`);
    const channels = await guild.channels.fetch();

    // 1. Find or create the 2 distinct announcement channels under INFORMATION category
    const infoCat = channels.find(c => c && c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('information'));

    // Server Announcements
    let serverAnnounceCh = channels.find(c => c && c.name && (c.name.includes('server-announcement') || (c.name.includes('announcement') && !c.name.includes('youtube'))));
    if (!serverAnnounceCh) {
      serverAnnounceCh = await guild.channels.create({
        name: '📢┃server-announcements',
        type: ChannelType.GuildAnnouncement,
        parent: infoCat ? infoCat.id : null,
        topic: 'Official KryloSMP server news, patch notes, and maintenance schedules.'
      });
      console.log(`✅ Created #📢┃server-announcements!`);
    } else {
      if (serverAnnounceCh.name !== '📢┃server-announcements') {
        await serverAnnounceCh.setName('📢┃server-announcements').catch(() => {});
      }
    }

    // YouTube Announcements
    let ytAnnounceCh = channels.find(c => c && c.name && c.name.includes('youtube-announcement'));
    if (!ytAnnounceCh) {
      ytAnnounceCh = await guild.channels.create({
        name: '🔴┃youtube-announcements',
        type: ChannelType.GuildAnnouncement,
        parent: infoCat ? infoCat.id : null,
        topic: 'Official YouTube video upload notifications for @Krylo-60 and @KryloBlox60!'
      });
      console.log(`✅ Created #🔴┃youtube-announcements!`);
    }

    // 2. Ensure all uncategorized channels are moved into appropriate categories
    const uncategorized = channels.filter(c => c && !c.parentId && c.type !== ChannelType.GuildCategory);
    console.log(`Found ${uncategorized.size} uncategorized channels. Categorizing...`);

    const commCat = channels.find(c => c && c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('community'));

    for (const [, ch] of uncategorized) {
      if (infoCat && ['rules', 'announce', 'verify', 'info', 'social', 'store', 'ticket', 'suggest'].some(n => ch.name.includes(n))) {
        await ch.setParent(infoCat.id).catch(() => {});
        console.log(`  - Moved #${ch.name} -> INFORMATION`);
      } else if (commCat) {
        await ch.setParent(commCat.id).catch(() => {});
        console.log(`  - Moved #${ch.name} -> COMMUNITY ZONE`);
      }
    }

    // 3. Clean duplicate/old bot messages in key channels
    console.log(`\n🧹 Purging old duplicate bot messages from main channels...`);
    const keyChannels = [serverAnnounceCh, ytAnnounceCh];
    for (const ch of keyChannels) {
      if (!ch) continue;
      try {
        const msgs = await ch.messages.fetch({ limit: 25 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        if (botMsgs.size > 1) {
          const toDelete = Array.from(botMsgs.values()).slice(1);
          for (const m of toDelete) {
            await m.delete().catch(() => {});
          }
          console.log(`  - Cleaned ${toDelete.length} old duplicate messages in #${ch.name}`);
        }
      } catch (e) {}
    }

    // 4. Post clean initial embeds in both announcement channels
    const sEmbed = new EmbedBuilder()
      .setTitle(`${KRYLO_EMOJI} 📢 KRYLOSMP OFFICIAL SERVER ANNOUNCEMENTS`)
      .setDescription(`Welcome to **#📢┃server-announcements**!\n\nThis channel is used exclusively by KryloSMP staff to post major server updates, patch notes, events, and maintenance schedules.`)
      .setColor(0x00FF88)
      .setFooter({ text: `KryloSMP Staff Team • Official Server News`, iconURL: guild.iconURL() })
      .setTimestamp();

    const ytEmbed = new EmbedBuilder()
      .setTitle(`${KRYLO_EMOJI} 🔴 KRYLO OFFICIAL YOUTUBE ANNOUNCEMENTS`)
      .setDescription(
        `Welcome to **#🔴┃youtube-announcements**!\n\n` +
        `New uploads from **Krylo** ([@Krylo-60](https://www.youtube.com/@Krylo-60) & [@KryloBlox60](https://www.youtube.com/@KryloBlox60)) will automatically post here with Streamcord-style embeds, direct watch links, and reaction buttons!`
      )
      .setColor(0xFF0000)
      .setFooter({ text: `Krylo YouTube Notifier • Official Uploads`, iconURL: guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
      new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
    );

    await serverAnnounceCh.send({ embeds: [sEmbed], components: [row] }).catch(() => {});
    await ytAnnounceCh.send({ embeds: [ytEmbed], components: [row] }).catch(() => {});

    console.log(`\n🏆 ORGANIZING & 2 ANNOUNCEMENT CHANNELS COMPLETE!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
