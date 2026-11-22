import fs from 'fs';

const file = 'C:/Users/naina/.gemini/antigravity/scratch/krims-bot-dashboard/rewards.html';
let html = fs.readFileSync(file, 'utf8');

// Normalize to LF for matching
const isCrlf = html.includes('\r\n');
if (isCrlf) {
  html = html.replace(/\r\n/g, '\n');
}

// Target the passes section header
const oldHeader = `    <!-- Upcoming Premium Passes -->
    <section class="section-container">
      <div class="section-header">
        <div class="section-eyebrow">Redemption Matrix</div>
        <h2 class="section-title">Krims Code Premium Passes</h2>
      </div>`;

const newHeader = `    <!-- Official Premium Passes & KryloSMP Funding -->
    <section class="section-container" id="premium-passes-section">
      <div class="section-header">
        <div class="section-eyebrow">Dual Checkout Matrix • KR Points or Real Money</div>
        <h2 class="section-title">Krims Code Premium Passes</h2>
        <p style="color: var(--text-muted); max-width: 700px; margin: 10px auto 0; font-size: 0.95rem; line-height: 1.55;">
          Unlock dedicated 0ms Neural AI compute, custom bot slots, and prestige perks. Pay with your earned <strong>KR Points</strong> or directly with <strong>Real Money via Lemon Squeezy</strong> to support our Minecraft SMP server!
        </p>
      </div>

      <!-- 🎮 Minecraft SMP Community Funding Notice -->
      <div style="background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.12)); border: 1.5px solid rgba(16, 185, 129, 0.35); border-radius: 16px; padding: 20px 26px; margin-bottom: 2.2rem; display: flex; align-items: center; gap: 18px; flex-wrap: wrap;">
        <div style="font-size: 2.4rem;">🎮 ⛏️</div>
        <div style="flex: 1; min-width: 260px;">
          <h4 style="font-size: 1.1rem; font-weight: 800; color: #fff; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
            <span>100% Direct Funding for KryloSMP Minecraft Server</span>
            <span class="badge-pill-cyan" style="font-size: 0.72rem; padding: 3px 8px;">play.krylosmp.xyz</span>
          </h4>
          <p style="font-size: 0.86rem; color: #cbd5e1; line-height: 1.55;">
            Every single dollar and KR point spent on Krims Code Premium directly funds high-performance 24/7 dedicated hosting on FalixNodes, custom 3D crate models, anti-cheat, and lag-free servers for KryloSMP. Premium tiers also automatically unlock cross-platform Minecraft in-game prestige ranks, keys, and currency!
          </p>
        </div>
        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
          <a href="#buy-points-section" class="badge-pill-cyan" style="text-decoration: none; padding: 10px 18px; font-weight: 700; background: var(--cyan); color: #000;">⚡ Top Up KR</a>
        </div>
      </div>`;

if (html.includes(oldHeader)) {
  html = html.replace(oldHeader, newHeader);
  console.log('Replaced header with Minecraft funding banner!');
} else {
  console.warn('Could not find oldHeader');
}

// Update the 7-Day Sprint card
const old7dCard = `<div class="pass-card">
          <div class="pass-badge">Starter Sprint</div>
          <h3 class="pass-name">7-Day Premium Pass</h3>
          <div class="pass-price-wrap">
            <span class="pass-price">2,500</span>
            <span class="pass-currency">KR</span>
          </div>
          <ul class="pass-features-list">
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Instant Priority Neural AI reasoning (0ms queue)</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>1 Dedicated Custom Bot Slot with AI persona</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>2x Voice Lounge XP & Leveling multiplier</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Verified Krims Premium linked role badge</span>
            </li>
          </ul>
          <button class="pass-unlock-btn" onclick="unlockPass('pass_7d', '7-Day Premium Sprint', 2500, 7)">
            <span>✨ Unlock Sprint Pass (2,500 KR)</span>
          </button>
        </div>`;

