import puppeteer from 'puppeteer';
import path from 'path';

async function monitorAndUpload() {
  console.log('[🚀 WAITING FOR CLOUDFLARE VERIFICATION ON BRAVE WINDOW...]');

  const res = await fetch('http://127.0.0.1:9222/json/version');
  const data = await res.json();
  const browser = await puppeteer.connect({ browserWSEndpoint: data.webSocketDebuggerUrl });

  const pages = await browser.pages();
  let page = pages[0];

  console.log('[+] Connected to tab:', await page.title(), '| URL:', page.url());

  let fileManagerLoaded = false;
  let attempts = 0;

  while (!fileManagerLoaded && attempts < 40) {
    attempts++;
    console.log(`[Attempt ${attempts}/40] Checking page state...`);
    
    const title = await page.title();
    const url = page.url();

    const isCloudflare = title.includes('Just a moment') || title.includes('Attention Required');
    const hasFileManager = await page.evaluate(() => {
      return document.body.innerText.includes('File Manager') || 
             document.body.innerText.includes('files') || 
             document.body.innerText.includes('plugins') ||
             !!document.querySelector('input[type="file"]') ||
             !!document.querySelector('table');
    });

    if (!isCloudflare && (hasFileManager || url.includes('/files'))) {
      console.log('\n[🎉 CLOUDFLARE PASSED! FILE MANAGER IS ACCESSIBLE!]');
      fileManagerLoaded = true;
      break;
    }

    console.log(`  Current title: "${title}" | Cloudflare active: ${isCloudflare}`);
    await new Promise(r => setTimeout(r, 3000));
  }

  if (!fileManagerLoaded) {
    console.log('[-] Timed out waiting for Cloudflare check.');
    return;
  }

  console.log('[1] Navigating into /plugins/Skript/scripts folder...');
  await page.goto('https://panel.play.hosting/server/25a5d79a/files#%2Fplugins%2FSkript%2Fscripts', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 4000));

  const screenshotDir = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c';
  await page.screenshot({ path: path.join(screenshotDir, 'panel_scripts_folder.png') });

  // Try to find file upload input or click upload button
  const fileInput = await page.$('input[type="file"]');
  const skriptPath = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\KryloSMP2_0_Bridge.sk';

  if (fileInput) {
    console.log('[+] Uploading KryloSMP2_0_Bridge.sk via file input...');
    await fileInput.uploadFile(skriptPath);
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: path.join(screenshotDir, 'panel_upload_success.png') });
    console.log('[✅ UPLOAD FINISHED SUCCESSFULLY!]');
  } else {
    console.log('[!] File input not visible directly. Trying button clicks...');
    // Look for Upload button
    const uploadBtn = await page.evaluateHandle(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      return btns.find(b => b.innerText.toLowerCase().includes('upload'));
    });
    if (uploadBtn && uploadBtn.asElement()) {
      await uploadBtn.asElement().click();
      await new Promise(r => setTimeout(r, 2000));
      const inputAfterClick = await page.$('input[type="file"]');
      if (inputAfterClick) {
        await inputAfterClick.uploadFile(skriptPath);
        await new Promise(r => setTimeout(r, 5000));
        await page.screenshot({ path: path.join(screenshotDir, 'panel_upload_success.png') });
        console.log('[✅ UPLOAD FINISHED AFTER BUTTON CLICK!]');
      }
    }
  }

  // Also check if console tab is accessible to run /sk reload
  console.log('[2] Navigating to server Console to trigger /sk reload...');
  await page.goto('https://panel.play.hosting/server/25a5d79a', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  
  const commandInput = await page.$('input[placeholder*="command"]');
  if (commandInput) {
    await commandInput.type('sk reload KryloSMP2_0_Bridge.sk');
    await page.keyboard.press('Enter');
    console.log('[✅ EXECUTED: /sk reload KryloSMP2_0_Bridge.sk in console!]');
  }
}

monitorAndUpload().catch(err => console.error('[-] Error:', err.message));
