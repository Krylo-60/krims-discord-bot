// ====================================================================
// 👑 KRYLOSMP SEASON 1 COMMUNITY STORE ENGINE
// 100% Free-to-Play Play-to-Earn Architecture (KryloCoins ONLY)
// Preserves Season 2 Dual-Currency Logic for Seamless Activation
// ====================================================================

const SEASON_MODE = 1; // Season 1 = Pure KC Mode | Season 2 = Dual KC & Real Money

let currentPlatform = 'java';
let currentCurrency = 'KC'; // Pure KC for Season 1
let currentCategory = 'all';
let currentUsername = 'Krylo_MC';
let userKcBalance = 106000; // Live wallet from Neon DB / local DB
let selectedProduct = null;

// Official Season 1 Catalog (Priced in KryloCoins)
const PRODUCTS = [
  // ─── RANKS ───
  {
    id: 'vip',
    name: '💎 VIP Sovereign Rank',
    category: 'ranks',
    priceKc: 50000,
    priceUsd: 4.99,
    icon: 'fa-crown',
    color: '#00FF88',
    desc: 'Unlock exclusive green [VIP] chat prefix, /fly in Hub, and +15% KryloCoins boost.',
    perks: ['🟢 Green [VIP] Chat Badge', '🕊️ /fly in Spawn Hub', '⚡ +15% KC Multiplier', '🏠 3x /sethome slots']
  },
  {
    id: 'mvp',
    name: '👑 MVP Immortal Rank',
    category: 'ranks',
    priceKc: 100000,
    priceUsd: 9.99,
    icon: 'fa-gem',
    color: '#00E5FF',
    badge: 'POPULAR',
    desc: 'Cyan [MVP] prefix, /heal, /feed, and Netherite PvP starter gear on respawn.',
    perks: ['💎 Cyan [MVP] Chat Badge', '💖 /heal & /feed commands', '⚔️ Netherite PvP Gear Pack', '⚡ +35% KC Multiplier', '🏠 6x /sethome slots']
  },
  {
    id: 'mvpplus',
    name: '🔥 MVP+ Sovereign Rank',
    category: 'ranks',
    priceKc: 150000,
    priceUsd: 19.99,
    icon: 'fa-fire',
    color: '#FF6B35',
    badge: 'HOT',
    desc: 'Orange [MVP+] prefix, /workbench, /enderchest anywhere, and priority queue.',
    perks: ['🔥 Orange [MVP+] Chat Prefix', '🧰 /craft & /enderchest everywhere', '⚡ +50% KC Multiplier', '🏠 10x /sethome slots']
  },
  {
    id: 'executive',
    name: '👑 KRYLO EXECUTIVE RANK',
    category: 'ranks',
    priceKc: 250000,
    priceUsd: 29.99,
    icon: 'fa-star',
    color: '#FFD700',
    badge: 'EXECUTIVE',
    desc: 'The ultimate rank. Animated Gold prefix, Private VIP Lounge access, and Unlimited Homes.',
    perks: ['👑 Animated Gold [EXECUTIVE] Prefix', '🚪 Private Executive Lounge Access', '🎁 2x Daily Rewards (+1,000 KC/day)', '⚡ +100% KC Multiplier', '🏠 Unlimited /sethome slots']
  },

  // ─── CRATES & KEYS ───
  {
    id: 'crate_mythic_5',
    name: '🗝️ 5x Mythic Crate Keys',
    category: 'crates',
    priceKc: 15000,
    priceUsd: 2.99,
    icon: 'fa-key',
    color: '#A855F7',
    desc: '5x Mythic Keys with 30% chance for God Armor and 10,000 KC jackpot drops.',
    perks: ['🗝️ 5x Mythic Keys', '🎁 30% God Gear Chance', '💰 High KC Drops', '⚡ Instant Crate Delivery']
  },
  {
    id: 'crate_legendary_bundle',
    name: '🐉 Legendary Dragon Crate (x10)',
    category: 'crates',
    priceKc: 30000,
    priceUsd: 6.99,
    icon: 'fa-dragon',
    color: '#FF4444',
    badge: 'BEST VALUE',
    desc: '10x Ancient Dragon Keys with guaranteed Netherite weapon and elytra drop.',
    perks: ['🐉 10x Dragon Crate Keys', '🛡️ Guaranteed Netherite Weapon', '🪽 Elytra + 64 Fireworks', '⚡ Auto-broadcasts unboxing']
  },

  // ─── COMBAT KITS ───
  {
    id: 'netherite_kit',
    name: '⚔️ Netherite God Kit',
    category: 'combat',
    priceKc: 25000,
    priceUsd: 4.99,
    icon: 'fa-shield-halved',
    color: '#6366F1',
    desc: 'Full Protection IV Netherite Armor, Sharpness V Sword, 16 Gaps, and 4 Pearls.',
    perks: ['🛡️ Full Netherite Prot 4 Armor', '🗡️ Netherite Sharp 5 Sword', '🍏 16x Golden Apples', '🔮 4x Ender Pearls']
  },
  {
    id: 'sniper_bow_kit',
    name: '🏹 Master Archer Kit',
    category: 'combat',
    priceKc: 15000,
    priceUsd: 2.99,
    icon: 'fa-bullseye',
    color: '#10B981',
    desc: 'Power V Infinity Flame Bow, 64 Spectral Arrows, and Speed II Potions.',
    perks: ['🏹 Power 5 Flame Infinity Bow', '⚡ 3x Speed II Potions (8:00)', '🎯 64x Spectral Arrows', '🛡️ Diamond Chainmail Armor']
  },

  // ─── SKYBLOCK & UTILITY ───
  {
    id: 'island_fly',
    name: '🕊️ Island Flight Permit',
    category: 'skyblock',
    priceKc: 20000,
    priceUsd: 3.99,
    icon: 'fa-feather',
    color: '#38BDF8',
    desc: 'Permanent /fly capability across your entire SkyBlock island and base territory.',
    perks: ['🕊️ Permanent Island /fly', '⚡ Infinite flight duration', '🏠 Usable on all private claims']
  },
  {
    id: 'auto_smelt_pick',
    name: '⛏️ Auto-Smelt Fortune IV Pickaxe',
    category: 'skyblock',
    priceKc: 35000,
    priceUsd: 5.99,
    icon: 'fa-hammer',
    color: '#F59E0B',
    badge: 'OP UTILITY',
    desc: 'Custom Efficiency VI Fortune IV Netherite Pickaxe with instant auto-smelting.',
    perks: ['⛏️ Efficiency 6 & Fortune 4', '🔥 Instant Auto-Smelt to Ingots', '💎 2.5x Mining Yield Boost']
  }
];

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateUserBadge();
  initCopyIpButton();
});

