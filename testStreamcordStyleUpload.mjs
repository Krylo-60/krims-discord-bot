import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('Guild not found!');
      process.exit(1);
    }

    const channels = await guild.channels.fetch();
    const youtubeCh = channels.find(c => c && c.name && (c.name.includes('youtube') || c.name.includes('social')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    if (!youtubeCh) {
      console.error('No #youtube channel found!');
      process.exit(1);
    }

    console.log(`Posting Streamcord-style YouTube notification embed in #${youtubeCh.name}...`);

    // Streamcord-style YouTube notification payload
    const videoTitle = "i survived my first ever minecraft smp";
    const videoUrl = "https://youtu.be/d39XE_BeHZI";
    const channelName = "aCookieGod";
    const thumbnailUrl = "https://i.ytimg.com/vi/d39XE_BeHZI/maxresdefault.jpg";

    const embed = new EmbedBuilder()
      .setAuthor({ name: channelName, iconURL: guild.iconURL() })
      .setTitle(videoTitle)
      .setURL(videoUrl)
      .setImage(thumbnailUrl)
      .setColor(0xFF0000)
      .setFooter({ text: `YouTube • New Upload Notification`, iconURL: guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("▶️ Watch Video").setStyle(ButtonStyle.Link).setURL(videoUrl),
      new ButtonBuilder().setLabel("🔔 Subscribe").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@aCookieGod")
    );

    const pingRole = guild.roles.cache.find(r => r.name.includes('YouTube') || r.name.includes('Stream'));
    const pingText = pingRole ? `<@&${pingRole.id}>` : '@everyone';

    const msg = await youtubeCh.send({
      content: `Hey ${pingText} ! A new video has been uploaded, check it out ${videoUrl}`,
      embeds: [embed],
      components: [row]
    });

    // Add reactions matching Streamcord style
    await msg.react('👍').catch(() => {});
    await msg.react('🔥').catch(() => {});
    await msg.react('❤️').catch(() => {});
    await msg.react('🚀').catch(() => {});

    console.log(`✅ Posted Streamcord-style notification with reactions!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
