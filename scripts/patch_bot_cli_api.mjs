import fs from 'fs';

const indexPath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(indexPath, 'utf8').replace(/\r\n/g, '\n');

const target = `  // ══════════════════════════════════════════════════════════
  // 🔐 CUSTOM BOT DASHBOARD AUTH & MANAGEMENT APIs
  // ══════════════════════════════════════════════════════════`;

const replacement = `  // ══════════════════════════════════════════════════════════
  // ⚡ KRIMS CODE CLI • TERMINAL VAULT & DISCORD SYNC APIs
  // ══════════════════════════════════════════════════════════

  // 1. POST /api/cli/connect
  if (url.pathname === '/api/cli/connect' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const discordId = (payload.discordId || payload.id || '').trim();
        if (!discordId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'discordId is required' }));
        }

        const user = await client.users.fetch(discordId).catch(() => null);
        const username = user ? user.username : (payload.username || 'Guardian');

        let bonusAwarded = 0;
        try {
          db.exec(\`
            CREATE TABLE IF NOT EXISTS cli_links (
              discord_id TEXT PRIMARY KEY,
              username TEXT,
              linked_at INTEGER,
              bonus_claimed INTEGER DEFAULT 0
            );
          \`);
          const existing = db.prepare('SELECT * FROM cli_links WHERE discord_id = ?').get(discordId);
          if (!existing) {
            bonusAwarded = 1000;
            addCoins(discordId, 1000);
            db.prepare('INSERT INTO cli_links (discord_id, username, linked_at, bonus_claimed) VALUES (?, ?, ?, 1)')
              .run(discordId, username, Date.now());
          }
        } catch (_) {}

        const bal = getBalance(discordId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          discordId,
          username,
          bonusAwarded,
          balance: bal.krylocoins,
          dailyStreak: bal.daily_streak || 0
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 2. POST /api/cli/claim
  if (url.pathname === '/api/cli/claim' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body || '{}');
        const discordId = (payload.discordId || payload.id || '').trim();
        if (!discordId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: false, error: 'discordId is required. Link your Discord first with /discord connect!' }));
        }

        const result = claimDaily(discordId, 250);
        const bal = getBalance(discordId);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          ok: true,
          claimed: result.success,
          reward: result.reward || 0,
          streak: result.streak || bal.daily_streak || 1,
          timeRemaining: result.timeRemaining || 0,
          balance: bal.krylocoins
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false, error: err.message }));
      }
    });
    return;
  }

  // 3. GET /api/cli/balance
  if (url.pathname === '/api/cli/balance' && req.method === 'GET') {
    const discordId = (url.searchParams.get('discordId') || url.searchParams.get('id') || '').trim();
    if (!discordId) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ ok: false, error: 'discordId is required' }));
    }
    const bal = getBalance(discordId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      ok: true,
      discordId,
      balance: bal.krylocoins,
      streak: bal.daily_streak || 0,
      bank: bal.bank || 0
    }));
    return;
  }

  // ══════════════════════════════════════════════════════════
  // 🔐 CUSTOM BOT DASHBOARD AUTH & MANAGEMENT APIs
  // ══════════════════════════════════════════════════════════`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(indexPath, content, 'utf8');
  console.log('SUCCESS: Injected CLI APIs into index.js');
} else {
  console.error('Target not found in index.js');
}
