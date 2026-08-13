with open('index.js', 'r', encoding='utf-8') as f:
    content = f.read()

target = """    const embed = new EmbedBuilder()
      .setColor(0xFFAA00)
      .setTitle(`💳 Wallet Balance - ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🪙 KryloCoins', value: `\`${balance.toLocaleString()} KC\``, inline: true },
        { name: '🔗 Server Status', value: '`Linked Account`', inline: true }
      )"""

replacement = """    const isOwner = targetUser.id === '1414143825538191373' || targetUser.username.toLowerCase().includes('krylo');
    const displayBalance = isOwner ? '♾️ Unlimited KC (Owner)' : `${balance.toLocaleString()} KC`;

    const embed = new EmbedBuilder()
      .setColor(0xFFAA00)
      .setTitle(`💳 Wallet Balance - ${targetUser.username}`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '🪙 KryloCoins', value: `\`${displayBalance}\``, inline: true },
        { name: '🔗 Server Status', value: '`Linked Account`', inline: true }
      )"""

if target in content:
    content = content.replace(target, replacement)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(content)
    print("✅ Python successfully patched index.js with Unlimited KC (Owner)!")
else:
    print("[-] Python target string not matched.")
