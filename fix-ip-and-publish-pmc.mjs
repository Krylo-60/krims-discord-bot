import puppeteer from 'puppeteer';

async function fixIpAndPublishPmc() {
  console.log('[🚀 PLANETMINECRAFT] Setting exact clean IP KryloSmp.play.hosting and clicking PUBLISH LIVE...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.evaluate(() => {
        // Find IP input field specifically by inspecting all visible text inputs
        const inputs = Array.from(document.querySelectorAll('input[type="text"], input:not([type])'));
        const ipField = inputs.find(i => 
          (i.parentElement && i.parentElement.textContent.includes('IP/Domain')) || 
          i.name?.includes('ip') || 
          i.name?.includes('domain') || 
          i.id?.includes('ip')
        );

        if (ipField) {
          ipField.value = 'KryloSmp.play.hosting';
          ipField.dispatchEvent(new Event('input', { bubbles: true }));
          ipField.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Also test connection if button exists
        const testBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('TEST CONNECTION'));
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 3000));

      // Click blue PUBLISH LIVE button
      await pmcPage.evaluate(() => {
        const pubBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => el.textContent.includes('PUBLISH LIVE') || el.value?.includes('PUBLISH LIVE'));
        if (pubBtn) pubBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_published_success_final.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT PUBLISHED!] Final screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] PMC Publish Error:', err.message);
  }
}

fixIpAndPublishPmc();
