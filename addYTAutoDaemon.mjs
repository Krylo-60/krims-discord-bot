import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const ytDaemonCode = `
// ═══════════════════════════════════════════════════════════
// AUTOMATED YOUTUBE VIDEO NOTIFIER DAEMON
// ═══════════════════════════════════════════════════════════
const KRYLO_YT_ID = 'UCxDiqFdI-s4rn4k2psRVZfQ';
let lastSeenVideoId = '';

async function checkKryloYouTubeUploads() {
  try {
    const rssUrl = \`https://www.youtube.com/feeds/videos.xml?channel_id=\${KRYLO_YT_ID}\`;
    const res = await fetch(rssUrl);
    if (!res.ok) return;

    const xmlText = await res.text();
    const matches = xmlText.match(/<entry>[\\s\\S]*?<\\/entry>/g);

    if (matches && matches.length > 0) {
      const latestEntry = matches[0];
      const videoId = (latestEntry.match(/<yt:videoId>(.*?)<\\/yt:videoId>/) || [])[1];
      const title = (latestEntry.match(/<title>(.*?)<\\/title>/) || [])[1] || 'New YouTube Video!';
      const link = (latestEntry.match(/<link rel="alternate" href="(.*?)"\\/>/) || [])[1] || \`https://www.youtube.com/watch?v=\${videoId}\`;

      if (videoId && videoId !== lastSeenVideoId) {
        lastSeenVideoId = videoId;
        console.log(\`[YouTube Auto-Notifier] New upload detected from Krylo: "\${title}" (\${link})\`);

        const targetGuildIds = ['1524878881918685405', '1531792924055048292'];
        for (const gId of targetGuildIds) {
          try {
            const guild = client.guilds.cache.get(gId);
            if (!guild) continue;

            const targetCh = guild.channels.cache.find(c => c && c.name && (c.name.includes('announcement') || c.name.includes('youtube')) && c.isTextBased());
            if (!targetCh) continue;

            const thumbnailUrl = \`https://i.ytimg.com/vi/\${videoId}/maxresdefault.jpg\`;
            const embed = new EmbedBuilder()
              .setAuthor({ name: 'Krylo • YouTube Channel', iconURL: guild.iconURL() })
              .setTitle(title)
              .setURL(link)
              .setImage(thumbnailUrl)
              .setColor(0xFF0000)
              .setFooter({ text: 'YouTube • New Upload Notification', iconURL: guild.iconURL() })
              .setTimestamp();

            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setLabel("▶️ Watch Video").setStyle(ButtonStyle.Link).setURL(link),
              new ButtonBuilder().setLabel("🔔 Subscribe").setStyle(ButtonStyle.Link).setURL(\`https://www.youtube.com/channel/\${KRYLO_YT_ID}\`)
            );

            const pingRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('youtube') || r.name.toLowerCase().includes('stream') || r.name.toLowerCase().includes('announcement'));
            const pingText = pingRole ? \`<@&\${pingRole.id}>\` : '@everyone';

            const msg = await targetCh.send({
              content: \`Hey \${pingText} ! A new video has been uploaded by **Krylo**, check it out \${link}\`,
              embeds: [embed],
              components: [row]
            });

            await msg.react('👍').catch(() => {});
            await msg.react('🔥').catch(() => {});
            await msg.react('❤️').catch(() => {});
            await msg.react('🚀').catch(() => {});

          } catch (err) {
            console.warn(\`[YouTube Auto-Notifier] Error posting to guild \${gId}:\`, err.message);
          }
        }
      }
    }
  } catch (err) {
    console.warn('[YouTube Auto-Notifier] Check error:', err.message);
  }
}

// Run check every 3 minutes
setInterval(checkKryloYouTubeUploads, 180000);
setTimeout(checkKryloYouTubeUploads, 15000);
`;

if (!code.includes('checkKryloYouTubeUploads')) {
  code += `\n${ytDaemonCode}\n`;
  fs.writeFileSync('index.js', code);
  console.log('✅ Added YouTube Auto-Notifier Daemon into index.js!');
} else {
  console.log('YouTube Auto-Notifier Daemon already present in index.js');
}
