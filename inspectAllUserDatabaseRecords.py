import json
import os

files = ['verifiedUsers.json', 'xp.json', 'clans.json', 'api_keys.json', 'quests.json', 'jackpot.json']

print("=== ALL DATABASE RECORDS ===")
for fname in files:
    if os.path.exists(fname):
        print(f"\n--- {fname} ---")
        try:
            with open(fname, 'r', encoding='utf-8') as f:
                data = json.load(f)
                print(json.dumps(data, indent=2))
        except Exception as e:
            print(f"Error reading {fname}: {e}")
