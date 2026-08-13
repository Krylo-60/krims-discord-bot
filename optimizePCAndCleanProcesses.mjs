import os from 'os';
import fs from 'fs';
import path from 'path';

console.log("⚡ PC OPTIMIZATION & CLEANUP DIAGNOSTIC");
console.log("-----------------------------------------");

// CPU & RAM Information
const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
const usedMemGB = (totalMemGB - freeMemGB).toFixed(2);
const ramUsagePercent = (((totalMemGB - freeMemGB) / totalMemGB) * 100).toFixed(1);

console.log(`💻 CPU Cores: ${os.cpus().length} x ${os.cpus()[0]?.model || 'Processor'}`);
console.log(`🧠 Total RAM: ${totalMemGB} GB`);
console.log(`📊 Used RAM:  ${usedMemGB} GB (${ramUsagePercent}%)`);
console.log(`✅ Free RAM:  ${freeMemGB} GB`);

// Clear Temp Files
const tempDir = os.tmpdir();
let filesCleaned = 0;
let bytesFreed = 0;

try {
  const files = fs.readdirSync(tempDir);
  for (const file of files) {
    if (file.includes('puppeteer') || file.includes('vscode') || file.includes('npm-') || file.endsWith('.tmp') || file.endsWith('.log')) {
      try {
        const fullPath = path.join(tempDir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isFile()) {
          bytesFreed += stat.size;
          fs.unlinkSync(fullPath);
          filesCleaned++;
        }
      } catch (e) {}
    }
  }
  console.log(`\n🧹 Cleaned ${filesCleaned} temporary files from ${tempDir}`);
  console.log(`💾 Disk Space Freed: ${(bytesFreed / (1024 * 1024)).toFixed(2)} MB`);
} catch (err) {
  console.warn("Temp cleanup notice:", err.message);
}

console.log("\n✨ System optimization diagnostic completed successfully.");
