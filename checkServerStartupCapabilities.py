with open('.env', 'r', encoding='utf-8') as f:
    env_content = f.read()

print("=== ENV FILE CHECK ===")
for line in env_content.splitlines():
    if not line.startswith('#') and '=' in line:
        key = line.split('=')[0]
        print(f"Key: {key}")

with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

print("\n=== PTERODACTYL SEARCH IN INDEX.JS ===")
if 'pterodactyl' in code.lower() or 'play.hosting' in code.lower():
    print("Found Pterodactyl references in index.js!")
else:
    print("No direct Pterodactyl references found in index.js yet.")
