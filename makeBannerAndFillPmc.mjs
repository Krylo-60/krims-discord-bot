import puppeteer from 'puppeteer';
import Jimp from 'jimp';
import path from 'path';

async function makeBannerAndFillPmc() {
  console.log('[🚀 PMC BANNER & WEBSITE AUTOMATION] Creating 468x60 banner and filling form fields...');

  const srcImgPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\krylosmp_banner_1784407866751.png';
  const outBannerPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\krylosmp_468x60_banner.png';

  try {
    // 1. Resize banner to 468x60 using Jimp
    const img = await Jimp.read(srcImgPath);
    await img.cover(468, 60).writeAsync(outBannerPath);
    console.log('[+] 468x60 Banner created:', outBannerPath);

    // 2. Connect to Brave
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      // Fill Website URL & Title
      await pmcPage.evaluate(() => {
        const urlInputs = Array.from(document.querySelectorAll('input')).filter(i => 
          i.placeholder?.includes('URL') || i.name?.includes('url') || i.id?.includes('url')
        );
        if (urlInputs.length > 0) {
          urlInputs[0].value = 'https://krylosmp-store.vercel.app';
          urlInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          urlInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        }

        const titleInputs = Array.from(document.querySelectorAll('input')).filter(i => 
          i.placeholder?.includes('Title') || i.name?.includes('title')
        );
        if (titleInputs.length > 0) {
          titleInputs[0].value = 'KryloSMP Storefront';
          titleInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          titleInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      // Handle file upload if file input exists
      const fileInputs = await pmcPage.$$('input[type="file"]');
      if (fileInputs.length > 0) {
        console.log(`[+] Uploading banner file to ${fileInputs.length} file inputs...`);
        await fileInputs[0].uploadFile(outBannerPath);
        await new Promise(r => setTimeout(r, 2000));
      }

      await new Promise(r => setTimeout(r, 2000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_banner_and_website_uploaded.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PMC BANNER & WEBSITE POPULATED!] Screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Banner & Website automation error:', err.message);
  }
}

makeBannerAndFillPmc();
