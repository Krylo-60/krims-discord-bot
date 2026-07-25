import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-code-chatbot/api/chat.js';
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  "res.status(500).json({ error: 'Failed to process confirmation' });",
  "res.status(200).json({ ok: false, error: 'Invalid or expired verification code. Make sure you joined KryloSmp.play.hosting in Minecraft to view your code!' });"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 FIXED LINE 882 IN API/CHAT.JS!]');
