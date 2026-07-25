import net from 'net';

async function birthdayCheckAllStatus() {
  console.log('🎉 [HAPPY BIRTHDAY KRISHIV!] Checking KryloSMP system status on July 24th...');

  // 1. Check Minecraft Server Port 25565
  const client = new net.Socket();
  client.setTimeout(5000);

  client.on('connect', () => {
    console.log('[✅ KRYLOSMP MINECRAFT SERVER] 100% ONLINE at KryloSmp.play.hosting:25565');
    client.destroy();
  });

  client.on('timeout', () => {
    console.log('[⚠️ KRYLOSMP MINECRAFT SERVER] Timeout connecting to port 25565');
    client.destroy();
  });

  client.on('error', (err) => {
    console.log('[⚠️ KRYLOSMP MINECRAFT SERVER] Connection error:', err.message);
    client.destroy();
  });

  client.connect(25565, 'KryloSmp.play.hosting');

  // 2. Check Storefront
  try {
    const storeRes = await fetch('https://krylosmp-store.vercel.app');
    console.log(`[✅ KRYLOSMP WEBSTORE] Status Code: ${storeRes.status} (https://krylosmp-store.vercel.app)`);
  } catch (e) {
    console.log('[⚠️ KRYLOSMP WEBSTORE] Error fetching webstore:', e.message);
  }

  // 3. Check Discord Bot API endpoint
  try {
    const botRes = await fetch('https://krims-code-chatbot.vercel.app');
    console.log(`[✅ KRIMS DISCORD BOT API] Status Code: ${botRes.status}`);
  } catch (e) {
    console.log('[⚠️ KRIMS DISCORD BOT API] Error fetching bot API:', e.message);
  }
}

birthdayCheckAllStatus();
