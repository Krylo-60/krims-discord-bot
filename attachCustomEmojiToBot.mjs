import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Attach custom emoji to claim_starter_role button
const oldButton = `.setCustomId('claim_starter_role')
                .setLabel('✅ Accept Rules & Claim KryloSMP Starter Role')
                .setStyle(ButtonStyle.Success)`;

const newButton = `.setCustomId('claim_starter_role')
                .setLabel('Accept Rules & Claim KryloSMP Starter Role')
                .setEmoji('1530370298262720722')
                .setStyle(ButtonStyle.Success)`;

content = content.replace(oldButton, newButton);

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 CUSTOM KRYLOSMP EMOJI ATTACHED TO BUTTON SUCCESSFULLY!]');
