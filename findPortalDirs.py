import os

search_dirs = [
    r"C:\Users\naina\.gemini\antigravity\scratch",
    r"C:\Users\naina\Desktop",
    r"C:\Users\naina\Downloads",
    r"C:\Users\naina"
]

found = []
for sdir in search_dirs:
    if not os.path.exists(sdir): continue
    try:
        for item in os.listdir(sdir):
            if 'portal' in item.lower() or 'store' in item.lower() or 'krylo' in item.lower():
                found.append(os.path.join(sdir, item))
    except Exception:
        pass

print("Found directories/files:")
for f in found:
    print(f" - {f}")
