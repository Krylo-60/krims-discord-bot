with open('index.js', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("value: ``${displayBal}``", "value: `\\`${displayBal}\\``")
content = content.replace("value: ``${displayBal}``", "value: `\\`${displayBal}\\``")

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Fixed backticks in index.js!")
