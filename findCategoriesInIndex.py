with open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, l in enumerate(lines):
    if 'categoriesToCreate' in l or 'ensureKryloSMPSetup' in l or 'Setup] Created category' in l:
        print(f"Line {idx+1}: {l.strip()[:100]}")
