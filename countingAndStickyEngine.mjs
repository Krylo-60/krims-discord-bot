import { EmbedBuilder, PermissionFlagsBits, ChannelType } from 'discord.js';
import { db, neonPool } from './databaseEngine.mjs';

// Initialize SQLite tables for counting and sticky messages
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS counting_state (
      channel_id TEXT PRIMARY KEY,
      guild_id TEXT,
      current_number INTEGER DEFAULT 0,
      last_user_id TEXT,
      high_score INTEGER DEFAULT 0,
      status_message_id TEXT
    );

    CREATE TABLE IF NOT EXISTS sticky_messages (
      channel_id TEXT PRIMARY KEY,
      title TEXT DEFAULT '📌 Channel Notice',
      message_content TEXT NOT NULL,
      color INTEGER DEFAULT 55542,
      last_sticky_id TEXT
    );

    CREATE TABLE IF NOT EXISTS counting_user_stats (
      user_id TEXT,
      guild_id TEXT,
      counts_count INTEGER DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );
  `);
} catch (e) {
  console.warn('[Counting/Sticky DB Init]', e.message);
}

try {
  db.exec(`ALTER TABLE counting_state ADD COLUMN guild_id TEXT;`);
} catch (_) {}
try {
  db.exec(`ALTER TABLE counting_state ADD COLUMN status_message_id TEXT;`);
} catch (_) {}

/**
 * Sync state between Neon Postgres and local SQLite cache
 */
async function syncFromCloudPostgres() {
  if (!neonPool) return;
  try {
    const client = await neonPool.connect();
    const res = await client.query('SELECT * FROM counting_state');
    for (const r of res.rows) {
      db.prepare(`
        INSERT OR REPLACE INTO counting_state (channel_id, guild_id, current_number, last_user_id, high_score, status_message_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(r.channel_id, r.guild_id, r.current_number, r.last_user_id, r.high_score, r.status_message_id);
    }
    client.release();
  } catch (err) {
    console.warn('[Counting Cloud Sync Notice]:', err.message);
  }
}

// Initial pull on boot
syncFromCloudPostgres().catch(() => {});

async function pushToCloudPostgres(channelId, guildId, currentNum, lastUserId, highScore, statusMessageId = null) {
  if (!neonPool) return;
  try {
    const client = await neonPool.connect();
    await client.query(`
      INSERT INTO counting_state (channel_id, guild_id, current_number, last_user_id, high_score, status_message_id, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (channel_id) DO UPDATE SET
        guild_id = EXCLUDED.guild_id,
        current_number = EXCLUDED.current_number,
        last_user_id = EXCLUDED.last_user_id,
        high_score = EXCLUDED.high_score,
        status_message_id = COALESCE(EXCLUDED.status_message_id, counting_state.status_message_id),
        updated_at = NOW();
    `, [channelId, guildId, currentNum, lastUserId, highScore, statusMessageId]);
    client.release();
  } catch (err) {
    console.warn('[Counting Cloud Push Notice]:', err.message);
  }
}

/**
 * Link a Discord channel as the server's official counting channel
 */
