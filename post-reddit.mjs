import puppeteer from 'puppeteer';

const BRAVE_PATH = 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe';

const POST_TITLE = '[SMP] {Java & Bedrock} KryloSMP — Cross-Platform Survival SMP | Birthday Festival Week | Free Diamonds & Daily Rewards!';
const POST_BODY = `# KryloSMP — The Ultimate Cross-Platform Survival Experience!

**Server IP (Java):** \`KryloSmp.play.hosting\`  
**Server IP (Bedrock):** \`KryloSmp.play.hosting\` (Port: \`19132\`)  
**Version:** 1.26.2 (PaperMC)  
**Discord:** https://discord.gg/krylosmp

---

## What Makes KryloSMP Special?

- **True Cross-Platform Play** — Java and Bedrock players can join and play together seamlessly! Works on PC, Mobile, Xbox, and PlayStation.
- **Active Economy System** — Earn KryloCoins by working jobs, gambling at the casino, and claiming daily rewards.
- **Birthday Festival Week Active NOW!** — 7 days of free rewards including 32x Diamonds, Netherite Ingots, Elytra Wings, and up to 5,000 bonus KryloCoins!
- **Friendly Community** — We are a small but growing SMP looking for chill players who want to build, explore, and survive together.
- **Custom Discord Bot** — Full economy, leveling system, leaderboards, casino mini-games, and more built right into our Discord.

## New Player Perks:
- +500 KryloCoins welcome bonus when you verify via Discord
- 16x Free Diamonds delivered in-game on first join
- Daily Rewards — Claim free items and coins every 24 hours
- Referral Bonuses — Invite friends and earn +2,000 KC each

## Server Rules:
- No griefing or stealing
- Be respectful to all players  
- No hacking or exploiting
- Have fun!

---

We are a brand new server looking for our first wave of active players. Whether you are a builder, explorer, PvP enthusiast, or just looking for a chill SMP to hang out on — KryloSMP has something for everyone!

**Come join us:** \`KryloSmp.play.hosting\`
`;

async function postToReddit() {
  console.log('[+] Connecting to your running Brave browser via debugging port...');
  
  // First, try to get the WebSocket endpoint from the debugging port
  let wsEndpoint;
  try {
    const res = await fetch('http://127.0.0.1:9222/json/version');
    const data = await res.json();
    wsEndpoint = data.webSocketDebuggerUrl;
    console.log('[+] Found running Brave debug session!');
  } catch (err) {
    console.log('[!] Brave is not running with debugging port. Launching fresh instance...');
    // Launch Brave with debugging port using a separate profile to avoid conflict
    const { execSync } = await import('child_process');
    execSync(`start "" "${BRAVE_PATH}" --remote-debugging-port=9222 --user-data-dir="C:\\Users\\naina\\.gemini\\antigravity\\scratch\\BraveProfile"`, { shell: true });
    
    // Wait for browser to start
    await new Promise(r => setTimeout(r, 5000));
    
    try {
      const res2 = await fetch('http://127.0.0.1:9222/json/version');
      const data2 = await res2.json();
      wsEndpoint = data2.webSocketDebuggerUrl;
      console.log('[+] Fresh Brave launched with debugging!');
    } catch (err2) {
      console.error('[-] Could not connect to Brave. Please close all Brave windows and try again.');
      process.exit(1);
    }
  }

  const browser = await puppeteer.connect({ browserWSEndpoint: wsEndpoint });
  const page = await browser.newPage();

  try {
    // Step 1: Navigate to r/mcservers submit page
    console.log('[+] Navigating to r/mcservers submit page...');
    await page.goto('https://www.reddit.com/r/mcservers/submit', { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 4000));

    // Take screenshot
    const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\reddit_submit_page.png';
    await page.screenshot({ path: ssPath, fullPage: true });
    console.log('[📸] Screenshot saved:', ssPath);

    // Step 2: Try to find and fill the title field
    console.log('[+] Looking for title input...');
    
    // Reddit's new UI has different selectors - try multiple approaches
    const titleSelectors = [
      'textarea[placeholder*="itle"]',
      'input[placeholder*="itle"]',
      'div[slot="title"] textarea',
      'textarea[aria-label*="itle"]',
      'faceplate-textarea[name="title"] textarea',
      'shreddit-composer textarea:first-of-type'
    ];
    
    let titleFound = false;
    for (const sel of titleSelectors) {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        await el.type(POST_TITLE, { delay: 15 });
        console.log(`[✅] Title entered using selector: ${sel}`);
        titleFound = true;
        break;
      }
    }
    
    if (!titleFound) {
      // Try clicking into any visible textarea on the page
      const textareas = await page.$$('textarea');
      if (textareas.length > 0) {
        await textareas[0].click();
        await textareas[0].type(POST_TITLE, { delay: 15 });
        console.log('[✅] Title entered using first textarea');
        titleFound = true;
      }
    }

    await new Promise(r => setTimeout(r, 2000));

    // Step 3: Try to switch to text post / markdown mode
    const modeButtons = await page.$$('button');
    for (const btn of modeButtons) {
      const text = await btn.evaluate(el => el.textContent);
      if (text && (text.includes('Markdown') || text.includes('Text'))) {
        await btn.click();
        console.log('[+] Clicked mode button:', text.trim());
        await new Promise(r => setTimeout(r, 1000));
        break;
      }
    }

    // Step 4: Find and fill the body
    console.log('[+] Looking for body textarea...');
    const bodySelectors = [
      'textarea[placeholder*="ext"]',
      'textarea[placeholder*="ody"]',
      'div[contenteditable="true"]',
      'div[slot="body"] textarea',
      'textarea[aria-label*="ody"]',
      'faceplate-textarea[name="body"] textarea'
    ];
    
    let bodyFound = false;
    for (const sel of bodySelectors) {
      const el = await page.$(sel);
      if (el) {
        await el.click();
        await el.type(POST_BODY, { delay: 3 });
        console.log(`[✅] Body entered using selector: ${sel}`);
        bodyFound = true;
        break;
      }
    }
    
    if (!bodyFound) {
      const textareas = await page.$$('textarea');
      if (textareas.length > 1) {
        await textareas[1].click();
        await textareas[1].type(POST_BODY, { delay: 3 });
        console.log('[✅] Body entered using second textarea');
        bodyFound = true;
      }
    }

    await new Promise(r => setTimeout(r, 2000));
    
    // Final screenshot
    await page.screenshot({ path: ssPath, fullPage: true });
    console.log('[📸] Final screenshot saved. Review the post in your browser!');
    console.log('');
    console.log('========================================');
    console.log('🛑 POST IS READY FOR YOUR REVIEW!');
    console.log('   Review it in Brave and click "Post"');
    console.log('   when you are happy with it!');
    console.log('========================================');

  } catch (err) {
    console.error('[-] Error:', err.message);
    const ssPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\reddit_error.png';
    await page.screenshot({ path: ssPath, fullPage: true });
    console.log('[-] Error screenshot saved');
  }
  
  // Don't close - let Krishiv review
  browser.disconnect();
}

postToReddit();
