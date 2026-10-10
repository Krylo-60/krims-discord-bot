import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import { db } from '../databaseEngine.mjs';

// ──────────────────────────────────────────────────────────
// 🏛️ SQLITE SCHEMA INITIALIZATION FOR SERVER AI MEMORY
// ──────────────────────────────────────────────────────────
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS server_ai_memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT,
      user_id TEXT,
      user_name TEXT,
      role TEXT NOT NULL, -- 'user' or 'model'
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_ai_mem_guild ON server_ai_memory (guild_id);
    CREATE INDEX IF NOT EXISTS idx_ai_mem_created ON server_ai_memory (created_at);

    CREATE TABLE IF NOT EXISTS server_ai_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      fact_key TEXT NOT NULL,
      fact_value TEXT NOT NULL,
      added_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(guild_id, fact_key)
    );

    CREATE INDEX IF NOT EXISTS idx_ai_facts_guild ON server_ai_facts (guild_id);
  `);
} catch (e) {
  console.warn('[AI Memory DB Init]', e.message);
}

// ──────────────────────────────────────────────────────────
// 🧠 DEFAULT SEED FACTS FOR CORE SERVERS
// ──────────────────────────────────────────────────────────
const DEFAULT_SERVER_FACTS = {
  // The_Half_Lifes Elite SMP Team Server
  '1557852594242719775': [
    { key: 'team_identity', value: 'The Half Life\'s — Elite Minecraft SMP competitive team focused on strategic base design, PvP warfare, and coordinate defense.' },
    { key: 'team_leader', value: 'st1LLkill3r (IGN: st1LLkill3r) and Krylo (IGN: Krylo_MC) are BOTH official Team Leaders of The Half Life\'s with supreme Admin authority and commanding power.' },
    { key: 'builder_specialist', value: 'CrazyCoolCam (Minecraft IGN: CrazyCoolCam) — Elite Builder, Redstone Engineer (7/10), and underground miner.' },
    { key: 'krylo_leader', value: 'Krylo (Discord: krylo_plays / Krylo_MC) is official Team Leader of The Half Life\'s alongside st1LLkill3r.' },
    { key: 'minecraft_server', value: 'Elite SMP by Ledgy. Java IP: EliteSmp.gg | Bedrock IP: Mc.eliteSmp.gg (Port 19132) | Discord: https://discord.gg/XBgjQxbWpb' },
    { key: 'team_creed', value: 'We fight down to the half-heart. Loyalty to the squad above all. Never leak base coordinates.' }
  ],
  // Krylo\'s Skybase Community Server
  '1549875778575929446': [
    { key: 'server_name', value: 'Krylo\'s Skybase — Official community and video production studio created by Krylo.' },
    { key: 'content_creator', value: 'Krylo (Twitch: https://twitch.tv/kryloplaysmc) — Minecraft streamer and video director.' },
    { key: 'film_crew', value: 'Skybase Film Crew auditions take place in #🎬・𝖢𝗋𝖾𝗐-apply. Members can apply to build and star in YouTube cinematic videos.' }
  ]
};

// Seed facts if table is empty for known servers
export function seedServerFactsIfEmpty() {
  try {
    for (const [guildId, facts] of Object.entries(DEFAULT_SERVER_FACTS)) {
      const existing = db.prepare('SELECT COUNT(*) as count FROM server_ai_facts WHERE guild_id = ?').get(guildId);
      if (existing && existing.count === 0) {
        const stmt = db.prepare('INSERT OR REPLACE INTO server_ai_facts (guild_id, fact_key, fact_value, added_by) VALUES (?, ?, ?, ?)');
        for (const f of facts) {
          stmt.run(guildId, f.key, f.value, 'System Seed');
        }
        console.log(`[AI Memory] 🧠 Seeded ${facts.length} initial facts for server ${guildId}`);
      }
    }
  } catch (err) {
    console.warn('[AI Memory Seed Error]', err.message);
  }
}

// Run initial seed check on startup
seedServerFactsIfEmpty();

// ──────────────────────────────────────────────────────────
// 💾 MEMORY RECORDING & RETRIEVAL
// ──────────────────────────────────────────────────────────

/**
 * Record a single conversation turn (User prompt + AI reply)
 */
export function recordConversationTurn(guildId, channelId, userId, userName, prompt, reply) {
  if (!guildId || !prompt || !reply) return;
  try {
    const insert = db.prepare(`
      INSERT INTO server_ai_memory (guild_id, channel_id, user_id, user_name, role, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    // Insert user query
    insert.run(guildId, channelId || null, userId || null, userName || 'Member', 'user', prompt.trim());
    // Insert AI response
    insert.run(guildId, channelId || null, null, 'Krims Code AI', 'model', reply.trim());

    // Prune old history: retain latest 80 turns per guild to ensure lightning-fast retrieval
    db.prepare(`
      DELETE FROM server_ai_memory 
      WHERE id NOT IN (
        SELECT id FROM server_ai_memory 
        WHERE guild_id = ? 
        ORDER BY id DESC 
        LIMIT 80
      ) AND guild_id = ?
    `).run(guildId, guildId);

  } catch (err) {
    console.warn('[AI Memory Record Error]', err.message);
  }
}

