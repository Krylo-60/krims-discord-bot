import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const brokenStr = `.setTitle('?    if (commandName === 'clan') {`;
const targetPattern = /\.setTitle\(['"]\??\s*if \(commandName === 'clan'\)/;

if (targetPattern.test(code)) {
  const replacement = `.setTitle('🎁 DAILY LUCKY CHEST UNLOCKED!')
        .setDescription(
          \`> **<@\${userId}> opened their Daily Krylo Chest!**\\n\\n\` +
          '### 📦 LOOT DROPPED:\\n' +
          \`• **+\${coinsLoot.toLocaleString()} KryloCoins** ⛃\\n\` +
          \`• **+\${diamondsLoot}x Diamonds** (Queued in-game!)\\n\` +
          '• **+150 XP** Chat Leveling Bonus!\\n\\n' +
          '*Come back in 24 hours for your next Lucky Chest!* ⚔️'
        )
        .setFooter({ text: 'KryloSMP Daily Lucky Chest 📦' })
        .setTimestamp();

      await interaction.editReply({ embeds: [chestEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 🏰 CLAN / GUILD SYSTEM (/clan)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'clan') {`;

  code = code.replace(targetPattern, replacement);
  fs.writeFileSync('index.js', code, 'utf8');
  console.log("✅ Fixed index.js cleanly!");
} else {
  console.log("[-] Target pattern not matched.");
}
