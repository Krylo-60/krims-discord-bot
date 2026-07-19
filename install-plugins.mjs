import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const PTERO_TOKEN = process.env.PTERODACTYL_TOKEN;
const SERVER_ID = '25a5d79a';
const BASE_URL = `https://panel.play.hosting/api/client/servers/${SERVER_ID}`;
const PLUGIN_DIR = path.join(process.cwd(), 'plugins-to-install');

const headers = {
  'Authorization': `Bearer ${PTERO_TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// ============================================================
// PLUGIN DEFINITIONS
// ============================================================

const PLUGINS = [
  {
    name: 'ProtocolLib',
    filename: 'ProtocolLib.jar',
    url: 'https://github.com/dmulloy2/ProtocolLib/releases/download/5.4.0/ProtocolLib.jar',
    description: 'Packet manipulation library — required by Lib\'s Disguises (older builds) and many other plugins',
    version: '5.4.0',
  },
  {
    name: 'PacketEvents',
    filename: 'packetevents-spigot.jar',
    url: 'https://github.com/retrooper/packetevents/releases/download/v2.13.0/packetevents-spigot-2.13.0.jar',
    description: 'Modern packet library — required by Lib\'s Disguises v11+',
    version: '2.13.0',
  },
  {
    name: "Lib's Disguises",
    filename: 'LibsDisguises.jar',
    url: 'https://github.com/libraryaddict/LibsDisguises/releases/download/v11.0.18/LibsDisguises-11.0.18-Github.jar',
    description: 'Full disguise system — disguise as any mob, player, or entity',
    version: '11.0.18',
  },
  {
    name: 'HexNicks',
    filename: 'HexNicks.jar',
    url: 'https://cdn.modrinth.com/data/4dLe7zCS/versions/xBna9qDL/hexnicks-3.2.1.jar',
    description: 'Easy nickname system with hex color, gradient, and MiniMessage support',
    version: '3.2.1',
  },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

async function resolvePacketEventsUrl() {
  console.log('🔍 Resolving latest PacketEvents download URL...');
  try {
    const res = await fetch('https://api.github.com/repos/retrooper/packetevents/releases/latest', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const data = await res.json();
    const spigotAsset = data.assets.find(a => a.name.toLowerCase().includes('spigot'));
    if (spigotAsset) {
      console.log(`  Found: ${spigotAsset.name} (${Math.round(spigotAsset.size/1024)}KB)`);
      return { url: spigotAsset.browser_download_url, version: data.tag_name };
    }
    // Fallback: first jar
    const jarAsset = data.assets.find(a => a.name.endsWith('.jar'));
    if (jarAsset) {
      return { url: jarAsset.browser_download_url, version: data.tag_name };
    }
  } catch (e) {
    console.log(`  ❌ Failed to resolve: ${e.message}`);
  }
  return null;
}

async function downloadFile(url, filepath) {
  console.log(`  ⬇️  Downloading from: ${url}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filepath, buffer);
  console.log(`  ✅ Saved: ${path.basename(filepath)} (${Math.round(buffer.length/1024)}KB)`);
  return buffer.length;
}

async function listServerPlugins() {
  console.log('\n📂 Listing current server plugins...');
  try {
    const res = await fetch(`${BASE_URL}/files/list?directory=/plugins`, { headers });
    if (!res.ok) {
      console.log(`  ⚠️  Server unavailable (${res.status}). Will retry when it's back online.`);
      return null;
    }
    const data = await res.json();
    const plugins = data.data.map(f => ({
      name: f.attributes.name,
      size: f.attributes.size,
      isFile: f.attributes.is_file,
    }));
    plugins.filter(p => p.isFile).forEach(p => {
      console.log(`  📄 ${p.name} (${Math.round(p.size/1024)}KB)`);
    });
    return plugins;
  } catch (e) {
    console.log(`  ⚠️  Cannot reach server: ${e.message}`);
    return null;
  }
}

async function uploadPlugin(buffer, filename) {
  console.log(`  ⬆️  Uploading ${filename} to /plugins/...`);
  
  // Get upload URL
  const uploadUrlRes = await fetch(`${BASE_URL}/files/upload`, { headers });
  if (!uploadUrlRes.ok) {
    throw new Error(`Failed to get upload URL: ${uploadUrlRes.status}`);
  }
  const uploadData = await uploadUrlRes.json();
  const uploadUrl = uploadData.attributes.url;

  // Upload using the signed URL
  const formData = new FormData();
  const blob = new Blob([buffer], { type: 'application/java-archive' });
  formData.append('files', blob, filename);

  const upRes = await fetch(`${uploadUrl}&directory=/plugins`, {
    method: 'POST',
    body: formData,
  });

  if (upRes.ok || upRes.status === 204) {
    console.log(`  ✅ ${filename} uploaded successfully!`);
    return true;
  } else {
    throw new Error(`Upload failed: ${upRes.status} ${upRes.statusText}`);
  }
}

