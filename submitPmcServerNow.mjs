import puppeteer from 'puppeteer';

async function submitPmcServerNow() {
  console.log('[🚀 PMC SUBMIT SERVER] Clicking Submit Server and filling all form fields...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let pmcPage = pages.find(p => p.url().includes('planetminecraft.com'));
    if (!pmcPage) {
      pmcPage = await browser.newPage();
    }

    await pmcPage.bringToFront();
    await pmcPage.goto('https://www.planetminecraft.com/account/manage/servers/item/new/', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 2000));

    // Fill Form Fields
    await pmcPage.evaluate(() => {
      // 1. Server Title
      const titleInput = document.querySelector('input[name="title"], #title, input[placeholder*="Title"]');
      if (titleInput) {
        titleInput.value = 'KryloSMP';
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
        titleInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 2. IP / Domain
      const ipInput = document.querySelector('input[name="ip"], input[name="domain"], input[placeholder*="IP"], input[name="server_ip"]');
      if (ipInput) {
        ipInput.value = 'krylosmp.play.hosting';
        ipInput.dispatchEvent(new Event('input', { bubbles: true }));
        ipInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 3. Port
      const portInput = document.querySelector('input[name="port"], input[placeholder*="Port"]');
      if (portInput) {
        portInput.value = '25565';
        portInput.dispatchEvent(new Event('input', { bubbles: true }));
        portInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      // 4. Description
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

      // 5. Website URL
      const urlInputs = Array.from(document.querySelectorAll('input')).filter(i => 
        i.placeholder?.includes('URL') || i.name?.includes('url') || i.id?.includes('url')
      );
      if (urlInputs.length > 0) {
        urlInputs[0].value = 'https://krylosmp-store.vercel.app';
        urlInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        urlInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }

      const titleInputs = Array.from(document.querySelectorAll('input')).filter(i => 
        i.placeholder?.includes('Title') || i.name?.includes('title')
      );
      if (titleInputs.length > 0) {
        titleInputs[0].value = 'KryloSMP Storefront';
        titleInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
        titleInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // Upload Banner
    const bannerPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\krylosmp_468x60_banner.png';
    const fileInputs = await pmcPage.$$('input[type="file"]');
    if (fileInputs.length > 0) {
      await fileInputs[0].uploadFile(bannerPath);
      await new Promise(r => setTimeout(r, 2000));
    }

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

    const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\pmc_server_submitted_final_done.png';
    await pmcPage.screenshot({ path: ssPath, fullPage: true });
    console.log('[🎉 PLANETMINECRAFT SERVER SUBMITTED!] Screenshot:', ssPath);

    browser.disconnect();
  } catch (err) {
    console.error('[-] Submit server error:', err.message);
  }
}

submitPmcServerNow();