export async function linkCountingChannel(channel, user = null) {
  const channelId = channel.id;
  const guildId = channel.guild.id;

  let existing = null;
  try {
    existing = db.prepare('SELECT * FROM counting_state WHERE channel_id = ?').get(channelId);
  } catch (_) {}

  if (!existing) {
    try {
      db.prepare('INSERT OR REPLACE INTO counting_state (channel_id, guild_id, current_number, last_user_id, high_score) VALUES (?, ?, ?, ?, ?)')
        .run(channelId, guildId, 0, null, 0);
    } catch (_) {}
  } else {
    try {
      db.prepare('UPDATE counting_state SET guild_id = ? WHERE channel_id = ?').run(guildId, channelId);
    } catch (_) {}
  }

  // Send an attractive start announcement embed into the linked channel
  const startEmbed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle('🔢 COUNTING CHANNEL LINKED & ACTIVE!')
    .setDescription(
      `This channel is now the official **Counting Game** room for **${channel.guild.name}**! 🚀\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `📜 **RULES OF THE GAME:**\n` +
      `• **Start counting from number \`1\`!**\n` +
      `• Members take turns counting up by 1 (\`1\`, \`2\`, \`3\`...).\n` +
      `• **Rule 1:** You **cannot** count two numbers in a row!\n` +
      `• **Rule 2:** If anyone enters the wrong number or double-counts, the count resets back to **\`1\`**!\n` +
      `• **Milestones:** Every 25 numbers unlocks a celebration shoutout!\n\n` +
      `✨ *Current Count:* **${existing?.current_number || 0}** (Next: **\`${(existing?.current_number || 0) + 1}\`**) | *Record High Score:* **${existing?.high_score || 0}**\n` +
      `👉 **Drop \`${(existing?.current_number || 0) + 1}\` in chat to continue the chain!**`
    )
    .setFooter({ text: `${channel.guild.name} • Krims Counting Engine` })
    .setTimestamp();

  const sent = await channel.send({ embeds: [startEmbed] }).catch(() => {});
  if (sent) {
    try {
      db.prepare('UPDATE counting_state SET status_message_id = ? WHERE channel_id = ?').run(sent.id, channelId);
    } catch (_) {}
  }

  return {
    success: true,
    channelId,
    currentNumber: existing?.current_number || 0,
    highScore: existing?.high_score || 0
  };
}

/**
 * Updates the pinned/status embed in real time with live count and high score
 */
export async function updateLiveStatusEmbed(channel, state, options = {}) {
  if (!channel || !state) return;
  const statusMsgId = state.status_message_id;
  if (!statusMsgId) return;

  try {
    const msg = await channel.messages.fetch(statusMsgId).catch(() => null);
    if (!msg || !msg.embeds || msg.embeds.length === 0) return;

    const originalEmbed = msg.embeds[0];
    const curNum = state.current_number || 0;
    const nextNum = curNum + 1;
    const lastCounterName = options.lastCounter ? (options.lastCounter.displayName || options.lastCounter.username) : (state.last_user_id ? `<@${state.last_user_id}>` : 'None');
    const statusText = options.statusText || (curNum > 0 ? '🔥 Active Chain!' : 'Ready to start!');

    const updatedFields = originalEmbed.fields.map(f => {
      if (f.name.includes('Status')) {
        return {
          name: '📊 Live Counting Status',
          value: `\`\`\`yaml\nCurrent Count:  ${curNum}\nNext Number:    ${nextNum}\nHigh Score:     ${state.high_score || 0}\nLast Counter:   ${lastCounterName}\nStatus:         ${statusText}\n\`\`\``,
          inline: false
        };
      }
      return f;
    });

    const newEmbed = EmbedBuilder.from(originalEmbed).setFields(updatedFields);
    await msg.edit({ embeds: [newEmbed] });
  } catch (err) {
    console.warn('[Counting] Failed to update live status embed:', err.message);
  }
}

/**
 * Unlink a counting channel
 */
export function unlinkCountingChannel(channelId) {
  try {
    db.prepare('DELETE FROM counting_state WHERE channel_id = ?').run(channelId);
    return true;
  } catch (err) {
    console.error('[Counting] Unlink error:', err);
    return false;
  }
}

/**
 * Reset count for a channel back to 0 (next is 1)
 */
export async function resetCountingState(channelId, channel = null) {
  try {
    db.prepare('UPDATE counting_state SET current_number = 0, last_user_id = NULL WHERE channel_id = ?').run(channelId);
    const state = getCountingState(channelId);
    if (state) {
      pushToCloudPostgres(channelId, state.guild_id, 0, null, state.high_score, state.status_message_id);
      if (channel) {
        await updateLiveStatusEmbed(channel, state, {
          statusText: '🔄 Reset by staff! Start with 1.',
          lastCounter: null
        });
      }
    }
    return true;
  } catch (err) {
    console.error('[Counting] Reset error:', err);
    return false;
  }
}

/**
 * Revive or set specific count for a channel
 */
