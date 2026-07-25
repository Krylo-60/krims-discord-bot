import fs from 'fs';

const content = fs.readFileSync('C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes("OFFICIALLY KRYLO'S BIRTHDAY") || line.includes("KRYLO'S BIRTHDAY")) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
