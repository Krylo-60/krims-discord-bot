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
      description: 'Post the interactive notification preferences card in #🏷️・roles',
      type: ApplicationCommandOptionType.Subcommand
    },
    {
      name: 'toggle',
      description: 'Quickly toggle your SMP Pings role on or off',
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
      'Welcome Operatives! Choose your alert preferences below to stay in the loop without unwanted `@everyone` notifications.\n\n' +
      '🔔 **SMP Pings** — Get pinged when teammates call for SMP gaming, trading, and team-ups.\n' +
      '⚔️ **War & Raid Alerts** — Combat alerts, base defense, and counter-raids.\n' +
      '📢 **Clan Announcements** — Major clan milestones, roster announcements, and server changes.\n' +
      '🎮 **Squad Game Nights** — Casual minigames, tournament brackets, and voice hangouts.\n\n' +
      '🔕 **Mute All Pings** — Remove all optional ping roles for quiet mode.\n\n' +
      '*Click any button below to toggle your roles on or off anytime!*'
    )
    .setFooter({ text: 'The Half Lifes • Clan Notification Manager • Krims Code Enterprise' })
    .setTimestamp();
}

export function buildPingRolesActionRows() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_ping_smp')
      .setLabel('SMP Pings')
      .setEmoji('🔔')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('btn_ping_raid')
      .setLabel('Raid Alerts')
      .setEmoji('⚔️')
      .setStyle(ButtonStyle.Primary),
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

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_ping_mute_all')
      .setLabel('Mute All Optional Pings')
      .setEmoji('🔕')
      .setStyle(ButtonStyle.Danger)
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
        content: `✅ Notification Preferences panel successfully posted in ${targetChannel}!`,
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
    return await toggleRoleOnMember(interaction, ROLE_IDS.SMP_PINGS, '🔔・SMP Pings');
  }
}

/**
 * Handles button interactions for the ping role cards
 */
export async function handlePingRoleButton(interaction) {
  const { customId, member, guild } = interaction;

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

  if (customId === 'btn_ping_mute_all') {
    try {
      const rolesToRemove = [
        ROLE_IDS.SMP_PINGS,
        ROLE_IDS.RAID_ALERTS,
        ROLE_IDS.ANNOUNCEMENTS,
        ROLE_IDS.GAME_NIGHTS
      ].filter(id => member.roles.cache.has(id));

      if (rolesToRemove.length === 0) {
        return interaction.reply({
          content: '🔕 You already have all optional notification roles disabled. You are in quiet mode!',
          ephemeral: true
        });
      }

      await member.roles.remove(rolesToRemove, 'User requested mute all optional pings');
      return interaction.reply({
        content: '🔕 **Quiet Mode Active!** Removed all optional ping roles. You will no longer receive casual or team pings.',
        ephemeral: true
      });
    } catch (err) {
      return interaction.reply({
        content: `❌ Could not remove roles: ${err.message}`,
        ephemeral: true
      });
    }
  }
}

async function toggleRoleOnMember(interaction, roleId, roleName) {
  const { member, guild } = interaction;
  try {
    let role = guild.roles.cache.get(roleId) || await guild.roles.fetch(roleId).catch(() => null);

    if (!role) {
      // Auto-fallback: search by name
      role = guild.roles.cache.find(r => r.name.toLowerCase().includes(roleName.toLowerCase().replace(/[^a-z0-9]/g, '')));
    }

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
      await member.roles.add(role, 'User toggled notification role on');
      return interaction.reply({
        content: `🔔 Added **${role.name}**! You will now be notified when the team pings this role.`,
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
