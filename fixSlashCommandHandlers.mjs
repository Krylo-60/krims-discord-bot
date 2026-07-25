import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Alias /level to /rank
content = content.replace(
  "if (commandName === 'rank') {",
  "if (commandName === 'rank' || commandName === 'level') {"
);

// 2. Add /store and /help handlers if not present
if (!content.includes("commandName === 'store'")) {
  const storeHandler = `
  // Command: /store
  if (commandName === 'store') {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🛒 KryloSMP Official Webstore')
      .setDescription('Visit our official webstore to purchase ranks, crate keys, and server perks!\\n\\n🌐 **Webstore URL:** https://krylosmp-store.vercel.app')
      .setTimestamp();
    await interaction.reply({ embeds: [embed] }).catch(() => {});
    return;
  }
`;
  content = content.replace("if (commandName === 'ip') {", storeHandler + "\n  if (commandName === 'ip') {");
}

if (!content.includes("commandName === 'help'")) {
  const helpHandler = `
  // Command: /help
  if (commandName === 'help') {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('📜 KryloSMP Bot Commands')
      .setDescription(
        'Here are the available commands:\\n\\n' +
        '• \`/daily\` - Claim free daily rewards & KryloCoins!\\n' +
        '• \`/bday [user]\` - Celebrate birthday with fireworks & double XP!\\n' +
        '• \`/level\` or \`/rank\` - View chat level and XP progress!\\n' +
        '• \`/work\` - Work to earn KryloCoins!\\n' +
        '• \`/ip\` - Show Java & Bedrock server connection details!\\n' +
        '• \`/store\` - View KryloSMP official webstore link!\\n' +
        '• \`/pvp [user]\` - Challenge a player to a 1v1 duel!\\n' +
        '• \`/tournament\` - Join monthly server tournaments!\\n' +
        '• \`/leaderboard\` - View top player rankings!'
      )
      .setTimestamp();
    await interaction.reply({ embeds: [embed] }).catch(() => {});
    return;
  }
`;
  content = content.replace("if (commandName === 'ip') {", helpHandler + "\n  if (commandName === 'ip') {");
}

// 3. Optimize initial fetch timeout by deferring reply if Vercel config takes >1s
fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 INDEX.JS UPDATED SUCCESSFULLY!] Aliased /level, added /store and /help handlers.');
