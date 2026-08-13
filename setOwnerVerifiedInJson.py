import json

with open('verifiedUsers.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Update owner account 1414143825538191373 to fully verified with 1B KC
data["1414143825538191373"] = {
    "discordId": "1414143825538191373",
    "discordTag": "krylo_plays",
    "minecraftUsername": "Krylo_MC",
    "verificationCode": "231525",
    "verified": True,
    "balance": 1000000000,
    "verifiedAt": "2026-08-12T17:34:25Z"
}

with open('verifiedUsers.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2)

print("✅ Updated owner @Krylo to fully VERIFIED with 1,000,000,000 KC in verifiedUsers.json!")
