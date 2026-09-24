import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } from 'discord.js';

export const EMOJI_ARTIST_ROLE_ID = '1552482464641851525'; // Static Pic Artist
export const GIF_ANIMATOR_ROLE_ID = '1552483857406754846'; // Animated GIF Animator
export const STICKER_CREATOR_ROLE_ID = '1552798128724516914'; // Custom Sticker Creator
export const KRYLO_USER_ID = '1414143825538191373';
export const EMOJI_SUBMISSIONS_CHANNEL_ID = '1552482467527790612';
export const STICKER_SUBMISSIONS_CHANNEL_ID = '1552799056844300378';
export const ARTIST_LOUNGE_CHANNEL_ID = '1552485336062623876';

/**
 * Handle new messages in #🎨・𝖾moji-𝗌ubmissions and #🏷️・𝗌ticker-𝗌ubmissions
 */
export async function handleEmojiSubmissionMessage(message) {
  if (!message.guild || message.author.bot) return false;

  const isEmojiChannel = message.channel.id === EMOJI_SUBMISSIONS_CHANNEL_ID || (message.channel.name && message.channel.name.includes('emoji-submissions'));
  const isStickerChannel = message.channel.id === STICKER_SUBMISSIONS_CHANNEL_ID || (message.channel.name && message.channel.name.includes('sticker-submissions'));

  if (!isEmojiChannel && !isStickerChannel) {
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

  try {
    // 1. Auto-react with voting emojis
    await message.react('⭐').catch(() => {});
    await message.react('🔥').catch(() => {});

    // 2. Post an interactive selection panel for Admins/Krylo
    let embedTitle = '🎨 New Emoji Submission';
    let formatBadge = '🖼️ **Static Image Emoji**';
    let embedColor = 0xFD79A8;
    const buttons = [];

    if (isStickerChannel) {
      // ── DEDICATED STICKER CHANNEL ──
      embedTitle = '🏷️ New Sticker Submission';
      formatBadge = '🏷️ **Custom Server Sticker (320×320)**';
      embedColor = 0xFDCB6E;

      buttons.push(
        new ButtonBuilder()
          .setCustomId(`approve_emoji_${message.author.id}_${message.id}_sticker`)
          .setLabel('🏆 Select & Grant Sticker Creator Role')
          .setStyle(ButtonStyle.Success)
          .setEmoji('🏷️')
      );
    } else {
      // ── DEDICATED EMOJI CHANNEL ──
      const isGif = /gif/i.test(content) ||
                    /tenor\.com/i.test(content) ||
                    /giphy\.com/i.test(content) ||
                    (hasAttachment && message.attachments.some(a => a.contentType?.includes('gif') || a.name?.toLowerCase().endsWith('.gif')));

      if (isGif) {
        embedTitle = '🎞️ New Animated GIF Submission';
        formatBadge = '🎞️ **Animated GIF Emoji**';
        embedColor = 0xA29BFE;

        buttons.push(
          new ButtonBuilder()
            .setCustomId(`approve_emoji_${message.author.id}_${message.id}_gif`)
            .setLabel('🏆 Select & Grant GIF Animator Role')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎞️')
        );
      } else {
        embedTitle = '🎨 New Emoji Submission';
        formatBadge = '🖼️ **Static Image Emoji**';
        embedColor = 0xFD79A8;

        buttons.push(
          new ButtonBuilder()
            .setCustomId(`approve_emoji_${message.author.id}_${message.id}_pic`)
            .setLabel('🏆 Select & Grant Artist Role')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎨')
        );
      }
    }

    const embed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(embedTitle)
      .setDescription(
        `**Submitted by:** <@${message.author.id}>\n` +
        `**Format:** ${formatBadge}\n` +
        `**Status:** 🗳️ **Community Voting Open**\n\n` +
        `React with ⭐ to upvote! Selections are **100% skill-based** (never rigged).\n` +
        `⚠️ **Rule:** Max 1–2 submissions per 1–2 weeks (spammed entries will not be reviewed).\n\n` +
        `If selected by Krylo, the creator earns an exclusive permanent creator role and unlocks VIP access to <#${ARTIST_LOUNGE_CHANNEL_ID}>!`
      )
      .setFooter({ text: "Krylo's Skybase • Creative Lab" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(buttons);

    await message.reply({ embeds: [embed], components: [row] });
    return true;
  } catch (err) {
    console.error('[EmojiSubmission] Error processing message:', err.message);
    return false;
  }
}

/**
 * Handle button interactions for emoji and sticker approval
 */
export async function handleEmojiSubmissionInteraction(interaction) {
  if (!interaction.isButton()) return false;
  if (!interaction.customId.startsWith('approve_emoji_')) return false;

  const parts = interaction.customId.split('_');
  const authorId = parts[2];
  const messageId = parts[3];
  const type = parts[4] || 'pic';
  const isGif = type === 'gif';
  const isSticker = type === 'sticker';

  let roleId = EMOJI_ARTIST_ROLE_ID;
  let roleTitle = '🎨 Skybase Emoji Artist';
  let embedTitle = '🎉 OFFICIAL EMOJI APPROVED & SELECTED!';
  let embedColor = 0x00E5FF;
  let buttonLabel = '✅ Selected & Emoji Artist Role Awarded';

  if (isGif) {
    roleId = GIF_ANIMATOR_ROLE_ID;
    roleTitle = '🎞️ Skybase GIF Animator';
    embedTitle = '🎉 OFFICIAL ANIMATED GIF APPROVED & SELECTED!';
    embedColor = 0xA29BFE;
    buttonLabel = '✅ Selected & GIF Animator Role Awarded';
  } else if (isSticker) {
    roleId = STICKER_CREATOR_ROLE_ID;
    roleTitle = '🏷️ Skybase Sticker Creator';
    embedTitle = '🎉 OFFICIAL STICKER APPROVED & SELECTED!';
    embedColor = 0xFDCB6E;
    buttonLabel = '✅ Selected & Sticker Creator Role Awarded';
  }

  // Verify permission: Administrator or Krylo
  const isKrylo = interaction.user.id === KRYLO_USER_ID;
  const isAdmin = interaction.memberPermissions && interaction.memberPermissions.has(PermissionsBitField.Flags.Administrator);

  if (!isKrylo && !isAdmin) {
    await interaction.reply({
      content: '❌ **Permission Denied:** Only **Krylo** and Server Administrators can officially select creations and award creator roles.',
      ephemeral: true
    });
    return true;
  }

  await interaction.deferUpdate();

  try {
    const member = await interaction.guild.members.fetch(authorId).catch(() => null);
    if (member) {
      await member.roles.add(roleId, `${roleTitle} accepted by ${interaction.user.tag}`);
    }

    const creationType = isGif ? 'animated GIF' : (isSticker ? 'custom sticker' : 'custom emoji');

    const approvedEmbed = new EmbedBuilder()
      .setColor(embedColor)
      .setTitle(embedTitle)
      .setDescription(
        `✨ **Congratulations <@${authorId}>!**\n\n` +
        `Your ${creationType} submission has been officially **selected and approved** by <@${interaction.user.id}> based on design skill and polish!\n\n` +
        `🏆 **Permanent Reward:** You have been granted the prestigious **<@&${roleId}>** role!\n` +
        `🚪 **VIP Studio Access:** You now have access to <#${ARTIST_LOUNGE_CHANNEL_ID}> where you can talk, share ideas, and collaborate with fellow creators and Krylo!\n\n` +
        `Even if slots rotate in the future to make room for newer updates, this role and lounge access are **yours forever** as verified recognition for helping build Krylo's Skybase! 👑`
      )
      .setFooter({ text: `Approved by ${interaction.user.tag} • Krylo's Skybase` })
      .setTimestamp();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('approved_disabled')
        .setLabel(buttonLabel)
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
