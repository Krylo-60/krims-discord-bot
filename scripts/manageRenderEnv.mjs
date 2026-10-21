import 'dotenv/config';

const apiKey = process.env.RENDER_API_KEY;
const srvId = 'srv-danuvho473hc73ar1go0';

const alphaToken = process.env.KRIMS_ALPHA_TOKEN;
const betaToken = process.env.KRIMS_BETA_TOKEN;

async function run() {
  console.log('[+] Fetching current environment variables from Render...');
  const res = await fetch(`https://api.render.com/v1/services/${srvId}/env-vars`, {
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Accept': 'application/json'
    }
  });

  if (!res.ok) {
    console.error('[-] Failed to fetch env vars:', res.status, await res.text());
    return;
  }

  const existingVars = await res.json();
  console.log(`[+] Found ${existingVars.length} existing variables on Render:`);

  // Transform into [{ key, value }]
  const envMap = new Map();
  for (const item of existingVars) {
    const k = item.envVar?.key || item.key;
    const v = item.envVar?.value || item.value;
    envMap.set(k, v);
    console.log(`    • ${k}`);
  }

  // Add or update KRIMS_ALPHA_TOKEN and KRIMS_BETA_TOKEN
  envMap.set('KRIMS_ALPHA_TOKEN', alphaToken);
  envMap.set('KRIMS_BETA_TOKEN', betaToken);

  const payload = Array.from(envMap.entries()).map(([key, value]) => ({ key, value }));

  console.log(`\n[+] Updating Render environment with ${payload.length} variables including KRIMS_ALPHA_TOKEN and KRIMS_BETA_TOKEN...`);

  const putRes = await fetch(`https://api.render.com/v1/services/${srvId}/env-vars`, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!putRes.ok) {
    console.error('[-] Failed to update env vars on Render:', putRes.status, await putRes.text());
    return;
  }

  console.log('[SUCCESS] Environment variables successfully updated on Render!');

  // Trigger manual deployment to immediately restart with new tokens
  console.log('[+] Triggering immediate redeploy on Render...');
  const deployRes = await fetch(`https://api.render.com/v1/services/${srvId}/deploys`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ clearCache: 'do_not_clear' })
  });

  if (!deployRes.ok) {
    console.warn('[-] Deploy trigger warning:', deployRes.status, await deployRes.text());
  } else {
    const deployData = await deployRes.json();
    console.log(`[SUCCESS] New deployment triggered on Render! Deploy ID: ${deployData.id || deployData.deploy?.id}`);
  }
}

run().catch(console.error);
