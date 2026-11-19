import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} from 'discord.js';
import { db, getBalance, transferRewards } from '../databaseEngine.mjs';

// Initialize pending_trades table
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS pending_trades (
      trade_id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      recipient_id TEXT NOT NULL,
      trade_type TEXT NOT NULL DEFAULT 'kr',
      amount INTEGER DEFAULT 0,
      item_offered TEXT,
      item_wanted TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      guild_id TEXT,
      channel_id TEXT,
      message_id TEXT,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    )
  `).run();
} catch (e) {
  console.error('[TradeSystem] Failed to initialize pending_trades table:', e);
}

// In-memory cache for fast lookups
const pendingTradesCache = new Map();
const TRADE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Generate a unique trade ID
 */
function generateTradeId() {
  return `tr_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
}

/**
 * Save pending trade to memory cache and SQLite
 */
function savePendingTrade(trade) {
  pendingTradesCache.set(trade.trade_id, trade);
  try {
    db.prepare(`
      INSERT OR REPLACE INTO pending_trades (
        trade_id, sender_id, recipient_id, trade_type, amount, item_offered, item_wanted,
        status, guild_id, channel_id, message_id, created_at, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      trade.trade_id,
      trade.sender_id,
      trade.recipient_id,
      trade.trade_type || 'kr',
      trade.amount || 0,
      trade.item_offered || null,
      trade.item_wanted || null,
      trade.status || 'pending',
      trade.guild_id || null,
      trade.channel_id || null,
      trade.message_id || null,
      trade.created_at,
      trade.expires_at
    );
  } catch (err) {
    console.error('[TradeSystem] Error saving pending trade to SQLite:', err);
  }
}

/**
 * Fetch a pending trade by ID from cache or SQLite
 */
export function getPendingTrade(tradeId) {
  if (pendingTradesCache.has(tradeId)) {
    return pendingTradesCache.get(tradeId);
  }
  try {
    const row = db.prepare('SELECT * FROM pending_trades WHERE trade_id = ?').get(tradeId);
    if (row) {
      pendingTradesCache.set(row.trade_id, row);
      return row;
    }
  } catch (err) {
    console.error('[TradeSystem] Error loading pending trade from SQLite:', err);
  }
  return null;
}

/**
 * Update trade status
 */
function updateTradeStatus(tradeId, status) {
  const trade = getPendingTrade(tradeId);
  if (trade) {
    trade.status = status;
    pendingTradesCache.set(tradeId, trade);
  }
  try {
    db.prepare('UPDATE pending_trades SET status = ? WHERE trade_id = ?').run(status, tradeId);
  } catch (err) {
    console.error('[TradeSystem] Error updating trade status in SQLite:', err);
  }
}

/**
 * Create a KR Trade Proposal Embed and ActionRow
 */
export function buildKrTradeProposalPayload({ tradeId, senderId, recipientId, amount, itemWanted, expiresAt }) {
  const expiryTimestamp = Math.floor(expiresAt / 1000);

  const embed = new EmbedBuilder()
    .setTitle('🤝 SECURE KRIMS TRADE PROPOSAL')
    .setColor(0x9B59B6) // Royal Purple
    .setDescription(
      `Hey <@${recipientId}>, you have received a secure Krims Rewards (KR) trade offer from <@${senderId}>!\n\n` +
      `🪙 **Krims Rewards Offered:** \`\`\`fix\n+${amount.toLocaleString()} KR\n\`\`\`\n` +
      (itemWanted 
        ? `📦 **Requested In Exchange:**\n> **${itemWanted}**\n\n` 
        : `📦 **Exchange Type:**\n> **Direct Coin Transfer / In-Game Exchange**\n\n`) +
      `⏱️ **Expires:** <t:${expiryTimestamp}:R> (<t:${expiryTimestamp}:T>)\n` +
      `🛡️ **Krims Escrow Protection:** Funds will be automatically validated and transferred upon acceptance.`
    )
    .addFields(
      { name: '👤 Sender', value: `<@${senderId}>`, inline: true },
      { name: '👤 Recipient', value: `<@${recipientId}>`, inline: true },
      { name: '💰 Amount', value: `**${amount.toLocaleString()} KR**`, inline: true }
    )
    .setFooter({ text: 'Krims Code AI • Secure Multi-Bot Trade Ledger • ID: ' + tradeId })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`trade_kr_accept_${tradeId}`)
      .setLabel(`Accept (${amount.toLocaleString()} KR)`)
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
    new ButtonBuilder()
      .setCustomId(`trade_kr_cancel_${tradeId}`)
      .setLabel('Decline / Cancel')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('❌')
  );

  return {
    content: `🔔 <@${recipientId}>, incoming trade offer from <@${senderId}>!`,
    embeds: [embed],
    components: [row]
  };
}

