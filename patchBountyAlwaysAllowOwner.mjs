import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const targetOld = `        if (userBal < amount) {
            await interaction.reply({ content: \`❌ You do not have enough KC! (Your balance: **\${userBal.toLocaleString()} KC**)\`, ephemeral: true });
            return;
        }`;

const targetNew = `        const isOwnerUser = interaction.user.id === '1414143825538191373' || interaction.user.username.toLowerCase().includes('krylo') || (interaction.member && interaction.member.roles && interaction.member.roles.cache.some(r => r.name.toUpperCase().includes('OWNER')));
        if (!isOwnerUser && userBal < amount) {
            await interaction.reply({ content: \`❌ You do not have enough KC! (Your balance: **\${userBal.toLocaleString()} KC**)\`, ephemeral: true });
            return;
        }`;

if (code.includes(targetOld)) {
  code = code.replace(targetOld, targetNew);
  fs.writeFileSync('index.js', code, 'utf8');
  console.log('✅ Patched /bounty in index.js to ALWAYS bypass balance check for Owner!');
} else {
  // Replace fallback
  const lines = code.split('\n');
  const newLines = [];
  for (let l of lines) {
    if (l.includes("content: '❌ You do not have enough KC!'") || l.includes('❌ You do not have enough KC!')) {
      newLines.push("        const isOwnerUser = interaction.user.id === '1414143825538191373' || interaction.user.username.toLowerCase().includes('krylo') || (interaction.member && interaction.member.roles && interaction.member.roles.cache.some(r => r.name.toUpperCase().includes('OWNER')));");
      newLines.push("        if (!isOwnerUser) {");
      newLines.push("          await interaction.reply({ content: `❌ You do not have enough KC!`, ephemeral: true });");
      newLines.push("          return;");
      newLines.push("        }");
    } else {
      newLines.push(l);
    }
  }
  fs.writeFileSync('index.js', newLines.join('\n'), 'utf8');
  console.log('✅ Fallback patched all insufficient balance checks in index.js for Owner!');
}
