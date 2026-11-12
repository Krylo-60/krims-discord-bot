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
import { db } from '../databaseEngine.mjs';

// ═════════════════════════════════════════════════════════════════════════════
// 1. 🗄️ DATABASE INITIALIZATION & IN-MEMORY CACHE
// ═════════════════════════════════════════════════════════════════════════════
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS jtc_config (
      guild_id TEXT PRIMARY KEY,
      hub_channel_id TEXT,
      category_id TEXT,
      name_format TEXT DEFAULT '🔊・{user}''s VC',
      default_limit INTEGER DEFAULT 0,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
} catch (e) {
  console.warn('[JTC DB Init Notice]:', e.message);
}

try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS temp_voice_channels (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      locked INTEGER DEFAULT 0,
      hidden INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
} catch (e) {
  console.warn('[JTC Temp Channels DB Notice]:', e.message);
}

// In-Memory cache for 0ms ultra-fast lookup: channelId -> { guild_id, owner_id, locked, hidden }
export const activeTempVoiceChannels = new Map();
export const guildJtcConfigCache = new Map(); // guild_id -> config

// Hydrate cache from SQLite on startup
try {
  const rows = db.prepare('SELECT * FROM temp_voice_channels').all();
  for (const r of rows) {
    activeTempVoiceChannels.set(r.channel_id, {
      guild_id: r.guild_id,
      owner_id: r.owner_id,
      locked: Boolean(r.locked),
      hidden: Boolean(r.hidden)
    });
  }
} catch (_) {}

export function getJtcConfig(guildId) {
  if (guildJtcConfigCache.has(guildId)) {
    return guildJtcConfigCache.get(guildId);
  }
  const row = db.prepare('SELECT * FROM jtc_config WHERE guild_id = ?').get(guildId);
  if (row) {
    guildJtcConfigCache.set(guildId, row);
    return row;
  }
  return null;
}

export function saveJtcConfig(guildId, hubChannelId, categoryId, nameFormat = "🔊・{user}'s VC", defaultLimit = 0) {
  db.prepare(`
    INSERT INTO jtc_config (guild_id, hub_channel_id, category_id, name_format, default_limit, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(guild_id) DO UPDATE SET
      hub_channel_id = excluded.hub_channel_id,
      category_id = excluded.category_id,
      name_format = excluded.name_format,
      default_limit = excluded.default_limit,
      updated_at = CURRENT_TIMESTAMP
  `).run(guildId, hubChannelId, categoryId, nameFormat, defaultLimit);

  const updated = {
    guild_id: guildId,
    hub_channel_id: hubChannelId,
    category_id: categoryId,
    name_format: nameFormat,
    default_limit: defaultLimit
  };
  guildJtcConfigCache.set(guildId, updated);
  return updated;
}

