import puppeteer from 'puppeteer';

async function inspectAllInputsPmc() {
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      const inputs = await pmcPage.evaluate(() => {
        return Array.from(document.querySelectorAll('input, select, textarea')).map(i => ({
          tag: i.tagName,
          id: i.id,
          name: i.getAttribute('name'),
          placeholder: i.getAttribute('placeholder'),
          type: i.getAttribute('type'),
          value: i.value
        }));
      });

      console.log('[+] All Inputs on PMC Page:', JSON.stringify(inputs, null, 2));

      // Injected IP cleanly
      await pmcPage.evaluate(() => {
        const domainInput = document.querySelector('input[name="ip_domain"], input[id*="ip"], input[id*="domain"], input[name*="domain"], input[name*="host"]');
        if (domainInput) {
          domainInput.value = 'KryloSmp.play.hosting';
          domainInput.dispatchEvent(new Event('input', { bubbles: true }));
          domainInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const testBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.toUpperCase().includes('TEST CONNECTION') || el.value?.toUpperCase().includes('TEST CONNECTION')
        );
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_exact_ip_tested.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 SCREENSHOT SAVED]:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Inspect inputs error:', err.message);
  }
}

inspectAllInputsPmc();
