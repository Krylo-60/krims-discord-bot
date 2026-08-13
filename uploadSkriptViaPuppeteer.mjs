import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('[🚀 STARTING BROWSER AUTOMATION FOR PTERODACTYL PANEL]');

  let browser;
  try {
    // First try connecting to existing debugging port 9222
    console.log('[1] Trying to connect to port 9222...');
    browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    console.log('[+] Connected to existing Brave instance on port 9222!');
  } catch (err) {
    console.log('[!] Port 9222 not reachable, launching Brave directly...');
    const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
    const userDataDir = 'C:\\Users\\naina\\AppData\\Local\\BraveSoftware\\Brave-Browser\\User Data';
    
    browser = await puppeteer.launch({
      executablePath: bravePath,
      userDataDir: userDataDir,
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
  }

  const pages = await browser.pages();
  let page = pages.find(p => p.url().includes('play.hosting'));
  
  if (!page) {
    console.log('[+] Opening new tab for play.hosting panel...');
    page = await browser.newPage();
    await page.goto('https://panel.play.hosting/server/25a5d79a/files', { waitUntil: 'networkidle2' });
  } else {
    console.log('[+] Found active panel tab!');
    await page.bringToFront();
    await page.goto('https://panel.play.hosting/server/25a5d79a/files', { waitUntil: 'networkidle2' });
  }

  console.log('[+] Page loaded! Title:', await page.title());
  console.log('[+] Current URL:', page.url());

  // Screenshot current state
  const screenshotPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\panel_files_page.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`[📷 Screenshot saved to ${screenshotPath}]`);
}

main().catch(err => {
  console.error('[-] Error:', err.message);
});
