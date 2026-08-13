with open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'vercel.app' in line.lower() or 'set_config' in line.lower() or 'sync' in line.lower():
        if 'http' in line.lower() or 'fetch' in line.lower() or 'axios' in line.lower():
            print(f"Line {idx + 1}: {line.strip()}")
