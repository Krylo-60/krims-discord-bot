import puppeteer from 'puppeteer';
import fs from 'fs';

/**
 * 🚀 KRYLOSMP AUTOMATED PTERODACTYL SKRIPT DEPLOYER ENGINE (.MJS)
 */

async function main() {
  console.log('[+] Launching Puppeteer Automated Pterodactyl Deployer (.mjs)...\n');

  try {
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });

    const page = await browser.newPage();
    console.log('🌐 Navigating to Pterodactyl Panel...');
    await page.goto('https://panel.play.hosting/server/25a5d79a', { waitUntil: 'networkidle2' });

    console.log('✨ Please log into your Pterodactyl Panel if prompted. Waiting 15 seconds for session...');
    await new Promise(r => setTimeout(r, 15000));

    // Navigate to File Manager
    console.log('📁 Navigating to Skript scripts folder...');
    await page.goto('https://panel.play.hosting/server/25a5d79a/files#%2Fplugins%2FSkript%2Fscripts', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    // Navigate back to Console
    console.log('💻 Navigating to Server Console...');
    await page.goto('https://panel.play.hosting/server/25a5d79a', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 3000));

    // Type console command
    console.log('⚡ Executing command: "sk reload KryloSMP_Mega_Features"');
    const consoleInput = await page.$('input[placeholder*="command"], input[type="text"]');
    if (consoleInput) {
      await consoleInput.type('sk reload KryloSMP_Mega_Features');
      await consoleInput.press('Enter');
      console.log('✅ Sent "sk reload KryloSMP_Mega_Features" to console!');
    }

    await new Promise(r => setTimeout(r, 5000));
    await browser.close();
    console.log('\n🏆 AUTOMATED PTERODACTYL SKRIPT DEPLOYMENT COMPLETE!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
}

main();
