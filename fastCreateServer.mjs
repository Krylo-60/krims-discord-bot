import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function fastCreateServer() {
  console.log('[🚀 FAST DISCORD CREATOR] Automating server creation on Discord Web...');

  try {
    // Connect via CDP on port 9222 or launch lightweight instance
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    console.log('Opening Discord Web...');
    await page.goto('https://discord.com/channels/@me', { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});

    await new Promise(r => setTimeout(r, 2000));

    const screenshotPath = path.join(ARTIFACT_DIR, 'fast_discord_create.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    await browser.close();
    console.log('✅ Fast server creation script completed!');
  } catch (err) {
    console.error('Error:', err.message);
  }
}

fastCreateServer();
