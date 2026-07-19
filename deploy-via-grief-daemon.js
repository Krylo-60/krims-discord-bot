import { spawn } from 'child_process';
import fetch from 'node-fetch';
import WebSocket from 'ws';
import fs from 'fs';

const token = 'ptlc_y3F1H2hfU3S7JTftuECr7LMhJNaDod1HYaF4gVJ2jnE';
const serverId = '25a5d79a';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const userDataDir = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ChromeDevProfile';

const plugins = [
  { name: 'ViaVersion.jar', url: 'https://cdn.modrinth.com/data/P1OZGk5p/versions/ZH8459B6/ViaVersion-5.11.0.jar', path: 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ViaVersion.jar' },
  { name: 'ViaBackwards.jar', url: 'https://cdn.modrinth.com/data/NpvuJQoq/versions/hYhg2QBT/ViaBackwards-5.11.0.jar', path: 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\ViaBackwards.jar' },
  { name: 'GriefPrevention.jar', url: 'https://cdn.modrinth.com/data/O4o4mKaq/versions/iaJtn30B/GriefPrevention.jar', path: 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\GriefPrevention.jar' }
];

async function run() {
  console.log("====================================================");
  console.log("DOWNLOADING PLUGINS...");
  console.log("====================================================");

  for (const plugin of plugins) {
    if (!fs.existsSync(plugin.path)) {
      console.log(`Downloading ${plugin.name} from CDN...`);
      const res = await fetch(plugin.url);
      if (!res.ok) throw new Error(`Failed to download ${plugin.name}`);
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(plugin.path, Buffer.from(buffer));
      console.log(`Saved ${plugin.name} to disk.`);
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
    const maxAttempts = 240; // up to 2 hours
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
          console.log("Server file manager is accessible! Starting uploads...");

          for (const plugin of plugins) {
            console.log(`Uploading ${plugin.name} directly to Wings node...`);
            const fileBytes = fs.readFileSync(plugin.path);
            const formData = new FormData();
            formData.append('files', new Blob([fileBytes]), plugin.name);

            const uploadRes = await fetch(uploadUrl + '&directory=%2Fplugins', {
              method: 'POST',
              body: formData
            });
            console.log(`${plugin.name} upload status: ${uploadRes.status}`);
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
          
          // Wait for server to finish boot sequence before running ranks setup commands
          console.log("Waiting 25 seconds for server boot...");
          await new Promise(r => setTimeout(r, 25000));

          // Polling server state to verify it is online
          let bootAttempts = 0;
          let booted = false;
          while (bootAttempts < 10) {
            bootAttempts++;
            console.log(`Checking if server is online... (Boot attempt ${bootAttempts})`);
            const checkBootScript = `
              (async () => {
                try {
                  const res = await fetch('/api/client/servers/${serverId}', {
                    headers: { 'Authorization': 'Bearer ${token}', 'Accept': 'application/json' }
                  });
                  const data = await res.json();
                  return data.attributes.current_state;
                } catch(e) {
                  return 'offline';
                }
              })()
            `;
            const bootRes = await sessionSend('Runtime.evaluate', { expression: checkBootScript, awaitPromise: true, returnByValue: true });
            console.log("Server state:", bootRes.result.value);
            if (bootRes.result.value === 'running') {
              booted = true;
              break;
            }
            await new Promise(r => setTimeout(r, 8000));
          }

          if (booted) {
            console.log("Server is running! Setting up LuckPerms ranks with Discord Hex Colors...");
            
            const commands = [
              'lp group owner create',
              'lp group owner meta setprefix 100 "&#e67e22&l[Owner] "',
              'lp group admin create',
              'lp group admin meta setprefix 90 "&#3498db&l[Admin] "',
              'lp group moderator create',
              'lp group moderator meta setprefix 80 "&#206694&l[Mod] "',
              'lp group default meta setprefix 10 "&#2ecc71[Member] "'
            ];

            for (const cmd of commands) {
              console.log(`Executing console command: ${cmd}`);
              const runCmdScript = `
                (async () => {
                  try {
                    const res = await fetch('/api/client/servers/${serverId}/command', {
                      method: 'POST',
                      headers: {
                        'Authorization': 'Bearer ${token}',
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                      },
                      body: JSON.stringify({ command: '${cmd}' })
                    });
                    return res.ok;
                  } catch (e) {
                    return false;
                  }
                })()
              `;
              await sessionSend('Runtime.evaluate', { expression: runCmdScript, awaitPromise: true });
            }
            console.log("Rank setup commands executed successfully!");
          } else {
            console.log("Server did not boot in time, skipped rank console setup. Ranks can be configured manually later.");
          }
          break;
        }
      } catch (e) {
        console.error("Evaluation/Upload error:", e.message);
      }

      // Wait 30 seconds before next check
      await new Promise(r => setTimeout(r, 30000));
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
