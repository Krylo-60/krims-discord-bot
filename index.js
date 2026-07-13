import { Client, GatewayIntentBits, Partials, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { KrimsClient } from '@krishivpb60/krims-code-sdk';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [
    Partials.Channel
  ]
});

// Initialize Krims SDK Client pointing to Vercel mesh Chatbot API
const sdk = new KrimsClient({
  baseUrl: 'https://krims-code-chatbot.vercel.app'
});

// Maps to store state
const conversationHistory = new Map();
const userCooldowns = new Map();
const giveawayEntries = new Map(); // giveaway message ID -> Set of user IDs
const COOLDOWN_TIME = 10000; // 10 seconds cooldown in milliseconds

client.once('ready', async () => {
  console.log(`[+] Krims Code Discord Bot online as ${client.user.tag}`);

  // Register Global Slash Commands
  const slashCommands = [
    {
      name: 'ask',
      description: 'Ask the Krims Gemini AI engine any coding query',
      options: [
        {
          name: 'prompt',
          type: 3, // String type
          description: 'Your coding question',
          required: true
        }
      ]
    },
    {
      name: 'ticket',
      description: 'Open a secure private support ticket channel'
    },
    {
      name: 'close',
      description: 'Resolve and close the current support ticket channel'
    },
    {
      name: 'diagnose',
      description: 'Compile local and global network diagnostic statistics'
    },
    {
      name: 'github',
      description: 'Get links to the Krims Code GitHub repositories and portal site'
    },
    {
      name: 'status',
      description: 'Check the real-time status of the KryloSMP Minecraft server'
    },
    {
      name: 'ip',
      description: 'Get the Minecraft server connection address and port'
    },
    {
      name: 'shop',
      description: 'Display in-game shop items and coin prices'
    },
    {
      name: 'poll',
      description: 'Create a poll for the server to vote on',
      options: [
        {
          name: 'question',
          type: 3,
          description: 'The poll question',
          required: true
        },
        {
          name: 'option1',
          type: 3,
          description: 'First option',
          required: true
        },
        {
          name: 'option2',
          type: 3,
          description: 'Second option',
          required: true
        },
        {
          name: 'option3',
          type: 3,
          description: 'Third option (optional)',
          required: false
        }
      ]
    },
    {
      name: 'giveaway',
      description: 'Start a giveaway that players can enter by clicking a button',
      options: [
        {
          name: 'prize',
          type: 3,
          description: 'What is the prize?',
          required: true
        },
        {
          name: 'duration',
          type: 4, // Integer
          description: 'Duration in minutes',
          required: true
        }
      ]
    },
    {
      name: 'leaderboard',
      description: 'Show the server activity leaderboard'
    },
    {
      name: 'serverinfo',
      description: 'Display detailed information about this Discord server'
    },
    {
      name: 'suggest',
      description: 'Submit a suggestion for the server',
      options: [
        {
          name: 'idea',
          type: 3,
          description: 'Your suggestion for the server',
          required: true
        }
      ]
    },
    {
      name: 'announce',
      description: 'Send an announcement embed to the announcements channel (Admin only)',
      options: [
        {
          name: 'title',
          type: 3,
          description: 'Announcement title',
          required: true
        },
        {
          name: 'message',
          type: 3,
          description: 'Announcement message',
          required: true
        }
      ]
    },
    {
      name: 'verify',
      description: 'Verify your Minecraft account by entering your verification code',
      options: [
        {
          name: 'code',
          type: 3,
          description: 'The verification code generated in Minecraft',
          required: true
        }
      ]
    }
  ];

  try {
    await client.application.commands.set(slashCommands);
    console.log('[+] Slash commands registered globally!');
  } catch (err) {
    console.error('[-] Failed to register slash commands:', err.message);
  }

  // Start polling Vercel configuration database for pending actions (Web-to-Discord Embed Broadcaster)
  setInterval(async () => {
    const GUILD_ID = '1420991845546332162';
    try {
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: GUILD_ID })
      });
      if (configRes.ok) {
        const guildConfig = await configRes.json();
        const actions = guildConfig.actions || [];
        if (actions.length > 0) {
          console.log(`[ACTION QUEUE] Found ${actions.length} pending action(s). Processing...`);
          
          for (const action of actions) {
            if (action.type === 'send_embed') {
              try {
                let channel = null;
                if (action.channelId && action.channelId !== 'default') {
                  channel = await client.channels.fetch(action.channelId).catch(() => null);
                }
                
                if (!channel) {
                  const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
                  if (guild) {
                    channel = guild.channels.cache.find(c => 
                      c.type === ChannelType.GuildText && (
                        c.name.includes('staff') || 
                        c.name.includes('admin') || 
                        c.name.includes('alert') || 
                        c.name.includes('notifications') || 
                        c.name.includes('general')
                      )
                    );
                  }
                }

                if (channel) {
                  const embed = {
                    color: parseInt(action.color.replace('#', ''), 16) || 0x00f2ff,
                    title: action.title,
                    description: action.description,
                    timestamp: new Date().toISOString(),
                    footer: {
                      text: 'Krims Code Broadcast Station'
                    }
                  };
                  await channel.send({ embeds: [embed] });
                  console.log(`[ACTION QUEUE] Successfully posted embed to channel #${channel.name}`);
                }
              } catch (err) {
                console.error(`[ACTION QUEUE] Failed to execute send_embed:`, err.message);
              }
            }
          }

          // Clear processed actions from config and save back to database
          guildConfig.actions = [];
          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_config', guildId: GUILD_ID, config: guildConfig })
          });
          console.log(`[ACTION QUEUE] Queue cleared and database synchronized.`);
        }
      }
    } catch (err) {
      console.warn(`[ACTION QUEUE] Polling failed:`, err.message);
    }
  }, 5000); // Poll every 5 seconds

  // Post Interactive Buttons in KryloSMP Server if they don't exist
  try {
    const GUILD_ID = '1524878881918685405';
    const guild = client.guilds.cache.get(GUILD_ID) || await client.guilds.fetch(GUILD_ID).catch(() => null);
    if (guild) {
      console.log(`[KryloSMP Setup] Found KryloSMP guild. Ensuring button systems are active...`);

      // 1. Support Ticket Button
      const supportCh = guild.channels.cache.find(c => c.name.includes('support-tickets') && c.type === ChannelType.GuildText);
      if (supportCh) {
        const messages = await supportCh.messages.fetch({ limit: 10 });
        const hasTicketBtn = messages.some(m => m.components.some(c => c.components.some(b => b.customId === 'open_ticket')));
        if (!hasTicketBtn) {
          const embed = new EmbedBuilder()
            .setColor(0x00F2FF)
            .setTitle('🎟️ KryloSMP Support Tickets')
            .setDescription('Need assistance, want to report a player, or have a question? Click the button below to open a private support ticket with our staff!');
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('open_ticket')
              .setLabel('Open Support Ticket')
              .setStyle(ButtonStyle.Primary)
              .setEmoji('🎟️')
          );
          await supportCh.send({ embeds: [embed], components: [row] });
          console.log(`[KryloSMP Setup] Sent support ticket button embed.`);
        }
      }

      // 2. Role Selector Buttons
      const infoCh = guild.channels.cache.find(c => c.name.includes('server-info') && c.type === ChannelType.GuildText);
      if (infoCh) {
        const messages = await infoCh.messages.fetch({ limit: 20 });
        const hasRoleBtn = messages.some(m => m.components.some(c => c.components.some(b => b.customId.startsWith('role_'))));
        if (!hasRoleBtn) {
          const embed = new EmbedBuilder()
            .setColor(0xAA55FF)
            .setTitle('🎨 Server Roles Selection')
            .setDescription('Click the buttons below to grab your platform roles so other players know how you play!');
          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId('role_java')
              .setLabel('Java Player')
              .setStyle(ButtonStyle.Success)
              .setEmoji('☕'),
            new ButtonBuilder()
              .setCustomId('role_bedrock')
              .setLabel('Bedrock Player')
              .setStyle(ButtonStyle.Secondary)
              .setEmoji('🪨')
          );
          await infoCh.send({ embeds: [embed], components: [row] });
          console.log(`[KryloSMP Setup] Sent role selection button embed.`);
        }
      }

      // 3. Minecraft Link / Verify Button
      let verifyCh = guild.channels.cache.find(c => (c.name.includes('verify') || c.name.includes('link')) && c.type === ChannelType.GuildText);
      
      let verifiedRole = guild.roles.cache.find(r => r.name === 'Verified');
      if (!verifiedRole) {
        try {
          verifiedRole = await guild.roles.create({
            name: 'Verified',
            color: '#00ff66',
            reason: 'Auto-created by verification system'
          });
        } catch (err) {
          console.warn('Failed to create Verified role:', err.message);
        }
      }

      if (!verifyCh) {
        const infoCategory = guild.channels.cache.find(c => c.name.includes('INFORMATION') && c.type === ChannelType.GuildCategory);
        try {
          const overwrites = [
            {
              id: guild.roles.everyone.id,
              allow: [PermissionFlagsBits.ViewChannel],
              deny: [PermissionFlagsBits.SendMessages]
            }
          ];
          if (verifiedRole) {
            overwrites.push({
              id: verifiedRole.id,
              deny: [PermissionFlagsBits.ViewChannel]
            });
          }

          verifyCh = await guild.channels.create({
            name: 'verify',
            type: ChannelType.GuildText,
            parent: infoCategory ? infoCategory.id : null,
            topic: 'Verify your Minecraft account here!',
            permissionOverwrites: overwrites,
            reason: 'Auto-created by verification setup'
          });
          console.log('[KryloSMP Setup] Created missing verify channel.');
        } catch (err) {
          console.warn('[KryloSMP Setup] Failed to create verify channel:', err.message);
        }
      } else if (verifiedRole) {
        try {
          await verifyCh.permissionOverwrites.edit(verifiedRole.id, {
            ViewChannel: false
          });
          console.log('[KryloSMP Setup] Enforced verify channel permission overwrites.');
        } catch (err) {
          console.warn('Failed to edit verify channel permissions:', err.message);
        }
      }

      if (verifyCh) {
        try {
          // Clear any old messages in the channel to ensure fresh setup
          const oldMessages = await verifyCh.messages.fetch({ limit: 100 });
          if (oldMessages.size > 0) {
            await verifyCh.bulkDelete(oldMessages).catch(async () => {
              // Fallback if bulkDelete fails (older than 14 days)
              for (const [, m] of oldMessages) {
                await m.delete().catch(() => {});
              }
            });
          }
        } catch (err) {
          console.warn('Failed to clear old verify messages:', err.message);
        }

        const embed = new EmbedBuilder()
          .setColor(0x00FF66)
          .setTitle('🔗 Link Minecraft Account')
          .setDescription('Link your official Minecraft account to gain access to the **Verified** role, sync your nickname, and track your in-game stats directly on Discord!\n\n**Instructions:**\n1. Click **Link Account** below and enter your Minecraft username.\n2. Log in to the Minecraft server (**`KryloSmp.play.hosting`**) where your verification code will display in chat!\n3. Click **Enter Verification Code** below and enter the code you received in-game.');
        
        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('start_verification')
            .setLabel('Link Account')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🔗'),
          new ButtonBuilder()
            .setCustomId('enter_verify_code')
            .setLabel('Enter Code')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🔑')
        );
        await verifyCh.send({ embeds: [embed], components: [row] });
        console.log(`[KryloSMP Setup] Sent verification button embed.`);
      }

      // 4. Enforce Verification Gateway Channel Permissions
      console.log('[KryloSMP Setup] Enforcing Verification Gateway permissions...');
      const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory);
      for (const [, cat] of categories) {
        if (cat.name.toUpperCase().includes('INFORMATION')) {
          continue;
        }

        try {
          await cat.permissionOverwrites.edit(guild.roles.everyone.id, {
            ViewChannel: false
          });
          if (verifiedRole) {
            await cat.permissionOverwrites.edit(verifiedRole.id, {
              ViewChannel: true
            });
          }
        } catch (err) {
          console.warn(`Failed to enforce gateway permissions for category ${cat.name}:`, err.message);
        }
      }
    }
  } catch (err) {
    console.warn(`[KryloSMP Setup] Failed to post interactive components:`, err.message);
  }
});

