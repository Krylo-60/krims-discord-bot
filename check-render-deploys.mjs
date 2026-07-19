import fetch from 'node-fetch';

async function test() {
  console.log("Checking Render Deploys...");
  try {
    const res = await fetch('https://api.render.com/v1/services/srv-d9e24fjtqb8s739l8sd0/deploys', {
      headers: {
        'Authorization': 'Bearer rnd_wbGErXhwQVd0zGcbcuv2D3H3S70B',
        'Accept': 'application/json'
      }
    });
    console.log("Status:", res.status);
    const deploys = await res.json();
    console.log("Deploys list (recent first):");
    console.log(JSON.stringify(deploys.slice(0, 3), null, 2));
  } catch (err) {
    console.error("Render deploys check failed:", err.message);
  }
}

test();
