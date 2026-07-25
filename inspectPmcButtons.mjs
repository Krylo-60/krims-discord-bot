import puppeteer from 'puppeteer';

async function inspectPmcButtons() {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      const btnInfo = await pmcPage.evaluate(() => {
        const els = Array.from(document.querySelectorAll('button, input, a, div.button, span.button'));
        return els.map(el => ({
          tag: el.tagName,
          id: el.id,
          name: el.getAttribute('name'),
          type: el.getAttribute('type'),
          class: el.className,
          text: el.textContent ? el.textContent.trim() : '',
          value: el.getAttribute('value')
        })).filter(b => b.text.includes('DRAFT') || b.text.includes('PUBLISH') || b.text.includes('SAVE') || (b.value && b.value.includes('DRAFT')));
      });

      console.log('[+] Target PMC buttons found:', JSON.stringify(btnInfo, null, 2));

      // Click the exact draft button found
      await pmcPage.evaluate(() => {
        const els = Array.from(document.querySelectorAll('button, input, a, div, span'));
        const draftEl = els.find(el => 
          (el.textContent && el.textContent.toUpperCase().includes('SAVE DRAFT')) ||
          (el.value && el.value.toUpperCase().includes('SAVE DRAFT')) ||
          (el.getAttribute('name') === 'op' && el.value?.includes('Draft'))
        );
        if (draftEl) draftEl.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_draft_button_inspected_clicked.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 SCREENSHOT SAVED]:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Inspect buttons error:', err.message);
  }
}

inspectPmcButtons();
