async function wakeUpRenderService() {
  console.log('[🚀 WAKING UP RENDER SERVICE] Pinging https://krims-discord-bot.onrender.com...');
  try {
    const start = Date.now();
    const res = await fetch('https://krims-discord-bot.onrender.com');
    const duration = Date.now() - start;
    console.log(`[✅ RENDER SERVICE AWAKE!] Status Code: ${res.status} (Response time: ${duration}ms)`);
  } catch (err) {
    console.error('[-] Wake up error:', err.message);
  }
}

wakeUpRenderService();
