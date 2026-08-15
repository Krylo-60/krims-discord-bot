import fs from 'fs';

const content = fs.readFileSync('index.js', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes("commandName === 'ask'") || 
      line.includes("commandName === 'ai'") || 
      line.includes("commandName === 'chat'") || 
      line.includes("commandName === 'diagnose'") || 
      line.includes("btn_agree_rules") || 
      line.includes("btn_join_beta_roster")) {
    console.log(`Line ${i + 1}: ${line.trim()}`);
  }
}
