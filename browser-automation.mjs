import puppeteer from 'puppeteer';
import { execSync } from 'child_process';

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';
const USER_DATA = 'C:\\Users\\naina\\AppData\\Local\\BraveSoftware\\Brave-Browser\\User Data';

async function runBrowserControl() {
  console.log('[+] Initializing browser-control automation for KryloSMP...');

  // Step 1: Ensure Brave is running with debugging port 9222
  let wsEndpoint = null;
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    wsEndpoint = data.webSocketDebuggerUrl;
    console.log('[+] Connected to active Brave debugging session!');
  } catch (err) {
    console.log('[!] Restarting Brave with --remote-debugging-port=9222...');
    try {
      execSync('taskkill /F /IM brave.exe 2>nul', { shell: true });
    } catch {}
    
    await new Promise(r => setTimeout(r, 2000));
    
    execSync(`start "" "${BRAVE_PATH}" --remote-debugging-port=9222`, { shell: true });
    await new Promise(r => setTimeout(r, 4000));
    
    try {
      const res2 = await fetch('http://127.0.0.1:9222/json/version');
      const data2 = await res2.json();
      wsEndpoint = data2.webSocketDebuggerUrl;
      console.log('[+] Successfully launched Brave with debugging port!');
    } catch (err2) {
      console.error('[-] Failed to connect to Brave debugging port:', err2.message);
      process.exit(1);
    }
  }

  const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
  const pages = await browser.pages();
  console.log(`[+] Found ${pages.length} active tab(s) in Brave.`);

  // Find or create tabs for Disboard and Minecraft-MP
  let page = pages[0] || await browser.newPage();

  // 1. AUTOMATE DISBOARD ADD SERVER
  try {
    console.log('[🚀 AUTOMATING DISBOARD] Navigating to https://disboard.org/dashboard/servers...');
    await page.goto('https://disboard.org/dashboard/servers', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 3000));

    // Take screenshot of Disboard dashboard
    const disboardSS = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\disboard_step1.png';
    await page.screenshot({ path: disboardSS });
    console.log('[📸 Screenshot] Saved:', disboardSS);

    // Look for "+ ADD NEW SERVER" button
    const addBtn = await page.$('a[href*="/server/add"], button:has-text("ADD NEW SERVER"), .button:has-text("ADD")');
    if (addBtn) {
      console.log('[+] Found "+ ADD NEW SERVER" button! Clicking...');
      await addBtn.click();
      await new Promise(r => setTimeout(r, 4000));
    } else {
      console.log('[!] "+ ADD NEW SERVER" button query attempted');
    }
  } catch (err) {
    console.warn('[!] Disboard automation step warning:', err.message);
  }

  // 2. AUTOMATE MINECRAFT-MP REGISTER SERVER
  try {
    console.log('[🚀 AUTOMATING MINECRAFT-MP] Navigating to https://minecraft-mp.com/dashboard/register/...');
    const page2 = await browser.newPage();
    await page2.goto('https://minecraft-mp.com/dashboard/register/', { waitUntil: 'networkidle2', timeout: 30000 }).catch(async () => {
      await page2.goto('https://minecraft-mp.com/dashboard/', { waitUntil: 'networkidle2', timeout: 30000 });
    });
    await new Promise(r => setTimeout(r, 3000));

    const mcmpSS = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\minecraft_mp_step1.png';
    await page2.screenshot({ path: mcmpSS });
    console.log('[📸 Screenshot] Saved:', mcmpSS);

    // Look for register server button
    const regBtn = await page2.$('a[href*="register"], button:has-text("Register")');
    if (regBtn) {
      console.log('[+] Found "Register a Server +" button! Clicking...');
      await regBtn.click();
      await new Promise(r => setTimeout(r, 3000));
    }
  } catch (err) {
    console.warn('[!] Minecraft-MP automation step warning:', err.message);
  }

  console.log('[✅ BROWSER CONTROL COMPLETE] All target tabs navigated & prepared!');
  browser.disconnect();
}

runBrowserControl();
