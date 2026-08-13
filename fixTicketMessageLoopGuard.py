with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

targetOld = """async function handleTicketMessage(message) {
  // Guard 1: Restrict updates/actions strictly to the KryloSMP Discord Server
  if (!message.guild || message.guild.id !== '1524878881918685405') {
    return;
  }"""

targetNew = """async function handleTicketMessage(message) {
  // Guard 1: Ignore all bot messages to prevent loop spam
  if (message.author.bot) return;

  // Guard 2: Restrict updates/actions strictly to ticket channels in KryloSMP Server
  if (!message.guild || !message.channel.name.startsWith('ticket-')) {
    return;
  }"""

if targetOld in code:
    code = code.replace(targetOld, targetNew)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Added strict bot message guard to handleTicketMessage in index.js!")
else:
    print("[-] targetOld string not found in index.js")