/**
 * Handle /trade Slash Command (both /trade kr and /trade item)
 */
export async function handleTradeSlashCommand(interaction) {
  try {
    let subcommand = null;
    try {
      subcommand = interaction.options?.getSubcommand(false);
    } catch (_) {}

    // Default to 'kr' if subcommand is 'kr' or if user specified amount
    const isKrTrade = subcommand === 'kr' || (!subcommand && interaction.options?.getInteger('amount'));

    if (isKrTrade) {
      const recipient = interaction.options?.getUser('user') || interaction.options?.getUser('player');
      const amount = interaction.options?.getInteger('amount');
      const itemWanted = interaction.options?.getString('item') || interaction.options?.getString('for') || interaction.options?.getString('offer') || null;

      if (!recipient) {
        return interaction.reply({ content: '❌ You must specify a user to trade with!', ephemeral: true });
      }

      if (recipient.id === interaction.user.id) {
        return interaction.reply({ content: '❌ You cannot trade with yourself.', ephemeral: true });
      }

      if (recipient.bot) {
        return interaction.reply({ content: '❌ You cannot trade Krims Rewards with bot accounts.', ephemeral: true });
      }

      if (!amount || amount <= 0 || !Number.isInteger(amount)) {
        return interaction.reply({ content: '❌ Trade amount must be a positive whole number of KR (min 1).', ephemeral: true });
      }

      // Check sender balance
      const senderBal = getBalance(interaction.user.id);
      const userCoins = senderBal?.krylocoins ?? 0;
      if (userCoins < amount) {
        return interaction.reply({ 
          content: `❌ **Insufficient Funds!** Your vault contains **${userCoins.toLocaleString()} KR**, but you offered **${amount.toLocaleString()} KR**.`, 
          ephemeral: true 
        });
      }

      const tradeId = generateTradeId();
      const expiresAt = Date.now() + TRADE_EXPIRATION_MS;

      const trade = {
        trade_id: tradeId,
        sender_id: interaction.user.id,
        recipient_id: recipient.id,
        trade_type: 'kr',
        amount,
        item_offered: null,
        item_wanted: itemWanted,
        status: 'pending',
        guild_id: interaction.guildId,
        channel_id: interaction.channelId,
        message_id: null,
        created_at: Date.now(),
        expires_at: expiresAt
      };

      savePendingTrade(trade);

      const payload = buildKrTradeProposalPayload({
        tradeId,
        senderId: interaction.user.id,
        recipientId: recipient.id,
        amount,
        itemWanted,
        expiresAt
      });

      return await interaction.reply(payload);
    }

    // Generic item trade proposal (/trade item)
    const player = interaction.options?.getUser('player') || interaction.options?.getUser('user');
    const offer = interaction.options?.getString('offer');
    const forItem = interaction.options?.getString('for') || null;

    if (!player) {
      return interaction.reply({ content: '❌ You must specify a player to trade with.', ephemeral: true });
    }

    if (player.id === interaction.user.id) {
      return interaction.reply({ content: '❌ You cannot trade with yourself.', ephemeral: true });
    }

    if (player.bot) {
      return interaction.reply({ content: '❌ You cannot trade with bot accounts.', ephemeral: true });
    }

    if (!offer) {
      return interaction.reply({ content: '❌ Please specify what you are offering in the trade.', ephemeral: true });
    }

    const tradeId = generateTradeId();
    const expiresAt = Date.now() + TRADE_EXPIRATION_MS;

    const trade = {
      trade_id: tradeId,
      sender_id: interaction.user.id,
      recipient_id: player.id,
      trade_type: 'item',
      amount: 0,
      item_offered: offer,
      item_wanted: forItem,
      status: 'pending',
      guild_id: interaction.guildId,
      channel_id: interaction.channelId,
      message_id: null,
      created_at: Date.now(),
      expires_at: expiresAt
    };

    savePendingTrade(trade);

    const embed = new EmbedBuilder()
      .setTitle('🤝 ITEM TRADE OFFER')
      .setColor(0x5865F2)
      .setDescription(
        `<@${player.id}>, you received a trade offer from <@${interaction.user.id}>!\n\n` +
        `📦 **Offering:**\n> ${offer}\n\n` +
        (forItem ? `🎯 **Requesting In Return:**\n> ${forItem}\n\n` : '') +
        `⏱️ **Expires:** <t:${Math.floor(expiresAt / 1000)}:R>`
      )
      .setFooter({ text: 'Accept or Decline below • ID: ' + tradeId })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`trade_kr_accept_${tradeId}`)
        .setLabel('Accept')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId(`trade_kr_cancel_${tradeId}`)
        .setLabel('Decline')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('❌')
    );

    return await interaction.reply({ content: `<@${player.id}>`, embeds: [embed], components: [row] });
  } catch (err) {
    console.error('[TradeSystem] Error in handleTradeSlashCommand:', err);
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({ content: `⚠️ Trade error: ${err.message}`, ephemeral: true }).catch(() => {});
    }
  }
}

