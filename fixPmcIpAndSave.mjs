import puppeteer from 'puppeteer';

async function fixPmcIpAndSave() {
  console.log('[🚀 PMC IP & HOSTNAME FIX] Formatting IP address and setting port...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      await pmcPage.evaluate(() => {
        // Clean IP field
        const ipInput = document.querySelector('input[name="ip"], input[name="domain"], input[placeholder*="IP"], input[name="server_ip"]');
        if (ipInput) {
          ipInput.value = 'krylosmp.play.hosting';
          ipInput.dispatchEvent(new Event('input', { bubbles: true }));
          ipInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Set Port to 25565
        const portInput = document.querySelector('input[name="port"], input[placeholder*="Port"]');
        if (portInput) {
          portInput.value = '25565';
          portInput.dispatchEvent(new Event('input', { bubbles: true }));
          portInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      await new Promise(r => setTimeout(r, 2000));

      // Click SAVE DRAFT
      await pmcPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input, a'));
        const draftBtn = buttons.find(el => 
          (el.textContent && el.textContent.toUpperCase().includes('SAVE DRAFT')) ||
          (el.value && el.value.toUpperCase().includes('SAVE DRAFT'))
        );
        if (draftBtn) draftBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_ip_error_resolved.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PLANETMINECRAFT IP RESOLVED & DRAFT SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] IP fix error:', err.message);
  }
}

fixPmcIpAndSave();