const new7dCard = `<div class="pass-card">
          <div class="pass-badge">Starter Sprint • Funds KryloSMP</div>
          <h3 class="pass-name">7-Day Premium Pass</h3>
          <div class="pass-price-wrap" style="display: flex; align-items: baseline; gap: 8px;">
            <span class="pass-price">2,500</span>
            <span class="pass-currency">KR</span>
            <span style="font-size: 0.88rem; color: var(--text-dim); margin: 0 4px;">or</span>
            <span class="pass-price" style="font-size: 1.4rem; color: #38bdf8;">$2.99</span>
          </div>
          <ul class="pass-features-list">
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Instant Priority Neural AI reasoning (0ms queue)</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>1 Dedicated Custom Bot Slot with AI persona</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>2x Voice Lounge XP & Leveling multiplier</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Verified Krims Premium linked role badge</span>
            </li>
            <li class="pass-feature-item" style="color: #34d399;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span><strong>🎮 KryloSMP:</strong> Knight Rank + 5x Rare Keys + $5k In-Game Coins</span>
            </li>
          </ul>
          <button class="pass-unlock-btn" onclick="unlockPass('pass_7d', '7-Day Premium Sprint', 2500, 7)">
            <span>✨ Unlock with 2,500 KR</span>
          </button>
          <button class="pass-unlock-btn" style="background: rgba(255,255,255,0.07); border: 1px solid rgba(0, 242, 255, 0.35); margin-top: 8px;" onclick="openLemonCheckout(2500, 2.99, '7-Day Sprint Pass')">
            <span>🍋 Pay $2.99 with Money</span>
          </button>
        </div>`;

if (html.includes(old7dCard)) {
  html = html.replace(old7dCard, new7dCard);
  console.log('Replaced 7-Day Sprint card with dual payment & KryloSMP perks!');
}

// Update the 30-Day Pro Season Pass card
const old30dCard = `<div class="pass-card featured">
          <div class="pass-badge">Most Popular</div>
          <h3 class="pass-name">30-Day Pro Season Pass</h3>
          <div class="pass-price-wrap">
            <span class="pass-price" style="color: var(--cyan);">8,000</span>
            <span class="pass-currency">KR</span>
          </div>
          <ul class="pass-features-list">
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>All 7-Day Sprint features included</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Unlimited Neural Memory Context across servers</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Up to 3 Custom Automated Bot Slots with AutoMod</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>VIP Lounge access & golden Discord nameplate</span>
            </li>
          </ul>
          <button class="pass-unlock-btn" onclick="unlockPass('pass_30d', '30-Day Pro Season Pass', 8000, 30)">
            <span>👑 Unlock 30-Day Pro (8,000 KR)</span>
          </button>
        </div>`;

const new30dCard = `<div class="pass-card featured">
          <div class="pass-badge">Most Popular • Funds KryloSMP</div>
          <h3 class="pass-name">30-Day Pro Season Pass</h3>
          <div class="pass-price-wrap" style="display: flex; align-items: baseline; gap: 8px;">
            <span class="pass-price" style="color: var(--cyan);">8,000</span>
            <span class="pass-currency">KR</span>
            <span style="font-size: 0.88rem; color: var(--text-dim); margin: 0 4px;">or</span>
            <span class="pass-price" style="font-size: 1.4rem; color: #38bdf8;">$7.99</span>
          </div>
          <ul class="pass-features-list">
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>All 7-Day Sprint features included</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Unlimited Neural Memory Context across servers</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Up to 3 Custom Automated Bot Slots with AutoMod</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>VIP Lounge access & golden Discord nameplate</span>
            </li>
            <li class="pass-feature-item" style="color: #34d399;">
              <svg viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span><strong>🎮 KryloSMP:</strong> Champion Rank + 10x Legendary Keys + $25k In-Game Coins</span>
            </li>
          </ul>
          <button class="pass-unlock-btn" style="background: var(--cyan); color: #000; font-weight: 700;" onclick="unlockPass('pass_30d', '30-Day Pro Season Pass', 8000, 30)">
            <span>👑 Unlock with 8,000 KR</span>
          </button>
          <button class="pass-unlock-btn" style="background: rgba(255,255,255,0.07); border: 1px solid rgba(0, 242, 255, 0.45); margin-top: 8px;" onclick="openLemonCheckout(8000, 7.99, '30-Day Pro Season Pass')">
            <span>🍋 Pay $7.99 with Money</span>
          </button>
        </div>`;

