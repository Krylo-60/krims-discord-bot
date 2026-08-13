import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const genKeyCmdCode = `
// ═══════════════════════════════════════════════════════════
// CUSTOM FREE API KEY GENERATOR COMMAND (!genkey [prefix])
// ═══════════════════════════════════════════════════════════
if (message.content.startsWith('!genkey')) {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator) && message.author.id !== '1414143825538191373') {
    return message.reply('❌ Only server administrators can generate API keys.');
  }

  const args = message.content.split(' ').slice(1);
  const customPrefix = args[0] ? args[0].toLowerCase().replace(/[^a-z0-9]/g, '') : 'krylo';
  const envType = args[1] || 'live';

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

  // Send via DM if possible for security
  try {
    await message.author.send({ embeds: [embed] });
    await message.reply('✅ API key generated and sent to your DMs for security!');
  } catch (e) {
    await message.reply({ content: '⚠️ Could not send DM. Here is your key:', embeds: [embed] });
  }
}
`;

if (!code.includes('!genkey')) {
  const insertIdx = code.indexOf("if (message.content.startsWith('!postvideo'))");
  if (insertIdx !== -1) {
    code = code.substring(0, insertIdx) + genKeyCmdCode + '\n\n' + code.substring(insertIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Added !genkey command into index.js!');
  }
} else {
  console.log('!genkey command already present in index.js');
}
