import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

async function executeGodFood() {
  console.log('🚀 EXECUTING GOD FOOD & CLEAR INVENTORY COMMANDS FOR Krylo_MC...');

  const bravePath = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
  const tempUserDataDir = path.join(process.cwd(), 'temp-brave-profile-gf-' + Date.now());

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

  console.log('[1] Navigating to Server Console at panel.play.hosting...');
  await page.goto('https://panel.play.hosting/server/25a5d79a', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  const consoleInput = await page.$('input[placeholder*="command"]');
  if (!consoleInput) {
    console.error('[-] Console input element not found. Please log in or check panel layout.');
    await browser.close();
    return;
  }

  const commands = [
    "sk reload KryloSMP_Mega_Features",
    "minecraft:clear Krylo_MC",
    "godkit Krylo_MC",
    "godfood Krylo_MC",
    "minecraft:effect give Krylo_MC saturation 10 255",
    "minecraft:effect give Krylo_MC health_boost 999999 15",
    "minecraft:effect give Krylo_MC instant_health 1 205"
  ];

  console.log('[2] Sending commands to console...');
  for (const cmd of commands) {
    await consoleInput.type(cmd);
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 600));
    console.log(`  ✅ Executed: ${cmd}`);
  }

  const screenshotPath = path.join(process.cwd(), 'godfood_given_final.png');
  await page.screenshot({ path: screenshotPath });
  console.log(`\n🏆 GOD FOOD & +30 HEARTS EXECUTED IN CONSOLE FOR Krylo_MC!`);
}

executeGodFood().catch(err => console.error('[-] Error:', err.message));
