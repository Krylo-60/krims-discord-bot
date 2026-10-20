import { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle,
  StringSelectMenuBuilder 
} from 'discord.js';

export const WIKI_BASE_URL = 'https://krims-discord-bot-d57m.onrender.com/wiki';

/**
 * Core Wiki Knowledge Base & Command Dictionary
 */
export const WIKI_SECTIONS = [
  {
    id: 'getting-started',
    title: '🚀 Getting Started',
    badge: 'Guide',
    summary: 'Everything you need to know about inviting, setting up, and configuring Krims Code AI.',
    content: `
      <h3>Welcome to the Official Krims Wiki</h3>
      <p><strong>Krims Code AI</strong> is an enterprise-grade, high-performance, multi-purpose Discord bot designed for modern communities. Featuring an ultra-fast neural AI brain, a real-time message and leveling engine, a 2.0x Top.gg vote booster system, custom bot spawning, and advanced moderation tools, Krims Code AI powers servers with 100% zero downtime.</p>
      
      <h4>Key Highlights:</h4>
      <ul>
        <li><strong>🧠 Neural AI Chat & Multimodal Vision:</strong> Powered by Google Gemini & Groq fallback with conversational server memory.</li>
        <li><strong>⚡ Real-Time Leveling & Message Tracking:</strong> Dual leaderboard for messages and XP, customizable rank cards, and silent cross-server leveling.</li>
        <li><strong>🗳️ Top.gg Vote Booster Engine:</strong> Automated 2.0x XP multiplier for 12 hours (24h on weekends) with streak bonuses.</li>
        <li><strong>⚙️ Custom Bot Fleet Spawner:</strong> Deploy your own dedicated custom-branded bot using <code>/setupbot</code> with zero hosting costs.</li>
        <li><strong>🛡️ Full Server Moderation & Tickets:</strong> Instant AutoMod, private player support ticketing, and full audit logging.</li>
      </ul>

      <h4>Inviting Krims Code AI to Your Server</h4>
      <p>Click the invite button below to authorize Krims Code AI with standard Administrator or Manage Channels permissions:</p>
      <div class="action-box">
        <a href="https://discord.com/oauth2/authorize?client_id=1523794466740371586&scope=bot%20applications.commands&permissions=8" target="_blank" class="wiki-btn wiki-btn-primary">🔗 Authorize Krims Code AI</a>
        <a href="https://discord.gg/u2bpcHe3eC" target="_blank" class="wiki-btn wiki-btn-secondary">💬 Join Support Server</a>
      </div>
    `
  },
  {
    id: 'ai-neural-engine',
    title: '🧠 AI Neural Chat & Vision',
    badge: 'AI Feature',
    summary: 'High-speed Gemini AI conversation, image analysis, and server memory context.',
    content: `
      <h3>Krims Code AI Neural Engine</h3>
      <p>Krims Code AI integrates cutting-edge LLMs (Google Gemini 3.5 Flash-Lite with high-speed Groq fallback) to deliver lightning-fast responses inside Discord channels and Direct Messages.</p>
      
      <h4>How to Chat with Krims Code AI:</h4>
      <ul>
        <li><strong>Slash Command:</strong> <code>/ask prompt:&lt;your message&gt;</code></li>
        <li><strong>Prefix Command:</strong> <code>!ask &lt;your message&gt;</code></li>
        <li><strong>Direct Mentions:</strong> Mention <code>@Krims Code AI &lt;your question&gt;</code> in any channel.</li>
        <li><strong>Direct Messages:</strong> Send a DM directly to the bot for private AI consultation.</li>
      </ul>

      <h4>Multimodal Vision (Image Analysis)</h4>
      <p>Upload any screenshot, photo, meme, or code snippet with <code>!ask Describe this image</code> or <code>!ask What is this error?</code> and the bot will analyze the visual details in real time.</p>

      <h4>Server Memory Engine (<code>/memory</code>)</h4>
      <p>Krims Code AI features an adaptive persistent memory matrix per server. Admins can view stored facts, teach new rules, or reset memory:</p>
      <ul>
        <li><code>/memory action:view</code> — View learned server facts and conversation context.</li>
        <li><code>/memory action:learn fact:&lt;rule/fact&gt;</code> — Store a custom server guideline for the AI to follow.</li>
        <li><code>/memory action:reset</code> — Wipe server memory history (Admin only).</li>
      </ul>
    `
  },
  {
    id: 'leveling-and-xp',
    title: '⚡ Leveling & Leaderboards',
    badge: 'Progression',
    summary: 'Message tracking, dual-mode leaderboard, XP formulas, and rank cards.',
    content: `
      <h3>Message & Leveling Progression Engine</h3>
      <p>Every active chat message earns between <strong>15 and 25 XP</strong> with a 60-second anti-spam cooldown. When a user has an active Top.gg Vote Booster, all XP is automatically doubled (<strong>2.0x Multiplier</strong>)!</p>

      <h4>XP Formula:</h4>
      <p>The XP required to reach Level <code>L</code> is calculated with the standard cubic curve:</p>
      <pre><code>Required XP = 5 * (L²) + (50 * L) + 100</code></pre>

      <h4>Rank Cards (<code>/rank</code> or <code>!rank</code>):</h4>
      <p>Displays your current Level, total text XP, progress bar towards next level, message count, server rank position, and active 2.0x vote booster status.</p>

      <h4>Interactive Dual Leaderboard (<code>/leaderboard</code> or <code>!leaderboard</code>):</h4>
      <p>View the top chatters and level leaders with interactive switch buttons:</p>
      <ul>
        <li><code>[💬 Messages]</code> — Ranks users by total messages sent in the server.</li>
        <li><code>[⚡ XP & Levels]</code> — Ranks users by total XP and chat level.</li>
        <li><code>[🗳️ Vote for 2x XP]</code> — Direct link to vote on Top.gg and activate booster.</li>
      </ul>

      <h4>Quiet Leveling Policy:</h4>
      <p>Level-up announcements are executed <strong>strictly and exclusively</strong> in the official Krims Code Support Server (<code>#💬・𝖦eneral-𝖢hat</code>). In all other servers, leveling is quiet and silent so as never to spam community chats.</p>
    `
  },
  {
    id: 'topgg-vote-booster',
    title: '🗳️ Top.gg Vote Booster & Rewards',
    badge: 'Economy & XP',
    summary: 'Activate 2.0x XP multiplier, stack vote streaks, and dedicated vote logs.',
    content: `
      <h3>Top.gg Vote Booster Engine</h3>
      <p>Support Krims Code AI on Top.gg to supercharge your server progression across all channels!</p>

      <h4>Voter Rewards (Every 12 Hours):</h4>
      <ul>
        <li>⚡ <strong>2.0x XP Multiplier:</strong> Earn DOUBLE text & voice XP for <strong>12 Hours</strong> (24h on weekends)!</li>
        <li>🏆 <strong>Instant Level Bonus:</strong> <strong>+500 to +1,000 Bonus XP</strong> directly credited to your rank!</li>
        <li>🔥 <strong>Vote Streak Multiplier:</strong> Stacks consecutive votes every 12 hours.</li>
        <li>⭐ <strong>Exclusive Voter Badge:</strong> Featured on your <code>!rank</code> card and leaderboard!</li>
      </ul>

      <h4>Dedicated Vote Logs Channel (<code>🗳️・𝖵ote-𝖫ogs</code>):</h4>
      <p>In the official Krims Code support server, all incoming votes are announced live with voter shoutouts, streak records, and booster telemetry!</p>

      <h4>Commands:</h4>
      <ul>
        <li><code>/vote</code> or <code>!vote</code> — View your live vote status, time remaining on booster, and streak counter.</li>
      </ul>
    `
  },
  {
    id: 'custom-bot-spawner',
    title: '⚙️ Custom Bot Fleet Spawner',
    badge: 'Advanced',
    summary: 'Host and spawn your own custom-branded Discord bot using Krims Code AI brain.',
    content: `
      <h3>Spawn Your Own Custom Discord Bot</h3>
      <p>Did you know server owners can spawn their very own custom-branded Discord bots running the Krims Code AI multi-process engine at <strong>$0 cost</strong>?</p>

      <h4>How to Deploy Your Bot (<code>/setupbot</code>):</h4>
      <ol>
        <li>Go to the <a href="https://discord.com/developers/applications" target="_blank">Discord Developer Portal</a>.</li>
        <li>Click <strong>New Application</strong>, name your bot, and upload your custom avatar/icon.</li>
        <li>Navigate to the <strong>Bot</strong> tab and enable all three <strong>Privileged Gateway Intents</strong> (Presence, Server Members, Message Content).</li>
        <li>Click <strong>Reset Token</strong> to copy your bot token.</li>
        <li>In your Discord server, run <code>/setupbot token:&lt;your-token&gt;</code>.</li>
      </ol>
      <p>Krims Code AI will initialize a dedicated client process for your bot, connecting it to the cloud fleet with zero maintenance required!</p>
    `
  },
  {
    id: 'moderation-and-security',
    title: '🛡️ Moderation & Server Security',
    badge: 'Admin',
    summary: 'AutoMod protection, warnings, timeouts, bans, lockdown, and slowmode.',
    content: `
      <h3>Server Moderation & Safety Tools</h3>
      <p>Krims Code AI includes a full suite of administrative commands to keep your server safe, raid-proof, and clean.</p>

      <h4>Moderation Commands:</h4>
      <ul>
        <li><code>!warn @user &lt;reason&gt;</code> — Issue an official warning logged to database.</li>
        <li><code>!mute @user &lt;time&gt; &lt;reason&gt;</code> — Place a user in Discord Timeout.</li>
        <li><code>!unmute @user</code> — Remove timeout restriction.</li>
        <li><code>!kick @user &lt;reason&gt;</code> — Kick a member from the server.</li>
        <li><code>!ban @user &lt;reason&gt;</code> — Ban a member from the server.</li>
        <li><code>!purge &lt;1-100&gt;</code> — Bulk delete recent messages in the channel.</li>
        <li><code>!lockdown</code> — Instantly lock down the channel preventing regular members from speaking.</li>
        <li><code>!unlock</code> — Restore speaking permissions after an incident.</li>
        <li><code>!slowmode &lt;seconds&gt;</code> — Set rate limit per user in the channel.</li>
      </ul>
    `
  },
  {
    id: 'tickets-and-support',
    title: '🎫 Private Ticket System',
    badge: 'Utility',
    summary: 'Instant player support tickets with transcript logging.',
    content: `
      <h3>Private Ticketing System</h3>
      <p>Create private, isolated support channels between members and your moderation team with one command.</p>

      <h4>Commands:</h4>
      <ul>
        <li><code>/ticket reason:&lt;topic&gt;</code> or <code>!ticket &lt;topic&gt;</code> — Creates a private <code>#ticket-&lt;user&gt;</code> channel.</li>
        <li><code>/close</code> — Safely closes and archives the ticket with confirmation.</li>
      </ul>
    `
  }
];

