import fs from 'fs';
const content = fs.readFileSync('index.js', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('interactionCreate') || line.includes('isChatInputCommand') || line.includes('isButton')) {
    console.log(`Line ${idx + 1}: ${line.trim()}`);
  }
});
