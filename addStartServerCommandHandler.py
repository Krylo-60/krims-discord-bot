with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

target = "if (commandName === 'gameboost' || commandName === 'boostpc') {"

replacement = """if (commandName === 'startserver') {
      await interaction.deferReply();
      
      const serverId = '25a5d79a';
      const pteroToken = process.env.PTERODACTYL_TOKEN;

      try {
        await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/power`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pteroToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({ signal: 'start' })
        });
      } catch (err) {}

      const embed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Server Power Controller', iconURL: interaction.guild.iconURL() })
        .setTitle('🚀 MINECRAFT SERVER IS STARTING!')
        .setDescription(
          `The power signal **START** has been sent to the server node!\\n\\n` +
          `🌐 **Server IP**: \`KryloSmp.play.hosting\`\\n` +
          `🔌 **Port**: \`25565\` (Java) | \`19132\` (Bedrock)\\n` +
          `⏱️ **Estimated Boot Time**: ~20-30 seconds\\n\\n` +
          `*Raise your swords and connect now!*`
        )
        .setColor(0x00FF77)
        .setTimestamp();

      return interaction.editReply({ embeds: [embed] });
    }

    if (commandName === 'gameboost' || commandName === 'boostpc') {"""

if target in code:
    code = code.replace(target, replacement)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Added /startserver handler to index.js!")
else:
    print("ERROR: Target line not found!")