export async function setCountingState(channelId, channel, count, lastUserId, highScore = null) {
  try {
    const effectiveHighScore = highScore !== null ? highScore : count;
    db.prepare('UPDATE counting_state SET current_number = ?, last_user_id = ?, high_score = MAX(high_score, ?) WHERE channel_id = ?')
      .run(count, lastUserId, effectiveHighScore, channelId);

    const state = getCountingState(channelId);
    if (state) {
      pushToCloudPostgres(channelId, state.guild_id, count, lastUserId, state.high_score, state.status_message_id);
      if (channel) {
        let lastUserObj = null;
        if (lastUserId && channel.client) {
          lastUserObj = await channel.client.users.fetch(lastUserId).catch(() => null);
        }
        await updateLiveStatusEmbed(channel, state, {
          statusText: '🔥 Active Chain (Revived)!',
          lastCounter: lastUserObj
        });
      }
    }
    return true;
  } catch (err) {
    console.error('[Counting] Set state error:', err);
    return false;
  }
}

// ──────────────────────────────────────────────────────────
// 🤖 AI COUNTING PARTNER ENGINE
// ──────────────────────────────────────────────────────────
// Active sessions: channelId => { active: true, initiatorId: '...', expiresAt: timestamp, timer: Timeout }
export const aiCountingSessions = new Map();
// Rate limits for non-owners: userId => [timestamps of attempts within last 15 min]
export const aiCountingRateLimits = new Map();

const KRYLO_USER_ID = '1414143825538191373';

export function getAiCountingSession(channelId) {
  const session = aiCountingSessions.get(channelId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    clearTimeout(session.timer);
    aiCountingSessions.delete(channelId);
    return null;
  }
  return session;
}

export function stopAiCountingSession(channelId, reason = null) {
  const session = aiCountingSessions.get(channelId);
  if (session) {
    clearTimeout(session.timer);
    aiCountingSessions.delete(channelId);
    return true;
  }
  return false;
}

export function startAiCountingSession(channel, user) {
  const channelId = channel.id;
  const isOwner = user.id === KRYLO_USER_ID;

  // Rate limiting for non-owners: 5 tries, lasting 15 minutes each window
  if (!isOwner) {
    const now = Date.now();
    const attempts = (aiCountingRateLimits.get(user.id) || []).filter(t => now - t < 15 * 60 * 1000);
    if (attempts.length >= 5) {
      const oldest = attempts[0];
      const waitMin = Math.ceil((15 * 60 * 1000 - (now - oldest)) / 60000);
      return {
        success: false,
        error: `⏳ You have used all **5 AI Counting tries**! Please wait **${waitMin}m** before starting another AI counting session.`
      };
    }
    attempts.push(now);
    aiCountingRateLimits.set(user.id, attempts);
  }

  // Clear existing session timer if any
  const existing = aiCountingSessions.get(channelId);
  if (existing) clearTimeout(existing.timer);

  const durationMs = 15 * 60 * 1000; // 15 minutes
  const expiresAt = Date.now() + durationMs;

  const timer = setTimeout(async () => {
    aiCountingSessions.delete(channelId);
    try {
      const endEmbed = new EmbedBuilder()
        .setColor(0x64748B)
        .setTitle('⏱️ AI COUNTING SESSION ENDED')
        .setDescription('The 15-minute AI Counting Partner session has expired! Regular team counting rules apply.')
        .setFooter({ text: 'Krims Code AI • AI Counting Partner' });
      await channel.send({ embeds: [endEmbed] });
    } catch (_) {}
  }, durationMs);

  const session = {
    active: true,
    initiatorId: user.id,
    expiresAt,
    timer
  };
  aiCountingSessions.set(channelId, session);

  const remainingTries = isOwner ? 'Unlimited 👑' : `${5 - (aiCountingRateLimits.get(user.id)?.length || 0)} / 5`;

  const state = getCountingState(channelId);
  const initiatorIsLastCounter = Boolean(state && state.last_user_id === user.id && state.current_number > 0);

  // If initiator was the last counter, Krims Code AI automatically takes the first turn!
  if (initiatorIsLastCounter) {
    const botUser = channel.client?.user;
    const botNum = state.current_number + 1;
    const botHighScore = Math.max(state.high_score || 0, botNum);

    setTimeout(async () => {
      try {
        const curAi = getAiCountingSession(channelId);
        if (!curAi) return;

        const botMsg = await channel.send(`${botNum}`);
        await botMsg.react('✅').catch(() => {});

        db.prepare('UPDATE counting_state SET current_number = ?, last_user_id = ?, high_score = ? WHERE channel_id = ?')
          .run(botNum, botUser?.id || '1523794466740371586', botHighScore, channelId);
        pushToCloudPostgres(channelId, channel.guild?.id, botNum, botUser?.id || '1523794466740371586', botHighScore, state.status_message_id);

        updateLiveStatusEmbed(channel, {
          status_message_id: state.status_message_id,
          current_number: botNum,
          high_score: botHighScore,
          last_user_id: botUser?.id || '1523794466740371586'
        }, {
          statusText: '🤖 AI Counting Partner Active!',
          lastCounter: botUser || { displayName: 'Krims Code AI' }
        });

        if (botNum % 25 === 0) {
          await botMsg.react('🎉').catch(() => {});
          const celeb = new EmbedBuilder()
            .setColor(0x00FF66)
            .setTitle(`🎉 Milestone Reached: ${botNum}!`)
            .setDescription(`🔥 Fantastic teamwork between **Krims Code AI** and the squad! Current count is **${botNum}**! Next is **${botNum + 1}**! 🚀`)
            .setFooter({ text: `High Score: ${botHighScore}` });
          await channel.send({ embeds: [celeb] });
        }
      } catch (err) {
        console.warn('[AI Counting Auto First Turn Error]:', err.message);
      }
    }, 1200);
  }

  return {
    success: true,
    expiresAt,
    remainingTries,
    initiatorIsLastCounter
  };
}

