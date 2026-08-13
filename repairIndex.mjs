import fs from 'fs';

const lines = fs.readFileSync('index.js', 'utf8').split('\n');

const newLines = [];
let i = 0;
while (i < lines.length) {
  if (lines[i].includes(".setTitle('") && lines[i].includes("commandName === 'clan'")) {
    newLines.push("        .setTitle('🎁 DAILY LUCKY CHEST UNLOCKED!')");
    newLines.push("        .setDescription(");
    newLines.push("          `> **<@${userId}> opened their Daily Krylo Chest!**\\n\\n` +");
    newLines.push("          '### 📦 LOOT DROPPED:\\n' +");
    newLines.push("          `• **+${coinsLoot.toLocaleString()} KryloCoins** ⛃\\n` +");
    newLines.push("          `• **+${diamondsLoot}x Diamonds** (Queued in-game!)\\n` +");
    newLines.push("          '• **+150 XP** Chat Leveling Bonus!\\n\\n' +");
    newLines.push("          '*Come back in 24 hours for your next Lucky Chest!* ⚔️'");
    newLines.push("        )");
    newLines.push("        .setFooter({ text: 'KryloSMP Daily Lucky Chest 📦' })");
    newLines.push("        .setTimestamp();");
    newLines.push("");
    newLines.push("      await interaction.editReply({ embeds: [chestEmbed] });");
    newLines.push("      return;");
    newLines.push("    }");
    newLines.push("");
    newLines.push("    // ══════════════════════════════════════════════════════════");
    newLines.push("    // 🏰 CLAN / GUILD SYSTEM (/clan)");
    newLines.push("    // ══════════════════════════════════════════════════════════");
    newLines.push("    if (commandName === 'clan') {");
    i++;
  } else {
    newLines.push(lines[i]);
    i++;
  }
}

fs.writeFileSync('index.js', newLines.join('\n'), 'utf8');
console.log('✅ Repair completed successfully!');
