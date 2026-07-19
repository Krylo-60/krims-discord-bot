import fetch from 'node-fetch';

async function run() {
  try {
    const res = await fetch('http://localhost:9222/json/version');
    const text = await res.text();
    console.log("Raw version text:", text);
    try {
      const data = JSON.parse(text);
      console.log("Version Info:", JSON.stringify(data, null, 2));
    } catch (e) {
      console.error("Failed to parse version JSON:", e.message);
    }

    const listRes = await fetch('http://localhost:9222/json/list');
    const listText = await listRes.text();
    console.log("Raw list text:", listText);
    try {
      const listData = JSON.parse(listText);
      console.log("Targets List:", JSON.stringify(listData, null, 2));
    } catch (e) {
      console.error("Failed to parse list JSON:", e.message);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

run();
