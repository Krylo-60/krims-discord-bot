// ══════════════════════════════════════════════════════════════
// 🚀 KRYLOSMP PTERODACTYL PANEL API FILE UPLOADER
// ══════════════════════════════════════════════════════════════
// Uses the Pterodactyl Client API to upload files directly
// to the Minecraft server via the web panel (no SFTP needed!)
// ══════════════════════════════════════════════════════════════

import fs from 'fs';
import path from 'path';

const PANEL_URL = 'https://panel.play.hosting';
const SERVER_ID = '25a5d79a';

// Read the API key from environment or argument
const API_KEY = process.argv[2] || process.env.PTERODACTYL_API_KEY;

if (!API_KEY) {
  console.log('═══════════════════════════════════════════════════════');
  console.log('🔑 HOW TO GET YOUR API KEY:');
  console.log('═══════════════════════════════════════════════════════');
  console.log('1. Go to: https://panel.play.hosting/account/api');
  console.log('2. Click "Create New" (or "Create API Key")');
  console.log('3. Enter a description like "Antigravity Uploader"');
  console.log('4. Copy the key (starts with ptlc_...)');
  console.log('5. Run this script again with the key:');
  console.log('   node uploadViaAPI.mjs ptlc_YOUR_KEY_HERE');
  console.log('═══════════════════════════════════════════════════════');
  process.exit(1);
}

async function uploadFile(localFilePath, remoteDirectory) {
  const fileName = path.basename(localFilePath);
  console.log(`[🚀 UPLOADING] ${fileName} -> ${remoteDirectory}`);

  try {
    // Step 1: Get a signed upload URL from the panel
    console.log('[1/3] Requesting signed upload URL...');
    const uploadUrlRes = await fetch(
      `${PANEL_URL}/api/client/servers/${SERVER_ID}/files/upload`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    );

    if (!uploadUrlRes.ok) {
      const errText = await uploadUrlRes.text();
      console.error(`[-] Failed to get upload URL (HTTP ${uploadUrlRes.status}): ${errText}`);
      return false;
    }

    const uploadUrlData = await uploadUrlRes.json();
    const signedUrl = uploadUrlData.attributes.url;
    console.log('[✅ 1/3] Got signed upload URL!');

    // Step 2: Upload the file to the signed URL
    console.log('[2/3] Uploading file data...');
    const fileBuffer = fs.readFileSync(localFilePath);
    const blob = new Blob([fileBuffer]);

    const formData = new FormData();
    formData.append('files', blob, fileName);

    const uploadRes = await fetch(`${signedUrl}&directory=${encodeURIComponent(remoteDirectory)}`, {
      method: 'POST',
      body: formData
    });

    if (!uploadRes.ok) {
      const errText = await uploadRes.text();
      console.error(`[-] Upload failed (HTTP ${uploadRes.status}): ${errText}`);
      return false;
    }

    console.log(`[✅ 2/3] File uploaded successfully!`);

    // Step 3: Verify the file exists
    console.log('[3/3] Verifying file on server...');
    const listRes = await fetch(
      `${PANEL_URL}/api/client/servers/${SERVER_ID}/files/list?directory=${encodeURIComponent(remoteDirectory)}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );

    if (listRes.ok) {
      const listData = await listRes.json();
      const files = listData.data || [];
      const found = files.find(f => f.attributes.name === fileName);
      if (found) {
        console.log(`[✅ 3/3] VERIFIED! ${fileName} (${found.attributes.size} bytes) exists on server!`);
        return true;
      } else {
        console.log(`[⚠️ 3/3] File not found in listing, but upload returned success.`);
      }
    }

    return true;
  } catch (err) {
    console.error(`[-] Error: ${err.message}`);
    return false;
  }
}

async function listServerFiles(directory = '/') {
  console.log(`[📂 LISTING] ${directory}`);
  try {
    const res = await fetch(
      `${PANEL_URL}/api/client/servers/${SERVER_ID}/files/list?directory=${encodeURIComponent(directory)}`,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json'
        }
      }
    );
    if (res.ok) {
      const data = await res.json();
      const files = data.data || [];
      console.log(`[+] Found ${files.length} items in ${directory}:`);
      for (const f of files) {
        const a = f.attributes;
        const type = a.is_file ? '📄' : '📁';
        const size = a.is_file ? ` (${a.size} bytes)` : '';
        console.log(`  ${type} ${a.name}${size}`);
      }
      return files;
    } else {
      console.error(`[-] List failed (HTTP ${res.status})`);
    }
  } catch (err) {
    console.error(`[-] Error: ${err.message}`);
  }
  return [];
}

// Main execution
async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('🎮 KRYLOSMP PTERODACTYL API FILE MANAGER');
  console.log('══════════════════════════════════════════════════');

  // First, list the root to verify connectivity
  console.log('\n--- Root Directory ---');
  await listServerFiles('/');

  // Check if Skript plugin exists
  console.log('\n--- Plugins Directory ---');
  const plugins = await listServerFiles('/plugins');

  // Check for Skript directory
  const hasSkript = plugins.some(f => f.attributes.name.toLowerCase() === 'skript' && !f.attributes.is_file);

  if (hasSkript) {
    console.log('\n--- Skript/scripts Directory ---');
    await listServerFiles('/plugins/Skript/scripts');

    // Upload the bridge script
    const bridgePath = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\KryloSMP2_0_Bridge.sk';
    if (fs.existsSync(bridgePath)) {
      console.log('\n--- Uploading Bridge Script ---');
      const success = await uploadFile(bridgePath, '/plugins/Skript/scripts');
      if (success) {
        console.log('\n[🎉🎉🎉 KRYLOSMP2_0_BRIDGE.SK UPLOADED SUCCESSFULLY! 🎉🎉🎉]');
        console.log('[ℹ️] Restart your server or run /sk reload all in console to activate!');
      }
    } else {
      console.log(`[-] Bridge script not found at ${bridgePath}`);
    }
  } else {
    console.log('[⚠️] Skript plugin directory not found. Upload to /plugins/ instead.');
    const bridgePath = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\KryloSMP2_0_Bridge.sk';
    if (fs.existsSync(bridgePath)) {
      console.log('\n--- Uploading Bridge Script to /plugins ---');
      await uploadFile(bridgePath, '/plugins');
    }
  }
}

main();
