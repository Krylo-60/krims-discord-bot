import { EmbedBuilder, PermissionFlagsBits } from 'discord.js';
import { db } from './databaseEngine.mjs';

// Initialize SQLite tables for counting and sticky messages
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS counting_state (
      channel_id TEXT PRIMARY KEY,
      current_number INTEGER DEFAULT 0,
      last_user_id TEXT,
      high_score INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS sticky_messages (
      channel_id TEXT PRIMARY KEY,
      message_content TEXT NOT NULL,
      last_sticky_id TEXT
    );
  `);
} catch (e) {
  console.warn('[Counting/Sticky DB Init]', e.message);
}

/**
 * Handles Counting Logic in #🔢┃counting
 */
export async function handleCountingMessage(message) {
  if (message.author.bot) return;
  if (!message.channel.name || !message.channel.name.includes('counting')) return;

  const content = message.content.trim();
  const num = parseInt(content, 10);
  if (isNaN(num)) return; // Allow non-number chat or ignore

  let state = null;
  try {
    state = db.prepare('SELECT * FROM counting_state WHERE channel_id = ?').get(message.channel.id);
  } catch (_) {}

  if (!state) {
    state = { current_number: 3, last_user_id: null, high_score: 3 };
    try {
      db.prepare('INSERT OR REPLACE INTO counting_state (channel_id, current_number, last_user_id, high_score) VALUES (?, ?, ?, ?)')
        .run(message.channel.id, 3, null, 3);
    } catch (_) {}
  }

  const expectedNumber = state.current_number + 1;

  // Rule 1: Cannot count twice in a row
  if (state.last_user_id === message.author.id && state.current_number > 0) {
    await message.react('❌').catch(() => {});
    const resetEmbed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('❌ Counting Chain Broken!')
      .setDescription(`**${message.author.displayName}** counted twice in a row!\nThe count resets back to **1**. Start over!`)
      .setFooter({ text: `High Score: ${state.high_score}` });

    try {
      db.prepare('UPDATE counting_state SET current_number = 0, last_user_id = NULL WHERE channel_id = ?').run(message.channel.id);
    } catch (_) {}

    await message.channel.send({ embeds: [resetEmbed] });
    return;
  }

  // Rule 2: Must be exact next number
  if (num !== expectedNumber) {
    await message.react('❌').catch(() => {});
    const resetEmbed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('❌ Wrong Number!')
      .setDescription(`**${message.author.displayName}** said **${num}**, but the next number was **${expectedNumber}**!\nThe count resets back to **1**. Start over!`)
      .setFooter({ text: `High Score: ${state.high_score}` });

    try {
      db.prepare('UPDATE counting_state SET current_number = 0, last_user_id = NULL WHERE channel_id = ?').run(message.channel.id);
    } catch (_) {}

    await message.channel.send({ embeds: [resetEmbed] });
    return;
  }

  // Correct Number!
  const newHighScore = Math.max(state.high_score || 0, num);
  try {
    db.prepare('UPDATE counting_state SET current_number = ?, last_user_id = ?, high_score = ? WHERE channel_id = ?')
      .run(num, message.author.id, newHighScore, message.channel.id);
  } catch (_) {}

  await message.react('✅').catch(() => {});

  // Milestone Celebration every 25 numbers
  if (num % 25 === 0) {
    await message.react('🎉').catch(() => {});
    const celeb = new EmbedBuilder()
      .setColor(0x00FF66)
      .setTitle(`🎉 Milestone Reached: ${num}!`)
      .setDescription(`Awesome teamwork! Current count is **${num}**! Keep it going! 🚀`);
    await message.channel.send({ embeds: [celeb] });
  }
}

/**
 * Handles Native Sticky Messages
 */
export async function handleStickyMessage(message) {
  if (message.author.bot) return;

  // Check if command is ?stick or ?unstick
  const content = message.content.trim();
  if (content.startsWith('?stick ')) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages) && message.author.id !== '1538225405486698520' && message.author.id !== '1414143825538191373') {
      return message.reply('❌ You need `Manage Messages` permission to set sticky messages.').catch(() => {});
    }

    const stickText = content.replace(/^\?stick\s+/i, '').trim();
    try {
      db.prepare('INSERT OR REPLACE INTO sticky_messages (channel_id, message_content, last_sticky_id) VALUES (?, ?, ?)')
        .run(message.channel.id, stickText, null);
    } catch (_) {}

    const embed = new EmbedBuilder()
      .setColor(0x00D8F6)
      .setTitle('📌 Sticky Message Set!')
      .setDescription(stickText)
      .setFooter({ text: 'KryloSMP Native Sticky Engine' });

    const sent = await message.channel.send({ embeds: [embed] });
    try {
      db.prepare('UPDATE sticky_messages SET last_sticky_id = ? WHERE channel_id = ?').run(sent.id, message.channel.id);
    } catch (_) {}

    await message.delete().catch(() => {});
    return;
  }

  if (content.startsWith('?unstick')) {
    try {
      const row = db.prepare('SELECT * FROM sticky_messages WHERE channel_id = ?').get(message.channel.id);
      if (row && row.last_sticky_id) {
        const oldMsg = await message.channel.messages.fetch(row.last_sticky_id).catch(() => null);
        if (oldMsg) await oldMsg.delete().catch(() => {});
      }
      db.prepare('DELETE FROM sticky_messages WHERE channel_id = ?').run(message.channel.id);
      await message.reply('✅ Sticky message removed from this channel.').catch(() => {});
    } catch (_) {}
    return;
  }

  // Automatic Sticky Resend on New Chat Messages
  try {
    const row = db.prepare('SELECT * FROM sticky_messages WHERE channel_id = ?').get(message.channel.id);
    if (!row || !row.message_content) return;

    // Delete previous sticky
    if (row.last_sticky_id) {
      const oldMsg = await message.channel.messages.fetch(row.last_sticky_id).catch(() => null);
      if (oldMsg) await oldMsg.delete().catch(() => {});
    }

    const embed = new EmbedBuilder()
      .setColor(0x00D8F6)
      .setTitle('📌 Notice')
      .setDescription(row.message_content)
      .setFooter({ text: 'KryloSMP Native Sticky Engine' });

    const newSticky = await message.channel.send({ embeds: [embed] });
    db.prepare('UPDATE sticky_messages SET last_sticky_id = ? WHERE channel_id = ?').run(newSticky.id, message.channel.id);
  } catch (err) {
    // Ignore sticky refresh errors
  }
}
