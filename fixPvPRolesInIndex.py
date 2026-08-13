with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace creation of legacy "PvP Player" with "⚔️ PvP Specialist"
if "'PvP Player'" in code or '"PvP Player"' in code:
    code = code.replace("'PvP Player'", "'⚔️ PvP Specialist'")
    code = code.replace('"PvP Player"', '"⚔️ PvP Specialist"')
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Updated PvP role references in index.js")
else:
    print("[-] 'PvP Player' string not found in index.js")
