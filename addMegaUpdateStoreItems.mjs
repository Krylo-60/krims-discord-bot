import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krylosmp-store-website/index.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `  // 2. CRATE KEYS (15 products of various bundles)`;

const newItemsStr = `  // 🌟 KRYLOSMP 2.0 MEGA UPDATE EXCLUSIVES
  products.push({
    id: 'krylo-wheel-spin-key-x5',
    name: '5x Krylo-Wheel Fortune Spins',
    price: 350,
    category: 'keys',
    badge: 'NEW 2.0',
    icon: 'fa-dharmachakra',
    color: 'cyan',
    desc: 'Unlocks 5 bonus spins on the Krylo-Wheel of Fortune (/spin) to win ranks, KC, and netherite!',
    perks: ['5x Mega Spins on /spin', 'Chance at Grand Diamond Jackpot', 'Instant delivery']
  });

  products.push({
    id: 'clan-vault-boost-10k',
    name: '10,000 KC Clan Vault Boost',
    price: 1500,
    category: 'perks',
    badge: 'NEW 2.0',
    icon: 'fa-dungeon',
    color: 'gold',
    desc: 'Instantly deposits +10,000 KryloCoins into your Clan Vault (/clan deposit) to climb the Clan Leaderboard!',
    perks: ['+10,000 KC to Clan Vault', 'Unlocks +10% EXP Boost', 'Instant delivery']
  });

  products.push({
    id: 'grand-jackpot-voucher',
    name: 'Grand Jackpot Crate Voucher',
    price: 999,
    category: 'keys',
    badge: 'NEW 2.0',
    icon: 'fa-box-open',
    color: 'pink',
    desc: 'Guaranteed voucher for the Grand Birthday Crate at spawn containing Netherite Armor and GOD items!',
    perks: ['Guaranteed GOD item', '1x Crate Key', 'Instant delivery']
  });

  // 2. CRATE KEYS (15 products of various bundles)`;

content = content.replace(targetStr, newItemsStr);

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 KRYLOSMP 2.0 STORE ITEMS ADDED SUCCESSFULLY!]');
