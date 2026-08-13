import urllib.request
import json

url = 'https://krims-code-chatbot.vercel.app/api/chat'
data = json.dumps({'action': 'get_config', 'guildId': '1524878881918685405'}).encode('utf-8')

req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("Response keys:", list(res.keys()))
        print("verifiedUsers:", res.get('verifiedUsers'))
        print("economyData:", res.get('economyData'))
except Exception as e:
    print("Error:", e)
