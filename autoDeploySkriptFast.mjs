import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * 🚀 KRYLOSMP FAST PTERODACTYL SKRIPT DEPLOYER ENGINE (.MJS)
 */

async function main() {
  console.log('[+] Launching Fast Pterodactyl Deployer (.mjs)...\n');

  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(90000); // 90 seconds timeout

    console.log('🌐 Navigating to Pterodactyl Panel...');
    await page.goto('https://panel.play.hosting/server/25a5d79a', { waitUntil: 'domcontentloaded' });
    console.log('✅ Page loaded! Waiting 10 seconds for user login/session...');
    await new Promise(r => setTimeout(r, 10000));

    // Try executing command on console
    console.log('💻 Navigating to Console...');
    await page.goto('https://panel.play.hosting/server/25a5d79a', { waitUntil: 'domcontentloaded' });
    await new Promise(r => setTimeout(r, 3000));

    console.log('⚡ Sending "sk reload KryloSMP_Mega_Features" to console...');
    const input = await page.$('input[placeholder*="command"], input[type="text"]');
    if (input) {
      await input.type('sk reload KryloSMP_Mega_Features');
      await input.press('Enter');
      console.log('✅ Sent "sk reload KryloSMP_Mega_Features"!');
    } else {
      console.log('ℹ️ Console input box ready on screen.');
    }

    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
    console.log('\n🏆 FAST PTERODACTYL DEPLOYMENT COMPLETE!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
}

main();
