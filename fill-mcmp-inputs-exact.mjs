import puppeteer from 'puppeteer';

async function fillMcmpInputsExact() {
  console.log('[🚀 MINECRAFT-MP] Typing exact values into Server Name and Address...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      // Focus and type Server Name
      const nameInput = await mcmpPage.$('input[name*="name"], input[placeholder*="server name"]');
      if (nameInput) {
        await nameInput.click({ clickCount: 3 });
        await nameInput.press('Backspace');
        await nameInput.type('KryloSMP', { delay: 100 });
      }

      // Focus and type Server Address
      const hostInput = await mcmpPage.$('input[name*="host"], input[name*="address"], input[placeholder*="address"]');
      if (hostInput) {
        await hostInput.click({ clickCount: 3 });
        await hostInput.press('Backspace');
        await hostInput.type('KryloSmp.play.hosting', { delay: 100 });
      }

      await new Promise(r => setTimeout(r, 2000));

      // Click "Check the connection" button
      await mcmpPage.evaluate(() => {
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

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_final_success_submitted.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 MINECRAFT-MP SUBMITTED SUCCESSFULLY!] Screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] MCMP fill exact error:', err.message);
  }
}

fillMcmpInputsExact();
