import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let s = fs.readFileSync(filePath, 'utf8');

// 1. Add Import
const importTarget = `import {\r\n  dispatchWeeklyBetaDrop,\r\n  promoteBetaFeatureToMain,\r\n  handleBetaInteraction,\r\n  buildBetaDropEmbed\r\n} from './features/weeklyFeatureIncubator.mjs';`;
const importAddition = `\r\nimport {\r\n  registerAlphaBetaCommands,\r\n  handleAlphaCommand,\r\n  handleBetaCommand,\r\n  handleAlphaBetaMessage,\r\n  initAlphaBetaBotInstances\r\n} from './features/alphaBetaSuite.mjs';`;

if (s.includes(importTarget)) {
  s = s.replace(importTarget, importTarget + importAddition);
  console.log('[+] Added Alpha & Beta imports!');
} else {
  // Try LF variant
  const importTargetLF = importTarget.replace(/\r\n/g, '\n');
  const importAdditionLF = importAddition.replace(/\r\n/g, '\n');
  if (s.includes(importTargetLF)) {
    s = s.replace(importTargetLF, importTargetLF + importAdditionLF);
    console.log('[+] Added Alpha & Beta imports (LF)!');
  } else {
    console.warn('[-] Import target not found');
  }
}

// 2. Add Slash Command Dispatchers
const slashTarget = `if (commandName === 'betadrop' || commandName === 'incubate') return await dispatchWeeklyBetaDrop(client);`.replace(/\n/g, '\r\n');
const slashAddition = `\r\n  if (commandName === 'alpha') return await handleAlphaCommand(interaction);\r\n  if (commandName === 'beta') return await handleBetaCommand(interaction);`;

if (s.includes(slashTarget)) {
  s = s.replace(slashTarget, slashTarget + slashAddition);
  console.log('[+] Added /alpha and /beta slash commands to interactionCreate!');
} else {
  console.warn('[-] Slash target not found');
}

// 3. Add Prefix Message Handler
const msgTarget = `// Command: !betadrop, !dropbeta, !incubate`.replace(/\n/g, '\r\n');
const msgAddition = `// Command: !alpha, !beta\r\n  if (lowerMsg.startsWith('!alpha') || lowerMsg.startsWith('!beta')) {\r\n    return await handleAlphaBetaMessage(message);\r\n  }\r\n\r\n  `;

if (s.includes(msgTarget)) {
  s = s.replace(msgTarget, msgAddition + msgTarget);
  console.log('[+] Added !alpha and !beta message handlers!');
} else {
  console.warn('[-] Message target not found');
}

// 4. Add Startup Registration in ready event
const readyTarget = `console.log('[+] Persistent platform update message synced to Discord!');`.replace(/\n/g, '\r\n');
const readyAddition = `\r\n  // Register secret Alpha & Beta command suites in Support Server\r\n  try {\r\n    await registerAlphaBetaCommands(client);\r\n    initAlphaBetaBotInstances();\r\n  } catch (abErr) {\r\n    console.warn('[AlphaBeta] Startup notice:', abErr.message);\r\n  }`;

if (s.includes(readyTarget)) {
  s = s.replace(readyTarget, readyTarget + readyAddition);
  console.log('[+] Added ready hook registration for Alpha & Beta!');
} else {
  console.warn('[-] Ready target not found');
}

fs.writeFileSync(filePath, s, 'utf8');
console.log('[SUCCESS] index.js wired with Alpha & Beta suite!');
