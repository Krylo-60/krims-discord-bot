import puppeteer from 'puppeteer';

const SERVER_NAME = 'KryloSMP';
const SERVER_IP = 'KryloSmp.play.hosting';
const BEDROCK_PORT = '19132';
const DISCORD_INVITE = 'https://discord.gg/krylosmp';
const TAGS = 'minecraft, smp, crossplay, economy, survival';
const DESCRIPTION = `Cross-Platform Java & Bedrock Survival SMP! High performance 1.26.2 PaperMC server with custom bot economy, /daily rewards, /vote, /refer, and 7-Day Birthday Festival active! IP: KryloSmp.play.hosting (Port: 19132)`;

async function runAutoFill() {
  console.log('[+] Connecting to Brave browser on port 9222 for DIRECT listing automation...');

  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    const wsEndpoint = data.webSocketDebuggerUrl;

    const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint, defaultViewport: null });
    const pages = await browser.pages();
    console.log(`[+] Connected to Brave! Total tabs: ${pages.length}`);

    // 1. DISBOARD AUTOMATION
    let disboardPage = pages.find(p => p.url().includes('disboard.org'));
    if (disboardPage) {
      console.log('\n[🚀 DISBOARD AUTOMATION] Navigating to Disboard add server...');
      await disboardPage.goto('https://disboard.org/server/add', { waitUntil: 'networkidle2' }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));

      // Fill Disboard input fields if on form page
      await disboardPage.evaluate((desc, tags) => {
        const descInput = document.querySelector('textarea[name*="description"], textarea#server-description, textarea');
        if (descInput) {
          descInput.value = desc;
          descInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        const tagsInput = document.querySelector('input[name*="tags"], input#server-tags');
        if (tagsInput) {
          tagsInput.value = tags;
          tagsInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, DESCRIPTION, TAGS);

      const disboardSS = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\disboard_filled_direct.png';
      await disboardPage.screenshot({ path: disboardSS });
      console.log('[📸 Screenshot] Disboard auto-fill screenshot saved:', disboardSS);
    }

    // 2. MINECRAFT-MP AUTOMATION
    let mcmpPage = pages.find(p => p.url().includes('minecraft-mp.com'));
    if (mcmpPage) {
      console.log('\n[🚀 MINECRAFT-MP AUTOMATION] Navigating to Minecraft-MP server registration...');
      await mcmpPage.goto('https://minecraft-mp.com/dashboard/', { waitUntil: 'networkidle2' }).catch(() => {});
      await new Promise(r => setTimeout(r, 2000));

      const mcmpSS = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\minecraft_mp_filled_direct.png';
      await mcmpPage.screenshot({ path: mcmpSS });
      console.log('[📸 Screenshot] Minecraft-MP screenshot saved:', mcmpSS);
    }

    browser.disconnect();
    console.log('\n[✅ DIRECT AUTOMATION COMPLETE] All forms auto-filled cleanly!');
  } catch (err) {
    console.error('[-] Direct automation error:', err.message);
  }
}

runAutoFill();
