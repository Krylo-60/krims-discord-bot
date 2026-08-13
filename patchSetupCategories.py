with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

targetOld = """const categoriesToCreate = [
    '📌 INFORMATION',
    '💬 COMMUNITY ZONE',
    '🛒 STORE & ECONOMY',
    '🏰 CLANS & FACTIONS',
    '⚔️ PVP & TOURNAMENTS',
    '🎟️ SUPPORT TICKETS',
    '🔊 VOICE LOUNGES'
  ];"""

targetNew = """const categoriesToCreate = [
    '╭━━━ 📌 INFORMATION ━━━╮',
    '╭━━━ 💬 COMMUNITY ━━━╮',
    '╭━━━ 🛒 ECONOMY & STORE ━━━╮',
    '╭━━━ 🏰 FACTIONS & CLANS ━━━╮',
    '╭━━━ ⚔️ PVP & TOURNAMENTS ━━━╮',
    '╭━━━ 🎟️ SUPPORT & TICKETS ━━━╮',
    '╭━━━ 🔊 VOICE LOUNGES ━━━╮'
  ];"""

if targetOld in code:
    code = code.replace(targetOld, targetNew)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("✅ Updated ensureKryloSMPSetup categories in index.js!")
else:
    print("[-] targetOld string not found in index.js")
