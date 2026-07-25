import net from 'net';

function checkMcPort(host, port) {
  console.log(`[🔍 MC PORT CHECKER] Testing TCP connection to ${host}:${port}...`);
  const client = new net.Socket();
  const timeout = 5000;

  client.setTimeout(timeout);

  client.on('connect', () => {
    console.log(`[✅ SERVER IS ONLINE!] TCP connection successful to ${host}:${port}`);
    client.destroy();
  });

  client.on('timeout', () => {
    console.log(`[❌ SERVER IS OFFLINE / SLEEPING] Connection timed out after ${timeout}ms.`);
    client.destroy();
  });

  client.on('error', (err) => {
    console.log(`[❌ SERVER IS OFFLINE / PORT CLOSED] Error: ${err.message}`);
    client.destroy();
  });

  client.connect(port, host);
}

checkMcPort('KryloSmp.play.hosting', 25565);
