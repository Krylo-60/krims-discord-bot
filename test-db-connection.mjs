import fetch from 'node-fetch';

async function test() {
  try {
    const dbRes = await fetch('https://api.restful-api.dev/objects/ff8081819d82fab6019f3d7966d42bd0');
    console.log("DB GET Status:", dbRes.status);
    
    if (dbRes.ok) {
      const dbData = await dbRes.json();
      console.log("DB GET Data keys:", Object.keys(dbData));
      
      const currentConfig = dbData.data || {};
      currentConfig.pendingVerifications = currentConfig.pendingVerifications || {};
      
      // Cleanup old verifications (older than 30 mins)
      const now = Date.now();
      for (const [k, v] of Object.entries(currentConfig.pendingVerifications)) {
        if (now - v.timestamp > 30 * 60 * 1000) {
          delete currentConfig.pendingVerifications[k];
        }
      }
      
      // Add/Overwrite pending link request
      currentConfig.pendingVerifications['krylo_mc'] = {
        name: 'Krylo_MC',
        discordUserId: '1414143825538191373',
        code: null,
        timestamp: now
      };

      currentConfig.economyData = currentConfig.economyData || {};
      currentConfig.economyData['Krylo_MC'] = { balance: 1000 };
      
      console.log("Attempting PUT to DB...");
      const putRes = await fetch('https://api.restful-api.dev/objects/ff8081819d82fab6019f3d7966d42bd0', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'KrimsConfig_1420991845546332162',
          data: currentConfig
        })
      });
      
      console.log("DB PUT Status:", putRes.status);
      const putText = await putRes.text();
      console.log("DB PUT Response:", putText);
    } else {
      console.log("Failed to fetch database object.");
    }
  } catch (err) {
    console.error("Caught error:", err.message);
  }
}
test();
