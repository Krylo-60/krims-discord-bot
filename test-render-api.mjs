import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.RENDER_API_KEY;

async function triggerRenderDeploy() {
  console.log('[+] Authenticating with Render REST API...');
  
  try {
    // 1. Fetch services to get service ID
    const res = await fetch('https://api.render.com/v1/services?limit=20', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.error('[-] Failed to fetch Render services:', res.status, await res.text());
      return;
    }

    const services = await res.json();
    console.log(`[+] Found ${services.length} Render service(s):`);
    
    let botServiceId = null;
    for (const item of services) {
      const s = item.service || item;
      console.log(`  • Service: "${s.name}" (ID: ${s.id})`);
      if (s.name.includes('krims-discord-bot') || s.name.includes('bot')) {
        botServiceId = s.id;
      }
    }

    if (!botServiceId && services.length > 0) {
      botServiceId = (services[0].service || services[0]).id;
    }

    if (botServiceId) {
      console.log(`\n[🚀 TRIGGERING RENDER DEPLOY] Triggering deploy for service ID: ${botServiceId}...`);
      const deployRes = await fetch(`https://api.render.com/v1/services/${botServiceId}/deploys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ clearCache: 'do_not_clear' })
      });

      if (deployRes.ok) {
        const deployData = await deployRes.json();
        console.log('[✅ RENDER DEPLOY SUCCESSFUL!] Deploy status:', deployData.status || 'Created', deployData);
      } else {
        console.error('[-] Deploy trigger failed:', deployRes.status, await deployRes.text());
      }
    } else {
      console.error('[-] No matching service ID found on Render account.');
    }
  } catch (err) {
    console.error('[-] Render API Error:', err.message);
  }
}

triggerRenderDeploy();
