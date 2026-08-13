import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const targetCode = `      if (data.online) {
        const onlineCount = data.players.online;
        const maxCount = data.players.max;
        const playerList = data.players.list ? data.players.list.map(p => \`• \\\`\${p}\\\`\`).join('\\n') : 'No players currently online.';
        const motd = data.motd.clean ? data.motd.clean.join('\\n') : 'KryloSMP Minecraft Server';

        embed
          .setColor(0x00FF66)
          .setTitle('🟢 KryloSMP Server is ONLINE')`;

const replacementCode = `      if (data.online) {
        const onlineCount = data.players ? data.players.online : 0;
        const maxCount = data.players ? data.players.max : 0;
        const playerList = (data.players && data.players.list && data.players.list.length > 0) ? data.players.list.map(p => \`• \\\`\${p}\\\`\`).join('\\n') : 'No players currently online.';
        const motd = (data.motd && data.motd.clean) ? data.motd.clean.join('\\n') : 'KryloSMP Minecraft Server';

        const isOfflineMotd = motd.toLowerCase().includes('currently offline') || motd.toLowerCase().includes('server is offline') || maxCount === 0;

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
        } else {
          embed
            .setColor(0x00FF66)
            .setTitle('🟢 KryloSMP Server is ONLINE')`;

if (code.includes(targetCode)) {
  code = code.replace(targetCode, replacementCode);
  fs.writeFileSync('index.js', code);
  console.log('✅ Successfully patched startLiveStatusUpdate in index.js!');
} else {
  console.error('[-] Target code not found in index.js');
}
