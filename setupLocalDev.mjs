import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const DEV_DIR = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krylosmp-local-dev';
if (!fs.existsSync(DEV_DIR)) fs.mkdirSync(DEV_DIR, { recursive: true });

async function setupLocalDev() {
  console.log('[+] Setting up 100% FREE Local Virtual Development Environment...');

  // 1. Fetch latest Paper 1.21.4 jar from official PaperMC API
  console.log('[+] Fetching latest Paper 1.21 jar from PaperMC API...');
  let paperUrl = '';
  try {
    const versionRes = await fetch('https://api.papermc.io/v2/projects/paper/versions/1.21.4');
    if (versionRes.ok) {
      const vData = await versionRes.json();
      const latestBuild = vData.builds[vData.builds.length - 1];
      paperUrl = `https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/${latestBuild}/downloads/paper-1.21.4-${latestBuild}.jar`;
    }
  } catch (e) {
    console.log('Error querying PaperMC API, fallback to direct download:', e.message);
  }

  if (!paperUrl) {
    paperUrl = 'https://api.papermc.io/v2/projects/paper/versions/1.21.4/builds/112/downloads/paper-1.21.4-112.jar';
  }

  console.log('Downloading Paper jar from ' + paperUrl + '...');
  const jarRes = await fetch(paperUrl);
  const jarBuf = Buffer.from(await jarRes.arrayBuffer());
  const jarPath = path.join(DEV_DIR, 'paper.jar');
  fs.writeFileSync(jarPath, jarBuf);
  console.log('✅ Saved paper.jar (' + (jarBuf.length / 1024 / 1024).toFixed(1) + ' MB)');

  // 2. Accept EULA
  fs.writeFileSync(path.join(DEV_DIR, 'eula.txt'), 'eula=true\n');
  console.log('✅ Created eula.txt (eula=true)');

  // 3. Create server.properties
  const props = [
    '# Minecraft server properties - Local Dev Sandbox',
    'gamemode=creative',
    'difficulty=peaceful',
    'pvp=true',
    'max-players=20',
    'online-mode=false',
    'allow-flight=true',
    'view-distance=10',
    'server-port=25565',
    'motd=KryloSMP Local Dev Sandbox [0ms Ping]',
    'spawn-protection=0',
    ''
  ].join('\n');
  fs.writeFileSync(path.join(DEV_DIR, 'server.properties'), props);
  console.log('✅ Created server.properties');

  // 4. Create plugins directory and copy plugins
  const pluginsDir = path.join(DEV_DIR, 'plugins');
  if (!fs.existsSync(pluginsDir)) fs.mkdirSync(pluginsDir, { recursive: true });

  const weSrc = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\paper_plugins\\worldedit-bukkit-7.4.5.jar';
  if (fs.existsSync(weSrc)) {
    fs.copyFileSync(weSrc, path.join(pluginsDir, 'worldedit-bukkit-7.4.5.jar'));
    console.log('✅ Copied WorldEdit plugin');
  }

  const vcSrc = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\paper_plugins\\voicechat-bukkit-2.6.21.jar';
  if (fs.existsSync(vcSrc)) {
    fs.copyFileSync(vcSrc, path.join(pluginsDir, 'voicechat-bukkit-2.6.21.jar'));
    console.log('✅ Copied Simple Voice Chat plugin');
  }

  // 5. Create schematics directory and copy schematics
  const weSchemDir = path.join(pluginsDir, 'WorldEdit', 'schematics');
  if (!fs.existsSync(weSchemDir)) fs.mkdirSync(weSchemDir, { recursive: true });
  
  const schemSrc = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\server_package\\schematics\\crystal_hub.schem';
  if (fs.existsSync(schemSrc)) {
    fs.copyFileSync(schemSrc, path.join(weSchemDir, 'crystal_hub.schem'));
    console.log('✅ Copied crystal_hub.schem into WorldEdit schematics');
  }

  // 6. Copy server-icon.png
  const iconSrc = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\server_package\\server-icon.png';
  if (fs.existsSync(iconSrc)) {
    fs.copyFileSync(iconSrc, path.join(DEV_DIR, 'server-icon.png'));
    console.log('✅ Copied 64x64 server-icon.png');
  }

  // 7. Create 1-Click Launch Batch file
  const batContent = [
    '@echo off',
    'title KryloSMP Local Virtual Dev Sandbox',
    'color 0b',
    'echo ========================================================',
    'echo   👑 KRYLOSMP LOCAL VIRTUAL DEVELOPMENT ENVIRONMENT',
    'echo   ⚡ 100% Free - 0ms Ping - Instant WorldEdit Sandbox',
    'echo ========================================================',
    'echo.',
    'echo Starting Minecraft Paper Server on localhost:25565...',
    'java -Xms2G -Xmx4G -jar paper.jar --nogui',
    'pause'
  ].join('\n');
  fs.writeFileSync(path.join(DEV_DIR, 'start_server.bat'), batContent);
  console.log('✅ Created start_server.bat');

  console.log('\n🎉 FREE LOCAL VIRTUAL SANDBOX FULLY CREATED!');
}

setupLocalDev();
