import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const streamEngineCode = `
// ═══════════════════════════════════════════════════════════
// MINECRAFT LIVE STREAM ENGINE (!startstream & !stopstream)
// ═══════════════════════════════════════════════════════════
let activeStream = null;

async function startMinecraftLiveStream(guild, author, customTitle = 'Live KryloSMP Minecraft Gameplay & Tournaments!') {
  try {
    const streamTitle = customTitle || 'Live KryloSMP Minecraft Gameplay & Tournaments!';
    
    // Find target voice channel to join
    const voiceCh = guild.channels.cache.find(c => c && c.type === ChannelType.GuildVoice && (c.name.includes('Gaming') || c.name.includes('Lobby') || c.name.includes('Voice')));
    
    // Find target text channel to post stream embed
    const textCh = guild.channels.cache.find(c => c && c.isTextBased() && (c.name.includes('youtube') || c.name.includes('announcement') || c.name.includes('stream')));

    // Generate Streamcord-style Live Stream Embed
    const embed = new EmbedBuilder()
      .setAuthor({ name: '🔴 LIVE STREAM • Krylo (' + author.username + ')', iconURL: author.displayAvatarURL() })
      .setTitle('🔴 ' + streamTitle)
      .setURL("https://www.youtube.com/@Krylo-60")
      .setDescription(
        '**Krylo** is now **LIVE** streaming Minecraft on KryloSMP!\\n\\n' +
        '> 🎮 **Server IP:** \`\`\`krylosmp.play.hosting\`\`\`\\n' +
        '> 🔊 **Discord Stream Channel:** ' + (voiceCh ? '<#' + voiceCh.id + '>' : 'Voice Channel') + '\\n' +
        '> 👥 **Join Krylo in-game or watch live in Discord!**'
      )
      .setImage("https://i.ytimg.com/vi/UBT9cvXm_c4/maxresdefault.jpg")
      .setColor(0xFF0000)
      .setFooter({ text: 'KryloSMP Live Stream Engine • Powered by Krims Code AI', iconURL: guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("▶️ Watch Live Stream").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@Krylo-60"),
      new ButtonBuilder().setLabel("🎮 Join Minecraft Server").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app")
    );

    const pingRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('youtube') || r.name.toLowerCase().includes('stream') || r.name.toLowerCase().includes('announcement'));
    const pingText = pingRole ? '<@&' + pingRole.id + '>' : '@everyone';

    let streamMsg = null;
    if (textCh) {
      streamMsg = await textCh.send({
        content: '🔴 ' + pingText + ' **KRYLO IS NOW LIVE STREAMING MINECRAFT!** Check it out:',
        embeds: [embed],
        components: [row]
      });

      await streamMsg.react('🔴').catch(() => {});
      await streamMsg.react('🔥').catch(() => {});
      await streamMsg.react('👍').catch(() => {});
      await streamMsg.react('🚀').catch(() => {});
    }

    // Set bot streaming status
    client.user.setActivity(streamTitle, { type: 1, url: "https://www.youtube.com/@Krylo-60" });

    activeStream = {
      guildId: guild.id,
      title: streamTitle,
      startTime: new Date(),
      msgId: streamMsg ? streamMsg.id : null,
      channelId: textCh ? textCh.id : null
    };

    console.log('[Live Stream Engine] Stream started: "' + streamTitle + '" in ' + guild.name);
    return activeStream;

  } catch (err) {
    console.error('[Live Stream Engine] Error starting stream:', err.message);
    throw err;
  }
}

// Handler for !startstream command
if (message.content.startsWith('!startstream')) {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator) && message.author.id !== '1414143825538191373') {
    return message.reply('❌ Only administrators can start a live stream broadcast.');
  }

  const args = message.content.split(' ').slice(1);
  const customTitle = args.join(' ') || 'Live KryloSMP Minecraft Gameplay & Tournaments!';

  try {
    await startMinecraftLiveStream(message.guild, message.author, customTitle);
    await message.reply('🔴 **LIVE STREAM BROADCAST STARTED!** Embed posted and notification sent.');
  } catch (e) {
    await message.reply('❌ Failed to start stream: ' + e.message);
  }
}

// Handler for !stopstream command
if (message.content.startsWith('!stopstream')) {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator) && message.author.id !== '1414143825538191373') {
    return message.reply('❌ Only administrators can stop a live stream broadcast.');
  }

  if (!activeStream) {
    return message.reply('ℹ️ No active live stream is currently running.');
  }

  activeStream = null;
  client.user.setActivity('KryloSMP • krylosmp.play.hosting', { type: 0 });

  await message.reply('🛑 **LIVE STREAM BROADCAST ENDED.** Activity status reset to default.');
}
`;

// Add slash command handlers for startstream & stopstream into interactionCreate
const slashStreamHandlers = `
  if (commandName === 'startstream') {
    if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== '1414143825538191373') {
      return interaction.reply({ content: '❌ Only administrators can start a live stream broadcast.', ephemeral: true });
    }

    const titleOpt = interaction.options.getString('title') || 'Live KryloSMP Minecraft Gameplay & Tournaments!';
    try {
      await startMinecraftLiveStream(interaction.guild, interaction.user, titleOpt);
      await interaction.reply({ content: '🔴 **LIVE STREAM BROADCAST STARTED!** Notification and embed sent.', ephemeral: true });
    } catch (e) {
      await interaction.reply({ content: '❌ Failed to start stream: ' + e.message, ephemeral: true });
    }
  }

  if (commandName === 'stopstream') {
    if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== '1414143825538191373') {
      return interaction.reply({ content: '❌ Only administrators can stop a live stream broadcast.', ephemeral: true });
    }

    if (!activeStream) {
      return interaction.reply({ content: 'ℹ️ No active live stream is currently running.', ephemeral: true });
    }

    activeStream = null;
    client.user.setActivity('KryloSMP • krylosmp.play.hosting', { type: 0 });

    await interaction.reply({ content: '🛑 **LIVE STREAM BROADCAST ENDED.** Activity status reset to default.', ephemeral: true });
  }
`;

if (!code.includes('startMinecraftLiveStream')) {
  const insertIdx = code.indexOf("if (message.content.startsWith('!postvideo'))");
  if (insertIdx !== -1) {
    code = code.substring(0, insertIdx) + streamEngineCode + '\n\n' + code.substring(insertIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Added Minecraft Live Stream Engine to index.js!');
  }
}

if (!code.includes("commandName === 'startstream'")) {
  const slashInsertIdx = code.indexOf("if (commandName === 'coinflip')");
  if (slashInsertIdx !== -1) {
    code = code.substring(0, slashInsertIdx) + slashStreamHandlers + '\n\n  ' + code.substring(slashInsertIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Added /startstream and /stopstream slash handlers to index.js!');
  }
}
