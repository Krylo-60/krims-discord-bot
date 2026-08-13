import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;

export async function populateKryloFanArmyServer(guildId) {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
  });

  await client.login(token);

  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      console.error(`Guild ${guildId} not found!`);
      client.destroy();
      return;
    }

    console.log(`\n👑 BUILDING KRYLO FAN ARMY SERVER: "${guild.name}"...`);

    // 1. Create Roles
    console.log('Creating Fan Army Roles...');
    const ownerRole = await guild.roles.create({ name: '👑 Krylo (Creator)', color: 0xFFD700, hoist: true });
    const generalRole = await guild.roles.create({ name: '🎖️ Fan Army General', color: 0xFF4500, hoist: true });
    const officerRole = await guild.roles.create({ name: '🛡️ Fan Army Officer', color: 0x1E90FF, hoist: true });
    const vipRole = await guild.roles.create({ name: '💎 VIP Fan', color: 0x9400D3, hoist: true });
    const ogRole = await guild.roles.create({ name: '🔥 OG Fan', color: 0x00FF7F, hoist: true });
    const memberRole = await guild.roles.create({ name: '⚔️ Krylo Fan Army', color: 0x00FFFF, hoist: true });

    // 2. Create Categories & Channels
    console.log('Building Categories & Channels...');

    // Category 1: Welcome & Rules
    const infoCat = await guild.channels.create({ name: '📌 WELCOME & RULES', type: ChannelType.GuildCategory });
    const welcomeCh = await guild.channels.create({ name: '👋┃welcome-and-rules', type: ChannelType.GuildText, parent: infoCat.id });
    const announceCh = await guild.channels.create({ name: '📢┃fan-announcements', type: ChannelType.GuildAnnouncement, parent: infoCat.id });
    const ytFeedCh = await guild.channels.create({ name: '🔴┃krylo-youtube-feed', type: ChannelType.GuildAnnouncement, parent: infoCat.id });

    // Category 2: Fan Army Lounge
    const loungeCat = await guild.channels.create({ name: '💬 FAN ARMY LOUNGE', type: ChannelType.GuildCategory });
    const chatCh = await guild.channels.create({ name: '💬┃general-fan-chat', type: ChannelType.GuildText, parent: loungeCat.id });
    const artCh = await guild.channels.create({ name: '📸┃fan-art-and-edits', type: ChannelType.GuildText, parent: loungeCat.id });
    const memeCh = await guild.channels.create({ name: '😂┃krylo-memes', type: ChannelType.GuildText, parent: loungeCat.id });
    const ideasCh = await guild.channels.create({ name: '💡┃video-ideas', type: ChannelType.GuildText, parent: loungeCat.id });
    const botCh = await guild.channels.create({ name: '🤖┃bot-commands', type: ChannelType.GuildText, parent: loungeCat.id });

    // Category 3: Voice Lounge
    const voiceCat = await guild.channels.create({ name: '🔊 FAN VOICE LOUNGE', type: ChannelType.GuildCategory });
    await guild.channels.create({ name: '🔊┃Fan Lounge 1', type: ChannelType.GuildVoice, parent: voiceCat.id });
    await guild.channels.create({ name: '🔊┃Gaming with Fans', type: ChannelType.GuildVoice, parent: voiceCat.id });

    // 3. Send Welcome & YouTube Feed Embeds
    const welcomeEmbed = new EmbedBuilder()
      .setTitle('👑 WELCOME TO THE OFFICIAL KRYLO FAN ARMY! 👑')
      .setDescription(
        `Welcome to the official community hub for **Krylo** ([@Krylo-60](https://www.youtube.com/@Krylo-60) & [@KryloBlox60](https://www.youtube.com/@KryloBlox60))!\n\n` +
        `This server is dedicated to all fans, supporters, and content enthusiasts. Chat with fellow fans, share fan art, suggest video ideas, and catch every new video upload live!`
      )
      .addFields(
        { name: '1️⃣ Respect Everyone', value: 'Keep discussions friendly, welcoming, and positive for all fans.' },
        { name: '2️⃣ Share Content', value: 'Post your fan art, edits, and memes in <#' + artCh.id + '>!' },
        { name: '3️⃣ Video Notifications', value: 'Catch every new upload from **Krylo** in <#' + ytFeedCh.id + '>!' }
      )
      .setColor(0xFFD700)
      .setFooter({ text: 'Krylo Fan Army • Official Community Hub' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("📺 @Krylo-60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@Krylo-60"),
      new ButtonBuilder().setLabel("🎮 @KryloBlox60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@KryloBlox60")
    );

    await welcomeCh.send({ embeds: [welcomeEmbed], components: [row] });
    console.log(`\n🏆 KRYLO FAN ARMY SERVER POPULATED SUCCESSFULLY!`);

  } catch (err) {
    console.error('Error populating server:', err.message);
  }

  client.destroy();
}
