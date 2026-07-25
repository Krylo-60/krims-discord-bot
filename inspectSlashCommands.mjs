import fs from 'fs';

const content = fs.readFileSync('C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\index.js', 'utf8');

const lines = content.split('\n');
const slashLines = [];

lines.forEach((line, idx) => {
  if (line.includes('SlashCommandBuilder') || line.includes('applicationCommands') || line.includes('Routes.application') || line.includes('.setName(')) {
    slashLines.push(`L${idx + 1}: ${line.trim()}`);
  }
});

console.log('Slash Command References:\n', slashLines.slice(0, 50).join('\n'));
