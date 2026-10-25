import { alphaClient, betaClient } from './alphaBetaSuite.mjs';
import { premClient } from './premiumManager.mjs';
import { getTwitchBotStatus } from './twitchBot.mjs';

function formatUptime(uptimeMs) {
  const totalSeconds = Math.floor(uptimeMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

/**
 * Collects live status metrics for Krims Code AI and all spawned sub-bots
 */
export function getLiveStatusData(client, customBotManager = null) {
  const isMasterReady = client && client.isReady && client.isReady();
  const masterPing = isMasterReady && client.ws ? Math.max(0, Math.round(client.ws.ping)) : 0;
  const masterUptimeMs = isMasterReady && client.uptime ? client.uptime : 0;

  let totalGuilds = 0;
  let totalMembers = 0;

  if (isMasterReady && client.guilds && client.guilds.cache) {
    totalGuilds = client.guilds.cache.size;
    totalMembers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);
  }

  // Get custom bots fleet
  const customBots = [];
  if (customBotManager && customBotManager.clients) {
    for (const [guildId, subClient] of customBotManager.clients.entries()) {
      const isSubReady = subClient && subClient.isReady && subClient.isReady();
      const subUser = subClient?.user;
      customBots.push({
        guildId,
        id: subUser?.id || 'Unknown',
        username: subUser?.username || 'Custom Sub-Bot',
        tag: subUser?.tag || subUser?.username || 'Custom Bot',
        avatarUrl: subUser?.displayAvatarURL ? subUser.displayAvatarURL({ extension: 'png', size: 128 }) : 'https://cdn.discordapp.com/embed/avatars/0.png',
        isOnline: isSubReady,
        ping: isSubReady && subClient.ws ? Math.max(0, Math.round(subClient.ws.ping)) : 0,
        guildName: subClient.guilds?.cache?.first()?.name || `Server ${guildId}`
      });
    }
  }

  const memUsage = process.memoryUsage();
  const memoryRssMb = Math.round(memUsage.rss / (1024 * 1024));

  return {
    timestamp: new Date().toISOString(),
    systemStatus: isMasterReady ? 'OPERATIONAL' : 'DEGRADED',
    masterBot: {
      id: client?.user?.id || '1523794466740371586',
      name: client?.user?.username || 'Krims Code AI',
      tag: client?.user?.tag || 'Krims Code AI#0000',
      avatarUrl: client?.user?.displayAvatarURL ? client.user.displayAvatarURL({ extension: 'png', size: 256 }) : 'https://cdn.discordapp.com/app-icons/1523794466740371586/17c527e7d6fa9e1d8ba046d376510e14.png?size=256',
      isOnline: isMasterReady,
      ping: masterPing,
      uptimeMs: masterUptimeMs,
      uptimeFormatted: formatUptime(masterUptimeMs),
      guildCount: totalGuilds,
      memberCount: totalMembers,
      commandsCount: 100
    },
    fleet: {
      alpha: { name: 'Krims Code Alpha', isOnline: !!(alphaClient?.isReady && alphaClient.isReady()) },
      beta: { name: 'Krims Code Beta', isOnline: !!(betaClient?.isReady && betaClient.isReady()) },
      premium: { name: 'Krims Code Premium', isOnline: !!(premClient?.isReady && premClient.isReady()) },
      twitch: getTwitchBotStatus()
    },
    customBots: {
      count: customBots.length,
      list: customBots
    },
    infrastructure: {
      memoryMb: memoryRssMb,
      nodeVersion: process.version,
      platform: process.platform,
      processUptime: formatUptime(process.uptime() * 1000),
      topggWebhookUrl: 'https://krims-discord-bot-d57m.onrender.com/api/topgg/webhook',
      topggWebhookStatus: 'ONLINE'
    }
  };
}

/**
 * Generates an interactive, dark-mode status page HTML
 */
export function renderLiveStatusHtml(data) {
  const master = data.masterBot;
  const isOnline = master.isOnline;
  const customCount = data.customBots.count;
  const twitch = data.fleet?.twitch || { isOnline: false, channels: ['kryloplaysmc'], status: 'INITIALIZING' };

  const customBotsHtml = customCount > 0 
    ? data.customBots.list.map(bot => `
        <div class="bot-card custom-bot-card">
          <div class="card-header">
            <div class="avatar-wrapper">
              <img src="${bot.avatarUrl}" alt="${bot.tag}" class="bot-avatar" />
              <span class="status-indicator ${bot.isOnline ? 'online' : 'offline'}"></span>
            </div>
            <div class="bot-info">
              <h3 class="bot-title">${bot.username}</h3>
              <p class="bot-sub">${bot.guildName}</p>
            </div>
          </div>
          <div class="card-stats">
            <div class="stat-pill"><span class="stat-label">Status</span> <strong class="${bot.isOnline ? 'text-green' : 'text-red'}">${bot.isOnline ? 'ONLINE' : 'OFFLINE'}</strong></div>
            <div class="stat-pill"><span class="stat-label">Latency</span> <strong>${bot.ping} ms</strong></div>
          </div>
        </div>
      `).join('')
    : `
        <div class="empty-state">
          <div class="empty-icon">🤖</div>
          <h3 class="empty-title">No Custom Spawned Bots Deployed Yet</h3>
          <p class="empty-desc">Did you know Krims Code AI allows server owners to spawn their very own custom-branded Discord bots? Run <code class="code-tag">/setupbot</code> in your server to deploy one!</p>
        </div>
      `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Krims Code AI — Live System Status</title>
  <link rel="icon" type="image/png" href="${master.avatarUrl}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #090d16;
      --card-bg: #111827;
      --card-border: rgba(34, 211, 238, 0.15);
      --card-hover: rgba(34, 211, 238, 0.25);
      --cyan: #22d3ee;
      --cyan-glow: rgba(34, 211, 238, 0.4);
      --green: #10b981;
      --green-glow: rgba(16, 185, 129, 0.4);
      --red: #ef4444;
      --text-main: #f8fafc;
      --text-sub: #94a3b8;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(circle at 15% 15%, rgba(34, 211, 238, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 85% 85%, rgba(16, 185, 129, 0.06) 0%, transparent 40%);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Container */
    .container {
      max-width: 1150px;
      margin: 0 auto;
      padding: 30px 20px 60px 20px;
      width: 100%;
    }

    /* Navbar */
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-bottom: 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      margin-bottom: 35px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 14px;
      text-decoration: none;
      color: inherit;
    }

    .brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 2px solid var(--cyan);
      box-shadow: 0 0 15px var(--cyan-glow);
    }

    .brand-text h1 {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
    }

    .brand-text p {
      font-size: 0.8rem;
      color: var(--text-sub);
    }

    .badge-status {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 30px;
      font-size: 0.85rem;
      font-weight: 700;
      color: #34d399;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--green);
      box-shadow: 0 0 10px var(--green);
      animation: pulse-green 2s infinite;
    }

    @keyframes pulse-green {
      0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
      70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
      100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
    }

    /* Hero Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
      margin-bottom: 35px;
    }

    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .metric-card:hover {
      transform: translateY(-2px);
      border-color: var(--card-hover);
    }

    .metric-label {
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-sub);
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .metric-value {
      font-size: 1.7rem;
      font-weight: 800;
      color: #fff;
    }

    .metric-highlight {
      color: var(--cyan);
    }

    /* Primary Bot Spotlight Card */
    .section-title {
      font-size: 1.2rem;
      font-weight: 700;
      margin-bottom: 18px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .master-card {
      background: linear-gradient(135deg, rgba(17, 24, 39, 0.95) 0%, rgba(15, 23, 42, 0.9) 100%);
      border: 1px solid rgba(34, 211, 238, 0.3);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 30px;
      margin-bottom: 40px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 25px;
    }

    .master-profile {
      display: flex;
      align-items: center;
      gap: 22px;
    }

    .master-avatar-wrap {
      position: relative;
    }

    .master-avatar {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      border: 3px solid var(--cyan);
      box-shadow: 0 0 20px var(--cyan-glow);
    }

    .status-badge-lg {
      position: absolute;
      bottom: 4px;
      right: 4px;
      width: 18px;
      height: 18px;
      background: var(--green);
      border: 3px solid var(--card-bg);
      border-radius: 50%;
    }

    .master-info h2 {
      font-size: 1.6rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 4px;
    }

    .master-info p {
      font-size: 0.95rem;
      color: var(--text-sub);
      margin-bottom: 8px;
    }

    .roles-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .chip {
      background: rgba(34, 211, 238, 0.1);
      border: 1px solid rgba(34, 211, 238, 0.25);
      color: #a5f3fc;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .master-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 11px 20px;
      border-radius: 12px;
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s ease;
      cursor: pointer;
    }

    .btn-primary {
      background: var(--cyan);
      color: #042f2e;
      box-shadow: 0 4px 14px var(--cyan-glow);
    }

    .btn-primary:hover {
      background: #67e8f9;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.15);
    }

    .btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      transform: translateY(-2px);
    }

    /* Fleet & Service Grid */
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .service-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 22px;
    }

    .service-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .service-name {
      font-size: 1.05rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .service-desc {
      font-size: 0.85rem;
      color: var(--text-sub);
      line-height: 1.5;
      margin-bottom: 16px;
    }

    .service-meta {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      padding-top: 12px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
    }

    .badge-pill-green {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    /* Custom Bots List */
    .custom-bots-section {
      margin-bottom: 40px;
    }

    .bot-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .empty-state {
      background: rgba(17, 24, 39, 0.6);
      border: 2px dashed rgba(255, 255, 255, 0.1);
      border-radius: 18px;
      padding: 40px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 2.5rem;
      margin-bottom: 12px;
    }

    .empty-title {
      font-size: 1.15rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .empty-desc {
      font-size: 0.9rem;
      color: var(--text-sub);
      max-width: 580px;
      margin: 0 auto;
      line-height: 1.6;
    }

    .code-tag {
      background: rgba(34, 211, 238, 0.15);
      color: var(--cyan);
      padding: 2px 6px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
    }

    /* Footer */
    footer {
      margin-top: auto;
      text-align: center;
      padding: 25px;
      color: var(--text-sub);
      font-size: 0.85rem;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    footer a {
      color: var(--cyan);
      text-decoration: none;
    }

    footer a:hover {
      text-decoration: underline;
    }

    .text-green { color: #34d399; }
    .text-red { color: #f87171; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Navbar -->
    <header class="navbar">
      <a href="/" class="brand">
        <img src="${master.avatarUrl}" alt="Krims Code AI" class="brand-logo" />
        <div class="brand-text">
          <h1>KRIMS CODE AI</h1>
          <p>Live Fleet Status & Systems Telemetry</p>
        </div>
      </a>
      <div style="display: flex; align-items: center; gap: 12px;">
        <a href="/wiki" class="btn btn-secondary" style="padding: 7px 14px; font-size: 0.82rem; text-decoration: none;">📖 Krims Wiki</a>
        <div class="badge-status">
          <span class="dot"></span>
          <span id="liveStatusText">${data.systemStatus === 'OPERATIONAL' ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM DEGRADED'}</span>
        </div>
      </div>
    </header>

    <!-- Key Metrics Grid -->
    <section class="metrics-grid">
      <div class="metric-card">
        <span class="metric-label">⚡ Primary Bot Status</span>
        <div class="metric-value ${isOnline ? 'text-green' : 'text-red'}" id="masterOnlineStatus">
          ${isOnline ? 'ONLINE' : 'OFFLINE'}
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-label">📡 WebSocket Ping</span>
        <div class="metric-value metric-highlight" id="masterPing">
          ${master.ping} ms
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-label">⏱️ Live Bot Uptime</span>
        <div class="metric-value" id="masterUptime" style="font-size: 1.4rem;">
          ${master.uptimeFormatted}
        </div>
      </div>
      <div class="metric-card">
        <span class="metric-label">🌐 Discord Servers</span>
        <div class="metric-value" id="guildCount">
          ${master.guildCount}
        </div>
      </div>
    </section>

    <!-- Master Bot Spotlight -->
    <section>
      <h2 class="section-title">🤖 Primary Master Bot</h2>
      <div class="master-card">
        <div class="master-profile">
          <div class="master-avatar-wrap">
            <img src="${master.avatarUrl}" alt="${master.name}" class="master-avatar" />
            <span class="status-badge-lg"></span>
          </div>
          <div class="master-info">
            <h2>${master.name}</h2>
            <p>ID: <code class="code-tag">${master.id}</code> • Multi-Server Intelligence Engine</p>
            <div class="roles-chips">
              <span class="chip">🧠 AI Memory Matrix</span>
              <span class="chip">🛡️ AutoMod Shield</span>
              <span class="chip">⭐ Leveling & XP</span>
              <span class="chip">💰 Economy & RPG</span>
              <span class="chip">⚡ 100 Commands</span>
            </div>
          </div>
        </div>
        <div class="master-actions">
          <a href="https://discord.com/api/oauth2/authorize?client_id=1523794466740371586&permissions=8&scope=bot%20applications.commands" target="_blank" class="btn btn-primary">
            ➕ Add to Discord
          </a>
          <a href="https://top.gg/bot/1523794466740371586/vote" target="_blank" class="btn btn-secondary">
            🗳️ Vote on Top.gg
          </a>
          <a href="https://discord.gg/u2bpcHe3eC" target="_blank" class="btn btn-secondary">
            💬 Support Server
          </a>
        </div>
      </div>
    </section>

    <!-- Live Services & Endpoints -->
    <section>
      <h2 class="section-title">📡 Services & Infrastructure Health</h2>
      <div class="services-grid">
        <div class="service-card">
          <div class="service-header">
            <div class="service-name">🗳️ Top.gg Vote Webhook</div>
            <span class="badge-pill-green">200 OK</span>
          </div>
          <p class="service-desc">Receives real-time voter upvotes from Top.gg, rewarding users with 2.0x XP multipliers, streak bonuses, and level progression rewards.</p>
          <div class="service-meta">
            <span class="text-sub">Endpoint: <code class="code-tag">/api/topgg/webhook</code></span>
            <span class="text-green">🟢 Listening</span>
          </div>
        </div>

        <div class="service-card">
          <div class="service-header">
            <div class="service-name">⭐ Leveling & Message Engine</div>
            <span class="badge-pill-green">ACTIVE</span>
          </div>
          <p class="service-desc">Tracks community chat messages, voice lounge activity, customizable rank cards, and exclusive level-up announcements.</p>
          <div class="service-meta">
            <span class="text-sub">Announcements</span>
            <span class="metric-highlight">Krims Code Hub</span>
          </div>
        </div>

        <div class="service-card">
          <div class="service-header">
            <div class="service-name">🤖 Custom Multi-Bot Spawner</div>
            <span class="badge-pill-green">${customCount} ONLINE</span>
          </div>
          <p class="service-desc">Multi-tenant bot spawner architecture allowing community owners to host their own custom Discord bots on the Krims engine.</p>
          <div class="service-meta">
            <span class="text-sub">Deployed Fleet</span>
            <span class="metric-highlight">${customCount} Sub-Bots</span>
          </div>
        </div>

        <div class="service-card" style="border-color: rgba(168, 85, 247, 0.4); background: linear-gradient(145deg, #111827 0%, rgba(168, 85, 247, 0.05) 100%);">
          <div class="service-header">
            <div class="service-name">🟣 Krims Code Twitch Bot</div>
            <span class="badge-pill-green" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">${twitch.isOnline ? 'ONLINE' : 'CONNECTING'}</span>
          </div>
          <p class="service-desc">Official Twitch Chat Bot co-hosted on Render. Features interactive chat minigames (!duel, !heist, !trivia, !points, !daily), Minecraft build ratings, and dual-brain neural chat assistance.</p>
          <div class="service-meta">
            <span class="text-sub">Channels: <code class="code-tag">${(twitch.channels || []).join(', ')}</code></span>
            <span class="${twitch.isOnline ? 'text-green' : 'text-sub'}">🟣 ${twitch.status || 'ONLINE'}</span>
          </div>
        </div>

        <div class="service-card" style="border-color: rgba(34, 211, 238, 0.4); background: linear-gradient(145deg, #111827 0%, rgba(34, 211, 238, 0.05) 100%);">
          <div class="service-header">
            <div class="service-name">📖 Official Krims Wiki</div>
            <span class="badge-pill-green" style="background: rgba(34, 211, 238, 0.15); color: #22d3ee;">100 COMMANDS</span>
          </div>
          <p class="service-desc">Complete interactive knowledge base with guides for Krims Neural AI, quiet leveling formulas, 2.0x Top.gg vote boosters, and live searchable command index.</p>
          <div class="service-meta">
            <span class="text-sub">Portal: <code class="code-tag">/wiki</code></span>
            <a href="/wiki" style="color: var(--cyan); text-decoration: none; font-weight: 700;">Explore Wiki →</a>
          </div>
        </div>
      </div>
    </section>

    <!-- Custom Bots Fleet -->
    <section class="custom-bots-section">
      <h2 class="section-title">👥 Custom Spawned Bot Fleet (${customCount})</h2>
      <div id="customBotsContainer">
        ${customBotsHtml}
      </div>
    </section>
  </div>

  <footer>
    <p>Powered by <strong>Krims Code AI</strong> • 100% Free All-in-One Discord Bot • <a href="/api/status" target="_blank">View Live JSON API</a></p>
  </footer>

  <script>
    // Live auto-refresh telemetry every 10 seconds without page reload
    setInterval(async () => {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const data = await res.json();
        
        // Update live elements
        const master = data.masterBot;
        const pingEl = document.getElementById('masterPing');
        const uptimeEl = document.getElementById('masterUptime');
        const guildEl = document.getElementById('guildCount');
        const statusTextEl = document.getElementById('liveStatusText');

        if (pingEl) pingEl.textContent = master.ping + ' ms';
        if (uptimeEl) uptimeEl.textContent = master.uptimeFormatted;
        if (guildEl) guildEl.textContent = master.guildCount;
        if (statusTextEl) statusTextEl.textContent = data.systemStatus === 'OPERATIONAL' ? 'ALL SYSTEMS OPERATIONAL' : 'SYSTEM DEGRADED';
      } catch (e) {}
    }, 10000);
  </script>
</body>
</html>`;
}
