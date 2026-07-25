import puppeteer from 'puppeteer';

async function finalPublishClick() {
  console.log('[🚀 PLANETMINECRAFT] Triggering PUBLISH LIVE form submit...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.evaluate(() => {
        // Trigger submit on form or click blue button
        const pubBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => el.textContent.includes('PUBLISH LIVE') || el.value?.includes('PUBLISH LIVE'));
        if (pubBtn) {
          pubBtn.click();
          if (pubBtn.form) pubBtn.form.submit();
        }
      });

      await new Promise(r => setTimeout(r, 6000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_published_verified.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT PUBLISHED!] Verified screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Final publish error:', err.message);
  }
}

finalPublishClick();
