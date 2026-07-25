import puppeteer from 'puppeteer';

async function fillMcMpForm() {
  console.log('[+] Auto-filling Minecraft-MP "Add a Server" form...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      console.log('[🚀 MINECRAFT-MP] Filling input fields...');

      await mcmpPage.evaluate(() => {
        // Server Name
        const nameInput = document.querySelector('input[name*="name"], input#name, input[placeholder*="server name"]');
        if (nameInput) {
          nameInput.value = 'KryloSMP';
          nameInput.dispatchEvent(new Event('input', { bubbles: true }));
          nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Host / IP
        const hostInput = document.querySelector('input[name*="host"], input[name*="ip"], input#host, input#ip');
        if (hostInput) {
          hostInput.value = 'KryloSmp.play.hosting';
          hostInput.dispatchEvent(new Event('input', { bubbles: true }));
          hostInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Description
        const descInput = document.querySelector('textarea[name*="description"], textarea#description, textarea');
        if (descInput) {
          descInput.value = 'Welcome to KryloSMP! High performance Java 1.26.2 & Bedrock cross-play Survival SMP with custom bot economy, /daily rewards, /vote, /refer, and birthday events! Connect at KryloSmp.play.hosting (Bedrock Port: 19132).';
          descInput.dispatchEvent(new Event('input', { bubbles: true }));
          descInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        // Checkboxes for Categories
        const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
        checkboxes.forEach(cb => {
          const label = cb.parentElement?.textContent || '';
          if (label.includes('Survival') || label.includes('Economy') || label.includes('PvE') || label.includes('Cross-Play')) {
            cb.checked = true;
            cb.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
      });

      await new Promise(r => setTimeout(r, 2000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\minecraft_mp_form_filled_success.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[📸 Screenshot] Minecraft-MP form filled successfully:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Fill error:', err.message);
  }
}

fillMcMpForm();
