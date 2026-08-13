import os
import re

search_dirs = [
    r"C:\Users\naina\.gemini\antigravity\scratch\krims-discord-bot",
    r"C:\Users\naina\.gemini\antigravity\brain\00b316cf-2843-40c3-9037-0d534a8d9fd7"
]

print("=== SEARCHING FOR VERIFICATION RECORDS IN LOGS & BACKUPS ===")

found = []
for sdir in search_dirs:
    for root, dirs, files in os.walk(sdir):
        for f in files:
            if f.endswith('.log') or f.endswith('.json') or f.endswith('.jsonl'):
                fpath = os.path.join(root, f)
                try:
                    with open(fpath, 'r', encoding='utf-8', errors='ignore') as file:
                        content = file.read()
                        if 'verify' in content.lower() or 'verificationcode' in content.lower():
                            # Find matching lines with user ID or codes
                            matches = re.findall(r'(\{[^{}]*verificationCode[^{}]*\})', content)
                            if matches:
                                found.extend(matches)
                            matches2 = re.findall(r'(\{[^{}]*discordId[^{}]*\})', content)
                            if matches2:
                                found.extend(matches2)
                except Exception:
                    pass

print(f"Found {len(found)} verification snippets:")
for snippet in set(found[:20]):
    print(" -", snippet[:200])
