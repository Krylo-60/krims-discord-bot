import fetch from 'node-fetch';

async function listServers() {
  const token = "ptlc_y3F1H2hfU3S7JTftuECr7LMhJNaDod1HYaF4gVJ2jnE";
  try {
    const res = await fetch("https://panel.play.hosting/api/client", {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      console.log("=== Pterodactyl Servers ===");
      for (const server of data.data) {
        console.log(`- Name: ${server.attributes.name} | ID: ${server.attributes.identifier} | Node: ${server.attributes.node}`);
      }
    } else {
      console.error("Failed to list servers:", res.status);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

listServers();
