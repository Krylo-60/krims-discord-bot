import puppeteer from 'puppeteer';

async function verifyOwnershipNowServerOnline() {
  console.log('[🚀 PMC LIVE VERIFICATION] Triggering connection test now that server is online...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      // Click TEST CONNECTION or CHECK MOTD
      await pmcPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input, a'));
        const testBtn = buttons.find(el => 
          el.textContent.toUpperCase().includes('TEST CONNECTION') ||
          el.textContent.toUpperCase().includes('CHECK MY SERVER') ||
          el.value?.toUpperCase().includes('TEST CONNECTION')
        );
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_ownership_verified_live.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PMC VERIFICATION SUCCESSFUL!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Live verification error:', err.message);
  }
}

verifyOwnershipNowServerOnline();
