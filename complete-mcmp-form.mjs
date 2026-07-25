import puppeteer from 'puppeteer';

async function completeMcMpForm() {
  console.log('[+] Completing Minecraft-MP "Server Name" & "Server Address" fields...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.evaluate(() => {
        // Find inputs by placeholder text
        const inputs = Array.from(document.querySelectorAll('input'));
        
        const nameInput = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('server name'));
        if (nameInput) {
          nameInput.value = 'KryloSMP';
          nameInput.dispatchEvent(new Event('input', { bubbles: true }));
          nameInput.dispatchEvent(new Event('change', { bubbles: true }));
        }

        const addressInput = inputs.find(i => i.placeholder && i.placeholder.toLowerCase().includes('address'));
        if (addressInput) {
          addressInput.value = 'KryloSmp.play.hosting';
          addressInput.dispatchEvent(new Event('input', { bubbles: true }));
          addressInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });

      await new Promise(r => setTimeout(r, 2000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\minecraft_mp_form_complete_final.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[📸 Screenshot] Minecraft-MP complete form screenshot saved:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Error:', err.message);
  }
}

completeMcMpForm();
