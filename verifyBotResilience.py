with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

hasUncaught = 'uncaughtException' in code
hasUnhandled = 'unhandledRejection' in code
hasShardReconnecting = 'shardReconnecting' in code or 'client.on(' in code

print(f"uncaughtException handler: {'ACTIVE' if hasUncaught else 'MISSING'}")
print(f"unhandledRejection handler: {'ACTIVE' if hasUnhandled else 'MISSING'}")
