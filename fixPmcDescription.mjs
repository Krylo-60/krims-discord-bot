import puppeteer from 'puppeteer';

async function fixPmcDescription() {
  console.log('[🚀 PMC DESCRIPTION FIX] Setting 300+ character description & fixing Server Title...');

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
        // 1. Fix Server Title
        const titleInput = document.querySelector('input[name="title"], #title, input[placeholder*="Title"]');
        if (titleInput) {
          titleInput.value = 'KryloSMP';
          titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          titleInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const longDescription = 'Welcome to KryloSMP! High-performance Java 1.26.2 and Bedrock cross-play Survival SMP featuring custom bot economy, rank perks, custom tools, and daily rewards! Join our friendly community and experience lag-free survival adventures with active staff support. Connect now at KryloSmp.play.hosting (Port: 19132 for Bedrock). Webstore: https://krylosmp-store.vercel.app';

        // 2. Fill TinyMCE iframe if present
        const tinymceIframe = document.querySelector('iframe[id*="content"], iframe.mce-edit-area iframe, .mce-content-body');
        if (tinymceIframe && tinymceIframe.contentDocument) {
          tinymceIframe.contentDocument.body.innerHTML = `<p>${longDescription}</p>`;
        }

        // Also fill plain textarea
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(ta => {
          ta.value = longDescription;
          ta.dispatchEvent(new Event('input', { bubbles: true }));
          ta.dispatchEvent(new Event('change', { bubbles: true }));
        });

        // Trigger TinyMCE API if available
        if (window.tinymce && window.tinymce.activeEditor) {
          window.tinymce.activeEditor.setContent(`<p>${longDescription}</p>`);
        }
      });

      await new Promise(r => setTimeout(r, 2000));

      // Click SAVE DRAFT
      await pmcPage.evaluate(() => {
        const draftBtn = Array.from(document.querySelectorAll('button, input, a')).find(el => 
          el.textContent.toUpperCase().includes('SAVE DRAFT') || el.value?.toUpperCase().includes('SAVE DRAFT')
        );
        if (draftBtn) draftBtn.click();
      });

      await new Promise(r => setTimeout(r, 4000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_description_fixed.png';
      await pmcPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 PMC DESCRIPTION FIXED & DRAFT SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Description fix error:', err.message);
  }
}

fixPmcDescription();
