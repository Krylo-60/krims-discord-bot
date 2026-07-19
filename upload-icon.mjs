import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

async function uploadIcon() {
  const serverId = "25a5d79a";
  const token = "ptlc_y3F1H2hfU3S7JTftuECr7LMhJNaDod1HYaF4gVJ2jnE";
  const filename = "server-icon.png";
  const filePath = path.resolve(filename);

  console.log(`Reading local ${filename} from ${filePath}...`);
  if (!fs.existsSync(filePath)) {
    console.error(`Local file ${filename} not found.`);
    process.exit(1);
  }
  const fileBuffer = fs.readFileSync(filePath);

  try {
    console.log("Fetching Pterodactyl upload URL...");
    const uploadRes = await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/files/upload?directory=%2F`, {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (!uploadRes.ok) {
      throw new Error(`Failed to get upload URL: status ${uploadRes.status} ${uploadRes.statusText}`);
    }

    const uploadData = await uploadRes.json();
    const uploadUrl = uploadData.attributes.url;
    console.log(`Upload URL retrieved: ${uploadUrl}`);

    console.log(`Uploading ${filename} to root directory...`);
    
    // Use native FormData
    const formData = new FormData();
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('files', blob, filename);

    const uploadFileRes = await fetch(`${uploadUrl}&directory=%2F`, {
      method: "POST",
      body: formData
    });

    console.log(`Upload response status: ${uploadFileRes.status}`);
    if (uploadFileRes.status === 200 || uploadFileRes.status === 204) {
      console.log(`${filename} uploaded successfully!`);

      console.log("Requesting Minecraft server restart...");
      const powerRes = await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/power`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({ signal: "restart" })
      });
      console.log(`Restart request response status: ${powerRes.status}`);
    } else {
      console.error(`Upload failed with status ${uploadFileRes.status}`);
    }
  } catch (e) {
    console.error("Error during upload:", e.message);
  }
}

uploadIcon();
