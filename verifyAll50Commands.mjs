import fs from 'fs';

const content = fs.readFileSync('C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js', 'utf8');

const matches = content.match(/if \(commandName === ['"](\w+)['"]/g) || [];
const slashCmds = Array.from(new Set(matches.map(m => m.match(/['"](\w+)['"]/)[1])));

console.log('[+] Total Slash Command Handlers in index.js:', slashCmds.length);
console.log('[+] List of Slash Commands:\n', slashCmds.join(', '));

// Also check prefix command handlers
const prefixMatches = content.match(/content\.toLowerCase\(\)\.startsWith\(.*['"]!(\w+)['"]\)/g) || [];
console.log('\n[+] Prefix Command Handlers found in index.js:', prefixMatches.length);
