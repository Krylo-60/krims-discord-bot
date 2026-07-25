import fs from 'fs';
import path from 'path';
import os from 'os';

async function searchSshKeys() {
  console.log('[🚀 SEARCHING FOR ANTIGRAVITY SSH PRIVATE KEY]...');

  const searchDirs = [
    path.join(os.homedir(), '.ssh'),
    'C:\\Users\\naina\\.gemini\\antigravity',
    'C:\\Users\\naina\\.gemini\\antigravity\\scratch',
    'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot'
  ];

  for (const dir of searchDirs) {
    if (fs.existsSync(dir)) {
      console.log(`[+] Scanning directory: ${dir}`);
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.includes('id_') || file.includes('antigravity') || file.includes('key') || file.includes('pem') || file.includes('rsa')) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isFile()) {
            console.log(`📌 Found Key File: ${fullPath} (Size: ${stat.size} bytes)`);
          }
        }
      }
    }
  }
}

searchSshKeys();
