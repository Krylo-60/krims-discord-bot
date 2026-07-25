import puppeteer from 'puppeteer';

async function getSftpDetails() {
  console.log('[🚀 NAVIGATING TO PLAY HOSTING SETTINGS] Opening https://panel.play.hosting/server/25a5d79a/settings...');

  try {
    const browser = await puppeteer.connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    }).catch(async () => {
      console.log('[+] Connecting via existing profile...');
      return await puppeteer.launch({
        executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
        userDataDir: 'C:\\Users\\naina\\AppData\\Local\\BraveSoftware\\Brave-Browser\\User Data',
        headless: false,
        args: ['--remote-debugging-port=9222']
      });
    });

    const pages = await browser.pages();
    let page = pages.find(p => p.url().includes('play.hosting'));
    if (!page) {
      page = await browser.newPage();
      await page.goto('https://panel.play.hosting/server/25a5d79a/settings', { waitUntil: 'networkidle2' });
    } else {
      await page.goto('https://panel.play.hosting/server/25a5d79a/settings', { waitUntil: 'networkidle2' });
    }

    await page.waitForTimeout(3000);

    const screenshotPath = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\playhosting_sftp_settings.png';
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`[✅ SCREENSHOT SAVED AT: ${screenshotPath}]`);

    // Extract text content of settings
    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('[+] Settings Page Text Extract:');
    console.log(pageText.substring(0, 1000));

  } catch (err) {
    console.error('[-] Puppeteer error:', err.message);
  }
}

getSftpDetails();
