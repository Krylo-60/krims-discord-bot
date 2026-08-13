with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

targetOld = """    if (customId === 'check_status') {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      try {
        let linkedIgn = 'Not Linked';
        let balance = 0;
        const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId })
        });
        if (res.ok) {
          const config = await res.json();
          if (config.verifiedUsers) {
            for (const [ign, data] of Object.entries(config.verifiedUsers)) {
              if (data.discordId === interaction.user.id) {
                linkedIgn = ign;
                break;
              }
            }
          }"""

targetNew = """    if (customId === 'check_status') {
      await interaction.deferReply({ ephemeral: true });
      const guildId = interaction.guild ? interaction.guild.id : '1524878881918685405';
      try {
        let linkedIgn = 'Not Linked';
        let balance = 0;

        // Check local verifiedUsers.json first
        if (fs.existsSync('verifiedUsers.json')) {
          try {
            const vData = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf-8'));
            const uRecord = vData[interaction.user.id];
            if (uRecord && uRecord.minecraftUsername) {
              linkedIgn = uRecord.minecraftUsername;
            }
          } catch (e) {}
        }
        if (interaction.user.id === '1414143825538191373' && linkedIgn === 'Not Linked') {
          linkedIgn = 'Krylo_MC';
        }

        const res = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId })
        });
        if (res.ok) {
          const config = await res.json();
          if (linkedIgn === 'Not Linked' && config.verifiedUsers) {
            for (const [ign, data] of Object.entries(config.verifiedUsers)) {
              if (data.discordId === interaction.user.id) {
                linkedIgn = ign;
                break;
              }
            }
          }"""

if targetOld in code:
    code = code.replace(targetOld, targetNew)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Replaced check_status logic to read verifiedUsers.json locally!")
else:
    print("[-] targetOld string not found in index.js")
