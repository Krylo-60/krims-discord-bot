import puppeteer from 'puppeteer';

async function fillExactPmcFormAndSubmit() {
  console.log('[🚀 PMC EXACT FORM AUTOMATION] Ingesting exact element IDs and saving draft...');

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
        // 1. Title
        const titleEl = document.querySelector('input[name="title"]');
        if (titleEl) {
          titleEl.value = 'KryloSMP';
          titleEl.dispatchEvent(new Event('input', { bubbles: true }));
          titleEl.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 2. Server Address
        const addrEl = document.querySelector('#server_address');
        if (addrEl) {
          addrEl.value = 'KryloSmp.play.hosting';
          addrEl.dispatchEvent(new Event('input', { bubbles: true }));
          addrEl.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 3. Server Port
        const portEl = document.querySelector('#server_port');
        if (portEl) {
          portEl.value = '25565';
          portEl.dispatchEvent(new Event('input', { bubbles: true }));
          portEl.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 4. Country Code
        const countryEl = document.querySelector('#country_code');
        if (countryEl) {
          countryEl.value = 'in'; // India
          countryEl.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // 5. Webstore URL & Title
        const wurlEl = document.querySelector('input[name="wurl0"]');
        if (wurlEl) {
          wurlEl.value = 'https://krylosmp-store.vercel.app';
          wurlEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const wtitleEl = document.querySelector('input[name="wtitle0"]');
        if (wtitleEl) {
          wtitleEl.value = 'Server Store';
          wtitleEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });

      await new Promise(r => setTimeout(r, 1000));

      // Click TEST CONNECTION button
      await pmcPage.evaluate(() => {
        const testBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.toUpperCase().includes('TEST CONNECTION') || el.value?.toUpperCase().includes('TEST CONNECTION')
        );
        if (testBtn) testBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      // Click SAVE DRAFT
      await pmcPage.evaluate(() => {
        const draftBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          (el.textContent && el.textContent.toUpperCase().includes('SAVE DRAFT')) ||
          (el.value && el.value.toUpperCase().includes('SAVE DRAFT'))
        );
        if (draftBtn) draftBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_exact_form_saved.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 EXACT PMC FORM SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Fill exact form error:', err.message);
  }
}

fillExactPmcFormAndSubmit();
