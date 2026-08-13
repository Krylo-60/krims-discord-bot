import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Connecting to Brave browser via debugging port 9222 or launching isolated profile...');
  const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
  const customProfile = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\BraveProfile';

  let browser;
  try {
    // First try connecting to existing debugging port if available
    browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' });
    console.log('[+] Connected to active Brave debugging session!');
  } catch (e) {
    console.log('No active debug port found, launching Brave with isolated profile...');
    browser = await puppeteer.launch({
      executablePath: bravePath,
      userDataDir: customProfile,
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
  }

  const page = await browser.newPage();
  console.log('Navigating to Firebase Console settings for krylosmp...');
  
  try {
    await page.goto('https://console.firebase.google.com/project/krylosmp/settings/general', { waitUntil: 'networkidle2', timeout: 35000 });
  } catch (e) {
    console.log('Navigation completed or timed out, evaluating page...');
  }

  await new Promise(r => setTimeout(r, 5000));

  const screenshotPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7\\firebase_krylosmp_screen.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('[+] Screenshot saved to:', screenshotPath);

  const title = await page.title();
  console.log('Page Title:', title);

  const url = page.url();
  console.log('Page URL:', url);
}

main().catch(err => console.error('Browser error:', err));
