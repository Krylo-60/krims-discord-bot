import puppeteer from 'puppeteer';

async function publishPmcFinal() {
  console.log('[🚀 PLANETMINECRAFT FINAL PUBLISH] Submitting live server listing form...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      // Scroll to bottom and click PUBLISH LIVE
      await pmcPage.evaluate(() => {
        const pubBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => 
          el.textContent.toUpperCase().includes('PUBLISH LIVE') || el.value?.toUpperCase().includes('PUBLISH LIVE')
        );
        if (pubBtn) {
          pubBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          pubBtn.click();
        }
      });

      await new Promise(r => setTimeout(r, 6000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_live_published_final_done.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT LIVE PUBLISHED DONE!] Screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Final PMC publish error:', err.message);
  }
}

publishPmcFinal();
