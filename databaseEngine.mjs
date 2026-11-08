import mysql from 'mysql2/promise';
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

// 🐬 FalixNodes Minecraft Server MySQL Database Connection Pool
const mysqlConfig = {
  host: process.env.MYSQL_HOST || process.env.DB_HOST,
  port: parseInt(process.env.MYSQL_PORT || process.env.DB_PORT || '3306', 10),
  user: process.env.MYSQL_USER || process.env.DB_USER,
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASS || process.env.DB_PASSWORD,
  database: process.env.MYSQL_DATABASE || process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let mysqlPool = null;
if (mysqlConfig.user && mysqlConfig.password && mysqlConfig.database) {
  try {
    mysqlPool = mysql.createPool(mysqlConfig);
    console.log('[Falix MySQL Engine] 🐬 Connected to Minecraft Server MySQL!');
    
    // Auto-create in-game sync tables if not exist
    mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS krylosmp_economy (
        discord_id VARCHAR(64) PRIMARY KEY,
        minecraft_ign VARCHAR(64) UNIQUE,
        krylocoins BIGINT DEFAULT 10000,
        bank BIGINT DEFAULT 0,
        gems BIGINT DEFAULT 0,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `).catch(e => console.warn('[Falix MySQL] Table setup notice:', e.message));
  } catch (err) {
    console.warn('[Falix MySQL Engine] Connection pool notice:', err.message);
  }
}

// Neon Lakebase Postgres Connection Pool
const neonUrl = process.env.DATABASE_URL;
let neonPool = null;
let neonSyncPromise = null;

if (neonUrl && neonUrl.startsWith('postgres')) {
  try {
    neonPool = new Pool({
      connectionString: neonUrl,
      ssl: { rejectUnauthorized: false }
    });
    console.log('[Neon Postgres Engine] 🐘 Connected to Neon Lakebase Postgres (Ohio us-east-2)!');

    // Auto-sync custom bots from Neon Postgres into local SQLite memory pool
    neonSyncPromise = neonPool.query(`
      CREATE TABLE IF NOT EXISTS custom_bots (
        guild_id VARCHAR(64) PRIMARY KEY,
        owner_id VARCHAR(64) NOT NULL,
        bot_token_encrypted TEXT,
        bot_id VARCHAR(64),
        bot_name VARCHAR(128) DEFAULT 'Custom Bot',
        bot_avatar TEXT,
        custom_prefix VARCHAR(10) DEFAULT '!',
        ai_persona TEXT,
        activity_name VARCHAR(128),
        dashboard_password_hash TEXT,
        status VARCHAR(32) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS verified_github_users (
        discord_id VARCHAR(64) PRIMARY KEY,
        github_username VARCHAR(128) NOT NULL,
        verified_at BIGINT NOT NULL,
        verification_method VARCHAR(64) DEFAULT 'bio_challenge'
      );
    `).then(() => {
      return neonPool.query('SELECT * FROM custom_bots');
    }).then(res => {
      const upsert = db.prepare(`
        INSERT INTO custom_bots (
          guild_id, owner_id, bot_token_encrypted, bot_id, bot_name, bot_avatar,
          custom_prefix, ai_persona, activity_name, status, dashboard_password_hash
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(guild_id) DO UPDATE SET
          owner_id = excluded.owner_id,
          bot_id = excluded.bot_id,
          bot_name = excluded.bot_name,
          bot_avatar = excluded.bot_avatar,
          custom_prefix = excluded.custom_prefix,
          ai_persona = excluded.ai_persona,
          activity_name = excluded.activity_name,
          dashboard_password_hash = excluded.dashboard_password_hash,
          status = excluded.status,
          updated_at = CURRENT_TIMESTAMP
      `);
      for (const r of res.rows) {
        upsert.run(
          r.guild_id,
          r.owner_id,
          r.bot_token_encrypted || '',
          r.bot_id,
          r.bot_name || 'Custom Bot',
          r.bot_avatar,
          r.custom_prefix || '!',
          r.ai_persona,
          r.activity_name,
          r.status || 'active',
          r.dashboard_password_hash
        );
      }
      console.log(`[Neon Postgres Engine] 🚀 Synced ${res.rows.length} custom bots to SQLite memory pool!`);

      // Auto-sync leveling from Neon Postgres into local SQLite memory pool
      return neonPool.query(`
        CREATE TABLE IF NOT EXISTS leveling (
          discord_id VARCHAR(64) PRIMARY KEY,
          xp BIGINT DEFAULT 0,
          level INTEGER DEFAULT 1,
          messages_count INTEGER DEFAULT 0,
          last_message_at BIGINT DEFAULT 0
        );
      `).then(() => {
        return neonPool.query('SELECT * FROM leveling');
      }).then(lvlRes => {
        const upsertLevel = db.prepare(`
          INSERT INTO leveling (discord_id, xp, level, messages_count, last_message_at)
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(discord_id) DO UPDATE SET
            xp = excluded.xp,
            level = excluded.level,
            messages_count = excluded.messages_count,
            last_message_at = excluded.last_message_at
        `);
        for (const r of lvlRes.rows) {
          upsertLevel.run(
            r.discord_id,
            Number(r.xp || 0),
            Number(r.level || 1),
            Number(r.messages_count || 0),
            Number(r.last_message_at || 0)
          );
        }
        console.log(`[Neon Postgres Engine] 🚀 Synced ${lvlRes.rows.length} leveling records to SQLite memory pool!`);
      }).then(() => {
        // Auto-sync verified GitHub users from Neon Postgres into local SQLite memory pool
        return neonPool.query('SELECT * FROM verified_github_users').then(ghRes => {
          const upsertGh = db.prepare(`
            INSERT INTO verified_github_users (discord_id, github_username, verified_at, verification_method)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(discord_id) DO UPDATE SET
              github_username = excluded.github_username,
              verified_at = excluded.verified_at,
              verification_method = excluded.verification_method
          `);
          for (const r of ghRes.rows) {
            upsertGh.run(
              r.discord_id,
              r.github_username,
              Number(r.verified_at || Date.now()),
              r.verification_method || 'bio_challenge'
            );
          }
          console.log(`[Neon Postgres Engine] 🚀 Synced ${ghRes.rows.length} verified GitHub users to SQLite memory pool!`);
        }).catch(e => console.warn('[Neon GitHub Sync Warning]:', e.message));
      });
    }).catch(e => console.warn('[Neon Postgres Sync Warning]:', e.message));
  } catch (err) {
    console.warn('[Neon Postgres Engine] Failed to initialize Neon pool:', err.message);
  }
}

export function waitForNeonSync() {
  return neonSyncPromise || Promise.resolve();
}

export { neonPool };

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

  -- 9. Custom Multi-Bots (Bring Your Own Token & Made-By-Us)
  CREATE TABLE IF NOT EXISTS custom_bots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL UNIQUE,
    owner_id TEXT NOT NULL,
    bot_token_encrypted TEXT NOT NULL,
    bot_id TEXT,
    bot_name TEXT,
    bot_avatar TEXT,
    custom_prefix TEXT DEFAULT '!',
    ai_persona TEXT,
    activity_name TEXT,
    status TEXT DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    dashboard_password_hash TEXT,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 10. Staking Protocol (v5.9.0)
  CREATE TABLE IF NOT EXISTS staking (
    discord_id TEXT PRIMARY KEY,
    staked_amount INTEGER DEFAULT 0,
    last_claimed_at INTEGER DEFAULT 0,
    total_earned INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 11. Dual-CLI Handshake Tokens (v5.9.0)
  CREATE TABLE IF NOT EXISTS cli_tokens (
    token TEXT PRIMARY KEY,
    discord_id TEXT NOT NULL,
    label TEXT DEFAULT 'Krims CLI Key',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_used_at DATETIME
  );

  -- 12. Verified GitHub Profiles (v5.9.6 Anti-Impostor Verification)
  CREATE TABLE IF NOT EXISTS verified_github_users (
    discord_id TEXT PRIMARY KEY,
    github_username TEXT NOT NULL COLLATE NOCASE,
    verified_at INTEGER NOT NULL,
    verification_method TEXT DEFAULT 'bio_challenge'
  );
`);


try {
  db.exec("ALTER TABLE custom_bots ADD COLUMN dashboard_password_hash TEXT;");
} catch (_) {}

// Pre-seed Founder Krylo's verified GitHub identity
try {
  db.prepare(`
    INSERT OR IGNORE INTO verified_github_users (discord_id, github_username, verified_at, verification_method)
    VALUES ('1414143825538191373', 'krylo-60', ?, 'founder_preseed')
  `).run(Date.now());
} catch (_) {}

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
    db.prepare('INSERT OR IGNORE INTO players (discord_id) VALUES (?)').run(discordId);
    db.prepare('INSERT OR IGNORE INTO economy (discord_id, krylocoins) VALUES (?, 1000)').run(discordId);
    return { discord_id: discordId, krylocoins: 1000, bank: 0, gems: 0, daily_streak: 0, last_daily: 0, last_work: 0 };
  }
  return row;
}

export function addCoins(discordId, amount) {
  db.prepare('INSERT OR IGNORE INTO players (discord_id) VALUES (?)').run(discordId);
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


export function transferRewards(senderId, recipientId, amount, note = '') {
  if (senderId === recipientId) throw new Error("You cannot send Krims Rewards to yourself.");
  if (!amount || amount <= 0 || !Number.isInteger(amount)) throw new Error("Transfer amount must be a positive whole number.");

  const transferTx = db.transaction(() => {
    const senderBal = getBalance(senderId);
    if (senderBal.krylocoins < amount) {
      throw new Error(`Insufficient funds. Your vault contains ${senderBal.krylocoins.toLocaleString()} KR, but you tried to send ${amount.toLocaleString()} KR.`);
    }

    db.prepare('UPDATE economy SET krylocoins = krylocoins - ? WHERE discord_id = ?').run(amount, senderId);
    db.prepare('INSERT OR IGNORE INTO players (discord_id) VALUES (?)').run(recipientId);
    db.prepare(`
      INSERT INTO economy (discord_id, krylocoins) VALUES (?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET krylocoins = krylocoins + excluded.krylocoins
    `).run(recipientId, amount);

    db.prepare(`
      CREATE TABLE IF NOT EXISTS reward_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id TEXT,
        recipient_id TEXT,
        amount INTEGER,
        note TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `).run();

    db.prepare(`
      INSERT INTO reward_transactions (sender_id, recipient_id, amount, note)
      VALUES (?, ?, ?, ?)
    `).run(senderId, recipientId, amount, note);

    return {
      senderNewBalance: senderBal.krylocoins - amount,
      recipientNewBalance: getBalance(recipientId).krylocoins
    };
  });

  const res = transferTx();

  if (neonPool) {
    neonPool.query(`UPDATE economy SET krylocoins = krylocoins - $1 WHERE discord_id = $2`, [amount, senderId]).catch(() => {});
    neonPool.query(`
      INSERT INTO economy (discord_id, krylocoins) VALUES ($1, $2)
      ON CONFLICT (discord_id) DO UPDATE SET krylocoins = economy.krylocoins + EXCLUDED.krylocoins
    `, [recipientId, amount]).catch(() => {});
  }

  return res;
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

export function claimDaily(discordId, baseReward = 100) {
  const current = getBalance(discordId);
  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const lastDaily = current.last_daily || 0;

  if (now - lastDaily < ONE_DAY_MS) {
    const timeRemaining = ONE_DAY_MS - (now - lastDaily);
    return { success: false, timeRemaining };
  }

  // Check if consecutive streak (claimed within 48h)
  const isConsecutive = (now - lastDaily) < (2 * ONE_DAY_MS);
  const newStreak = isConsecutive ? (current.daily_streak || 0) + 1 : 1;
  const streakBonus = (newStreak - 1) * 20;
  const totalReward = baseReward + streakBonus;

  db.prepare(`
    UPDATE economy 
    SET krylocoins = krylocoins + ?, daily_streak = ?, last_daily = ?
    WHERE discord_id = ?
  `).run(totalReward, newStreak, now, discordId);

  if (neonPool) {
    neonPool.query(`
      UPDATE economy 
      SET krylocoins = krylocoins + $1, daily_streak = $2, last_daily = $3
      WHERE discord_id = $4
    `, [totalReward, newStreak, now, discordId]).catch(() => {});
  }

  const updated = getBalance(discordId);
  return {
    success: true,
    reward: totalReward,
    streak: newStreak,
    newBalance: updated.krylocoins
  };
}

export function transferCoins(senderId, receiverId, amount) {
  if (amount <= 0) return { success: false, error: 'Amount must be greater than 0' };
  const sender = getBalance(senderId);
  if (sender.krylocoins < amount) return { success: false, error: 'Insufficient funds' };

  removeCoins(senderId, amount);
  addCoins(receiverId, amount);
  return { success: true, newSenderBalance: getBalance(senderId).krylocoins };
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
/**
 * Formula: Required XP for Level L = 5 * (L^2) + (50 * L) + 100
 */
export function getRequiredXpForLevel(level) {
  return 5 * (level ** 2) + (50 * level) + 100;
}

export function getTotalXpForLevel(level) {
  let total = 0;
  for (let i = 0; i < level; i++) {
    total += getRequiredXpForLevel(i);
  }
  return total;
}

export function calculateLevelFromXp(totalXp) {
  let level = 0;
  let remaining = Number(totalXp) || 0;
  while (remaining >= getRequiredXpForLevel(level)) {
    remaining -= getRequiredXpForLevel(level);
    level++;
  }
  return { level, currentXp: remaining, neededXp: getRequiredXpForLevel(level) };
}

export function getUserLeveling(discordId) {
  if (!discordId) return { level: 0, xp: 0, currentXp: 0, neededXp: 100, messagesCount: 0 };
  const current = db.prepare('SELECT * FROM leveling WHERE discord_id = ?').get(discordId);
  if (!current) return { level: 0, xp: 0, currentXp: 0, neededXp: 100, messagesCount: 0 };
  const calc = calculateLevelFromXp(current.xp || 0);
  return {
    level: calc.level,
    xp: Number(current.xp || 0),
    currentXp: calc.currentXp,
    neededXp: calc.neededXp,
    messagesCount: Number(current.messages_count || 0)
  };
}

export function setUserLeveling(discordId, level, xp) {
  if (!discordId) return;
  const calc = calculateLevelFromXp(xp);
  const actualLevel = level !== undefined && level !== null ? Number(level) : calc.level;
  const actualXp = Number(xp || 0);
  
  db.prepare(`
    INSERT INTO leveling (discord_id, xp, level, messages_count, last_message_at)
    VALUES (?, ?, ?, 1, ?)
    ON CONFLICT(discord_id) DO UPDATE SET
      xp = excluded.xp,
      level = excluded.level,
      last_message_at = excluded.last_message_at
  `).run(discordId, actualXp, actualLevel, Date.now());

  if (neonPool) {
    neonPool.query(`
      INSERT INTO leveling (discord_id, xp, level, messages_count, last_message_at)
      VALUES ($1, $2, $3, 1, $4)
      ON CONFLICT (discord_id)
      DO UPDATE SET xp = $2, level = $3, last_message_at = $4
    `, [discordId, actualXp, actualLevel, Date.now()]).catch(() => {});
  }
}

export function addXp(discordId, xpToAdd, guildId = null) {
  if (!discordId) return { level: 1, xp: 0, leveledUp: false, oldLevel: 0 };

  const current = db.prepare('SELECT * FROM leveling WHERE discord_id = ?').get(discordId);
  const oldXp = current ? Number(current.xp || 0) : 0;
  const oldLevel = current ? Number(current.level || 0) : 0;
  const messagesCount = current ? Number(current.messages_count || 0) : 0;

  const newXp = oldXp + Number(xpToAdd || 0);
  const newMessagesCount = messagesCount + 1;
  const { level: newLevel, currentXp, neededXp } = calculateLevelFromXp(newXp);

  // Leveled up if new calculated level is strictly higher than previous level
  // and user has reached at least Level 1
  const leveledUp = newLevel > oldLevel && oldLevel >= 0 && newLevel >= 1;

  if (!current) {
    db.prepare(`
      INSERT INTO leveling (discord_id, xp, level, messages_count, last_message_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(discordId, newXp, newLevel, newMessagesCount, Date.now());
  } else {
    db.prepare(`
      UPDATE leveling SET xp = ?, level = ?, messages_count = ?, last_message_at = ?
      WHERE discord_id = ?
    `).run(newXp, newLevel, newMessagesCount, Date.now(), discordId);
  }

  // Asynchronously persist to Neon Postgres lakebase so levels survive all container restarts
  if (neonPool) {
    neonPool.query(`
      INSERT INTO leveling (discord_id, xp, level, messages_count, last_message_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (discord_id)
      DO UPDATE SET xp = $2, level = $3, messages_count = $4, last_message_at = $5
    `, [discordId, newXp, newLevel, newMessagesCount, Date.now()]).catch(e => {
      console.warn('[Neon Leveling Sync Error]:', e.message);
    });
  }

  return { level: newLevel, xp: newXp, currentXp, neededXp, leveledUp, oldLevel };
}

// --- MODERATION LOGS ---
export function logModeration(guildId, userId, modId, action, reason = 'No reason provided', duration = null) {
  db.prepare(`
    INSERT INTO moderation_logs (guild_id, user_id, mod_id, action, reason, duration)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(guildId, userId, modId, action, reason, duration);
}

// --- CUSTOM MULTI-BOTS (BYOT & MADE-BY-US) ---
export function saveCustomBot({
  guildId,
  ownerId,
  botTokenEncrypted,
  botId = null,
  botName = 'Custom Bot',
  botAvatar = null,
  customPrefix = '!',
  aiPersona = null,
  activityName = 'Guarding Server'
}) {
  const stmt = db.prepare(`
    INSERT INTO custom_bots (
      guild_id, owner_id, bot_token_encrypted, bot_id, bot_name, bot_avatar, custom_prefix, ai_persona, activity_name, status, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
    ON CONFLICT(guild_id) DO UPDATE SET
      owner_id = excluded.owner_id,
      bot_token_encrypted = excluded.bot_token_encrypted,
      bot_id = excluded.bot_id,
      bot_name = excluded.bot_name,
      bot_avatar = excluded.bot_avatar,
      custom_prefix = excluded.custom_prefix,
      ai_persona = excluded.ai_persona,
      activity_name = excluded.activity_name,
      status = 'active',
      updated_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(guildId, ownerId, botTokenEncrypted, botId, botName, botAvatar, customPrefix, aiPersona, activityName);
}

export function getAllActiveCustomBots() {
  return db.prepare("SELECT * FROM custom_bots WHERE status = 'active'").all();
}

export function getCustomBotByGuild(guildId) {
  return db.prepare('SELECT * FROM custom_bots WHERE guild_id = ?').get(guildId);
}

export function deleteCustomBot(guildId) {
  return db.prepare('DELETE FROM custom_bots WHERE guild_id = ?').run(guildId);
}

export function updateCustomBotStatus(guildId, status) {
  return db.prepare('UPDATE custom_bots SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE guild_id = ?').run(status, guildId);
}

export { db };
export default db;


export async function getCustomBotById(botId) {
  if (!botId) return null;
  let bot = db.prepare('SELECT * FROM custom_bots WHERE bot_id = ?').get(botId);
  if (!bot && neonPool) {
    try {
      const q = await neonPool.query('SELECT * FROM custom_bots WHERE bot_id = $1 LIMIT 1', [botId]);
      if (q.rows.length > 0) {
        const r = q.rows[0];
        try {
          db.prepare(`
            INSERT INTO custom_bots (
              guild_id, owner_id, bot_token_encrypted, bot_id, bot_name, bot_avatar,
              custom_prefix, ai_persona, activity_name, status, dashboard_password_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(guild_id) DO UPDATE SET
              bot_id = excluded.bot_id,
              bot_name = excluded.bot_name,
              dashboard_password_hash = excluded.dashboard_password_hash,
              status = excluded.status
          `).run(
            r.guild_id,
            r.owner_id,
            r.bot_token_encrypted || '',
            r.bot_id,
            r.bot_name,
            r.bot_avatar,
            r.custom_prefix || '!',
            r.ai_persona,
            r.activity_name,
            r.status || 'active',
            r.dashboard_password_hash
          );
        } catch (_) {}
        bot = db.prepare('SELECT * FROM custom_bots WHERE bot_id = ?').get(botId);
      }
    } catch (e) {
      console.warn('[getCustomBotById Neon fallback error]:', e.message);
    }
  }
  return bot;
}

export function setCustomBotPassword(botId, passwordHash) {
  if (!botId) return null;
  const res = db.prepare('UPDATE custom_bots SET dashboard_password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE bot_id = ?').run(passwordHash, botId);
  if (neonPool) {
    neonPool.query('UPDATE custom_bots SET dashboard_password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE bot_id = $2', [passwordHash, botId]).catch(e => console.warn('[Neon setCustomBotPassword error]:', e.message));
  }
  return res;
}

export function updateCustomBotConfig(botId, { customPrefix, aiPersona, activityName }) {
  if (!botId) return null;
  const res = db.prepare('UPDATE custom_bots SET custom_prefix = COALESCE(?, custom_prefix), ai_persona = COALESCE(?, ai_persona), activity_name = COALESCE(?, activity_name), updated_at = CURRENT_TIMESTAMP WHERE bot_id = ?')
    .run(customPrefix || null, aiPersona || null, activityName || null, botId);
  if (neonPool) {
    neonPool.query('UPDATE custom_bots SET custom_prefix = COALESCE($1, custom_prefix), ai_persona = COALESCE($2, ai_persona), activity_name = COALESCE($3, activity_name), updated_at = CURRENT_TIMESTAMP WHERE bot_id = $4', [customPrefix || null, aiPersona || null, activityName || null, botId]).catch(e => console.warn('[Neon updateCustomBotConfig error]:', e.message));
  }
  return res;
}

export function getKrimsRewards(discordId) {
  const row = getBalance(discordId);
  return {
    discordId,
    krimsRewards: row?.krylocoins ?? 1000,
    streak: row?.daily_streak ?? 0,
    lastDaily: row?.last_daily ?? 0
  };
}

export function addKrimsRewards(discordId, amount) {
  return addCoins(discordId, amount);
}


if (neonPool) {
  neonPool.query(`
    CREATE TABLE IF NOT EXISTS staking (
      discord_id VARCHAR(64) PRIMARY KEY,
      staked_amount BIGINT DEFAULT 0,
      last_claimed_at BIGINT DEFAULT 0,
      total_earned BIGINT DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS cli_tokens (
      token VARCHAR(128) PRIMARY KEY,
      discord_id VARCHAR(64) NOT NULL,
      label VARCHAR(128) DEFAULT 'Krims CLI Key',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_used_at TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS verified_github_users (
      discord_id VARCHAR(64) PRIMARY KEY,
      github_username VARCHAR(128) NOT NULL,
      verified_at BIGINT NOT NULL,
      verification_method VARCHAR(64) DEFAULT 'bio_challenge'
    );
  `).catch(e => console.warn('[Neon Staking/CLI Table Init Warning]:', e.message));
}



// ═══════════════════════════════════════════════════════════
// 📈 V5.9.0 STAKING ENGINE & DUAL-CLI HANDSHAKE PROTOCOL
// ═══════════════════════════════════════════════════════════

export function getStakingInfo(discordId) {
  if (!discordId) return null;
  let row = db.prepare('SELECT * FROM staking WHERE discord_id = ?').get(discordId);
  if (!row) {
    db.prepare('INSERT INTO staking (discord_id, staked_amount, last_claimed_at, total_earned) VALUES (?, 0, 0, 0)').run(discordId);
    row = { discord_id: discordId, staked_amount: 0, last_claimed_at: 0, total_earned: 0 };
  }

  const stakedAmount = Number(row.staked_amount || 0);
  const lastClaimed = Number(row.last_claimed_at || 0);
  const now = Date.now();
  let pendingYield = 0;

  // Staking yield calculation: 12.5% APY compounding continuously
  if (stakedAmount > 0 && lastClaimed > 0) {
    const elapsedSeconds = Math.max(0, Math.floor((now - lastClaimed) / 1000));
    // Yield formula: (staked * 0.125 * elapsedSeconds) / (365 * 86400)
    pendingYield = Math.floor((stakedAmount * 0.125 * elapsedSeconds) / (365 * 86400));
  }

  return {
    discordId,
    stakedAmount,
    lastClaimedAt: lastClaimed,
    totalEarned: Number(row.total_earned || 0),
    pendingYield,
    apy: 12.5
  };
}

export function stakeRewards(discordId, amount) {
  if (!discordId) throw new Error("Discord ID required.");
  if (!amount || amount <= 0 || !Number.isInteger(amount)) throw new Error("Stake amount must be a positive whole number.");

  const eco = getBalance(discordId);
  const currentLiquid = eco?.krylocoins ?? 1000;
  if (currentLiquid < amount) {
    throw new Error(`Insufficient liquid balance. You have **${currentLiquid.toLocaleString()} KR**, but tried to stake **${amount.toLocaleString()} KR**.`);
  }

  // Auto-claim any accrued yield first before increasing principle
  const currentInfo = getStakingInfo(discordId);
  let accruedClaimed = 0;
  if (currentInfo.pendingYield > 0) {
    accruedClaimed = currentInfo.pendingYield;
  }

  const now = Date.now();
  const tx = db.transaction(() => {
    // Deduct liquid
    db.prepare('UPDATE economy SET krylocoins = krylocoins - ? WHERE discord_id = ?').run(amount, discordId);
    // Add staked + claim pending yield into total_earned & update last_claimed_at
    db.prepare(`
      INSERT INTO staking (discord_id, staked_amount, last_claimed_at, total_earned)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
        staked_amount = staked_amount + excluded.staked_amount,
        total_earned = total_earned + excluded.total_earned,
        last_claimed_at = excluded.last_claimed_at
    `).run(discordId, amount, now, accruedClaimed);

    if (accruedClaimed > 0) {
      db.prepare('UPDATE economy SET krylocoins = krylocoins + ? WHERE discord_id = ?').run(accruedClaimed, discordId);
    }
  });
  tx();

  if (neonPool) {
    neonPool.query(`
      INSERT INTO staking (discord_id, staked_amount, last_claimed_at, total_earned)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(discord_id) DO UPDATE SET
        staked_amount = staking.staked_amount + $2,
        total_earned = staking.total_earned + $4,
        last_claimed_at = $3
    `, [discordId, amount, now, accruedClaimed]).catch(e => console.warn('[Neon Staking Sync Warning]:', e.message));
  }

  return {
    success: true,
    stakedAmount: amount,
    newTotalStaked: currentInfo.stakedAmount + amount,
    accruedClaimed
  };
}

export function unstakeRewards(discordId, amount) {
  if (!discordId) throw new Error("Discord ID required.");
  if (!amount || amount <= 0 || !Number.isInteger(amount)) throw new Error("Unstake amount must be a positive whole number.");

  const currentInfo = getStakingInfo(discordId);
  if (currentInfo.stakedAmount < amount) {
    throw new Error(`Insufficient staked balance. You currently have **${currentInfo.stakedAmount.toLocaleString()} KR** staked, but tried to unstake **${amount.toLocaleString()} KR**.`);
  }

  const now = Date.now();
  let accruedClaimed = currentInfo.pendingYield;

  const tx = db.transaction(() => {
    // Return unstaked amount (+ any accrued pending yield) to liquid balance
    db.prepare('UPDATE economy SET krylocoins = krylocoins + ? WHERE discord_id = ?').run(amount + accruedClaimed, discordId);
    // Deduct staked amount
    db.prepare(`
      UPDATE staking
      SET staked_amount = staked_amount - ?,
          total_earned = total_earned + ?,
          last_claimed_at = ?
      WHERE discord_id = ?
    `).run(amount, accruedClaimed, now, discordId);
  });
  tx();

  if (neonPool) {
    neonPool.query(`
      UPDATE staking
      SET staked_amount = staked_amount - $1,
          total_earned = total_earned + $2,
          last_claimed_at = $3
      WHERE discord_id = $4
    `, [amount, accruedClaimed, now, discordId]).catch(e => console.warn('[Neon Unstake Sync Warning]:', e.message));
  }

  return {
    success: true,
    unstakedAmount: amount,
    remainingStaked: currentInfo.stakedAmount - amount,
    accruedClaimed
  };
}

export function claimStakingYield(discordId) {
  const currentInfo = getStakingInfo(discordId);
  if (!currentInfo.pendingYield || currentInfo.pendingYield <= 0) {
    return {
      success: false,
      claimed: 0,
      message: "No staking yield available to claim yet. Accrual takes a short time at 12.5% APY."
    };
  }

  const claimed = currentInfo.pendingYield;
  const now = Date.now();

  const tx = db.transaction(() => {
    db.prepare('UPDATE economy SET krylocoins = krylocoins + ? WHERE discord_id = ?').run(claimed, discordId);
    db.prepare('UPDATE staking SET total_earned = total_earned + ?, last_claimed_at = ? WHERE discord_id = ?').run(claimed, now, discordId);
  });
  tx();

  if (neonPool) {
    neonPool.query(`
      UPDATE staking
      SET total_earned = total_earned + $1,
          last_claimed_at = $2
      WHERE discord_id = $3
    `, [claimed, now, discordId]).catch(e => console.warn('[Neon Claim Yield Sync Warning]:', e.message));
  }

  return {
    success: true,
    claimed,
    newTotalEarned: currentInfo.totalEarned + claimed
  };
}

export function getGlobalLeaderboard(limit = 10) {
  const rows = db.prepare(`
    SELECT 
      e.discord_id,
      e.krylocoins as liquid,
      e.bank,
      COALESCE(s.staked_amount, 0) as staked,
      (e.krylocoins + e.bank + COALESCE(s.staked_amount, 0)) as net_worth,
      e.daily_streak as streak,
      p.minecraft_ign
    FROM economy e
    LEFT JOIN staking s ON e.discord_id = s.discord_id
    LEFT JOIN players p ON e.discord_id = p.discord_id
    ORDER BY net_worth DESC
    LIMIT ?
  `).all(limit);

  return rows;
}

export function generateCliToken(discordId, label = 'Krims CLI Key') {
  if (!discordId) throw new Error("Discord ID required.");
  import('crypto').then(() => {});
  // 32-byte hex key
  const randomHex = Array.from({length: 32}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const token = `krims_cli_${randomHex}`;

  db.prepare(`
    INSERT INTO cli_tokens (token, discord_id, label)
    VALUES (?, ?, ?)
  `).run(token, discordId, label);

  if (neonPool) {
    neonPool.query(`
      INSERT INTO cli_tokens (token, discord_id, label)
      VALUES ($1, $2, $3)
    `, [token, discordId, label]).catch(e => console.warn('[Neon CLI Token Sync Warning]:', e.message));
  }

  return {
    token,
    discordId,
    label
  };
}

export function verifyCliToken(token) {
  if (!token) return null;
  const row = db.prepare('SELECT * FROM cli_tokens WHERE token = ?').get(token);
  if (row) {
    db.prepare('UPDATE cli_tokens SET last_used_at = CURRENT_TIMESTAMP WHERE token = ?').run(token);
    return {
      valid: true,
      discordId: row.discord_id,
      label: row.label
    };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════
// 🔒 GITHUB DEVELOPER OWNERSHIP VERIFICATION (v5.9.6)
// ═══════════════════════════════════════════════════════════

export function getVerifiedGitHub(discordId) {
  if (!discordId) return null;
  try {
    return db.prepare('SELECT * FROM verified_github_users WHERE discord_id = ?').get(discordId) || null;
  } catch (err) {
    console.error('[DB] getVerifiedGitHub error:', err.message);
    return null;
  }
}

export function getDiscordUserByGitHub(githubUsername) {
  if (!githubUsername) return null;
  try {
    const clean = githubUsername.trim().toLowerCase();
    return db.prepare('SELECT * FROM verified_github_users WHERE github_username = ? COLLATE NOCASE').get(clean) || null;
  } catch (err) {
    console.error('[DB] getDiscordUserByGitHub error:', err.message);
    return null;
  }
}

export function saveVerifiedGitHub(discordId, githubUsername, method = 'bio_challenge') {
  if (!discordId || !githubUsername) return false;
  const clean = githubUsername.trim().toLowerCase();
  const now = Date.now();
  try {
    db.prepare(`
      INSERT INTO verified_github_users (discord_id, github_username, verified_at, verification_method)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(discord_id) DO UPDATE SET
        github_username = excluded.github_username,
        verified_at = excluded.verified_at,
        verification_method = excluded.verification_method
    `).run(discordId, clean, now, method);

    if (neonPool) {
      neonPool.query(`
        INSERT INTO verified_github_users (discord_id, github_username, verified_at, verification_method)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT(discord_id) DO UPDATE SET
          github_username = EXCLUDED.github_username,
          verified_at = EXCLUDED.verified_at,
          verification_method = EXCLUDED.verification_method
      `, [discordId, clean, now, method]).catch(e => console.warn('[Neon GitHub Verify Sync Warning]:', e.message));
    }
    return true;
  } catch (err) {
    console.error('[DB] saveVerifiedGitHub error:', err.message);
    return false;
  }
}

export function unlinkVerifiedGitHub(discordId) {
  if (!discordId) return false;
  try {
    db.prepare('DELETE FROM verified_github_users WHERE discord_id = ?').run(discordId);
    if (neonPool) {
      neonPool.query('DELETE FROM verified_github_users WHERE discord_id = $1', [discordId]).catch(() => {});
    }
    return true;
  } catch (err) {
    console.error('[DB] unlinkVerifiedGitHub error:', err.message);
    return false;
  }
}
