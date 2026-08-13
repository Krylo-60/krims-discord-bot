with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

targetOld = """          const embed = new EmbedBuilder()
            .setColor(0x00FF66)
            .setTitle('🔗 Minecraft Account Linking')
            .setDescription(
              'Link your Minecraft account to get a chance to participate in future events and claim exclusive rewards!\\n\\n' +
              '**How to Link:**\\n' +
              '1. Click **Link Account** below\\n' +
              '2. Enter your Minecraft Username (Java or Bedrock)\\n' +
              '3. Connect to **`KryloSmp.play.hosting`**\\n' +
              '4. Your account will be automatically linked & whitelisted!\\n\\n' +
              '🔒 **Privacy Policy**\\n' +
              '🌐 **Server Address:** `KryloSmp.play.hosting`  |  🕹️ **Supported Versions:** Java & Bedrock 1.21.x'
            )
            .setImage('attachment://krylosmp_banner.png');
          
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('start_verification')
              .setLabel('Link Account')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setCustomId('unlink_account')
              .setLabel('Unlink Account')
              .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
              .setCustomId('update_username')
              .setLabel('Update Username')
              .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
              .setCustomId('check_status')
              .setLabel('Check Status')
              .setStyle(ButtonStyle.Secondary)
          );"""

targetNew = """          const embed = new EmbedBuilder()
            .setAuthor({ name: 'KryloSMP Official Security & Whitelist Gateway', iconURL: guild.iconURL() })
            .setTitle('⚡ KRYLOSMP 3.0 — OFFICIAL VERIFICATION PORTAL')
            .setDescription(
              `Welcome to **KryloSMP**! To protect our community from bot raids, malicious alt accounts, and spam, all new members must verify their account before accessing server channels.\\n\\n` +
              `**HOW TO VERIFY & UNLOCK THE SERVER:**\\n` +
              `1️⃣ Click the **\`✅ Verify Account\`** button below.\\n` +
              `2️⃣ The bot will generate a **unique personal 6-digit code** for your account.\\n` +
              `3️⃣ Enter your code on the [**Player Portal**](https://krylosmp.web.app/) or type \`/verify <code>\` inside Minecraft (\`KryloSmp.play.hosting\`).\\n` +
              `4️⃣ Your Discord account will automatically receive the **\`✅ VERIFIED PLAYER\`** role and unlock all chat & voice lounges!\\n\\n` +
              `*Need assistance? Open a ticket in #🎟️・open-ticket for 24/7 AI support!*`
            )
            .setColor(0x00FF88)
            .setFooter({ text: 'KryloSMP Network Security • Unique Player Code System Active', iconURL: guild.iconURL() })
            .setTimestamp();
          
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('verify_user')
              .setLabel('✅ Verify Account')
              .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
              .setLabel('🌐 Player Portal')
              .setStyle(ButtonStyle.Link)
              .setURL('https://krylosmp.web.app/'),
            new ButtonBuilder()
              .setLabel('🛒 Web Store')
              .setStyle(ButtonStyle.Link)
              .setURL('https://krylosmp-store.web.app/')
          );"""

if targetOld in code:
    code = code.replace(targetOld, targetNew)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Updated verify embed in index.js to match 3-button Verification Portal!")
else:
    print("[-] targetOld string not found in index.js")
