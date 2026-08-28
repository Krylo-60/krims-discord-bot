import Database from 'better-sqlite3';
import pg from 'pg';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'krylosmp.db');
const db = new Database(dbPath);

// Enable Write-Ahead Logging (WAL) for blazing-fast concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

// Neon Lakebase Postgres Connection Pool
const neonUrl = process.env.DATABASE_URL;
let neonPool = null;

if (neonUrl && neonUrl.startsWith('postgres')) {
  try {
    neonPool = new Pool({
      connectionString: neonUrl,
      ssl: { rejectUnauthorized: false }
    });
    console.log('[Neon Postgres Engine] 🐘 Connected to Neon Lakebase Postgres (Ohio us-east-2)!');
  } catch (err) {
    console.warn('[Neon Postgres Engine] Failed to initialize Neon pool:', err.message);
  }
}

// ═══════════════════════════════════════════════════════════
// 🏛️ TABLE INITIALIZATION SCHEMA
// ═══════════════════════════════════════════════════════════
db.exec(`
  -- 1. Players & Verification
  CREATE TABLE IF NOT EXISTS players (
    discord_id TEXT PRIMARY KEY,
    minecraft_ign TEXT UNIQUE,
    uuid TEXT,
    is_verified INTEGER DEFAULT 0,
    verified_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 2. Economy & Balances
  CREATE TABLE IF NOT EXISTS economy (
    discord_id TEXT PRIMARY KEY,
    krylocoins INTEGER DEFAULT 1000,
    bank INTEGER DEFAULT 0,
    gems INTEGER DEFAULT 0,
    daily_streak INTEGER DEFAULT 0,
    last_daily INTEGER DEFAULT 0,
    last_work INTEGER DEFAULT 0,
    FOREIGN KEY(discord_id) REFERENCES players(discord_id) ON DELETE CASCADE
  );

  -- 3. Clans & Factions
  CREATE TABLE IF NOT EXISTS clans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    tag TEXT UNIQUE NOT NULL,
    owner_id TEXT NOT NULL,
    description TEXT,
    vault_kc INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    member_count INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 4. Clan Members
  CREATE TABLE IF NOT EXISTS clan_members (
    clan_id INTEGER NOT NULL,
    discord_id TEXT NOT NULL,
    role TEXT DEFAULT 'Member',
    joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (clan_id, discord_id),
    FOREIGN KEY(clan_id) REFERENCES clans(id) ON DELETE CASCADE
  );

  -- 5. Support Tickets
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT UNIQUE,
    user_id TEXT NOT NULL,
    category TEXT DEFAULT 'General',
    reason TEXT,
    priority TEXT DEFAULT 'Standard',
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME
  );

  -- 6. Moderation Logs
  CREATE TABLE IF NOT EXISTS moderation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT,
    user_id TEXT NOT NULL,
    mod_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    duration TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 7. Leveling & XP
  CREATE TABLE IF NOT EXISTS leveling (
    discord_id TEXT PRIMARY KEY,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    messages_count INTEGER DEFAULT 0,
    last_message_at INTEGER DEFAULT 0
  );

  -- 8. Server Configuration
  CREATE TABLE IF NOT EXISTS server_config (
    guild_id TEXT PRIMARY KEY,
    prefix TEXT DEFAULT '!',
    welcome_channel TEXT,
    rules_channel TEXT,
    logs_channel TEXT,
    tickets_category TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log(`[Database] ✅ Connected to SQLite database at: ${dbPath}`);

// ═══════════════════════════════════════════════════════════
// ⚡ QUERY API FUNCTIONS
// ═══════════════════════════════════════════════════════════

// --- PLAYER & VERIFICATION ---
export function getPlayer(discordId) {
  return db.prepare('SELECT * FROM players WHERE discord_id = ?').get(discordId);
}

export function getPlayerByIgn(ign) {
  return db.prepare('SELECT * FROM players WHERE LOWER(minecraft_ign) = LOWER(?)').get(ign);
}

export function setPlayerVerification(discordId, minecraftIgn, uuid = null) {
  const stmt = db.prepare(`
    INSERT INTO players (discord_id, minecraft_ign, uuid, is_verified, verified_at)
    VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP)
    ON CONFLICT(discord_id) DO UPDATE SET
      minecraft_ign = excluded.minecraft_ign,
      uuid = excluded.uuid,
      is_verified = 1,
      verified_at = CURRENT_TIMESTAMP
  `);
  stmt.run(discordId, minecraftIgn, uuid);

  // Initialize economy if not exists
  db.prepare(`
    INSERT OR IGNORE INTO economy (discord_id, krylocoins) VALUES (?, 1000)
  `).run(discordId);

  // Background Cloud Sync to Neon Lakebase Postgres
  if (neonPool) {
    neonPool.query(`
      INSERT INTO players (discord_id, minecraft_ign, uuid, is_verified, verified_at)
      VALUES ($1, $2, $3, TRUE, CURRENT_TIMESTAMP)
      ON CONFLICT (discord_id) DO UPDATE SET
        minecraft_ign = EXCLUDED.minecraft_ign,
        uuid = EXCLUDED.uuid,
        is_verified = TRUE,
        verified_at = CURRENT_TIMESTAMP
    `, [discordId, minecraftIgn, uuid]).catch(() => {});
  }
}

// --- ECONOMY ---
export function getBalance(discordId) {
  const row = db.prepare('SELECT * FROM economy WHERE discord_id = ?').get(discordId);
  if (!row) {
    db.prepare('INSERT OR IGNORE INTO economy (discord_id, krylocoins) VALUES (?, 1000)').run(discordId);
    return { discord_id: discordId, krylocoins: 1000, bank: 0, gems: 0, daily_streak: 0, last_daily: 0, last_work: 0 };
  }
  return row;
}

export function addCoins(discordId, amount) {
  db.prepare(`
    INSERT INTO economy (discord_id, krylocoins) VALUES (?, ?)
    ON CONFLICT(discord_id) DO UPDATE SET krylocoins = krylocoins + excluded.krylocoins
  `).run(discordId, amount);

  // Background Cloud Sync to Neon Lakebase Postgres
  if (neonPool) {
    neonPool.query(`
      INSERT INTO economy (discord_id, krylocoins) VALUES ($1, $2)
      ON CONFLICT (discord_id) DO UPDATE SET krylocoins = economy.krylocoins + EXCLUDED.krylocoins
    `, [discordId, amount]).catch(() => {});
  }

  return getBalance(discordId);
}

export function removeCoins(discordId, amount) {
  const current = getBalance(discordId);
  if (current.krylocoins < amount) return false;
  db.prepare('UPDATE economy SET krylocoins = krylocoins - ? WHERE discord_id = ?').run(amount, discordId);

  // Background Cloud Sync to Neon Lakebase Postgres
  if (neonPool) {
    neonPool.query(`
      UPDATE economy SET krylocoins = krylocoins - $1 WHERE discord_id = $2
    `, [amount, discordId]).catch(() => {});
  }

  return true;
}

export function getTopBalances(limit = 10) {
  return db.prepare(`
    SELECT e.discord_id, e.krylocoins, p.minecraft_ign 
    FROM economy e
    LEFT JOIN players p ON e.discord_id = p.discord_id
    ORDER BY e.krylocoins DESC
    LIMIT ?
  `).all(limit);
}

// --- CLANS ---
export function getClan(nameOrTag) {
  return db.prepare('SELECT * FROM clans WHERE LOWER(name) = LOWER(?) OR LOWER(tag) = LOWER(?)').get(nameOrTag, nameOrTag);
}

export function getClanById(id) {
  return db.prepare('SELECT * FROM clans WHERE id = ?').get(id);
}

export function createClan(name, tag, ownerId, description = '') {
  const stmt = db.prepare(`
    INSERT INTO clans (name, tag, owner_id, description)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(name, tag, ownerId, description);
  const clanId = info.lastInsertRowid;
  db.prepare('INSERT INTO clan_members (clan_id, discord_id, role) VALUES (?, ?, ?)').run(clanId, ownerId, 'Leader');

  // Background Cloud Sync to Neon Lakebase Postgres
  if (neonPool) {
    neonPool.query(`
      INSERT INTO clans (name, tag, owner_id, description)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) DO NOTHING
    `, [name, tag, ownerId, description]).catch(() => {});
  }

  return getClanById(clanId);
}

