import dotenv from 'dotenv';
dotenv.config();

const RENDER_API_KEY = process.env.RENDER_API_KEY;
const SERVICE_ID = 'srv-d9e24fjtqb8s739l8sd0';

async function triggerRenderDeploy() {
  console.log(`[🚀 TRIGGERING RENDER DEPLOY] Triggering fresh deploy for ${SERVICE_ID}...`);

  try {
    const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ clearCache: 'do_not_clear' })
    });

    if (!res.ok) {
      console.error('[-] Trigger deploy error status:', res.status, await res.text());
      return;
    }

    const deploy = await res.json();
    console.log('[🎉 RENDER DEPLOY TRIGGERED SUCCESSFULLY!]');
    console.log(`   Deploy ID: ${deploy.deploy.id}`);
    console.log(`   Status: ${deploy.deploy.status}`);
    console.log(`   Created At: ${deploy.deploy.createdAt}`);
  } catch (err) {
    console.error('[-] Trigger deploy error:', err.message);
  }
}

triggerRenderDeploy();
