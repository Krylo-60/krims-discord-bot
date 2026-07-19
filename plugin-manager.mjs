import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const PTERO_TOKEN = process.env.PTERODACTYL_TOKEN;
const SERVER_ID = '25a5d79a';
const BASE_URL = `https://panel.play.hosting/api/client/servers/${SERVER_ID}`;

const headers = {
  'Authorization': `Bearer ${PTERO_TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

async function listPlugins() {
  console.log('📂 Listing current plugins...');
  const res = await fetch(`${BASE_URL}/files/list?directory=/plugins`, { headers });
  if (!res.ok) {
    console.log(`Status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    console.log(text.substring(0, 500));
    return [];
  }
  const data = await res.json();
  const plugins = data.data.map(f => ({
    name: f.attributes.name,
    size: f.attributes.size,
    isDir: f.attributes.is_file === false,
  }));
  plugins.forEach(p => {
    const sizeKB = Math.round(p.size / 1024);
    console.log(`  ${p.isDir ? '📁' : '📄'} ${p.name} (${sizeKB}KB)`);
  });
  return plugins;
}

async function uploadPlugin(url, filename) {
  console.log(`\n⬇️  Downloading ${filename} from ${url}...`);
  const dlRes = await fetch(url, { redirect: 'follow' });
  if (!dlRes.ok) {
    console.log(`❌ Download failed: ${dlRes.status} ${dlRes.statusText}`);
    return false;
  }
  const buffer = Buffer.from(await dlRes.arrayBuffer());
  console.log(`  Downloaded ${Math.round(buffer.length / 1024)}KB`);

  // Upload to Pterodactyl using multipart form upload
  console.log(`⬆️  Uploading ${filename} to /plugins/...`);
  
  // First get upload URL
  const uploadUrlRes = await fetch(`${BASE_URL}/files/upload`, { headers });
  if (!uploadUrlRes.ok) {
    console.log(`❌ Failed to get upload URL: ${uploadUrlRes.status}`);
    const text = await uploadUrlRes.text();
    console.log(text.substring(0, 300));
    return false;
  }
  const uploadData = await uploadUrlRes.json();
  const uploadUrl = uploadData.attributes.url;
  console.log(`  Got upload URL`);

  // Upload file using the signed URL
  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'application/java-archive' });
  formData.append('files', blob, filename);

  const upRes = await fetch(`${uploadUrl}&directory=/plugins`, {
    method: 'POST',
    body: formData,
  });
  
  if (upRes.ok || upRes.status === 204) {
    console.log(`✅ ${filename} uploaded successfully!`);
    return true;
  } else {
    console.log(`❌ Upload failed: ${upRes.status} ${upRes.statusText}`);
    const text = await upRes.text();
    console.log(text.substring(0, 300));
    return false;
  }
}

async function sendCommand(command) {
  console.log(`\n🔧 Sending command: ${command}`);
  const res = await fetch(`${BASE_URL}/command`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ command }),
  });
  if (res.ok || res.status === 204) {
    console.log(`✅ Command sent successfully`);
    return true;
  } else {
    console.log(`❌ Command failed: ${res.status}`);
    return false;
  }
}

async function restartServer() {
  console.log('\n🔄 Restarting server...');
  const res = await fetch(`${BASE_URL}/power`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ signal: 'restart' }),
  });
  if (res.ok || res.status === 204) {
    console.log('✅ Restart signal sent!');
    return true;
  } else {
    console.log(`❌ Restart failed: ${res.status}`);
    return false;
  }
}

// Main execution
const action = process.argv[2] || 'list';

if (action === 'list') {
  await listPlugins();
} else if (action === 'install') {
  // Step 1: List existing plugins
  const existing = await listPlugins();
  
  // Check for NBT-API to make sure we don't touch it
  const nbtApi = existing.find(p => p.name.toLowerCase().includes('nbt'));
  if (nbtApi) {
    console.log(`\n⚠️  Found NBT-API: ${nbtApi.name} - Will NOT be modified`);
  }

  // Step 2: Download and upload plugins
  // ProtocolLib - latest dev build for 1.21.1
  const protocolLibUrl = 'https://ci.dmulloy2.net/job/ProtocolLib/lastSuccessfulBuild/artifact/build/libs/ProtocolLib.jar';
  
  // Lib's Disguises - latest release from GitHub
  const libsDisguisesUrl = 'https://github.com/libraryaddict/LibsDisguises/releases/latest/download/LibsDisguises.jar';
  
  // TAB-Nametags (NickNamer alternative compatible with Paper 1.21.x)
  // Using EzNick / FastNick alternative
  const nicknameUrl = 'https://github.com/LuckyTain/FastNick/releases/latest/download/FastNick.jar';

  console.log('\n📦 Installing plugins...\n');
  
  const results = [];
  results.push({ name: 'ProtocolLib', success: await uploadPlugin(protocolLibUrl, 'ProtocolLib.jar') });
  results.push({ name: "Lib's Disguises", success: await uploadPlugin(libsDisguisesUrl, 'LibsDisguises.jar') });
  results.push({ name: 'FastNick', success: await uploadPlugin(nicknameUrl, 'FastNick.jar') });
  
  console.log('\n📊 Installation Results:');
  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.name}`);
  });

  if (results.every(r => r.success)) {
    console.log('\n✅ All plugins uploaded! Restarting server...');
    await restartServer();
    console.log('\n⏳ Wait ~30 seconds for server to restart, then check /plugins');
  } else {
    console.log('\n⚠️  Some plugins failed to install. Check errors above.');
  }
} else if (action === 'restart') {
  await restartServer();
} else if (action === 'check') {
  await sendCommand('plugins');
}
