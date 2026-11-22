
// ==========================================
// GUILD SETTINGS PERSISTENCE (POSTGRES + SQLITE)
// ==========================================
export async function saveGuildSettings(guildId, config) {
  if (!guildId || !config) return false;
  const strGuildId = String(guildId);

  // 1. Neon Lakebase Postgres (Primary Cloud DB)
  if (neonPool) {
    try {
      await neonPool.query(`
        INSERT INTO guild_settings (guild_id, config_json, updated_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (guild_id)
        DO UPDATE SET config_json = $2, updated_at = CURRENT_TIMESTAMP
      `, [strGuildId, JSON.stringify(config)]);
    } catch (e) {
      console.warn('[Neon saveGuildSettings error]:', e.message);
    }
  }

  // 2. SQLite local fallback
  try {
    const stmt = db.prepare(`
      INSERT INTO server_config (guild_id, prefix, welcome_channel, rules_channel, logs_channel, tickets_category, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(guild_id) DO UPDATE SET
        prefix=excluded.prefix,
        welcome_channel=excluded.welcome_channel,
        rules_channel=excluded.rules_channel,
        logs_channel=excluded.logs_channel,
        tickets_category=excluded.tickets_category,
        updated_at=CURRENT_TIMESTAMP
    `);
    stmt.run(
      strGuildId,
      config.prefix || '!',
      config.welcomeChannel || null,
      config.rulesChannel || null,
      config.modLogChannel || null,
      config.ticketChannel || null
    );
  } catch (e) {
    console.warn('[SQLite saveGuildSettings error]:', e.message);
  }

  return true;
}

export async function getGuildSettings(guildId) {
  if (!guildId) return null;
  const strGuildId = String(guildId);

  // 1. Neon Lakebase Postgres (Primary Cloud DB)
  if (neonPool) {
    try {
      const res = await neonPool.query('SELECT config_json, updated_at FROM guild_settings WHERE guild_id = $1 LIMIT 1', [strGuildId]);
      if (res.rows.length > 0) {
        return { settings: res.rows[0].config_json, updatedAt: res.rows[0].updated_at };
      }
    } catch (e) {
      console.warn('[Neon getGuildSettings error]:', e.message);
    }
  }

  // 2. Fallback to SQLite
  try {
    const row = db.prepare('SELECT * FROM server_config WHERE guild_id = ?').get(strGuildId);
    if (row) {
      return { settings: row, updatedAt: row.updated_at };
    }
  } catch (e) {}

  return null;
}
