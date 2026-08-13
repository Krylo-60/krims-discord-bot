with open('index.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

for idx, l in enumerate(lines):
    if 'verify_user' in l or 'verify_now' in l or 'verificationCode' in l:
        print(f"Line {idx+1}: {l.strip()[:100]}")
