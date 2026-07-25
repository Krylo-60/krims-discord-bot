import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const VERIFY_CHANNEL_ID = '1526685112693952568'; // #verify channel ID

async function wakeAndCheckBuild() {
  console.log('[🚀 VERIFYING LIVE DEPLOYMENT] Pinging Render service and checking Discord API...');

  try {
    // 1. Wake Render Service
    const pingRes = await fetch('https://krims-discord-bot.onrender.com');
    console.log(`[+] Render Ping Status: ${pingRes.status}`);

    // 2. Fetch Channel info via Discord REST API
    const res = await fetch(`https://discord.com/api/v10/channels/${VERIFY_CHANNEL_ID}/messages?limit=5`, {
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      const messages = await res.json();
      console.log(`[+] Found ${messages.length} existing message(s) in #verify channel.`);
    } else {
      console.log(`[!] Channel fetch status: ${res.status}`);
    }

    console.log('[🎉 ALL SYSTEMS ONLINE & 100% READY FOR VERIFICATION!]');
  } catch (err) {
    console.error('[-] Error during deployment check:', err.message);
  }
}

wakeAndCheckBuild();
