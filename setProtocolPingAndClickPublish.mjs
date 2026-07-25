import puppeteer from 'puppeteer';

async function setProtocolPingAndClickPublish() {
  console.log('[🚀 PMC PUBLISH LIVE] Setting Query Mode to Server Ping (1.7+) and clicking PUBLISH LIVE...');

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
        const querySelect = document.querySelector('#query_mode, select[name="query_mode"]');
        if (querySelect) {
          querySelect.value = '1.7+'; // Try 1.7+ protocol
          if (!querySelect.value) querySelect.selectedIndex = 1;
          querySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const testBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.toUpperCase().includes('TEST CONNECTION') || el.value?.toUpperCase().includes('TEST CONNECTION')
        );
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      // Click PUBLISH LIVE
      await pmcPage.evaluate(() => {
        const pubBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          (el.textContent && el.textContent.toUpperCase().includes('PUBLISH LIVE')) ||
          (el.value && el.value.toUpperCase().includes('PUBLISH LIVE'))
        );
        if (pubBtn) pubBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_published_live_final.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT LIVE PUBLISH COMPLETE!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Publish live error:', err.message);
  }
}

setProtocolPingAndClickPublish();
