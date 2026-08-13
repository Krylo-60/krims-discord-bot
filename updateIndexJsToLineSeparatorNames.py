with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace any dot bullet channel names in index.js with line separator names
replacements = {
    "'📌・rules'": "'📌┃rules'",
    "'📢・announcements'": "'📢┃server-announcements'",
    "'📺・youtube-alerts'": "'📺┃youtube-announcements'",
    "'ℹ️・server-info'": "'ℹ️┃server-info'",
    "'🌐・official-links'": "'🌐┃socials'",
    "'✅・verify-here'": "'✅┃verify'",
    "'💬・general-chat'": "'💬┃general-chat'",
    "'🎵・music-chat'": "'🎵┃music-chat'",
    "'📷・media-clips'": "'📷┃media-clips'",
    "'💡・suggestions'": "'💡┃suggestions'",
    "'🤖・bot-commands'": "'🤖┃bot-commands'",
    "'🛒・web-store'": "'🛒┃store'",
    "'🤝・item-trading'": "'🤝┃item-trading'",
    "'💰・jackpot-vault'": "'💰┃jackpot-vault'",
    "'🎯・bounty-board'": "'🎯┃bounty-board'",
    "'🛡️・clan-hub'": "'🛡️┃clan-recruitment'",
    "'🏆・clan-rankings'": "'🏆┃clan-leaderboard'",
    "'⚔️・pvp-arena-chat'": "'⚔️┃pvp-chat'",
    "'🏆・monthly-tournament'": "'🏆┃monthly-tournament'",
    "'🎟️・open-ticket'": "'🎫┃support-tickets'"
}

count = 0
for old, new in replacements.items():
    if old in code:
        code = code.replace(old, new)
        count += 1

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print(f"✅ Replaced {count} channel names in index.js to line-separator (┃) style!")
