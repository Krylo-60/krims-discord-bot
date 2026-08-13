with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

sheet1_url = "https://docs.google.com/spreadsheets/d/1F4NRwssxFxJO58uX6CTHvXqSMoEMoLhJGRI2IeghF-g/edit?gid=377764939#gid=377764939"
sheet2_url = "https://docs.google.com/spreadsheets/d/1FAkYgHvcNW5ei0vf2GtXlKFjtBtdtGfmPAoUmIEQevA/edit?gid=0#gid=0"

# Add comment at top of index.js storing these exact Google Sheet URLs
header_comment = f"""/**
 * 👑 KRYLOSMP MASTER GOOGLE SHEETS:
 * 1. Support & Ticket Logs Sheet: {sheet1_url}
 * 2. Store & Verification Logs Sheet: {sheet2_url}
 */
"""

if "KRYLOSMP MASTER GOOGLE SHEETS" not in code:
    code = header_comment + code
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("✅ Successfully attached exact Google Sheet URLs to index.js!")
else:
    print("[-] Already attached.")
