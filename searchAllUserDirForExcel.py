import os

print("[+] Searching for Excel/CSV files across AppData and workspace...")

paths_to_check = [
    r"C:\Users\naina\.gemini\antigravity\scratch\krims-discord-bot",
    r"C:\Users\naina\.gemini\antigravity\brain\00b316cf-2843-40c3-9037-0d534a8d9fd7",
    r"C:\Users\naina\.gemini\antigravity\scratch"
]

for base_dir in paths_to_check:
    if os.path.exists(base_dir):
        for root, dirs, files in os.walk(base_dir):
            if 'node_modules' in root or '.git' in root:
                continue
            for f in files:
                if f.endswith(('.xlsx', '.xls', '.csv', '.ods', '.tsv', '.json')):
                    print(f"File: {os.path.join(root, f)}")
