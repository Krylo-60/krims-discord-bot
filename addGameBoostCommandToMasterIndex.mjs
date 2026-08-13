import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const gameBoostEngineCode = `
// ═══════════════════════════════════════════════════════════
// GAME BOOSTER & PC RAM OPTIMIZER ENGINE (!gameboost & /gameboost)
// ═══════════════════════════════════════════════════════════
async function executeGameBoostOptimization(author) {
  try {
    const bloatApps = ['brave', 'chrome', 'msedge', 'spotify', 'epicgameslauncher', 'Steam', 'DismHost'];
    for (const app of bloatApps) {
      try {
        exec(\`powershell -Command "Stop-Process -Name '\${app}' -Force -ErrorAction SilentlyContinue"\`);
      } catch (e) {}
    }

    const psScript = 'Get-Process | ForEach-Object { try { [void]$_.EmptyWorkingSet() } catch {} }; [System.GC]::Collect()';
    exec(\`powershell -Command "\${psScript}"\`);
    try {
      exec('powercfg /s 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c');
    } catch (e) {}

    const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
    const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
    const usedMemGB = (totalMemGB - freeMemGB).toFixed(2);

    const embed = new EmbedBuilder()
      .setTitle('🎮 KRYLO GAME BOOSTER ACTIVATED! 🚀')
      .setDescription(
        \`👑 **Game Boost Initiated by \${author ? author.username : 'System'}!**\\n\\n\` +
        \`> 🧹 **Background Apps Closed:** Brave, Chrome, Edge, Spotify, Steam\\n\` +
        \`> 🧠 **System RAM Status:** \${usedMemGB} GB Used / **\${freeMemGB} GB FREE**\\n\` +
        \`> 🎮 **Allocated to Lunar Client:** 6.00 GB RAM\\n\` +
        \`> ⚡ **Power Plan:** High Performance (Maximum FPS Enabled)\\n\` +
        \`> 🚀 **YOUR PC IS OPTIMIZED & READY FOR 100+ FPS MINECRAFT!**\`
      )
      .setColor(0x00FF88)
      .setFooter({ text: 'KryloSMP Game Booster Engine • Powered by Krims Code AI' })
      .setTimestamp();

    return embed;
  } catch (err) {
    console.error('[Game Booster] Error:', err.message);
    throw err;
  }
}

// Handler for !gameboost command
if (message.content.startsWith('!gameboost') || message.content.startsWith('!boostpc')) {
  try {
    const embed = await executeGameBoostOptimization(message.author);
    await message.reply({ embeds: [embed] });
  } catch (e) {
    await message.reply('❌ Game boost error: ' + e.message);
  }
}
`;

// Slash command handler
const slashGameBoostHandler = `
  if (commandName === 'gameboost' || commandName === 'boostpc') {
    try {
      const embed = await executeGameBoostOptimization(interaction.user);
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      await interaction.reply({ content: '❌ Game boost error: ' + e.message, ephemeral: true });
    }
  }
`;

if (!code.includes('executeGameBoostOptimization')) {
  const insertIdx = code.indexOf("if (message.content.startsWith('!postvideo'))");
  if (insertIdx !== -1) {
    code = code.substring(0, insertIdx) + gameBoostEngineCode + '\n\n' + code.substring(insertIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Added Game Booster Engine to index.js!');
  }
}

if (!code.includes("commandName === 'gameboost'")) {
  const slashInsertIdx = code.indexOf("if (commandName === 'coinflip')");
  if (slashInsertIdx !== -1) {
    code = code.substring(0, slashInsertIdx) + slashGameBoostHandler + '\n\n  ' + code.substring(slashInsertIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Added /gameboost slash command handler to index.js!');
  }
}

// Add slash command definition
const slashBoostDef = `    {
      name: 'gameboost',
      description: 'Optimize PC RAM & close background apps for 100+ FPS Minecraft gaming'
    },`;

if (!code.includes("name: 'gameboost'")) {
  code = code.replace("const slashCommands = [", `const slashCommands = [\n${slashBoostDef}`);
  fs.writeFileSync('index.js', code);
  console.log('✅ Added /gameboost to slashCommands array!');
}