/**
 * Get recent server memory formatted for LLMs (Groq / Gemini)
 */
export function getRecentServerMemory(guildId, limit = 8) {
  if (!guildId) return [];
  try {
    const rows = db.prepare(`
      SELECT role, user_name, content, created_at 
      FROM server_ai_memory 
      WHERE guild_id = ? 
      ORDER BY id DESC 
      LIMIT ?
    `).all(guildId, limit);

    // Return in chronological order
    return rows.reverse();
  } catch (err) {
    console.warn('[AI Memory Fetch Error]', err.message);
    return [];
  }
}

/**
 * Learn or update a persistent server fact
 */
export function learnServerFact(guildId, factKey, factValue, addedBy = 'User') {
  if (!guildId || !factKey || !factValue) return false;
  try {
    db.prepare(`
      INSERT INTO server_ai_facts (guild_id, fact_key, fact_value, added_by)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(guild_id, fact_key) DO UPDATE SET
        fact_value = excluded.fact_value,
        added_by = excluded.added_by,
        created_at = CURRENT_TIMESTAMP
    `).run(guildId, factKey.trim().toLowerCase().replace(/\s+/g, '_'), factValue.trim(), addedBy);
    return true;
  } catch (err) {
    console.warn('[AI Memory Learn Fact Error]', err.message);
    return false;
  }
}

/**
 * Get all known facts for a server
 */
export function getServerFacts(guildId) {
  if (!guildId) return [];
  try {
    return db.prepare('SELECT fact_key, fact_value, added_by, created_at FROM server_ai_facts WHERE guild_id = ? ORDER BY id ASC').all(guildId);
  } catch (err) {
    console.warn('[AI Memory Get Facts Error]', err.message);
    return [];
  }
}

/**
 * Reset all memory and facts for a specific server
 */
export function resetServerMemory(guildId, adminUser = 'Admin') {
  if (!guildId) return { deletedMessages: 0, deletedFacts: 0 };
  try {
    const memCount = db.prepare('SELECT COUNT(*) as count FROM server_ai_memory WHERE guild_id = ?').get(guildId)?.count || 0;
    const factCount = db.prepare('SELECT COUNT(*) as count FROM server_ai_facts WHERE guild_id = ?').get(guildId)?.count || 0;

    db.prepare('DELETE FROM server_ai_memory WHERE guild_id = ?').run(guildId);
    db.prepare('DELETE FROM server_ai_facts WHERE guild_id = ?').run(guildId);

    console.log(`[AI Memory] 🧹 Server memory for ${guildId} wiped by ${adminUser}: ${memCount} chat logs, ${factCount} facts cleared.`);
    return { deletedMessages: memCount, deletedFacts: factCount };
  } catch (err) {
    console.error('[AI Memory Reset Error]', err.message);
    return { deletedMessages: 0, deletedFacts: 0, error: err.message };
  }
}

/**
 * Get statistics about a server's memory
 */
