import fs from 'fs';

const chatPath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-code-cli/src/chat.js';
let content = fs.readFileSync(chatPath, 'utf8').replace(/\r\n/g, '\n');

const target = `function showHelp(aiConfig) {
  console.log("");
  console.log(colors.brand("  ⚡ KRIMS CODE CLI COMMANDS"));
  console.log(separator("─"));
  console.log("");
  console.log(keyValue("/", "Show this help menu"));`;

const replacement = `function showHelp(aiConfig) {
  console.log("");
  console.log(colors.brand("  ⚡ KRIMS CODE CLI COMMANDS"));
  console.log(separator("─"));
  console.log("");
  console.log(keyValue("/claim", "Claim daily KryloCoins (KC) reward & streak bonus"));
  console.log(keyValue("/discord connect <id>", "Link your Discord account to earn +1,000 KC!"));
  console.log(keyValue("/discord", "View Discord sync status & connected KC balance"));
  console.log(keyValue("/", "Show this help menu"));`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(chatPath, content, 'utf8');
  console.log('SUCCESS: Patched showHelp in chat.js');
} else {
  console.error('Target not found in chat.js');
}
