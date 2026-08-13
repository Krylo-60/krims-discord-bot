import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function launchChromeAndInspect() {
  console.log('[🌐 CHROME LAUNCHER] Launching Google Chrome to inspect Discord...');

  try {
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
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

    const screenshotPath = path.join(ARTIFACT_DIR, 'chrome_discord_inspection.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Chrome Screenshot saved to: ${screenshotPath}`);

    const title = await page.title();
    console.log(`Page Title: ${title}`);

    await browser.close();
    console.log('✅ Chrome inspection script finished!');

  } catch (err) {
    console.error('Chrome launch error:', err.message);
  }
}

launchChromeAndInspect();
