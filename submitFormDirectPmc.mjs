import puppeteer from 'puppeteer';

async function submitFormDirectPmc() {
  console.log('[🚀 DIRECT PMC SUBMIT] Submitting form directly via submit button...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      // Submit form directly via DOM
      await pmcPage.evaluate(() => {
        const submitInput = document.querySelector('input[name="submit_item"], input[type="submit"]');
        if (submitInput) {
          submitInput.click();
        } else {
          const form = document.querySelector('form');
          if (form) form.submit();
        }
      });

      await new Promise(r => setTimeout(r, 6000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_dashboard_after_direct_submit.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 DIRECT FORM SUBMISSION COMPLETED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Direct submit error:', err.message);
  }
}

submitFormDirectPmc();
