import dotenv from 'dotenv';
dotenv.config();

const RENDER_API_KEY = process.env.RENDER_API_KEY;

async function checkRenderStatus() {
  console.log('[🚀 RENDER API CHECK] Fetching Render service status for krims-discord-bot...');

  try {
    const res = await fetch('https://api.render.com/v1/services', {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.error('[-] Render API error status:', res.status, await res.text());
      return;
    }

    const services = await res.json();
    console.log('[+] Total Render Services found:', services.length);

    services.forEach(item => {
      const s = item.service;
      console.log(`\n📌 Service Name: ${s.name}`);
      console.log(`   ID: ${s.id}`);
      console.log(`   Service Type: ${s.type}`);
      console.log(`   URL: ${s.serviceDetails?.url || 'Background Worker / Web'}`);
      console.log(`   Created At: ${s.createdAt}`);
      console.log(`   Updated At: ${s.updatedAt}`);
    });

    // Check deploy status for first service
    if (services.length > 0) {
      const serviceId = services[0].service.id;
      const deploysRes = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys?limit=5`, {
        headers: {
          'Authorization': `Bearer ${RENDER_API_KEY}`,
          'Accept': 'application/json'
        }
      });
      if (deploysRes.ok) {
        const deploys = await deploysRes.json();
        console.log('\n🚀 Recent Deploys:');
        deploys.forEach(d => {
          console.log(`   Deploy ID: ${d.deploy.id} | Status: ${d.deploy.status} | Created: ${d.deploy.createdAt}`);
        });
      }
    }
  } catch (err) {
    console.error('[-] Render API check error:', err.message);
  }
}

checkRenderStatus();
