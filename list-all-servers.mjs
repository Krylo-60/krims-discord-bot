import 'dotenv/config';
import fetch from 'node-fetch';

async function listServers() {
  const token = "${process.env.PTERODACTYL_TOKEN}";
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
