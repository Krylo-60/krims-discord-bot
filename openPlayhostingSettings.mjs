import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function openSettings() {
  console.log('[🚀 LAUNCHING BROWSER FOR PLAY HOSTING SETTINGS]...');

  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
      userDataDir: 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\BravePlayhostingProfile',
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();
    console.log('[+] Navigating to https://panel.play.hosting/server/25a5d79a/settings...');
    await page.goto('https://panel.play.hosting/server/25a5d79a/settings', { waitUntil: 'networkidle2' });

    await new Promise(r => setTimeout(r, 4000));

    const screenshotPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\playhosting_settings_page.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[✅ SCREENSHOT SAVED AT: ${screenshotPath}]`);

    const text = await page.evaluate(() => document.body.innerText);
    console.log('[+] Settings Text Extract:');
    console.log(text.substring(0, 1500));

  } catch (err) {
    console.error('[-] Error launching browser:', err.message);
  }
}

openSettings();
