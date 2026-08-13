import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const oldYTBlockStart = `const KRYLO_YT_ID = 'UCxDiqFdI-s4rn4k2psRVZfQ';`;

const newYTBlock = `// Both Official Krylo YouTube Channels tracked 24/7
const KRYLO_YT_CHANNELS = [
  { handle: '@Krylo-60', id: 'UCxDiqFdI-s4rn4k2psRVZfQ' },
  { handle: '@KryloBlox60', id: 'UCDPcL5F_EB2MiWN1nJZbDbQ' }
];
const seenVideoIds = new Set();

async function checkKryloYouTubeUploads() {
  for (const ytChan of KRYLO_YT_CHANNELS) {
    try {
      const rssUrl = \`https://www.youtube.com/feeds/videos.xml?channel_id=\${ytChan.id}\`;
      const res = await fetch(rssUrl);
      if (!res.ok) continue;

      const xmlText = await res.text();
      const matches = xmlText.match(/<entry>[\\s\\S]*?<\\/entry>/g);

      if (matches && matches.length > 0) {
        const latestEntry = matches[0];
        const videoId = (latestEntry.match(/<yt:videoId>(.*?)<\\/yt:videoId>/) || [])[1];
        const title = (latestEntry.match(/<title>(.*?)<\\/title>/) || [])[1] || 'New Krylo Video!';
        const link = (latestEntry.match(/<link rel="alternate" href="(.*?)"\\/>/) || [])[1] || \`https://www.youtube.com/watch?v=\${videoId}\`;

        if (videoId && !seenVideoIds.has(videoId)) {
          seenVideoIds.add(videoId);
          console.log(\`[YouTube Auto-Notifier] New upload detected from \${ytChan.handle}: "\${title}" (\${link})\`);

          const targetGuildIds = ['1524878881918685405', '1531792924055048292'];
          for (const gId of targetGuildIds) {
            try {
              const guild = client.guilds.cache.get(gId);
              if (!guild) continue;

              const targetCh = guild.channels.cache.find(c => c && c.name && (c.name.includes('announcement') || c.name.includes('youtube')) && c.isTextBased());
              if (!targetCh) continue;

              const thumbnailUrl = \`https://i.ytimg.com/vi/\${videoId}/maxresdefault.jpg\`;
              const embed = new EmbedBuilder()
                .setAuthor({ name: \`Krylo (\${ytChan.handle})\`, iconURL: guild.iconURL() })
                .setTitle(title)
                .setURL(link)
                .setImage(thumbnailUrl)
                .setColor(0xFF0000)
                .setFooter({ text: \`Krylo YouTube Notifier • \${ytChan.handle}\`, iconURL: guild.iconURL() })
                .setTimestamp();

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setLabel("▶️ Watch Video").setStyle(ButtonStyle.Link).setURL(link),
                new ButtonBuilder().setLabel("🔔 Subscribe").setStyle(ButtonStyle.Link).setURL(\`https://www.youtube.com/\${ytChan.handle}\`)
              );

              const pingRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('youtube') || r.name.toLowerCase().includes('stream') || r.name.toLowerCase().includes('announcement'));
              const pingText = pingRole ? \`<@&\${pingRole.id}>\` : '@everyone';

              const msg = await targetCh.send({
                content: \`Hey \${pingText} ! A new video has been uploaded by **Krylo (\${ytChan.handle})**, check it out \${link}\`,
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
      console.warn(\`[YouTube Auto-Notifier] Check error for \${ytChan.handle}:\`, err.message);
    }
  }
}`;

const daemonIdx = code.indexOf('AUTOMATED YOUTUBE VIDEO NOTIFIER DAEMON');
if (daemonIdx !== -1) {
  code = code.substring(0, daemonIdx) + `AUTOMATED YOUTUBE VIDEO NOTIFIER DAEMON\n// ═══════════════════════════════════════════════════════════\n${newYTBlock}\n\nsetInterval(checkKryloYouTubeUploads, 180000);\nsetTimeout(checkKryloYouTubeUploads, 15000);\n`;
  fs.writeFileSync('index.js', code);
  console.log('✅ Updated index.js to track BOTH @Krylo-60 and @KryloBlox60 24/7!');
} else {
  console.error('[-] Could not find daemon header in index.js');
}
