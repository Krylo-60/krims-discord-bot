with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

old_code = "const isJuly24 = (now.getMonth() === 6 && now.getDate() === 24);"
new_code = "const isJuly24 = ((now.getMonth() + 1) === 7 && now.getDate() === 24); // Month 7 = July"

if old_code in code:
    code = code.replace(old_code, new_code)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Updated month check to (now.getMonth() + 1) === 7 (July)!")
else:
    print("WARNING: Pattern not found.")
