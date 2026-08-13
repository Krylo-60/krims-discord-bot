import { execSync } from 'child_process';
import os from 'os';

console.log("⚡ CLOSING BRAVE BROWSER & LUNAR CLIENT / MINECRAFT...");

// Kill Brave Browser processes
try {
  execSync('taskkill /F /IM brave.exe', { stdio: 'ignore' });
  console.log("✅ Successfully closed Brave Browser processes.");
} catch (e) {
  console.log("ℹ️ Brave Browser was not running or already closed.");
}

// Kill Lunar Client & Java/Minecraft processes
const mcProcesses = ['Lunar Client.exe', 'javaw.exe', 'java.exe', 'Minecraft.exe'];
for (const proc of mcProcesses) {
  try {
    execSync(`taskkill /F /IM "${proc}"`, { stdio: 'ignore' });
    console.log(`✅ Successfully closed ${proc}.`);
  } catch (e) {}
}

// Give OS a second to reclaim memory
execSync('powershell -Command "Start-Sleep -Seconds 2"', { stdio: 'ignore' });

// Check Free RAM after closing apps
const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
const usedMemGB = (totalMemGB - freeMemGB).toFixed(2);
const usedPercent = (((totalMemGB - freeMemGB) / totalMemGB) * 100).toFixed(1);

console.log(`\n🎉 RAM FREED SUCCESSFULLY!`);
console.log(`-----------------------------------------`);
console.log(`🧠 Total RAM: ${totalMemGB} GB`);
console.log(`📊 Used RAM:  ${usedMemGB} GB (${usedPercent}%)`);
console.log(`🚀 Free RAM:  ${freeMemGB} GB`);
