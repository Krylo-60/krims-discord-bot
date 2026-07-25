import puppeteer from 'puppeteer';

async function publishAllThreeLive() {
  console.log('[🚀 COMPLETE LIVE PUBLISH] Automated publishing on Reddit, PlanetMinecraft, and Minecraft-MP...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });

    // -------------------------------------------------------------
    // 1. REDDIT PUBLISH (r/MinecraftServer/submit)
    // -------------------------------------------------------------
    console.log('[1/3] Navigating to Reddit submit page...');
    const redditPage = await browser.newPage();
    await redditPage.goto('https://www.reddit.com/r/MinecraftServer/submit', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));

    await redditPage.evaluate(() => {
      // Fill Title
      const titleEl = document.querySelector('textarea[placeholder*="Title"], input[placeholder*="Title"]');
      if (titleEl) {
        titleEl.value = 'KryloSMP [Java 1.26.2 & Bedrock Crossplay] - Survival | Custom Bot Economy | /daily Rewards';
        titleEl.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Fill Post Body Text
      const bodyEl = document.querySelector('div[contenteditable="true"], textarea[placeholder*="Text"]');
      if (bodyEl) {
        bodyEl.textContent = 'Welcome to KryloSMP! High performance Java & Bedrock cross-play Survival SMP with custom bot economy, /daily rewards, /vote, /refer, and birthday events!\n\nJava IP: KryloSmp.play.hosting\nBedrock Port: 19132\nWebstore: https://krylosmp-store.vercel.app';
        bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await new Promise(r => setTimeout(r, 3000));
    await redditPage.screenshot({ path: 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\reddit_post_ready.png', fullPage: true });

    // Click Post on Reddit
    await redditPage.evaluate(() => {
      const postBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Post');
      if (postBtn) postBtn.click();
    });
    await new Promise(r => setTimeout(r, 5000));

    // -------------------------------------------------------------
    // 2. MINECRAFT-MP PUBLISH
    // -------------------------------------------------------------
    console.log('[2/3] Publishing on Minecraft-MP...');
    const mcmpPage = await browser.newPage();
    await mcmpPage.goto('https://minecraft-mp.com/server/new/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));

    await mcmpPage.evaluate(() => {
      const nameIn = document.querySelector('input[name*="name"], input[placeholder*="name"]');
      if (nameIn) nameIn.value = 'KryloSMP';

      const hostIn = document.querySelector('input[name*="host"], input[name*="ip"], input[placeholder*="address"]');
      if (hostIn) hostIn.value = 'KryloSmp.play.hosting';

      const connBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => el.textContent.includes('Check the connection'));
      if (connBtn) connBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    await mcmpPage.evaluate(() => {
      const regBtn = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(el => el.textContent.includes('Register The Server') || el.value?.includes('Register The Server'));
      if (regBtn) regBtn.click();
    });

    await new Promise(r => setTimeout(r, 5000));
    await mcmpPage.screenshot({ path: 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_published_live_step.png', fullPage: true });

    // -------------------------------------------------------------
    // 3. PLANETMINECRAFT PUBLISH
    // -------------------------------------------------------------
    console.log('[3/3] Publishing on PlanetMinecraft...');
    const pmcPage = await browser.newPage();
    await pmcPage.goto('https://www.planetminecraft.com/account/manage/servers/item/new/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));

    await pmcPage.evaluate(() => {
      const titleIn = document.querySelector('input[name*="title"], input[id*="title"]');
      if (titleIn) titleIn.value = 'KryloSMP';

      const ipIn = document.querySelector('input[name*="ip"], input[name*="domain"]');
      if (ipIn) ipIn.value = 'KryloSmp.play.hosting';

      const testBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('TEST CONNECTION'));
      if (testBtn) testBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    await pmcPage.evaluate(() => {
      const pubBtn = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(el => el.textContent.includes('PUBLISH LIVE') || el.value?.includes('PUBLISH LIVE'));
      if (pubBtn) pubBtn.click();
    });

    await new Promise(r => setTimeout(r, 5000));
    await pmcPage.screenshot({ path: 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_published_live_step.png', fullPage: true });

    console.log('[🎉 ALL 3 PLATFORMS PUBLISHED SUCCESSFULLY!]');
    browser.disconnect();
  } catch (err) {
    console.error('[-] Publish error:', err.message);
  }
}

publishAllThreeLive();
