import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const guildJoinCode = `
// ═══════════════════════════════════════════════════════════
// AUTOMATED NEW SERVER BUILDER DAEMON
// ═══════════════════════════════════════════════════════════
client.on('guildCreate', async (guild) => {
  console.log(\`[Auto-Builder] Joined new server: "\${guild.name}" (\${guild.id})\`);
  try {
    const isFanArmy = guild.name.toLowerCase().includes('fan') || guild.name.toLowerCase().includes('krylo') || guild.id === '1532574648200593548';
    if (isFanArmy) {
      console.log(\`[Auto-Builder] Populating Krylo Fan Army layout for \${guild.name}...\`);
      
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
            \`Welcome to the official community hub for **Krylo** ([@Krylo-60](https://www.youtube.com/@Krylo-60) & [@KryloBlox60](https://www.youtube.com/@KryloBlox60))!\\n\\n\` +
            \`This server is dedicated to all fans, supporters, and content enthusiasts. Chat with fellow fans, share fan art, suggest video ideas, and catch every new video upload live!\`
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

      console.log(\`[Auto-Builder] Successfully populated Krylo Fan Army layout for \${guild.name}!\`);
    }
  } catch (err) {
    console.error('[Auto-Builder] Error:', err.message);
  }
});
`;

if (!code.includes('guildCreate')) {
  code += `\n${guildJoinCode}\n`;
  fs.writeFileSync('index.js', code);
  console.log('✅ Added guildCreate listener to index.js!');
} else {
  console.log('guildCreate listener already present in index.js');
}
