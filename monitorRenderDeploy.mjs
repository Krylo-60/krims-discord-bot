import fetch from 'node-fetch';

const RENDER_API_KEY = 'rnd_wbGErXhwQVd0zGcbcuv2D3H3S70B';
const SERVICE_ID = 'srv-d9e24fjtqb8s739l8sd0';

async function monitorDeploy() {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys?limit=1`, {
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json'
      }
    });

    const deploys = await res.json();
    const latest = deploys[0]?.deploy;
    console.log(`[${new Date().toLocaleTimeString()}] Status: ${latest?.status} | ID: ${latest?.id}`);

    if (latest?.status === 'live') {
      console.log('🎉 Deploy is now 100% LIVE and active on Render!');
      break;
    }
    if (latest?.status === 'build_failed' || latest?.status === 'canceled') {
      console.error('❌ Build failed or canceled!');
      break;
    }

    await new Promise(r => setTimeout(r, 4000));
  }
}

monitorDeploy();
