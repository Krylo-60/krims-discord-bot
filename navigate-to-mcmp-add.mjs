import puppeteer from 'puppeteer';

async function navigateToMcmpAdd() {
  console.log('[🚀 MINECRAFT-MP FIX] Navigating to correct add URL https://minecraft-mp.com/server/add/ ...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (!mcmpPage) {
      mcmpPage = await browser.newPage();
    }

    // Navigate to correct URL /server/add/
    await mcmpPage.goto('https://minecraft-mp.com/server/add/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 4000));

    console.log('[+] Arrived at https://minecraft-mp.com/server/add/ ! Filling server form...');

    await mcmpPage.evaluate(() => {
      // Server Name
      const nameInput = document.querySelector('input[name*="name"], input[placeholder*="server name"]');
      if (nameInput) {
        nameInput.value = 'KryloSMP';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Description
      const descInput = document.querySelector('textarea[name*="desc"], textarea[placeholder*="Description"]');
      if (descInput) {
        descInput.value = 'Welcome to KryloSMP! High performance Java 1.26.2 & Bedrock cross-play Survival SMP with custom bot economy and daily rewards! Connect to KryloSMP! (Bedrock Port: 19132)';
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Server Address
      const hostInput = document.querySelector('input[name*="host"], input[name*="address"], input[placeholder*="address"]');
      if (hostInput) {
        hostInput.value = 'KryloSmp.play.hosting';
        hostInput.dispatchEvent(new Event('input', { bubbles: true }));
      }

      // Check categories
      ['Cross-Play', 'Economy', 'PvE', 'Survival', 'Survival Games'].forEach(tag => {
        const labels = Array.from(document.querySelectorAll('label'));
        const target = labels.find(l => l.textContent.trim().toLowerCase() === tag.toLowerCase());
        if (target) {
          const cb = target.querySelector('input[type="checkbox"]') || document.getElementById(target.getAttribute('for'));
          if (cb && !cb.checked) cb.click();
        }
      });

      // Click Check the connection button
      const connBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
        el.textContent.includes('Check the connection') || el.value?.includes('Check the connection')
      );
      if (connBtn) connBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    // Click Register The Server
    await mcmpPage.evaluate(() => {
      const regBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => 
        el.textContent.includes('Register The Server') || el.value?.includes('Register The Server')
      );
      if (regBtn) regBtn.click();
    });

    await new Promise(r => setTimeout(r, 5000));

    const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_add_page_published.png';
    await mcmpPage.screenshot({ path: ssPath, fullPage: true });
    console.log('[🎉 MINECRAFT-MP ADD COMPLETE] Live screenshot saved:', ssPath);

    browser.disconnect();
  } catch (err) {
    console.error('[-] MCMP Add Error:', err.message);
  }
}

navigateToMcmpAdd();
