import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const slashGenKeyHandler = `
  if (commandName === 'genkey') {
    if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== '1414143825538191373') {
      return interaction.reply({ content: '❌ Only server administrators can generate API keys.', ephemeral: true });
    }

    const customPrefix = (interaction.options.getString('prefix') || 'krylo').toLowerCase().replace(/[^a-z0-9]/g, '');
    const envType = interaction.options.getString('env') || 'live';

    const randomHex = crypto.randomBytes(24).toString('hex');
    const apiKey = \`\${customPrefix}_\${envType}_\${randomHex}\`;

    const embed = new EmbedBuilder()
      .setTitle('🔑 Custom API Key Generated')
      .setDescription(\`Your new custom API key has been created!\`)
      .addFields(
        { name: 'Prefix', value: \`\`\`\${customPrefix}\`\`\`, inline: true },
        { name: 'Environment', value: \`\`\`\${envType}\`\`\`, inline: true },
        { name: 'API Key', value: \`\`\`\${apiKey}\`\`\`\` }
      )
      .setColor(0x00FF88)
      .setFooter({ text: 'Keep your API key secret! Never share your private keys.' })
      .setTimestamp();

    await interaction.reply({ content: '🔑 Here is your generated API key (visible only to you):', embeds: [embed], ephemeral: true });
  }
`;

if (!code.includes("commandName === 'genkey'")) {
  const insertIdx = code.indexOf("if (commandName === 'coinflip')");
  if (insertIdx !== -1) {
    code = code.substring(0, insertIdx) + slashGenKeyHandler + '\n\n  ' + code.substring(insertIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Added slash command handler for /genkey into index.js!');
  } else {
    console.error('[-] Could not find insertion index in index.js');
  }
} else {
  console.log('/genkey slash handler already present in index.js');
}