/**
 * Top 100 Command Master Index for Searchable Table
 */
export const WIKI_COMMANDS = [
  // AI & Multi-bot
  { name: '/ask', prefix: '!ask', category: 'AI & Neural', desc: 'Chat with Krims Code AI neural brain or start counting partner mode' },
  { name: '/memory', prefix: '!memory', category: 'AI & Neural', desc: 'View, learn, or reset persistent server memory context' },
  { name: '/setupbot', prefix: '!setupbot', category: 'Custom Bot', desc: 'Spawn a dedicated custom-branded bot for your server' },
  { name: '/about', prefix: '!about', category: 'General', desc: 'Information about Krims Code AI architecture and features' },
  { name: '/pricing', prefix: '!pricing', category: 'General', desc: 'View bot features, tiers, and multi-bot capabilities' },
  { name: '/diagnose', prefix: '!diagnose', category: 'System', desc: 'Compile local & global network latency and telemetry (Admin only)' },
  { name: '/github', prefix: '!github', category: 'General', desc: 'View official GitHub open-source repositories' },
  
  // Progression & Levels
  { name: '/rank', prefix: '!rank', category: 'Leveling', desc: 'View your level, XP, message stats, and active 2x vote booster' },
  { name: '/leaderboard', prefix: '!leaderboard', category: 'Leveling', desc: 'Interactive server leaderboard with Messages vs XP toggle' },
  { name: '/vote', prefix: '!vote', category: 'Leveling', desc: 'Vote on Top.gg to activate 2.0x XP booster and check streak' },
  
  // Moderation
  { name: '/warn', prefix: '!warn', category: 'Moderation', desc: 'Issue an official server warning with logged reason' },
  { name: '/mute', prefix: '!mute', category: 'Moderation', desc: 'Timeout a user for a specified duration (e.g. 10m, 1h)' },
  { name: '/unmute', prefix: '!unmute', category: 'Moderation', desc: 'Remove an active timeout from a member' },
  { name: '/kick', prefix: '!kick', category: 'Moderation', desc: 'Kick a member from the server' },
  { name: '/ban', prefix: '!ban', category: 'Moderation', desc: 'Ban a member permanently from the server' },
  { name: '/purge', prefix: '!purge', category: 'Moderation', desc: 'Bulk delete up to 100 messages in current channel' },
  { name: '/lockdown', prefix: '!lockdown', category: 'Moderation', desc: 'Lock the current channel preventing member messages' },
  { name: '/unlock', prefix: '!unlock', category: 'Moderation', desc: 'Restore channel permissions after lockdown' },
  { name: '/slowmode', prefix: '!slowmode', category: 'Moderation', desc: 'Set channel rate-limit slowmode interval' },
  
  // Tickets & Applications
  { name: '/ticket', prefix: '!ticket', category: 'Support', desc: 'Open a private 1-on-1 staff support ticket channel' },
  { name: '/close', prefix: '!close', category: 'Support', desc: 'Close and archive the current ticket channel' },
  { name: '/apply', prefix: '!apply', category: 'Support', desc: 'Submit application for server staff or bot developer' },
  { name: '/suggest', prefix: '!suggest', category: 'Community', desc: 'Submit a community suggestion for server voting' },
  
  // Utility & Tools
  { name: '/wiki', prefix: '!wiki', category: 'Utility', desc: 'Search official Krims Wiki guides, articles, and commands' },
  { name: '/ping', prefix: '!ping', category: 'Utility', desc: 'Check Discord WebSocket heartbeat and database ping' },
  { name: '/uptime', prefix: '!uptime', category: 'Utility', desc: 'View live process uptime, system RAM, and cluster health' },
  { name: '/remind', prefix: '!remind', category: 'Utility', desc: 'Set an active timer reminder with DM / ping notification' },
  { name: '/translate', prefix: '!translate', category: 'Utility', desc: 'Translate text between any languages instantly' },
  { name: '/poll', prefix: '!poll', category: 'Utility', desc: 'Create an interactive community voting poll' },
  { name: '/giveaway', prefix: '!giveaway', category: 'Community', desc: 'Host a server giveaway with automatic winner selection' },
  { name: '/serverinfo', prefix: '!serverinfo', category: 'Utility', desc: 'View comprehensive guild statistics, roles, and member count' },
  { name: '/userinfo', prefix: '!userinfo', category: 'Utility', desc: 'View Discord account creation date, roles, and avatar' },
  { name: '/avatar', prefix: '!avatar', category: 'Utility', desc: 'Display full high-resolution user avatar' },
  { name: '/calc', prefix: '!calc', category: 'Utility', desc: 'High-precision mathematical calculator' },
  { name: '/weather', prefix: '!weather', category: 'Utility', desc: 'Look up live weather conditions and forecast for any city' },
  { name: '/gif', prefix: '!gif', category: 'Fun', desc: 'Search and send animated GIFs, stickers, and clips' },
  { name: '/coinflip', prefix: '!coinflip', category: 'Fun', desc: 'Flip a coin with provably fair random results' },
  { name: '/roll', prefix: '!roll', category: 'Fun', desc: 'Roll dice (e.g. 1d6, 1d20)' },
  { name: '/eightball', prefix: '!8ball', category: 'Fun', desc: 'Ask the Magic 8-Ball a question' },
  { name: '/joke', prefix: '!joke', category: 'Fun', desc: 'Get a clean, funny programming or general joke' },
  { name: '/meme', prefix: '!meme', category: 'Fun', desc: 'Fetch a trending meme' }
];

