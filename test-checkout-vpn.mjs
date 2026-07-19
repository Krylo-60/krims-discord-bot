import fetch from 'node-fetch';

async function test() {
  console.log("Testing checkout API...");
  try {
    const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-forwarded-for': '8.8.8.8' // Non-VPN test IP
      },
      body: JSON.stringify({
        action: 'checkout',
        guildId: '1524878881918685405',
        username: 'Krylo_MC',
        discordUserId: '1414143825538191373',
        cart: ['vip-rank'],
        promoCode: 'KRYLO'
      })
    });
    console.log("Status:", res.status);
    console.log("Response text:", await res.text());
  } catch (err) {
    console.error("Test failed:", err.message);
  }
}

test();
