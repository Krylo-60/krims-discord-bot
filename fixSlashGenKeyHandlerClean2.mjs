import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const brokenIdx = code.indexOf("if (commandName === 'genkey') {");
const nextIdx = code.indexOf("if (commandName === 'coinflip')");

if (brokenIdx !== -1 && nextIdx !== -1) {
  const handlerCode = `if (commandName === 'genkey') {
    if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== '1414143825538191373') {
      return interaction.reply({ content: '❌ Only server administrators can generate API keys.', ephemeral: true });
    }

    const prefixOpt = interaction.options.getString('prefix') || 'krylo';
    const envOpt = interaction.options.getString('env') || 'live';
    const customPrefix = prefixOpt.toLowerCase().replace(/[^a-z0-9]/g, '');

    const randomHex = crypto.randomBytes(24).toString('hex');
    const apiKey = customPrefix + '_' + envOpt + '_' + randomHex;

    const embed = new EmbedBuilder()
      .setTitle('🔑 Custom API Key Generated')
      .setDescription('Your new custom API key has been created!')
      .addFields(
        { name: 'Prefix', value: '\`\`\`' + customPrefix + '\`\`\`', inline: true },
        { name: 'Environment', value: '\`\`\`' + envOpt + '\`\`\`', inline: true },
        { name: 'API Key', value: '\`\`\`' + apiKey + '\`\`\`' }
      )
      .setColor(0x00FF88)
      .setFooter({ text: 'Keep your API key secret! Never share your private keys.' })
      .setTimestamp();

    await interaction.reply({ content: '🔑 Here is your generated API key (ephemeral - only you can see this):', embeds: [embed], ephemeral: true });
  }\n\n  `;

  code = code.substring(0, brokenIdx) + handlerCode + code.substring(nextIdx);
  fs.writeFileSync('index.js', code);
  console.log('✅ Cleaned index.js!');
}
