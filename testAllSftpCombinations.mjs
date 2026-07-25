import { exec } from 'child_process';
import path from 'path';

const keyPath = 'C:\\Users\\naina\\.ssh\\antigravity_key';

// Possible username formats for Play Hosting Pterodactyl panel:
const usernames = [
  'krylobloxyt',
  'krylobloxyt.25a5d79a',
  'krylo',
  'krylo.25a5d79a',
  '25a5d79a'
];

const hosts = [
  'play-gb-ry-21.play.hosting',
  'panel.play.hosting',
  'sftp.play.hosting',
  'krylosmp.play.hosting'
];

async function testConnection() {
  console.log('[🚀 TESTING SFTP SSH KEY CONNECTION COMBINATIONS]...');

  for (const host of hosts) {
    for (const u of usernames) {
      console.log(`[+] Testing: ${u}@${host}:2022...`);
      const cmd = `ssh -i "${keyPath}" -o StrictHostKeyChecking=no -o ConnectTimeout=3 -p 2022 ${u}@${host} "ls"`;
      
      exec(cmd, (err, stdout, stderr) => {
        if (!err) {
          console.log(`[🎉 SUCCESSFUL CONNECT!] Username: ${u}, Host: ${host}`);
          console.log('Output:', stdout);
        }
      });
    }
  }
}

testConnection();
