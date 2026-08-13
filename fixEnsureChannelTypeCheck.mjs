import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const oldCheck = `let ch = guild.channels.cache.find(c => c.name.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().includes(cleanSearch) && c.type === ChannelType.GuildText);`;
const newCheck = `let ch = guild.channels.cache.find(c => c && c.name && c.name.replace(/[^a-zA-Z0-9-]/g, '').toLowerCase().includes(cleanSearch) && c.isTextBased());`;

if (code.includes(oldCheck)) {
  code = code.replace(oldCheck, newCheck);
  fs.writeFileSync('index.js', code);
  console.log('✅ Patched ensureChannel in index.js to match GuildAnnouncement news channels!');
} else {
  console.error('[-] Could not find oldCheck in index.js');
}
