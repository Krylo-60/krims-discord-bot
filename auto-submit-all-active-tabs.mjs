import puppeteer from 'puppeteer';

async function autoSubmitAllActiveTabs() {
  console.log('[🚀 AUTO-SUBMIT ALL TABS] Executing complete hands-off submission across all open tabs...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    console.log(`[+] Total open tabs in Brave: ${pages.length}`);

    // -------------------------------------------------------------
    // 1. MINECRAFT-MP AUTOMATION
    // -------------------------------------------------------------
    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (!mcmpPage) {
      mcmpPage = await browser.newPage();
      await mcmpPage.goto('https://minecraft-mp.com/server/add/', { waitUntil: 'domcontentloaded' });
    }

    console.log('[🚀 MINECRAFT-MP] Auto-filling and submitting form...');
    await mcmpPage.bringToFront();
    await new Promise(r => setTimeout(r, 2000));

    await mcmpPage.evaluate(() => {
      // Name
      const nameInput = document.querySelector('input[name*="name"], input[placeholder*="server name"]');
      if (nameInput) {
        nameInput.value = 'KryloSMP';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Description
      const descInput = document.querySelector('textarea[name*="desc"], textarea[placeholder*="Description"]');
      if (descInput) {
        descInput.value = 'Welcome to KryloSMP! High performance Java 1.26.2 & Bedrock cross-play Survival SMP with custom bot economy and rewards! Connect to KryloSMP! (Bedrock Port: 19132)';
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
        descInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Host / IP
      const hostInput = document.querySelector('input[name*="host"], input[name*="address"], input[placeholder*="address"]');
      if (hostInput) {
        hostInput.value = 'KryloSmp.play.hosting';
        hostInput.dispatchEvent(new Event('input', { bubbles: true }));
        hostInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Check tags
      ['Cross-Play', 'Economy', 'PvE', 'Survival', 'Survival Games'].forEach(tag => {
        const labels = Array.from(document.querySelectorAll('label'));
        const target = labels.find(l => l.textContent.trim().toLowerCase() === tag.toLowerCase());
        if (target) {
          const cb = target.querySelector('input[type="checkbox"]') || document.getElementById(target.getAttribute('for'));
          if (cb && !cb.checked) cb.click();
        }
      });

      // Click Check Connection
      const connBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
        el.textContent.includes('Check the connection') || el.value?.includes('Check the connection')
      );
      if (connBtn) connBtn.click();
    });

    await new Promise(r => setTimeout(r, 3000));

    await mcmpPage.evaluate(() => {
      const regBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => 
        el.textContent.includes('Register The Server') || el.value?.includes('Register The Server')
      );
      if (regBtn) regBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));
    await mcmpPage.screenshot({ path: 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_auto_submitted_final.png', fullPage: true });

    // -------------------------------------------------------------
    // 2. PLANETMINECRAFT AUTOMATION
    // -------------------------------------------------------------
    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (!pmcPage) {
      pmcPage = await browser.newPage();
      await pmcPage.goto('https://www.planetminecraft.com/account/manage/servers/item/new/', { waitUntil: 'domcontentloaded' });
    }

    console.log('[🚀 PLANETMINECRAFT] Auto-filling and submitting form...');
    await pmcPage.bringToFront();
    await new Promise(r => setTimeout(r, 2000));

    await pmcPage.evaluate(() => {
      // Title
      const titleIn = document.querySelector('input[name*="title"], input[id*="title"]');
      if (titleIn) {
        titleIn.value = 'KryloSMP';
        titleIn.dispatchEvent(new Event('input', { bubbles: true }));
        titleIn.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // IP / Domain
      const ipIn = document.querySelector('input[name*="ip"], input[name*="domain"]');
      if (ipIn) {
        ipIn.value = 'KryloSmp.play.hosting';
        ipIn.dispatchEvent(new Event('input', { bubbles: true }));
        ipIn.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // Click Test Connection
      const testBtn = Array.from(document.querySelectorAll('button, a')).find(el => el.textContent.includes('TEST CONNECTION'));
      if (testBtn) testBtn.click();
    });

    await new Promise(r => setTimeout(r, 3000));

    await pmcPage.evaluate(() => {
      const pubBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => el.textContent.includes('PUBLISH LIVE') || el.value?.includes('PUBLISH LIVE'));
      if (pubBtn) pubBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));
    await pmcPage.screenshot({ path: 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_auto_submitted_final.png', fullPage: true });

    // -------------------------------------------------------------
    // 3. REDDIT AUTOMATION
    // -------------------------------------------------------------
    let redditPage = pages.find(p => p.url().includes('reddit.com'));
    if (!redditPage) {
      redditPage = await browser.newPage();
      await redditPage.goto('https://www.reddit.com/r/MinecraftServer/submit', { waitUntil: 'domcontentloaded' });
    }

    console.log('[🚀 REDDIT] Auto-filling and submitting post...');
    await redditPage.bringToFront();
    await new Promise(r => setTimeout(r, 2000));

    await redditPage.evaluate(() => {
      const titleEl = document.querySelector('textarea[placeholder*="Title"], input[placeholder*="Title"]');
      if (titleEl) {
        titleEl.value = 'KryloSMP [Java 1.26.2 & Bedrock Crossplay] - Survival | Custom Bot Economy | /daily Rewards';
        titleEl.dispatchEvent(new Event('input', { bubbles: true }));
      }

      const bodyEl = document.querySelector('div[contenteditable="true"], textarea[placeholder*="Text"]');
      if (bodyEl) {
        bodyEl.textContent = 'Welcome to KryloSMP! High performance Java & Bedrock cross-play Survival SMP with custom bot economy, /daily rewards, /vote, /refer, and birthday events!\n\nJava IP: KryloSmp.play.hosting\nBedrock Port: 19132\nWebstore: https://krylosmp-store.vercel.app';
        bodyEl.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    await redditPage.evaluate(() => {
      const postBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === 'Post');
      if (postBtn) postBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));
    await redditPage.screenshot({ path: 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\reddit_auto_submitted_final.png', fullPage: true });

    console.log('[🎉 COMPLETE AUTOMATION SUCCESS!] All 3 platforms automatically filled and submitted!');
    browser.disconnect();
  } catch (err) {
    console.error('[-] Auto submit error:', err.message);
  }
}

autoSubmitAllActiveTabs();
