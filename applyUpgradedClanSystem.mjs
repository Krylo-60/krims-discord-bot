import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const clanBlockStart = "    if (commandName === 'clan') {";
const bountyBlockStart = "if (commandName === 'bounty') {";

const startIndex = code.indexOf(clanBlockStart);
const endIndex = code.indexOf(bountyBlockStart);

if (startIndex !== -1 && endIndex !== -1) {
  const newClanBlock = `    if (commandName === 'clan') {
      let sub = null;
      try {
        sub = interaction.options.getSubcommand(false);
      } catch (e) {
        sub = null;
      }
      if (!sub) {
        sub = interaction.options.getString('action') || interaction.options.getString('type') || 'info';
      }
      sub = sub.toLowerCase();

      const userId = interaction.user.id;
      const guild = interaction.guild;

      // 1. CREATE CLAN (Auto Creates Private Role & Channel)
      if (sub === 'create') {
        const clanName = (interaction.options.getString('name') || interaction.options.getString('details') || 'Krylo Clan').trim();
        const tag = (interaction.options.getString('tag') || 'KSMP').toUpperCase().trim();

        if (Object.values(clanData).some(c => c.leaderId === userId)) {
          await interaction.reply({ content: '❌ You are already leading a Clan! Disband or leave your clan first.', ephemeral: true });
          return;
        }

        await interaction.deferReply();

        let clanRole = null;
        let clanChannel = null;

        try {
          // Create Discord Role for Clan
          clanRole = await guild.roles.create({
            name: \`[\${tag}] \${clanName}\`,
            color: '#00F2FF',
            mentionable: true,
            reason: \`KryloSMP Clan Created by \${interaction.user.tag}\`
          });

          // Add Role to Leader
          const member = await guild.members.fetch(userId);
          if (member && clanRole) await member.roles.add(clanRole);

          // Find or Create '🏰 CLANS' Category
          let clanCat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name.includes('CLANS'));
          if (!clanCat) {
            clanCat = await guild.channels.create({
              name: '🏰 CLANS',
              type: ChannelType.GuildCategory
            });
          }

          // Create Private Clan Channel
          clanChannel = await guild.channels.create({
            name: \`🏰-\${tag.toLowerCase()}-clan-chat\`,
            type: ChannelType.GuildText,
            parent: clanCat.id,
            permissionOverwrites: [
              {
                id: guild.id, // @everyone
                deny: [PermissionFlagsBits.ViewChannel]
              },
              {
                id: clanRole.id, // Clan Role
                allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.AttachFiles, PermissionFlagsBits.EmbedLinks]
              }
            ]
          });

          if (clanChannel) {
            const welcomeEmbed = new EmbedBuilder()
              .setColor(0x00F2FF)
              .setTitle(\`🏰 PRIVATE CLAN CHAT: [\${tag}] \${clanName}\`)
              .setDescription(
                \`Welcome to your private Clan Channel <@\${userId}>!\\n\\n\` +
                \`• Only members with the <@&\${clanRole.id}> role can view and chat here.\\n\` +
                \`• Use \\\`/clan action:invite target:@user\\\` to add members and automatically grant them access!\`
              )
              .setTimestamp();
            await clanChannel.send({ embeds: [welcomeEmbed] });
          }
        } catch (err) {
          console.warn('[Clan Role/Channel Creation Warning]:', err.message);
        }

        const clanId = 'clan_' + Date.now();
        clanData[clanId] = {
          id: clanId,
          name: clanName,
          tag: tag,
          leaderId: userId,
          members: [userId],
          vault: 1000,
          roleId: clanRole ? clanRole.id : null,
          channelId: clanChannel ? clanChannel.id : null,
          created: Date.now()
        };
        saveMegaData();

        const clanEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle(\`🏰 CLAN CREATED: [\${tag}] \${clanName}\`)
          .setDescription(
            \`Congratulations <@\${userId}>! You founded the clan **[\${tag}] \${clanName}**!\\n\\n\` +
            '• **Initial Vault Balance:** **1,000 KryloCoins** ⛃\\n' +
            '• **Clan Leader:** <@' + userId + '>\\n' +
            (clanRole ? \`• **Clan Role Created:** <@&\${clanRole.id}>\\n\` : '') +
            (clanChannel ? \`• **Private Clan Channel:** <#\${clanChannel.id}>\\n\` : '') +
            '• **Perks:** +10% Exp Boost for all members!'
          )
          .setFooter({ text: 'KryloSMP Clan System 🏰' })
          .setTimestamp();

        await interaction.editReply({ embeds: [clanEmbed] });
        return;
      }

      // 2. DISBAND / DELETE CLAN
      if (sub === 'disband' || sub === 'delete') {
        const userClanKey = Object.keys(clanData).find(key => clanData[key].leaderId === userId);
        if (!userClanKey) {
          await interaction.reply({ content: '❌ You are not leading any clan to disband!', ephemeral: true });
          return;
        }

        const userClan = clanData[userClanKey];

        try {
          if (userClan.roleId) {
            const r = guild.roles.cache.get(userClan.roleId);
            if (r) await r.delete('Clan Disbanded');
          }
          if (userClan.channelId) {
            const ch = guild.channels.cache.get(userClan.channelId);
            if (ch) await ch.delete('Clan Disbanded');
          }
        } catch (e) {
          console.warn('[Clan Delete Warning]:', e.message);
        }

        const disbandedName = userClan.name;
        const disbandedTag = userClan.tag;

        delete clanData[userClanKey];
        saveMegaData();

        const disbandEmbed = new EmbedBuilder()
          .setColor(0xFF0055)
          .setTitle(\`💥 CLAN DISBANDED: [\${disbandedTag}] \${disbandedName}\`)
          .setDescription(\`The clan **[\${disbandedTag}] \${disbandedName}** has been permanently disbanded by <@\${userId}>. Its private role & text channel have been removed.\`)
          .setFooter({ text: 'KryloSMP Clan System 🏰' })
          .setTimestamp();

        await interaction.reply({ embeds: [disbandEmbed] });
        return;
      }

      // 3. INVITE MEMBER TO CLAN (Auto Assigns Role)
      if (sub === 'invite' || sub === 'add') {
        const userClan = Object.values(clanData).find(c => c.members.includes(userId));
        if (!userClan) {
          await interaction.reply({ content: '❌ You must be in a clan to invite members!', ephemeral: true });
          return;
        }

        const targetUser = interaction.options.getUser('target') || interaction.options.getUser('user');
        if (!targetUser) {
          await interaction.reply({ content: '❌ Please specify a user to invite: \`/clan action:invite target:@user\`', ephemeral: true });
          return;
        }

        if (userClan.members.includes(targetUser.id)) {
          await interaction.reply({ content: \`❌ <@\${targetUser.id}> is already in your clan!\`, ephemeral: true });
          return;
        }

        userClan.members.push(targetUser.id);
        saveMegaData();

        // Assign Clan Role to Target
        try {
          if (userClan.roleId) {
            const member = await guild.members.fetch(targetUser.id);
            if (member) await member.roles.add(userClan.roleId);
          }
        } catch (e) {}

        const inviteEmbed = new EmbedBuilder()
          .setColor(0x00FF88)
          .setTitle(\`🎉 NEW CLAN MEMBER INJOINED!\`)
          .setDescription(\`<@\${targetUser.id}> joined **[\${userClan.tag}] \${userClan.name}**!\\n\\n\` +
            (userClan.roleId ? \`• Granted Clan Role <@&\${userClan.roleId}>\\n\` : '') +
            (userClan.channelId ? \`• Granted access to <#\${userClan.channelId}>\\n\` : '') +
            \`• Total Members: **\${userClan.members.length}**\`
          )
          .setTimestamp();

        await interaction.reply({ embeds: [inviteEmbed] });
        return;
      }

      // 4. DEPOSIT TO CLAN VAULT
      if (sub === 'deposit' || sub === 'vault') {
        let userClan = Object.values(clanData).find(c => c.members.includes(userId));
        if (!userClan) {
          await interaction.reply({ content: '❌ You are not currently in any Clan! Create one with \`/clan action:create\`!', ephemeral: true });
          return;
        }

        let rawVal = null;
        try { rawVal = interaction.options.getString('value'); } catch (e) {}
        if (!rawVal) {
          try { rawVal = interaction.options.getInteger('value'); } catch (e) {}
        }
        if (!rawVal) {
          try { rawVal = interaction.options.getString('amount'); } catch (e) {}
        }
        if (!rawVal) {
          try { rawVal = interaction.options.getInteger('amount'); } catch (e) {}
        }

        const parsedNum = parseInt(String(rawVal || '1000').replace(/[^0-9]/g, '')) || 1000;
        const amount = Math.max(1, parsedNum);
        userClan.vault = (userClan.vault || 0) + amount;
        saveMegaData();

        const depositEmbed = new EmbedBuilder()
          .setColor(0x00FF88)
          .setTitle(\`💰 VAULT DEPOSIT SUCCESSFUL!\`)
          .setDescription(
            \`<@\${userId}> deposited **\${amount.toLocaleString()} KryloCoins** into **[\${userClan.tag}] \${userClan.name}**!\\n\\n\` +
            \`• **New Vault Total:** **\${userClan.vault.toLocaleString()} KryloCoins** ⛃\\n\` +
            \`• **Clan Leader:** <@\${userClan.leaderId}>\\n\` +
            \`• **Active Members:** **\${userClan.members.length}**\`
          )
          .setFooter({ text: 'KryloSMP Clan Vault 🏰' })
          .setTimestamp();

        await interaction.reply({ embeds: [depositEmbed] });
        return;
      }

      // 5. CLAN INFO
      if (sub === 'info') {
        let userClan = Object.values(clanData).find(c => c.members.includes(userId));
        if (!userClan) {
          const clans = Object.values(clanData);
          if (clans.length > 0) userClan = clans[0];
        }

        if (!userClan) {
          await interaction.reply({ content: '❌ No clans found! Create the first clan with \`/clan action:create\`!', ephemeral: true });
          return;
        }

        const infoEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle(\`🏰 CLAN INFO: [\${userClan.tag}] \${userClan.name}\`)
          .addFields(
            { name: '👑 Clan Leader', value: \`<@\${userClan.leaderId}>\`, inline: true },
            { name: '👥 Members Count', value: \`**\${userClan.members.length} members**\`, inline: true },
            { name: '💰 Vault Balance', value: \`**\${(userClan.vault || 0).toLocaleString()} KC** ⛃\`, inline: true },
            { name: '🎭 Clan Role', value: userClan.roleId ? \`<@&\${userClan.roleId}>\` : 'None', inline: true },
            { name: '💬 Private Channel', value: userClan.channelId ? \`<#\${userClan.channelId}>\` : 'None', inline: true }
          )
          .setFooter({ text: 'KryloSMP Clan System 🏰' })
          .setTimestamp();

        await interaction.reply({ embeds: [infoEmbed] });
        return;
      }

      // 6. CLAN LEADERBOARD
      if (sub === 'leaderboard' || sub === 'top') {
        const sortedClans = Object.values(clanData).sort((a, b) => (b.vault || 0) - (a.vault || 0)).slice(0, 5);

        let desc = sortedClans.length > 0
          ? sortedClans.map((c, i) => \`**#\${i + 1} [\${c.tag}] \${c.name}** — 💰 **\${(c.vault || 0).toLocaleString()} KC** (\${c.members.length} members)\`).join('\\n')
          : '*No clans created yet! Be the first using \\\`/clan action:create\\\`!';

        const lbEmbed = new EmbedBuilder()
          .setColor(0xFFAA00)
          .setTitle('🏰 TOP CLANS LEADERBOARD')
          .setDescription(desc)
          .setFooter({ text: 'KryloSMP Top Clans 🏆' })
          .setTimestamp();

        await interaction.reply({ embeds: [lbEmbed] });
        return;
      }

      // Default fallback info
      const fallbackEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🏰 KRYLOSMP CLAN SYSTEM')
        .setDescription('Commands:\\n• \`/clan action:create name:ClanName tag:TAG\`\\n• \`/clan action:invite target:@user\`\\n• \`/clan action:deposit value:10000\`\\n• \`/clan action:disband\`')
        .setTimestamp();

      await interaction.reply({ embeds: [fallbackEmbed] });
      return;
    }\n\n    // ══════════════════════════════════════════════════════════\n    // 🎮 KRYLOSMP 3.0 MEGA UPDATE COMMAND HANDLERS\n    // ══════════════════════════════════════════════════════════\n`;

  code = code.substring(0, startIndex) + newClanBlock + code.substring(endIndex);
  fs.writeFileSync('index.js', code, 'utf8');
  console.log("✅ Upgraded Clan system applied cleanly!");
} else {
  console.error("[-] Failed to locate clan block start/end.");
}
