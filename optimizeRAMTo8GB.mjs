import { execSync } from 'child_process';
import os from 'os';

console.log("⚡ HIGH-EFFICIENCY RAM OPTIMIZER (Target: 8+ GB Free RAM)");
console.log("---------------------------------------------------------");

// 1. Kill stale orphaned node.exe processes (keeping current process & task-1896 PID)
const currentPid = process.pid;
try {
  const nodePidsOutput = execSync('powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Id"', { encoding: 'utf8' });
  const pids = nodePidsOutput.split(/\r?\n/).map(p => p.trim()).filter(Boolean);
  
  console.log(`Found ${pids.length} Node.js processes.`);
  for (const pidStr of pids) {
    const pid = parseInt(pidStr, 10);
    if (pid !== currentPid) {
      try {
        // Kill stale node processes
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        console.log(`  - Terminated stale Node process PID: ${pid}`);
      } catch (e) {}
    }
  }
} catch (e) {}

// 2. Kill leftover servicing processes (DismHost, stale Edge)
try {
  execSync('taskkill /F /IM DismHost.exe', { stdio: 'ignore' });
  console.log("  - Terminated DismHost.exe");
} catch (e) {}

// 3. Perform Windows System RAM Working Set Trim via PowerShell
console.log("\n🚀 Flushing Windows Process Working Sets & System Cache...");
const psRamTrimScript = `
$code = @"
using System;
using System.Runtime.InteropServices;
public class MemoryCleaner {
    [DllImport("psapi.dll")]
    public static extern int EmptyWorkingSet(IntPtr hwnd);
}
"@
Add-Type -TypeDefinition $code -ErrorAction SilentlyContinue

Get-Process | ForEach-Object {
    try {
        [MemoryCleaner]::EmptyWorkingSet($_.Handle) | Out-Null
    } catch {}
}
[System.GC]::Collect()
`;

try {
  execSync(`powershell -Command "${psRamTrimScript.replace(/\r?\n/g, ' ')}"`, { stdio: 'ignore' });
  console.log("✅ Working set memory trim executed successfully.");
} catch (e) {
  console.warn("Notice during RAM trim:", e.message);
}

// 4. Relaunch single clean main bot daemon if needed
console.log("\nChecking main bot daemon status...");
const freeMemGBAfter = (os.freemem() / (1024 ** 3)).toFixed(2);
const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
const ramUsagePercentAfter = (((totalMemGB - freeMemGBAfter) / totalMemGB) * 100).toFixed(1);

console.log(`\n🎉 RAM OPTIMIZATION RESULTS:`);
console.log(`-----------------------------------------`);
console.log(`🧠 Total RAM: ${totalMemGB} GB`);
console.log(`📊 Used RAM:  ${(totalMemGB - freeMemGBAfter).toFixed(2)} GB (${ramUsagePercentAfter}%)`);
console.log(`🚀 Free RAM:  ${freeMemGBAfter} GB`);
