import puppeteer from 'puppeteer';

async function runListings() {
  console.log('[+] Fetching active Brave tabs on port 9222...');
  
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;
    console.log('[+] WebSocket Debugger URL:', wsEndpoint);

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();
    console.log(`[+] Connected to Brave! Found ${pages.length} open tab(s):`);
    
    for (let i = 0; i < pages.length; i++) {
      const title = await pages[i].title();
      const url = pages[i].url();
      console.log(`  Tab ${i + 1}: "${title}" -> ${url}`);
    }

    // 1. Find Disboard tab
    let disboardPage = pages.find(p => p.url().includes('disboard.org'));
    if (disboardPage) {
      console.log('\n[🚀 DISBOARD] Found Disboard tab! Navigating to add server...');
      await disboardPage.goto('https://disboard.org/server/add', { waitUntil: 'networkidle2' }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));
      
      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\disboard_add.png';
      await disboardPage.screenshot({ path: ssPath });
      console.log('[📸 Screenshot] Disboard screenshot saved:', ssPath);
    }

    // 2. Find Minecraft-MP tab
    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      console.log('\n[🚀 MINECRAFT-MP] Found Minecraft-MP tab! Navigating to server registration...');
      await mcmpPage.goto('https://minecraft-mp.com/dashboard/register/', { waitUntil: 'networkidle2' }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\minecraft_mp_register.png';
      await mcmpPage.screenshot({ path: ssPath });
      console.log('[📸 Screenshot] Minecraft-MP screenshot saved:', ssPath);
    }

    browser.disconnect();
    console.log('\n[✅ DONE] Browser control complete!');
  } catch (err) {
    console.error('[-] Error during browser control:', err.message);
  }
}

runListings();
