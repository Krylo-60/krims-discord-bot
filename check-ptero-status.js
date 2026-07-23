import 'dotenv/config';
import { spawn } from 'child_process';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import fs from 'fs';

const token = process.env.PTERODACTYL_TOKEN;
const serverId = '25a5d79a';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ChromeDevProfile';

async function run() {
  console.log("Launching visible Chrome...");
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

    console.log("Navigating to server console...");
    const navScript = `window.location.href = '/server/${serverId}';`;
    await sessionSend('Runtime.evaluate', { expression: navScript });
    await new Promise(r => setTimeout(r, 8000));

    console.log("Taking screenshot...");
    const screenshotData = await sessionSend('Page.captureScreenshot');
    const buffer = Buffer.from(screenshotData.data, 'base64');
    fs.writeFileSync('C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\server_console_live.png', buffer);
    console.log("Screenshot saved!");

    // Extract console logs
    console.log("Extracting console logs...");
    const logScript = `
      (() => {
        const lines = Array.from(document.querySelectorAll('.console-container .line, .terminal .line, pre, code')).map(el => el.textContent);
        return lines.slice(-20);
      })()
    `;
    const logEval = await sessionSend('Runtime.evaluate', {
      expression: logScript,
      returnByValue: true
    });
    console.log("CONSOLE LOGS:", JSON.stringify(logEval.result.value, null, 2));

    await send('Target.closeTarget', { targetId });
    ws.close();
  } catch (err) {
    console.error("Execution error:", err.message);
  } finally {
    chromeProcess.kill();
  }
}

run().catch(err => console.error("Fatal error:", err.message));
