import puppeteer from 'puppeteer';

async function clickRegisterServer() {
  console.log('[+] Connecting to Brave browser on port 9222...');
  
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      console.log('[🚀 MINECRAFT-MP] Clicking "Register a Server +" button on User Dashboard...');
      
      await mcmpPage.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('a, button, span')).find(el => 
          el.textContent.includes('Register a Server') || 
          (el.getAttribute('href') && el.getAttribute('href').includes('server/new'))
        );
        if (btn) btn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\minecraft_mp_form_opened.png';
      await mcmpPage.screenshot({ path: ssPath });
      console.log('[📸 Screenshot] Minecraft-MP form screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Click error:', err.message);
  }
}

clickRegisterServer();
