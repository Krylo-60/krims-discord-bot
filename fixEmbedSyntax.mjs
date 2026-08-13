import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const brokenBlock = `        if (isOfflineMotd) {
          embed
            .setColor(0xFF3333)
            .setTitle('🔴 KryloSMP Server is OFFLINE')
            .setDescription('The Minecraft server is currently stopped or restarting.')
            .addFields(
              { name: '📡 Connection IP', value: KryloSmp.play.hosting, inline: false },
              { name: '🕒 Last Updated', value: <t::R>, inline: true }
            )
            .setFooter({ text: 'Auto-updating every 20 seconds' })
            .setTimestamp();`;

const fixedBlock = `        if (isOfflineMotd) {
          embed
            .setColor(0xFF3333)
            .setTitle('🔴 KryloSMP Server is OFFLINE')
            .setDescription('The Minecraft server is currently stopped or restarting.')
            .addFields(
              { name: '📡 Connection IP', value: '\`KryloSmp.play.hosting\`', inline: false },
              { name: '🕒 Last Updated', value: \`<t:\${unixTime}:R>\`, inline: true }
            )
            .setFooter({ text: 'Auto-updating every 20 seconds' })
            .setTimestamp();`;

if (code.includes(brokenBlock)) {
  code = code.replace(brokenBlock, fixedBlock);
  fs.writeFileSync('index.js', code);
  console.log('✅ Fixed syntax in index.js!');
} else {
  // Regex fallback
  code = code.replace(/value:\s*KryloSmp\.play\.hosting/g, "value: '`KryloSmp.play.hosting`'");
  code = code.replace(/value:\s*<t::R>/g, "value: `<t:${unixTime}:R>`");
  fs.writeFileSync('index.js', code);
  console.log('✅ Regex fixed syntax in index.js!');
}
