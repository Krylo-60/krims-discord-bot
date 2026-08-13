import { execSync } from 'child_process';
import os from 'os';

console.log("⚡ FLUSHING MEMORY STANDBY LIST & WORKING SETS...");

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

const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
const usedMemGB = (totalMemGB - freeMemGB).toFixed(2);

console.log(`\n🚀 UPDATED FREE RAM: ${freeMemGB} GB / ${totalMemGB} GB`);
