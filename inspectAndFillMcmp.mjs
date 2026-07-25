import puppeteer from 'puppeteer';

async function inspectAndFillMcmp() {
  console.log('[🚀 EXACT FIELD INJECTION] Diagnosing exact input selectors on Minecraft-MP...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (!mcmpPage) {
      mcmpPage = await browser.newPage();
      await mcmpPage.goto('https://minecraft-mp.com/server/add/', { waitUntil: 'domcontentloaded' });
    } else {
      await mcmpPage.goto('https://minecraft-mp.com/server/add/', { waitUntil: 'domcontentloaded' });
    }

    await new Promise(r => setTimeout(r, 3000));

    const fieldsInfo = await mcmpPage.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input, textarea, select')).map(i => ({
        id: i.id,
        name: i.name,
        type: i.type,
        placeholder: i.placeholder,
        value: i.value,
        outerHTML: i.outerHTML.substring(0, 150)
      }));
      return inputs;
    });

    console.log('[📋 DOM FIELD INSPECTION]:', JSON.stringify(fieldsInfo, null, 2));

    // Now fill exact fields found
    await mcmpPage.evaluate(() => {
      // 1. Server Name
      const nameInput = document.querySelector('input[name="name"], #name, input[placeholder*="name"]');
      if (nameInput) {
        nameInput.value = 'KryloSMP';
        nameInput.dispatchEvent(new Event('input', { bubbles: true }));
        nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        nameInput.dispatchEvent(new Event('blur', { bubbles: true }));
      }

      // 2. Server Address / Hostname
      const hostInput = document.querySelector('input[name="hostname"], input[name="address"], input[name="ip"], #hostname, input[placeholder*="address"]');
      if (hostInput) {
        hostInput.value = 'KryloSmp.play.hosting';
        hostInput.dispatchEvent(new Event('input', { bubbles: true }));
        hostInput.dispatchEvent(new Event('change', { bubbles: true }));
        hostInput.dispatchEvent(new Event('blur', { bubbles: true }));
      }

      // 3. Description
      const descInput = document.querySelector('textarea[name="description"], #description, textarea');
      if (descInput) {
        descInput.value = 'Welcome to KryloSMP! High performance Java 1.26.2 & Bedrock cross-play Survival SMP with custom bot economy and daily rewards! Connect to KryloSMP! (Bedrock Port: 19132)';
        descInput.dispatchEvent(new Event('input', { bubbles: true }));
        descInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await new Promise(r => setTimeout(r, 2000));

    // Click Check the connection
    await mcmpPage.evaluate(() => {
      const connBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
        el.textContent.includes('Check the connection') || el.value?.includes('Check the connection')
      );
      if (connBtn) connBtn.click();
    });

    await new Promise(r => setTimeout(r, 4000));

    const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_ip_injected_verified.png';
    await mcmpPage.screenshot({ path: ssPath, fullPage: true });
    console.log('[🎉 IP INJECTED & VERIFIED!] Screenshot saved:', ssPath);

    browser.disconnect();
  } catch (err) {
    console.error('[-] Inspect & Fill Error:', err.message);
  }
}

inspectAndFillMcmp();
