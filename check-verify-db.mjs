import fetch from 'node-fetch';

async function check() {
  try {
    const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId: '1524878881918685405' })
    });
    if (res.ok) {
      const config = await res.json();
      console.log("Raw Vercel response:", JSON.stringify(config, null, 2));
    } else {
      console.log("Failed to fetch. Status:", res.status);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}
check();
