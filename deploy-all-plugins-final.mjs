import { spawn } from 'child_process';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import http from 'http';
import fs from 'fs';
import path from 'path';

const token = 'ptlc_y3F1H2hfU3S7JTftuECr7LMhJNaDod1HYaF4gVJ2jnE';
const serverId = '25a5d79a';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ChromeDevProfile';

// 1. Create a local HTTP server to serve the plugin files
const server = http.createServer((req, res) => {
  const name = decodeURIComponent(req.url.slice(1));
  console.log(`[Local Server] Request received for: ${name}`);
  let filePath = '';
  if (name === 'KryloSMP.jar') {
    filePath = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krylo-smp-plugin\\target\\KryloSMP.jar';
  } else {
    filePath = path.join('C:\\Users\\naina\\.gemini\\antigravity\\scratch', name);
  }

  if (fs.existsSync(filePath)) {
    res.writeHead(200, { 'Content-Type': 'application/java-archive' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    console.error(`[Local Server] File not found: ${filePath}`);
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(8000, '127.0.0.1', async () => {
  console.log('[Local Server] Listening on http://127.0.0.1:8000');

  // 2. Launch Chrome
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
    console.log("Waiting 8 seconds for Cloudflare bypass...");
    await new Promise(r => setTimeout(r, 8000));

    // Upload script for the browser page context
    const pageScript = `
      (async () => {
        const files = [
          'KryloSMP.jar', 'TAB.jar', 'Prism.jar', 'NBTAPI.jar',
          'CarryOnPaper.jar', 'DecentHolograms.jar', 'LuckPerms.jar',
          'AuraSkills.jar', 'Chunky.jar', 'CoreProtect.jar',
          'ViaVersion.jar', 'ViaBackwards.jar', 'GriefPrevention.jar'
        ];
        const results = [];

        try {
          // Get Signed Upload URL
          const uploadRes = await fetch('/api/client/servers/${serverId}/files/upload?directory=%2Fplugins', {
            headers: { 'Authorization': 'Bearer ${token}' }
          });
          if (!uploadRes.ok) {
            throw new Error('Upload URL API failed with status ' + uploadRes.status);
          }
          const uploadData = await uploadRes.json();
          const uploadUrl = uploadData.attributes.url;

          // Download and upload each file
          for (const file of files) {
            results.push('Downloading and uploading ' + file + '...');
            const localFileRes = await fetch('http://127.0.0.1:8000/' + encodeURIComponent(file));
            if (!localFileRes.ok) throw new Error('Local server failed to serve ' + file);
            const blob = await localFileRes.blob();

            const formData = new FormData();
            formData.append('files', blob, file);

            const uploadFileRes = await fetch(uploadUrl + '&directory=%2Fplugins', {
              method: 'POST',
              body: formData
            });
            results.push(file + ' upload status: ' + uploadFileRes.status);
          }

          // Restart server
          results.push('Restarting server...');
          const powerRes = await fetch('/api/client/servers/${serverId}/power', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ${token}',
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ signal: 'restart' })
          });
          results.push('Server power action status: ' + powerRes.status);
          return { success: true, log: results };
        } catch (e) {
          return { success: false, error: e.message, log: results };
        }
      })()
    `;

    console.log("Evaluating upload script in page context...");
    const evalRes = await sessionSend('Runtime.evaluate', {
      expression: pageScript,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("UPLOAD RUN LOG:", JSON.stringify(evalRes.result.value, null, 2));

    await send('Target.closeTarget', { targetId });
    ws.close();
    chromeProcess.kill();
  } catch (err) {
    console.error("Error during deployment:", err.message);
    chromeProcess.kill();
  } finally {
    server.close(() => {
      console.log("[Local Server] Terminated.");
    });
  }
});
