import os

search_dir = r"C:\Users\naina\.gemini\antigravity\scratch"
matches = []

for root, dirs, files in os.walk(search_dir):
    for f in files:
        if f.endswith('.html') or f.endswith('.js') or f.endswith('.json') or f.endswith('.jsx'):
            filepath = os.path.join(root, f)
            try:
                with open(filepath, 'r', encoding='utf-8', errors='ignore') as file:
                    content = file.read()
                    if 'Total Economy Circulation' in content or 'krylosmp-player-portal' in content:
                        matches.append(filepath)
            except Exception:
                pass

print(f"Found {len(matches)} files:")
for m in matches:
    print(f" - {m}")
