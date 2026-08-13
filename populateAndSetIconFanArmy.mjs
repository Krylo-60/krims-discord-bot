import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const ICON_PATH = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7\\krylo_fan_army_icon_1785465115041.jpg';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guilds = await client.guilds.fetch();
    console.log(`Bot is in ${guilds.size} servers.`);

    for (const [gId, gRef] of guilds) {
      const guild = await gRef.fetch();
      console.log(`Checking server: "${guild.name}" (${guild.id})`);

      if (guild.name.toLowerCase().includes('fan army') || guild.name.toLowerCase().includes('fan') || guild.id === '1532574648200593548' || guild.id === '1532574925356007525') {
        console.log(`\n👑 FOUND KRYLO FAN ARMY SERVER: "${guild.name}" (${guild.id})! SETTING ICON & POPULATING...`);

        // 1. Set Server Icon
        if (fs.existsSync(ICON_PATH)) {
          try {
            const iconBuffer = fs.readFileSync(ICON_PATH);
            await guild.setIcon(iconBuffer);
            console.log(`✅ Set server icon for ${guild.name}!`);
          } catch (e) {
            console.warn(`  ⚠️ Could not set server icon: ${e.message}`);
          }
        }

        // 2. Create Roles
        console.log('Creating Fan Army Roles...');
        const ownerRole = await guild.roles.create({ name: '👑 Krylo (Creator)', color: 0xFFD700, hoist: true }).catch(() => {});
        const generalRole = await guild.roles.create({ name: '🎖️ Fan Army General', color: 0xFF4500, hoist: true }).catch(() => {});
        const officerRole = await guild.roles.create({ name: '🛡️ Fan Army Officer', color: 0x1E90FF, hoist: true }).catch(() => {});
        const vipRole = await guild.roles.create({ name: '💎 VIP Fan', color: 0x9400D3, hoist: true }).catch(() => {});
        const ogRole = await guild.roles.create({ name: '🔥 OG Fan', color: 0x00FF7F, hoist: true }).catch(() => {});
        const memberRole = await guild.roles.create({ name: '⚔️ Krylo Fan Army', color: 0x00FFFF, hoist: true }).catch(() => {});

        // 3. Create Categories & Channels
        console.log('Building Categories & Channels...');

        // Category 1: Welcome & Rules
        let infoCat = guild.channels.cache.find(c => c && c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('welcome'));
        if (!infoCat) {
          infoCat = await guild.channels.create({ name: '📌 WELCOME & RULES', type: ChannelType.GuildCategory });
        }

        const welcomeCh = await guild.channels.create({ name: '👋┃welcome-and-rules', type: ChannelType.GuildText, parent: infoCat.id }).catch(() => {});
        const announceCh = await guild.channels.create({ name: '📢┃fan-announcements', type: ChannelType.GuildAnnouncement, parent: infoCat.id }).catch(() => {});
        const ytFeedCh = await guild.channels.create({ name: '🔴┃krylo-youtube-feed', type: ChannelType.GuildAnnouncement, parent: infoCat.id }).catch(() => {});

        // Category 2: Fan Army Lounge
        let loungeCat = guild.channels.cache.find(c => c && c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('lounge'));
        if (!loungeCat) {
          loungeCat = await guild.channels.create({ name: '💬 FAN ARMY LOUNGE', type: ChannelType.GuildCategory });
        }

        const chatCh = await guild.channels.create({ name: '💬┃general-fan-chat', type: ChannelType.GuildText, parent: loungeCat.id }).catch(() => {});
        const artCh = await guild.channels.create({ name: '📸┃fan-art-and-edits', type: ChannelType.GuildText, parent: loungeCat.id }).catch(() => {});
        const memeCh = await guild.channels.create({ name: '😂┃krylo-memes', type: ChannelType.GuildText, parent: loungeCat.id }).catch(() => {});
        const ideasCh = await guild.channels.create({ name: '💡┃video-ideas', type: ChannelType.GuildText, parent: loungeCat.id }).catch(() => {});
        const botCh = await guild.channels.create({ name: '🤖┃bot-commands', type: ChannelType.GuildText, parent: loungeCat.id }).catch(() => {});

        // Category 3: Voice Lounge
        let voiceCat = guild.channels.cache.find(c => c && c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('voice'));
        if (!voiceCat) {
          voiceCat = await guild.channels.create({ name: '🔊 FAN VOICE LOUNGE', type: ChannelType.GuildCategory });
        }

        await guild.channels.create({ name: '🔊┃Fan Lounge 1', type: ChannelType.GuildVoice, parent: voiceCat.id }).catch(() => {});
        await guild.channels.create({ name: '🔊┃Gaming with Fans', type: ChannelType.GuildVoice, parent: voiceCat.id }).catch(() => {});

        // 4. Send Welcome & YouTube Feed Embeds
        if (welcomeCh) {
          const welcomeEmbed = new EmbedBuilder()
            .setTitle('👑 WELCOME TO THE OFFICIAL KRYLO FAN ARMY! 👑')
            .setDescription(
              `Welcome to the official community hub for **Krylo** ([@Krylo-60](https://www.youtube.com/@Krylo-60) & [@KryloBlox60](https://www.youtube.com/@KryloBlox60))!\n\n` +
              `This server is dedicated to all fans, supporters, and content enthusiasts. Chat with fellow fans, share fan art, suggest video ideas, and catch every new video upload live!`
            )
            .addFields(
              { name: '1️⃣ Respect Everyone', value: 'Keep discussions friendly, welcoming, and positive for all fans.' },
              { name: '2️⃣ Share Content', value: `Post your fan art, edits, and memes in <#${artCh?.id || '0'}>!` },
              { name: '3️⃣ Video Notifications', value: `Catch every new upload from **Krylo** in <#${ytFeedCh?.id || '0'}>!` }
            )
            .setColor(0xFFD700)
            .setFooter({ text: 'Krylo Fan Army • Official Community Hub', iconURL: guild.iconURL() })
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("📺 @Krylo-60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@Krylo-60"),
            new ButtonBuilder().setLabel("🎮 @KryloBlox60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@KryloBlox60")
          );

          await welcomeCh.send({ embeds: [welcomeEmbed], components: [row] });
        }

        console.log(`\n🏆 SUCCESSFULLY POPULATED AND SET ICON FOR "${guild.name}"!`);
      }
    }

  } catch (err) {
    console.error('Error populating fan army server:', err.message);
  }

  client.destroy();
});

client.login(token);
