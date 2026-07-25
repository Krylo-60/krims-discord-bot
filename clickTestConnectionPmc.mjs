import puppeteer from 'puppeteer';

async function clickTestConnectionPmc() {
  console.log('[🚀 PMC TEST CONNECTION] Typing IP krylosmp.play.hosting and clicking TEST CONNECTION...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      // 1. Set Title to KryloSMP
      await pmcPage.evaluate(() => {
        const titleInput = document.querySelector('input[name="title"], #title, input[placeholder*="Title"]');
        if (titleInput) {
          titleInput.value = 'KryloSMP';
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          titleInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 2. Set IP
        const ipInput = document.querySelector('input[name="ip"], input[name="domain"], input[placeholder*="IP"], input[name="server_ip"]');
        if (ipInput) {
          ipInput.value = 'krylosmp.play.hosting';
          ipInput.dispatchEvent(new Event('input', { bubbles: true }));
          ipInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      await new Promise(r => setTimeout(r, 1000));

      // 3. Click TEST CONNECTION
      await pmcPage.evaluate(() => {
        const testBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.toUpperCase().includes('TEST CONNECTION') || el.value?.toUpperCase().includes('TEST CONNECTION')
        );
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      // 4. Set 300-char Description
      await pmcPage.evaluate(() => {
        const desc = 'Welcome to KryloSMP! High-performance Java 1.26.2 and Bedrock cross-play Survival SMP featuring custom bot economy, rank perks, custom tools, and daily rewards! Join our friendly community and experience lag-free survival adventures with active staff support. Connect now at KryloSmp.play.hosting (Port: 19132 for Bedrock). Webstore: https://krylosmp-store.vercel.app';
        
        const tinymceIframe = document.querySelector('iframe[id*="content"], iframe.mce-edit-area iframe, .mce-content-body');
        if (tinymceIframe && tinymceIframe.contentDocument) {
          tinymceIframe.contentDocument.body.innerHTML = `<p>${desc}</p>`;
        }

        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(ta => {
          ta.value = desc;
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          ta.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });

      await new Promise(r => setTimeout(r, 2000));

      // 5. Click SAVE DRAFT
      await pmcPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, input, a'));
        const draftBtn = buttons.find(el => 
          (el.textContent && el.textContent.toUpperCase().includes('SAVE DRAFT')) ||
          (el.value && el.value.toUpperCase().includes('SAVE DRAFT'))
        );
        if (draftBtn) draftBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_test_connection_complete.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 TEST CONNECTION & SAVE DRAFT COMPLETE!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Test Connection error:', err.message);
  }
}

clickTestConnectionPmc();
