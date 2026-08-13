import os
import glob

print("[+] Searching for Excel/CSV files and Google Sheet URLs...")

search_dir = r"C:\Users\naina\.gemini\antigravity\scratch\krims-discord-bot"

for root, dirs, files in os.walk(search_dir):
    for f in files:
        if f.endswith(('.xlsx', '.xls', '.csv', '.ods', '.tsv')):
            print(f"Found Excel/CSV File: {os.path.join(root, f)}")

# Also search for docs.google.com/spreadsheets URLs in all files
sheet_urls = set()
for root, dirs, files in os.walk(search_dir):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith(('.js', '.mjs', '.json', '.sk', '.md', '.env', '.py', '.txt')):
            path = os.path.join(root, f)
            try:
                with open(path, 'r', encoding='utf-8', errors='ignore') as file_obj:
                    content = file_obj.read()
                    if 'docs.google.com/spreadsheets' in content or 'sheet' in content.lower():
                        lines = content.split('\n')
                        for idx, l in enumerate(lines):
                            if 'docs.google.com/spreadsheets' in l or ('sheet' in l.lower() and ('http' in l.lower() or 'excel' in l.lower() or 'csv' in l.lower())):
                                print(f"File [{f}:L{idx+1}]: {l.strip()[:140]}")
            except Exception as e:
                pass
