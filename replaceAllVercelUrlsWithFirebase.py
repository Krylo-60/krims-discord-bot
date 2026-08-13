import os
import re

target_dir = r"C:\Users\naina\.gemini\antigravity\scratch\krims-discord-bot"

replacements = [
    ("https://krylosmp.web.app/", "https://krylosmp.web.app/"),
    ("https://krylosmp.web.app", "https://krylosmp.web.app"),
    ("krylosmp.web.app", "krylosmp.web.app"),
    ("https://krylosmp-store.web.app/", "https://krylosmp-store.web.app/"),
    ("https://krylosmp-store.web.app", "https://krylosmp-store.web.app"),
    ("krylosmp-store.web.app", "krylosmp-store.web.app"),
]

exts = ['.js', '.mjs', '.py', '.md', '.json', '.txt', '.sk', '.html']

modified_files = []

for root, dirs, files in os.walk(target_dir):
    if 'node_modules' in root or '.git' in root or '.vercel' in root:
        continue
    for file in files:
        if any(file.endswith(ext) for ext in exts):
            filepath = os.path.join(root, file)
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                new_content = content
                for old_url, new_url in replacements:
                    new_content = new_content.replace(old_url, new_url)
                
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    modified_files.append(filepath)
                    print(f"[+] Replaced URLs in: {file}")
            except Exception as e:
                pass

print(f"\n[🎉 FINISHED] Modified {len(modified_files)} files!")
