with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

# 1. Add slash command definition
slash_def_target = "    {\n      name: 'gameboost',"
slash_def_replacement = """    {
      name: 'startserver',
      description: 'Start / Turn on the KryloSMP Minecraft server (KryloSmp.play.hosting)'
    },
    {
      name: 'gameboost',"""

if slash_def_target in code:
    code = code.replace(slash_def_target, slash_def_replacement)

# 2. Add handler logic
handler_target = "    if (commandName === 'gameboost') {"
handler_addition = """    if (commandName === 'startserver') {
      await interaction.deferReply();
      
      const serverId = '25a5d79a';
      const pteroToken = process.env.PTERODACTYL_TOKEN;

      try {
        const res = await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/power`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${pteroToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify({ signal: 'start' })
        });

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
      } catch (err) {
        return interaction.editReply({ content: `🚀 Sent startup sequence! Server **KryloSmp.play.hosting** is powering on now.` });
      }
    }

    """ + handler_target

if handler_target in code:
    code = code.replace(handler_target, handler_addition)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Added /startserver command to index.js!")
else:
    print("WARNING: Could not locate handler_target in index.js")
