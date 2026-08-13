import urllib.request
import json

url = 'https://krims-code-chatbot.vercel.app/api/chat'

# Load verifiedUsers from local verifiedUsers.json
with open('verifiedUsers.json', 'r', encoding='utf-8') as f:
    verifiedUsers = json.load(f)

payload = {
    'action': 'set_config',
    'guildId': '1524878881918685405',
    'verifiedUsers': verifiedUsers,
    'economyData': {
        'Krylo_MC': {
            'balance': 1000000000
        }
    }
}

req = urllib.request.Request(
    url, 
    data=json.dumps(payload).encode('utf-8'), 
    headers={'Content-Type': 'application/json'}
)

try:
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode('utf-8'))
        print("Sync to Vercel Result:", res)
except Exception as e:
    print("Error syncing to Vercel:", e)
