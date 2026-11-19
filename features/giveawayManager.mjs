import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';

// In-memory active giveaways registry
// key: giveawayId (messageId or customId suffix) -> giveaway state object
export const activeGiveaways = new Map();

/**
 * Parses duration string (e.g. '6m', '10m', '1h', '2d', or raw number in minutes)
 */
export function parseDurationToMinutes(rawDur) {
  if (!rawDur) return 10;
  if (typeof rawDur === 'number') return Math.max(1, rawDur);

  const str = String(rawDur).trim().toLowerCase();
  const match = str.match(/^(\d+)\s*([mhd]?)$/);
  if (!match) {
    const num = parseInt(str, 10);
    return isNaN(num) ? 10 : Math.max(1, num);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2] || 'm';

  if (unit === 'h') return value * 60;
  if (unit === 'd') return value * 1440;
  return Math.max(1, value);
}

/**
 * Handle /giveaway slash command
 */
export async function handleGiveawayCommand(interaction) {
  const prize = interaction.options.getString('prize') || 'Discord Reward';
  const rawDur = interaction.options.getString('duration') || '10m';
  const durationMinutes = parseDurationToMinutes(rawDur);

  const durationMs = durationMinutes * 60 * 1000;
  const endTimestamp = Math.floor((Date.now() + durationMs) / 1000);

  const embed = new EmbedBuilder()
    .setColor(0xFFD700)
    .setTitle('🎉 ACTIVE GIVEAWAY!')
    .setDescription(
      `**Prize:** 🎁 **${prize}**\n\n` +
      `• ⏰ **Ends:** <t:${endTimestamp}:R> (<t:${endTimestamp}:f>)\n` +
      `• 👑 **Hosted by:** <@${interaction.user.id}>\n\n` +
      `*Click the button below to enter!*`
    )
    .setFooter({ text: 'Krylo Network Giveaways • 0 Entries' })
    .setTimestamp();

  // Create initial button
  const tempId = `giveaway_${Date.now()}`;
  const enterButton = new ButtonBuilder()
    .setCustomId(`giveaway_enter_${tempId}`)
    .setLabel('🎉 Enter (0)')
    .setStyle(ButtonStyle.Success);

  const row = new ActionRowBuilder().addComponents(enterButton);

  const msg = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

  const giveawayState = {
    id: msg.id,
    tempId: tempId,
    guildId: interaction.guildId,
    channelId: interaction.channelId,
    hostId: interaction.user.id,
    prize: prize,
    endTimestamp: endTimestamp,
    entries: new Set(),
    client: interaction.client,
    timer: null
  };

  // Register under both msg.id and tempId for instant button matching
  activeGiveaways.set(msg.id, giveawayState);
  activeGiveaways.set(tempId, giveawayState);

  // Update button with final msg.id
  const finalBtn = new ButtonBuilder()
    .setCustomId(`giveaway_enter_${msg.id}`)
    .setLabel('🎉 Enter (0)')
    .setStyle(ButtonStyle.Success);
  
  await msg.edit({ components: [new ActionRowBuilder().addComponents(finalBtn)] }).catch(() => {});

  // Schedule automatic giveaway conclusion
  giveawayState.timer = setTimeout(() => {
    endGiveaway(msg.id).catch(err => console.error('[Giveaway Error] Failed to end giveaway:', err));
  }, durationMs);

  return msg;
}

/**
 * Handle button click on giveaway_enter_
 */
