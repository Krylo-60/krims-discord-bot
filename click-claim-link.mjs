import puppeteer from 'puppeteer';

async function clickClaimLink() {
  console.log('[🚀 MCMP ALREADY REGISTERED] Clicking claim link to open live server page...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.evaluate(() => {
        const claimLink = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes('Click here to claim it'));
        if (claimLink) claimLink.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_live_claimed_server.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 MCMP LIVE REGISTERED SERVER PAGE SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Click claim error:', err.message);
  }
}

clickClaimLink();
