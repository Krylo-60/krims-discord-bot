import fetch from 'node-fetch';

async function readProperties() {
  const serverId = "25a5d79a";
  const token = "ptlc_y3F1H2hfU3S7JTftuECr7LMhJNaDod1HYaF4gVJ2jnE";

  try {
    console.log("Fetching server.properties contents...");
    const res = await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/files/contents?file=server.properties`, {
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Accept": "application/json"
      }
    });

    if (res.ok) {
      const text = await res.text();
      console.log("=== server.properties ===");
      console.log(text);
    } else {
      console.error(`Failed to get file: status ${res.status} ${res.statusText}`);
      const errText = await res.text();
      console.error("Error response:", errText);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

readProperties();
