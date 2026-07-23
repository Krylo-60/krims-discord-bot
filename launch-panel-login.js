import { spawn } from 'child_process';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ChromeDevProfile';

console.log("Launching Chrome window to play.hosting panel...");
console.log("Please log in to your account in this window to authorize the scripts!");

const chromeProcess = spawn(chromePath, [
  '--remote-debugging-port=64359',
  `--user-data-dir=${userDataDir}`,
  'https://panel.play.hosting/login'
], { detached: true, stdio: 'ignore' });

chromeProcess.unref();
console.log("Chrome launched! Let me know in chat once you have logged in successfully.");