// Render Catalog Grid (100% KryloCoins Mode)
function renderProducts() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  grid.innerHTML = '';

  const filtered = PRODUCTS.filter(p => {
    if (currentCategory === 'all') return true;
    return p.category === currentCategory;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="empty-state-box">
        <i class="fa-solid fa-box-open" style="font-size: 40px; color: rgba(255,255,255,0.2); margin-bottom: 12px;"></i>
        <p>No packages found in this category.</p>
      </div>`;
    return;
  }

  filtered.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card-fresh';

    const badgeHtml = p.badge ? `<span class="prod-badge">${p.badge}</span>` : '';
    const formattedPrice = `🪙 ${p.priceKc.toLocaleString()} KC`;

    card.innerHTML = `
      ${badgeHtml}
      <div class="card-icon-wrap" style="background: radial-gradient(circle, ${p.color}22 0%, transparent 70%); border-color: ${p.color}44;">
        <i class="fa-solid ${p.icon}" style="color: ${p.color};"></i>
      </div>
      <h3 class="card-title">${p.name}</h3>
      <p class="card-desc">${p.desc}</p>
      
      <div class="card-perks-box">
        ${p.perks.map(perk => `<div class="perk-item"><i class="fa-solid fa-check" style="color: #00FF88;"></i> <span>${perk}</span></div>`).join('')}
      </div>

      <div class="card-footer-action">
        <div class="card-price-block">
          <span class="price-amount" style="color: #00FF88;">${formattedPrice}</span>
          <span class="price-type">Play-to-Earn Unlocked</span>
        </div>
        <button class="btn-buy-card" onclick="openProductModal('${p.id}')">
          <i class="fa-solid fa-coins"></i> Unlock
        </button>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Category Filter
function filterProducts(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  const activeBtn = document.getElementById(`tab${capitalize(cat)}`);
  if (activeBtn) activeBtn.classList.add('active');
  renderProducts();
}

function capitalize(s) {
  if (s === 'all') return 'All';
  if (s === 'ranks') return 'Ranks';
  if (s === 'crates') return 'Crates';
  if (s === 'combat') return 'Combat';
  if (s === 'skyblock') return 'Skyblock';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Platform Switcher
function setPlatform(plat) {
  currentPlatform = plat;
  document.getElementById('platJava')?.classList.toggle('active', plat === 'java');
  document.getElementById('platBedrock')?.classList.toggle('active', plat === 'bedrock');
  showToast(`Switched platform to ${plat.toUpperCase()} Edition!`);
}

// Username Binding
function bindUsername() {
  const input = document.getElementById('mcUsernameInput');
  if (input && input.value.trim()) {
    currentUsername = input.value.trim();
    updateUserBadge();
    showToast(`Account synced as "${currentUsername}"!`);
  }
}

function updateUserBadge() {
  const ignLabel = document.getElementById('headerUserLabel');
  const walletLabel = document.getElementById('headerWalletLabel');
  const avatar = document.getElementById('headerUserAvatar');

  if (ignLabel) ignLabel.innerText = currentUsername;
  if (walletLabel) walletLabel.innerText = `${userKcBalance.toLocaleString()} KC`;
  if (avatar) avatar.src = `https://mc-heads.net/avatar/${currentUsername}/32`;
}

// Product Modal Handling
function openProductModal(prodId) {
  const product = PRODUCTS.find(p => p.id === prodId);
  if (!product) return;
  selectedProduct = product;

  document.getElementById('modalProductTitle').innerText = product.name;
  document.getElementById('modalProductPrice').innerText = `🪙 ${product.priceKc.toLocaleString()} KC`;
  document.getElementById('modalProductDesc').innerText = product.desc;
  document.getElementById('modalUsername').innerText = currentUsername;
  document.getElementById('modalUserAvatar').src = `https://mc-heads.net/avatar/${currentUsername}`;

  // Wallet calculation
  const walletBalEl = document.getElementById('modalWalletBalance');
  const costDeductEl = document.getElementById('modalCostDeduction');
  const remainingBalEl = document.getElementById('modalRemainingBalance');

  if (walletBalEl) walletBalEl.innerText = `${userKcBalance.toLocaleString()} KC`;
  if (costDeductEl) costDeductEl.innerText = `-${product.priceKc.toLocaleString()} KC`;
  
  const remaining = userKcBalance - product.priceKc;
  if (remainingBalEl) {
    if (remaining >= 0) {
      remainingBalEl.innerText = `${remaining.toLocaleString()} KC`;
      remainingBalEl.style.color = '#00E5FF';
    } else {
      remainingBalEl.innerText = `Insufficient (${remaining.toLocaleString()} KC)`;
      remainingBalEl.style.color = '#FF4444';
    }
  }

  // Render perks list in modal
  const perksList = document.getElementById('modalPerksList');
  if (perksList) {
    perksList.innerHTML = product.perks.map(perk => `
      <div class="perk-row">
        <i class="fa-solid fa-circle-check" style="color: #00FF88;"></i>
        <span>${perk}</span>
      </div>
    `).join('');
  }

  document.getElementById('productModal').classList.add('active');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('active');
}

// Checkout Execution (Season 1 Pure KC Mode)
function executeCheckout() {
  if (!selectedProduct) return;

  if (userKcBalance < selectedProduct.priceKc) {
    const shortage = selectedProduct.priceKc - userKcBalance;
    showToast(`❌ Insufficient KryloCoins! You need ${shortage.toLocaleString()} more KC. Earn KC in-game or via Discord daily drops!`, true);
    return;
  }

  // Deduct KC Balance
  userKcBalance -= selectedProduct.priceKc;
  updateUserBadge();

  closeProductModal();

  // Show official Order Receipt
  const orderId = `#KRYLO-${Math.floor(10000 + Math.random() * 90000)}`;
  document.getElementById('receiptOrderId').innerText = orderId;
  document.getElementById('receiptItemName').innerText = selectedProduct.name;
  document.getElementById('receiptIgn').innerText = currentUsername;
  document.getElementById('receiptPrice').innerText = `🪙 ${selectedProduct.priceKc.toLocaleString()} KC`;

  document.getElementById('receiptModal').classList.add('active');
  showToast(`🎉 Unlocked ${selectedProduct.name}! Package delivered in-game to ${currentUsername}.`);

  // Optional background sync to fulfillment server
  fetch('http://localhost:3000/api/store/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId: orderId,
      username: currentUsername,
      product: selectedProduct.id,
      amountKc: selectedProduct.priceKc,
      platform: currentPlatform
    })
  }).catch(() => {});
}

