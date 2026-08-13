import urllib.request
import json

url = 'https://api.mcsrvstat.us/2/KryloSmp.play.hosting'

try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("=== MINECRAFT SERVER STATUS ===")
        print("Online:", data.get('online'))
        print("IP:", data.get('ip'))
        print("Port:", data.get('port'))
        print("Players:", data.get('players'))
        print("MOTD:", data.get('motd', {}).get('clean'))
except Exception as e:
    print("Error checking server status:", e)
