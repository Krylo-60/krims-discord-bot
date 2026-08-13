with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# Replace any old store URLs with the official ones
oldStore1 = 'https://krims-code-chatbot.vercel.app/store'
oldStore2 = 'https://krims-code-chatbot.vercel.app'

newStore = 'https://krylosmp-store.web.app/'
newPortal = 'https://krylosmp.web.app/'

code = code.replace(oldStore1, newStore)

with open('index.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("SUCCESS: Updated Vercel URLs in index.js")
