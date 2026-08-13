import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// Add !postvideo command to messageCreate
const postVideoCommand = `
  // Command: !postvideo <youtube_url> [title]
  if (content.toLowerCase().startsWith(botPrefix + 'postvideo') || content.toLowerCase().startsWith('!postvideo')) {
    if (!message.guild) {
      await message.reply("❌ This command can only be used inside servers!");
      return;
    }

    const args = content.split(' ').slice(1);
    const videoUrl = args[0];

    if (!videoUrl || (!videoUrl.includes('youtube.com') && !videoUrl.includes('youtu.be'))) {
      await message.reply("❌ **Usage:** \`!postvideo <youtube_url> [optional custom title]\`\\nExample: \`!postvideo https://youtu.be/d39XE_BeHZI my new minecraft smp video\`");
      return;
    }

    const customTitle = args.slice(1).join(' ') || 'New Minecraft SMP Video!';
    
    // Extract video ID
    let videoId = '';
    if (videoUrl.includes('youtu.be/')) {
      videoId = videoUrl.split('youtu.be/')[1].split('?')[0];
    } else if (videoUrl.includes('v=')) {
      videoId = videoUrl.split('v=')[1].split('&')[0];
    }

    const thumbnailUrl = videoId ? \`https://i.ytimg.com/vi/\${videoId}/maxresdefault.jpg\` : 'https://i.ytimg.com/vi/d39XE_BeHZI/maxresdefault.jpg';

    const pingRole = message.guild.roles.cache.find(r => r.name.toLowerCase().includes('youtube') || r.name.toLowerCase().includes('stream') || r.name.toLowerCase().includes('ping'));
    const pingText = pingRole ? \`<@&\${pingRole.id}>\` : '@everyone';

    const embed = new EmbedBuilder()
      .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL() })
      .setTitle(customTitle)
      .setURL(videoUrl)
      .setImage(thumbnailUrl)
      .setColor(0xFF0000)
      .setFooter({ text: 'YouTube • New Upload Notification', iconURL: message.guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("▶️ Watch Video").setStyle(ButtonStyle.Link).setURL(videoUrl),
      new ButtonBuilder().setLabel("💬 Main Discord").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
    );

    const targetCh = message.guild.channels.cache.find(c => c.name.includes('youtube') || c.name.includes('social')) || message.channel;

    try {
      await message.delete().catch(() => {});
    } catch {}

    const postedMsg = await targetCh.send({
      content: \`Hey \${pingText} ! A new video has been uploaded, check it out \${videoUrl}\`,
      embeds: [embed],
      components: [row]
    });

    await postedMsg.react('👍').catch(() => {});
    await postedMsg.react('🔥').catch(() => {});
    await postedMsg.react('❤️').catch(() => {});
    await postedMsg.react('🚀').catch(() => {});

    console.log(\`[YouTube Notifier] Posted video notification for \${videoUrl} in #\${targetCh.name}\`);
    return;
  }
`;

if (!code.includes('!postvideo')) {
  code = code.replace(`client.on('messageCreate', async (message) => {`, `client.on('messageCreate', async (message) => {\n${postVideoCommand}`);
  fs.writeFileSync('index.js', code);
  console.log('✅ Added !postvideo command into index.js!');
} else {
  console.log('!postvideo already present in index.js');
}
