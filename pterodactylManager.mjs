import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';

const ARTIFACTS_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7';
const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const USER_DATA_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\BraveProfile';

async function managePterodactyl() {
  console.log('[+] Launching browser for Pterodactyl access...');
  
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: BRAVE_PATH,
      headless: false,
      defaultViewport: { width: 1366, height: 768 },
      userDataDir: USER_DATA_DIR,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (err) {
    console.log('Fallback to default puppeteer chrome...');
    browser = await puppeteer.launch({
      headless: false,
      defaultViewport: { width: 1366, height: 768 },
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  const page = await browser.newPage();
  
  console.log('[+] Navigating to Pterodactyl Panel...');
  await page.goto('https://panel.play.hosting/server/4fe61057', { waitUntil: 'networkidle2', timeout: 30000 });

  await new Promise(r => setTimeout(r, 4000));

  const screenshotPath = path.join(ARTIFACTS_DIR, 'pterodactyl_server_status.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`[+] Saved screenshot to ${screenshotPath}`);

  // Check URL to see if login is needed or if already logged in
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  const pageTitle = await page.title();
  console.log('Page Title:', pageTitle);

  // If on server dashboard, check power status and settings
  if (currentUrl.includes('/server/4fe61057')) {
    console.log('[+] Successfully on server dashboard!');

    // Check if Stop button exists to stop server first
    try {
      const stopBtn = await page.$('button.btn-danger, button[aria-label="Stop"], button:has-text("Stop"), button:has-text("Kill")');
      if (stopBtn) {
        console.log('[+] Found stop/kill button, clicking to ensure server is offline...');
        await stopBtn.click();
        await new Promise(r => setTimeout(r, 5000));
      }
    } catch (e) {
      console.log('Stop button check:', e.message);
    }

    // Navigate to Settings tab
    console.log('[+] Navigating to Settings tab...');
    await page.goto('https://panel.play.hosting/server/4fe61057/settings', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));

    const settingsScreenshot = path.join(ARTIFACTS_DIR, 'pterodactyl_settings.png');
    await page.screenshot({ path: settingsScreenshot });
    console.log(`[+] Saved settings screenshot to ${settingsScreenshot}`);

    // Check for "Reinstall Server" button
    const buttons = await page.$$eval('button', btns => btns.map(b => ({ text: b.innerText.trim(), className: b.className })));
    console.log('Buttons on settings page:', buttons);
  }

  console.log('[+] Done checking.');
  await browser.close();
}

managePterodactyl().catch(console.error);
