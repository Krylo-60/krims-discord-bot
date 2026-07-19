import { spawn } from 'child_process';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import fs from 'fs';

const token = 'ptlc_y3F1H2hfU3S7JTftuECr7LMhJNaDod1HYaF4gVJ2jnE';
const serverId = '25a5d79a';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ChromeDevProfile';
const jarPath = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krylo-smp-plugin\\target\\KryloSMP.jar';

async function run() {
  console.log("====================================================");
  console.log("LAUNCHING AUTO-ANNOUNCER DEPLOY DAEMON...");
  console.log("====================================================");

  const chromeProcess = spawn(chromePath, [
    '--remote-debugging-port=64359',
    `--user-data-dir=${userDataDir}`,
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 3000));

  try {
    console.log("Connecting to active Chrome DevTools on port 64359...");
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

    console.log("Creating check tab...");
    const { targetId } = await send('Target.createTarget', { url: 'https://panel.play.hosting/login' });
    
    console.log("Waiting 6 seconds for tab to load...");
    await new Promise(r => setTimeout(r, 6000));

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

    let deployed = false;

    // Loop until deployment succeeds
    while (!deployed) {
      console.log(`Checking file manager accessibility...`);
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
            return { success: false, status: res.status };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })()
      `;

      const checkEval = await sessionSend('Runtime.evaluate', {
        expression: checkScript,
        awaitPromise: true,
        returnByValue: true
      });

      const checkRes = checkEval.result.value;

      if (checkRes && checkRes.success && checkRes.uploadUrl) {
        console.log("====================================================");
        console.log("SERVER BOOTED! FILE MANAGER IS NOW ACCESSIBLE!");
        console.log("====================================================");

        console.log("Uploading upgraded KryloSMP.jar...");
        const uploadUrl = checkRes.uploadUrl;
        const fileBytes = fs.readFileSync(jarPath);
        const form = new FormData();
        form.append('files', new Blob([fileBytes]), 'KryloSMP.jar');

        const uploadRes = await fetch(uploadUrl + '&directory=%2Fplugins', {
          method: 'POST',
          body: form
        });

        console.log(`KryloSMP.jar upload status: ${uploadRes.status}`);

        console.log("Triggering server restart to load the announcer...");
        const restartScript = `
          (async () => {
            try {
              const res = await fetch('/api/client/servers/${serverId}/power', {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ${token}',
                  'Content-Type': 'application/json',
                  'Accept': 'application/json'
                },
                body: JSON.stringify({ signal: 'restart' })
              });
              return { success: res.ok, status: res.status };
            } catch (e) {
              return { success: false, error: e.message };
            }
          })()
        `;

        const restartEval = await sessionSend('Runtime.evaluate', {
          expression: restartScript,
          awaitPromise: true,
          returnByValue: true
        });

        console.log("Restart power signal response:", JSON.stringify(restartEval.result.value, null, 2));
        console.log("====================================================");
        console.log("AUTO-ANNOUNCER DEPLOYMENT COMPLETE!");
        console.log("====================================================");
        deployed = true;
      } else {
        console.log(`Server is still starting or in queue (Response code: ${checkRes ? checkRes.status : 'unknown'}). Waiting 20 seconds...`);
        await new Promise(r => setTimeout(r, 20000));
      }
    }

    await send('Target.closeTarget', { targetId });
    ws.close();
  } catch (err) {
    console.error("Execution error:", err.message);
  } finally {
    chromeProcess.kill();
  }
}

run().catch(err => console.error("Fatal error:", err.message));
