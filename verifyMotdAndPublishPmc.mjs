import puppeteer from 'puppeteer';

async function verifyMotdAndPublishPmc() {
  console.log('[🚀 PMC MOTD VERIFICATION & PUBLISH] Clicking Check MOTD button...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      // Click "CHECK MY SERVER'S MOTD FOR THE CODE"
      await pmcPage.evaluate(() => {
        const checkBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.includes("CHECK MY SERVER'S MOTD") || el.value?.includes("CHECK MY SERVER'S MOTD")
        );
        if (checkBtn) checkBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      // Click PUBLISH LIVE
      await pmcPage.evaluate(() => {
        const pubBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => 
          el.textContent.toUpperCase().includes('PUBLISH LIVE') || el.value?.toUpperCase().includes('PUBLISH LIVE')
        );
        if (pubBtn) pubBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_motd_verified_published.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT MOTD VERIFIED & PUBLISHED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] PMC MOTD verify error:', err.message);
  }
}

verifyMotdAndPublishPmc();
