import fetch from 'node-fetch';

async function verifyKrylo() {
  console.log('[🚀 DIRECTLY VERIFYING PLAYER: Krylo_MC]');

  const guildId = '1524878881918685405';
  const username = 'Krylo_MC';

  // 1. Fetch current pending verifications or code from Vercel API
  try {
    const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId })
    });

    if (res.ok) {
      const config = await res.json();
      console.log('[+] Current config loaded!');
      console.log('[+] Pending verifications:', config.pendingVerifications || config.verifications || 'None');

      // Add to verified list
      if (!config.verifiedUsers) config.verifiedUsers = {};
      config.verifiedUsers['Krylo_MC'] = {
        discordTag: 'Krylo',
        verifiedAt: new Date().toISOString(),
        status: 'VERIFIED'
      };

      // Queue whitelist & starter rewards
      if (!config.pendingCommands) config.pendingCommands = [];
      config.pendingCommands.push(`whitelist add Krylo_MC`);
      config.pendingCommands.push(`give Krylo_MC minecraft:diamond 16`);
      config.pendingCommands.push(`give Krylo_MC minecraft:netherite_ingot 4`);
      config.pendingCommands.push(`say 🛡️ Real Human Player Krylo_MC has verified via Discord!`);

      const saveRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', guildId, config })
      });

      if (saveRes.ok) {
        console.log('[✅ Krylo_MC HAS BEEN DIRECTLY VERIFIED IN DATABASE & COMMANDS QUEUED!]');
      }
    }
  } catch (err) {
    console.error('[-] Error:', err.message);
  }
}

verifyKrylo();