export function deleteJtcConfig(guildId) {
  db.prepare('DELETE FROM jtc_config WHERE guild_id = ?').run(guildId);
  guildJtcConfigCache.delete(guildId);
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. 🎛️ VOICE CONTROL PANEL EMBED BUILDER
// ═════════════════════════════════════════════════════════════════════════════
export function buildJtcControlPanel(ownerId, channelName, isLocked = false, isHidden = false, userLimit = 0) {
  const embed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle('🔊 Dynamic Voice Channel Controls')
    .setDescription(
      `Welcome to your personal temporary voice channel!\n\n` +
      `👑 **Channel Owner:** <@${ownerId}>\n` +
      `📌 **Status:** ${isLocked ? '🔒 `Locked`' : '🔓 `Public`'} | ${isHidden ? '🙈 `Hidden`' : '👁️ `Visible`'}\n` +
      `👥 **User Limit:** \`${userLimit > 0 ? userLimit : 'Unlimited'}\`\n\n` +
      `Use the interactive buttons below to manage access, customize your room, and invite friends!`
    )
    .addFields(
      { name: '🔒 Lock / 🔓 Unlock', value: 'Control whether members can join', inline: true },
      { name: '🙈 Hide / 👁️ Unhide', value: 'Toggle channel visibility', inline: true },
      { name: '👥 User Limit', value: 'Set max member capacity', inline: true },
      { name: '✏️ Rename', value: 'Change your channel name', inline: true },
      { name: '👑 Claim', value: 'Claim ownership if owner leaves', inline: true },
      { name: '🧹 Auto-Cleanup', value: 'Deletes automatically when empty', inline: true }
    )
    .setFooter({ text: 'Krims Code AI • Dynamic Voice Architecture ⚡' })
    .setTimestamp();

  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('jtc_toggle_lock')
      .setLabel(isLocked ? 'Unlock Room' : 'Lock Room')
      .setEmoji(isLocked ? '🔓' : '🔒')
      .setStyle(isLocked ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('jtc_toggle_hide')
      .setLabel(isHidden ? 'Unhide Room' : 'Hide Room')
      .setEmoji(isHidden ? '👁️' : '🙈')
      .setStyle(isHidden ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('jtc_set_limit')
      .setLabel('Set Limit')
      .setEmoji('👥')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('jtc_rename')
      .setLabel('Rename')
      .setEmoji('✏️')
      .setStyle(ButtonStyle.Primary)
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('jtc_claim_owner')
      .setLabel('Claim Owner')
      .setEmoji('👑')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('jtc_disconnect_all')
      .setLabel('Close & Delete')
      .setEmoji('🗑️')
      .setStyle(ButtonStyle.Danger)
  );

  return { embeds: [embed], components: [row1, row2] };
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. 🎙️ VOICE STATE UPDATE HANDLER (Event: voiceStateUpdate)
// ═════════════════════════════════════════════════════════════════════════════
export async function handleJtcVoiceStateUpdate(oldState, newState, client) {
  try {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const config = getJtcConfig(guild.id);

    // ─── PART A: User Joins The Hub Channel (Create Dynamic VC) ───
    if (config && config.hub_channel_id && newState.channelId === config.hub_channel_id) {
      const member = newState.member;
      if (!member) return;

      const userName = (member.displayName || member.user.username).replace(/[^a-zA-Z0-9 _-]/g, '').trim() || member.user.username;
      const targetName = (config.name_format || "🔊・{user}'s VC").replace('{user}', userName).slice(0, 95);

      // Verify category exists
      let parentCategory = config.category_id ? guild.channels.cache.get(config.category_id) : null;
      if (!parentCategory && config.category_id) {
        parentCategory = await guild.channels.fetch(config.category_id).catch(() => null);
      }

      // Overwrites: Member gets full manager permissions over their dynamic room!
      const permissionOverwrites = [
        {
          id: guild.roles.everyone.id,
          type: OverwriteType.Role,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.Stream,
            PermissionFlagsBits.UseVAD,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ReadMessageHistory
          ]
        },
        {
          id: member.id,
          type: OverwriteType.Member,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.Stream,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.MuteMembers,
            PermissionFlagsBits.DeafenMembers,
            PermissionFlagsBits.PrioritySpeaker,
            PermissionFlagsBits.SendMessages
          ]
        },
        {
          id: client.user.id,
          type: OverwriteType.Member,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.Connect,
            PermissionFlagsBits.Speak,
            PermissionFlagsBits.MoveMembers,
            PermissionFlagsBits.ManageChannels,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.EmbedLinks
          ]
        }
      ];

      // Create the dynamic voice channel
      const tempChannel = await guild.channels.create({
        name: targetName,
        type: ChannelType.GuildVoice,
        parent: parentCategory?.id || null,
        userLimit: config.default_limit || 0,
        permissionOverwrites
      });

      if (tempChannel && tempChannel.id) {
        // Move member into their brand new voice channel!
        await member.voice.setChannel(tempChannel).catch(err => {
          console.warn('[JTC Move Error]:', err.message);
        });

        // Save to DB and in-memory cache
        db.prepare(`
          INSERT INTO temp_voice_channels (channel_id, guild_id, owner_id, locked, hidden)
          VALUES (?, ?, ?, 0, 0)
        `).run(tempChannel.id, guild.id, member.id);

        activeTempVoiceChannels.set(tempChannel.id, {
          guild_id: guild.id,
          owner_id: member.id,
          locked: false,
          hidden: false
        });

        // Send interactive controller panel directly in the voice channel's text chat!
        const panelPayload = buildJtcControlPanel(member.id, targetName, false, false, config.default_limit || 0);
        await tempChannel.send({
          content: `👋 Hey <@${member.id}>! Your dynamic voice channel has been established! Use the controls below to manage it:`,
          ...panelPayload
        }).catch(() => {});
      }
    }

    // ─── PART B: User Leaves A Temporary Voice Channel (Auto-Cleanup) ───
    if (oldState.channelId && oldState.channelId !== newState.channelId) {
      if (activeTempVoiceChannels.has(oldState.channelId)) {
        const oldChannel = oldState.channel || guild.channels.cache.get(oldState.channelId) || await guild.channels.fetch(oldState.channelId).catch(() => null);
        
        if (oldChannel) {
          const remainingCount = oldChannel.members ? oldChannel.members.size : 0;
          
          if (remainingCount === 0) {
            // Delete the empty temporary voice channel
            activeTempVoiceChannels.delete(oldState.channelId);
            try {
              db.prepare('DELETE FROM temp_voice_channels WHERE channel_id = ?').run(oldState.channelId);
            } catch (_) {}
            
            await oldChannel.delete('Join-to-Create: Channel is empty. Automatic cleanup.').catch(() => {});
          } else {
            // Channel still has members; if the member who left was the owner, notify remaining members they can claim it!
            const cachedInfo = activeTempVoiceChannels.get(oldState.channelId);
            if (cachedInfo && cachedInfo.owner_id === oldState.member?.id) {
              await oldChannel.send({
                content: `👑 **The Channel Owner has left!** Any remaining member can click **[👑 Claim Owner]** in the control panel to take ownership of this room.`
              }).catch(() => {});
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[JTC Voice State Error]:', err.message);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. 🎛️ HANDLE INTERACTIVE BUTTONS & MODALS
// ═════════════════════════════════════════════════════════════════════════════
export async function handleJtcInteraction(interaction) {
  const customId = interaction.customId;

  // ─── Modals ───
  if (interaction.isModalSubmit()) {
    if (customId === 'modal_jtc_rename') {
      await interaction.deferReply({ ephemeral: true });
      const newName = interaction.fields.getTextInputValue('jtc_name_input').trim();
      const channel = interaction.member?.voice?.channel;
      
      if (!channel || !activeTempVoiceChannels.has(channel.id)) {
        return interaction.editReply({ content: '❌ You must be inside your temporary voice channel to rename it!' });
      }
      const info = activeTempVoiceChannels.get(channel.id);
      if (info.owner_id !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.editReply({ content: '❌ Only the channel owner can rename this voice channel!' });
      }

      await channel.setName(newName).catch(err => {
        return interaction.editReply({ content: `❌ Failed to rename channel: ${err.message}` });
      });

      return interaction.editReply({ content: `✅ Successfully renamed your channel to **${newName}**!` });
    }

    if (customId === 'modal_jtc_limit') {
      await interaction.deferReply({ ephemeral: true });
      const rawLimit = interaction.fields.getTextInputValue('jtc_limit_input').trim();
      const limitNum = parseInt(rawLimit, 10);

      if (isNaN(limitNum) || limitNum < 0 || limitNum > 99) {
        return interaction.editReply({ content: '❌ Invalid limit! Please enter a number between 0 (unlimited) and 99.' });
      }

      const channel = interaction.member?.voice?.channel;
      if (!channel || !activeTempVoiceChannels.has(channel.id)) {
        return interaction.editReply({ content: '❌ You must be inside your temporary voice channel to change user limit!' });
      }
      const info = activeTempVoiceChannels.get(channel.id);
      if (info.owner_id !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        return interaction.editReply({ content: '❌ Only the channel owner can change the user limit!' });
      }

      await channel.setUserLimit(limitNum).catch(err => {
        return interaction.editReply({ content: `❌ Failed to set user limit: ${err.message}` });
      });

      return interaction.editReply({ content: `✅ User limit updated to **${limitNum === 0 ? 'Unlimited' : limitNum}**!` });
    }
  }

  // ─── Buttons ───
  if (!interaction.isButton()) return false;
  if (!customId.startsWith('jtc_')) return false;

  const member = interaction.member;
  const channel = member?.voice?.channel;

  // Must be in a voice channel managed by JTC
  if (!channel || !activeTempVoiceChannels.has(channel.id)) {
    return interaction.reply({
      content: '❌ You must be actively connected to your temporary voice channel to use these controls!',
      ephemeral: true
    });
  }

  const info = activeTempVoiceChannels.get(channel.id);
  const isOwner = info.owner_id === interaction.user.id;
  const isAdmin = member.permissions.has(PermissionFlagsBits.ManageChannels) || member.permissions.has(PermissionFlagsBits.Administrator);

  // 1. 🔒 Toggle Lock / Unlock
  if (customId === 'jtc_toggle_lock') {
    if (!isOwner && !isAdmin) {
      return interaction.reply({ content: '❌ Only the channel owner can lock or unlock this room!', ephemeral: true });
    }

    const currentLock = info.locked;
    const newLock = !currentLock;
    info.locked = newLock;

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        Connect: newLock ? false : null
      });

      db.prepare('UPDATE temp_voice_channels SET locked = ? WHERE channel_id = ?').run(newLock ? 1 : 0, channel.id);

      return interaction.reply({
        content: newLock
          ? '🔒 **Channel Locked!** Other members can no longer join unless invited.'
          : '🔓 **Channel Unlocked!** Anyone in the server can now connect.',
        ephemeral: true
      });
    } catch (err) {
      return interaction.reply({ content: `❌ Failed to update lock status: ${err.message}`, ephemeral: true });
    }
  }

  // 2. 🙈 Toggle Hide / Unhide
  if (customId === 'jtc_toggle_hide') {
    if (!isOwner && !isAdmin) {
      return interaction.reply({ content: '❌ Only the channel owner can hide or unhide this room!', ephemeral: true });
    }

    const currentHide = info.hidden;
    const newHide = !currentHide;
    info.hidden = newHide;

    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
        ViewChannel: newHide ? false : null
      });

      db.prepare('UPDATE temp_voice_channels SET hidden = ? WHERE channel_id = ?').run(newHide ? 1 : 0, channel.id);

      return interaction.reply({
        content: newHide
          ? '🙈 **Channel Hidden!** The room is now invisible to members outside.'
          : '👁️ **Channel Visible!** The room is now visible in the channel list.',
        ephemeral: true
      });
    } catch (err) {
      return interaction.reply({ content: `❌ Failed to update visibility: ${err.message}`, ephemeral: true });
    }
  }

  // 3. 👥 Set User Limit (Modal)
  if (customId === 'jtc_set_limit') {
    if (!isOwner && !isAdmin) {
      return interaction.reply({ content: '❌ Only the channel owner can adjust the user limit!', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_jtc_limit')
      .setTitle('👥 Set Voice Channel User Limit');

    const input = new TextInputBuilder()
      .setCustomId('jtc_limit_input')
      .setLabel('User Limit (0 = Unlimited, Max = 99)')
      .setPlaceholder('Enter a number e.g. 5, 10, or 0')
      .setValue(channel.userLimit ? String(channel.userLimit) : '0')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(2)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // 4. ✏️ Rename (Modal)
  if (customId === 'jtc_rename') {
    if (!isOwner && !isAdmin) {
      return interaction.reply({ content: '❌ Only the channel owner can rename this room!', ephemeral: true });
    }

    const modal = new ModalBuilder()
      .setCustomId('modal_jtc_rename')
      .setTitle('✏️ Rename Your Voice Channel');

    const input = new TextInputBuilder()
      .setCustomId('jtc_name_input')
      .setLabel('New Channel Name')
      .setPlaceholder('e.g. 🔊・Gaming Squad, 🎮・Chilling')
      .setValue(channel.name)
      .setStyle(TextInputStyle.Short)
      .setMaxLength(90)
      .setRequired(true);

    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // 5. 👑 Claim Ownership
  if (customId === 'jtc_claim_owner') {
    const originalOwner = channel.members.get(info.owner_id);
    if (originalOwner && info.owner_id !== interaction.user.id) {
      return interaction.reply({
        content: `❌ The current owner (<@${info.owner_id}>) is still actively inside the voice channel! You cannot claim ownership while they are present.`,
        ephemeral: true
      });
    }

    if (info.owner_id === interaction.user.id) {
      return interaction.reply({ content: '✅ You are already the owner of this voice channel!', ephemeral: true });
    }

    // Transfer ownership
    info.owner_id = interaction.user.id;
    db.prepare('UPDATE temp_voice_channels SET owner_id = ? WHERE channel_id = ?').run(interaction.user.id, channel.id);

    // Give new owner management permissions
    try {
      await channel.permissionOverwrites.edit(interaction.user.id, {
        ManageChannels: true,
        MoveMembers: true,
        MuteMembers: true,
        DeafenMembers: true,
        ViewChannel: true,
        Connect: true,
        Speak: true
      });
    } catch (_) {}

    return interaction.reply({
      content: `🎉 **Ownership Claimed!** You are now the official owner of <#${channel.id}>!`
    });
  }

  // 6. 🗑️ Close & Delete
  if (customId === 'jtc_disconnect_all') {
    if (!isOwner && !isAdmin) {
      return interaction.reply({ content: '❌ Only the channel owner or an admin can delete this channel!', ephemeral: true });
    }

    await interaction.reply({ content: '🛑 Closing channel and disconnecting members in 3 seconds...', ephemeral: true });

    activeTempVoiceChannels.delete(channel.id);
    try {
      db.prepare('DELETE FROM temp_voice_channels WHERE channel_id = ?').run(channel.id);
    } catch (_) {}

    setTimeout(async () => {
      await channel.delete('Deleted by channel owner').catch(() => {});
    }, 3000);
    return true;
  }

  return false;
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. 🚀 AUTO-SETUP & COMMAND HANDLER (/jtc setup, !setjtc)
// ═════════════════════════════════════════════════════════════════════════════
export async function handleJtcSetup(guild, initiatorUser) {
  // 1. Create or find the Category
  let category = guild.channels.cache.find(c => 
    c.type === ChannelType.GuildCategory && 
    (c.name.includes('VOICE') || c.name.includes('Voice') || c.name.includes('DYNAMIC'))
  );

  if (!category) {
    category = await guild.channels.create({
      name: '🔊・VOICE CHANNELS',
      type: ChannelType.GuildCategory
    });
  }

  // 2. Create the Hub channel
  const hubChannel = await guild.channels.create({
    name: '➕・Join to Create',
    type: ChannelType.GuildVoice,
    parent: category.id,
    userLimit: 1, // Hub is limited to 1 so members enter and get moved immediately!
    permissionOverwrites: [
      {
        id: guild.roles.everyone.id,
        type: OverwriteType.Role,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.Connect
        ],
        deny: [
          PermissionFlagsBits.Speak
        ]
      }
    ]
  });

  // 3. Save configuration
  saveJtcConfig(guild.id, hubChannel.id, category.id);

  const setupEmbed = new EmbedBuilder()
    .setColor(0x00FF88)
    .setTitle('🎉 Join-to-Create Voice System Deployed!')
    .setDescription(
      `Your server now has automatic dynamic voice channels enabled!\n\n` +
      `📁 **Category:** **${category.name}**\n` +
      `🎙️ **Hub Channel:** <#${hubChannel.id}> (\`➕・Join to Create\`)\n\n` +
      `**How it works:**\n` +
      `1. Members join <#${hubChannel.id}>.\n` +
      `2. The bot instantly spawns a personal temporary voice channel (e.g. \`🔊・User's VC\`) and moves them inside!\n` +
      `3. The creator gets full control (Lock, Hide, Set Limit, Rename) via the in-channel control panel.\n` +
      `4. When everyone leaves, the room is automatically deleted to keep your server 100% clean! ✨`
    )
    .setFooter({ text: 'Krims Code AI • Dynamic Voice Architecture' })
    .setTimestamp();

  return { embed: setupEmbed, hubChannel, category };
}
