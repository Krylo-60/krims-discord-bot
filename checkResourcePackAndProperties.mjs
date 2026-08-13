import fs from 'fs';

console.log("🔍 CHECKING SERVER RESOURCE PACK & CUSTOM MODEL DATA CONFIGS...");

// Search for any .json model files or resource pack configs in krims-discord-bot directory
const files = fs.readdirSync('.');
const jsonFiles = files.filter(f => f.endsWith('.json') || f.includes('pack') || f.includes('resource'));
console.log("Found texture/resource related files:", jsonFiles);
