import puppeteer from 'puppeteer';

async function savePmcDraftNow() {
  console.log('[🚀 SAVE PMC DRAFT] Clicking SAVE DRAFT to store server listing in PlanetMinecraft dashboard...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      // Click SAVE DRAFT
      await pmcPage.evaluate(() => {
        const draftBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.toUpperCase().includes('SAVE DRAFT') || el.value?.toUpperCase().includes('SAVE DRAFT')
        );
        if (draftBtn) {
          draftBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
          draftBtn.click();
        }
      });

      await new Promise(r => setTimeout(r, 6000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_draft_saved_in_dashboard.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT DRAFT SAVED!] Screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Save draft error:', err.message);
  }
}

savePmcDraftNow();
