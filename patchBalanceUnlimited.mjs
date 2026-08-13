import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const targetOld = `    const embed = new EmbedBuilder()
      .setColor(0xFFAA00)
      .setTitle(\`💳 Wallet Balance - \${targetUser.username}\`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🪙 KryloCoins', value: \`\\\`\${balance.toLocaleString()} KC\\\`\`, inline: true },
        { name: '🔗 Server Status', value: '\\\`Linked Account\\\`', inline: true }
      )`;

const targetNew = `    const isOwner = targetUser.id === '1414143825538191373' || targetUser.username.toLowerCase().includes('krylo');
    const finalBalanceStr = isOwner ? '♾️ Unlimited KC (Owner)' : \`\${balance.toLocaleString()} KC\`;

    const embed = new EmbedBuilder()
      .setColor(0xFFAA00)
      .setTitle(\`💳 Wallet Balance - \${targetUser.username}\`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🪙 KryloCoins', value: \`\\\`\${finalBalanceStr}\\\`\`, inline: true },
        { name: '🔗 Server Status', value: '\\\`Linked Account\\\`', inline: true }
      )`;

if (code.includes(targetOld)) {
  code = code.replace(targetOld, targetNew);
  fs.writeFileSync('index.js', code, 'utf8');
  console.log('✅ Patched /balance to display Unlimited KC (Owner) for Krylo!');
} else {
  console.error('[-] Could not find targetOld in index.js');
}
