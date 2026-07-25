import puppeteer from 'puppeteer';

async function finalPmcClick() {
  console.log('[🚀 FINAL PLANETMINECRAFT PUBLISH] Clicking blue PUBLISH LIVE button...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.evaluate(() => {
        const pubBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => el.textContent.includes('PUBLISH LIVE') || el.value?.includes('PUBLISH LIVE'));
        if (pubBtn) pubBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_live_done.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT LIVE!] Final live screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Final PMC click error:', err.message);
  }
}

finalPmcClick();
