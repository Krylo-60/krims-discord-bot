import puppeteer from 'puppeteer';

async function fillAndPublishPmc() {
  console.log('[🚀 PLANETMINECRAFT AUTOMATION] Completing all form fields and publishing PlanetMinecraft listing...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (!pmcPage) {
      pmcPage = await browser.newPage();
      await pmcPage.goto('https://www.planetminecraft.com/account/manage/servers/item/new/', { waitUntil: 'domcontentloaded' });
    }

    await pmcPage.bringToFront();
    await new Promise(r => setTimeout(r, 2000));

    await pmcPage.evaluate(() => {
      // 1. Page Content Description
      const descBox = document.querySelector('textarea[name="content"], textarea[name="description"], #content, .tinymce-editor, textarea');
      if (descBox) {
        descBox.value = 'Welcome to KryloSMP! High performance Java 1.26.2 & Bedrock cross-play Survival SMP with custom bot economy, rank perks, and daily rewards! Connect now at KryloSmp.play.hosting (Port: 19132 for Bedrock). Webstore: https://krylosmp-store.vercel.app';
        descBox.dispatchEvent(new Event('input', { bubbles: true }));
        descBox.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2. Website URL
      const webInput = document.querySelector('input[name="url"], input[name="website"], input[placeholder*="Full URL"]');
      if (webInput) {
        webInput.value = 'https://krylosmp-store.vercel.app';
        webInput.dispatchEvent(new Event('input', { bubbles: true }));
        webInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      const webTitle = document.querySelector('input[name="url_title"], input[placeholder*="Title"]');
      if (webTitle) {
        webTitle.value = 'KryloSMP Storefront';
        webTitle.dispatchEvent(new Event('input', { bubbles: true }));
        webTitle.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 3. Tags
      const tagInput = document.querySelector('input[name="tag"], #tag_input, input[placeholder*="tag"]');
      if (tagInput) {
        const tags = ['minecraft', 'smp', 'survival', 'crossplay', 'economy'];
        tags.forEach(t => {
          tagInput.value = t;
          tagInput.dispatchEvent(new Event('input', { bubbles: true }));
          const addBtn = document.querySelector('.add_tag, button[title*="Add"], #add_tag');
          if (addBtn) addBtn.click();
        });
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    // 4. Click PUBLISH LIVE
    await pmcPage.evaluate(() => {
      const pubBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => 
        el.textContent.toUpperCase().includes('PUBLISH LIVE') || el.value?.toUpperCase().includes('PUBLISH LIVE')
      );
      if (pubBtn) pubBtn.click();
    });

    await new Promise(r => setTimeout(r, 6000));

    const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_final_published_live.png';
    await pmcPage.screenshot({ path: ssPath, fullPage: true });
    console.log('[🎉 PLANETMINECRAFT PUBLISHED LIVE SUCCESSFULLY!] Screenshot saved:', ssPath);

    browser.disconnect();
  } catch (err) {
    console.error('[-] PlanetMinecraft publish error:', err.message);
  }
}

fillAndPublishPmc();
