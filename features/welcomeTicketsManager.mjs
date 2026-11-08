import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType, 
  PermissionFlagsBits,
  OverwriteType 
} from 'discord.js';
import { db, getVerifiedGitHub, getDiscordUserByGitHub, saveVerifiedGitHub } from '../databaseEngine.mjs';

// Pre-seed Founder Krylo's verified GitHub identity
try {
  saveVerifiedGitHub('1414143825538191373', 'Krylo-60', 'founder_preseed');
} catch (_) {}

export const pendingDevVerifications = new Map(); // Map<userId, Object>

// Ensure schema has welcome_format and tickets_channel columns
try {
  db.prepare("ALTER TABLE server_config ADD COLUMN welcome_format TEXT DEFAULT 'embed'").run();
} catch (_) {}
try {
  db.prepare("ALTER TABLE server_config ADD COLUMN tickets_channel TEXT").run();
} catch (_) {}

export function getGuildServerConfig(guildId) {
  const row = db.prepare('SELECT * FROM server_config WHERE guild_id = ?').get(guildId);
  if (!row) {
    db.prepare('INSERT OR IGNORE INTO server_config (guild_id) VALUES (?)').run(guildId);
    return { guild_id: guildId, prefix: '!', welcome_channel: null, welcome_format: 'embed', tickets_category: null, tickets_channel: null };
  }
  return row;
}

