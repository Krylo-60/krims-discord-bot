import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krylosmp-store-website/index.js';
let content = fs.readFileSync(filePath, 'utf8');

const freeItemCode = `  // 🎁 100% FREE BIRTHDAY & STARTER PACKS
  products.push({
    id: 'free-krylo-starter-pack',
    name: 'KryloSMP Free Starter & Birthday Pack',
    price: 0,
    category: 'ranks',
    badge: '100% FREE',
    icon: 'fa-gift',
    color: 'green',
    desc: 'Special 100% FREE Birthday & Starter Bundle! Claim +5,000 KryloCoins, 16x Diamonds & Netherite Ingot in-game!',
    perks: ['100% FREE ($0.00)', '+5,000 KryloCoins', '16x Diamonds & 1x Netherite Ingot']
  });
  products.push({
    id: 'free-clan-founder-pass',
    name: 'Free Clan Founder Pass',
    price: 0,
    category: 'perks',
    badge: '100% FREE',
    icon: 'fa-shield-heart',
    color: 'cyan',
    desc: 'Claim 100% FREE Clan Founder status allowing you to create your own SMP Clan (/clan create) for free!',
    perks: ['100% FREE ($0.00)', 'Free Clan Creation', '+1,000 KC Clan Vault Bonus']
  });
`;

content = content.replace("function generateAndRenderProducts() {\n  const products = [];", "function generateAndRenderProducts() {\n  const products = [];\n" + freeItemCode);

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 100% FREE PACKS ADDED TO WEBSTORE!]');
