// ══════════════════════════════════════════════════════════════════════════
// 👑 KRYLOSMP WEB STORE — APP ENGINE (KC & REAL MONEY STORE)
// ══════════════════════════════════════════════════════════════════════════

// Products Catalog Data
const storeProducts = [
    // 👑 RANKS
    {
        id: 'rank_owner',
        title: '👑 OWNER RANK (VIP Access)',
        category: 'ranks',
        badge: 'EXCLUSIVE',
        priceKC: 50000,
        priceUSD: 49.99,
        icon: 'https://mc-heads.net/head/Krylo_mc/64',
        desc: 'Permanent [OWNER] tag in chat & tab list, full God Items access, priority server slot, and unlimited claims!'
    },
    {
        id: 'rank_god',
        title: '⚡ KRYLO GOD RANK',
        category: 'ranks',
        badge: 'POPULAR',
        priceKC: 25000,
        priceUSD: 24.99,
        icon: 'https://mc-heads.net/head/Mjolnir/64',
        desc: 'Golden [⚡ GOD] rank prefix, /fly command, 5x Sethomes, and monthly God Crate keys!'
    },
    {
        id: 'rank_vip',
        title: '💎 VIP+ RANK',
        category: 'ranks',
        badge: 'VALUE',
        priceKC: 10000,
        priceUSD: 9.99,
        icon: 'https://mc-heads.net/head/Emerald/64',
        desc: 'Bright Cyan [💎 VIP+] prefix, /workbench, /craft, and 3x Sethomes!'
    },

    // 🔱 GOD RELICS & WEAPONS
    {
        id: 'relic_spear',
        title: '🔱 God Spear of Krylo',
        category: 'relics',
        badge: 'RETEXTURED #1001',
        priceKC: 15000,
        priceUSD: 14.99,
        icon: 'https://mc-heads.net/head/Trident/64',
        desc: 'Sharpness X, Impaling X, Loyalty III, Tempest Dash & Lightning Storm abilities!'
    },
    {
        id: 'relic_blade',
        title: '🗡️ Blade of Chaos',
        category: 'relics',
        badge: 'RETEXTURED #1002',
        priceKC: 12000,
        priceUSD: 11.99,
        icon: 'https://mc-heads.net/head/Sword/64',
        desc: 'Sharpness X, Nethemelt Lifesteal & Infernal Firewave Burst!'
    },
    {
        id: 'relic_hammer',
        title: '⚡ Mjolnir Hammer',
        category: 'relics',
        badge: 'RETEXTURED #1009',
        priceKC: 12000,
        priceUSD: 11.99,
        icon: 'https://mc-heads.net/head/Mace/64',
        desc: 'Density V, Breach IV, Wind Burst III & Thunder Wave Stun!'
    },
    {
        id: 'relic_pants',
        title: '👖 God Leggings (God Pants)',
        category: 'relics',
        badge: 'RETEXTURED #1013',
        priceKC: 10000,
        priceUSD: 9.99,
        icon: 'https://mc-heads.net/head/Leggings/64',
        desc: 'Protection X, Swift Sneak III, Unbreaking V, Mending I!'
    },

    // 🍖 GOD CONSUMABLES
    {
        id: 'food_godfood',
        title: '🍖 God Food of Krylo (64x)',
        category: 'food',
        badge: '30 HEARTS + SATURATION 255',
        priceKC: 5000,
        priceUSD: 4.99,
        icon: 'https://mc-heads.net/head/GoldenApple/64',
        desc: 'Gives Saturation 255 (10s) & +30 Extra Hearts FOREVER until you drink milk!'
    },

    // 💰 KRYLOCOINS (KC PACKS)
    {
        id: 'kc_100k',
        title: '💰 100,000 KryloCoins Pack',
        category: 'kc',
        badge: 'BEST VALUE',
        priceKC: 100000,
        priceUSD: 19.99,
        icon: 'https://mc-heads.net/head/Gold_Block/64',
        desc: 'Huge stash of 100,000 KryloCoins to spend on in-game auctions, claims, and trades!'
    },
    {
        id: 'kc_25k',
        title: '💰 25,000 KryloCoins Pack',
        category: 'kc',
        badge: 'POPULAR',
        priceKC: 25000,
        priceUSD: 7.99,
        icon: 'https://mc-heads.net/head/Gold_Ingot/64',
        desc: '25,000 KryloCoins for player trading and server market purchases!'
    },

    // 🔑 CRATE KEYS
    {
        id: 'key_god_10x',
        title: '🔑 10x God Crate Keys',
        category: 'keys',
        badge: 'LEGENDARY',
        priceKC: 8000,
        priceUSD: 6.99,
        icon: 'https://mc-heads.net/head/Key/64',
        desc: '10 Keys to open the God Crate at /spawn for guaranteed God Relics & Armor!'
    }
];

