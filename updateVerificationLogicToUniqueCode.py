with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

targetOld = """    if (customId === 'start_verification') {
      const modal = new ModalBuilder()
        .setCustomId('modal_start_verification')
        .setTitle('Link Minecraft Account');

      const usernameInput = new TextInputBuilder()
        .setCustomId('mc_username')
        .setLabel('What is your Minecraft Username?')
        .setPlaceholder('e.g. Krylo_MC')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(usernameInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
      return;
    }"""

targetNew = """    if (customId === 'start_verification' || customId === 'verify_user') {
      let verified = {};
      if (fs.existsSync('verifiedUsers.json')) {
        try {
          verified = JSON.parse(fs.readFileSync('verifiedUsers.json', 'utf-8'));
        } catch (e) {}
      }

      let userRecord = verified[interaction.user.id];
      let personalCode;

      if (userRecord && userRecord.verificationCode && userRecord.verificationCode !== '77777') {
        personalCode = userRecord.verificationCode;
      } else {
        personalCode = Math.floor(100000 + Math.random() * 900000).toString();
        verified[interaction.user.id] = {
          discordId: interaction.user.id,
          discordTag: interaction.user.tag,
          verificationCode: personalCode,
          minecraftUsername: userRecord?.minecraftUsername || '',
          verified: userRecord?.verified || false,
          createdAt: new Date().toISOString()
        };
        fs.writeFileSync('verifiedUsers.json', JSON.stringify(verified, null, 2));
      }

      const verifyEmbed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Unique Account Verification', iconURL: interaction.guild.iconURL() })
        .setTitle('🔒 YOUR PERSONAL VERIFICATION CODE')
        .setDescription(
          `Hello <@${interaction.user.id}>! Here is your unique, personal verification code:\n\n` +
          `🔑 **YOUR PERSONAL CODE**: **\`${personalCode}\`**\n\n` +
          `**HOW TO COMPLETE YOUR VERIFICATION:**\n` +
          `1️⃣ Copy your code: **\`${personalCode}\`**\n` +
          `2️⃣ Enter code **\`${personalCode}\`** on the [**Player Portal**](https://krylosmp.web.app/)\n` +
          `3️⃣ Or connect to Minecraft (\`KryloSmp.play.hosting\`) and type: \`/verify ${personalCode}\`\n\n` +
          `*This code is generated specifically for your account only and is private!*`
        )
        .setColor(0x00FF88)
        .setFooter({ text: `Unique Player Code • ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

      await interaction.reply({ embeds: [verifyEmbed], ephemeral: true });
      return;
    }"""

if targetOld in code:
    code = code.replace(targetOld, targetNew)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Replaced verification logic with unique personal code generator in index.js")
else:
    print("[-] targetOld string not found in index.js")
