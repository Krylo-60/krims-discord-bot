import puppeteer from 'puppeteer';

async function editExistingMcmpServer() {
  console.log('[🚀 EDIT EXISTING MCMP SERVER] Clicking edit icon to update existing KryloSMP listing...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.bringToFront();

      // Find edit button (fa-edit / title="Edit" / first action icon)
      const editHref = await mcmpPage.evaluate(() => {
        const editLink = Array.from(document.querySelectorAll('a')).find(a => 
          a.href.includes('edit') || a.title?.includes('Edit') || a.querySelector('.fa-edit, .fa-pencil')
        );
        return editLink ? editLink.href : null;
      });

      console.log('[+] Edit link href:', editHref);

      if (editHref) {
        await mcmpPage.goto(editHref, { waitUntil: 'domcontentloaded' });
        await new Promise(r => setTimeout(r, 2000));

        // Fill Discord ID into existing listing
        await mcmpPage.evaluate(() => {
          const discordInput = document.querySelector('input[name*="discord"], #discord_id, #discord, input[placeholder*="Discord"]');
          if (discordInput) {
            discordInput.value = '1524878881918685405';
            discordInput.dispatchEvent(new Event('input', { bubbles: true }));
            discordInput.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // Click Save / Update
          const saveBtn = Array.from(document.querySelectorAll('button, input[type="submit"]')).find(el => 
            el.textContent.includes('Save') || el.textContent.includes('Update') || el.value?.includes('Save') || el.value?.includes('Update')
          );
          if (saveBtn) saveBtn.click();
        });

        await new Promise(r => setTimeout(r, 4000));
      }

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_existing_server_updated.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 EXISTING MCMP LISTING UPDATED & SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Edit existing server error:', err.message);
  }
}

editExistingMcmpServer();