export function updateGuildServerConfig(guildId, updates) {
  const current = getGuildServerConfig(guildId);
  const prefix = updates.prefix !== undefined ? updates.prefix : current.prefix;
  const welcome_channel = updates.welcome_channel !== undefined ? updates.welcome_channel : current.welcome_channel;
  const welcome_format = updates.welcome_format !== undefined ? updates.welcome_format : current.welcome_format;
  const rules_channel = updates.rules_channel !== undefined ? updates.rules_channel : current.rules_channel;
  const logs_channel = updates.logs_channel !== undefined ? updates.logs_channel : current.logs_channel;
  const tickets_category = updates.tickets_category !== undefined ? updates.tickets_category : current.tickets_category;
  const tickets_channel = updates.tickets_channel !== undefined ? updates.tickets_channel : current.tickets_channel;

  db.prepare(`
    INSERT INTO server_config (guild_id, prefix, welcome_channel, welcome_format, rules_channel, logs_channel, tickets_category, tickets_channel, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(guild_id) DO UPDATE SET
      prefix = excluded.prefix,
      welcome_channel = excluded.welcome_channel,
      welcome_format = excluded.welcome_format,
      rules_channel = excluded.rules_channel,
      logs_channel = excluded.logs_channel,
      tickets_category = excluded.tickets_category,
      tickets_channel = excluded.tickets_channel,
      updated_at = CURRENT_TIMESTAMP
  `).run(guildId, prefix, welcome_channel, welcome_format, rules_channel, logs_channel, tickets_category, tickets_channel);

  return getGuildServerConfig(guildId);
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. 👋 !setwelcome / !welcomeconfig
// ═════════════════════════════════════════════════════════════════════════════
export async function handleSetWelcomeCommand(message, args) {
  if (!message.guild) return message.reply("❌ This command can only be used inside servers!");
  
  const isStaff = message.author.id === '1414143825538191373' || 
    message.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
    message.member?.permissions?.has(PermissionFlagsBits.ManageGuild);

  if (!isStaff) return message.reply("⛔ **Admin Required:** You need `Manage Server` or `Administrator` permissions to configure the Welcome System!");

  const config = getGuildServerConfig(message.guild.id);

  // If user passes direct channel mention: "!setwelcome #welcome"
  const mentionedChannel = message.mentions.channels.first();
  if (mentionedChannel) {
    updateGuildServerConfig(message.guild.id, { welcome_channel: mentionedChannel.id });
    return message.reply(`✅ **Welcome Channel Updated!** New members will now be greeted in <#${mentionedChannel.id}>.`);
  }

  // If user passes "!setwelcome format [text|image]"
  if (args[0]?.toLowerCase() === 'format') {
    const choice = args[1]?.toLowerCase();
    if (choice === 'card' || choice === 'image') {
      updateGuildServerConfig(message.guild.id, { welcome_format: 'card' });
      return message.reply(`✅ **Welcome Format Updated!** Set to **🖼️ Image Card** mode.`);
    } else {
      updateGuildServerConfig(message.guild.id, { welcome_format: 'embed' });
      return message.reply(`✅ **Welcome Format Updated!** Set to **📝 Text Embed** mode.`);
    }
  }

  // Interactive Panel
  const currentCh = config.welcome_channel ? `<#${config.welcome_channel}>` : '*Auto-Detect (#welcome or system)*';
  const currentFmt = config.welcome_format === 'card' ? '🖼️ Image Card' : '📝 Text Embed';

  const embed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle('👋 Universal Welcome System 2.0 Configuration')
    .setDescription(
      `Customize how new members are greeted when joining **${message.guild.name}**!\n\n` +
      `📍 **Current Destination:** ${currentCh}\n` +
      `🎨 **Current Format:** \`${currentFmt}\`\n\n` +
      `**Quick Setup Options:**\n` +
      `• Click **[➕ Create #welcome]** to let the bot auto-create a dedicated welcome channel with permissions.\n` +
      `• Toggle between **[📝 Text Embed]** and **[🖼️ Image Card]** below.\n` +
      `• Or mention any existing channel: \`!setwelcome #my-channel\``
    )
    .setFooter({ text: 'Krims Welcome System 2.0 • Co-Created by Mini & Krylo' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`welcome_create_${message.guild.id}`)
      .setLabel('➕ Create #👋・welcome')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId(`welcome_fmt_embed_${message.guild.id}`)
      .setLabel('📝 Text Embed')
      .setStyle(config.welcome_format === 'embed' ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`welcome_fmt_card_${message.guild.id}`)
      .setLabel('🖼️ Image Card')
      .setStyle(config.welcome_format === 'card' ? ButtonStyle.Success : ButtonStyle.Secondary)
  );

  return message.reply({ embeds: [embed], components: [row] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. 🎟️ !settickets / !ticketconfig
// ═════════════════════════════════════════════════════════════════════════════
export async function handleSetTicketsCommand(message, args) {
  if (!message.guild) return message.reply("❌ This command can only be used inside servers!");

  const isStaff = message.author.id === '1414143825538191373' || 
    message.member?.permissions?.has(PermissionFlagsBits.Administrator) ||
    message.member?.permissions?.has(PermissionFlagsBits.ManageGuild);

  if (!isStaff) return message.reply("⛔ **Admin Required:** You need `Manage Server` or `Administrator` permissions to configure the Ticket System!");

  const config = getGuildServerConfig(message.guild.id);
  const currentCat = config.tickets_category ? `<#${config.tickets_category}>` : '*Not Configured*';
  const currentPanel = config.tickets_channel ? `<#${config.tickets_channel}>` : '*Not Configured*';

  const embed = new EmbedBuilder()
    .setColor(0x8B5CF6)
    .setTitle('🎟️ Support Tickets Hub 2.0 Configuration')
    .setDescription(
      `Configure where private support tickets and user transcripts go in **${message.guild.name}**!\n\n` +
      `📁 **Ticket Category:** ${currentCat}\n` +
      `📌 **Ticket Panel Channel:** ${currentPanel}\n\n` +
      `**1-Click Auto Deploy:**\n` +
      `Click **[🚀 Auto-Deploy Tickets 2.0]** below to automatically create:\n` +
      `1. \`🎫 ・SUPPORT\` Private Category\n` +
      `2. \`#🎫・open-a-ticket\` with interactive button panel\n` +
      `3. \`#📋・ticket-logs\` for staff transcript archives`
    )
    .setFooter({ text: 'Krims Support Core 2.0 • Private Ticket Routing' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`tickets_deploy_${message.guild.id}`)
      .setLabel('🚀 Auto-Deploy Tickets 2.0')
      .setStyle(ButtonStyle.Success)
  );

  return message.reply({ embeds: [embed], components: [row] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 🔒 GITHUB VERIFICATION & ANTI-IMPOSTOR PROTOCOL HELPERS
// ═════════════════════════════════════════════════════════════════════════════

function extractGitHubUsername(input) {
  if (!input) return null;
  const trimmed = input.trim();
  const match = trimmed.match(/github\.com\/([a-zA-Z0-9-_]+)/i);
  if (match) return match[1];
  const plain = trimmed.replace(/^@/, '').match(/^([a-zA-Z0-9-_]+)$/);
  if (plain) return plain[1];
  return null;
}

async function verifyGitHubOwnershipBio(ghUsername, verifyCode) {
  try {
    const userRes = await fetch(`https://api.github.com/users/${ghUsername}`, {
      headers: { 'User-Agent': 'KrimsCodeBot/6.0 (DiscordBot)' },
      signal: AbortSignal.timeout(5000)
    });
    if (!userRes.ok) {
      if (userRes.status === 404) return { success: false, notFound: true, error: `GitHub user @${ghUsername} does not exist.` };
      return { success: false, error: `GitHub API error (${userRes.status}).` };
    }
    const profile = await userRes.json();

    const targetCode = verifyCode.toLowerCase();
    const bioText = (profile.bio || '').toLowerCase();
    if (bioText.includes(targetCode)) {
      return { success: true, method: 'GitHub Bio Challenge', profile };
    }

    // Secondary check: Public Gists
    try {
      const gistsRes = await fetch(`https://api.github.com/users/${ghUsername}/gists?per_page=5`, {
        headers: { 'User-Agent': 'KrimsCodeBot/6.0 (DiscordBot)' },
        signal: AbortSignal.timeout(5000)
      });
      if (gistsRes.ok) {
        const gists = await gistsRes.json();
        for (const g of gists) {
          const desc = (g.description || '').toLowerCase();
          if (desc.includes(targetCode)) {
            return { success: true, method: 'GitHub Gist Challenge', profile };
          }
          for (const fn of Object.keys(g.files || {})) {
            if (fn.toLowerCase().includes(targetCode) || fn.toLowerCase().includes('krims')) {
              return { success: true, method: 'GitHub Gist File Challenge', profile };
            }
          }
        }
      }
    } catch (_) {}

    return { success: false, error: `Code "${verifyCode}" not found in bio or public gists.`, profile };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

async function createVerifiedDeveloperTicketChannel(guild, user, applicantData, client) {
  const cleanName = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
  const targetChannelName = `dev-ticket-${cleanName}`;

  // Find ticket category (🎫 ・SUPPORT)
  const category = guild.channels.cache.find(c => 
    c.type === ChannelType.GuildCategory && 
    (c.name.includes('SUPPORT') || c.name.includes('TICKET') || c.name.includes('Support'))
  ) || null;

  // Identify staff roles
  const staffRoles = guild.roles.cache.filter(r => {
    const n = r.name.normalize('NFKD').toLowerCase();
    return r.permissions.has(PermissionFlagsBits.Administrator) ||
      r.permissions.has(PermissionFlagsBits.ManageGuild) ||
      n.includes('founder') || n.includes('lead') || n.includes('developer') || n.includes('admin') || n.includes('staff');
  });

  const permissionOverwrites = [
    {
      id: guild.roles.everyone?.id || guild.id,
      type: OverwriteType.Role,
      deny: [PermissionFlagsBits.ViewChannel]
    },
    {
      id: user.id,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
      ]
    },
    {
      id: client.user.id,
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.EmbedLinks
      ]
    },
    // Krylo Founder explicit access
    {
      id: '1414143825538191373',
      type: OverwriteType.Member,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
      ]
    }
  ];

  staffRoles.forEach(r => {
    permissionOverwrites.push({
      id: r.id,
      type: OverwriteType.Role,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ReadMessageHistory
      ]
    });
  });

  let ticketChannel = await guild.channels.create({
    name: targetChannelName,
    type: ChannelType.GuildText,
    parent: category?.id || null,
    topic: `Verified Developer Ticket for @${user.tag} (ID: ${user.id}) | GitHub: https://github.com/${applicantData.ghUsername}`,
    permissionOverwrites
  });

  if (!ticketChannel || typeof ticketChannel.send !== 'function') {
    if (ticketChannel?.id) {
      ticketChannel = await client.channels.fetch(ticketChannel.id).catch(() => null);
    }
  }

  const { ghUsername, ghProfile, repos, stack, goals, verificationMethod } = applicantData;

  const devEmbed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle('💻 Krims Code AI • Verified Developer Application')
    .setDescription(
      `Welcome <@${user.id}> to your **Verified Developer Ticket**!\n\n` +
      `Your verified GitHub identity and notable repositories have been submitted to **Founder & Lead Developer Krylo** (<@1414143825538191373>) and Senior Engineering Staff.\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🛡️ VERIFIED GITHUB IDENTITY\n` +
      `• 👤 **Applicant:** <@${user.id}> (\`${user.tag}\`)\n` +
      `• 🐙 **GitHub Account:** [**@${ghUsername}**](https://github.com/${ghUsername})\n` +
      `• 🔒 **Ownership Proof:** \`✅ ${verificationMethod || 'Verified Account'}\` (Confirmed)\n` +
      (ghProfile ? `• 📊 **Public Repos:** \`${ghProfile.public_repos}\` | **Followers:** \`${ghProfile.followers}\`\n• 🗓️ **Account Age:** Created <t:${Math.floor(new Date(ghProfile.created_at).getTime() / 1000)}:R>\n` : '') +
      `• ⚡ **Primary Tech Stack:** \`${stack}\`\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 📦 NOTABLE REPOSITORIES & PROJECTS:\n` +
      `${repos}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 🎯 DEVELOPMENT INTENT & GOALS:\n` +
      `${goals}\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🛡️ **ANTI-IMPOSTOR PROTOCOL:**\n` +
      `*This ticket was authorized through mandatory GitHub ownership verification. Only the proven owner of the GitHub profile can submit applications to Krims Code.*`
    )
    .setThumbnail(ghProfile?.avatar_url || (user.displayAvatarURL ? user.displayAvatarURL({ extension: 'png', size: 256 }) : 'https://cdn.discordapp.com/embed/avatars/0.png'))
    .setFooter({ text: 'Krims Code Engineering Core • Verified Developer Pipeline' })
    .setTimestamp();

  const actionRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`ticket_close_${user.id}`)
      .setLabel('🔒 Close Ticket')
      .setStyle(ButtonStyle.Danger)
  );

  await ticketChannel.send({
    content: `👋 Verified Developer Application from <@${user.id}>! Lead Dev <@1414143825538191373> has been notified.`,
    embeds: [devEmbed],
    components: [actionRow]
  });

  return ticketChannel;
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. 🚀 Handle Universal Welcome & Ticket Button Interactions
// ═════════════════════════════════════════════════════════════════════════════
export async function handleWelcomeTicketInteraction(interaction) {
  if (!interaction.isButton() && !interaction.isModalSubmit()) return false;
  const customId = interaction.customId;

  // 0. 💻 Show Developer Verification Modal (Exclusively for Krims Code AI)
  if (customId === 'ticket_create_dev_modal' || customId === 'ticket_create_dev') {
    // Mini's Roblox Server Guard: Dev applications belong to Krims Code AI
    if (interaction.guild?.id === '1568083131624460371') {
      return interaction.reply({
        content: `ℹ️ **Developer Applications are exclusively for the Krims Code AI ecosystem!**\nTo apply as a Developer and contribute code, please join the official **Krims Code AI** Discord server:\n👉 https://discord.gg/wVbVz9aPcz`,
        ephemeral: true
      });
    }

    const cleanName = interaction.user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
    const targetChannelName = `dev-ticket-${cleanName}`;
    const existingTicket = interaction.guild?.channels.cache.find(c => 
      c.type === ChannelType.GuildText && 
      (c.name === targetChannelName || (c.name.startsWith('dev-ticket-') && c.topic?.includes(interaction.user.id)))
    );
    if (existingTicket) {
      return interaction.reply({
        content: `⚠️ You already have an open Developer Ticket! Please head over to <#${existingTicket.id}>.`,
        ephemeral: true
      });
    }

    const verifiedGh = getVerifiedGitHub(interaction.user.id);

    const modal = new ModalBuilder()
      .setCustomId('modal_dev_ticket')
      .setTitle('💻 Krims Code • Developer Verification');

    const githubInput = new TextInputBuilder()
      .setCustomId('dev_github')
      .setLabel(verifiedGh ? `GitHub Username: @${verifiedGh.github_username} (Verified ✅)` : 'GitHub Username or Profile Link')
      .setPlaceholder(verifiedGh ? `https://github.com/${verifiedGh.github_username}` : 'https://github.com/your-username or your GitHub username')
      .setValue(verifiedGh ? `https://github.com/${verifiedGh.github_username}` : '')
      .setStyle(TextInputStyle.Short)
      .setMinLength(2)
      .setMaxLength(150)
      .setRequired(true);

    const reposInput = new TextInputBuilder()
      .setCustomId('dev_repos')
      .setLabel('Notable Repositories & Real Projects')
      .setPlaceholder('List 1-3 repositories or apps you built with links & descriptions...')
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(10)
      .setMaxLength(1000)
      .setRequired(true);

    const stackInput = new TextInputBuilder()
      .setCustomId('dev_stack')
      .setLabel('Primary Tech Stack & Languages')
      .setPlaceholder('e.g. Node.js, discord.js, TypeScript, React, Python, Luau')
      .setStyle(TextInputStyle.Short)
      .setMinLength(2)
      .setMaxLength(100)
      .setRequired(true);

    const goalsInput = new TextInputBuilder()
      .setCustomId('dev_goals')
      .setLabel('What do you want to build for Krims Code?')
      .setPlaceholder('Describe the features, commands, or systems you want to build...')
      .setStyle(TextInputStyle.Paragraph)
      .setMinLength(10)
      .setMaxLength(1000)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(githubInput),
      new ActionRowBuilder().addComponents(reposInput),
      new ActionRowBuilder().addComponents(stackInput),
      new ActionRowBuilder().addComponents(goalsInput)
    );

    return await interaction.showModal(modal);
  }

  // 0B. 💻 Handle Developer Verification Modal Submission
  if (interaction.isModalSubmit() && interaction.customId === 'modal_dev_ticket') {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const user = interaction.user;
    const cleanName = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
    const targetChannelName = `dev-ticket-${cleanName}`;

    // Check if user already has an active dev ticket
    const existingTicket = guild.channels.cache.find(c => 
      c.type === ChannelType.GuildText && 
      (c.name === targetChannelName || (c.name.startsWith('dev-ticket-') && c.topic?.includes(user.id)))
    );

    if (existingTicket) {
      return interaction.followUp({
        content: `⚠️ You already have an open Developer Ticket! Please head over to <#${existingTicket.id}>.`,
        ephemeral: true
      });
    }

    const rawGithub = interaction.fields.getTextInputValue('dev_github').trim();
    const repos = interaction.fields.getTextInputValue('dev_repos').trim();
    const stack = interaction.fields.getTextInputValue('dev_stack').trim();
    const goals = interaction.fields.getTextInputValue('dev_goals').trim();

    const ghUsername = extractGitHubUsername(rawGithub);
    if (!ghUsername) {
      return interaction.followUp({
        content: `❌ **Invalid GitHub link or username:** "${rawGithub}". Please provide a valid GitHub username or link (e.g. \`https://github.com/your-username\`).`,
        ephemeral: true
      });
    }

    // 1. Check if user is ALREADY verified for this GitHub account
    const verifiedRecord = getVerifiedGitHub(user.id);
    if (verifiedRecord && verifiedRecord.github_username.toLowerCase() === ghUsername.toLowerCase()) {
      let ghProfile = null;
      try {
        const ghRes = await fetch(`https://api.github.com/users/${ghUsername}`, {
          headers: { 'User-Agent': 'KrimsCodeBot/6.0 (DiscordBot)' },
          signal: AbortSignal.timeout(4000)
        });
        if (ghRes.ok) ghProfile = await ghRes.json();
      } catch (_) {}

      try {
        const ticketChannel = await createVerifiedDeveloperTicketChannel(
          guild,
          user,
          {
            ghUsername,
            ghProfile,
            repos,
            stack,
            goals,
            verificationMethod: verifiedRecord.verification_method || 'Previously Verified Owner'
          },
          interaction.client
        );

        return interaction.followUp({
          content: `✅ **Developer Verification Ticket Created!** Your verified GitHub account **@${ghUsername}** was automatically recognized.\nPlease head over to <#${ticketChannel.id}>!`,
          ephemeral: true
        });
      } catch (err) {
        return interaction.followUp({ content: `❌ Failed creating dev ticket: ${err.message}`, ephemeral: true });
      }
    }

    // 2. Anti-Impostor Guard: Check if this GitHub username is already claimed by ANOTHER Discord user
    const claimedByOther = getDiscordUserByGitHub(ghUsername);
    if (claimedByOther && claimedByOther.discord_id !== user.id) {
      return interaction.followUp({
        content: `🛑 **SECURITY ALERT:** The GitHub account **@${ghUsername}** is already verified and linked to another Discord member (<@${claimedByOther.discord_id}>)!\n\nTo prevent identity theft and protect projects, you cannot apply using someone else's GitHub. Please use your own real GitHub account.`,
        ephemeral: true
      });
    }

    // 3. Check if user exists on GitHub
    let ghProfile = null;
    try {
      const ghRes = await fetch(`https://api.github.com/users/${ghUsername}`, {
        headers: { 'User-Agent': 'KrimsCodeBot/6.0 (DiscordBot)' },
        signal: AbortSignal.timeout(4000)
      });
      if (ghRes.status === 404) {
        return interaction.followUp({
          content: `❌ The GitHub username **@${ghUsername}** does not exist on GitHub! Please check your spelling.`,
          ephemeral: true
        });
      }
      if (ghRes.ok) ghProfile = await ghRes.json();
    } catch (_) {}

    // 4. Generate GitHub Ownership Challenge Code
    const verifyCode = `KRIMS-DEV-${Math.floor(10000 + Math.random() * 90000)}`;
    pendingDevVerifications.set(user.id, {
      ghUsername,
      verifyCode,
      repos,
      stack,
      goals,
      expiresAt: Date.now() + 15 * 60 * 1000
    });

    const challengeEmbed = new EmbedBuilder()
      .setColor(0x00E5FF)
      .setTitle(`🔒 GITHUB OWNERSHIP AUTHORIZATION REQUIRED`)
      .setDescription(
        `Hey <@${user.id}>! To protect the Krims Code ecosystem and ensure **nobody uses another developer's GitHub account**, you must prove you own **[@${ghUsername}](https://github.com/${ghUsername})** before your ticket is opened.\n\n` +
        `👉 **METHOD 1 (Fastest — 1-Click Authorize on Vercel):**\n` +
        `Click **[⚡ 1-Click Authorize with GitHub]** below to authenticate directly via GitHub OAuth!\n\n` +
        `👉 **METHOD 2 (Bio Challenge — 15 seconds):**\n` +
        `1. Open **[GitHub Profile Settings](https://github.com/settings/profile)**\n` +
        `2. Paste this code into your **GitHub Bio**:\n` +
        `\`\`\`\n${verifyCode}\n\`\`\`\n` +
        `*(Or create a public [GitHub Gist](https://gist.github.com) titled \`krims-verify.txt\` containing this code)*\n` +
        `3. Click **[✅ Verify via Bio Code]** below!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `✨ *Once verified, your GitHub is permanently linked to your Discord profile and your ticket will open immediately!*`
      )
      .setThumbnail(ghProfile?.avatar_url || 'https://krims-bot-dashboard.vercel.app/logo.png')
      .setFooter({ text: 'Krims Code AI • Vercel OAuth & Anti-Impostor Protocol' });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('⚡ 1-Click Authorize (Vercel)')
        .setStyle(ButtonStyle.Link)
        .setURL(`https://krims-bot-dashboard.vercel.app/api/auth/github?discord_id=${user.id}`),
      new ButtonBuilder()
        .setCustomId(`dev_github_confirm_${ghUsername}`)
        .setLabel('✅ Verify via Bio Code')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setLabel('⚙️ Edit GitHub Bio')
        .setStyle(ButtonStyle.Link)
        .setURL('https://github.com/settings/profile')
    );

    return interaction.followUp({
      embeds: [challengeEmbed],
      components: [row],
      ephemeral: true
    });
  }

  // 0C. 🔒 Confirm GitHub Ownership Button Click
  if (interaction.isButton() && customId.startsWith('dev_github_confirm_')) {
    await interaction.deferReply({ ephemeral: true });
    const user = interaction.user;
    const pending = pendingDevVerifications.get(user.id);
    if (!pending) {
      return interaction.followUp({
        content: '⚠️ Your verification session has expired. Please click **[💻 Apply for Developer]** in the ticket channel to try again!',
        ephemeral: true
      });
    }

    const { ghUsername, verifyCode, repos, stack, goals } = pending;
    const verifyResult = await verifyGitHubOwnershipBio(ghUsername, verifyCode);

    if (!verifyResult.success) {
      return interaction.followUp({
        content: 
          `❌ **VERIFICATION FAILED: Code Not Found on GitHub**\n\n` +
          `We checked **[@${ghUsername}](https://github.com/${ghUsername})**, but could not find the code:\n` +
          `\`\`\`\n${verifyCode}\n\`\`\`\n` +
          `👉 **To fix this:**\n` +
          `1. Open **[https://github.com/settings/profile](https://github.com/settings/profile)**\n` +
          `2. Paste \`${verifyCode}\` into your **Bio** and click the green **Update profile** button.\n` +
          `3. Wait 5-10 seconds for GitHub's cache to update, then click **[✅ Verify Ownership & Open Ticket]** again!`,
        ephemeral: true
      });
    }

    // Success! Save to persistent DB
    saveVerifiedGitHub(user.id, ghUsername, verifyResult.method || 'bio_challenge');
    pendingDevVerifications.delete(user.id);

    try {
      const ticketChannel = await createVerifiedDeveloperTicketChannel(
        interaction.guild,
        user,
        {
          ghUsername,
          ghProfile: verifyResult.profile,
          repos,
          stack,
          goals,
          verificationMethod: verifyResult.method || 'Bio Challenge'
        },
        interaction.client
      );

      return interaction.followUp({
        content: `🎉 **GitHub Ownership Verified!** You have proven ownership of **[@${ghUsername}](https://github.com/${ghUsername})**.\nYour Developer Ticket has been opened: <#${ticketChannel.id}>!`,
        ephemeral: true
      });
    } catch (createErr) {
      console.error('[Dev Ticket Creation Error]:', createErr);
      return interaction.followUp({
        content: `❌ Could not create developer ticket channel: ${createErr.message}`,
        ephemeral: true
      });
    }
  }

  // A. Create #welcome channel
  if (customId.startsWith('welcome_create_')) {
    if (!interaction.member?.permissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '⛔ You need `Manage Channels` permissions to create channels!', ephemeral: true });
    }
    await interaction.deferUpdate();
    try {
      const ch = await interaction.guild.channels.create({
        name: '👋・welcome',
        type: ChannelType.GuildText,
        topic: 'Official welcome greetings for new members joining the community!'
      });
      updateGuildServerConfig(interaction.guild.id, { welcome_channel: ch.id });
      return interaction.followUp({ content: `✅ Created and set **<#${ch.id}>** as your official welcome channel!`, ephemeral: true });
    } catch (err) {
      return interaction.followUp({ content: `❌ Failed to create channel: ${err.message}`, ephemeral: true });
    }
  }

  // B. Toggle Welcome Format (Embed vs Card)
  if (customId.startsWith('welcome_fmt_embed_')) {
    updateGuildServerConfig(interaction.guild.id, { welcome_format: 'embed' });
    return interaction.reply({ content: '✅ Welcome format set to **📝 Text Embed**!', ephemeral: true });
  }

  if (customId.startsWith('welcome_fmt_card_')) {
    updateGuildServerConfig(interaction.guild.id, { welcome_format: 'card' });
    return interaction.reply({ content: '✅ Welcome format set to **🖼️ Image Card**!', ephemeral: true });
  }

  // C. Auto-deploy Tickets 2.0 Hub
  if (customId.startsWith('tickets_deploy_')) {
    if (!interaction.member?.permissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '⛔ You need `Manage Channels` permissions!', ephemeral: true });
    }
    await interaction.deferUpdate();
    try {
      const category = await interaction.guild.channels.create({
        name: '🎫 ・SUPPORT TICKETS',
        type: ChannelType.GuildCategory
      });

      const panelCh = await interaction.guild.channels.create({
        name: '🎫・open-a-ticket',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Click the button below to open a private support ticket with server staff!'
      });

      const logsCh = await interaction.guild.channels.create({
        name: '📋・ticket-logs',
        type: ChannelType.GuildText,
        parent: category.id,
        topic: 'Archive logs for closed support tickets and transcripts.'
      });

      updateGuildServerConfig(interaction.guild.id, {
        tickets_category: category.id,
        tickets_channel: panelCh.id,
        logs_channel: logsCh.id
      });

      // Post panel
      const panelEmbed = new EmbedBuilder()
        .setColor(0x8B5CF6)
        .setTitle(`🎫 ${interaction.guild.name} — Support Center`)
        .setDescription(
          `Need help, have a question, or need to report a rule violation?\n\n` +
          `Click **Create Ticket** below to start a private conversation with our moderation team!\n\n` +
          `• 🔒 **Private & Secure:** Only you and verified staff can view your ticket.\n` +
          `• ⚡ **Fast Response:** Our team will be notified immediately.`
        )
        .setFooter({ text: 'Krims Support Core 2.0' });

      const panelRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('ticket_create_general')
          .setLabel('📩 Create Ticket')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎫')
      );

      await panelCh.send({ embeds: [panelEmbed], components: [panelRow] });

      return interaction.followUp({ 
        content: `🎉 **Support Hub 2.0 Successfully Deployed!**\n• Panel: <#${panelCh.id}>\n• Transcripts: <#${logsCh.id}>\n• Category: **${category.name}**`, 
        ephemeral: true 
      });
    } catch (err) {
      return interaction.followUp({ content: `❌ Failed deploying tickets: ${err.message}`, ephemeral: true });
    }
  }

  // D. Create Private Support Ticket or Mod/Admin Application Channel
  if (customId.startsWith('ticket_create') || customId === 'open_ticket') {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const user = interaction.user;
    const isStaffApp = customId.includes('staff') || customId.includes('mod') || customId.includes('admin');
    const channelPrefix = isStaffApp ? 'staff-app-' : 'ticket-';
    const cleanName = user.username.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 20) || 'user';
    const targetChannelName = `${channelPrefix}${cleanName}`;

    // Check if user already has an active ticket of this type
    const existingTicket = guild.channels.cache.find(c => 
      c.type === ChannelType.GuildText && 
      (c.name === targetChannelName || (c.name.startsWith(channelPrefix) && c.topic?.includes(user.id)))
    );

    if (existingTicket) {
      return interaction.followUp({
        content: `⚠️ You already have an open ${isStaffApp ? 'staff application' : 'ticket'}! Please head over to <#${existingTicket.id}>.`,
        ephemeral: true
      });
    }

    // Find ticket category (e.g. 🎫 ・SUPPORT or 🎫 ・SUPPORT TICKETS)
    const category = guild.channels.cache.find(c => 
      c.type === ChannelType.GuildCategory && 
      (c.name.includes('SUPPORT') || c.name.includes('TICKET') || c.name.includes('Support'))
    ) || null;

    // Identify staff roles that should have access
    const staffRoles = guild.roles.cache.filter(r => {
      const n = r.name.normalize('NFKD').toLowerCase();
      return r.permissions.has(PermissionFlagsBits.Administrator) ||
        r.permissions.has(PermissionFlagsBits.ManageGuild) ||
        n.includes('founder') || n.includes('moderator') || n.includes('admin') || n.includes('staff') || n.includes('aide') || n.includes('owner');
    });

    const permissionOverwrites = [
      {
        id: guild.roles.everyone?.id || guild.id,
        type: OverwriteType.Role,
        deny: [PermissionFlagsBits.ViewChannel]
      },
      {
        id: user.id,
        type: OverwriteType.Member,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ReadMessageHistory
        ]
      },
      {
        id: interaction.client.user.id,
        type: OverwriteType.Member,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
          PermissionFlagsBits.EmbedLinks
        ]
      }
    ];

    staffRoles.forEach(r => {
      permissionOverwrites.push({
        id: r.id,
        type: OverwriteType.Role,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.AttachFiles,
          PermissionFlagsBits.EmbedLinks,
          PermissionFlagsBits.ReadMessageHistory
        ]
      });
    });

    try {
      const topic = isStaffApp
        ? `Staff & Moderator Application for @${user.tag} (ID: ${user.id})`
        : `Private Support Ticket for @${user.tag} (ID: ${user.id})`;

      let ticketChannel = await guild.channels.create({
        name: targetChannelName,
        type: ChannelType.GuildText,
        parent: category?.id || null,
        topic,
        permissionOverwrites
      });

      if (!ticketChannel || typeof ticketChannel.send !== 'function') {
        if (ticketChannel?.id) {
          ticketChannel = await interaction.client.channels.fetch(ticketChannel.id).catch(() => null);
        }
        if (!ticketChannel || typeof ticketChannel.send !== 'function') {
          ticketChannel = guild.channels.cache.find(c => c.name === targetChannelName) ||
            await guild.channels.fetch().then(chs => chs.find(c => c && c.name === targetChannelName)).catch(() => null);
        }
      }

      if (!ticketChannel) {
        throw new Error('Ticket channel was created but could not be accessed. Please verify bot channel permissions.');
      }

      const avatarUrl = (typeof user.displayAvatarURL === 'function')
        ? user.displayAvatarURL({ extension: 'png', size: 256 })
        : 'https://cdn.discordapp.com/embed/avatars/0.png';

      if (isStaffApp) {
        const appEmbed = new EmbedBuilder()
          .setColor(0xF59E0B)
          .setTitle(`🛡️ ${guild.name} • Moderator & Admin Application`)
          .setDescription(
            `Welcome <@${user.id}> to your Staff Application!\n\n` +
            `Thank you for wanting to help protect and grow our Roblox community. Please copy and reply with your answers to the questions below:\n\n` +
            `1️⃣ **Roblox Username & Discord Tag:**\n` +
            `2️⃣ **Age & Timezone:**\n` +
            `3️⃣ **Desired Position:** *(Trial Moderator, Moderator, or Admin)*\n` +
            `4️⃣ **Daily Activity:** *(How many hours per day can you dedicate?)*\n` +
            `5️⃣ **Past Experience:** *(Have you staffed other Discord servers or Roblox communities?)*\n` +
            `6️⃣ **Scenario:** *(How would you handle scammers, exploiters, or toxic drama?)*\n` +
            `7️⃣ **Why should we accept you as Staff?**\n\n` +
            `*The Founders and Senior Staff will review your application directly in this channel!* ⚔️`
          )
          .setThumbnail(avatarUrl)
          .setFooter({ text: 'Mini Staff Core • Click Close Application when done.' })
          .setTimestamp();

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_close_${user.id}`)
            .setLabel('🔒 Close Application')
            .setStyle(ButtonStyle.Danger)
        );

        if (typeof ticketChannel.send === 'function') {
          await ticketChannel.send({
            content: `👋 Staff Application for <@${user.id}>! Senior Staff has been notified.`,
            embeds: [appEmbed],
            components: [actionRow]
          });
        } else {
          await fetch(`https://discord.com/api/v10/channels/${ticketChannel.id}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${interaction.client.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: `👋 Staff Application for <@${user.id}>! Senior Staff has been notified.`,
              embeds: [appEmbed.toJSON()],
              components: [actionRow.toJSON()]
            })
          });
        }

        return interaction.followUp({
          content: `✅ **Staff Application Created!** Please head over to <#${ticketChannel.id}> to answer the application questions.`,
          ephemeral: true
        });
      } else {
        const welcomeEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle(`🎫 ${guild.name} • Support Ticket`)
          .setDescription(
            `Hey <@${user.id}>, welcome to your private ticket!\n\n` +
            `**How can we help you today?**\n` +
            `• 🚨 **Player Report:** Provide screenshots & username\n` +
            `• ❓ **Help / Question:** Give details on what you need help with\n` +
            `• 💡 **Suggestion / Partnership:** Explain your idea\n\n` +
            `⛔ **DEVELOPER & CODING ROLES NOTICE:**\n` +
            `*Do NOT ask for developer roles or permissions in this ticket! Developer access is strictly restricted to verified contributors with verifiable portfolios. To apply for Developer, you MUST close this ticket and open a verified **💻 Apply for Developer** ticket in the ticket channel with your GitHub/Vercel/Render profile.*\n\n` +
            `*Our server staff and moderators have been pinged and will assist you shortly!* ⚡`
          )
          .setThumbnail(avatarUrl)
          .setFooter({ text: 'Click Close Ticket below when your issue is resolved.' })
          .setTimestamp();

        const actionRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`ticket_close_${user.id}`)
            .setLabel('🔒 Close Ticket')
            .setStyle(ButtonStyle.Danger)
        );

        if (typeof ticketChannel.send === 'function') {
          await ticketChannel.send({
            content: `👋 Welcome <@${user.id}>! Staff has been notified.`,
            embeds: [welcomeEmbed],
            components: [actionRow]
          });
        } else {
          await fetch(`https://discord.com/api/v10/channels/${ticketChannel.id}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${interaction.client.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              content: `👋 Welcome <@${user.id}>! Staff has been notified.`,
              embeds: [welcomeEmbed.toJSON()],
              components: [actionRow.toJSON()]
            })
          });
        }

        return interaction.followUp({
          content: `✅ **Ticket Created!** Please go to <#${ticketChannel.id}> to speak with staff.`,
          ephemeral: true
        });
      }
    } catch (createErr) {
      console.error('[Ticket Create Error]', createErr);
      return interaction.followUp({
        content: `❌ Could not create ticket channel: ${createErr.message}`,
        ephemeral: true
      });
    }
  }

  // E. Close Support Ticket Channel
  if (customId.startsWith('ticket_close')) {
    const isStaffOrOpener = interaction.channel.name.startsWith('ticket-') ||
      interaction.channel.name.startsWith('staff-app-') ||
      interaction.channel.name.startsWith('mod-app-') ||
      interaction.channel.name.startsWith('dev-ticket-') ||
      interaction.channel.topic?.includes(interaction.user.id) ||
      interaction.member.permissions.has(PermissionFlagsBits.ManageChannels);

    if (!isStaffOrOpener) {
      return interaction.reply({
        content: '⛔ Only ticket openers or staff can close this channel!',
        ephemeral: true
      });
    }

    await interaction.reply({
      content: '🔒 **Closing Channel...** This channel will be deleted in **5 seconds**. Thank you!'
    });

    setTimeout(async () => {
      try {
        await interaction.channel.delete('Ticket/Application closed by user/staff');
      } catch (delErr) {
        console.warn('[Ticket Delete Error]', delErr.message);
      }
    }, 5000);
    return true;
  }

  // F. 🎭 Role Channel Self-Assignment / Toggle Buttons
  if (customId.startsWith('role_')) {
    const member = interaction.member;
    if (!member) {
      return interaction.reply({ content: '❌ Could not retrieve member information.', ephemeral: true });
    }

    const ROLE_MAP = {
      'role_toggle_members': { name: '👑 Members', keywords: ['members'] },
      'role_toggle_announcements': { name: '📢 Announcements Ping', keywords: ['announcements ping', 'announcement ping'] },
      'role_toggle_giveaways': { name: '🎁 Giveaways Ping', keywords: ['giveaways ping', 'giveaway ping'] },
      'role_toggle_updates': { name: '🔔 Update Ping', keywords: ['update ping'] },
      'role_toggle_roles': { name: '⚡ Role Ping', keywords: ['role ping'] }
    };

    // Shortcut: Claim all 5 community & ping roles at once
    if (customId === 'role_claim_all') {
      const added = [];
      for (const key of Object.keys(ROLE_MAP)) {
        const item = ROLE_MAP[key];
        const role = interaction.guild.roles.cache.find(r => {
          const rn = r.name.normalize('NFKD').toLowerCase();
          return item.keywords.some(kw => rn.includes(kw));
        });
        if (role && !member.roles.cache.has(role.id)) {
          try {
            await member.roles.add(role.id);
            added.push(role.name);
          } catch (_) {}
        }
      }

      if (added.length > 0) {
        return interaction.reply({
          content: `🎉 **Roles Granted!** Added: ${added.map(r => `\`${r}\``).join(', ')}`,
          ephemeral: true
        });
      } else {
        return interaction.reply({
          content: `✅ You already have all the community and ping notification roles!`,
          ephemeral: true
        });
      }
    }

    const targetInfo = ROLE_MAP[customId];
    if (targetInfo) {
      const role = interaction.guild.roles.cache.find(r => {
        const rn = r.name.normalize('NFKD').toLowerCase();
        return targetInfo.keywords.some(kw => rn.includes(kw));
      });

      if (!role) {
        return interaction.reply({
          content: `⚠️ Could not find role \`${targetInfo.name}\` in this server. Please contact a Founder.`,
          ephemeral: true
        });
      }

      if (member.roles.cache.has(role.id)) {
        try {
          await member.roles.remove(role.id);
          return interaction.reply({
            content: `➖ **Role Removed:** You no longer have **${role.name}**.`,
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({ content: `❌ Error removing role: ${err.message}`, ephemeral: true });
        }
      } else {
        try {
          await member.roles.add(role.id);
          return interaction.reply({
            content: `➕ **Role Added:** You now have **${role.name}**! 🎉`,
            ephemeral: true
          });
        } catch (err) {
          return interaction.reply({ content: `❌ Error adding role: ${err.message}`, ephemeral: true });
        }
      }
    }
  }

  return false;
}
