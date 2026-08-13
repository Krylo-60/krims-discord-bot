import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// 1. Add import os from 'os'; at top if not present
if (!code.includes("import os from 'os';")) {
  code = "import os from 'os';\n" + code;
  console.log("✅ Added import os from 'os'; to top of index.js!");
}

// 2. Replace exec calls in executeGameBoostOptimization with execSync
const oldFunc = `async function executeGameBoostOptimization(author) {
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
    } catch (e) {}`;

const newFunc = `async function executeGameBoostOptimization(author) {
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

if (code.includes(oldFunc)) {
  code = code.replace(oldFunc, newFunc);
  console.log("✅ Replaced exec with execSync inside executeGameBoostOptimization!");
}

fs.writeFileSync('index.js', code);