// App State
let currentIGN = 'Krylo_mc';
let currencyMode = 'kc'; // 'kc' or 'real'
let cart = [];
let activeCategory = 'all';

// DOM Elements
const itemsGrid = document.getElementById('itemsGrid');
const currencyToggle = document.getElementById('currencyToggle');
const usernameDisplay = document.getElementById('usernameDisplay');
const userModal = document.getElementById('userModal');
const loginBtn = document.getElementById('loginBtn');
const closeUserModal = document.getElementById('closeUserModal');
const usernameForm = document.getElementById('usernameForm');
const ignInput = document.getElementById('ignInput');
const modalAvatarImg = document.getElementById('modalAvatarImg');
const avatarPreviewName = document.getElementById('avatarPreviewName');
const cartTrigger = document.getElementById('cartTrigger');
const cartCount = document.getElementById('cartCount');
const cartOverlay = document.getElementById('cartOverlay');
const closeCart = document.getElementById('closeCart');
const cartItemsList = document.getElementById('cartItemsList');
const cartTotalPrice = document.getElementById('cartTotalPrice');
const cartUsername = document.getElementById('cartUsername');
const cartUserAvatar = document.getElementById('cartUserAvatar');
const checkoutBtn = document.getElementById('checkoutBtn');
const checkoutModal = document.getElementById('checkoutModal');
const closeCheckoutModal = document.getElementById('closeCheckoutModal');
const checkoutItemsSummary = document.getElementById('checkoutItemsSummary');
const checkoutPlayerName = document.getElementById('checkoutPlayerName');
const checkoutAvatar = document.getElementById('checkoutAvatar');
const confirmPaymentBtn = document.getElementById('confirmPaymentBtn');
const successModal = document.getElementById('successModal');
const closeSuccessBtn = document.getElementById('closeSuccessBtn');
const successPlayerName = document.getElementById('successPlayerName');
const executedCommandText = document.getElementById('executedCommandText');
const copyIpBtn = document.getElementById('copyIpBtn');

// Initialize Store
function initStore() {
    updateUserDisplay();
    renderProducts();
    setupEventListeners();
}

// Render Products Grid
function renderProducts() {
    itemsGrid.innerHTML = '';

    const filtered = activeCategory === 'all' 
        ? storeProducts 
        : storeProducts.filter(p => p.category === activeCategory);

    filtered.forEach(p => {
        const priceDisplay = currencyMode === 'kc' 
            ? `${p.priceKC.toLocaleString()} KC` 
            : `$${p.priceUSD.toFixed(2)}`;

        const card = document.createElement('div');
        card.className = 'item-card';
        card.innerHTML = `
            <span class="item-badge">${p.badge}</span>
            <div class="item-icon-box">
                <img src="${p.icon}" alt="${p.title}" onerror="this.src='https://mc-heads.net/head/Steve/64'">
            </div>
            <h3 class="item-title">${p.title}</h3>
            <p class="item-desc">${p.desc}</p>
            <div class="item-footer">
                <span class="item-price">${priceDisplay}</span>
                <button class="add-cart-btn" onclick="addToCart('${p.id}')">🛒 Add to Cart</button>
            </div>
        `;
        itemsGrid.appendChild(card);
    });
}

// Add Item to Cart
window.addToCart = function(id) {
    const product = storeProducts.find(p => p.id === id);
    if (!product) return;

    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.qty++;
    } else {
        cart.push({ ...product, qty: 1 });
    }

    updateCartUI();
    cartOverlay.classList.add('active');
};

// Update Cart UI
function updateCartUI() {
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    cartCount.textContent = totalCount;

    if (cart.length === 0) {
        cartItemsList.innerHTML = '<div class="empty-cart-msg">Your cart is empty. Add some God Relics or Ranks!</div>';
        cartTotalPrice.textContent = currencyMode === 'kc' ? '0 KC' : '$0.00';
        return;
    }

    cartItemsList.innerHTML = '';
    let grandTotal = 0;

    cart.forEach(item => {
        const itemPrice = currencyMode === 'kc' ? item.priceKC * item.qty : item.priceUSD * item.qty;
        grandTotal += itemPrice;

        const itemRow = document.createElement('div');
        itemRow.className = 'cart-item-row';
        itemRow.style.cssText = 'display:flex; align-items:center; justify-content:space-between; background:rgba(255,255,255,0.03); padding:0.8rem; border-radius:12px; border:1px solid rgba(255,215,0,0.1);';
        itemRow.innerHTML = `
            <div>
                <strong style="display:block; font-size:0.95rem;">${item.title}</strong>
                <span style="font-size:0.8rem; color:#9999bb;">Qty: ${item.qty} x ${currencyMode === 'kc' ? item.priceKC + ' KC' : '$' + item.priceUSD}</span>
            </div>
            <div style="display:flex; align-items:center; gap:0.8rem;">
                <span style="font-weight:700; color:#FFD700;">${currencyMode === 'kc' ? itemPrice.toLocaleString() + ' KC' : '$' + itemPrice.toFixed(2)}</span>
                <button onclick="removeFromCart('${item.id}')" style="background:transparent; border:none; color:#FF0055; cursor:pointer; font-weight:700;">✕</button>
            </div>
        `;
        cartItemsList.appendChild(itemRow);
    });

    cartTotalPrice.textContent = currencyMode === 'kc' 
        ? `${grandTotal.toLocaleString()} KC` 
        : `$${grandTotal.toFixed(2)}`;
}

