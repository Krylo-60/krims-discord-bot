import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_YT_CHANNEL_ID = 'UCxDiqFdI-s4rn4k2psRVZfQ';
const targetGuildIds = ['1524878881918685405', '1531792924055048292']; // KryloSMP & Krishiv Studios

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`\n📢 Ensuring Announcement Channels for: ${guild.name}...`);
      const channels = await guild.channels.fetch();

      // Find or convert announcements channel
      let announceCh = channels.find(c => c && c.name && c.name.toLowerCase().includes('announcement') && c.isTextBased());

      if (!announceCh) {
        // Create Announcement channel
        const infoCategory = channels.find(c => c && c.type === ChannelType.GuildCategory && c.name.toLowerCase().includes('important'));
        announceCh = await guild.channels.create({
          name: '📢┃announcements',
          type: ChannelType.GuildAnnouncement, // Official Discord Announcement channel
          parent: infoCategory ? infoCategory.id : null,
          topic: 'Official server updates, news, and YouTube video releases!'
        });
        console.log(`✅ Created official Guild Announcement channel: #${announceCh.name}`);
      } else {
        // Upgrade to GuildAnnouncement type if possible
        if (announceCh.type !== ChannelType.GuildAnnouncement) {
          try {
            await announceCh.setType(ChannelType.GuildAnnouncement);
            console.log(`✅ Upgraded #${announceCh.name} to official Guild Announcement (News) channel!`);
          } catch (e) {
            console.log(`  (Channel #${announceCh.name} remains GuildText type: ${e.message})`);
          }
        }
      }

      // Check YouTube RSS feed for latest video
      console.log(`Fetching latest video for YouTube Channel ID: ${KRYLO_YT_CHANNEL_ID}...`);
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${KRYLO_YT_CHANNEL_ID}`;
      const rssRes = await fetch(rssUrl);
      const xml = await rssRes.text();

      const videoMatches = xml.match(/<entry>[\s\S]*?<\/entry>/g);

      if (videoMatches && videoMatches.length > 0) {
        const latestEntry = videoMatches[0];
        const title = (latestEntry.match(/<title>(.*?)<\/title>/) || [])[1] || 'New Krylo Video!';
        const link = (latestEntry.match(/<link rel="alternate" href="(.*?)"\/>/) || [])[1] || `https://www.youtube.com/channel/${KRYLO_YT_CHANNEL_ID}`;
        const videoId = (latestEntry.match(/<yt:videoId>(.*?)<\/yt:videoId>/) || [])[1] || '';

        console.log(`Found Latest Video: "${title}" (${link})`);

        const thumbnailUrl = videoId ? `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg` : `https://i.ytimg.com/vi/d39XE_BeHZI/maxresdefault.jpg`;

        const embed = new EmbedBuilder()
          .setAuthor({ name: "Krylo • YouTube Channel", iconURL: guild.iconURL() })
          .setTitle(title)
          .setURL(link)
          .setImage(thumbnailUrl)
          .setColor(0xFF0000)
          .setFooter({ text: 'Krylo YouTube Notifier • Official Upload', iconURL: guild.iconURL() })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("▶️ Watch Video").setStyle(ButtonStyle.Link).setURL(link),
          new ButtonBuilder().setLabel("🔔 Subscribe to Krylo").setStyle(ButtonStyle.Link).setURL(`https://www.youtube.com/channel/${KRYLO_YT_CHANNEL_ID}`)
        );

        const pingRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('youtube') || r.name.toLowerCase().includes('stream') || r.name.toLowerCase().includes('announcement'));
        const pingText = pingRole ? `<@&${pingRole.id}>` : '@everyone';

        const msg = await announceCh.send({
          content: `Hey ${pingText} ! A new video has been uploaded by **Krylo**, check it out ${link}`,
          embeds: [embed],
          components: [row]
        });

        await msg.react('👍').catch(() => {});
        await msg.react('🔥').catch(() => {});
        await msg.react('❤️').catch(() => {});
        await msg.react('🚀').catch(() => {});

        console.log(`✅ Posted latest YouTube video notification in #${announceCh.name}!`);
      } else {
        console.log(`No videos found in RSS feed for @Krylo-60 yet. Ready for future uploads!`);
      }

    } catch (err) {
      console.error(`Error in guild ${gId}:`, err.message);
    }
  }

  client.destroy();
});

client.login(token);
