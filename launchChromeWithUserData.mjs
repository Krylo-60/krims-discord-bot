import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const USER_DATA_DIR = 'C:\\Users\\naina\\AppData\\Local\\Google\\Chrome\\User Data';

async function launchChromeWithProfile() {
  console.log('[🌐 CHROME PROFILE INSPECTOR] Launching Chrome with User Profile to inspect Discord Web...');

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      userDataDir: USER_DATA_DIR,
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--window-size=1280,800',
        '--profile-directory=Default'
      ]
    });

    const pages = await browser.pages();
    let page = pages[0];
    if (!page) page = await browser.newPage();

    await page.setViewport({ width: 1280, height: 800 });

    console.log('Navigating to Discord Web channel for Cookie Army (955159464435150930)...');
    await page.goto('https://discord.com/channels/955159464435150930/955159464972009514', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

    // Wait 3 seconds for UI rendering
    await new Promise(r => setTimeout(r, 3000));

    const screenshotPath = path.join(ARTIFACT_DIR, 'chrome_logged_in_discord.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Logged-in Chrome Screenshot saved to: ${screenshotPath}`);

    const title = await page.title();
    console.log(`Page Title: ${title}`);

    browser.disconnect();
    console.log('✅ Chrome Profile inspection complete!');

  } catch (err) {
    console.error('Chrome profile error:', err.message);
  }
}

launchChromeWithProfile();
