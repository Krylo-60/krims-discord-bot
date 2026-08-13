import fetch from 'node-fetch';

async function checkBalance() {
  console.log('🔍 FETCHING PERSONAL KRYLOCOINS BALANCE FROM SERVER...');

  try {
    const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId: '142099184554632162' })
    });

    if (res.ok) {
      const config = await res.json();
      console.log('\n--- SERVER ECONOMY DATA ---');
      if (config.economyData) {
        console.log(JSON.stringify(config.economyData, null, 2));
      } else {
        console.log('Default starting wallet balance: 10,000 KryloCoins (KC)');
      }
    } else {
      console.log('[-] Server responded with status:', res.status);
    }
  } catch (err) {
    console.error('[-] Error fetching balance:', err.message);
  }
}

checkBalance();
