import fetch from 'node-fetch';
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const DISCORD_TOKEN = process.env.DISCORD_TOKEN;

// YouTube Channels to Monitor
const YT_CHANNELS = [
  { name: 'Krylo Official', id: 'UC3jP3P2_gM03rY_B152q7Yg' }
];

const postedVideoIds = new Set();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

async function checkYouTubeFeeds() {
  for (const ch of YT_CHANNELS) {
    try {
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`;
      const res = await fetch(feedUrl);
      if (!res.ok) continue;

      const xml = await res.text();
      const entryMatch = xml.match(/<entry>[\s\S]*?<\/entry>/);
      if (!entryMatch) continue;

      const entry = entryMatch[0];
      const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>(.*?)<\/title>/);
      const linkMatch = entry.match(/<link rel="alternate" href="(.*?)"\/>/);

      if (videoIdMatch && titleMatch) {
        const videoId = videoIdMatch[1];
        const title = titleMatch[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        const videoUrl = linkMatch ? linkMatch[1] : `https://www.youtube.com/watch?v=${videoId}`;

        if (!postedVideoIds.has(videoId)) {
          postedVideoIds.add(videoId);
          console.log(`[Streamer Bridge] 📺 Found new YouTube video: "${title}" (${videoId})`);

          // Broadcast to all guilds
          client.guilds.cache.forEach(guild => {
            const ytChannel = guild.channels.cache.find(c => c.name.includes('youtube-announcements') || c.name.includes('announcements'));
            if (ytChannel && ytChannel.isTextBased()) {
              const embed = new EmbedBuilder()
                .setColor(0xFF0000)
                .setTitle(`📺 NEW VIDEO RELEASED: ${title}`)
                .setURL(videoUrl)
                .setDescription(`🚀 **${ch.name}** just posted a brand new video!\n\nClick below to watch, like, and support the channel.`)
                .setImage(`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`)
                .setFooter({ text: 'KryloSMP Streamer & Media Protocol' })
                .setTimestamp();

              const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setLabel('▶️ Watch on YouTube')
                  .setStyle(ButtonStyle.Link)
                  .setURL(videoUrl)
              );

              ytChannel.send({ content: `@everyone`, embeds: [embed], components: [row] }).catch(() => {});
            }
          });
        }
      }
    } catch (err) {
      console.warn(`[Streamer Bridge] Error checking channel ${ch.name}:`, err.message);
    }
  }
}

client.once('ready', () => {
  console.log(`[Streamer Bridge] 📺 Streamer notifier online as ${client.user.tag}`);
  checkYouTubeFeeds();
  setInterval(checkYouTubeFeeds, 120000); // Check every 2 minutes
});

client.login(DISCORD_TOKEN);
