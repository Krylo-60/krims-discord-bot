import os
import re

print("[+] Searching for direct docs.google.com/spreadsheets/d/ links...")

search_dir = r"C:\Users\naina\.gemini\antigravity"

url_pattern = re.compile(r'https?://docs\.google\.com/spreadsheets/d/[a-zA-Z0-9_-]+')

found_urls = set()

for root, dirs, files in os.walk(search_dir):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith(('.js', '.mjs', '.json', '.sk', '.md', '.env', '.py', '.txt', '.log')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                    content = file_obj.read()
                    matches = url_pattern.findall(content)
                    for m in matches:
                        found_urls.add((m, f))
            except Exception as e:
                pass

if found_urls:
    print(f"Found {len(found_urls)} Direct Google Sheets URLs:")
    for url, fn in found_urls:
        print(f"• File [{fn}]: {url}")
else:
    print("[-] No explicit docs.google.com links found in local files. Checking SheetDB API ID mapping...")
