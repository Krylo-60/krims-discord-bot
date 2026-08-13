with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

targetOld = """        const infoCat = await ensureCategory('📌 INFORMATION');
        const commCat = await ensureCategory('💬 COMMUNITY ZONE');
        const eventCat = await ensureCategory('🎪 EVENTS & ACTIVITIES');
        const liveCat = await ensureCategory('🎮 MINECRAFT LIVE');
        const staffCat = await ensureCategory('📞 STAFF AREA');
        const voiceCat = await ensureCategory('🔊 VOICE CHANNELS');"""

targetNew = """        const infoCat = await ensureCategory('╭━━━ 📌 INFORMATION ━━━╮');
        const commCat = await ensureCategory('╭━━━ 💬 COMMUNITY ━━━╮');
        const econCat = await ensureCategory('╭━━━ 🛒 ECONOMY & STORE ━━━╮');
        const clanCat = await ensureCategory('╭━━━ 🏰 FACTIONS & CLANS ━━━╮');
        const pvpCat  = await ensureCategory('╭━━━ ⚔️ PVP & TOURNAMENTS ━━━╮');
        const tktCat  = await ensureCategory('╭━━━ 🎟️ SUPPORT & TICKETS ━━━╮');
        const voiceCat = await ensureCategory('╭━━━ 🔊 VOICE LOUNGES ━━━╮');"""

if targetOld in code:
    code = code.replace(targetOld, targetNew)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("✅ Successfully updated ensureCategory list in index.js!")
else:
    print("[-] targetOld string not found in index.js")
