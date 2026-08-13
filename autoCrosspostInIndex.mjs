import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

// Update YouTube Auto-Notifier to crosspost
const oldYtSend = `const msg = await targetCh.send({
              content: \`Hey \${pingText} ! A new video has been uploaded by **Krylo (\${ytChan.handle})**, check it out \${link}\`,
              embeds: [embed],
              components: [row]
            });`;

const newYtSend = `const msg = await targetCh.send({
              content: \`Hey \${pingText} ! A new video has been uploaded by **Krylo (\${ytChan.handle})**, check it out \${link}\`,
              embeds: [embed],
              components: [row]
            });
            await msg.crosspost().catch(() => {});`;

if (code.includes(oldYtSend)) {
  code = code.replace(oldYtSend, newYtSend);
  console.log('✅ Added auto-crossposting to YouTube Auto-Notifier in index.js!');
}

// Update Stream Engine to crosspost
const oldStreamSend = `streamMsg = await textCh.send({
        content: '🔴 ' + pingText + ' **KRYLO IS NOW LIVE STREAMING MINECRAFT!** Check it out:',
        embeds: [embed],
        components: [row]
      });`;

const newStreamSend = `streamMsg = await textCh.send({
        content: '🔴 ' + pingText + ' **KRYLO IS NOW LIVE STREAMING MINECRAFT!** Check it out:',
        embeds: [embed],
        components: [row]
      });
      await streamMsg.crosspost().catch(() => {});`;

if (code.includes(oldStreamSend)) {
  code = code.replace(oldStreamSend, newStreamSend);
  console.log('✅ Added auto-crossposting to Stream Engine in index.js!');
}

fs.writeFileSync('index.js', code);
console.log('✅ index.js updated with auto-crossposting!');
