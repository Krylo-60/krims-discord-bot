import dotenv from 'dotenv';
dotenv.config();

const RENDER_API_KEY = process.env.RENDER_API_KEY;
const SERVICE_ID = 'srv-danuvho473hc73ar1go0';

async function deploy() {
  const res = await fetch(`https://api.render.com/v1/services/${SERVICE_ID}/deploys`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RENDER_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ clearCache: 'do_not_clear' })
  });
  console.log('Deploy status:', res.status, res.statusText);
}

deploy().catch(console.error);
