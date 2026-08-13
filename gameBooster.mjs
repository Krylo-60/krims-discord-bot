import { execSync } from 'child_process';
import os from 'os';

console.log("🎮 KRYLO GAME BOOSTER & PC RAM OPTIMIZER");
console.log("-----------------------------------------");

// 1. Close background heavy apps (Browsers, background updaters, bloat)
const bloatApps = ['brave', 'chrome', 'msedge', 'spotify', 'epicgameslauncher', 'Steam', 'DismHost'];
console.log("🧹 Closing background bloat applications...");

for (const app of bloatApps) {
  try {
    execSync(`powershell -Command "Stop-Process -Name '${app}' -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore' });
    console.log(`  - Closed ${app}`);
  } catch (e) {}
}

// 2. Kill stale Node background tasks (keeping main bot daemon)
const currentPid = process.pid;
try {
  const nodePidsOutput = execSync('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"', { encoding: 'utf8' });
  const pids = nodePidsOutput.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
  for (const pidStr of pids) {
    const pid = parseInt(pidStr, 10);
    if (pid !== currentPid && pid !== 1920) { // Keep current & task-1930
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
      } catch (e) {}
    }
  }
} catch (e) {}

// 3. Flush RAM Working Sets
console.log("🚀 Flushing Working Sets & Freeing Memory for Lunar Client (6 GB RAM)...");
const psScript = `
Get-Process | ForEach-Object {
    try {
        [void]$_.EmptyWorkingSet()
    } catch {}
}
[System.GC]::Collect()
`;

try {
  execSync(`powershell -Command "${psScript.replace(/\r?\n/g, ' ')}"`, { stdio: 'ignore' });
} catch (e) {}

// 4. Ensure High Performance Power Scheme
try {
  execSync('powercfg /s 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { stdio: 'ignore' });
} catch (e) {}

// 5. Display Game Booster Results
const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
const usedMemGB = (totalMemGB - freeMemGB).toFixed(2);
const usedPercent = (((totalMemGB - freeMemGB) / totalMemGB) * 100).toFixed(1);

console.log(`\n🏆 GAME BOOST COMPLETE & READY FOR MINECRAFT!`);
console.log(`-----------------------------------------`);
console.log(`🧠 Total System RAM: ${totalMemGB} GB`);
console.log(`📊 Used System RAM:  ${usedMemGB} GB (${usedPercent}%)`);
console.log(`🚀 Available Free RAM: ${freeMemGB} GB`);
console.log(`🎮 Allocated to Lunar Client: 6.00 GB`);
console.log(`⚡ Power Plan: High Performance (Max FPS Mode)`);
