import fs from 'fs';

const content = fs.readFileSync('C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('isChatInputCommand') || line.includes('interaction.commandName') || line.includes('commandName ===')) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
