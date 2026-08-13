with open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, l in enumerate(lines):
    l_lower = l.lower()
    if 'bounty' in l_lower and ('map' in l_lower or 'let' in l_lower or 'const' in l_lower or 'var' in l_lower or 'global' in l_lower):
        print(f"Line {idx+1}: {l.strip()[:100]}")
