import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let s = fs.readFileSync(filePath, 'utf8');

// 1. Add Import
const importTarget = `import {\r\n  registerAlphaBetaCommands,\r\n  handleAlphaCommand,\r\n  handleBetaCommand,\r\n  handleAlphaBetaMessage,\r\n  initAlphaBetaBotInstances\r\n} from './features/alphaBetaSuite.mjs';`;
const importAddition = `\r\nimport {\r\n  handlePremiumCommand,\r\n  handlePremiumMessage,\r\n  initPremiumBotInstance,\r\n  getGuildPremiumStatus\r\n} from './features/premiumManager.mjs';`;

if (s.includes(importTarget)) {
  s = s.replace(importTarget, importTarget + importAddition);
  console.log('[+] Added PremiumManager import!');
} else {
  const importTargetLF = importTarget.replace(/\r\n/g, '\n');
  const importAdditionLF = importAddition.replace(/\r\n/g, '\n');
  if (s.includes(importTargetLF)) {
    s = s.replace(importTargetLF, importTargetLF + importAdditionLF);
    console.log('[+] Added PremiumManager import (LF)!');
  } else {
    console.warn('[-] Import target not found');
  }
}

// 2. Add /premium slash command
const slashTarget = `if (commandName === 'alpha') return await handleAlphaCommand(interaction);\r\n  if (commandName === 'beta') return await handleBetaCommand(interaction);`;
const slashAddition = `\r\n  if (commandName === 'premium') return await handlePremiumCommand(interaction);`;

if (s.includes(slashTarget)) {
  s = s.replace(slashTarget, slashTarget + slashAddition);
  console.log('[+] Added /premium slash command!');
} else {
  console.warn('[-] Slash target not found');
}

// 3. Add !premium message command
const msgTarget = `// Command: !alpha, !beta\r\n  if (lowerMsg.startsWith('!alpha') || lowerMsg.startsWith('!beta')) {\r\n    return await handleAlphaBetaMessage(message);\r\n  }\r\n\r\n  `;
const msgAddition = `// Command: !premium\r\n  if (lowerMsg === '!premium' || lowerMsg.startsWith('!premium ')) {\r\n    const args = content.split(/\\s+/).slice(1);\r\n    await message.channel.sendTyping().catch(() => {});\r\n    return await handlePremiumMessage(message, args);\r\n  }\r\n\r\n  `;

if (s.includes(msgTarget)) {
  s = s.replace(msgTarget, msgAddition + msgTarget);
  console.log('[+] Added !premium message command!');
} else {
  console.warn('[-] Message target not found');
}

// 4. Add ready hook for initPremiumBotInstance
const readyTarget = `initAlphaBetaBotInstances();`;
const readyAddition = `\r\n    initPremiumBotInstance();`;

if (s.includes(readyTarget)) {
  s = s.replace(readyTarget, readyTarget + readyAddition);
  console.log('[+] Added initPremiumBotInstance to ready event!');
} else {
  console.warn('[-] Ready target not found');
}

fs.writeFileSync(filePath, s, 'utf8');
console.log('[SUCCESS] index.js updated with PremiumManager!');
