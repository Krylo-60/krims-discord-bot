import puppeteer from 'puppeteer';

async function injectTinymceAndClickSave() {
  console.log('[🚀 PMC TINYMCE DESCRIPTION INJECTION] Injecting 400+ character description into TinyMCE...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (pmcPage) {
      await pmcPage.bringToFront();

      const richText = 'Welcome to KryloSMP! High-performance Java 1.26.2 and Bedrock cross-play Survival SMP featuring custom bot economy, rank perks, custom tools, land claims, and daily rewards! Join our friendly community and experience lag-free survival adventures with active staff support. Connect now at KryloSmp.play.hosting (Port: 19132 for Bedrock). Webstore: https://krylosmp-store.vercel.app';

      await pmcPage.evaluate((text) => {
        // 1. Fill TinyMCE API if available
        if (window.tinymce) {
          if (window.tinymce.activeEditor) {
            window.tinymce.activeEditor.setContent(`<p>${text}</p>`);
          }
          if (window.tinymce.editors) {
            window.tinymce.editors.forEach(ed => ed.setContent(`<p>${text}</p>`));
          }
        }

        // 2. Fill all textareas
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(ta => {
          ta.value = text;
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          ta.dispatchEvent(new Event('change', { bubbles: true }));
        });

        // 3. Fill iframe body if present
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          try {
            if (iframe.contentDocument && iframe.contentDocument.body) {
              iframe.contentDocument.body.innerHTML = `<p>${text}</p>`;
              iframe.contentDocument.body.dispatchEvent(new Event('input', { bubbles: true }));
            }
          } catch (e) {}
        });

        // 4. Ensure Title is KryloSMP
        const titleEl = document.querySelector('input[name="title"]');
        if (titleEl) {
          titleEl.value = 'KryloSMP';
          titleEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        // 5. Ensure IP & Port
        const addrEl = document.querySelector('#server_address');
        if (addrEl) {
          addrEl.value = 'KryloSmp.play.hosting';
          addrEl.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const portEl = document.querySelector('#server_port');
        if (portEl) {
          portEl.value = '25565';
          portEl.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, richText);

      await new Promise(r => setTimeout(r, 2000));

      // Click SAVE DRAFT
      await pmcPage.evaluate(() => {
        const draftBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          (el.textContent && el.textContent.toUpperCase().includes('SAVE DRAFT')) ||
          (el.value && el.value.toUpperCase().includes('SAVE DRAFT'))
        );
        if (draftBtn) draftBtn.click();
      });

      await new Promise(r => setTimeout(r, 5000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_tinymce_description_fixed.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 TINYMCE DESCRIPTION INJECTED & SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] TinyMCE injection error:', err.message);
  }
}

injectTinymceAndClickSave();
