with open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, l in enumerate(lines):
    if 'sheet' in l.lower() or 'excel' in l.lower() or 'f5m3eu25aobp3' in l:
        print(f"Line {idx+1}: {l.strip()[:120]}")
