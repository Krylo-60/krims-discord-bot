import puppeteer from 'puppeteer';

async function fixListingPages() {
  console.log('[+] Connecting to Brave browser on port 9222...');
  
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    // 1. Fix Disboard page by navigating to dashboard and clicking Add Server
    let disboardPage = pages.find(p => p.url().includes('disboard.org'));
    if (!disboardPage) disboardPage = await browser.newPage();

    console.log('[🚀 FIX DISBOARD] Loading Disboard Dashboard...');
    await disboardPage.goto('https://disboard.org/dashboard/servers', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Click the teal "+ ADD NEW SERVER" button
    const addServerBtn = await disboardPage.$('a[href*="/server/add"], .button:has-text("ADD"), button:has-text("ADD")');
    if (addServerBtn) {
      console.log('[+] Found "+ ADD NEW SERVER" button! Clicking...');
      await addServerBtn.click();
      await new Promise(r => setTimeout(r, 3000));
    } else {
      // Evaluate click in browser console
      await disboardPage.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.includes('ADD NEW SERVER') || el.href?.includes('/server/add'));
        if (btn) btn.click();
      });
      await new Promise(r => setTimeout(r, 3000));
    }

    const disboardSS = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\disboard_fixed.png';
    await disboardPage.screenshot({ path: disboardSS });
    console.log('[📸 Screenshot] Disboard screenshot saved:', disboardSS);


    // 2. Fix Minecraft-MP page by navigating to user dashboard and clicking Register Server
    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (!mcmpPage) mcmpPage = await browser.newPage();

    console.log('[🚀 FIX MINECRAFT-MP] Loading Minecraft-MP Dashboard...');
    await mcmpPage.goto('https://minecraft-mp.com/dashboard/', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Click "Register a Server +" or "Your Server"
    await mcmpPage.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.includes('Register a Server') || el.textContent.includes('Your Server'));
      if (btn) btn.click();
    });
    await new Promise(r => setTimeout(r, 3000));

    const mcmpSS = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\minecraft_mp_fixed.png';
    await mcmpPage.screenshot({ path: mcmpSS });
    console.log('[📸 Screenshot] Minecraft-MP screenshot saved:', mcmpSS);

    browser.disconnect();
    console.log('[✅ FIXED] Both dashboard pages navigated successfully!');
  } catch (err) {
    console.error('[-] Error fixing pages:', err.message);
  }
}

fixListingPages();
