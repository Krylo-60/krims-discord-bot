import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits,
  ApplicationCommandOptionType 
} from 'discord.js';

export const HALF_LIFES_GUILD_ID = '1557852594242719775';
export const HALF_LIFES_ROLES_CHANNEL_ID = '1559251032465219587';

export const ROLE_IDS = {
  ALL_PINGS: '1564743693871747082',
  NO_PINGS: '1564743695847129229',
  SMP_PINGS: '1564741897862258908',
  RAID_ALERTS: '1557877145051856989',
  ANNOUNCEMENTS: '1557877146775720087',
  GAME_NIGHTS: '1557877148029558975'
};

export const HALF_LIFES_PING_COMMAND_DEF = {
  name: 'pingroles',
  description: 'Manage clan notification & ping preference roles (The Half Lifes Only)',
  options: [
    {
      name: 'setup',
      description: 'Post or refresh the interactive notification preferences card in #🏷️・roles',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'toggle',
      description: 'Quickly toggle your All Pings role on or off',
      type: ApplicationCommandOptionType.Subcommand
    }
  ]
};

export function buildPingRolesEmbed(guildIconUrl) {
  return new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle('⚔️ THE HALF LIFES • PING & NOTIFICATION PREFERENCES')
    .setThumbnail(guildIconUrl || null)
    .setDescription(
      'Welcome Operatives! Choose your alert preferences below to stay in the loop without unwanted `@everyone` pings.\n\n' +
      '🟢 **All Pings** (`@🔔・All Pings`) — Opt-in to all clan notifications! You will be pinged when anyone calls for the team.\n' +
      '🔴 **No Pings** (`@𝔕・No Pings`) — Opt-out of all casual pings! You will never receive team or casual pings.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '**Specific Notification Categories:**\n' +
      '🔔 **SMP Pings** — Teammates hopping on the SMP, sharing loot, or calling for team-ups.\n' +
      '⚔️ **Raid Alerts** — Urgent combat alerts, base defense, and counter-raids.\n' +
      '📢 **Announcements** — Major clan milestones, roster announcements, and server changes.\n' +
      '🎮 **Game Nights** — Minigames, events, and voice hangouts.\n\n' +
      '*Click the buttons below to set or toggle your roles anytime!*'
    )
    .setFooter({ text: 'The Half Lifes • Clan Notification Manager • Krims Code Enterprise' })
    .setTimestamp();
}

export function buildPingRolesActionRows() {
  // Row 1: Primary All Pings vs No Pings
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_ping_all')
      .setLabel('All Pings')
      .setEmoji('🔔')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_ping_none')
      .setLabel('No Pings')
      .setEmoji('🔕')
      .setStyle(ButtonStyle.Danger)
  );

  // Row 2: Granular categories
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_ping_smp')
      .setLabel('SMP Pings')
      .setEmoji('⚔️')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('btn_ping_raid')
      .setLabel('Raid Alerts')
      .setEmoji('🛡️')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_ping_announcement')
      .setLabel('Announcements')
      .setEmoji('📢')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('btn_ping_games')
      .setLabel('Game Nights')
      .setEmoji('🎮')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}

/**
 * Handles guild-specific /pingroles slash command
 */
export async function handlePingRolesSlashCommand(interaction) {
  if (interaction.guildId !== HALF_LIFES_GUILD_ID) {
    return interaction.reply({
      content: '❌ This command is exclusively configured for **The Half Lifes** server.',
      ephemeral: true
    });
  }

  const sub = interaction.options.getSubcommand();

  if (sub === 'setup') {
    // Check permission (Admin, Co-Leader, or Owner)
    const isOwner = interaction.user.id === '1414143825538191373';
    const isAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) ||
                    interaction.member?.roles.cache.some(r => r.name.toLowerCase().includes('leader') || r.name.toLowerCase().includes('admin'));

    if (!isOwner && !isAdmin) {
      return interaction.reply({
        content: '❌ You must be a Team Leader or Administrator to post the Notification Preferences panel.',
        ephemeral: true
      });
    }

    try {
      const targetChannel = interaction.guild.channels.cache.get(HALF_LIFES_ROLES_CHANNEL_ID) || 
                            await interaction.guild.channels.fetch(HALF_LIFES_ROLES_CHANNEL_ID).catch(() => null) ||
                            interaction.channel;

      const embed = buildPingRolesEmbed(interaction.guild.iconURL());
      const components = buildPingRolesActionRows();

      await targetChannel.send({ embeds: [embed], components });

      return interaction.reply({
        content: `✅ Notification Preferences panel (with **All Pings** & **No Pings**) successfully posted in ${targetChannel}!`,
        ephemeral: true
      });
    } catch (err) {
      return interaction.reply({
        content: `❌ Failed to post panel: ${err.message}`,
        ephemeral: true
      });
    }
  }

  if (sub === 'toggle') {
    return await toggleRoleOnMember(interaction, ROLE_IDS.ALL_PINGS, '🔔・All Pings');
  }
}

/**
 * Handles button interactions for the ping role cards
 */
