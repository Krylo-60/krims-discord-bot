import puppeteer from 'puppeteer';

async function fixPmcInputs() {
  console.log('[🚀 FIXING PLANETMINECRAFT] Clearing typos and setting clean values...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      console.log('[+] Found PlanetMinecraft tab! Setting clean inputs...');

      await pmcPage.evaluate(() => {
        // Fix Server Title
        const titleInput = document.querySelector('input[name*="title"], input[id*="title"], input[placeholder*="title"]');
        if (titleInput) {
          titleInput.value = 'KryloSMP';
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          titleInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Fix IP / Domain
        const ipInput = document.querySelector('input[name*="ip"], input[name*="domain"], input[id*="ip"]');
        if (ipInput) {
          ipInput.value = 'KryloSmp.play.hosting';
          ipInput.dispatchEvent(new Event('input', { bubbles: true }));
          ipInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Click TEST CONNECTION button
        const testBtn = Array.from(document.querySelectorAll('button, a, input')).find(el => el.textContent.includes('TEST CONNECTION') || el.value?.includes('TEST CONNECTION'));
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_clean_fixed.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[📸 Screenshot] PlanetMinecraft clean inputs screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] PMC Fix error:', err.message);
  }
}

fixPmcInputs();
