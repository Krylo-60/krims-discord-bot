import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guilds = await client.guilds.fetch();
    console.log(`Bot is currently in ${guilds.size} servers.`);

    for (const [gId, gRef] of guilds) {
      const guild = await gRef.fetch();
      console.log(` - Server: "${guild.name}" (ID: ${guild.id})`);

      if (guild.name.toLowerCase().includes('fan') || guild.name.toLowerCase().includes('krylo fan army')) {
        console.log(`\n👑 FOUND KRYLO FAN ARMY SERVER: "${guild.name}" (${guild.id})! POPULATING NOW...`);

        // Roles
        const ownerRole = await guild.roles.create({ name: '👑 Krylo (Creator)', color: 0xFFD700, hoist: true }).catch(() => {});
        const generalRole = await guild.roles.create({ name: '🎖️ Fan Army General', color: 0xFF4500, hoist: true }).catch(() => {});
        const officerRole = await guild.roles.create({ name: '🛡️ Fan Army Officer', color: 0x1E90FF, hoist: true }).catch(() => {});
        const vipRole = await guild.roles.create({ name: '💎 VIP Fan', color: 0x9400D3, hoist: true }).catch(() => {});
        const ogRole = await guild.roles.create({ name: '🔥 OG Fan', color: 0x00FF7F, hoist: true }).catch(() => {});
        const memberRole = await guild.roles.create({ name: '⚔️ Krylo Fan Army', color: 0x00FFFF, hoist: true }).catch(() => {});

        // Categories & Channels
        const infoCat = await guild.channels.create({ name: '📌 WELCOME & RULES', type: ChannelType.GuildCategory }).catch(() => {});
        const welcomeCh = await guild.channels.create({ name: '👋┃welcome-and-rules', type: ChannelType.GuildText, parent: infoCat ? infoCat.id : null }).catch(() => {});
        const announceCh = await guild.channels.create({ name: '📢┃fan-announcements', type: ChannelType.GuildAnnouncement, parent: infoCat ? infoCat.id : null }).catch(() => {});
        const ytFeedCh = await guild.channels.create({ name: '🔴┃krylo-youtube-feed', type: ChannelType.GuildAnnouncement, parent: infoCat ? infoCat.id : null }).catch(() => {});

        const loungeCat = await guild.channels.create({ name: '💬 FAN ARMY LOUNGE', type: ChannelType.GuildCategory }).catch(() => {});
        const chatCh = await guild.channels.create({ name: '💬┃general-fan-chat', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});
        const artCh = await guild.channels.create({ name: '📸┃fan-art-and-edits', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});
        const memeCh = await guild.channels.create({ name: '😂┃krylo-memes', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});
        const ideasCh = await guild.channels.create({ name: '💡┃video-ideas', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});
        const botCh = await guild.channels.create({ name: '🤖┃bot-commands', type: ChannelType.GuildText, parent: loungeCat ? loungeCat.id : null }).catch(() => {});

        const voiceCat = await guild.channels.create({ name: '🔊 FAN VOICE LOUNGE', type: ChannelType.GuildCategory }).catch(() => {});
        await guild.channels.create({ name: '🔊┃Fan Lounge 1', type: ChannelType.GuildVoice, parent: voiceCat ? voiceCat.id : null }).catch(() => {});
        await guild.channels.create({ name: '🔊┃Gaming with Fans', type: ChannelType.GuildVoice, parent: voiceCat ? voiceCat.id : null }).catch(() => {});

        if (welcomeCh) {
          const welcomeEmbed = new EmbedBuilder()
            .setTitle('👑 WELCOME TO THE OFFICIAL KRYLO FAN ARMY! 👑')
            .setDescription(
              `Welcome to the official community hub for **Krylo** ([@Krylo-60](https://www.youtube.com/@Krylo-60) & [@KryloBlox60](https://www.youtube.com/@KryloBlox60))!\n\n` +
              `This server is dedicated to all fans, supporters, and content enthusiasts. Chat with fellow fans, share fan art, suggest video ideas, and catch every new video upload live!`
            )
            .setColor(0xFFD700)
            .setFooter({ text: 'Krylo Fan Army • Official Community Hub' })
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("📺 @Krylo-60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@Krylo-60"),
            new ButtonBuilder().setLabel("🎮 @KryloBlox60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@KryloBlox60")
          );

          await welcomeCh.send({ embeds: [welcomeEmbed], components: [row] }).catch(() => {});
        }

        console.log(`\n🏆 SUCCESSFULLY POPULATED "${guild.name}"!`);
      }
    }

  } catch (err) {
    console.error('Error scanning guilds:', err.message);
  }

  client.destroy();
});

client.login(token);
