import puppeteer from 'puppeteer';

async function fillDiscordIdMcmp() {
  console.log('[🚀 DISCORD ID AUTOMATION] Filling Discord Server ID on Minecraft-MP...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();

    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      await mcmpPage.bringToFront();

      await mcmpPage.evaluate(() => {
        const discordInput = document.querySelector('input[name*="discord"], #discord_id, #discord, input[placeholder*="Discord"]');
        if (discordInput) {
          discordInput.value = '1524878881918685405';
          discordInput.dispatchEvent(new Event('input', { bubbles: true }));
          discordInput.dispatchEvent(new Event('change', { bubbles: true }));
          discordInput.dispatchEvent(new Event('blur', { bubbles: true }));
        }
      });

      await new Promise(r => setTimeout(r, 2000));

      const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\mcmp_discord_id_filled_full.png';
      await mcmpPage.screenshot({ path: ssPath, fullPage: true });
      console.log('[🎉 DISCORD SERVER ID FULL SCREENSHOT SAVED!] Screenshot:', ssPath);
    }

    browser.disconnect();
  } catch (err) {
    console.error('[-] Fill Discord ID error:', err.message);
  }
}

fillDiscordIdMcmp();