/**
 * Fetch counting state
 */
export function getCountingState(channelId) {
  try {
    return db.prepare('SELECT * FROM counting_state WHERE channel_id = ?').get(channelId);
  } catch (_) {
    return null;
  }
}

/**
 * Generates Cross-Server Counting Leaderboard Embed
 */
export async function getCrossServerCountingLeaderboardEmbed(client) {
  let rows = [];
  try {
    rows = db.prepare('SELECT * FROM counting_state ORDER BY high_score DESC, current_number DESC').all();
  } catch (_) {}

  // Top users across all servers
  let topUsers = [];
  try {
    topUsers = db.prepare(`
      SELECT user_id, SUM(counts_count) as total_counts 
      FROM counting_user_stats 
      GROUP BY user_id 
      ORDER BY total_counts DESC 
      LIMIT 5
    `).all();
  } catch (_) {}

  const embed = new EmbedBuilder()
    .setColor(0xF1C40F) // Gold Trophy
    .setTitle('🏆 GLOBAL CROSS-SERVER COUNTING LEADERBOARD')
    .setDescription(
      `Compete across all Discord servers to claim the **Ultimate Counting Crown**! 👑\n` +
      `Who holds the highest counting chain across our entire network?\n\n` +
      `▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`
    )
    .setTimestamp()
    .setFooter({ text: 'Krims Code AI • Cross-Server Counting Championship' });

  if (rows.length === 0) {
    embed.addFields({
      name: '🌐 Server Standings',
      value: 'No servers have linked a counting channel yet! Use `/counting` or `!setcounting` to join the championship!'
    });
  } else {
    const medalIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];
    const serverLines = await Promise.all(rows.map(async (row, idx) => {
      const medal = medalIcons[idx] || `\`#${idx + 1}\``;
      let guildName = 'Unknown Server';
      if (row.guild_id && client?.guilds?.cache?.has(row.guild_id)) {
        guildName = client.guilds.cache.get(row.guild_id).name;
      } else if (row.guild_id) {
        const fetched = await client?.guilds?.fetch(row.guild_id).catch(() => null);
        if (fetched) guildName = fetched.name;
      }
      return `${medal} **${guildName}**\n↳ 🏆 **Record High Score:** \`${row.high_score || 0}\` | 🔢 **Current Count:** \`${row.current_number || 0}\` | 📍 <#${row.channel_id}>`;
    }));

    embed.addFields({
      name: '🌐 Server Championship Rankings',
      value: serverLines.join('\n\n').substring(0, 1024),
      inline: false
    });
  }

  if (topUsers.length > 0) {
    const userRankings = topUsers.map((u, i) => {
      const medal = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'][i] || `#${i + 1}`;
      return `${medal} <@${u.user_id}> — **${u.total_counts}** verified counts`;
    }).join('\n');

    embed.addFields({
      name: '👑 Top Community Counters (All Servers)',
      value: userRankings,
      inline: false
    });
  }

  return embed;
}

