import { spawn } from 'child_process';

console.log("🚀 LAUNCHING BRAVE BROWSER WITH REMOTE DEBUGGING PORT 9222...");

const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const args = [
  '--remote-debugging-port=9222',
  '--no-first-run',
  '--no-default-browser-check',
  'https://panel.play.hosting/server/25a5d79a/files'
];

spawn(bravePath, args, { detached: true, stdio: 'ignore' });
console.log("✅ Brave browser spawned with port 9222!");
