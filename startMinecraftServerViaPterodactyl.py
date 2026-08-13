import os
import json
import urllib.request
from dotenv import load_dotenv

load_dotenv()

pterodactyl_token = os.getenv('PTERODACTYL_TOKEN')
server_id = '25a5d79a'
url = f'https://panel.play.hosting/api/client/servers/{server_id}/power'

print(f"[+] Sending START signal to Pterodactyl server {server_id} with Chrome User-Agent...")

payload = json.dumps({'signal': 'start'}).encode('utf-8')

headers = {
    'Authorization': f'Bearer {pterodactyl_token}',
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

req = urllib.request.Request(url, data=payload, headers=headers, method='POST')

try:
    with urllib.request.urlopen(req) as resp:
        print(f"✅ SUCCESS! HTTP Status: {resp.status}")
        print("🚀 Minecraft Server KryloSmp.play.hosting is NOW STARTING / ONLINE!")
except urllib.error.HTTPError as e:
    print(f"[-] HTTP Error: {e.code} - {e.reason}")
    try:
        err_body = e.read().decode('utf-8')
        print("Error Response Body:", err_body)
    except Exception:
        pass
except Exception as ex:
    print(f"[-] Exception: {ex}")
