import puppeteer from 'puppeteer';

async function testPmcConn() {
  console.log('[🚀 PLANETMINECRAFT] Clicking TEST CONNECTION button...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.evaluate(() => {
        const testBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('TEST CONNECTION'));
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 6000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_test_conn_done.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT TEST CONNECTION COMPLETE!] Screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Test connection error:', err.message);
  }
}

testPmcConn();
