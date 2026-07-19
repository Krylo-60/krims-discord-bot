import fetch from 'node-fetch';

async function test() {
  console.log("Testing request_verification endpoint...");
  try {
    const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'request_verification',
        guildId: '1524878881918685405',
        name: 'Krylo_MC',
        discordUserId: '1414143825538191373'
      })
    });

    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text:", text);
  } catch (err) {
    console.error("Error:", err.message);
  }
}
test();
