import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } from 'discord.js';

export const EMOJI_ARTIST_ROLE_ID = '1552482464641851525';
export const KRYLO_USER_ID = '1414143825538191373';
export const EMOJI_SUBMISSIONS_CHANNEL_ID = '1552482467527790612';

/**
 * Handle new messages in #🎨・𝖾moji-𝗌ubmissions
 */
export async function handleEmojiSubmissionMessage(message) {
  if (!message.guild || message.author.bot) return false;
  if (
    message.channel.id !== EMOJI_SUBMISSIONS_CHANNEL_ID &&
    (!message.channel.name || !message.channel.name.includes('emoji-submissions'))
  ) {
    return false;
  }

  // Check if message has an attachment or image URL
  const hasAttachment = message.attachments && message.attachments.size > 0;
  const content = message.content || '';
  const hasImageUrl = /https?:\/\/.*\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(content) || /cdn\.discordapp\.com/i.test(content);

  if (!hasAttachment && !hasImageUrl) return false;

  try {
    // 1. Auto-react with voting emojis
    await message.react('⭐').catch(() => {});
    await message.react('🔥').catch(() => {});

    // 2. Post an interactive selection panel for Admins/Krylo
    const embed = new EmbedBuilder()
      .setColor(0xFD79A8)
      .setTitle('🎨 New Emoji Submission')
      .setDescription(
        `**Submitted by:** <@${message.author.id}>\n` +
        `**Status:** 🗳️ **Community Voting Open**\n\n` +
        `React with ⭐ to upvote this design! If selected by Krylo, the creator earns the <@&${EMOJI_ARTIST_ROLE_ID}> role.`
      )
      .setFooter({ text: "Krylo's Skybase • Emoji Lab" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`approve_emoji_${message.author.id}_${message.id}`)
        .setLabel('🏆 Select & Grant Artist Role')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎨')
    );

    await message.reply({ embeds: [embed], components: [row] });
    return true;
  } catch (err) {
    console.error('[EmojiSubmission] Error processing message:', err.message);
    return false;
  }
}

/**
 * Handle button interactions for emoji approval
 */
export async function handleEmojiSubmissionInteraction(interaction) {
  if (!interaction.isButton()) return false;
  if (!interaction.customId.startsWith('approve_emoji_')) return false;

  const parts = interaction.customId.split('_');
  const authorId = parts[2];
  const messageId = parts[3];

  // Verify permission: Administrator or Krylo
  const isKrylo = interaction.user.id === KRYLO_USER_ID;
  const isAdmin = interaction.memberPermissions && interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator);

  if (!isKrylo && !isAdmin) {
    await interaction.reply({
      content: '❌ **Permission Denied:** Only **Krylo** and Server Administrators can officially select emojis and award the Artist role.',
      ephemeral: true
    });
    return true;
  }

  await interaction.deferUpdate();

  try {
    const member = await interaction.guild.members.fetch(authorId).catch(() => null);
    if (member) {
      await member.roles.add(EMOJI_ARTIST_ROLE_ID, `Emoji accepted by ${interaction.user.tag}`);
    }

    const approvedEmbed = new EmbedBuilder()
      .setColor(0x00E5FF)
      .setTitle('🎉 OFFICIAL EMOJI APPROVED & SELECTED!')
      .setDescription(
        `✨ **Congratulations <@${authorId}>!**\n\n` +
        `Your custom emoji submission has been officially **selected and approved** by <@${interaction.user.id}>!\n\n` +
        `🏆 **Reward Awarded:** You have been granted the prestigious **<@&${EMOJI_ARTIST_ROLE_ID}>** role!\n` +
        `Thank you for helping create awesome content for **Krylo's Skybase**! 👑`
      )
      .setFooter({ text: `Approved by ${interaction.user.tag} • Krylo's Skybase` })
      .setTimestamp();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('approved_disabled')
        .setLabel('✅ Selected & Role Awarded')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true)
    );

    await interaction.editReply({ embeds: [approvedEmbed], components: [disabledRow] });
    return true;
  } catch (err) {
    console.error('[EmojiSubmission] Approval error:', err);
    await interaction.followUp({
      content: `⚠️ Failed to award role: ${err.message}`,
      ephemeral: true
    });
    return true;
  }
}
