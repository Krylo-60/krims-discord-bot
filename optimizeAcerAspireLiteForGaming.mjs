import { execSync } from 'child_process';

console.log("⚡ OPTIMIZING ACER ASPIRE LITE FOR GAMING & SPEED");
console.log("-------------------------------------------------");

// 1. Enable High Performance Power Plan
try {
  // Check available power schemes
  const schemes = execSync('powercfg /l', { encoding: 'utf8' });
  if (schemes.includes('8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c')) {
    execSync('powercfg /s 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { stdio: 'ignore' });
    console.log("✅ Set Windows Power Scheme to HIGH PERFORMANCE!");
  } else {
    // Duplicate high performance scheme if hidden
    execSync('powercfg -duplicatescheme 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { stdio: 'ignore' });
    execSync('powercfg /s 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { stdio: 'ignore' });
    console.log("✅ Created & Activated High Performance Power Scheme!");
  }
} catch (e) {
  console.warn("Power scheme notice:", e.message);
}

// 2. Enable Windows Game Mode via Registry
try {
  execSync('reg add "HKCU\\Software\\Microsoft\\GameBar" /v "AllowAutoGameMode" /t REG_DWORD /d 1 /f', { stdio: 'ignore' });
  execSync('reg add "HKCU\\Software\\Microsoft\\GameBar" /v "AutoGameModeEnabled" /t REG_DWORD /d 1 /f', { stdio: 'ignore' });
  console.log("✅ Enabled Windows Game Mode!");
} catch (e) {}

// 3. Disable Xbox Game Bar Background Recording (Frees up massive CPU & RAM)
try {
  execSync('reg add "HKCU\\System\\GameConfigStore" /v "GameDVR_Enabled" /t REG_DWORD /d 0 /f', { stdio: 'ignore' });
  console.log("✅ Disabled background GameDVR recording bloat!");
} catch (e) {}

console.log("\n🚀 ACER ASPIRE LITE GAMING OPTIMIZATION COMPLETE!");
