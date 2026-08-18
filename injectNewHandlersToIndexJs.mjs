import fs from 'fs';

let content = fs.readFileSync('index.js', 'utf8');

// Check if imports exist
if (!content.includes('locatorBarEngine.mjs')) {
  const importHeader = `import { getLocatorColor } from './features/locatorBarEngine.mjs';\nimport { handleMessageXp, handleRankCommand, handleLeaderboardCommand } from './features/mee6Levels.mjs';\nimport { afkUsers, handleWarn, handleMute, handleUnmute, handleKick, handleBan, handlePurge, handleLockdown, handleSlowmode, handleAfk, handleRemindMe, handleEmbedBuilder, sendModLog } from './features/dynoModSystem.mjs';\n`;
  content = importHeader + content;
}

// Check if command router exists
const routerCode = `
  // 🧭 Minecraft Locator Bar Neighbor Finder
  if (commandName === 'locator') {
    const input = interaction.options.getString('player_or_color');
    await interaction.deferReply();
    const res = await getLocatorColor(input);

    if (res.type === 'color') {
      const embed = new EmbedBuilder()
        .setColor(parseInt(res.normalizedHex.replace('#', ''), 16))
        .setTitle('🧭 LOCATOR BAR COLOR SCANNER')
        .setDescription(\`Radar analysis for color \` + \`\\\`\${res.rawHex.toUpperCase()}\\\`:\\n\\n**Normalized 90% In-Game Color:** \\\`\${res.normalizedHex.toUpperCase()}\\\`\\n**Hue:** \\\`\${res.hue}°\\\` • **Brightness:** \\\`90%\\\`\`)
        .addFields(
          { name: 'RGB Breakdown', value: \`R: \\\`\${res.rgb.r}\\\` G: \\\`\${res.rgb.g}\\\` B: \\\`\${res.rgb.b}\\\`\`, inline: true },
          { name: 'BossBar Preview', value: \`\\\`[ ▬▬▬▬▬ ⬥ COLOR ⬥ ▬▬▬▬▬ ]\\\`\`, inline: true }
        )
        .setFooter({ text: 'KryloSMP Locator Radar Engine' })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(parseInt(res.normalizedHex.replace('#', ''), 16))
      .setAuthor({ name: \`Minecraft Locator Bar • \${res.username}\`, iconURL: res.avatarUrl })
      .setThumbnail(res.avatarUrl)
      .setDescription(\`Computed in-game 90% normalized radar locator bar color for **\${res.username}**!\`)
      .addFields(
        { name: '👤 Username', value: \`\\\`\${res.username}\\\`\`, inline: true },
        { name: '🆔 UUID', value: \`\\\`\${res.uuid}\\\`\`, inline: true },
        { name: '🎨 90% In-Game Hex', value: \`\\\`\${res.normalizedHex.toUpperCase()}\\\`\`, inline: true },
        { name: '🌈 Raw Hash Hex', value: \`\\\`\${res.rawHex.toUpperCase()}\\\`\`, inline: true },
        { name: '📊 Hue / Saturation', value: \`\\\`\${res.hue}° / \${res.saturation}%\\\`\`, inline: true },
        { name: '🧭 Radar Frequency', value: \`\\\`Band #\${res.hue}\\\`\`, inline: true },
        { name: '🔍 BossBar Preview', value: \`\\\`\${res.barPreview}\\\`\` },
        { name: '🌐 Web Radar Tool', value: '[Open Interactive Tool](https://krylosmp-store.web.app/#locator)' }
      )
      .setImage(\`https://mc-heads.net/body/\${encodeURIComponent(res.username)}/right\`)
      .setFooter({ text: 'KryloSMP Radar Protocol • locatorbar.crab.trade Engine' })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }

  if (commandName === 'mute') return handleMute(interaction);
  if (commandName === 'unmute') return handleUnmute(interaction);
  if (commandName === 'kick') return handleKick(interaction);
  if (commandName === 'ban') return handleBan(interaction);
  if (commandName === 'lockdown') return handleLockdown(interaction, true);
  if (commandName === 'unlock') return handleLockdown(interaction, false);
  if (commandName === 'slowmode') return handleSlowmode(interaction);
  if (commandName === 'afk') return handleAfk(interaction);
  if (commandName === 'remindme') return handleRemindMe(interaction);
  if (commandName === 'embed') return handleEmbedBuilder(interaction);
`;

if (!content.includes("commandName === 'locator'")) {
  const target = "if (!interaction.isChatInputCommand()) return;";
  content = content.replace(target, target + "\n" + routerCode);
}

fs.writeFileSync('index.js', content);
console.log('✅ Injected all new command handlers into index.js!');