// --- TICKETS ---
export function createTicket(channelId, userId, category, reason, priority = 'Standard') {
  const stmt = db.prepare(`
    INSERT INTO tickets (channel_id, user_id, category, reason, priority, status)
    VALUES (?, ?, ?, ?, ?, 'open')
  `);
  const info = stmt.run(channelId, userId, category, reason, priority);
  return info.lastInsertRowid;
}

export function closeTicket(channelId) {
  db.prepare(`
    UPDATE tickets SET status = 'closed', closed_at = CURRENT_TIMESTAMP WHERE channel_id = ?
  `).run(channelId);
}

// --- LEVELING ---
export function addXp(discordId, xpToAdd) {
  const current = db.prepare('SELECT * FROM leveling WHERE discord_id = ?').get(discordId);
  if (!current) {
    db.prepare('INSERT INTO leveling (discord_id, xp, level, messages_count, last_message_at) VALUES (?, ?, 1, 1, ?)').run(discordId, xpToAdd, Date.now());
    return { level: 1, xp: xpToAdd, leveledUp: false };
  }

  const newXp = current.xp + xpToAdd;
  const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;
  const leveledUp = newLevel > current.level;

  db.prepare(`
    UPDATE leveling SET xp = ?, level = ?, messages_count = messages_count + 1, last_message_at = ? WHERE discord_id = ?
  `).run(newXp, newLevel, Date.now(), discordId);

  return { level: newLevel, xp: newXp, leveledUp };
}

// --- MODERATION LOGS ---
export function logModeration(guildId, userId, modId, action, reason = 'No reason provided', duration = null) {
  db.prepare(`
    INSERT INTO moderation_logs (guild_id, user_id, mod_id, action, reason, duration)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(guildId, userId, modId, action, reason, duration);
}

export { db };
export default db;
