import { execSync } from 'child_process';
import os from 'os';

console.log("📊 DISCOVERING TOP RAM CONSUMING PROCESSES");
console.log("-----------------------------------------");

const output = execSync('powershell -Command "Get-Process | Sort-Object WorkingSet64 -Descending | Select-Object -First 20 Name, Id, @{N=\'RAM_MB\';E={[math]::Round($_.WorkingSet64/1MB, 2)}} | ConvertTo-Json"', { encoding: 'utf8' });

const processes = JSON.parse(output);
console.table(processes);

const totalMemGB = (os.totalmem() / (1024 ** 3)).toFixed(2);
const freeMemGB = (os.freemem() / (1024 ** 3)).toFixed(2);
console.log(`\nCurrent Total RAM: ${totalMemGB} GB | Free RAM: ${freeMemGB} GB`);
