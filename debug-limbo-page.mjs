import { spawn } from 'child_process';
import fetch from 'node-fetch';
import WebSocket from 'ws';

const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ChromeDevProfile';

async function run() {
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

    const { targetId } = await send('Target.createTarget', { url: 'https://panel.play.hosting/server/25a5d79a' });
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
    await new Promise(r => setTimeout(r, 10000));

    const debugScript = `
      (() => {
        const elements = Array.from(document.querySelectorAll('*'));
        const info = elements.map(el => {
          if (el.textContent && el.textContent.includes('Wake')) {
            return {
              tag: el.tagName,
              id: el.id,
              className: el.className,
              text: el.textContent.trim().substring(0, 100)
            };
          }
          return null;
        }).filter(Boolean);
        return { html: document.body.innerHTML.substring(0, 2000), info };
      })()
    `;

    const evalRes = await sessionSend('Runtime.evaluate', {
      expression: debugScript,
      returnByValue: true
    });

    console.log("DEBUG INFO:", JSON.stringify(evalRes.result.value, null, 2));

    await send('Target.closeTarget', { targetId });
    ws.close();
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    chromeProcess.kill();
  }
}

run();
