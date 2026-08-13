import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const targetOld = `        const userId = interaction.user.id;
        if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
        if ((xpData[userId].coins || 0) < amount) {
            await interaction.reply({ content: '❌ You do not have enough KC!', ephemeral: true });
            return;
        }`;

const targetNew = `        const userId = interaction.user.id;
        let userBal = 0;
        if (fs.existsSync('verifiedUsers.json')) {
          try {
            const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf8'));
            if (vData[userId] && vData[userId].balance !== undefined) {
              userBal = vData[userId].balance;
            }
          } catch (e) {}
        }
        if (userBal === 0 && xpData[userId]) {
          userBal = xpData[userId].coins || 0;
        }

        if (userBal < amount) {
            await interaction.reply({ content: \`❌ You do not have enough KC! (Your balance: **\${userBal.toLocaleString()} KC**) \`, ephemeral: true });
            return;
        }`;

if (code.includes(targetOld)) {
  code = code.replace(targetOld, targetNew);
  fs.writeFileSync('index.js', code, 'utf8');
  console.log('✅ Patched /bounty handler in index.js to read from verifiedUsers.json!');
} else {
  console.error('[-] Could not find targetOld in index.js');
}
