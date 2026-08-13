import puppeteer from 'puppeteer-core';
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\00b316cf-2843-40c3-9037-0d534a8d9fd7';

async function inspectDiscordInBrave() {
  console.log('[🌐 BROWSER INSPECTOR] Connecting to local Brave browser on port 9222...');

  try {
    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    if (!versionRes.ok) {
      console.error('Brave debugging port 9222 not active.');
      return;
    }
    const versionData = await versionRes.json();
    const wsUrl = versionData.webSocketDebuggerUrl;

    console.log(`Connected to WS: ${wsUrl}`);
    const browser = await puppeteer.connect({ browserWSEndpoint: wsUrl });

    const pages = await browser.pages();
    console.log(`Found ${pages.length} open browser tabs.`);

    let discordPage = null;
    for (const page of pages) {
      const url = page.url();
      console.log(`  - Tab: ${url}`);
      if (url.includes('discord.com')) {
        discordPage = page;
        break;
      }
    }

    if (!discordPage) {
      console.log('No active Discord Web tab found. Using first tab...');
      discordPage = pages[0];
    }

    // Bring tab to front
    await discordPage.bringToFront().catch(() => {});

    // Take screenshot of current Discord Web screen
    const screenshotPath = path.join(ARTIFACT_DIR, 'discord_browser_inspection.png');
    await discordPage.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`📸 Screenshot saved to: ${screenshotPath}`);

    // Inspect page title and channel names
    const pageTitle = await discordPage.title();
    console.log(`Page Title: ${pageTitle}`);

    browser.disconnect();
    console.log('✅ Browser inspection complete!');

  } catch (err) {
    console.error('Browser connection error:', err.message);
  }
}

inspectDiscordInBrave();