/**
 * Handle Trade Button Interactions (Accept / Cancel / Decline)
 */
export async function handleTradeButtonInteraction(interaction) {
  const customId = interaction.customId;

  // 1. Modern KR/Item Trade Buttons
  if (customId.startsWith('trade_kr_accept_') || customId.startsWith('trade_kr_cancel_')) {
    const isAccept = customId.startsWith('trade_kr_accept_');
    const tradeId = customId.replace('trade_kr_accept_', '').replace('trade_kr_cancel_', '');

    const trade = getPendingTrade(tradeId);
    if (!trade || trade.status !== 'pending') {
      return interaction.reply({
        content: '⚠️ **Trade Inactive:** This trade proposal has expired, already concluded, or was cancelled.',
        ephemeral: true
      });
    }

    if (Date.now() > trade.expires_at) {
      updateTradeStatus(tradeId, 'expired');
      const expiredEmbed = new EmbedBuilder()
        .setTitle('⌛ TRADE EXPIRED')
        .setColor(0x95A5A6)
        .setDescription(`This trade proposal of **${trade.amount ? trade.amount.toLocaleString() + ' KR' : 'items'}** between <@${trade.sender_id}> and <@${trade.recipient_id}> has expired.`)
        .setTimestamp();

      return interaction.update({
        content: '⌛ **Trade Proposal Expired**',
        embeds: [expiredEmbed],
        components: []
      });
    }

    // Cancel / Decline Handler
    if (!isAccept) {
      if (interaction.user.id !== trade.sender_id && interaction.user.id !== trade.recipient_id) {
        return interaction.reply({
          content: '❌ Only the sender or recipient can cancel or decline this trade offer.',
          ephemeral: true
        });
      }

      updateTradeStatus(tradeId, 'cancelled');

      const isSender = interaction.user.id === trade.sender_id;
      const cancelEmbed = new EmbedBuilder()
        .setTitle('❌ TRADE CANCELLED')
        .setColor(0xE74C3C)
        .setDescription(
          `The trade proposal between <@${trade.sender_id}> and <@${trade.recipient_id}> was **${isSender ? 'cancelled by the sender' : 'declined by the recipient'}** (<@${interaction.user.id}>).\n\n` +
          `No funds or items were exchanged.`
        )
        .setTimestamp();

      return interaction.update({
        content: `❌ **Trade ${isSender ? 'Cancelled' : 'Declined'}**`,
        embeds: [cancelEmbed],
        components: []
      });
    }

    // Accept Handler - ONLY Recipient can accept
    if (interaction.user.id !== trade.recipient_id) {
      return interaction.reply({
        content: `❌ Only <@${trade.recipient_id}> can accept this trade proposal!`,
        ephemeral: true
      });
    }

    // Handle KR Trade Execution
    if (trade.trade_type === 'kr' && trade.amount > 0) {
      // Re-verify sender balance at time of acceptance
      const senderBal = getBalance(trade.sender_id);
      const curSenderCoins = senderBal?.krylocoins ?? 0;

      if (curSenderCoins < trade.amount) {
        updateTradeStatus(tradeId, 'failed_funds');
        const failEmbed = new EmbedBuilder()
          .setTitle('❌ TRADE FAILED — INSUFFICIENT FUNDS')
          .setColor(0xE74C3C)
          .setDescription(
            `⚠️ The trade could not be completed because <@${trade.sender_id}> no longer has enough Krims Rewards (KR).\n\n` +
            `• Required: **${trade.amount.toLocaleString()} KR**\n` +
            `• Available: **${curSenderCoins.toLocaleString()} KR**`
          )
          .setTimestamp();

        return interaction.update({
          content: '❌ **Trade Failed**',
          embeds: [failEmbed],
          components: []
        });
      }

      try {
        const transferRes = transferRewards(
          trade.sender_id,
          trade.recipient_id,
          trade.amount,
          trade.item_wanted ? `Trade for: ${trade.item_wanted}` : 'Secure KR Trade'
        );

        updateTradeStatus(tradeId, 'completed');

        const successEmbed = new EmbedBuilder()
          .setTitle('🎉 TRADE COMPLETED SUCCESSFULLY!')
          .setColor(0x2ECC71) // Emerald Green
          .setDescription(
            `✅ **The trade between <@${trade.sender_id}> and <@${trade.recipient_id}> has been finalized!**\n\n` +
            `🪙 **Transferred:** \`+${trade.amount.toLocaleString()} KR\` from <@${trade.sender_id}> ➔ <@${trade.recipient_id}>\n` +
            (trade.item_wanted ? `📦 **Agreed In Exchange:**\n> **${trade.item_wanted}**\n\n` : '\n') +
            `📊 **Updated Vault Balances:**\n` +
            `• <@${trade.sender_id}>: \`${transferRes.senderNewBalance.toLocaleString()} KR\`\n` +
            `• <@${trade.recipient_id}>: \`${transferRes.recipientNewBalance.toLocaleString()} KR\`\n\n` +
            `🛡️ *Transaction securely executed on Krims Ledger and synchronized with Cloud.*`
          )
          .setFooter({ text: 'Krims Code AI • Multi-Bot Economy Engine • ID: ' + tradeId })
          .setTimestamp();

        return interaction.update({
          content: `🎉 **Trade Finalized between <@${trade.sender_id}> and <@${trade.recipient_id}>!**`,
          embeds: [successEmbed],
          components: []
        });
      } catch (err) {
        console.error('[TradeSystem] Transfer execution error:', err);
        return interaction.update({
          content: `❌ **Transaction Failed:** ${err.message}`,
          components: []
        });
      }
    }

    // Handle Item-Only Trade Execution
    updateTradeStatus(tradeId, 'completed');
    const itemSuccessEmbed = new EmbedBuilder()
      .setTitle('🤝 ITEM TRADE ACCEPTED!')
      .setColor(0x00FF77)
      .setDescription(
        `✅ <@${trade.recipient_id}> has **ACCEPTED** the trade offer from <@${trade.sender_id}>!\n\n` +
        `📦 **Offered:** ${trade.item_offered || 'Items'}\n` +
        (trade.item_wanted ? `🎯 **In Exchange:** ${trade.item_wanted}\n\n` : '\n') +
        `*Please conduct your physical item transfer safely in-game!*`
      )
      .setFooter({ text: 'Krims Code AI • Trade System • ID: ' + tradeId })
      .setTimestamp();

    return interaction.update({
      content: `🎉 **Trade Accepted between <@${trade.sender_id}> and <@${trade.recipient_id}>!**`,
      embeds: [itemSuccessEmbed],
      components: []
    });
  }

  // 2. Legacy Trade Buttons Support (trade_accept_sender_target)
  if (customId.startsWith('trade_accept_') || customId.startsWith('trade_decline_')) {
    const parts = customId.split('_');
    const action = parts[1]; // 'accept' or 'decline'
    const senderId = parts[2];
    const targetId = parts[3];

    if (interaction.user.id !== targetId) {
      return interaction.reply({ content: '❌ Only the targeted player can respond to this trade offer!', ephemeral: true });
    }

    if (action === 'accept') {
      const acceptEmbed = new EmbedBuilder()
        .setTitle('🤝 TRADE OFFER ACCEPTED!')
        .setDescription(`✅ <@${targetId}> has **ACCEPTED** the trade offer from <@${senderId}>!\n\n*Please conduct your item or KryloCoin exchange safely in-game!*`)
        .setColor(0x00FF77)
        .setTimestamp();

      return interaction.update({
        content: `🎉 **Trade Accepted between <@${senderId}> and <@${targetId}>!**`,
        embeds: [acceptEmbed],
        components: []
      });
    } else {
      const declineEmbed = new EmbedBuilder()
        .setTitle('❌ TRADE OFFER DECLINED')
        .setDescription(`❌ <@${targetId}> has **DECLINED** the trade offer from <@${senderId}>.`)
        .setColor(0xFF0055)
        .setTimestamp();

      return interaction.update({
        content: `❌ **Trade Offer Declined.**`,
        embeds: [declineEmbed],
        components: []
      });
    }
  }

  return false;
}

