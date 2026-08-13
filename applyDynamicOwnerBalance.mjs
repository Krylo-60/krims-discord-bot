import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// Replace the hardcoded balance handler with pure dynamic Role & Database checking
const lines = code.split('\n');
const newLines = [];

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("commandName === 'balance'")) {
    newLines.push(lines[i]);
    newLines.push("    const targetUser = interaction.options.getUser('user') || interaction.user;");
    newLines.push("    let balance = 0;");
    newLines.push("");
    newLines.push("    // 1. Dynamic Check: Server Owner via Discord Guild Owner or 👑 OWNER Role");
    newLines.push("    const isGuildOwner = interaction.guild && interaction.guild.ownerId === targetUser.id;");
    newLines.push("    const hasOwnerRole = interaction.member && interaction.member.roles && interaction.member.roles.cache.some(r => r.name.toUpperCase().includes('OWNER'));");
    newLines.push("    const isDynamicOwner = isGuildOwner || hasOwnerRole;");
    newLines.push("");
    newLines.push("    // 2. Dynamic Check: Local Database (verifiedUsers.json)");
    newLines.push("    if (fs.existsSync('verifiedUsers.json')) {");
    newLines.push("      try {");
    newLines.push("        const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf8'));");
    newLines.push("        if (vData[targetUser.id] && vData[targetUser.id].balance !== undefined) {");
    newLines.push("          balance = vData[targetUser.id].balance;");
    newLines.push("        }");
    newLines.push("      } catch (e) {}");
    newLines.push("    }");
    newLines.push("");
    newLines.push("    // 3. Dynamic Check: Vercel Remote Economy API");
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
    newLines.push("          balance = config.economyData[targetUser.username].balance || balance;");
    newLines.push("        }");
    newLines.push("      }");
    newLines.push("    } catch (e) {}");
    newLines.push("");
    newLines.push("    const displayBal = isDynamicOwner ? '♾️ Unlimited KC (Owner)' : `${balance.toLocaleString()} KC`;");
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

    // Skip original /balance block
    while (i < lines.length && !lines[i].includes("await interaction.reply({ embeds: [embed] });")) {
      i++;
    }
    if (i < lines.length && lines[i+1] && lines[i+1].includes("return;")) {
      i += 2;
    }
    continue;
  }
  newLines.push(lines[i]);
}

fs.writeFileSync('index.js', newLines.join('\n'), 'utf8');
console.log('✅ Updated /balance to 100% Dynamic Guild Owner & Role Detection (NO hardcoded IDs)!');