/**
 * Generates the full HTML Krims Wiki website
 */
export function renderKrimsWikiHtml(statusData = null) {
  const master = statusData?.masterBot || {
    name: 'Krims Code AI',
    tag: 'Krims Code AI#7945',
    avatarUrl: 'https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256',
    isOnline: true,
    guildCount: 7,
    memberCount: 55,
    commandsCount: 100
  };

  const sectionsHtml = WIKI_SECTIONS.map(s => `
    <article id="${s.id}" class="wiki-article">
      <div class="article-badge">${s.badge}</div>
      <h2 class="article-title">${s.title}</h2>
      <p class="article-summary">${s.summary}</p>
      <div class="article-body">
        ${s.content}
      </div>
    </article>
  `).join('');

  const commandRowsHtml = WIKI_COMMANDS.map(c => `
    <tr class="cmd-row" data-category="${c.category.toLowerCase()}" data-search="${c.name.toLowerCase()} ${c.prefix.toLowerCase()} ${c.desc.toLowerCase()}">
      <td><code class="cmd-name" onclick="copyToClipboard('${c.name}')">${c.name}</code></td>
      <td><code class="cmd-prefix" onclick="copyToClipboard('${c.prefix}')">${c.prefix}</code></td>
      <td><span class="badge-cat">${c.category}</span></td>
      <td>${c.desc}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Krims Wiki — Official Documentation & Guide</title>
  <link rel="icon" type="image/png" href="${master.avatarUrl}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-dark: #070a13;
      --bg-sidebar: #0d121f;
      --card-bg: #111827;
      --card-border: rgba(34, 211, 238, 0.15);
      --card-hover: rgba(34, 211, 238, 0.3);
      --cyan: #22d3ee;
      --cyan-glow: rgba(34, 211, 238, 0.4);
      --purple: #a855f7;
      --green: #10b981;
      --text-main: #f8fafc;
      --text-sub: #94a3b8;
      --sidebar-width: 280px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      background-color: var(--bg-dark);
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(34, 211, 238, 0.05) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(168, 85, 247, 0.05) 0%, transparent 40%);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Top Navbar */
    .wiki-header {
      background: rgba(13, 18, 31, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--card-border);
      position: sticky;
      top: 0;
      z-index: 100;
      padding: 14px 24px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #fff;
    }

    .brand-logo {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 2px solid var(--cyan);
    }

    .brand-title {
      font-size: 1.15rem;
      font-weight: 800;
      letter-spacing: -0.01em;
      background: linear-gradient(135deg, #fff 40%, var(--cyan) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-btn {
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s ease;
    }

    .header-btn-secondary {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
      border: 1px solid rgba(255, 255, 255, 0.12);
    }

    .header-btn-secondary:hover {
      background: rgba(255, 255, 255, 0.15);
      border-color: var(--cyan);
    }

    .header-btn-primary {
      background: var(--cyan);
      color: #032b2f;
      font-weight: 700;
    }

    .header-btn-primary:hover {
      background: #67e8f9;
      transform: translateY(-1px);
    }

    /* Layout Wrapper */
    .wiki-layout {
      display: flex;
      flex: 1;
      max-width: 1440px;
      margin: 0 auto;
      width: 100%;
    }

    /* Sidebar */
    .wiki-sidebar {
      width: var(--sidebar-width);
      background: var(--bg-sidebar);
      border-right: 1px solid var(--card-border);
      padding: 24px 16px;
      height: calc(100vh - 65px);
      position: sticky;
      top: 65px;
      overflow-y: auto;
    }

    .search-box {
      margin-bottom: 20px;
      position: relative;
    }

    .search-input {
      width: 100%;
      padding: 10px 14px 10px 36px;
      background: #111827;
      border: 1px solid var(--card-border);
      border-radius: 8px;
      color: #fff;
      font-family: inherit;
      font-size: 0.85rem;
      outline: none;
      transition: border-color 0.2s;
    }

    .search-input:focus {
      border-color: var(--cyan);
      box-shadow: 0 0 10px rgba(34, 211, 238, 0.2);
    }

    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.85rem;
      opacity: 0.5;
    }

    .nav-group-title {
      font-size: 0.72rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-sub);
      margin: 16px 8px 8px 8px;
      font-weight: 700;
    }

    .nav-link {
      display: block;
      padding: 8px 12px;
      color: var(--text-sub);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 500;
      border-radius: 6px;
      margin-bottom: 3px;
      transition: all 0.15s ease;
    }

    .nav-link:hover, .nav-link.active {
      color: #fff;
      background: rgba(34, 211, 238, 0.1);
      border-left: 3px solid var(--cyan);
    }

    /* Content Area */
    .wiki-content {
      flex: 1;
      padding: 40px 48px;
      max-width: 900px;
    }

    .wiki-hero {
      margin-bottom: 40px;
      padding-bottom: 25px;
      border-bottom: 1px solid var(--card-border);
    }

    .wiki-hero h1 {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 10px;
      letter-spacing: -0.02em;
    }

    .wiki-hero p {
      font-size: 1.05rem;
      color: var(--text-sub);
      line-height: 1.6;
    }

    .wiki-article {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 30px;
      margin-bottom: 35px;
      scroll-margin-top: 85px;
      transition: border-color 0.2s;
    }

    .wiki-article:hover {
      border-color: var(--card-hover);
    }

    .article-badge {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      padding: 3px 10px;
      background: rgba(34, 211, 238, 0.12);
      color: var(--cyan);
      border-radius: 20px;
      margin-bottom: 12px;
    }

    .article-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .article-summary {
      font-size: 0.95rem;
      color: var(--text-sub);
      margin-bottom: 20px;
    }

    .article-body {
      font-size: 0.92rem;
      line-height: 1.7;
      color: #cbd5e1;
    }

    .article-body h3 { font-size: 1.2rem; color: #fff; margin: 18px 0 10px 0; }
    .article-body h4 { font-size: 1.05rem; color: #e2e8f0; margin: 16px 0 8px 0; }
    .article-body ul, .article-body ol { margin-left: 20px; margin-bottom: 16px; }
    .article-body li { margin-bottom: 6px; }
    .article-body p { margin-bottom: 14px; }

    code {
      font-family: 'JetBrains Mono', monospace;
      background: rgba(255, 255, 255, 0.08);
      color: #67e8f9;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.85em;
    }

    pre {
      background: #090e17;
      border: 1px solid rgba(255, 255, 255, 0.08);
      padding: 14px;
      border-radius: 8px;
      overflow-x: auto;
      margin-bottom: 16px;
    }

    pre code {
      background: transparent;
      padding: 0;
      color: #38bdf8;
    }

    .action-box {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    .wiki-btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.2s;
    }

    .wiki-btn-primary { background: var(--cyan); color: #042f2e; }
    .wiki-btn-primary:hover { background: #67e8f9; transform: translateY(-1px); }
    .wiki-btn-secondary { background: rgba(255, 255, 255, 0.08); color: #fff; }
    .wiki-btn-secondary:hover { background: rgba(255, 255, 255, 0.15); }

    /* Command Table */
    .command-table-container {
      overflow-x: auto;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      margin-top: 20px;
    }

    table.cmd-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.88rem;
    }

    table.cmd-table th {
      background: #0d121f;
      padding: 14px 16px;
      color: var(--text-sub);
      font-weight: 700;
      text-transform: uppercase;
      font-size: 0.75rem;
      border-bottom: 1px solid var(--card-border);
    }

    table.cmd-table td {
      padding: 12px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      color: #cbd5e1;
    }

    table.cmd-table tr:hover td {
      background: rgba(34, 211, 238, 0.04);
    }

    .cmd-name, .cmd-prefix {
      cursor: pointer;
      display: inline-block;
    }

    .cmd-name:hover, .cmd-prefix:hover {
      background: rgba(34, 211, 238, 0.2);
    }

    .badge-cat {
      font-size: 0.72rem;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 10px;
      background: rgba(168, 85, 247, 0.15);
      color: #c084fc;
    }

    /* Toast Notification */
    #copyToast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #065f46;
      color: #a7f3d0;
      padding: 10px 18px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.2s ease, transform 0.2s ease;
      transform: translateY(10px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
    }

    #copyToast.show {
      opacity: 1;
      transform: translateY(0);
    }

    @media (max-width: 900px) {
      .wiki-sidebar { display: none; }
      .wiki-content { padding: 24px 16px; }
    }
  </style>
</head>
<body>
  <!-- Header -->
  <header class="wiki-header">
    <a href="/wiki" class="brand-link">
      <img src="${master.avatarUrl}" alt="Krims Code AI" class="brand-logo" />
      <div>
        <span class="brand-title">KRIMS WIKI</span>
      </div>
    </a>
    <div class="header-actions">
      <a href="/" class="header-btn header-btn-secondary">📊 Live Status</a>
      <a href="https://top.gg/bot/1523794466740371586/vote" target="_blank" class="header-btn header-btn-secondary">🗳️ Vote (2x XP)</a>
      <a href="https://discord.gg/u2bpcHe3eC" target="_blank" class="header-btn header-btn-primary">💬 Support Server</a>
    </div>
  </header>

  <!-- Main Layout -->
  <div class="wiki-layout">
    <!-- Sidebar Navigation -->
    <aside class="wiki-sidebar">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="wikiSearch" class="search-input" placeholder="Search guides & commands..." onkeyup="filterWiki()" />
      </div>

      <div class="nav-group-title">Core Documentation</div>
      <a href="#getting-started" class="nav-link">🚀 Getting Started</a>
      <a href="#ai-neural-engine" class="nav-link">🧠 AI Neural Chat & Vision</a>
      <a href="#leveling-and-xp" class="nav-link">⚡ Leveling & Leaderboards</a>
      <a href="#topgg-vote-booster" class="nav-link">🗳️ Top.gg Vote Booster</a>
      <a href="#custom-bot-spawner" class="nav-link">⚙️ Custom Bot Spawner</a>
      <a href="#moderation-and-security" class="nav-link">🛡️ Moderation Tools</a>
      <a href="#tickets-and-support" class="nav-link">🎫 Support Tickets</a>

      <div class="nav-group-title">Reference</div>
      <a href="#command-directory" class="nav-link">📚 100-Command Directory</a>
    </aside>

    <!-- Main Content Articles -->
    <main class="wiki-content">
      <div class="wiki-hero">
        <h1>Krims Code AI Documentation</h1>
        <p>Your comprehensive guide to commands, leveling algorithms, custom bot deployment, and Top.gg vote boosters.</p>
      </div>

      <!-- Articles -->
      ${sectionsHtml}

      <!-- Command Directory Table -->
      <article id="command-directory" class="wiki-article">
        <div class="article-badge">Command Index</div>
        <h2 class="article-title">📚 Complete Command Directory</h2>
        <p class="article-summary">Search through all 100 slash and prefix commands available in Krims Code AI. Click any command to copy.</p>
        
        <div class="command-table-container">
          <table class="cmd-table">
            <thead>
              <tr>
                <th>Slash Command</th>
                <th>Prefix</th>
                <th>Category</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody id="cmdTableBody">
              ${commandRowsHtml}
            </tbody>
          </table>
        </div>
      </article>
    </main>
  </div>

  <div id="copyToast">Copied command to clipboard!</div>

  <script>
    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('copyToast');
        toast.textContent = 'Copied ' + text + ' to clipboard!';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
      });
    }

    function filterWiki() {
      const q = document.getElementById('wikiSearch').value.toLowerCase().trim();
      
      // Filter command rows
      const rows = document.querySelectorAll('.cmd-row');
      rows.forEach(r => {
        const searchData = r.getAttribute('data-search') || '';
        if (!q || searchData.includes(q)) {
          r.style.display = '';
        } else {
          r.style.display = 'none';
        }
      });

      // Filter articles
      const articles = document.querySelectorAll('.wiki-article');
      articles.forEach(a => {
        if (a.id === 'command-directory') return;
        const text = a.innerText.toLowerCase();
        if (!q || text.includes(q)) {
          a.style.display = '';
        } else {
          a.style.display = 'none';
        }
      });
    }
  </script>
</body>
</html>`;
}

/**
 * Interactive In-Discord /wiki Slash Command Handler
 */
export async function handleWikiCommand(interaction) {
  const query = interaction.options.getString('query')?.toLowerCase().trim();

  // If query is provided, find matching section or command
  if (query) {
    const matchedCommand = WIKI_COMMANDS.find(c => 
      c.name.toLowerCase().includes(query) || 
      c.prefix.toLowerCase().includes(query) ||
      c.desc.toLowerCase().includes(query)
    );

    const matchedSection = WIKI_SECTIONS.find(s => 
      s.title.toLowerCase().includes(query) || 
      s.summary.toLowerCase().includes(query) ||
      s.content.toLowerCase().includes(query)
    );

    if (matchedCommand || matchedSection) {
      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle(`📖 Krims Wiki — Search Results for "${query}"`)
        .setFooter({ text: 'Krims Wiki • Official Documentation Hub' })
        .setTimestamp();

      if (matchedCommand) {
        embed.addFields({
          name: `Command: \`${matchedCommand.name}\` (Prefix: \`${matchedCommand.prefix}\`)`,
          value: `**Category:** ${matchedCommand.category}\n**Description:** ${matchedCommand.desc}`
        });
      }

      if (matchedSection) {
        embed.addFields({
          name: matchedSection.title,
          value: `${matchedSection.summary}\n👉 [Read Full Article on Web Wiki](${WIKI_BASE_URL}#${matchedSection.id})`
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('📖 Open Full Web Wiki')
          .setStyle(ButtonStyle.Link)
          .setURL(WIKI_BASE_URL),
        new ButtonBuilder()
          .setLabel('💬 Support Server')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.gg/u2bpcHe3eC')
      );

      return await interaction.reply({ embeds: [embed], components: [row] });
    }
  }

  // Default Wiki Hub
  const embed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle('📖 Welcome to Krims Wiki!')
    .setDescription(
      `Your complete guide to **Krims Code AI** commands, leveling algorithms, custom bot spawning, and 2.0x Top.gg vote boosters!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 📚 QUICK DIRECTORY:\n` +
      `• 🚀 **Getting Started:** Setup & bot invite guide\n` +
      `• 🧠 **AI Neural Chat:** Gemini & Groq chat with vision & memory\n` +
      `• ⚡ **Leveling & XP:** Message tracking & dual leaderboard\n` +
      `• 🗳️ **Vote Booster:** 2.0x XP multiplier for 12h/24h on Top.gg\n` +
      `• ⚙️ **Bot Spawner:** \`/setupbot\` custom bot hosting for free\n` +
      `• 🛡️ **Moderation:** Warnings, mute, purge, and lockdowns\n` +
      `• 📚 **100-Command Table:** Search all slash & prefix commands\n\n` +
      `*Explore the full interactive documentation website at [krims-discord-bot-d57m.onrender.com/wiki](${WIKI_BASE_URL})!*`
    )
    .setThumbnail('https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256')
    .setFooter({ text: 'Krims Code AI • Knowledge & Docs' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('📖 Open Web Wiki')
      .setStyle(ButtonStyle.Link)
      .setURL(WIKI_BASE_URL),
    new ButtonBuilder()
      .setLabel('🗳️ Vote for 2x XP')
      .setStyle(ButtonStyle.Link)
      .setURL('https://top.gg/bot/1523794466740371586/vote'),
    new ButtonBuilder()
      .setLabel('💬 Support Server')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/u2bpcHe3eC')
  );

  return await interaction.reply({ embeds: [embed], components: [row] });
}

/**
 * Prefix !wiki Message Handler
 */
export async function handleWikiMessage(message, args = []) {
  const query = args.join(' ').toLowerCase().trim();

  if (query) {
    const matchedCommand = WIKI_COMMANDS.find(c => 
      c.name.toLowerCase().includes(query) || 
      c.prefix.toLowerCase().includes(query) ||
      c.desc.toLowerCase().includes(query)
    );

    const matchedSection = WIKI_SECTIONS.find(s => 
      s.title.toLowerCase().includes(query) || 
      s.summary.toLowerCase().includes(query) ||
      s.content.toLowerCase().includes(query)
    );

    if (matchedCommand || matchedSection) {
      const embed = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setTitle(`📖 Krims Wiki — Search Results for "${query}"`)
        .setFooter({ text: 'Krims Wiki • Official Documentation Hub' })
        .setTimestamp();

      if (matchedCommand) {
        embed.addFields({
          name: `Command: \`${matchedCommand.name}\` (Prefix: \`${matchedCommand.prefix}\`)`,
          value: `**Category:** ${matchedCommand.category}\n**Description:** ${matchedCommand.desc}`
        });
      }

      if (matchedSection) {
        embed.addFields({
          name: matchedSection.title,
          value: `${matchedSection.summary}\n👉 [Read Full Article on Web Wiki](${WIKI_BASE_URL}#${matchedSection.id})`
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel('📖 Open Full Web Wiki')
          .setStyle(ButtonStyle.Link)
          .setURL(WIKI_BASE_URL),
        new ButtonBuilder()
          .setLabel('💬 Support Server')
          .setStyle(ButtonStyle.Link)
          .setURL('https://discord.gg/u2bpcHe3eC')
      );

      return await message.reply({ embeds: [embed], components: [row] });
    }
  }

  // Default Wiki Hub
  const embed = new EmbedBuilder()
    .setColor(0x00E5FF)
    .setTitle('📖 Welcome to Krims Wiki!')
    .setDescription(
      `Your complete guide to **Krims Code AI** commands, leveling algorithms, custom bot spawning, and 2.0x Top.gg vote boosters!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `### 📚 QUICK DIRECTORY:\n` +
      `• 🚀 **Getting Started:** Setup & bot invite guide\n` +
      `• 🧠 **AI Neural Chat:** Gemini & Groq chat with vision & memory\n` +
      `• ⚡ **Leveling & XP:** Message tracking & dual leaderboard\n` +
      `• 🗳️ **Vote Booster:** 2.0x XP multiplier for 12h/24h on Top.gg\n` +
      `• ⚙️ **Bot Spawner:** \`/setupbot\` custom bot hosting for free\n` +
      `• 🛡️ **Moderation:** Warnings, mute, purge, and lockdowns\n` +
      `• 📚 **100-Command Table:** Search all slash & prefix commands\n\n` +
      `*Explore the full interactive documentation website at [krims-discord-bot-d57m.onrender.com/wiki](${WIKI_BASE_URL})!*`
    )
    .setThumbnail('https://cdn.discordapp.com/avatars/1523794466740371586/a_906dd0ce7ccf09e15e48c6a5bda79fa6.gif?size=256')
    .setFooter({ text: 'Krims Code AI • Knowledge & Docs' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('📖 Open Web Wiki')
      .setStyle(ButtonStyle.Link)
      .setURL(WIKI_BASE_URL),
    new ButtonBuilder()
      .setLabel('🗳️ Vote for 2x XP')
      .setStyle(ButtonStyle.Link)
      .setURL('https://top.gg/bot/1523794466740371586/vote'),
    new ButtonBuilder()
      .setLabel('💬 Support Server')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.gg/u2bpcHe3eC')
  );

  return await message.reply({ embeds: [embed], components: [row] });
}
