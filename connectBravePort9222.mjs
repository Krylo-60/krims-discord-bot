import puppeteer from 'puppeteer';

async function connectToBrave() {
  console.log('[🚀 CONNECTING TO RUNNING BRAVE BROWSER PORT 9222]...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    if (res.ok) {
      const data = await res.json();
      console.log('[+] Debugging data:', data);
      const browser = await puppeteer.connect({ browserWSEndpoint: data.webSocketDebuggerUrl });
      const pages = await browser.pages();
      console.log(`[+] Found ${pages.length} open tab(s).`);

      let page = pages.find(p => p.url().includes('play.hosting'));
      if (!page) {
        page = pages[0];
        await page.goto('https://panel.play.hosting/server/25a5d79a/settings', { waitUntil: 'networkidle2' });
      } else {
        await page.bringToFront();
        await page.goto('https://panel.play.hosting/server/25a5d79a/settings', { waitUntil: 'networkidle2' });
      }

      await new Promise(r => setTimeout(r, 3000));
      const screenshotPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\playhosting_sftp_settings.png';
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`[✅ SCREENSHOT SAVED AT: ${screenshotPath}]`);

      const text = await page.evaluate(() => document.body.innerText);
      console.log('[+] PAGE TEXT:');
      console.log(text.substring(0, 1500));
    } else {
      console.log('[-] Remote debugging port 9222 not open.');
    }
  } catch (err) {
    console.error('[-] Error connecting to Brave:', err.message);
  }
}

connectToBrave();