// Slash Commands & Buttons Interaction Handler
client.on('interactionCreate', async (interaction) => {
  // Handle Button Interactions
  if (interaction.isButton()) {
    const { customId } = interaction;

    if (customId === 'start_verification' || customId === 'enter_verify_code') {
      const verifiedRole = interaction.guild?.roles.cache.find(r => r.name === 'Verified');
      if (verifiedRole && interaction.member.roles.cache.has(verifiedRole.id)) {
        await interaction.reply({ content: '❌ **You are already verified!**\n\nIf you need to change your Minecraft username or link a different account, please open a support ticket in <#support-tickets> for staff assistance.', ephemeral: true });
        return;
      }
    }

    if (customId === 'start_verification') {
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
    }

    if (customId === 'enter_verify_code') {
      const modal = new ModalBuilder()
        .setCustomId('modal_enter_verify_code')
        .setTitle('Enter Verification Code');

      const codeInput = new TextInputBuilder()
        .setCustomId('verify_code')
        .setLabel('Enter the 5-digit code shown in-game:')
        .setPlaceholder('e.g. A3F89')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(codeInput);
      modal.addComponents(row);

      await interaction.showModal(modal);
      return;
    }

    if (customId === 'open_ticket') {
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch (deferErr) {
        console.warn('Failed to defer open_ticket interaction:', deferErr.message);
        return;
      }
      try {
        const supportCategory = interaction.guild.channels.cache.find(c => c.name.toLowerCase().includes('support') && c.type === ChannelType.GuildCategory);
        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.username.toLowerCase()}`,
          type: ChannelType.GuildText,
          parent: supportCategory ? supportCategory.id : null,
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: [PermissionFlagsBits.ViewChannel]
            },
            {
              id: interaction.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            },
            {
              id: client.user.id,
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
            }
          ]
        });

        await channel.send(`🎟️ **Support Ticket Created**\nWelcome <@${interaction.user.id}>! Our administrative staff will assist you shortly. Type \`/close\` to resolve and delete this channel.`);
        await interaction.editReply(`🎟️ **Ticket Opened!** Check it out here: <#${channel.id}>`);
      } catch (err) {
        await interaction.editReply(`❌ Failed to open ticket: ${err.message}`);
      }
      return;
    }

    if (customId === 'role_java' || customId === 'role_bedrock') {
      try {
        await interaction.deferReply({ ephemeral: true });
      } catch (deferErr) {
        console.warn('Failed to defer role interaction:', deferErr.message);
        return;
      }
      try {
        const roleName = customId === 'role_java' ? '☕ Java Player' : '🪨 Bedrock Player';
        const role = interaction.guild.roles.cache.find(r => r.name === roleName);
        if (!role) {
          await interaction.editReply(`❌ Role "${roleName}" not found on this server!`);
          return;
        }

        const hasRole = interaction.member.roles.cache.has(role.id);
        if (hasRole) {
          await interaction.member.roles.remove(role);
          await interaction.editReply(`✗ Removed role: **${roleName}**`);
        } else {
          await interaction.member.roles.add(role);
          await interaction.editReply(`✓ Granted role: **${roleName}**`);
        }
      } catch (err) {
        await interaction.editReply(`❌ Failed to assign role: ${err.message}`);
      }
      return;
    }

    // Giveaway enter button
    if (customId.startsWith('giveaway_enter_')) {
      const giveawayId = customId.replace('giveaway_enter_', '');
      await interaction.deferReply({ ephemeral: true });

      if (!giveawayEntries.has(giveawayId)) {
        await interaction.editReply('❌ This giveaway has ended!');
        return;
      }

      const entries = giveawayEntries.get(giveawayId);
      if (entries.has(interaction.user.id)) {
        entries.delete(interaction.user.id);
        await interaction.editReply('✗ You left the giveaway.');
      } else {
        entries.add(interaction.user.id);
        await interaction.editReply(`🎉 You entered the giveaway! (${entries.size} total entries)`);
      }
      return;
    }
  }

  if (interaction.isModalSubmit()) {
    const { customId } = interaction;
    if (customId === 'modal_start_verification') {
      await interaction.deferReply({ ephemeral: true });
      const mcUsername = interaction.fields.getTextInputValue('mc_username');
      
      try {
        const response = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'request_verification',
            guildId: '1420991845546332162',
            name: mcUsername,
            discordUserId: interaction.user.id
          })
        });

        if (response.ok) {
          const resData = await response.json();
          if (resData.ok) {
            await interaction.editReply(`✅ **Link request queued for username: \`${mcUsername}\`!**\n\nNext steps:\n1. Open Minecraft and connect to the server: **\`KryloSmp.play.hosting\`**\n2. Look at your in-game chat—your 5-digit verification code will display on join!\n3. Copy that code, return here, and click the **Enter Code** button.`);
          } else {
            await interaction.editReply(`❌ Failed: ${resData.error || 'Server error'}`);
          }
        } else {
          await interaction.editReply('❌ Failed to connect to verification server.');
        }
      } catch (err) {
        await interaction.editReply(`❌ Error: ${err.message}`);
      }
      return;
    }

    if (customId === 'modal_enter_verify_code') {
      await interaction.deferReply({ ephemeral: true });
      const code = interaction.fields.getTextInputValue('verify_code').trim().toUpperCase();

      try {
        const response = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm_verification_code',
            guildId: '1420991845546332162',
            code: code,
            discordUserId: interaction.user.id
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result.ok) {
            const mcName = result.name;

            // 1. Assign 'Verified' role
            let role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
            if (!role) {
              try {
                role = await interaction.guild.roles.create({
                  name: 'Verified',
                  color: '#00ff66',
                  reason: 'Auto-created by verification system'
                });
              } catch (roleErr) {
                console.warn('Failed to create Verified role:', roleErr.message);
              }
            }

            if (role) {
              await interaction.member.roles.add(role);
            }

            // 2. Set Nickname
            try {
              await interaction.member.setNickname(mcName, 'Synced with Minecraft username');
            } catch (nickErr) {
              console.warn('Failed to set nickname:', nickErr.message);
            }

            const successEmbed = new EmbedBuilder()
              .setColor(0x00FF66)
              .setTitle('✅ Verification Successful!')
              .setDescription(`Your Discord account is now linked to Minecraft account **${mcName}**!`)
              .addFields(
                { name: '👤 Minecraft Username', value: `\`${mcName}\``, inline: true },
                { name: '🎭 Assigned Role', value: role ? `<@&${role.id}>` : '`Verified`', inline: true }
              )
              .setTimestamp();

            await interaction.editReply({ embeds: [successEmbed] });
          } else {
            await interaction.editReply(`❌ Verification failed: ${result.error || 'Invalid or expired code.'}`);
          }
        } else {
          await interaction.editReply('❌ Failed to connect to verification server.');
        }
      } catch (err) {
        await interaction.editReply(`❌ Error: ${err.message}`);
      }
      return;
    }
  }

  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

  // Retrieve configurations dynamically from cloud database
  let botPrefix = '!';
  let aiEnabled = true;
  let modelEngine = 'gemini';
  let systemInstruction = 'You are the Krims Code AI, built and custom-trained by the genius developer Krishiv. Answer coding queries with clear instructions and a friendly, confident tone.';
  let ticketsEnabled = false;
  let guildConfig = null;

  if (interaction.guild) {
    try {
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: interaction.guild.id })
      });
      if (configRes.ok) {
        guildConfig = await configRes.json();
        botPrefix = guildConfig.prefix || '!';
        aiEnabled = guildConfig.aiEnabled !== false;
        modelEngine = guildConfig.model || 'gemini';
        systemInstruction = guildConfig.sysPrompt || systemInstruction;
        ticketsEnabled = !!guildConfig.ticketsEnabled;
      }
    } catch (err) {
      console.warn("Failed to load configs:", err.message);
    }
  }

  // Command: /github
  if (commandName === 'github') {
    await interaction.reply({
      embeds: [{
        color: 0x00f2ff,
        title: '🐙 Krylo Code Command Hub',
        description: 'Access the unified portal and ecosystem source codes below:',
        fields: [
          { name: '🌐 Developer Portal', value: '[krims-code-portal.vercel.app](https://krims-code-portal.vercel.app)' },
          { name: '🤖 Bot Control Panel', value: '[krims-bot-dashboard.vercel.app](https://krims-bot-dashboard.vercel.app)' },
          { name: '📂 Bot Repository', value: '[github.com/Krylo-60/krims-discord-bot](https://github.com/Krylo-60/krims-discord-bot)' }
        ],
        timestamp: new Date().toISOString()
      }],
      ephemeral: true
    });
    return;
  }

  // Command: /status
  if (commandName === 'status') {
    await interaction.deferReply();
    try {
      // 1. Fetch Minecraft Server Status
      const res = await fetch('https://api.mcsrvstat.us/2/KryloSmp.play.hosting');
      const data = await res.json();

      // 2. Fetch Sync Stats from Vercel config database
      let dbStats = null;
      try {
        const dbRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'get_config', guildId: '1420991845546332162' })
        });
        if (dbRes.ok) {
          const guildConfig = await dbRes.json();
          dbStats = guildConfig.serverStats;
        }
      } catch (err) {
        console.warn('Failed to fetch DB stats:', err.message);
      }

      if (data.online) {
        const playersOnline = data.players.online;
        const playersMax = data.players.max;
        const playerList = data.players.list ? data.players.list.join(', ') : 'None';
        const motd = data.motd.clean ? data.motd.clean.join('\n') : 'A Minecraft Server';

        const embed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle('🟢 KryloSMP Server Status')
          .setDescription('The server is currently online and running!')
          .addFields(
            { name: '📊 Players Online', value: `\`${playersOnline} / ${playersMax}\``, inline: true },
            { name: '🔌 Version', value: `\`${data.version}\``, inline: true },
            { name: '📡 IP Address', value: '`KryloSmp.play.hosting`', inline: false },
            { name: '📖 MOTD', value: `\`\`\`\n${motd}\n\`\`\``, inline: false },
            { name: '👥 Online Players', value: playerList, inline: false }
          );

        // Add synced statistics fields if available
        if (dbStats) {
          const playtimeHrs = (dbStats.mostPlaytimeSeconds / 3600).toFixed(1);
          embed.addFields(
            { name: '📈 Total Server Joins', value: `\`${dbStats.totalJoins || 0} times\``, inline: true },
            { name: '👥 Unique Players Joined', value: `\`${dbStats.uniquePlayers || 0} players\``, inline: true },
            { name: '👑 Most Active Player', value: `\`${dbStats.mostActivePlayer || 'None'}\` (${dbStats.mostActiveJoins || 0} joins)`, inline: false },
            { name: '🕒 Top Playtime', value: `\`${dbStats.mostPlaytimePlayer || 'None'}\` (${playtimeHrs} hours)`, inline: false }
          );
        }

        embed.setFooter({ text: 'KryloSMP Status Tracker' }).setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      } else {
        const embed = new EmbedBuilder()
          .setColor(0xFF5555)
          .setTitle('🔴 KryloSMP Server Status')
          .setDescription('The server is currently offline.')
          .addFields(
            { name: '📡 Address', value: '`KryloSmp.play.hosting`', inline: false },
            { name: '💡 Note', value: 'Start the server on Play Hosting to join!', inline: false }
          );

        if (dbStats) {
          embed.addFields(
            { name: '👥 Total Unique Players', value: `\`${dbStats.uniquePlayers || 0} players\``, inline: true },
            { name: '📈 Total Joins', value: `\`${dbStats.totalJoins || 0} joins\``, inline: true }
          );
        }

        embed.setFooter({ text: 'KryloSMP Status Tracker' }).setTimestamp();

        await interaction.editReply({ embeds: [embed] });
      }
    } catch (err) {
      await interaction.editReply(`❌ Failed to fetch server status: ${err.message}`);
    }
    return;
  }

  // Command: /ip
  if (commandName === 'ip') {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🌐 KryloSMP Connection Details')
      .setDescription('Use these details to connect to the server in Minecraft.')
      .addFields(
        { name: '☕ Java Edition', value: '• **IP:** `KryloSmp.play.hosting` (Port is default)', inline: false },
        { name: '🪨 Bedrock Edition', value: '• **IP:** `KryloSmp.play.hosting` (Port is default)', inline: false },
        { name: '🎮 Platform Integration', value: 'Both Java and Bedrock players can join and play together seamlessly!', inline: false }
      )
      .setFooter({ text: 'KryloSMP Server Info' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /shop
  if (commandName === 'shop') {
    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🛒 KryloSMP In-Game Shop Prices')
      .setDescription('Use `/shop` in-game to buy these items with your coin balance.')
      .addFields(
        { name: '💎 Ore Minerals', value: '• **Diamond**: 100 ⛃\n• **Netherite Ingot**: 500 ⛃\n• **Gold Ingot**: 25 ⛃\n• **Emerald**: 75 ⛃\n• **Iron Ingot**: 10 ⛃', inline: true },
        { name: '⚔️ Gear & Specials', value: '• **Elytra**: 1000 ⛃\n• **Trident**: 800 ⛃\n• **Totem of Undying**: 600 ⛃\n• **Shulker Box**: 300 ⛃\n• **God Apple**: 250 ⛃', inline: true }
      )
      .setFooter({ text: 'Earn coins by defeating mobs and players!' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /poll
  if (commandName === 'poll') {
    const question = interaction.options.getString('question');
    const opt1 = interaction.options.getString('option1');
    const opt2 = interaction.options.getString('option2');
    const opt3 = interaction.options.getString('option3');

    let description = `📊 **${question}**\n\n`;
    description += `1️⃣ ${opt1}\n`;
    description += `2️⃣ ${opt2}\n`;
    if (opt3) description += `3️⃣ ${opt3}\n`;
    description += `\nReact below to vote!`;

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📊 Server Poll')
      .setDescription(description)
      .setFooter({ text: `Poll by ${interaction.user.username}` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });
    await msg.react('1️⃣');
    await msg.react('2️⃣');
    if (opt3) await msg.react('3️⃣');
    return;
  }

  // Command: /giveaway
  if (commandName === 'giveaway') {
    const prize = interaction.options.getString('prize');
    const duration = interaction.options.getInteger('duration');

    const endTime = Math.floor(Date.now() / 1000) + (duration * 60);

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🎉 GIVEAWAY!')
      .setDescription(`**Prize:** ${prize}\n\n⏰ Ends: <t:${endTime}:R>\n\nClick the button below to enter!`)
      .setFooter({ text: `Hosted by ${interaction.user.username} • 0 entries` })
      .setTimestamp();

    const msg = await interaction.reply({ embeds: [embed], fetchReply: true });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_enter_${msg.id}`)
        .setLabel('Enter Giveaway')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎉')
    );
    await msg.edit({ components: [row] });

    // Track entries
    giveawayEntries.set(msg.id, new Set());

    // End giveaway after duration
    setTimeout(async () => {
      try {
        const entries = giveawayEntries.get(msg.id);
        giveawayEntries.delete(msg.id);

        const endEmbed = new EmbedBuilder()
          .setColor(0xFF5555)
          .setTitle('🎉 GIVEAWAY ENDED!')
          .setTimestamp();

        if (!entries || entries.size === 0) {
          endEmbed.setDescription(`**Prize:** ${prize}\n\n😢 No one entered the giveaway.`);
        } else {
          const winnerId = [...entries][Math.floor(Math.random() * entries.size)];
          endEmbed.setDescription(`**Prize:** ${prize}\n\n🏆 **Winner:** <@${winnerId}>\n\nCongrats! 🎊`);
        }

        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`giveaway_ended_${msg.id}`)
            .setLabel('Giveaway Ended')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true)
        );

        await msg.edit({ embeds: [endEmbed], components: [disabledRow] });
      } catch (err) {
        console.warn('[Giveaway] Failed to end giveaway:', err.message);
      }
    }, duration * 60 * 1000);

    return;
  }

  // Command: /leaderboard
  if (commandName === 'leaderboard') {
    await interaction.deferReply();
    try {
      const members = await interaction.guild.members.fetch();
      const sorted = members
        .filter(m => !m.user.bot)
        .sort((a, b) => {
          const aJoined = a.joinedTimestamp || 0;
          const bJoined = b.joinedTimestamp || 0;
          return aJoined - bJoined;
        })
        .first(10);

      let leaderboardText = '';
      const medals = ['🥇', '🥈', '🥉'];
      let i = 0;
      for (const [, member] of sorted) {
        const medal = medals[i] || `**${i + 1}.**`;
        const joined = member.joinedAt ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'Unknown';
        leaderboardText += `${medal} **${member.user.username}** — Joined ${joined}\n`;
        i++;
      }

      const embed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setTitle('👑 KryloSMP Leaderboard — Earliest Members')
        .setDescription(leaderboardText || 'No members found.')
        .setFooter({ text: `${interaction.guild.memberCount} total members` })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Failed to fetch leaderboard: ${err.message}`);
    }
    return;
  }

  // Command: /serverinfo
  if (commandName === 'serverinfo') {
    const guild = interaction.guild;
    const owner = await guild.fetchOwner();
    const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
    const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
    const roles = guild.roles.cache.size;
    const boosts = guild.premiumSubscriptionCount || 0;

    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle(`📋 ${guild.name} — Server Info`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: '👑 Owner', value: `${owner.user.username}`, inline: true },
        { name: '👥 Members', value: `${guild.memberCount}`, inline: true },
        { name: '💬 Text Channels', value: `${textChannels}`, inline: true },
        { name: '🔊 Voice Channels', value: `${voiceChannels}`, inline: true },
        { name: '🎭 Roles', value: `${roles}`, inline: true },
        { name: '🚀 Boosts', value: `${boosts}`, inline: true },
        { name: '📅 Created', value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
      )
      .setFooter({ text: `Server ID: ${guild.id}` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
    return;
  }

  // Command: /suggest
  if (commandName === 'suggest') {
    const idea = interaction.options.getString('idea');
    const suggestCh = interaction.guild.channels.cache.find(c => c.name.includes('suggestions') && c.type === ChannelType.GuildText);

    if (!suggestCh) {
      await interaction.reply({ content: '❌ No suggestions channel found!', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('💡 New Suggestion')
      .setDescription(idea)
      .setFooter({ text: `Suggested by ${interaction.user.username}` })
      .setTimestamp();

    const msg = await suggestCh.send({ embeds: [embed] });
    await msg.react('👍');
    await msg.react('👎');

    await interaction.reply({ content: `✅ Your suggestion was posted in ${suggestCh}!`, ephemeral: true });
    return;
  }

  // Command: /announce
  if (commandName === 'announce') {
    if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      await interaction.reply({ content: '❌ Only admins can send announcements!', ephemeral: true });
      return;
    }

    const title = interaction.options.getString('title');
    const message = interaction.options.getString('message');
    const announceCh = interaction.guild.channels.cache.find(c => c.name.includes('announcements') && c.type === ChannelType.GuildText);

    if (!announceCh) {
      await interaction.reply({ content: '❌ No announcements channel found!', ephemeral: true });
      return;
    }

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle(`📣 ${title}`)
      .setDescription(message)
      .setFooter({ text: `Announced by ${interaction.user.username}` })
      .setTimestamp();

    await announceCh.send({ content: '@everyone', embeds: [embed] });
    await interaction.reply({ content: `✅ Announcement posted in ${announceCh}!`, ephemeral: true });
    return;
  }

  // Command: /diagnose
  if (commandName === 'diagnose') {
    await interaction.deferReply();
    try {
      const health = await sdk.health();
      let npmDownloads = '142';
      try {
        const npmRes = await fetch('https://api.npmjs.org/downloads/point/last-week/@krishivpb60/krims-code-cli');
        const npmData = await npmRes.json();
        if (npmData.downloads) npmDownloads = npmData.downloads.toLocaleString();
      } catch {}

      const embed = {
        color: 0x00f2ff,
        title: '⚡ Krims Code Network Telemetry',
        description: 'Real-time telemetry and version diagnostic for the unified workspace.',
        fields: [
          { name: '🌐 AI Router Mesh', value: health.ok ? `🟢 Online (Vocab: ${health.localVocabSize} words)` : '🔴 Offline', inline: true },
          { name: '📦 NPM Package Downloads', value: `📈 ~${npmDownloads} downloads/week`, inline: true },
          { name: '🐍 PyPI CLI Package', value: '🟢 v1.5.7 Live', inline: true },
          { name: '🖥️ Desktop Tauri IDE', value: '🟢 v0.1.0 Ready', inline: true }
        ],
        timestamp: new Date().toISOString()
      };
      await interaction.editReply({ embeds: [embed] });
    } catch (err) {
      await interaction.editReply(`❌ Failed to run diagnostics: ${err.message}`);
    }
    return;
  }

  // Command: /verify
  if (commandName === 'verify') {
    await interaction.deferReply({ ephemeral: true });
    
    // Check if player is already verified
    const verifiedRole = interaction.guild?.roles.cache.find(r => r.name === 'Verified');
    if (verifiedRole && interaction.member.roles.cache.has(verifiedRole.id)) {
      await interaction.editReply('❌ **You are already verified!**\n\nIf you need to change your Minecraft username or link a different account, please open a support ticket in <#support-tickets> for staff assistance.');
      return;
    }
    
    const code = interaction.options.getString('code').trim();

    try {
      // 1. Confirm code with Vercel API
      const response = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_verification',
          guildId: '1420991845546332162',
          code: code,
          discordUserId: interaction.user.id
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.ok) {
          const mcName = result.name;

          // 2. Assign 'Verified' role in Discord guild
          let role = interaction.guild.roles.cache.find(r => r.name === 'Verified');
          if (!role) {
            try {
              role = await interaction.guild.roles.create({
                name: 'Verified',
                color: '#00ff66',
                reason: 'Auto-created by verification system'
              });
            } catch (roleErr) {
              console.warn('Failed to create Verified role:', roleErr.message);
            }
          }

          if (role) {
            await interaction.member.roles.add(role);
          }

          // 3. Rename user's nickname to match their Minecraft username!
          try {
            await interaction.member.setNickname(mcName, 'Synced with Minecraft username');
          } catch (nickErr) {
            console.warn('Failed to set nickname:', nickErr.message);
          }

          const successEmbed = new EmbedBuilder()
            .setColor(0x00FF66)
            .setTitle('✅ Verification Successful!')
            .setDescription(`Your Discord account is now linked to Minecraft account **${mcName}**!`)
            .addFields(
              { name: '👤 Minecraft Username', value: `\`${mcName}\``, inline: true },
              { name: '🎭 Assigned Role', value: role ? `<@&${role.id}>` : '`Verified`', inline: true }
            )
            .setTimestamp();

          await interaction.editReply({ embeds: [successEmbed] });
        } else {
          await interaction.editReply(`❌ Verification failed: ${result.error || 'Invalid or expired code.'}`);
        }
      } else {
        await interaction.editReply('❌ Failed to connect to verification server. Please try again later.');
      }
    } catch (err) {
      await interaction.editReply(`❌ Error during verification: ${err.message}`);
    }
    return;
  }

  // Command: /ticket
  if (commandName === 'ticket') {
    if (!interaction.guild) {
      await interaction.reply({ content: "❌ Tickets can only be created inside servers!", ephemeral: true });
      return;
    }
    if (!ticketsEnabled) {
      await interaction.reply({ content: "🔒 **The ticket system is disabled on this server.** Enable it from the dashboard!", ephemeral: true });
      return;
    }

    await interaction.deferReply({ ephemeral: true });

    try {
      const supportCategory = interaction.guild.channels.cache.find(c => c.name.toLowerCase().includes('support') && c.type === ChannelType.GuildCategory);
      const channel = await interaction.guild.channels.create({
        name: `ticket-${interaction.user.username.toLowerCase()}`,
        type: ChannelType.GuildText,
        parent: supportCategory ? supportCategory.id : null,
        permissionOverwrites: [
          {
            id: interaction.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });

      await channel.send(`🎟️ **Support Ticket Created**\nWelcome <@${interaction.user.id}>! Our administrative staff will assist you shortly. Type \`/close\` to resolve and delete this channel.`);
      await interaction.editReply(`🎟️ **Ticket Opened!** Private support channel created here: <#${channel.id}>`);

      if (guildConfig) {
        const tickets = guildConfig.openTickets || [];
        tickets.push({ id: channel.id, name: channel.name, user: interaction.user.username });
        guildConfig.openTickets = tickets;
        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId: interaction.guild.id, config: guildConfig })
        });
      }
    } catch (err) {
      await interaction.editReply(`❌ Failed to open ticket: ${err.message}`);
    }
    return;
  }

  // Command: /close
  if (commandName === 'close') {
    if (!interaction.channel.name.startsWith('ticket-')) {
      await interaction.reply({ content: "❌ This command can only be used inside support ticket channels!", ephemeral: true });
      return;
    }

    await interaction.reply("🔒 **Support ticket resolved. Deleting channel in 5 seconds...**");

    if (interaction.guild && guildConfig) {
      try {
        const tickets = guildConfig.openTickets || [];
        guildConfig.openTickets = tickets.filter(t => t.id !== interaction.channel.id);
        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId: interaction.guild.id, config: guildConfig })
        });
      } catch (err) {
        console.warn("Failed to remove ticket from database:", err.message);
      }
    }

    setTimeout(async () => {
      try {
        await interaction.channel.delete();
      } catch {}
    }, 5000);
    return;
  }

  // Command: /ask
  if (commandName === 'ask') {
    if (!aiEnabled) {
      await interaction.reply({ content: "🔒 **AI responses are disabled on this server.**", ephemeral: true });
      return;
    }

    const prompt = interaction.options.getString('prompt');
    
    // Cooldown check
    const now = Date.now();
    const lastQuery = userCooldowns.get(interaction.user.id) || 0;
    const timeRemaining = COOLDOWN_TIME - (now - lastQuery);

    if (timeRemaining > 0) {
      const seconds = Math.ceil(timeRemaining / 1000);
      await interaction.reply({ content: `⏳ Please wait **${seconds}s** before asking another question.`, ephemeral: true });
      return;
    }

    userCooldowns.set(interaction.user.id, now);
    await interaction.deferReply();

    try {
      let history = conversationHistory.get(interaction.channel.id) || [];
      const result = await sdk.ask(prompt, {
        model: modelEngine,
        systemInstruction: systemInstruction,
        history: history
      });

      if (result.ok && result.response) {
        history.push({ role: 'user', content: prompt });
        history.push({ role: 'model', content: result.response });
        if (history.length > 10) history = history.slice(history.length - 10);
        conversationHistory.set(interaction.channel.id, history);

        let replyText = `🤖 **Krims AI Response:**\n${result.response}`;
        if (result.stats) {
          replyText += `\n\n*Latency: ${result.stats.latency}*`;
        }
        await interaction.editReply(replyText);
      } else {
        await interaction.editReply("❌ Failed to parse AI response.");
      }
    } catch (err) {
      await interaction.editReply(`❌ Error calling Krims API: ${err.message}`);
    }
  }
});

