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

  // Check if message has an attachment, image URL, Tenor/Giphy GIF, or embed
  const hasAttachment = message.attachments && message.attachments.size > 0;
  const content = message.content || '';
  const hasImageUrl = /https?:\/\/.*\.(png|jpg|jpeg|gif|webp)(\?.*)?$/i.test(content) ||
                      /cdn\.discordapp\.com/i.test(content) ||
                      /tenor\.com/i.test(content) ||
                      /giphy\.com/i.test(content);
  const hasEmbedMedia = message.embeds && message.embeds.some(e => e.image || e.video || e.thumbnail);

  if (!hasAttachment && !hasImageUrl && !hasEmbedMedia) return false;

  // Detect whether it's an animated GIF or static image
  const isGif = /gif/i.test(content) ||
                /tenor\.com/i.test(content) ||
                /giphy\.com/i.test(content) ||
                (hasAttachment && message.attachments.some(a => a.contentType?.includes('gif') || a.name?.toLowerCase().endsWith('.gif')));

  const formatBadge = isGif ? '🎞️ **Animated GIF Emoji**' : '🖼️ **Static Image Emoji**';

  try {
    // 1. Auto-react with voting emojis
    await message.react('⭐').catch(() => {});
    await message.react('🔥').catch(() => {});

    // 2. Post an interactive selection panel for Admins/Krylo
    const embed = new EmbedBuilder()
      .setColor(isGif ? 0xA29BFE : 0xFD79A8)
      .setTitle(isGif ? '🎞️ New Animated GIF Emoji Submission' : '🎨 New Emoji Submission')
      .setDescription(
        `**Submitted by:** <@${message.author.id}>\n` +
        `**Format:** ${formatBadge}\n` +
        `**Status:** 🗳️ **Community Voting Open**\n\n` +
        `React with ⭐ to upvote! Selections are **100% skill-based** (never rigged). If selected by Krylo, the creator earns the permanent <@&${EMOJI_ARTIST_ROLE_ID}> role!`
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
        `Your custom emoji submission has been officially **selected and approved** by <@${interaction.user.id}> based on design skill and quality!\n\n` +
        `🏆 **Permanent Reward:** You have been granted the prestigious **<@&${EMOJI_ARTIST_ROLE_ID}>** role!\n` +
        `Even if emoji slots rotate in the future to make room for newer updates, this role is **yours forever** as verified recognition for helping build Krylo's Skybase! 👑`
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
