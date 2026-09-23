import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import Database from 'better-sqlite3';
import { EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directory and local JSON mirror file
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
const localLogFile = path.join(dataDir, 'dev_audit_logs.json');

// SQLite connection
const sqliteDb = new Database(path.join(dataDir, 'krylosmp.db'));
sqliteDb.pragma('journal_mode = WAL');

// Neon Postgres connection
let neonPool = null;
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
  try {
    neonPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
  } catch (err) {
    console.warn('[DevAuditLogger] Failed to create Neon Pool:', err.message);
  }
}

// 72 hours / 3 days in milliseconds
export const RETENTION_PERIOD_MS = 3 * 24 * 60 * 60 * 1000;

// Initialize tables in SQLite and Neon
function initTables() {
  try {
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS dev_audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT NOT NULL,
        action TEXT NOT NULL,
        guild_id TEXT,
        executor_id TEXT,
        executor_tag TEXT,
        status TEXT NOT NULL,
        duration_ms INTEGER,
        details TEXT,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_dev_audit_created ON dev_audit_logs(created_at);
    `);
  } catch (e) {
    console.warn('[DevAuditLogger] SQLite table init error:', e.message);
  }

  if (neonPool) {
    neonPool.query(`
      CREATE TABLE IF NOT EXISTS dev_audit_logs (
        id SERIAL PRIMARY KEY,
        category VARCHAR(64) NOT NULL,
        action VARCHAR(64) NOT NULL,
        guild_id VARCHAR(64),
        executor_id VARCHAR(64),
        executor_tag VARCHAR(128),
        status VARCHAR(32) NOT NULL,
        duration_ms INTEGER,
        details JSONB,
        created_at BIGINT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_dev_audit_neon_created ON dev_audit_logs(created_at);
    `).catch(e => console.warn('[DevAuditLogger] Neon table init notice:', e.message));
  }
}

initTables();

/**
 * Prune all logs older than 3 days (72 hours) across SQLite, Neon Postgres, and local JSON
 */
export async function pruneOldLogs() {
  const cutoff = Date.now() - RETENTION_PERIOD_MS;

  // 1. Prune SQLite
  try {
    sqliteDb.prepare('DELETE FROM dev_audit_logs WHERE created_at < ?').run(cutoff);
  } catch (e) {
    console.warn('[DevAuditLogger] SQLite prune notice:', e.message);
  }

  // 2. Prune Neon Postgres
  if (neonPool) {
    try {
      await neonPool.query('DELETE FROM dev_audit_logs WHERE created_at < $1', [cutoff]);
    } catch (e) {
      console.warn('[DevAuditLogger] Neon Postgres prune notice:', e.message);
    }
  }

  // 3. Prune local JSON mirror
  try {
    if (fs.existsSync(localLogFile)) {
      const content = fs.readFileSync(localLogFile, 'utf8');
      const list = JSON.parse(content || '[]');
      const filtered = list.filter(item => item.created_at >= cutoff);
      fs.writeFileSync(localLogFile, JSON.stringify(filtered, null, 2));
    }
  } catch (e) {}
}

/**
 * Record a developer audit log entry with exact time and details.
 * Kept for 3 days for debugging and diagnostics.
 */
export async function logDevEvent({
  category = 'GENERAL',
  action,
  guildId = null,
  executor = null,
  status = 'SUCCESS',
  durationMs = null,
  details = {}
}) {
  const now = Date.now();
  const executorId = executor?.id || 'SYSTEM';
  const executorTag = executor?.tag || executor?.username || 'SYSTEM';
  const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);

  const entry = {
    category,
    action,
    guild_id: guildId,
    executor_id: executorId,
    executor_tag: executorTag,
    status,
    duration_ms: durationMs,
    details,
    created_at: now,
    iso_time: new Date(now).toISOString()
  };

  // 1. Insert into SQLite
  try {
    sqliteDb.prepare(`
      INSERT INTO dev_audit_logs (category, action, guild_id, executor_id, executor_tag, status, duration_ms, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(category, action, guildId, executorId, executorTag, status, durationMs, detailsStr, now);
  } catch (e) {
    console.warn('[DevAuditLogger] SQLite insert error:', e.message);
  }

  // 2. Insert into Neon Postgres
  if (neonPool) {
    neonPool.query(`
      INSERT INTO dev_audit_logs (category, action, guild_id, executor_id, executor_tag, status, duration_ms, details, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [category, action, guildId, executorId, executorTag, status, durationMs, details, now])
    .catch(e => console.warn('[DevAuditLogger] Neon insert notice:', e.message));
  }

  // 3. Append to local JSON file for easy developer inspection
  try {
    let currentLogs = [];
    if (fs.existsSync(localLogFile)) {
      try {
        currentLogs = JSON.parse(fs.readFileSync(localLogFile, 'utf8') || '[]');
      } catch {}
    }
    currentLogs.unshift(entry);
    // Keep max 500 entries in JSON and purge older than 3 days
    const cutoff = now - RETENTION_PERIOD_MS;
    const cleanLogs = currentLogs.filter(l => l.created_at >= cutoff).slice(0, 500);
    fs.writeFileSync(localLogFile, JSON.stringify(cleanLogs, null, 2));
  } catch (e) {}

  // Automatically trigger pruning
  pruneOldLogs().catch(() => {});

  console.log(`[🛠️ DEV LOG] [${category}] ${action} (${status}) at ${new Date(now).toISOString()} by ${executorTag}`);
  return entry;
}

/**
 * Retrieve dev logs within the 3-day window
 */
export async function getDevLogs({ category = null, limit = 20, days = 3 } = {}) {
  await pruneOldLogs().catch(() => {});
  const cutoff = Date.now() - (days * 24 * 60 * 60 * 1000);

  // Try Neon Postgres first for latest cloud data
  if (neonPool) {
    try {
      let query = 'SELECT * FROM dev_audit_logs WHERE created_at >= $1';
      const params = [cutoff];
      if (category && category !== 'all') {
        query += ' AND category = $2';
        params.push(category);
      }
      query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1);
      params.push(limit);

      const res = await neonPool.query(query, params);
      if (res && res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          ...r,
          created_at: Number(r.created_at),
          details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details
        }));
      }
    } catch (e) {
      console.warn('[DevAuditLogger] Neon query fallback to SQLite:', e.message);
    }
  }

  // Fallback to SQLite
  try {
    let query = 'SELECT * FROM dev_audit_logs WHERE created_at >= ?';
    const params = [cutoff];
    if (category && category !== 'all') {
      query += ' AND category = ?';
      params.push(category);
    }
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    const rows = sqliteDb.prepare(query).all(...params);
    return rows.map(r => ({
      ...r,
      created_at: Number(r.created_at),
      details: typeof r.details === 'string' ? JSON.parse(r.details || '{}') : r.details
    }));
  } catch (e) {
    console.warn('[DevAuditLogger] SQLite query fallback to JSON:', e.message);
  }

  // Fallback to JSON file
  try {
    if (fs.existsSync(localLogFile)) {
      const list = JSON.parse(fs.readFileSync(localLogFile, 'utf8') || '[]');
      return list
        .filter(l => l.created_at >= cutoff && (!category || category === 'all' || l.category === category))
        .slice(0, limit);
    }
  } catch {}

  return [];
}

/**
 * Owner/Developer command to view real logs from the past 3 days.
 * Strictly restricted to bot developers (Krylo ID: 1414143825538191373)
 */
export async function handleDevLogsCommand(interaction) {
  const userId = interaction.user?.id || interaction.author?.id;
  const isDev = userId === '1414143825538191373' || (interaction.guild && interaction.guild.ownerId === userId);

  if (!isDev) {
    if (interaction.reply) {
      return interaction.reply({
        content: '🔒 **Developer Diagnostics Restricted:** These audit telemetry logs are strictly reserved for internal bot developers.',
        ephemeral: true
      });
    }
    return;
  }

  const category = interaction.options?.getString?.('category') || interaction._category || 'all';
  const limit = interaction.options?.getInteger?.('limit') || interaction._limit || 10;

  if (typeof interaction.deferReply === 'function') {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
  }

  const logs = await getDevLogs({ category, limit, days: 3 });

  if (!logs || logs.length === 0) {
    const emptyMsg = `✅ **No developer audit logs found** for the past 3 days (Category: \`${category}\`).`;
    if (interaction.editReply) {
      return interaction.editReply({ content: emptyMsg });
    } else if (interaction.reply) {
      return interaction.reply({ content: emptyMsg, ephemeral: true });
    }
    return;
  }

  const embed = new EmbedBuilder()
    .setColor(0x00F0FF)
    .setTitle('🛠️ Developer Audit Telemetry (Past 3 Days)')
    .setDescription(
      `Real-time execution traces for internal bug fixing and diagnostics.\n` +
      `⏱️ **Active Rolling Window:** 72 Hours (3 Days)\n` +
      `📊 **Showing:** \`${logs.length}\` most recent event(s)`
    )
    .setTimestamp();

  for (const l of logs.slice(0, 10)) {
    const statusIcon = l.status === 'SUCCESS' ? '🟢' : l.status === 'PARTIAL' ? '🟡' : '🔴';
    const epochSec = Math.floor(l.created_at / 1000);
    const timeDisplay = `<t:${epochSec}:F> (<t:${epochSec}:R>)`;
    const detailsShort = typeof l.details === 'object'
      ? Object.entries(l.details).slice(0, 5).map(([k, v]) => `• ${k}: \`${Array.isArray(v) ? v.slice(0, 3).join(', ') + (v.length > 3 ? '...' : '') : v}\``).join('\n')
      : String(l.details || 'N/A');

    embed.addFields({
      name: `${statusIcon} [${l.category}] ${l.action} • #${l.id}`,
      value: `🕒 ${timeDisplay}\n⚡ **Latency:** \`${l.duration_ms ?? 0}ms\` | **Status:** \`${l.status}\`\n👤 **By:** <@${l.executor_id}>\n${detailsShort}`
    });
  }

  embed.setFooter({ text: 'Krims Neural Core • Developer Internal Telemetry • Auto-Purge 72h' });

  if (interaction.editReply) {
    await interaction.editReply({ embeds: [embed] });
  } else if (interaction.reply) {
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
}
