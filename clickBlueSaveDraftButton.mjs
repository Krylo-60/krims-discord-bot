import puppeteer from 'puppeteer';

async function clickBlueSaveDraftButton() {
  console.log('[🚀 SAVE DRAFT CLICK] Specifically targeting and clicking blue SAVE DRAFT button...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      // Specifically find the SAVE DRAFT button
      const clicked = await pmcPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"], input[type="button"], a'));
        const saveDraftBtn = buttons.find(b => 
          (b.textContent && b.textContent.trim().toUpperCase() === 'SAVE DRAFT') ||
          (b.value && b.value.trim().toUpperCase() === 'SAVE DRAFT') ||
          (b.id && b.id.includes('draft'))
        );

        if (saveDraftBtn) {
          saveDraftBtn.scrollIntoView({ behavior: 'instant', block: 'center' });
          saveDraftBtn.click();
          return true;
        }
        return false;
      });

      console.log('[+] Save Draft button clicked:', clicked);
      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_clean_save_draft_done.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT CLEAN SAVE DRAFT COMPLETE!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Save Draft error:', err.message);
  }
}

clickBlueSaveDraftButton();
