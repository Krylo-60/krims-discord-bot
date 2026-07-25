import puppeteer from 'puppeteer';

async function navigateToExistingListings() {
  console.log('[🚀 DASHBOARD INSPECTION] Navigating to existing server dashboards to manage existing listings...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    // 1. Minecraft-MP Dashboard
    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.bringToFront();
      await mcmpPage.goto('https://minecraft-mp.com/dashboard/', { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 3000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_existing_dashboard.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 MCMP EXISTING DASHBOARD SAVED!] Screenshot:', ssPath);
    }

    // 2. PlanetMinecraft Dashboard
    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();
      await pmcPage.goto('https://www.planetminecraft.com/account/manage/servers/', { waitUntil: 'domcontentloaded' });
      await new Promise(r => setTimeout(r, 3000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_existing_dashboard.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PMC EXISTING DASHBOARD SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Dashboard inspection error:', err.message);
  }
}

navigateToExistingListings();
