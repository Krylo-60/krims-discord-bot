import fs from 'fs';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 💸 GIVE OWNER REAL DISCORD & IN-GAME MONEY (1,000,000,000 KC)
 */

async function main() {
  console.log('💸 Processing Real Money Deposit for Owner @Krylo (Krylo_MC)...\n');

  // 1. Update verifiedUsers.json
  let vData = {};
  if (fs.existsSync('verifiedUsers.json')) {
    try {
      vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf8'));
    } catch {}
  }

  vData['1414143825538191373'] = {
    discordId: '1414143825538191373',
    discordUsername: 'krylo_plays',
    mcUsername: 'Krylo_MC',
    balance: 1000000000,
    role: '👑 OWNER',
    verifiedAt: new Date().toISOString()
  };

  fs.writeFileSync('verifiedUsers.json', JSON.stringify(vData, null, 2), 'utf8');
  console.log('✅ Local verifiedUsers.json updated: @Krylo balance set to 1,000,000,000 KC!');

  // 2. Update Vercel Remote Economy API
  try {
    const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'admin_set_balance',
        username: 'krylo_plays',
        mcUsername: 'Krylo_MC',
        balance: 1000000000
      })
    });
    console.log('🌐 Vercel Remote Economy API updated:', res.status);
  } catch (e) {
    console.warn('[-] Remote API notice:', e.message);
  }

  // 3. Update index.js /balance handler to output exact real balance with number formatting
  let code = fs.readFileSync('index.js', 'utf8');
  const lines = code.split('\n');
  const newLines = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("commandName === 'balance'")) {
      newLines.push(lines[i]);
      newLines.push("    const targetUser = interaction.options.getUser('user') || interaction.user;");
      newLines.push("    let balance = 0;");
      newLines.push("");
      newLines.push("    // Read Real Balance from verifiedUsers.json");
      newLines.push("    if (fs.existsSync('verifiedUsers.json')) {");
      newLines.push("      try {");
      newLines.push("        const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf8'));");
      newLines.push("        if (vData[targetUser.id] && vData[targetUser.id].balance !== undefined) {");
      newLines.push("          balance = vData[targetUser.id].balance;");
      newLines.push("        }");
      newLines.push("      } catch (e) {}");
      newLines.push("    }");
      newLines.push("");
      newLines.push("    // Fetch Real Balance from Remote API if balance is 0");
      newLines.push("    if (balance === 0) {");
      newLines.push("      try {");
      newLines.push("        const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';");
      newLines.push("        const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {");
      newLines.push("          method: 'POST',");
      newLines.push("          headers: { 'Content-Type': 'application/json' },");
      newLines.push("          body: JSON.stringify({ action: 'get_config', guildId })");
      newLines.push("        });");
      newLines.push("        if (configRes.ok) {");
      newLines.push("          const config = await configRes.json();");
      newLines.push("          if (config.economyData && config.economyData[targetUser.username]) {");
      newLines.push("            balance = config.economyData[targetUser.username].balance || 0;");
      newLines.push("          }");
      newLines.push("        }");
      newLines.push("      } catch (e) {}");
      newLines.push("    }");
      newLines.push("");
      newLines.push("    const embed = new EmbedBuilder()");
      newLines.push("      .setColor(0xFFAA00)");
      newLines.push("      .setTitle(`💳 Wallet Balance - ${targetUser.username}`)");
      newLines.push("      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))");
      newLines.push("      .addFields(");
      newLines.push("        { name: '🪙 KryloCoins', value: `\`${balance.toLocaleString()} KC\``, inline: true },");
      newLines.push("        { name: '🔗 Server Status', value: '`Linked Account`', inline: true }");
      newLines.push("      )");
      newLines.push("      .setTimestamp();");
      newLines.push("    await interaction.reply({ embeds: [embed] });");
      newLines.push("    return;");
      newLines.push("  }");

      // Skip original /balance block
      while (i < lines.length && !lines[i].includes("await interaction.reply({ embeds: [embed] });")) {
        i++;
      }
      if (i < lines.length && lines[i+1] && lines[i+1].includes("return;")) {
        i += 2;
      }
      continue;
    }
    newLines.push(lines[i]);
  }

  fs.writeFileSync('index.js', newLines.join('\n'), 'utf8');
  console.log('✅ Real Balance system updated in index.js!');
}

main();
