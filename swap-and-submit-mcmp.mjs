import puppeteer from 'puppeteer';

async function swapAndSubmitMcmp() {
  console.log('[🚀 MCMP SWAP & SUBMIT] Swapping fields and clicking submit...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.bringToFront();

      // Find inputs
      const textInputs = await mcmpPage.$$('input[type="text"]');
      if (textInputs.length >= 2) {
        // Name field (index 0)
        await textInputs[0].click({ clickCount: 3 });
        await textInputs[0].press('Backspace');
        await textInputs[0].type('KryloSMP', { delay: 50 });

        // Address field (index 1)
        await textInputs[1].click({ clickCount: 3 });
        await textInputs[1].press('Backspace');
        await textInputs[1].type('KryloSmp.play.hosting', { delay: 50 });
      }

      await new Promise(r => setTimeout(r, 1500));

      // Click "Check the connection" button
      await mcmpPage.evaluate(() => {
        const connBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.includes('Check the connection') || el.value?.includes('Check the connection')
        );
        if (connBtn) connBtn.click();
      });

      await new Promise(r => setTimeout(r, 3500));

      // Click "Register The Server" button
      await mcmpPage.evaluate(() => {
        const regBtn = Array.from(document.querySelectorAll('button, input[type="submit"], a')).find(el => 
          el.textContent.includes('Register The Server') || el.value?.includes('Register The Server')
        );
        if (regBtn) regBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_swapped_submitted_live.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 MCMP SWAP SUBMIT COMPLETE!] Live screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] MCMP swap submit error:', err.message);
  }
}

swapAndSubmitMcmp();
