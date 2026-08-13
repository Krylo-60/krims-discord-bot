with open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, line in enumerate(lines):
    if 'birthday' in line.lower() or 'july' in line.lower():
        print(f"Line {idx + 1}: {line.strip()}")
