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
      title TEXT DEFAULT '📌 Channel Notice',
      message_content TEXT NOT NULL,
      color INTEGER DEFAULT 55542,
      last_sticky_id TEXT
    );
  `);
} catch (e) {
  console.warn('[Counting/Sticky DB Init]', e.message);
}

const stickyLocks = new Map();

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

const stickyTimers = new Map();

// Default Channel Rules in case DB needs populating
export const DEFAULT_RULES = {
  'general': {
    title: '💬 GENERAL CHAT RULES',
    color: 0x00D8F6,
    text: `• **Be Respectful:** Treat all members and staff with respect.\n• **No Toxicity/Drama:** Harassment, toxicity, and flame wars are strictly prohibited.\n• **Keep It Clean:** No NSFW content, spam, or excessive caps.\n• **English Only:** Keep discussions friendly and in English.\n\n✨ *Enjoy your stay in KryloSMP!*`
  },
  'media': {
    title: '📸 MEDIA & CLIPS GUIDELINES',
    color: 0xA855F7,
    text: `• **Minecraft & KryloSMP:** Share your screenshots, builds, PvP clips, and artwork!\n• **No Inappropriate Content:** Strictly no NSFW, Gore, or offensive media.\n• **No File Spamming:** Group multiple screenshots together in one post.`
  },
  'bot-commands': {
    title: '🤖 BOT COMMANDS USAGE',
    color: 0xF59E0B,
    text: `• **Available Commands:** Use \`/store\`, \`/stats\`, \`/verify\`, \`/profile\`, \`/help\`.\n• **Keep Chat Clean:** Run all bot interactions inside this room only.\n• **No Spamming:** Avoid rapid repeated commands.`
  },
  'suggestions': {
    title: '💡 SUGGESTIONS GUIDELINES',
    color: 0x10B981,
    text: `• **Share Ideas:** Suggest new features, kits, crate items, or events for KryloSMP!\n• **Community Voting:** React with 👍 or 👎 on fellow players' ideas.\n• **Be Constructive:** Explain how your idea improves gameplay.`
  },
  'counting': {
    title: '🔢 COUNTING CHALLENGE',
    color: 0x00D8F6,
    text: `Count as high as possible!\n\n• **One number per message**\n• **Don't count twice in a row**\n• **If someone breaks the chain, it resets to 1!**\n\n👉 **Start counting from 1!**`
  }
};

/**
 * Handles Native Sticky Messages
 */
export async function handleStickyMessage(message) {
  if (!message.guild || message.author.bot) return;

  const content = message.content.trim();

  // 1. Manual ?stick command
  if (content.startsWith('?stick ')) {
    if (!message.member?.permissions.has(PermissionFlagsBits.ManageMessages) && message.author.id !== '1538225405486698520' && message.author.id !== '1414143825538191373') {
      return message.reply('❌ You need `Manage Messages` permission to set sticky messages.').catch(() => {});
    }

    const stickText = content.replace(/^\?stick\s+/i, '').trim();
    try {
      db.prepare('INSERT OR REPLACE INTO sticky_messages (channel_id, title, message_content, color, last_sticky_id) VALUES (?, ?, ?, ?, ?)')
        .run(message.channel.id, '📌 Channel Notice', stickText, 0x00D8F6, null);
    } catch (_) {}

    const embed = new EmbedBuilder()
      .setColor(0x00D8F6)
      .setTitle('📌 Channel Notice')
      .setDescription(stickText)
      .setFooter({ text: 'KryloSMP Community Engine • Auto-Sticky' })
      .setTimestamp();

    const sent = await message.channel.send({ embeds: [embed] });
    try {
      db.prepare('UPDATE sticky_messages SET last_sticky_id = ? WHERE channel_id = ?').run(sent.id, message.channel.id);
    } catch (_) {}

    await message.delete().catch(() => {});
    return;
  }

  // 2. Manual ?unstick command
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

  // 3. Automatic Sticky Deletion & Reposting at the bottom
  try {
    let row = db.prepare('SELECT * FROM sticky_messages WHERE channel_id = ?').get(message.channel.id);
    
    // Fallback rule detection by channel name if not in DB
    if (!row || !row.message_content) {
      const chName = message.channel.name.toLowerCase();
      for (const [key, rule] of Object.entries(DEFAULT_RULES)) {
        if (chName.includes(key)) {
          row = {
            channel_id: message.channel.id,
            title: rule.title,
            message_content: rule.text,
            color: rule.color,
            last_sticky_id: null
          };
          try {
            db.prepare('INSERT OR REPLACE INTO sticky_messages (channel_id, title, message_content, color, last_sticky_id) VALUES (?, ?, ?, ?, ?)')
              .run(message.channel.id, rule.title, rule.text, rule.color, null);
          } catch (_) {}
          break;
        }
      }
    }

    if (!row || !row.message_content) return;

    // Reset pending timer so we only send once after the user stops typing
    if (stickyTimers.has(message.channel.id)) {
      clearTimeout(stickyTimers.get(message.channel.id));
    }

    const timer = setTimeout(async () => {
      stickyTimers.delete(message.channel.id);
      try {
        // Find and delete previous sticky message(s) by this bot in recent messages
        try {
          const recent = await message.channel.messages.fetch({ limit: 15 }).catch(() => null);
          if (recent) {
            const oldStickies = recent.filter(m => m.author.id === message.client.user.id && (m.id === row.last_sticky_id || (m.embeds[0] && m.embeds[0].footer?.text?.includes('Auto-Sticky'))));
            for (const [_, old] of oldStickies) {
              await old.delete().catch(() => {});
            }
          }
        } catch (_) {}

        const embed = new EmbedBuilder()
          .setColor(row.color || 0x00D8F6)
          .setTitle(row.title || '📌 Notice')
          .setDescription(row.message_content)
          .setFooter({ text: 'KryloSMP Community Engine • Auto-Sticky' })
          .setTimestamp();

        const newSticky = await message.channel.send({ embeds: [embed] });
        db.prepare('UPDATE sticky_messages SET last_sticky_id = ? WHERE channel_id = ?').run(newSticky.id, message.channel.id);
      } catch (err) {
        console.warn('[Sticky Error]', err.message);
      }
    }, 1000);

    stickyTimers.set(message.channel.id, timer);
  } catch (err) {
    // Ignore sticky refresh errors
  }
}
