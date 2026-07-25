import puppeteer from 'puppeteer';

async function checkConnectionMcMp() {
  console.log('[🚀 MINECRAFT-MP] Clicking "Check the connection 🔄" button...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.evaluate(() => {
        const connBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.includes('Check the connection') || 
          el.value?.includes('Check the connection')
        );
        if (connBtn) connBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      // After connection check, click Register The Server
      await mcmpPage.evaluate(() => {
        const regBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => 
          el.textContent.includes('Register The Server') || 
          el.value?.includes('Register The Server')
        );
        if (regBtn) regBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\minecraft_mp_final_published.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 FINAL PUBLISHED SCREENSHOT] Minecraft-MP server published:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Check connection error:', err.message);
  }
}

checkConnectionMcMp();
