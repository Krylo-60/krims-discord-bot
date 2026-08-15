import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7';
const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const USER_DATA_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\BraveProfile';

async function configureVoiceAndIcon() {
  console.log('[+] Starting Pterodactyl automation for Voice Chat port fix and Logo upload...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: BRAVE_PATH,
      headless: false,
      defaultViewport: { width: 1366, height: 768 },
      userDataDir: USER_DATA_DIR,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (e) {
    console.log('Using default browser launch...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1366, height: 768 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  const page = await browser.newPage();
  
  // 1. Navigate to Console to reload voicechat
  console.log('[+] Navigating to Console...');
  await page.goto('https://panel.play.hosting/server/4fe61057', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 3000));

  const consoleShot = path.join(ARTIFACTS_DIR, 'panel_console_auto.png');
  await page.screenshot({ path: consoleShot });

  // 2. Navigate to voicechat config file
  console.log('[+] Navigating to Files: plugins/voicechat/voicechat-server.properties...');
  await page.goto('https://panel.play.hosting/server/4fe61057/files#%2Fplugins%2Fvoicechat', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 4000));

  const filesShot = path.join(ARTIFACTS_DIR, 'panel_voicechat_files.png');
  await page.screenshot({ path: filesShot });

  console.log('[+] Files page reached!');
  await browser.close();
}

configureVoiceAndIcon().catch(console.error);
