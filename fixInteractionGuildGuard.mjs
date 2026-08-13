import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const oldGuard = `client.on('interactionCreate', async (interaction) => {
  if (interaction.guildId !== '1524878881918685405') {
    if (interaction.isRepliable()) {
      await interaction.reply({ content: '❌ This bot is private to KryloSMP and cannot be used here!', ephemeral: true });
    }
    return;
  }`;

const newGuard = `client.on('interactionCreate', async (interaction) => {
  if (!interaction.guild) return;`;

if (code.includes(oldGuard)) {
  code = code.replace(oldGuard, newGuard);
  fs.writeFileSync('index.js', code);
  console.log('✅ Removed restrictive guild check from interactionCreate!');
} else {
  // Fallback regex replacement
  const guardIdx = code.indexOf("if (interaction.guildId !== '1524878881918685405')");
  if (guardIdx !== -1) {
    const endGuardIdx = code.indexOf('let guildConfig = null;', guardIdx);
    code = code.substring(0, guardIdx) + 'if (!interaction.guild) return;\n  ' + code.substring(endGuardIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Regex removed restrictive guild check from interactionCreate!');
  }
}
