import puppeteer from 'puppeteer';

async function submitFormDirect() {
  console.log('[🚀 DIRECT SUBMIT] Submitting form directly via DOM submit call...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.evaluate(() => {
        const form = document.querySelector('form');
        if (form) form.submit();
      });

      await new Promise(r => setTimeout(r, 6000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_dom_submitted_live.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 DOM SUBMIT COMPLETE] Live screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Direct submit error:', err.message);
  }
}

submitFormDirect();
