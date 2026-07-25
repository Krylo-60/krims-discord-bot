import puppeteer from 'puppeteer';

async function clickManageServers() {
  console.log('[🚀 MCMP MANAGE SERVERS] Clicking Manage Your Servers button...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.bringToFront();
      await mcmpPage.evaluate(() => {
        const btn = Array.from(document.querySelectorAll('a, button')).find(el => el.textContent.includes('Manage Your Servers'));
        if (btn) btn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_my_managed_servers.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 MCMP MY MANAGED SERVERS SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Manage servers error:', err.message);
  }
}

clickManageServers();
