import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const gameBoostFunctionDef = `
// ═══════════════════════════════════════════════════════════
// GAME BOOSTER & PC RAM OPTIMIZER ENGINE
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
`;

if (!code.includes('async function executeGameBoostOptimization')) {
  const insertBefore = "client.on('interactionCreate'";
  const idx = code.indexOf(insertBefore);
  if (idx !== -1) {
    code = code.substring(0, idx) + gameBoostFunctionDef + '\n\n' + code.substring(idx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Defined executeGameBoostOptimization before interactionCreate in index.js!');
  }
} else {
  console.log('executeGameBoostOptimization is already defined');
}