/**
 * Handle Prefix Commands: !trade kr @User <amount> [item/note]
 */
export async function handleTradePrefixCommand(message, args = []) {
  if (!message.guild) {
    return message.reply('❌ Trade commands can only be used inside Discord servers!');
  }

  const sub = (args[0] || '').toLowerCase();
  
  // Usage: !trade kr @User <amount> [item/note...]
  if (sub === 'kr' || /^\d+$/.test(args[1] || '')) {
    let targetUser = message.mentions.users.first();
    let remainingArgs = [...args];

    if (sub === 'kr') {
      remainingArgs.shift(); // remove 'kr'
    }

    // Filter out mention from remainingArgs to find amount and item
    if (targetUser) {
      remainingArgs = remainingArgs.filter(a => !a.includes(targetUser.id));
    } else if (remainingArgs[0]?.match(/^\d{17,20}$/)) {
      try {
        targetUser = await message.client.users.fetch(remainingArgs[0]);
        remainingArgs.shift();
      } catch (_) {}
    }

    const amountIndex = remainingArgs.findIndex(a => /^\d+$/.test(a));
    const amount = amountIndex !== -1 ? parseInt(remainingArgs[amountIndex], 10) : 0;
    
    // Remaining text after amount is item/note
    if (amountIndex !== -1) {
      remainingArgs.splice(amountIndex, 1);
    }
    const itemWanted = remainingArgs.join(' ').trim() || null;

    if (!targetUser || !amount || amount <= 0) {
      return message.reply(
        `❌ **Invalid Usage!**\n` +
        `• **Format:** \`!trade kr @user <amount> [optional item/note]\`\n` +
        `• **Example:** \`!trade kr @friend 500 Netherite Armor\`\n` +
        `• **Slash Command:** \`/trade kr user: @friend amount: 500\``
      );
    }

    if (targetUser.id === message.author.id) {
      return message.reply('❌ You cannot trade with yourself.');
    }

    if (targetUser.bot) {
      return message.reply('❌ You cannot trade Krims Rewards with bot accounts.');
    }

    const senderBal = getBalance(message.author.id);
    const userCoins = senderBal?.krylocoins ?? 0;
    if (userCoins < amount) {
      return message.reply(`❌ **Insufficient Funds!** Your vault contains **${userCoins.toLocaleString()} KR**, but you offered **${amount.toLocaleString()} KR**.`);
    }

    const tradeId = generateTradeId();
    const expiresAt = Date.now() + TRADE_EXPIRATION_MS;

    const trade = {
      trade_id: tradeId,
      sender_id: message.author.id,
      recipient_id: targetUser.id,
      trade_type: 'kr',
      amount,
      item_offered: null,
      item_wanted: itemWanted,
      status: 'pending',
      guild_id: message.guild.id,
      channel_id: message.channel.id,
      message_id: null,
      created_at: Date.now(),
      expires_at: expiresAt
    };

    savePendingTrade(trade);

    const payload = buildKrTradeProposalPayload({
      tradeId,
      senderId: message.author.id,
      recipientId: targetUser.id,
      amount,
      itemWanted,
      expiresAt
    });

    return message.reply(payload);
  }

  // Fallback help
  return message.reply(
    `🤝 **Krims Secure Trade System**\n\n` +
    `• \`/trade kr user: @player amount: <number> [item: string]\` — Propose a Krims Rewards (KR) trade\n` +
    `• \`!trade kr @player <amount> [item]\` — Prefix command to propose a KR trade\n` +
    `• \`/trade item player: @player offer: <item> [for: string]\` — Propose an item exchange\n\n` +
    `*All KR trades are escrow-verified and recorded in the database ledger.*`
  );
}
