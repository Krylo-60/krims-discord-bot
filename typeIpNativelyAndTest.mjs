import puppeteer from 'puppeteer';

async function typeIpNativelyAndTest() {
  console.log('[🚀 PMC NATIVE IP TYPING] Typing KryloSmp.play.hosting natively character by character...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      // Focus and type IP natively
      const ipSelector = 'input[name="ip"], input[name="domain"], input[placeholder*="IP"], input[name="server_ip"]';
      await pmcPage.focus(ipSelector);
      await pmcPage.keyboard.down('Control');
      await pmcPage.keyboard.press('A');
      await pmcPage.keyboard.up('Control');
      await pmcPage.keyboard.press('Backspace');
      await pmcPage.type(ipSelector, 'KryloSmp.play.hosting', { delay: 50 });

      await new Promise(r => setTimeout(r, 1000));

      // Click TEST CONNECTION
      await pmcPage.evaluate(() => {
        const testBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.toUpperCase().includes('TEST CONNECTION') || el.value?.toUpperCase().includes('TEST CONNECTION')
        );
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 6000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_native_ip_connected.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 NATIVE IP TESTED!] Screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Native IP typing error:', err.message);
  }
}

typeIpNativelyAndTest();
