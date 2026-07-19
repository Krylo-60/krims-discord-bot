import fetch from 'node-fetch';

async function test() {
  console.log("Checking Render API...");
  try {
    const res = await fetch('https://api.render.com/v1/services', {
      headers: {
        'Authorization': 'Bearer rnd_wbGErXhwQVd0zGcbcuv2D3H3S70B',
        'Accept': 'application/json'
      }
    });
    console.log("Status:", res.status);
    const services = await res.json();
    console.log("Services list:");
    console.log(JSON.stringify(services, null, 2));
  } catch (err) {
    console.error("Render check failed:", err.message);
  }
}

test();
