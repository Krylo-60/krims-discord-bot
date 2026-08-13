import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const adminAbuseEngineCode = `
// ═══════════════════════════════════════════════════════════
// MONTHLY ADMIN ABUSE EVENT ENGINE (!adminabuse & /adminabuse)
// ═══════════════════════════════════════════════════════════
async function triggerAdminAbuseBroadcast(guild, author, customNote = '') {
  try {
    const abuseCh = guild.channels.cache.find(c => c && c.name && c.name.includes('admin-abuse') && c.isTextBased());
    if (!abuseCh) throw new Error('No #admin-abuse-events channel found.');

    const noteText = customNote ? customNote : 'Massive OP Drop Party at Spawn, 64x Notch Apples, Boss Mobs, and +5,000 KryloCoins for all online players!';

    const embed = new EmbedBuilder()
      .setTitle('🔥 KRYLOSMP MONTHLY ADMIN ABUSE EVENT IS NOW LIVE! 💥')
      .setDescription(
        \`👑 Owner **Krylo** (\${author ? \`<@\${author.id}>\` : 'Admin Team'}) has unleashed the **MONTHLY ADMIN ABUSE EVENT**!\\n\\n\` +
        \`> 🎁 **Event Details:** \${noteText}\\n\` +
        \`> 🎮 **Minecraft Server IP:** \\\`\\\`\\\`krylosmp.play.hosting\\\`\\\`\\\`\\n\` +
        \`> ☕ **Java Port:** 25565 | 🪨 **Bedrock Port:** 19132\\n\` +
        \`> ⚡ **LOG IN NOW TO CLAIM YOUR OP DROPS & REWARDS!**\`
      )
      .setImage("https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80")
      .setColor(0xFF0055)
      .setFooter({ text: 'KryloSMP Monthly Admin Abuse Event • Official Broadcast', iconURL: guild.iconURL() })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
      new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
    );

    const pingRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('giveaway') || r.name.toLowerCase().includes('event') || r.name.toLowerCase().includes('announcement'));
    const pingText = pingRole ? \`<@&\${pingRole.id}>\` : '@everyone';

    const msg = await abuseCh.send({
      content: \`💥 \${pingText} **MONTHLY ADMIN ABUSE EVENT HAS STARTED!** Log in now:\`,
      embeds: [embed],
      components: [row]
    });

    await msg.crosspost().catch(() => {});
    await msg.react('🔥').catch(() => {});
    await msg.react('💥').catch(() => {});
    await msg.react('🎁').catch(() => {});
    await msg.react('⚔️').catch(() => {});

    client.user.setActivity('💥 Admin Abuse Event Live!', { type: 1, url: "https://www.youtube.com/@Krylo-60" });
    return msg;
  } catch (err) {
    console.error('[Admin Abuse Engine] Error:', err.message);
    throw err;
  }
}

// Handler for !adminabuse command
if (message.content.startsWith('!adminabuse')) {
  if (!message.member?.permissions.has(PermissionFlagsBits.Administrator) && message.author.id !== '1414143825538191373') {
    return message.reply('❌ Only administrators can trigger the Admin Abuse event.');
  }

  const args = message.content.split(' ').slice(1);
  const note = args.join(' ');

  try {
    await triggerAdminAbuseBroadcast(message.guild, message.author, note);
    await message.reply('💥 **MONTHLY ADMIN ABUSE EVENT BROADCASTED & CROSSPOSTED!**');
  } catch (e) {
    await message.reply('❌ Failed to trigger event: ' + e.message);
  }
}

// Monthly Auto-Scheduler Daemon (Triggers on 1st of every month at 18:00 EST)
let lastAbuseMonth = -1;
setInterval(async () => {
  const now = new Date();
  if (now.getDate() === 1 && now.getHours() === 18 && lastAbuseMonth !== now.getMonth()) {
    lastAbuseMonth = now.getMonth();
    console.log('[Admin Abuse Engine] 1st of the month reached! Triggering Monthly Admin Abuse Event...');
    try {
      const guild = client.guilds.cache.get('1524878881918685405');
      if (guild) {
        await triggerAdminAbuseBroadcast(guild, null, 'Official 1st of the Month Admin Abuse Event! Drop party at spawn!');
      }
    } catch (e) {
      console.warn('[Admin Abuse Engine] Monthly auto-trigger error:', e.message);
    }
  }
}, 60000);
`;

// Slash command handlers
const slashAbuseHandler = `
  if (commandName === 'adminabuse') {
    if (!interaction.member?.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== '1414143825538191373') {
      return interaction.reply({ content: '❌ Only administrators can trigger the Admin Abuse event.', ephemeral: true });
    }

    const noteOpt = interaction.options.getString('details') || '';
    try {
      await triggerAdminAbuseBroadcast(interaction.guild, interaction.user, noteOpt);
      await interaction.reply({ content: '💥 **MONTHLY ADMIN ABUSE EVENT BROADCASTED!** Notification sent & crossposted.', ephemeral: true });
    } catch (e) {
      await interaction.reply({ content: '❌ Failed to trigger event: ' + e.message, ephemeral: true });
    }
  }
`;

if (!code.includes('triggerAdminAbuseBroadcast')) {
  const insertIdx = code.indexOf("if (message.content.startsWith('!postvideo'))");
  if (insertIdx !== -1) {
    code = code.substring(0, insertIdx) + adminAbuseEngineCode + '\n\n' + code.substring(insertIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Added Admin Abuse Event Engine to index.js!');
  }
}

if (!code.includes("commandName === 'adminabuse'")) {
  const slashInsertIdx = code.indexOf("if (commandName === 'coinflip')");
  if (slashInsertIdx !== -1) {
    code = code.substring(0, slashInsertIdx) + slashAbuseHandler + '\n\n  ' + code.substring(slashInsertIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Added /adminabuse slash command handler to index.js!');
  }
}

// Add slash command definition
const slashAbuseDef = `    {
      name: 'adminabuse',
      description: 'Trigger the official Monthly Admin Abuse & Chaos Event (Admin only)',
      options: [{ name: 'details', type: 3, description: 'Custom drop party details or rewards', required: false }]
    },`;

if (!code.includes("name: 'adminabuse'")) {
  code = code.replace("const slashCommands = [", `const slashCommands = [\n${slashAbuseDef}`);
  fs.writeFileSync('index.js', code);
  console.log('✅ Added /adminabuse to slashCommands array!');
}