async function sendCommand(command) {
  const res = await fetch(`${BASE_URL}/command`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ command }),
  });
  return res.ok || res.status === 204;
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

// ============================================================
// MAIN ACTIONS
// ============================================================

async function downloadAll() {
  console.log('📦 Downloading all plugins locally...\n');
  fs.mkdirSync(PLUGIN_DIR, { recursive: true });

  // Resolve PacketEvents URL first
  const peInfo = await resolvePacketEventsUrl();
  if (peInfo) {
    const pPlugin = PLUGINS.find(p => p.name === 'PacketEvents');
    pPlugin.url = peInfo.url;
    pPlugin.version = peInfo.version;
  }

  const results = [];
  for (const plugin of PLUGINS) {
    console.log(`\n📦 ${plugin.name} v${plugin.version}`);
    console.log(`   ${plugin.description}`);
    if (!plugin.url) {
      console.log(`  ❌ No download URL available!`);
      results.push({ name: plugin.name, success: false });
      continue;
    }
    try {
      const filepath = path.join(PLUGIN_DIR, plugin.filename);
      await downloadFile(plugin.url, filepath);
      results.push({ name: plugin.name, success: true });
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
      results.push({ name: plugin.name, success: false });
    }
  }

  console.log('\n\n📊 Download Results:');
  console.log('═══════════════════════════════');
  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.name}`);
  });

  if (results.every(r => r.success)) {
    console.log('\n✅ All plugins downloaded! Run with "upload" when the server is back online.');
  } else {
    console.log('\n⚠️  Some downloads failed. Check errors above.');
  }
}

async function uploadAll() {
  console.log('📤 Uploading all plugins to server...\n');

  // Check if server is accessible
  const existing = await listServerPlugins();
  if (!existing) {
    console.log('\n❌ Server is not accessible. Try again when it\'s back online.');
    return;
  }

  // Safety: confirm NBT-API is present and won't be touched
  const nbtApi = existing.find(p => p.name.toLowerCase().includes('nbt'));
  if (nbtApi) {
    console.log(`\n🔒 PROTECTED: ${nbtApi.name} — Will NOT be modified\n`);
  }

  const results = [];
  for (const plugin of PLUGINS) {
    const filepath = path.join(PLUGIN_DIR, plugin.filename);
    if (!fs.existsSync(filepath)) {
      console.log(`\n❌ ${plugin.filename} not found locally. Run "download" first.`);
      results.push({ name: plugin.name, success: false });
      continue;
    }

    console.log(`\n📦 ${plugin.name}`);
    try {
      const buffer = fs.readFileSync(filepath);
      await uploadPlugin(buffer, plugin.filename);
      results.push({ name: plugin.name, success: true });
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
      results.push({ name: plugin.name, success: false });
    }
  }

  console.log('\n\n📊 Upload Results:');
  console.log('═══════════════════════════════');
  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.name}`);
  });

  if (results.every(r => r.success)) {
    console.log('\n✅ All plugins uploaded! Restarting server...');
    await restartServer();
    console.log('\n⏳ Wait ~30-60 seconds for restart, then run with "verify" to check /plugins');
  }
}

async function verify() {
  console.log('🔍 Verifying plugins loaded...\n');
  const success = await sendCommand('plugins');
  if (success) {
    console.log('✅ "plugins" command sent! Check the server console for the output.');
    console.log('   Expected green: ProtocolLib, PacketEvents, LibsDisguises, HexNicks, item-nbt-api');
  } else {
    console.log('❌ Could not send command. Server might still be restarting.');
  }
}

// ============================================================
// CLI
// ============================================================

const action = process.argv[2] || 'download';

switch (action) {
  case 'download':
    await downloadAll();
    break;
  case 'upload':
    await uploadAll();
    break;
  case 'verify':
    await verify();
    break;
  case 'status':
    await listServerPlugins();
    break;
  default:
    console.log('Usage: node install-plugins.mjs [download|upload|verify|status]');
}
