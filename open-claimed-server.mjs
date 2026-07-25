import puppeteer from 'puppeteer';

async function openClaimedServer() {
  console.log('[🚀 OPEN CLAIMED SERVER] Finding claim link href and navigating...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      const claimHref = await mcmpPage.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find(a => a.textContent.includes('Click here to claim it') || a.href.includes('claim') || a.href.includes('server'));
        return target ? target.href : null;
      });

      console.log('[+] Claim link href found:', claimHref);

      if (claimHref) {
        await mcmpPage.goto(claimHref, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 4000));
      }

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_live_server_page_final.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 LIVE MINECRAFT-MP PAGE SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Open claim error:', err.message);
  }
}

openClaimedServer();
