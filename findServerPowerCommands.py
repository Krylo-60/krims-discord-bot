with open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'pterodactyl' in line.lower() or 'power' in line.lower() or 'startserver' in line.lower():
        print(f"Line {idx + 1}: {line.strip()[:140]}")
