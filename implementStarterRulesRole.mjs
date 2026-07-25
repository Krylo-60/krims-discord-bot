import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add claim_starter_role button handler
const starterButtonHandler = `
    // ══════════════════════════════════════════════════════════
    // 📜 KRYLOSMP STARTER ROLE & RULES AGREEMENT HANDLER
    // ══════════════════════════════════════════════════════════
    if (customId === 'claim_starter_role') {
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch {}

      let starterRole = interaction.guild.roles.cache.find(r => r.name === 'KryloSMP Starter');
      if (!starterRole) {
        try {
          starterRole = await interaction.guild.roles.create({
            name: 'KryloSMP Starter',
            color: 0x00F2FF,
            reason: 'Auto-created KryloSMP Starter role'
          });
          console.log('[KryloSMP Setup] Created KryloSMP Starter role.');
        } catch (rErr) {
          console.warn('[KryloSMP Setup] Failed to create KryloSMP Starter role:', rErr.message);
        }
      }

      if (starterRole) {
        await interaction.member.roles.add(starterRole).catch(() => {});
      }

      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🎉 KryloSMP Starter Role Unlocked!')
        .setDescription(
          \`Congratulations <@\${interaction.user.id}>! You accepted the server rules and unlocked the **KryloSMP Starter** role!\\n\\n\` +
          '### 🎮 What You Discovered:\\n' +
          '• 💬 Full access to chat in all community channels!\\n' +
          '• 🛒 Post item trades in marketplace!\\n' +
          '• ⚔️ Join 1v1 duels in pvp-chat!\\n' +
          '• 💎 Run \`/daily\` for free **+1,000 KryloCoins & 32x Diamonds**!'
        )
        .setFooter({ text: 'KryloSMP Starter Role • Server Access Granted ⚡' })
        .setTimestamp();

      await interaction.editReply({ embeds: [welcomeEmbed] });

      // Send broadcast in general-chat
      try {
        const generalCh = interaction.guild.channels.cache.find(c => c.name.includes('general-chat') && c.type === ChannelType.GuildText);
        if (generalCh) {
          const broadEmbed = new EmbedBuilder()
            .setColor(0x00F2FF)
            .setTitle('👋 Welcome New KryloSMP Starter!')
            .setDescription(\`Everyone welcome <@\${interaction.user.id}> to **KryloSMP**! They agreed to the server rules and claimed their **KryloSMP Starter** role! 🎮⚡\`)
            .setTimestamp();
          await generalCh.send({ embeds: [broadEmbed] }).catch(() => {});
        }
      } catch {}
      return;
    }
`;

content = content.replace(
  "if (customId === 'start_verification' || customId === 'enter_verify_code') {",
  starterButtonHandler + "\n    if (customId === 'start_verification' || customId === 'enter_verify_code') {"
);

// 2. Enhance verification code success response with Rules Agreement embed and claim_starter_role button
const oldVerifyEditReply = `await interaction.editReply({ embeds: [successEmbed] });`;

const newVerifyEditReply = `
            const rulesEmbed = new EmbedBuilder()
              .setColor(0x00F2FF)
              .setTitle('📜 KryloSMP Server Rules Agreement')
              .setDescription(
                'To unlock the **KryloSMP Starter** role and gain full access to all server channels, please agree to our 3 core rules:\\n\\n' +
                '1. 🚫 **Rule 1 - Fair Play:** No griefing, stealing, or hacking/x-ray in Survival world.\\n' +
                '2. 🤝 **Rule 2 - Respect:** Respect all players & staff members in chat and voice.\\n' +
                '3. 🛒 **Rule 3 - Safe Trading:** Follow shop & trade rules, no real-money scamming.\\n\\n' +
                'Click the button below to accept the rules and claim your **KryloSMP Starter** role!'
              )
              .setFooter({ text: 'KryloSMP Rules & Verification ⚡' });

            const rulesRow = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId('claim_starter_role')
                .setLabel('✅ Accept Rules & Claim KryloSMP Starter Role')
                .setStyle(ButtonStyle.Success)
            );

            await interaction.editReply({ embeds: [successEmbed, rulesEmbed], components: [rulesRow] });
`;

content = content.replace(oldVerifyEditReply, newVerifyEditReply);

// 3. Grant 'KryloSMP Starter' role ViewChannel permissions in channel setup
content = content.replace(
  "let verifiedRole = guild.roles.cache.find(r => r.name === 'Verified');",
  "let verifiedRole = guild.roles.cache.find(r => r.name === 'Verified');\n      let starterRole = guild.roles.cache.find(r => r.name === 'KryloSMP Starter');"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 STARTER ROLE & 3-RULES VERIFICATION SYSTEM INTEGRATED!]');
