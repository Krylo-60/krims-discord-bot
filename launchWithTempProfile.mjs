import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\naina\\.gemini\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TEMP_USER_DATA = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\temp-chrome-profile';

async function launchWithTempProfile() {
  console.log('[🌐 CHROME TEMP PROFILE] Copying profile cookies/session to temp profile...');

  const srcDir = 'C:\\Users\\naina\\AppData\\Local\\Google\\Chrome\\User Data\\Default';
  const dstDir = path.join(TEMP_USER_DATA, 'Default');

  if (!fs.existsSync(dstDir)) {
    fs.mkdirSync(dstDir, { recursive: true });
  }

  // Copy Network / Cookies if present
  try {
    const cookiesSrc = path.join(srcDir, 'Network', 'Cookies');
    const cookiesDst = path.join(dstDir, 'Network');
    if (fs.existsSync(cookiesSrc)) {
      fs.mkdirSync(cookiesDst, { recursive: true });
      fs.copyFileSync(cookiesSrc, path.join(cookiesDst, 'Cookies'));
    }
  } catch (e) {}

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      userDataDir: TEMP_USER_DATA,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,800'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to Discord Web channel for Cookie Army (955159464435150930)...');
    await page.goto('https://discord.com/channels/955159464435150930/955159464972009514', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

    await new Promise(r => setTimeout(r, 2000));

    const screenshotPath = path.join(ARTIFACT_DIR, 'chrome_discord_captured.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    await browser.close();
  } catch (err) {
    console.error('Temp profile error:', err.message);
  }
}

launchWithTempProfile();
