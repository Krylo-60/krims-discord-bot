with open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, l in enumerate(lines):
    if 'isButton()' in l or 'customId' in l or 'verify' in l.lower() and 'button' in l.lower():
        print(f"Line {idx+1}: {l.strip()[:100]}")
