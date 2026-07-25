import puppeteer from 'puppeteer';

async function selectPingQueryModePmc() {
  console.log('[🚀 PMC QUERY MODE FIX] Setting Query Mode to Server Ping & Testing Connection...');

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
          // Select value 0 or 'disabled' / 'ping'
          querySelect.selectedIndex = 1; // Try second option
          querySelect.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const testBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.toUpperCase().includes('TEST CONNECTION') || el.value?.toUpperCase().includes('TEST CONNECTION')
        );
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_ping_connection_success.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PMC QUERY FIX COMPLETE!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Query mode fix error:', err.message);
  }
}

selectPingQueryModePmc();
