import os
import subprocess

print("[+] Stopping all background node tasks & processes...")

try:
    subprocess.run(["taskkill", "/F", "/IM", "node.exe"], check=False)
    print("✅ All Node processes killed successfully!")
except Exception as e:
    print(f"[-] Exception killing node processes: {e}")
