import fs from 'fs';

const content = fs.readFileSync('C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('isModalSubmit') || line.includes('modal_start_verification') || line.includes('modal_enter_verify_code')) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
