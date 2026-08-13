import fetch from 'node-fetch';

const RENDER_API_KEY = 'rnd_wbGErXhwQVd0zGcbcuv2D3H3S70B';
const SERVICE_ID = 'srv-d9e24fjtqb8s739l8sd0';

async function checkAndDeploy() {
  console.log('Checking Render service status...');
  const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys?limit=5`, {
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Accept': 'application/json'
    }
  });

  const deploys = await res.json();
  console.log('Latest Deploys:');
  for (const d of deploys) {
    console.log(`- ID: ${d.deploy.id} | Status: ${d.deploy.status} | Commit: ${d.deploy.commit?.message?.substring(0, 50)} | Created: ${d.deploy.createdAt}`);
  }

  // Trigger a fresh manual deploy with latest commit to be 100% sure!
  console.log('\nTriggering instant manual deploy on Render...');
  const deployRes = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ clearCache: 'do_not_clear' })
  });

  const newDeploy = await deployRes.json();
  console.log(`Triggered new deploy: ${newDeploy.id} | Status: ${newDeploy.status}`);
}

checkAndDeploy().catch(console.error);
