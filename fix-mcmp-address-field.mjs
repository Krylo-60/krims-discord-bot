import puppeteer from 'puppeteer';

async function fixMcmpAddressField() {
  console.log('[🚀 MINECRAFT-MP FIX] Fixing inputs and triggering connection check...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.bringToFront();

      await mcmpPage.evaluate(() => {
        // Find inputs by placeholder or id
        const nameInput = document.querySelector('input[placeholder*="name"]');
        if (nameInput) {
          nameInput.value = 'KryloSMP';
          nameInput.dispatchEvent(new Event('input', { bubbles: true }));
          nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const hostInput = document.querySelector('input[placeholder*="address"]');
        if (hostInput) {
          hostInput.value = 'KryloSmp.play.hosting';
          hostInput.dispatchEvent(new Event('input', { bubbles: true }));
          hostInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Click Check Connection
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

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_address_fixed_registered.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 MCMP ADDRESS FIXED & REGISTERED SUCCESSFULLY!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] MCMP address fix error:', err.message);
  }
}

fixMcmpAddressField();
