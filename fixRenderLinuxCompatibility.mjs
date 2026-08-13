import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const oldGameBoostFunc = `async function executeGameBoostOptimization(author) {
  try {
    const bloatApps = ['brave', 'chrome', 'msedge', 'spotify', 'epicgameslauncher', 'Steam', 'DismHost'];
    for (const app of bloatApps) {
      try {
        execSync(\`powershell -Command "Stop-Process -Name '\${app}' -Force -ErrorAction SilentlyContinue"\`, { stdio: 'ignore' });
      } catch (e) {}
    }

    const psScript = 'Get-Process | ForEach-Object { try { [void]$_.EmptyWorkingSet() } catch {} }; [System.GC]::Collect()';
    try {
      execSync(\`powershell -Command "\${psScript}"\`, { stdio: 'ignore' });
    } catch (e) {}
    try {
      execSync('powercfg /s 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { stdio: 'ignore' });
    } catch (e) {}`;

const newGameBoostFunc = `async function executeGameBoostOptimization(author) {
  try {
    if (process.platform === 'win32') {
      const bloatApps = ['brave', 'chrome', 'msedge', 'spotify', 'epicgameslauncher', 'Steam', 'DismHost'];
      for (const app of bloatApps) {
        try {
          execSync(\`powershell -Command "Stop-Process -Name '\${app}' -Force -ErrorAction SilentlyContinue"\`, { stdio: 'ignore' });
        } catch (e) {}
      }

      const psScript = 'Get-Process | ForEach-Object { try { [void]$_.EmptyWorkingSet() } catch {} }; [System.GC]::Collect()';
      try {
        execSync(\`powershell -Command "\${psScript}"\`, { stdio: 'ignore' });
      } catch (e) {}
      try {
        execSync('powercfg /s 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { stdio: 'ignore' });
      } catch (e) {}
    }`;

if (code.includes(oldGameBoostFunc)) {
  code = code.replace(oldGameBoostFunc, newGameBoostFunc);
  console.log("✅ Wrapped Windows commands with process.platform === 'win32' check!");
}

fs.writeFileSync('index.js', code);
