import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7';
const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';

async function launchBraveAndInspect() {
  console.log('[🌐 BRAVE LAUNCHER] Launching Brave browser in headless mode to inspect Discord...');

  try {
    const browser = await puppeteer.launch({
      executablePath: BRAVE_PATH,
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

    const screenshotPath = path.join(ARTIFACT_DIR, 'brave_discord_inspection.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    const title = await page.title();
    console.log(`Page Title: ${title}`);

    await browser.close();
    console.log('✅ Brave inspection script finished!');

  } catch (err) {
    console.error('Brave launch error:', err.message);
  }
}

launchBraveAndInspect();
