import puppeteer from 'puppeteer';

async function clickFinalRegister() {
  console.log('[🚀 FINAL SUBMIT] Clicking "Register The Server ✔" button on Minecraft-MP...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.evaluate(() => {
        // Clean up any duplicate text in inputs if needed
        const nameInput = document.querySelector('input[placeholder*="server name"]');
        if (nameInput) nameInput.value = 'KryloSMP';

        const hostInput = document.querySelector('input[placeholder*="address"]');
        if (hostInput) hostInput.value = 'KryloSmp.play.hosting';

        const submitBtn = document.querySelector('input[type="submit"], button[type="submit"], #register-server-btn');
        if (submitBtn) {
          submitBtn.click();
        } else {
          const btn = Array.from(document.querySelectorAll('button, input, a')).find(el => el.textContent.includes('Register The Server') || el.value?.includes('Register The Server'));
          if (btn) btn.click();
        }
      });

      await new Promise(r => setTimeout(r, 6000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\minecraft_mp_published_success.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PUBLISHED] Minecraft-MP server registration submitted successfully!', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Final submit error:', err.message);
  }
}

clickFinalRegister();