export async function handlePingRoleButton(interaction) {
  const { customId, member, guild } = interaction;

  // 1. All Pings Button
  if (customId === 'btn_ping_all') {
    try {
      const allRole = await getOrFetchRole(guild, ROLE_IDS.ALL_PINGS, '🔔・All Pings');
      const noRole = await getOrFetchRole(guild, ROLE_IDS.NO_PINGS, '🔕・No Pings');

      if (!allRole) {
        return interaction.reply({ content: '❌ Could not find the **All Pings** role.', ephemeral: true });
      }

      const toAdd = [allRole.id];
      const toRemove = [];

      if (noRole && member.roles.cache.has(noRole.id)) {
        toRemove.push(noRole.id);
      }

      // Also add category roles
      for (const catId of [ROLE_IDS.SMP_PINGS, ROLE_IDS.RAID_ALERTS, ROLE_IDS.ANNOUNCEMENTS, ROLE_IDS.GAME_NIGHTS]) {
        if (!member.roles.cache.has(catId) && guild.roles.cache.has(catId)) {
          toAdd.push(catId);
        }
      }

      if (toRemove.length > 0) await member.roles.remove(toRemove, 'Opted into All Pings');
      await member.roles.add(toAdd, 'Opted into All Pings');

      return interaction.reply({
        content: '🔔 **All Pings Enabled!** You now have the **@🔔・All Pings** role. You will be notified whenever someone pings the clan!',
        ephemeral: true
      });
    } catch (err) {
      return interaction.reply({ content: `❌ Error updating roles: ${err.message}`, ephemeral: true });
    }
  }

  // 2. No Pings Button
  if (customId === 'btn_ping_none') {
    try {
      const noRole = await getOrFetchRole(guild, ROLE_IDS.NO_PINGS, '🔕・No Pings');
      const allRole = await getOrFetchRole(guild, ROLE_IDS.ALL_PINGS, '🔔・All Pings');

      if (!noRole) {
        return interaction.reply({ content: '❌ Could not find the **No Pings** role.', ephemeral: true });
      }

      const rolesToRemove = [
        ROLE_IDS.ALL_PINGS,
        ROLE_IDS.SMP_PINGS,
        ROLE_IDS.RAID_ALERTS,
        ROLE_IDS.ANNOUNCEMENTS,
        ROLE_IDS.GAME_NIGHTS
      ].filter(id => member.roles.cache.has(id));

      if (rolesToRemove.length > 0) {
        await member.roles.remove(rolesToRemove, 'Opted into No Pings');
      }
      if (!member.roles.cache.has(noRole.id)) {
        await member.roles.add(noRole.id, 'Opted into No Pings');
      }

      return interaction.reply({
        content: '🔕 **No Pings Enabled!** You now have the **@𝔕・No Pings** role and all notification roles were removed. You will not be disturbed!',
        ephemeral: true
      });
    } catch (err) {
      return interaction.reply({ content: `❌ Error updating roles: ${err.message}`, ephemeral: true });
    }
  }

  // 3. Category Buttons
  if (customId === 'btn_ping_smp') {
    return await toggleRoleOnMember(interaction, ROLE_IDS.SMP_PINGS, '🔔・SMP Pings');
  }

  if (customId === 'btn_ping_raid') {
    return await toggleRoleOnMember(interaction, ROLE_IDS.RAID_ALERTS, '⚔️ War & Raid Alerts');
  }

  if (customId === 'btn_ping_announcement') {
    return await toggleRoleOnMember(interaction, ROLE_IDS.ANNOUNCEMENTS, '📢 Clan Announcement Pings');
  }

  if (customId === 'btn_ping_games') {
    return await toggleRoleOnMember(interaction, ROLE_IDS.GAME_NIGHTS, '🎮 Squad Game Nights');
  }
}

async function getOrFetchRole(guild, roleId, fallbackName) {
  let role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);
  if (!role && fallbackName) {
    const cleanFallback = fallbackName.toLowerCase().replace(/[^a-z0-9]/g, '');
    role = guild.roles.cache.find(r => r.name.toLowerCase().replace(/[^a-z0-9]/g, '').includes(cleanFallback));
  }
  return role;
}

async function toggleRoleOnMember(interaction, roleId, roleName) {
  const { member, guild } = interaction;
  try {
    const role = await getOrFetchRole(guild, roleId, roleName);

    if (!role) {
      return interaction.reply({
        content: `❌ Role **${roleName}** could not be found. Please contact an admin!`,
        ephemeral: true
      });
    }

    if (member.roles.cache.has(role.id)) {
      await member.roles.remove(role, 'User toggled notification role off');
      return interaction.reply({
        content: `🔕 Removed **${role.name}**. You will no longer be pinged for this category.`,
        ephemeral: true
      });
    } else {
      // If adding a ping category, remove the No Pings role if present
      if (member.roles.cache.has(ROLE_IDS.NO_PINGS)) {
        await member.roles.remove(ROLE_IDS.NO_PINGS, 'User enabled a ping category').catch(() => {});
      }
      await member.roles.add(role, 'User toggled notification role on');
      return interaction.reply({
        content: `🔔 Added **${role.name}**! You will now be notified when the team pings this category.`,
        ephemeral: true
      });
    }
  } catch (err) {
    return interaction.reply({
      content: `❌ Failed to update role: ${err.message}`,
      ephemeral: true
    });
  }
}