export function getMemoryStats(guildId) {
  if (!guildId) return { totalMessages: 0, totalFacts: 0, oldestDate: null, facts: [] };
  try {
    const memRow = db.prepare('SELECT COUNT(*) as count, MIN(created_at) as oldest, MAX(created_at) as newest FROM server_ai_memory WHERE guild_id = ?').get(guildId);
    const facts = db.prepare('SELECT fact_key, fact_value FROM server_ai_facts WHERE guild_id = ?').all(guildId);

    return {
      totalMessages: memRow?.count || 0,
      totalFacts: facts.length,
      oldestDate: memRow?.oldest || null,
      newestDate: memRow?.newest || null,
      facts
    };
  } catch (err) {
    console.warn('[AI Memory Stats Error]', err.message);
    return { totalMessages: 0, totalFacts: 0, oldestDate: null, facts: [] };
  }
}

/**
 * Build rich memory and context injection block for LLM system prompts
 */
export function buildServerMemoryContext(guildId, guildName = '') {
  if (!guildId) return '';

  const facts = getServerFacts(guildId);
  const recentLogs = getRecentServerMemory(guildId, 6);

  let memoryContext = `\n\n══════════════════════════════════════════════════════════════\n`;
  memoryContext += `🧠 [SERVER MEMORY & CONTINUOUS KNOWLEDGE - "${guildName || guildId}"]\n`;
  memoryContext += `You have active persistent memory of this server's history, members, and past interactions.\n`;
  
  if (facts.length > 0) {
    memoryContext += `\n📌 Verified Server Facts & Lore:\n`;
    for (const f of facts) {
      memoryContext += `• ${f.fact_key}: ${f.fact_value}\n`;
    }
  }

  if (recentLogs.length > 0) {
    memoryContext += `\n💬 Recent Server Conversation Memory (Chronological):\n`;
    for (const msg of recentLogs) {
      if (msg.role === 'user') {
        memoryContext += `• [Member ${msg.user_name}]: "${msg.content}"\n`;
      } else {
        memoryContext += `• [Krims Code AI]: "${msg.content}"\n`;
      }
    }
  }

  memoryContext += `\nRules for Memory Usage:\n`;
  memoryContext += `1. Seamlessly recall facts and previous conversation turns when members ask about past events, roles, people, or questions.\n`;
  memoryContext += `2. If an admin asks you to remember a fact or you learn new verified info, acknowledge it.\n`;
  memoryContext += `3. Never state you have no memory of the server; you possess full persistent server memory.\n`;
  memoryContext += `══════════════════════════════════════════════════════════════\n`;

  return memoryContext;
}

/**
 * Generate visual Discord Embed for Server Memory
 */
export function buildMemoryStatusEmbed(guild, stats) {
  const embed = new EmbedBuilder()
    .setTitle(`🧠 Krims Code AI — Server Memory Matrix`)
    .setDescription(`Krims Code AI maintains **persistent server-wide neural memory** for **${guild.name}**. It remembers previous conversations, player roles, team lore, and custom taught facts across bot restarts.`)
    .setColor(0x5865F2)
    .addFields(
      { 
        name: '💬 Conversation Memory', 
        value: `**${stats.totalMessages}** messages logged\n*(Active retention window)*`, 
        inline: true 
      },
      { 
        name: '📌 Permanent Facts & Lore', 
        value: `**${stats.totalFacts}** verified server facts`, 
        inline: true 
      },
      { 
        name: '📅 Memory Age', 
        value: stats.oldestDate ? `Active since: \`${stats.oldestDate.slice(0, 10)}\`` : 'Recently established', 
        inline: true 
      }
    );

  if (stats.facts && stats.facts.length > 0) {
    const factsPreview = stats.facts.slice(0, 5).map(f => `• **${f.fact_key}**: ${f.fact_value.length > 70 ? f.fact_value.slice(0, 67) + '...' : f.fact_value}`).join('\n');
    embed.addFields({ name: '📚 Known Server Knowledge (Preview)', value: factsPreview });
  }

  embed.setFooter({ text: 'Admins can wipe memory anytime using /memory action:reset or the button below' })
       .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_reset_ai_memory_${guild.id}`)
      .setLabel('Reset Server Memory')
      .setStyle(ButtonStyle.Danger)
      .setEmoji('🗑️'),
    new ButtonBuilder()
      .setCustomId(`btn_refresh_ai_memory_${guild.id}`)
      .setLabel('Refresh Stats')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('🔄')
  );

  return { embeds: [embed], components: [row] };
}
