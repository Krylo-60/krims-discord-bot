import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// Replace the status check logic in updateStatus
const oldCheck = `if (data.online) {
        const onlineCount = data.players.online;
        const maxCount = data.players.max;
        const playerList = data.players.list ? data.players.list.map(p => \`• \\\`\${p}\\\`\`).join('\\n') : 'No players currently online.';
        const motd = data.motd.clean ? data.motd.clean.join('\\n') : 'KryloSMP Minecraft Server';`;

const newCheck = `if (data.online) {
        const onlineCount = data.players ? data.players.online : 0;
        const maxCount = data.players ? data.players.max : 0;
        const playerList = (data.players && data.players.list && data.players.list.length > 0) ? data.players.list.map(p => \`• \\\`\${p}\\\`\`).join('\\n') : 'No players currently online.';
        const motd = (data.motd && data.motd.clean) ? data.motd.clean.join('\\n') : 'KryloSMP Minecraft Server';
        
        const isOfflineMotd = motd.toLowerCase().includes('currently offline') || motd.toLowerCase().includes('server is offline');
        
        if (isOfflineMotd) {
          embed
            .setColor(0xFF3333)
            .setTitle('🔴 KryloSMP Server is OFFLINE')
            .setDescription('The Minecraft server is currently stopped or restarting.')
            .addFields(
              { name: '📡 Connection IP', value: '\`KryloSmp.play.hosting\`', inline: false },
              { name: '🕒 Last Updated', value: \`<t:\${unixTime}:R>\`, inline: true }
            )
            .setFooter({ text: 'Auto-updating every 20 seconds' })
            .setTimestamp();

          client.user.setActivity('KryloSMP (Offline)', { type: 0 });
          
          try {
            const messages = await channel.messages.fetch({ limit: 10 });
            const botMessages = messages.filter(m => m.author.id === client.user.id);
            for (const [, msg] of botMessages) {
              await msg.delete().catch(() => {});
            }
          } catch (err) {}

          await channel.send({ embeds: [embed] });
          return;
        }`;

if (code.includes(oldCheck)) {
  code = code.replace(oldCheck, newCheck);
  fs.writeFileSync('index.js', code);
  console.log('✅ Updated status tracking logic in index.js to accurately detect PlayHosting offline MOTD!');
} else {
  console.error('[-] Could not find oldCheck pattern in index.js');
}
