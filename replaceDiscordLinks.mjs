import fs from 'fs';
import path from 'path';

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === '.git' || file === 'BraveProfile') continue;

    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      replaceInDir(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.sk') || file.endsWith('.json') || file.endsWith('.yml')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('discord.gg/krylo') || content.includes('discord.gg/krylosmp')) {
        content = content.replace(/discord\.gg\/krylosmp/g, 'discord.gg/2hSXQKHvvX');
        content = content.replace(/discord\.gg\/krylo(?![a-zA-Z0-9])/g, 'discord.gg/2hSXQKHvvX');
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`[+] Replaced links in: ${file}`);
      }
    }
  }
}

replaceInDir('.');
console.log('[+] Link replacement complete!');
