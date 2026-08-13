import { execSync } from 'child_process';
import os from 'os';

console.log("⚡ FORCE TERMINATING ALL BACKGROUND BLOAT PROCESSES...");

const processesToKill = ['DismHost', 'brave', 'Lunar Client', 'msedge'];

for (const name of processesToKill) {
  try {
    execSync(`powershell -Command "Stop-Process -Name '${name}' -Force -ErrorAction SilentlyContinue"`, { stdio: 'ignore' });
    console.log(`✅ Terminated all instances of ${name}`);
  } catch (e) {}
}

// Give OS a moment to reclaim free pages
execSync('powershell -Command "Start-Sleep -Seconds 2"', { stdio: 'ignore' });

const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
const usedMemGB = (totalMemGB - freeMemGB).toFixed(2);
const usedPercent = (((totalMemGB - freeMemGB) / totalMemGB) * 100).toFixed(1);

console.log(`\n🎉 UPDATED RAM METRICS:`);
console.log(`-----------------------------------------`);
console.log(`🧠 Total System RAM: ${totalMemGB} GB`);
console.log(`📊 Used System RAM:  ${usedMemGB} GB (${usedPercent}%)`);
console.log(`🚀 Available Free RAM: ${freeMemGB} GB`);
