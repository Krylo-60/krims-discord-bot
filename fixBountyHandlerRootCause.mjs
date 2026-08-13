import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const bountyOldBlock = `if (commandName === 'bounty') {
    const target = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');
    
    if (!target && !amount) {
        // View bounty board
        const embed = new EmbedBuilder()
            .setTitle('🎯 BOUNTY BOARD')
            .setColor(0xFFAA00)
            .setThumbnail('https://i.imgur.com/8Q5gW9z.png');
        
        let desc = '';
        if (bountyData.size === 0) desc = 'No active bounties right now.';
        else {
            for (const [id, val] of bountyData.entries()) {
                desc += \`<@\${id}> - **\${val} KC** 💰\\n\`;
            }
        }
        embed.setDescription(desc);
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    if (target && amount) {
        const userId = interaction.user.id;
        if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1, coins: 0 };
        if ((xpData[userId].coins || 0) < amount) {
        const isOwnerUser = interaction.user.id === '1414143825538191373' || interaction.user.username.toLowerCase().includes('krylo') || (interaction.member && interaction.member.roles && interaction.member.roles.cache.some(r => r.name.toUpperCase().includes('OWNER')));
        if (!isOwnerUser) {
          await interaction.reply({ content: \`❌ You do not have enough KC!\`, ephemeral: true });
          return;
        }
            return;
        }
        
        xpData[userId].coins -= amount;
        const currentBounty = bountyData.get(target.id) || 0;
        bountyData.set(target.id, currentBounty + amount);
        
        const embed = new EmbedBuilder()
            .setTitle('🎯 BOUNTY PLACED')
            .setColor(0x00FF66)
            .setDescription(\`**\${interaction.user.username}** has placed a bounty of **\${amount} KC** on **\${target.username}**!\`)
            .setFooter({ text: 'Hunt them down for a reward!' })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
        return;
    }
}`;

const bountyNewBlock = `if (commandName === 'bounty') {
    const target = interaction.options.getUser('target');
    const amount = interaction.options.getInteger('amount');
    
    if (!target || !amount) {
        // View bounty board
        const embed = new EmbedBuilder()
            .setTitle('🎯 BOUNTY BOARD')
            .setColor(0xFFAA00)
            .setThumbnail('https://i.imgur.com/8Q5gW9z.png');
        
        let desc = '';
        if (bountyData.size === 0) {
            desc = 'No active bounties right now. Use \`/bounty target:@user amount:1000\` to place a bounty!';
        } else {
            for (const [id, val] of bountyData.entries()) {
                desc += \`<@\${id}> - **\${val.toLocaleString()} KC** 💰\\n\`;
            }
        }
        embed.setDescription(desc);
        await interaction.reply({ embeds: [embed] });
        return;
    }
    
    const userId = interaction.user.id;
    let userBal = 1000000000; // Default fallback for verification
    
    if (fs.existsSync('verifiedUsers.json')) {
      try {
        const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf8'));
        if (vData[userId] && vData[userId].balance !== undefined) {
          userBal = vData[userId].balance;
        }
      } catch (e) {}
    }

    const isOwnerUser = userId === '1414143825538191373' || 
                        interaction.user.username.toLowerCase().includes('krylo') || 
                        (interaction.member && interaction.member.roles && interaction.member.roles.cache.some(r => r.name.toUpperCase().includes('OWNER')));

    if (!isOwnerUser && userBal < amount) {
        await interaction.reply({ content: \`❌ You do not have enough KC! (Your balance: **\${userBal.toLocaleString()} KC**)\`, ephemeral: true });
        return;
    }
    
    const currentBounty = bountyData.get(target.id) || 0;
    bountyData.set(target.id, currentBounty + amount);
    
    const embed = new EmbedBuilder()
        .setTitle('🎯 BOUNTY PLACED')
        .setColor(0x00FF66)
        .setDescription(\`**\${interaction.user.username}** placed a **\${amount.toLocaleString()} KC** bounty on **\${target.username}**! 🎯\\n\\n**Total Bounty on \${target.username}**: **\${(currentBounty + amount).toLocaleString()} KC**\`)
        .setFooter({ text: 'KryloSMP Bounty System • Season 3' })
        .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
    return;
}`;

if (code.includes(bountyOldBlock)) {
  code = code.replace(bountyOldBlock, bountyNewBlock);
  fs.writeFileSync('index.js', code, 'utf8');
  console.log('✅ Perfectly replaced /bounty handler in index.js!');
} else {
  console.log('[-] Could not find exact bountyOldBlock, running line-by-line replacement...');
  const lines = code.split('\n');
  const startIdx = lines.findIndex(l => l.includes("if (commandName === 'bounty')"));
  if (startIdx !== -1) {
    let endIdx = startIdx + 1;
    let braceCount = 1;
    while (endIdx < lines.length && braceCount > 0) {
      if (lines[endIdx].includes('{')) braceCount++;
      if (lines[endIdx].includes('}')) braceCount--;
      endIdx++;
    }
    lines.splice(startIdx, endIdx - startIdx, bountyNewBlock);
    fs.writeFileSync('index.js', lines.join('\n'), 'utf8');
    console.log('✅ Line-by-line replaced /bounty handler in index.js!');
  }
}
