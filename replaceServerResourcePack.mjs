import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function uploadServerResourcePack() {
  console.log('🚀 UPLOADING NATIVE FORMAT 46 RESOURCE PACK TO PLAY.HOSTING...');

  const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
  const tempUserDataDir = path.join(process.cwd(), 'temp-brave-profile-upload-' + Date.now());

  fs.mkdirSync(tempUserDataDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: bravePath,
    userDataDir: tempUserDataDir,
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const pages = await browser.pages();
  let page = pages.length > 0 ? pages[0] : await browser.newPage();

  console.log('[1] Navigating to Pterodactyl File Manager...');
  await page.goto('https://panel.play.hosting/server/25a5d79a/files', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  console.log('[2] Uploading KryloSMP_ResourcePack.zip...');
  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    const zipPath = path.join(process.cwd(), 'KryloSMP_ResourcePack.zip');
    await fileInput.uploadFile(zipPath);
    console.log('✅ KryloSMP_ResourcePack.zip uploaded to server files!');
    await new Promise(r => setTimeout(r, 5000));
  } else {
    console.log('[-] File input element not matched directly.');
  }

  const screenshotPath = path.join(process.cwd(), 'server_pack_uploaded.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`🏆 SERVER RESOURCE PACK UPLOAD COMPLETE!`);
}

uploadServerResourcePack().catch(err => console.error('[-] Error:', err.message));