export async function handleGiveawayButton(interaction) {
  if (!interaction.isButton() || !interaction.customId.startsWith('giveaway_enter_')) {
    return false;
  }

  const rawId = interaction.customId.replace('giveaway_enter_', '').trim();
  const state = activeGiveaways.get(rawId) || activeGiveaways.get(interaction.message?.id);

  // If state not found in memory (e.g. from an existing older message or after bot restart)
  // Reconstruct state from message embed so the button NEVER fails!
  let targetState = state;
  if (!targetState && interaction.message) {
    const embed = interaction.message.embeds?.[0];
    const prizeMatch = embed?.description?.match(/\*\*Prize:\*\*\s*(?:🎁\s*)?\*\*(.*?)\*\*/i) ||
                       embed?.description?.match(/\*\*Prize:\*\*\s*(.*)/i);
    const prize = prizeMatch ? prizeMatch[1].trim() : 'Mystery Prize';

    targetState = {
      id: interaction.message.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
      hostId: interaction.message.interaction?.user?.id || interaction.user.id,
      prize: prize,
      entries: new Set(),
      client: interaction.client,
      timer: null
    };
    activeGiveaways.set(interaction.message.id, targetState);
    if (rawId) activeGiveaways.set(rawId, targetState);
  }

  const userId = interaction.user.id;
  const alreadyEntered = targetState.entries.has(userId);

  if (alreadyEntered) {
    targetState.entries.delete(userId);
  } else {
    targetState.entries.add(userId);
  }

  const count = targetState.entries.size;

  // Immediate ephemeral confirmation so Discord never times out
  if (alreadyEntered) {
    await interaction.reply({
      content: `❌ You left the giveaway for **${targetState.prize}**.`,
      ephemeral: true
    }).catch(() => {});
  } else {
    await interaction.reply({
      content: `🎉 **You entered the giveaway for ${targetState.prize}!**\nTotal entries: **${count}** 🍀 Good luck!`,
      ephemeral: true
    }).catch(() => {});
  }

  // Update original message button and footer count smoothly
  try {
    const message = interaction.message;
    if (message && message.editable) {
      const origEmbed = message.embeds[0];
      const updatedEmbed = EmbedBuilder.from(origEmbed)
        .setFooter({ text: `Krylo Network Giveaways • ${count} ${count === 1 ? 'Entry' : 'Entries'}` });

      const updatedBtn = new ButtonBuilder()
        .setCustomId(interaction.customId)
        .setLabel(`🎉 Enter (${count})`)
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(updatedBtn);
      await message.edit({ embeds: [updatedEmbed], components: [row] });
    }
  } catch (err) {
    // Non-fatal if message edit is ratelimited
  }

  return true;
}

/**
 * End giveaway and select winner(s)
 */
export async function endGiveaway(giveawayId) {
  const state = activeGiveaways.get(giveawayId);
  if (!state) return;

  activeGiveaways.delete(giveawayId);
  if (state.tempId) activeGiveaways.delete(state.tempId);
  if (state.timer) clearTimeout(state.timer);

  try {
    const channel = state.client.channels.cache.get(state.channelId) || 
                    await state.client.channels.fetch(state.channelId).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(state.id).catch(() => null);

    const participants = Array.from(state.entries);
    const count = participants.length;

    if (count === 0) {
      // No entries
      if (message) {
        const endedEmbed = new EmbedBuilder()
          .setColor(0xFF5555)
          .setTitle('🎉 GIVEAWAY ENDED')
          .setDescription(
            `**Prize:** 🎁 **${state.prize}**\n` +
            `• 👑 **Hosted by:** <@${state.hostId}>\n\n` +
            `😢 **No entries received.** No winner could be selected.`
          )
          .setFooter({ text: 'Krylo Network Giveaways • Ended' })
          .setTimestamp();

        const disabledBtn = new ButtonBuilder()
          .setCustomId(`giveaway_ended_${state.id}`)
          .setLabel('Ended (0 Entries)')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true);

        await message.edit({ embeds: [endedEmbed], components: [new ActionRowBuilder().addComponents(disabledBtn)] }).catch(() => {});
      }

      await channel.send({
        content: `📢 The giveaway for **${state.prize}** ended with 0 entries.`
      }).catch(() => {});
      return;
    }

    // Select random winner
    const winnerId = participants[Math.floor(Math.random() * count)];

    if (message) {
      const winnerEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🎉 GIVEAWAY WINNER ANNOUNCED! 🎉')
        .setDescription(
          `**Prize:** 🎁 **${state.prize}**\n\n` +
          `🏆 **Winner:** <@${winnerId}>\n` +
          `• 👑 **Hosted by:** <@${state.hostId}>\n` +
          `• 👥 **Total Entries:** \`${count}\`\n\n` +
          `*Congratulations to the winner! Contact <@${state.hostId}> to claim your prize!*`
        )
        .setFooter({ text: `Krylo Network Giveaways • Winner Selected (${count} entries)` })
        .setTimestamp();

      const disabledBtn = new ButtonBuilder()
        .setCustomId(`giveaway_ended_${state.id}`)
        .setLabel(`Ended (${count} Entries)`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true);

      await message.edit({ embeds: [winnerEmbed], components: [new ActionRowBuilder().addComponents(disabledBtn)] }).catch(() => {});
    }

    // Ping winner and host
    await channel.send({
      content: `🎉 **GIVEAWAY CONCLUDED!** 🎉\nCongratulations <@${winnerId}>, you won **${state.prize}**! 🎁\n*(Hosted by <@${state.hostId}>)*`
    }).catch(() => {});

  } catch (err) {
    console.error('[Giveaway Error] Error during endGiveaway execution:', err);
  }
}
