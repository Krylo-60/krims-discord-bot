import fs from 'fs';

const file = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/commands/masterCommandRegistry.mjs';
let content = fs.readFileSync(file, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

const target = `  ELITE_SMP_COMMAND_DEFINITION,

  new SlashCommandBuilder()
    .setName('clan')`;

const replacement = `  new SlashCommandBuilder()
    .setName('clan')`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  // Add export at the end
  if (!content.includes('export { ELITE_SMP_COMMAND_DEFINITION };')) {
    content += '\n\nexport { ELITE_SMP_COMMAND_DEFINITION };\n';
  }
  fs.writeFileSync(file, content, 'utf8');
  console.log('SUCCESS: Removed ELITE_SMP_COMMAND_DEFINITION from global masterCommandBuilders!');
} else {
  console.error('Target not found in masterCommandRegistry.mjs');
}
