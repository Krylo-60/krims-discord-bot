import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function uploadSkript() {
  console.log('[🚀 AUTOMATING SKRIPT UPLOAD TO PTERODACTYL PANEL]');

  const res = await fetch('http://127.0.0.1:9222/json/version');
  const data = await res.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: data.webSocketDebuggerUrl });

  const pages = await browser.pages();
  let page = pages.length > 0 ? pages[0] : await browser.newPage();

  console.log('[1] Navigating to Pterodactyl File Manager...');
  await page.goto('https://panel.play.hosting/server/25a5d79a/files', { waitUntil: 'networkidle2' });

  await new Promise(r => setTimeout(r, 4000));

  let url = page.url();
  console.log('[+] Current Page URL:', url);

  const screenshotDir = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c';
  await page.screenshot({ path: path.join(screenshotDir, 'panel_step1.png') });

  // If on login page or Cloudflare challenge page
  const title = await page.title();
  console.log('[+] Page Title:', title);

  // Check if we are inside the file manager or need to navigate into plugins/Skript/scripts
  // Let's check page HTML / elements
  const isFileManager = await page.evaluate(() => {
    return document.body.innerText.includes('File Manager') || document.body.innerText.includes('Name') || document.body.innerText.includes('Size');
  });

  console.log('[+] Is File Manager loaded?', isFileManager);

  if (isFileManager) {
    console.log('[2] Navigating to /plugins/Skript/scripts...');
    await page.goto('https://panel.play.hosting/server/25a5d79a/files#%2Fplugins%2FSkript%2Fscripts', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));
    await page.screenshot({ path: path.join(screenshotDir, 'panel_step2_scripts_folder.png') });

    // Look for upload button or file input
    const fileInput = await page.$('input[type="file"]');
    if (fileInput) {
      console.log('[+] Uploading KryloSMP2_0_Bridge.sk...');
      const skriptFile = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\KryloSMP2_0_Bridge.sk';
      await fileInput.uploadFile(skriptFile);
      await new Promise(r => setTimeout(r, 5000));
      await page.screenshot({ path: path.join(screenshotDir, 'panel_step3_uploaded.png') });
      console.log('[✅ SKRIPT FILE UPLOADED SUCCESSFULLY!]');
    } else {
      console.log('[-] File input element not found directly, capturing full layout...');
    }
  } else {
    console.log('[!] Need login or Cloudflare check on browser screen.');
  }

  const pageText = await page.evaluate(() => document.body.innerText.substring(0, 1000));
  console.log('[📋 PAGE TEXT]:\n', pageText);
}

uploadSkript().catch(err => console.error('[-] Error:', err.message));