/**
 * Handles Counting Logic in linked channels or channels named 'counting'
 */
export async function handleCountingMessage(message) {
  if (message.author.bot || !message.guild) return false;

  let state = null;
  try {
    state = db.prepare('SELECT * FROM counting_state WHERE channel_id = ?').get(message.channel.id);
  } catch (_) {}

  // If not in local SQLite, query directly from Neon Postgres before anything else
  if (!state && neonPool) {
    try {
      const pgClient = await neonPool.connect();
      const res = await pgClient.query('SELECT * FROM counting_state WHERE channel_id = $1', [message.channel.id]);
      pgClient.release();
      if (res.rows.length > 0) {
        state = res.rows[0];
        try {
          db.prepare(`
            INSERT OR REPLACE INTO counting_state (channel_id, guild_id, current_number, last_user_id, high_score, status_message_id)
            VALUES (?, ?, ?, ?, ?, ?)
          `).run(state.channel_id, state.guild_id, state.current_number, state.last_user_id, state.high_score, state.status_message_id);
        } catch (_) {}
      }
    } catch (e) {
      console.warn('[Direct Neon Fallback Notice]:', e.message);
    }
  }

  // If not explicitly linked in DB, check if channel name has 'counting' (supports Unicode / fonts)
  const normChannelName = (message.channel.name || '').normalize('NFKD').toLowerCase();
  if (!state && !normChannelName.includes('counting')) {
    return false;
  }

  const content = message.content.trim();
  // Check if message is a clean number (e.g. "1", "42", "100")
  if (!/^\d+$/.test(content)) {
    return false; // Ignore non-numeric chat (allow normal chat or commands)
  }

  const num = parseInt(content, 10);
  if (isNaN(num)) return false;

  if (!state) {
    state = { current_number: 0, last_user_id: null, high_score: 0 };
    try {
      db.prepare('INSERT OR REPLACE INTO counting_state (channel_id, guild_id, current_number, last_user_id, high_score) VALUES (?, ?, ?, ?, ?)')
        .run(message.channel.id, message.guild.id, 0, null, 0);
      pushToCloudPostgres(message.channel.id, message.guild.id, 0, null, 0);
    } catch (_) {}
  }

  const expectedNumber = state.current_number + 1;

  // Rule 1: Cannot count twice in a row
  const aiSession = getAiCountingSession(message.channel.id);
  const isAiSessionCounter = aiSession && aiSession.initiatorId === message.author.id;

  if (state.last_user_id === message.author.id && state.current_number > 0) {
    if (isAiSessionCounter) {
      if (num === expectedNumber) {
        // In AI Counting partner mode, if the session initiator says the expected number, allow it!
        // The bot will naturally respond with the subsequent number.
      } else {
        const warnMsg = await message.reply('⏳ **Wait for Krims Code AI!** Let your AI partner take its turn before counting again!').catch(() => {});
        setTimeout(() => warnMsg?.delete().catch(() => {}), 4000);
        await message.delete().catch(() => {});
        return true;
      }
    } else {
      await message.react('❌').catch(() => {});
      const resetEmbed = new EmbedBuilder()
        .setColor(0xEF4444)
        .setTitle('❌ Counting Chain Broken!')
        .setDescription(`**${message.author.displayName || message.author.username}** counted twice in a row!\nThe count resets back to **\`1\`**. Start over!`)
        .setFooter({ text: `Record High Score: ${state.high_score}` });

      try {
        db.prepare('UPDATE counting_state SET current_number = 0, last_user_id = NULL WHERE channel_id = ?').run(message.channel.id);
        pushToCloudPostgres(message.channel.id, message.guild.id, 0, null, state.high_score, state.status_message_id);
      } catch (_) {}

      updateLiveStatusEmbed(message.channel, {
        status_message_id: state.status_message_id,
        current_number: 0,
        high_score: state.high_score,
        last_user_id: message.author.id
      }, {
        statusText: '❌ Chain broken! Start over at 1.',
        lastCounter: message.author
      });

      await message.channel.send({ embeds: [resetEmbed] });
      return true;
    }
  }

  // Rule 2: Must be exact next number
  if (num !== expectedNumber) {
    await message.react('❌').catch(() => {});
    const resetEmbed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('❌ Wrong Number!')
      .setDescription(`**${message.author.displayName || message.author.username}** said **${num}**, but the next number was **${expectedNumber}**!\nThe count resets back to **\`1\`**. Start over!`)
      .setFooter({ text: `Record High Score: ${state.high_score}` });

    try {
      db.prepare('UPDATE counting_state SET current_number = 0, last_user_id = NULL WHERE channel_id = ?').run(message.channel.id);
      pushToCloudPostgres(message.channel.id, message.guild.id, 0, null, state.high_score, state.status_message_id);
    } catch (_) {}

    updateLiveStatusEmbed(message.channel, {
      status_message_id: state.status_message_id,
      current_number: 0,
      high_score: state.high_score,
      last_user_id: message.author.id
    }, {
      statusText: '❌ Chain broken! Start over at 1.',
      lastCounter: message.author
    });

    await message.channel.send({ embeds: [resetEmbed] });
    return true;
  }

  // Correct Number!
  await message.react('✅').catch((err) => {
    console.warn('[Counting Reaction Notice]:', err.message);
  });

  // Dynamic Reaction 2: Fire Streak for 10+ (🔥)
  if (num >= 10) {
    await message.react('🔥').catch(() => {});
  }

  // Dynamic Reaction 3: Century Milestone (💯)
  if (num % 100 === 0) {
    await message.react('💯').catch(() => {});
  }

  const newHighScore = Math.max(state.high_score || 0, num);
  try {
    db.prepare('UPDATE counting_state SET current_number = ?, last_user_id = ?, high_score = ? WHERE channel_id = ?')
      .run(num, message.author.id, newHighScore, message.channel.id);
    pushToCloudPostgres(message.channel.id, message.guild.id, num, message.author.id, newHighScore, state.status_message_id);
  } catch (_) {}

  // Milestone Celebration every 25 numbers (🎉)
  if (num % 25 === 0) {
    await message.react('🎉').catch(() => {});
    const celeb = new EmbedBuilder()
      .setColor(0x00FF66)
      .setTitle(`🎉 Milestone Reached: ${num}!`)
      .setDescription(`🔥 Fantastic teamwork by **${message.author.displayName || message.author.username}** and the squad! Current count is **${num}**! Next is **${num + 1}**! 🚀`)
      .setFooter({ text: `High Score: ${newHighScore}` });
    await message.channel.send({ embeds: [celeb] }).catch(() => {});
  }

  // Update user stats
  try {
    db.prepare(`
      INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counts_count + 1
    `).run(message.author.id, message.guild.id);
  } catch (_) {}

  // Live status embed update
  updateLiveStatusEmbed(message.channel, {
    status_message_id: state.status_message_id,
    current_number: num,
    high_score: newHighScore,
    last_user_id: message.author.id
  }, {
    statusText: '🔥 Active Chain!',
    lastCounter: message.author
  });

  // 🤖 AI Counting Partner Automation Logic
  const activeAiSession = getAiCountingSession(message.channel.id);
  if (activeAiSession) {
    // Condition A: If someone else counts, the AI counting session terminates so the real community takes over!
    if (message.author.id !== activeAiSession.initiatorId) {
      stopAiCountingSession(message.channel.id);
      try {
        const takeoverEmbed = new EmbedBuilder()
          .setColor(0x38BDF8)
          .setTitle('👥 SQUAD TAKEOVER!')
          .setDescription(`**${message.author.displayName || message.author.username}** joined the counting arena! AI Counting Partner mode paused so the squad can count together!`)
          .setFooter({ text: 'The Half Lifes • Team Counting' });
        await message.channel.send({ embeds: [takeoverEmbed] });
      } catch (_) {}
    } else {
      // Condition B: The active player counted! Krims Code AI automatically responds with the next number!
      const botNextNumber = num + 1;
      const botHighScore = Math.max(newHighScore, botNextNumber);
      const botUser = message.client.user;

      setTimeout(async () => {
        try {
          // Verify session is still valid
          const currentAi = getAiCountingSession(message.channel.id);
          if (!currentAi) return;

          // Bot counts next number
          const botMsg = await message.channel.send(`${botNextNumber}`);
          await botMsg.react('✅').catch(() => {});

          // Update state in DB & cloud
          db.prepare('UPDATE counting_state SET current_number = ?, last_user_id = ?, high_score = ? WHERE channel_id = ?')
            .run(botNextNumber, botUser.id, botHighScore, message.channel.id);
          pushToCloudPostgres(message.channel.id, message.guild.id, botNextNumber, botUser.id, botHighScore, state.status_message_id);

          // Update status dashboard
          updateLiveStatusEmbed(message.channel, {
            status_message_id: state.status_message_id,
            current_number: botNextNumber,
            high_score: botHighScore,
            last_user_id: botUser.id
          }, {
            statusText: '🤖 AI Counting Partner Active!',
            lastCounter: botUser
          });

          // Milestone check for bot's number
          if (botNextNumber % 25 === 0) {
            await botMsg.react('🎉').catch(() => {});
            const celeb = new EmbedBuilder()
              .setColor(0x00FF66)
              .setTitle(`🎉 Milestone Reached: ${botNextNumber}!`)
              .setDescription(`🔥 Fantastic teamwork between **${message.author.displayName || message.author.username}** and **Krims Code AI**! Current count is **${botNextNumber}**! Next is **${botNextNumber + 1}**! 🚀`)
              .setFooter({ text: `High Score: ${botHighScore}` });
            await message.channel.send({ embeds: [celeb] });
          }
        } catch (botErr) {
          console.warn('[AI Counting Partner Bot Error]:', botErr.message);
        }
      }, 1200); // 1.2 second natural human-like delay
    }
  }

  return true;
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

  // STRICT GUILD ISOLATION: Only run KryloSMP stickies in KryloSMP guilds!
  const isKryloGuild = message.guild.name.toLowerCase().includes('krylo') || 
                       message.guild.id === '1538225337048236082' || 
                       message.guild.id === '1420991845546332162' || 
                       message.guild.id === '1532574925356007525';
  if (!isKryloGuild) return;

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

  // 3. Automatic Sticky Deletion & Reposting at the bottom (ONLY if an admin explicitly ran ?stick)
  try {
    const row = db.prepare('SELECT * FROM sticky_messages WHERE channel_id = ?').get(message.channel.id);
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
            const oldStickies = recent.filter(m => m.author.id === message.client.user.id && (m.id === row.last_sticky_id || (m.embeds[0] && m.embeds[0].footer?.text?.includes('Channel Notice'))));
            for (const [_, old] of oldStickies) {
              await old.delete().catch(() => {});
            }
          }
        } catch (_) {}

        const embed = new EmbedBuilder()
          .setColor(row.color || 0x00D8F6)
          .setTitle(row.title || '📌 Notice')
          .setDescription(row.message_content)
          .setFooter({ text: `${message.guild.name} • Channel Notice` })
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
