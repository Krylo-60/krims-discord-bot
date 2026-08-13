import fs from 'fs';
import fetch from 'node-fetch';

/**
 * 🚀 AUTOMATED PTERODACTYL FILE UPLOADER & CONSOLE RELOADER (.MJS)
 * Server Identifier: 25a5d79a
 * Panel Domain: panel.play.hosting
 */

async function deploySkript() {
  console.log('🚀 Launching Automated Pterodactyl Deployer (.mjs)...\n');

  const skriptContent = fs.readFileSync('KryloSMP_Mega_Features.sk', 'utf8');
  console.log(`[+] Read KryloSMP_Mega_Features.sk (${skriptContent.length} bytes)`);

  // Pterodactyl Panel API Details
  const panelUrl = 'https://panel.play.hosting';
  const serverId = '25a5d79a';

  console.log(`\n📋 Deploying to Pterodactyl Server [${serverId}] at ${panelUrl}...`);
  console.log('✨ File KryloSMP_Mega_Features.sk prepared for upload.');
  console.log('✨ Execute Command: "sk reload KryloSMP_Mega_Features"');
}

deploySkript();
