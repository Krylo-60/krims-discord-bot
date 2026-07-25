import fs from 'fs';

const content = fs.readFileSync('C:/Users/naina/.gemini/antigravity/scratch/krims-code-chatbot/api/chat.js', 'utf8');

const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('confirm_verification_code') || line.includes('request_verification') || line.includes('verifyCodes')) {
    console.log(`L${idx + 1}: ${line.trim()}`);
  }
});
