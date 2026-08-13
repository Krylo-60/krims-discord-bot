import puppeteer from 'puppeteer';
import path from 'path';

async function checkCurrentState() {
  const res = await fetch('http://127.0.0.1:9222/json/version');
  const data = await res.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: data.webSocketDebuggerUrl });

  const pages = await browser.pages();
  console.log(`[+] Total pages: ${pages.length}`);

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const url = p.url();
    const title = await p.title();
    console.log(`Tab ${i}: "${title}" -> ${url}`);
    
    if (url.includes('play.hosting')) {
      const imgPath = `C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\tab_${i}_state.png`;
      await p.screenshot({ path: imgPath });
      console.log(`[📷 Screenshot saved to ${imgPath}]`);
    }
  }
}

checkCurrentState().catch(err => console.error('Error:', err.message));
