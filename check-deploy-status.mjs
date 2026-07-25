import fetch from 'node-fetch';
import 'dotenv/config';

const apiKey = process.env.RENDER_API_KEY;
const serviceId = 'srv-d9e24fjtqb8s739l8sd0';

async function checkDeployStatus() {
  try {
    const res = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys?limit=1`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json'
      }
    });

    if (res.ok) {
      const deploys = await res.json();
      const latest = deploys[0]?.deploy || deploys[0];
      console.log(`[📊 LATEST RENDER DEPLOY STATUS] ID: ${latest.id}`);
      console.log(`• Status: ${latest.status}`);
      console.log(`• Commit: ${latest.commit?.message} (${latest.commit?.id.substring(0, 7)})`);
      console.log(`• Started At: ${latest.startedAt}`);
      console.log(`• Finished At: ${latest.finishedAt || 'Building...'}`);
    }
  } catch (err) {
    console.error('[-] Check status error:', err.message);
  }
}

checkDeployStatus();
