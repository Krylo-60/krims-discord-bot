import subprocess
import time
import sys
import os

SERVICES = [
    {"name": "Master Discord Bot", "cmd": ["node", "index.js"]},
    {"name": "Minecraft 2-Way Bridge", "cmd": ["node", "minecraftBridgeBot.mjs"]},
    {"name": "Streamer & Media Notifier", "cmd": ["node", "streamerBridge.mjs"]}
]

running_processes = {}

def log(msg):
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{timestamp}] [WATCHDOG] {msg}"
    print(entry, flush=True)
    with open("watchdog_health.log", "a", encoding="utf-8") as f:
        f.write(entry + "\n")

def start_service(svc):
    name = svc["name"]
    cmd = svc["cmd"]
    log(f"🚀 Starting microservice: '{name}'...")
    try:
        proc = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, bufsize=1)
        running_processes[name] = {"proc": proc, "svc": svc, "restarts": running_processes.get(name, {}).get("restarts", 0) + 1}
        log(f"✅ '{name}' started (PID: {proc.pid})")
    except Exception as e:
        log(f"❌ Failed to start '{name}': {e}")

def monitor():
    log("🛡️ KRYLOSMP HIGH-AVAILABILITY FAILOVER WATCHDOG ACTIVE!")
    for svc in SERVICES:
        start_service(svc)

    while True:
        time.sleep(10)
        for name, data in list(running_processes.items()):
            proc = data["proc"]
            svc = data["svc"]
            poll_res = proc.poll()
            if poll_res is not None:
                log(f"⚠️ Microservice '{name}' terminated with exit code {poll_res}. Initiating auto-recovery...")
                start_service(svc)

if __name__ == "__main__":
    try:
        monitor()
    except KeyboardInterrupt:
        log("Watchdog shutting down.")
        for name, data in running_processes.items():
            data["proc"].terminate()
        sys.exit(0)
