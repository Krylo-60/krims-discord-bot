async function testVercelVerifyApi() {
  console.log('[🚀 TESTING VERCEL VERIFICATION API] Checking https://krims-code-chatbot.vercel.app/api/chat...');

  try {
    const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'confirm_verification_code',
        guildId: '1524878881918685405',
        code: 'TESTCODE',
        discordUserId: '1414143825538191373'
      })
    });

    console.log(`[+] Vercel API Status Code: ${res.status}`);
    const text = await res.text();
    console.log('[+] Response Body:', text);
  } catch (err) {
    console.error('[-] Vercel API fetch error:', err.message);
  }
}

testVercelVerifyApi();
