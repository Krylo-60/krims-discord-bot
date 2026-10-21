import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let s = fs.readFileSync(filePath, 'utf8');

// 1. Button handler insertion
const buttonTarget = `if (interaction.isButton() && interaction.customId.startsWith('btn_klipy_next_')) {\n    return await handleKlipyButtonInteraction(interaction);\n  }`.replace(/\n/g, '\r\n');
const buttonAddition = `\r\n\r\n  // 🔬 Handle Beta Feature Testing, Voting & Promotion Buttons\r\n  if (interaction.isButton() && interaction.customId.startsWith('beta_')) {\r\n    return await handleBetaInteraction(interaction, client);\r\n  }`;

if (s.includes(buttonTarget)) {
  s = s.replace(buttonTarget, buttonTarget + buttonAddition);
  console.log('[+] Added beta button handler to interactionCreate!');
} else {
  console.warn('[-] Could not find buttonTarget');
}

// 2. Slash command insertion
const slashTarget = `if (commandName === 'updates' || commandName === 'changelog') return handleUpdatesCommand(interaction);`.replace(/\n/g, '\r\n');
const slashAddition = `\r\n  if (commandName === 'betadrop' || commandName === 'incubate') return await dispatchWeeklyBetaDrop(client);`;

if (s.includes(slashTarget)) {
  s = s.replace(slashTarget, slashTarget + slashAddition);
  console.log('[+] Added betadrop slash command!');
} else {
  console.warn('[-] Could not find slashTarget');
}

// 3. Message command insertion
const msgTarget = `// Command: !updates, !changelog, !patchnotes`.replace(/\n/g, '\r\n');
const msgAddition = `// Command: !betadrop, !dropbeta, !incubate\r\n  if (lowerMsg === '!betadrop' || lowerMsg === '!dropbeta' || lowerMsg === '!incubate') {\r\n    await message.channel.sendTyping().catch(() => {});\r\n    return await dispatchWeeklyBetaDrop(client);\r\n  }\r\n\r\n  // Command: !promote\r\n  if (lowerMsg === '!promote' || lowerMsg.startsWith('!promote ')) {\r\n    await message.channel.sendTyping().catch(() => {});\r\n    return await promoteBetaFeatureToMain(client, null, message.author.tag);\r\n  }\r\n\r\n  `;

if (s.includes(msgTarget)) {
  s = s.replace(msgTarget, msgAddition + msgTarget);
  console.log('[+] Added betadrop and promote message commands!');
} else {
  console.warn('[-] Could not find msgTarget');
}

fs.writeFileSync(filePath, s, 'utf8');
console.log('[SUCCESS] index.js updated with weeklyFeatureIncubator!');
