import { execSync } from 'child_process';
import os from 'os';

console.log("🔍 ACER ASPIRE LITE SYSTEM & GAMING DIAGNOSTIC");
console.log("-----------------------------------------------");

// 1. GPU Information
try {
  const gpus = execSync('powershell -Command "Get-CimInstance Win32_VideoController | Select-Object Name, AdapterRAM, DriverVersion | ConvertTo-Json"', { encoding: 'utf8' });
  console.log("🎮 GPUs Found:");
  console.log(gpus);
} catch (e) {}

// 2. Active Power Plan
try {
  const powerPlan = execSync('powercfg /getactivescheme', { encoding: 'utf8' });
  console.log("\n⚡ Active Power Scheme:");
  console.log(powerPlan.trim());
} catch (e) {}

// 3. Storage / SSD Status
try {
  const disks = execSync('powershell -Command "Get-CimInstance Win32_LogicalDisk | Where-Object DriveType -eq 3 | Select-Object DeviceID, @{N=\'Free_GB\';E={[math]::Round($_.FreeSpace/1GB, 2)}}, @{N=\'Total_GB\';E={[math]::Round($_.Size/1GB, 2)}} | ConvertTo-Json"', { encoding: 'utf8' });
  console.log("\n💾 SSD / Storage Status:");
  console.log(disks);
} catch (e) {}
