import fs from 'fs';

const content = fs.readFileSync('C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js', 'utf8');

const matches = content.match(/message\.content\.toLowerCase\(\)\.startsWith\(['"]!(\w+)['"]\)/g) || [];
const commandNames = new Set(matches.map(m => m.match(/!(\w+)/)[1]));

console.log('[+] Existing Prefix Commands (!):', Array.from(commandNames));

// Search for slash command registrations or REST put
const restPut = content.includes('Routes.applicationCommands') || content.includes('applicationGuildCommands');
console.log('[+] Slash Command REST Registration present:', restPut);
