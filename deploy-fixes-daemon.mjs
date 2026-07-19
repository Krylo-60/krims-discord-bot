import { spawn } from 'child_process';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import fs from 'fs';

const token = 'ptlc_y3F1H2hfU3S7JTftuECr7LMhJNaDod1HYaF4gVJ2jnE';
const serverId = '25a5d79a';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ChromeDevProfile';

const downloads = [
  { name: 'TAB.jar', url: 'https://cdn.modrinth.com/data/gG7VFbG0/versions/t5Bd9Ajx/TAB%20v6.1.0.jar', path: 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\TAB.jar' },
  { name: 'Prism.jar', url: 'https://cdn.modrinth.com/data/oLV8Vvxy/versions/z9Ixab2u/prism-paper-v4.4.jar', path: 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\Prism.jar' }
];

async function run() {
  console.log("====================================================");
  console.log("STARTING 26.2 FIXES DAEMON...");
  console.log("====================================================");

  for (const item of downloads) {
    if (!fs.existsSync(item.path)) {
      console.log(`Downloading ${item.name}...`);
      const res = await fetch(item.url);
      if (!res.ok) throw new Error(`Failed to download ${item.name}`);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(item.path, Buffer.from(buffer));
      console.log(`Saved ${item.name} to disk.`);
    }
  }

  console.log("Launching visible Chrome...");
  const chromeProcess = spawn(chromePath, [
    '--remote-debugging-port=64359',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2000));

  try {
    const versionRes = await fetch('http://127.0.0.1:64359/json/version');
    const versionData = await versionRes.json();
    const wsUrl = versionData.webSocketDebuggerUrl;

    const ws = new WebSocket(wsUrl);
    await new Promise((resolve) => ws.on('open', resolve));

    let id = 1;
    const send = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const listener = (data) => {
          const res = JSON.parse(data.toString());
          if (res.id === msgId) {
            ws.off('message', listener);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.on('message', listener);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    };

    console.log("Creating browser tab on play.hosting...");
    const { targetId } = await send('Target.createTarget', { url: 'https://panel.play.hosting/login' });
    
    console.log("Attaching session...");
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });

    const sessionSend = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const listener = (data) => {
          const res = JSON.parse(data.toString());
          if (res.id === msgId && res.sessionId === sessionId) {
            ws.off('message', listener);
            if (res.error) reject(res.error);
            else resolve(res.result);
          }
        };
        ws.on('message', listener);
        ws.send(JSON.stringify({ id: msgId, sessionId, method, params }));
      });
    };

    await sessionSend('Page.enable');
    await new Promise(r => setTimeout(r, 5000)); // wait for navigation

    let attempts = 0;
    const maxAttempts = 240; // 2 hours
    console.log("Starting queue status monitoring loop...");

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[Attempt ${attempts}/${maxAttempts}] Checking if server file manager is accessible...`);

      const checkScript = `
        (async () => {
          try {
            const res = await fetch('/api/client/servers/${serverId}/files/upload?directory=%2Fplugins', {
              headers: { 'Authorization': 'Bearer ${token}', 'Accept': 'application/json' }
            });
            if (res.ok) {
              const data = await res.json();
              return { success: true, uploadUrl: data.attributes.url };
            }
            const body = await res.text();
            return { success: false, status: res.status, body: body.substring(0, 150) };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })()
      `;

      try {
        const evalRes = await sessionSend('Runtime.evaluate', {
          expression: checkScript,
          awaitPromise: true,
          returnByValue: true
        });

        const status = evalRes.result.value;
        console.log("Status response:", JSON.stringify(status));

        if (status && status.success) {
          const uploadUrl = status.uploadUrl;
          console.log("Server file manager is accessible! Deleting old plugins...");

          const deleteScript = `
            (async () => {
              try {
                const res = await fetch('/api/client/servers/${serverId}/files/delete', {
                  method: 'POST',
                  headers: {
                    'Authorization': 'Bearer ${token}',
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify({
                    root: '/plugins',
                    files: ['CoreProtect.jar', 'TAB.jar']
                  })
                });
                return res.ok;
              } catch (e) {
                return false;
              }
            })()
          `;

          const delEval = await sessionSend('Runtime.evaluate', {
            expression: deleteScript,
            awaitPromise: true,
            returnByValue: true
          });
          console.log("Delete status result:", delEval.result.value);

          // Upload correct ones
          for (const item of downloads) {
            console.log(`Uploading ${item.name} directly to Wings node...`);
            const fileBytes = fs.readFileSync(item.path);
            const formData = new FormData();
            formData.append('files', new Blob([fileBytes]), item.name);

            const uploadRes = await fetch(uploadUrl + '&directory=%2Fplugins', {
              method: 'POST',
              body: formData
            });
            console.log(`${item.name} upload status: ${uploadRes.status}`);
          }

          // Trigger restart
          console.log("Triggering server restart...");
          const restartScript = `
            (async () => {
              try {
                const res = await fetch('/api/client/servers/${serverId}/power', {
                  method: 'POST',
                  headers: {
                    'Authorization': 'Bearer ${token}',
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ signal: 'restart' })
                });
                return { success: res.ok, status: res.status };
              } catch (e) {
                return { success: false, error: e.message };
              }
            })()
          `;

          const restartRes = await sessionSend('Runtime.evaluate', {
            expression: restartScript,
            awaitPromise: true,
            returnByValue: true
          });

          console.log("RESTART COMMAND RESULT:", JSON.stringify(restartRes.result.value, null, 2));
          break;
        }
      } catch (e) {
        console.error("Evaluation/Upload error:", e.message);
      }

      // Wait 3 minutes before next check
      await new Promise(r => setTimeout(r, 180000));
    }

    console.log("Closing browser and terminating...");
    await send('Target.closeTarget', { targetId });
    ws.close();
    chromeProcess.kill();
  } catch (err) {
    console.error("Daemon error:", err.message);
    chromeProcess.kill();
  }
}

run();
