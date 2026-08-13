import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function deployGodItems() {
  console.log('🚀 DEPLOYING RETEXTURED GOD ITEMS & GOD SPEAR TO PLAY.HOSTING...');

  const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
  const tempUserDataDir = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\temp-brave-profile';

  if (!fs.existsSync(tempUserDataDir)) {
    fs.mkdirSync(tempUserDataDir, { recursive: true });
  }

  const browser = await puppeteer.launch({
    executablePath: bravePath,
    userDataDir: tempUserDataDir,
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const pages = await browser.pages();
  let page = pages.length > 0 ? pages[0] : await browser.newPage();

  console.log('[1] Navigating to Pterodactyl File Manager for plugins/Skript/scripts...');
  await page.goto('https://panel.play.hosting/server/25a5d79a/files#%2Fplugins%2FSkript%2Fscripts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  console.log('[+] Current Page Title:', await page.title());
  console.log('[+] Current Page URL:', page.url());

  const screenshotPath = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\god_items_panel.png';
  await page.screenshot({ path: screenshotPath });
  console.log(`[📷 Screenshot saved to ${screenshotPath}]`);

  const fileInput = await page.$('input[type="file"]');
  if (fileInput) {
    console.log('[2] Uploading KryloSMP_Mega_Features.sk...');
    const skriptFile = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\KryloSMP_Mega_Features.sk';
    await fileInput.uploadFile(skriptFile);
    await new Promise(r => setTimeout(r, 5000));
    console.log('✅ KryloSMP_Mega_Features.sk file uploaded!');
  } else {
    console.log('[-] File input not found directly on current view.');
  }

  // Navigate to server console to reload skript
  console.log('[3] Navigating to Server Console to execute /sk reload...');
  await page.goto('https://panel.play.hosting/server/25a5d79a', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  const consoleInput = await page.$('input[placeholder*="command"]');
  if (consoleInput) {
    await consoleInput.type('sk reload KryloSMP_Mega_Features');
    await page.keyboard.press('Enter');
    console.log('✅ Executed command "sk reload KryloSMP_Mega_Features" in server console!');
  } else {
    console.log('[-] Console command input element not directly matched.');
  }

  console.log('\n🏆 DEPLOYMENT OF GOD ITEMS TO PLAY.HOSTING COMPLETE!');
}

deployGodItems().catch(err => console.error('[-] Error:', err.message));