// Prefix Message Commands Handler (Legacy fallback & DMs)
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim();
  const isDM = !message.guild;

  // Retrieve configurations dynamically
  let botPrefix = '!';
  let aiEnabled = true;
  let modelEngine = 'gemini';
  let systemInstruction = 'You are the Krims Code AI, built and custom-trained by the genius developer Krishiv. Answer coding queries with clear instructions and a friendly, confident tone.';
  let ticketsEnabled = false;
  let guildConfig = null;

  if (message.guild) {
    try {
      const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get_config', guildId: message.guild.id })
      });
      if (configRes.ok) {
        guildConfig = await configRes.json();
        botPrefix = guildConfig.prefix || '!';
        aiEnabled = guildConfig.aiEnabled !== false;
        modelEngine = guildConfig.model || 'gemini';
        systemInstruction = guildConfig.sysPrompt || systemInstruction;
        ticketsEnabled = !!guildConfig.ticketsEnabled;
      }
    } catch (err) {
      console.warn("Failed to load configs:", err.message);
    }
  }

  // Check for Custom Auto-Responses
  if (message.guild && guildConfig) {
    try {
      const activeCustomCommands = guildConfig.customCommands || [];
      const matchedCmd = activeCustomCommands.find(c => c.trigger.toLowerCase() === content.toLowerCase());
      if (matchedCmd) {
        await message.reply(matchedCmd.response);
        return;
      }
    } catch {}
  }

  // Command: !close
  if (content.toLowerCase() === botPrefix + 'close' || content.toLowerCase() === '!close') {
    if (message.channel.name.startsWith('ticket-')) {
      await message.reply("🔒 **Support ticket resolved. Deleting channel in 5 seconds...**");
      
      if (message.guild && guildConfig) {
        try {
          const tickets = guildConfig.openTickets || [];
          guildConfig.openTickets = tickets.filter(t => t.id !== message.channel.id);
          await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'save_config', guildId: message.guild.id, config: guildConfig })
          });
        } catch (err) {
          console.warn("Failed to remove ticket from database:", err.message);
        }
      }

      setTimeout(async () => {
        try {
          await message.channel.delete();
        } catch {}
      }, 5000);
      return;
    }
  }

  // Command: !ticket
  if (content.toLowerCase() === botPrefix + 'ticket' || content.toLowerCase() === '!ticket') {
    if (!message.guild) {
      await message.reply("❌ Tickets can only be created inside servers!");
      return;
    }
    if (!ticketsEnabled) {
      await message.reply("🔒 **The ticket support system is currently disabled on this server.** Enable it from the dashboard!");
      return;
    }

    try {
      const supportCategory = message.guild.channels.cache.find(c => c.name.toLowerCase().includes('support') && c.type === ChannelType.GuildCategory);
      const channel = await message.guild.channels.create({
        name: `ticket-${message.author.username.toLowerCase()}`,
        type: ChannelType.GuildText,
        parent: supportCategory ? supportCategory.id : null,
        permissionOverwrites: [
          {
            id: message.guild.id,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: message.author.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          },
          {
            id: client.user.id,
            allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
          }
        ]
      });

      await channel.send(`🎟️ **Support Ticket Created**\nWelcome ${message.author}! Our administrative staff will assist you shortly. Type \`${botPrefix}close\` to resolve and delete this channel.`);
      await message.reply(`🎟️ **Ticket Opened!** Check your private support channel here: ${channel}`);

      if (guildConfig) {
        const tickets = guildConfig.openTickets || [];
        tickets.push({ id: channel.id, name: channel.name, user: message.author.username });
        guildConfig.openTickets = tickets;

        await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save_config', guildId: message.guild.id, config: guildConfig })
        });
      }
    } catch (err) {
      await message.reply(`❌ Failed to open ticket: ${err.message}`);
    }
    return;
  }

  // Command: !reset
  if (content === botPrefix + 'reset' || (isDM && content.toLowerCase() === 'reset')) {
    conversationHistory.delete(message.channel.id);
    await message.reply("🧹 **Memory cleared!** Starting a fresh conversation.");
    return;
  }

  // Command: !help
  if (content === botPrefix + 'help' || (isDM && content.toLowerCase() === 'help')) {
    const helpEmbed = {
      color: 0x00f2ff,
      title: '👾 Krims Code AI - Command Guide',
      description: 'Welcome to your premium developer workspace bot assistant. Below is the list of available commands:',
      fields: [
        { name: '💬 Chat / AI Reasoning', value: isDM ? 'Just type a message naturally in DM to chat.' : `Type \`${botPrefix}ask <your question>\` in servers to ask queries.` },
        { name: '🎟️ Support Tickets', value: `Type \`${botPrefix}ticket\` to open a private assistance channel.` },
        { name: '🧹 Reset memory', value: `Type \`${botPrefix}reset\` to start a new chat session.` },
        { name: '📊 Network Telemetry', value: `Type \`${botPrefix}diagnose\` to compile local and global network statistics.` },
        { name: '👾 Bot Help', value: `Type \`${botPrefix}help\` to open this menu.` }
      ],
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Krims Code Command Center • Coded by Krishiv'
      }
    };
    await message.reply({ embeds: [helpEmbed] });
    return;
  }

  // Command: !diagnose
  if (content === botPrefix + 'diagnose') {
    const typingMsg = await message.reply("⚙️ *Compiling Krims Code network diagnostics...*");

    try {
      const health = await sdk.health();
      let npmCliDownloads = '142';
      try {
        const npmRes = await fetch('https://api.npmjs.org/downloads/point/last-week/@krishivpb60/krims-code-cli');
        const npmData = await npmRes.json();
        if (npmData.downloads) npmCliDownloads = npmData.downloads.toLocaleString();
      } catch {}

      const embed = {
        color: 0x00f2ff,
        title: '⚡ Krims Code Network Telemetry',
        description: 'Real-time telemetry and version diagnostic for the unified workspace.',
        fields: [
          { name: '🌐 AI Router Mesh', value: health.ok ? `🟢 Online (Vocab: ${health.localVocabSize} words)` : '🔴 Offline', inline: true },
          { name: '📦 NPM Package Downloads', value: `📈 ~${npmCliDownloads} downloads/week`, inline: true },
          { name: '🐍 PyPI CLI Package', value: '🟢 v1.5.7 Live', inline: true },
          { name: '🖥️ Desktop Tauri IDE', value: '🟢 v0.1.0 Ready', inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: {
          text: 'Krims Code Command Center'
        }
      };

      await typingMsg.edit({ content: '', embeds: [embed] });
    } catch (err) {
      await typingMsg.edit(`❌ Failed to run diagnosis: ${err.message}`);
    }
    return;
  }

  // Determine if it is a Chat Prompt using dynamic prefix
  let isPrompt = false;
  let prompt = '';

  const prefixLower = botPrefix.toLowerCase();
  if (content.toLowerCase().startsWith(prefixLower + 'ask ')) {
    isPrompt = true;
    prompt = content.substring(botPrefix.length + 4).trim();
  } else if (isDM && !content.startsWith('!')) {
    isPrompt = true;
    prompt = content;
  }

  if (isPrompt) {
    if (!aiEnabled) {
      if (!isDM) {
        await message.reply("🔒 **AI conversation responses are currently disabled on this server.** Enable it from the dashboard to chat!");
      }
      return;
    }

    if (!prompt) {
      message.reply(`⚠️ Please provide a prompt! Use: \`${botPrefix}ask <query>\``);
      return;
    }

    // Rate Limiting / Cooldown check to protect API quota
    const now = Date.now();
    const lastQuery = userCooldowns.get(message.author.id) || 0;
    const timeRemaining = COOLDOWN_TIME - (now - lastQuery);

    if (timeRemaining > 0) {
      const seconds = Math.ceil(timeRemaining / 1000);
      await message.reply(`⏳ **Rate Limit Active!** Please wait **${seconds}s** before asking another question to protect API quotas.`);
      return;
    }

    // Set new cooldown timestamp
    userCooldowns.set(message.author.id, now);

    const typingMsg = await message.reply("⚡ *Krims AI is calculating...*");

    // Fast local JS evaluation for simple math/arithmetic expressions
    const lowerPrompt = prompt.toLowerCase().trim();
    const cleanMathExpr = lowerPrompt.replace(/what is/gi, '').replace(/\?/g, '').replace(/=/g, '').trim();
    const mathRegex = /^[0-9+\-*/().\s]+$/;
    if (mathRegex.test(cleanMathExpr) && /[0-9]/.test(cleanMathExpr)) {
      try {
        const mathResult = Function(`"use strict"; return (${cleanMathExpr})`)();
        const responseText = `🤖 **Krims AI Response:**\nThe answer to ${cleanMathExpr} is ${mathResult}!`;
        await typingMsg.edit(responseText);
        return;
      } catch (e) {
        // Fall back to querying the SDK if evaluation fails
      }
    }

    try {
      // Retrieve conversation history
      let history = conversationHistory.get(message.channel.id) || [];

      // Query the custom SDK with history, dynamic model, and prompt
      const result = await sdk.ask(prompt, {
        model: modelEngine,
        systemInstruction: systemInstruction,
        history: history
      });

      if (result.ok && result.response) {
        // Update local history
        history.push({ role: 'user', content: prompt });
        history.push({ role: 'model', content: result.response });

        // Limit memory history to the last 10 messages (5 turns)
        if (history.length > 10) {
          history = history.slice(history.length - 10);
        }
        conversationHistory.set(message.channel.id, history);

        let replyText = `🤖 **Krims AI Response:**\n${result.response}`;
        if (result.stats) {
          replyText += `\n\n*Latency: ${result.stats.latency}*`;
        }
        await typingMsg.edit(replyText);
      } else {
        await typingMsg.edit("❌ Failed to parse AI response.");
      }
    } catch (err) {
      console.error(err);
      await typingMsg.edit(`❌ Error calling Krims API: ${err.message}`);
    }
  }
});
// ═══════════════════════════════════════════════════════════
// WELCOME SYSTEM — Auto-role + Welcome message on join
// ═══════════════════════════════════════════════════════════
const KRYLO_GUILD_ID = '1524878881918685405';