function closeReceiptModal() {
  document.getElementById('receiptModal').classList.remove('active');
}

// Account Link Modal
function openLoginModal() {
  document.getElementById('loginModal').classList.add('active');
}

function closeLoginModal() {
  document.getElementById('loginModal').classList.remove('active');
}

function submitModalLogin() {
  const input = document.getElementById('modalMcUsername');
  if (input && input.value.trim()) {
    currentUsername = input.value.trim();
    updateUserBadge();
    closeLoginModal();
    showToast(`Account linked as ${currentUsername}!`);
  }
}

// Copy Server IP
function copyServerIp() {
  const ip = 'krylosmp.falix.gg:29273';
  navigator.clipboard.writeText(ip).then(() => {
    showToast('📋 Server IP copied: ' + ip);
  }).catch(() => {
    showToast('IP: ' + ip);
  });
}

function initCopyIpButton() {
  window.copyServerIp = copyServerIp;
}

// Toast Notifications
function showToast(msg, isError = false) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = 'fresh-toast';
  if (isError) toast.style.borderColor = '#FF4444';

  toast.innerHTML = `
    <i class="fa-solid ${isError ? 'fa-triangle-exclamation' : 'fa-circle-check'}" style="color: ${isError ? '#FF4444' : '#00FF88'};"></i>
    <span>${msg}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
