import puppeteer from 'puppeteer';

async function checkBravePmcTab() {
  console.log('[🔍 PMC TAB INSPECTION] Connecting to Brave debugging port 9222...');
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    console.log('[+] Open Browser Tabs:');
    pages.forEach((p, idx) => console.log(`  [${idx}] ${p.url()}`));

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();
      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\birthday_pmc_tab_view.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PMC TAB SCREENSHOT SAVED]:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Brave inspection error:', err.message);
  }
}

checkBravePmcTab();
