import os

portal_dir = r"C:\Users\naina\.gemini\antigravity\scratch\krylosmp-player-portal"

for root, dirs, files in os.walk(portal_dir):
    for f in files:
        if not f.startswith('.'):
            print(os.path.join(root, f))
