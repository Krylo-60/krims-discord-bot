import fs from 'fs';

const lines = fs.readFileSync('index.js', 'utf8').split('\n');

const newLines = [];
let patched = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("commandName === 'balance'")) {
    newLines.push(lines[i]); // if (commandName === 'balance') {
    newLines.push("    const targetUser = interaction.options.getUser('user') || interaction.user;");
    newLines.push("    let balance = 0;");
    newLines.push("");
    newLines.push("    // Owner / Krylo Unlimited KC Override");
    newLines.push("    if (targetUser.id === '1414143825538191373' || targetUser.username.toLowerCase().includes('krylo')) {");
    newLines.push("      balance = 999999999999;");
    newLines.push("    }");
    newLines.push("");
    newLines.push("    try {");
    newLines.push("      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';");
    newLines.push("      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {");
    newLines.push("        method: 'POST',");
    newLines.push("        headers: { 'Content-Type': 'application/json' },");
    newLines.push("        body: JSON.stringify({ action: 'get_config', guildId })");
    newLines.push("      });");
    newLines.push("      if (configRes.ok) {");
    newLines.push("        const config = await configRes.json();");
    newLines.push("        if (config.economyData && config.economyData[targetUser.username]) {");
    newLines.push("          if (balance < 999999999) balance = config.economyData[targetUser.username].balance || 0;");
    newLines.push("        }");
    newLines.push("      }");
    newLines.push("    } catch {}");
    newLines.push("");
    newLines.push("    const displayBal = balance >= 999999999 ? '♾️ Unlimited KC (Owner)' : `${balance.toLocaleString()} KC`;");
    newLines.push("");
    newLines.push("    const embed = new EmbedBuilder()");
    newLines.push("      .setColor(0xFFAA00)");
    newLines.push("      .setTitle(`💳 Wallet Balance - ${targetUser.username}`)");
    newLines.push("      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))");
    newLines.push("      .addFields(");
    newLines.push("        { name: '🪙 KryloCoins', value: `\`${displayBal}\``, inline: true },");
    newLines.push("        { name: '🔗 Server Status', value: '`Linked Account`', inline: true }");
    newLines.push("      )");
    newLines.push("      .setTimestamp();");
    newLines.push("    await interaction.reply({ embeds: [embed] });");
    newLines.push("    return;");
    newLines.push("  }");

    // Skip original /balance block until line containing 'return;'
    while (i < lines.length && !lines[i].includes("await interaction.reply({ embeds: [embed] });")) {
      i++;
    }
    if (i < lines.length && lines[i+1] && lines[i+1].includes("return;")) {
      i += 2; // skip return; and closing }
    }
    patched = true;
    continue;
  }
  newLines.push(lines[i]);
}

fs.writeFileSync('index.js', newLines.join('\n'), 'utf8');
console.log('✅ Clean Patched index.js for /balance Unlimited KC!');
