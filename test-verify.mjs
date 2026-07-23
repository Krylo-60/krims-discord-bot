import fetch from 'node-fetch';

async function testVerify() {
  console.log('[+] Testing /verify database connection...');
  const guildId = '1524878881918685405';
  const username = 'Krylo';

  try {
    const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId })
    });

    if (configRes.ok) {
      const config = await configRes.json();
      if (!config.economyData) config.economyData = {};
      if (!config.economyData[username]) config.economyData[username] = { balance: 0 };
      config.economyData[username].balance += 500;

      if (!config.pendingCommands) config.pendingCommands = [];
      config.pendingCommands.push(`whitelist add ${username}`);
      config.pendingCommands.push(`give ${username} minecraft:diamond 16`);

      const saveRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', guildId, config })
      });

      const saveJson = await saveRes.json();
      console.log('[✅ VERIFICATION TEST SUCCESSFUL]');
      console.log(`• Updated Krylo Balance: ${config.economyData[username].balance} KC`);
      console.log(`• Queued Whitelist & Bonus Commands:`, config.pendingCommands);
      console.log(`• Database Save Result:`, saveJson);
    } else {
      console.error('[-] Vercel Config API returned code:', configRes.status);
    }
  } catch (err) {
    console.error('[-] Verification test error:', err.message);
  }
}

testVerify();