if (html.includes(old30dCard)) {
  html = html.replace(old30dCard, new30dCard);
  console.log('Replaced 30-Day Pro card with dual payment & KryloSMP perks!');
}

// Update the Lifetime Access card
const oldLifetimeCard = `<div class="pass-card elite">
          <div class="pass-badge">Elite Founder</div>
          <h3 class="pass-name">Enterprise Lifetime Access</h3>
          <div class="pass-price-wrap">
            <span class="pass-price" style="color: var(--gold);">25,000</span>
            <span class="pass-currency" style="color: var(--gold);">KR</span>
          </div>
          <ul class="pass-features-list">
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Permanent Lifetime Krims Code Premium status</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Unlimited Custom Bot Fleet slots with 0ms ping</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Direct access to #👑・executive-lounge R&D room</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Exclusive Executive VIP Role &amp; Golden Server Badges</span>
            </li>
          </ul>
          <button class="pass-unlock-btn" onclick="unlockPass('pass_lifetime', 'Enterprise Lifetime Access', 25000, null)">
            <span>⚡ Unlock Lifetime Access (25,000 KR)</span>
          </button>
        </div>`;

const newLifetimeCard = `<div class="pass-card elite">
          <div class="pass-badge">Elite Founder • Sovereign Supporter</div>
          <h3 class="pass-name">Enterprise Lifetime Access</h3>
          <div class="pass-price-wrap" style="display: flex; align-items: baseline; gap: 8px;">
            <span class="pass-price" style="color: var(--gold);">25,000</span>
            <span class="pass-currency" style="color: var(--gold);">KR</span>
            <span style="font-size: 0.88rem; color: var(--text-dim); margin: 0 4px;">or</span>
            <span class="pass-price" style="font-size: 1.4rem; color: var(--gold);">$19.99</span>
          </div>
          <ul class="pass-features-list">
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Permanent Lifetime Krims Code Premium status</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Unlimited Custom Bot Fleet slots with 0ms ping</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Direct access to #👑・executive-lounge R&D room</span>
            </li>
            <li class="pass-feature-item">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Exclusive Executive VIP Role &amp; Golden Server Badges</span>
            </li>
            <li class="pass-feature-item" style="color: var(--gold);">
              <svg viewBox="0 0 24 24" fill="none" stroke="var(--gold)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span><strong>🎮 KryloSMP:</strong> Sovereign Rank (/fly, /god) + 10x Godly Keys + $100k Coins</span>
            </li>
          </ul>
          <button class="pass-unlock-btn" style="background: linear-gradient(135deg, #f59e0b, #d97706); color: #000; font-weight: 700;" onclick="unlockPass('pass_lifetime', 'Enterprise Lifetime Access', 25000, null)">
            <span>⚡ Unlock with 25,000 KR</span>
          </button>
          <button class="pass-unlock-btn" style="background: rgba(255,255,255,0.07); border: 1px solid rgba(245, 158, 11, 0.45); margin-top: 8px;" onclick="openLemonCheckout(25000, 19.99, 'Enterprise Lifetime Access')">
            <span>🍋 Pay $19.99 with Money</span>
          </button>
        </div>`;

if (html.includes(oldLifetimeCard)) {
  html = html.replace(oldLifetimeCard, newLifetimeCard);
  console.log('Replaced Lifetime Access card with dual payment & KryloSMP perks!');
}

if (isCrlf) {
  html = html.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, html, 'utf8');
console.log('Successfully written updated rewards.html with all replacements!');
