import puppeteer from 'puppeteer';

async function setQueryDisabledPmc() {
  console.log('[🚀 PMC QUERY MODE] Setting Query Mode to Disabled on PlanetMinecraft...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      await pmcPage.evaluate(() => {
        const querySelect = document.querySelector('select[name="query_mode"], select[name="query"]');
        if (querySelect) {
          querySelect.value = 'none'; // or disabled
          querySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      await new Promise(r => setTimeout(r, 2000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_query_disabled.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 QUERY MODE UPDATED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Query mode error:', err.message);
  }
}

setQueryDisabledPmc();