client.on('guildMemberAdd', async (member) => {
  if (member.guild.id !== KRYLO_GUILD_ID) return;

  // Auto-assign 🎮 Member role
  try {
    const memberRole = member.guild.roles.cache.find(r => r.name === '🎮 Member');
    if (memberRole) {
      await member.roles.add(memberRole);
      console.log(`[Welcome] Assigned 🎮 Member role to ${member.user.username}`);
    }
  } catch (err) {
    console.warn(`[Welcome] Failed to assign role:`, err.message);
  }

  // Send welcome message in #general
  try {
    const generalCh = member.guild.channels.cache.find(c => c.name.includes('general') && c.type === ChannelType.GuildText);
    if (generalCh) {
      const memberCount = member.guild.memberCount;
      const embed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('⚡ New Player Joined!')
        .setDescription(`Welcome to **KryloSMP**, <@${member.user.id}>! You are member **#${memberCount}**!`)
        .addFields(
          { name: '🎮 Server IP', value: '`KryloSmp.play.hosting`', inline: true },
          { name: '📜 Rules', value: 'Check <#rules> first!', inline: true },
          { name: '🎨 Get Roles', value: 'Pick your platform role in <#server-info>!', inline: true }
        )
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .setFooter({ text: `KryloSMP • ${memberCount} members` })
        .setTimestamp();

      await generalCh.send({ embeds: [embed] });
    }
  } catch (err) {
    console.warn(`[Welcome] Failed to send welcome message:`, err.message);
  }
});

// Login using bot token
const token = process.env.DISCORD_TOKEN;
if (token && token !== 'YOUR_DISCORD_TOKEN') {
  client.login(token);
} else {
  console.log('[!] DISCORD_TOKEN is missing or mock. Add a valid Discord Bot Token in the .env file to start the bot.');
}

// Global process error handlers to prevent crashes on Discord API timeouts/errors
process.on('uncaughtException', (err) => {
  console.error('[CRITICAL] Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('[CRITICAL] Unhandled Rejection at:', promise, 'reason:', reason);
});

