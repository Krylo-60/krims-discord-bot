import 'dotenv/config';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import WebSocket from 'ws';

const token = '${process.env.PTERODACTYL_TOKEN}';
const serverId = '25a5d79a';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ChromeDevProfile';

async function run() {
  console.log("Launching headless Chrome...");
  const chromeProcess = spawn(chromePath, [
    '--remote-debugging-port=64359',
    `--user-data-dir=${userDataDir}`,
    '--headless=new',
    '--disable-gpu',
    'about:blank'
  ]);

  // Wait 2 seconds for Chrome to start
  await new Promise(r => setTimeout(r, 2000));

  try {
    console.log("Fetching DevTools version endpoint...");
    const versionRes = await fetch('http://127.0.0.1:64359/json/version');
    const versionData = await versionRes.json();
    const wsUrl = versionData.webSocketDebuggerUrl;
    console.log("DevTools WebSocket URL:", wsUrl);

    console.log("Connecting to WebSocket...");
    const ws = new WebSocket(wsUrl);

    await new Promise((resolve) => ws.on('open', resolve));
    console.log("Connected to DevTools! Creating target page...");

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

    // Create a target on panel.play.hosting
    const { targetId } = await send('Target.createTarget', { url: 'https://panel.play.hosting/login' });
    console.log("Target page created:", targetId);

    // Attach to the page target
    const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
    console.log("Attached to target session:", sessionId);

    const sessionSend = (method, params = {}) => {
      return new Promise((resolve, reject) => {
        const msgId = id++;
        const listener = (data) => {
          const res = JSON.parse(data.toString());
          if (res.method === 'Target.receivedMessageFromTarget' && res.params.sessionId === sessionId) {
            const inner = JSON.parse(res.params.message);
            if (inner.id === msgId) {
              ws.off('message', listener);
              if (inner.error) reject(inner.error);
              else resolve(inner.result);
            }
          }
        };
        ws.on('message', listener);
        ws.send(JSON.stringify({
          id: msgId,
          method: 'Target.sendMessageToTarget',
          params: {
            sessionId,
            message: JSON.stringify({ id: msgId, method, params })
          }
        }));
      });
    };

    console.log("Navigating to dashboard...");
    await sessionSend('Page.enable');
    await sessionSend('Page.navigate', { url: `https://panel.play.hosting/server/${serverId}` });

    // Wait 5 seconds for page load and Cloudflare bypass
    console.log("Waiting for Cloudflare bypass...");
    await new Promise(r => setTimeout(r, 5000));

    // Execute script inside page to call Pterodactyl API
    console.log("Executing API call via browser page evaluation...");
    const script = `
      (async () => {
        try {
          const res = await fetch('/api/client/servers/${serverId}', {
            headers: {
              'Authorization': 'Bearer ${token}',
              'Accept': 'application/json'
            }
          });
          return { status: res.status, text: await res.text() };
        } catch (e) {
          return { error: e.message };
        }
      })()
    `;

    const evalResult = await sessionSend('Runtime.evaluate', {
      expression: script,
      awaitPromise: true,
      returnByValue: true
    });

    console.log("API Evaluation Result:", JSON.stringify(evalResult.result.value, null, 2));

    // Close target and browser
    await send('Target.closeTarget', { targetId });
    ws.close();
    chromeProcess.kill();
  } catch (err) {
    console.error("Error:", err.message);
    chromeProcess.kill();
  }
}

run();