// Remove Item from Cart
window.removeFromCart = function(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
};

// Event Listeners
function setupEventListeners() {
    // Category Tab Switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            activeCategory = e.target.dataset.category;
            renderProducts();
        });
    });

    // Currency Switcher Toggle
    currencyToggle.addEventListener('click', (e) => {
        if (!e.target.classList.contains('currency-btn')) return;
        document.querySelectorAll('.currency-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currencyMode = e.target.dataset.mode;
        renderProducts();
        updateCartUI();
    });

    // Login Modal Triggers
    loginBtn.addEventListener('click', () => userModal.classList.add('active'));
    closeUserModal.addEventListener('click', () => userModal.classList.remove('active'));

    // Dynamic Avatar Lookup on Typing IGN
    ignInput.addEventListener('input', (e) => {
        const val = e.target.value.trim() || 'Krylo_mc';
        modalAvatarImg.src = `https://mc-heads.net/avatar/${val}/64`;
        avatarPreviewName.textContent = val;
    });

    // Submit IGN Form
    usernameForm.addEventListener('submit', (e) => {
        e.preventDefault();
        currentIGN = ignInput.value.trim() || 'Krylo_mc';
        updateUserDisplay();
        userModal.classList.remove('active');
    });

    // Cart Drawer Toggle
    cartTrigger.addEventListener('click', () => cartOverlay.classList.add('active'));
    closeCart.addEventListener('click', () => cartOverlay.classList.remove('active'));

    // Checkout Modal
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) return alert('Your cart is empty!');
        cartOverlay.classList.remove('active');
        populateCheckout();
        checkoutModal.classList.add('active');
    });
    closeCheckoutModal.addEventListener('click', () => checkoutModal.classList.remove('active'));

    // Confirm Checkout & Deliver Items
    confirmPaymentBtn.addEventListener('click', () => {
        checkoutModal.classList.remove('active');
        
        // Generate In-Game Delivery Command Preview
        successPlayerName.textContent = currentIGN;
        executedCommandText.textContent = `/godkit ${currentIGN} (Full Package Executed)`;
        
        cart = [];
        updateCartUI();
        successModal.classList.add('active');
    });

    closeSuccessBtn.addEventListener('click', () => successModal.classList.remove('active'));

    // Copy IP Box
    copyIpBtn.addEventListener('click', () => {
        navigator.clipboard.writeText('krylosmp.falix.gg:29273');
        copyIpBtn.textContent = '✅ Copied!';
        setTimeout(() => copyIpBtn.textContent = '📋 Copy', 2000);
    });
}

// Populate Checkout Modal
function populateCheckout() {
    checkoutPlayerName.textContent = currentIGN;
    checkoutAvatar.src = `https://mc-heads.net/avatar/${currentIGN}/48`;
    checkoutItemsSummary.innerHTML = '';

    let grandTotal = 0;
    cart.forEach(item => {
        const itemPrice = currencyMode === 'kc' ? item.priceKC * item.qty : item.priceUSD * item.qty;
        grandTotal += itemPrice;

        const row = document.createElement('div');
        row.style.cssText = 'display:flex; justify-content:space-between; margin-bottom:0.5rem; font-size:0.95rem;';
        row.innerHTML = `
            <span>${item.qty}x ${item.title}</span>
            <span style="color:#FFD700; font-weight:700;">${currencyMode === 'kc' ? itemPrice.toLocaleString() + ' KC' : '$' + itemPrice.toFixed(2)}</span>
        `;
        checkoutItemsSummary.appendChild(row);
    });
}

// Update User Display in Header & Cart
function updateUserDisplay() {
    usernameDisplay.textContent = currentIGN;
    cartUsername.textContent = currentIGN;
    cartUserAvatar.src = `https://mc-heads.net/avatar/${currentIGN}/32`;

    const img = document.createElement('img');
    img.src = `https://mc-heads.net/avatar/${currentIGN}/24`;
    loginBtn.innerHTML = '';
    loginBtn.appendChild(img);
    loginBtn.appendChild(document.createTextNode(currentIGN));
}

// Start App
document.addEventListener('DOMContentLoaded', initStore);
