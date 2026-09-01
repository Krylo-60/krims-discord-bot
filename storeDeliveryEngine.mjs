import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { db } from './databaseEngine.mjs';

dotenv.config();

const FALIX_TOKEN = process.env.FALIX_API_KEY || 'flx_live_P3WeTyt4HtgmfYBKf7gmw8PK1bYSVp5yNySZQ4Pa';
const SERVER_ID = process.env.FALIX_SERVER_ID || '3390114';
const BASE_URL = 'https://client.falixnodes.net/api/v2';

// ═══════════════════════════════════════════════════════════
// 🛒 OFFICIAL 100% MATCHED STORE CATALOG & COMMAND MAPPINGS
// ═══════════════════════════════════════════════════════════
export const STORE_CATALOG = {
  // --- 👑 100% REAL PRESTIGE RANKS ---
  'rank-sovereign': {
    name: '👑 Sovereign Rank',
    price: 50000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set sovereign',
      'lp user {player} permission set essentials.fly true',
      'lp user {player} permission set essentials.god true',
      'eco give {player} 50000',
      'broadcast &6&l⚡ &e{player} &7just unlocked &6&l👑 SOVEREIGN RANK &7from the Web Store!'
    ]
  },
  'rank-overlord': {
    name: '⚡ Overlord Rank',
    price: 40000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set overlord',
      'lp user {player} permission set essentials.feed true',
      'lp user {player} permission set essentials.heal true',
      'eco give {player} 30000',
      'broadcast &e&l⚡ &e{player} &7just unlocked &e&l⚡ OVERLORD RANK &7from the Web Store!'
    ]
  },
  'rank-warlord': {
    name: '⚔️ Warlord Rank',
    price: 30000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set warlord',
      'lp user {player} permission set essentials.repair true',
      'eco give {player} 20000',
      'broadcast &c&l⚡ &e{player} &7just unlocked &c&l⚔️ WARLORD RANK &7from the Web Store!'
    ]
  },
  'rank-champion': {
    name: '💎 Champion Rank',
    price: 20000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set champion',
      'lp user {player} permission set essentials.craft true',
      'lp user {player} permission set essentials.enderchest true',
      'eco give {player} 10000',
      'broadcast &b&l⚡ &e{player} &7just unlocked &b&l💎 CHAMPION RANK &7from the Web Store!'
    ]
  },
  'rank-knight': {
    name: '🛡️ Knight Rank',
    price: 15000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set knight',
      'lp user {player} permission set essentials.near true',
      'eco give {player} 5000',
      'broadcast &9&l⚡ &e{player} &7just unlocked &9&l🛡️ KNIGHT RANK &7from the Web Store!'
    ]
  },
  'rank-scout': {
    name: '🏹 Scout Rank',
    price: 8000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set scout',
      'eco give {player} 2500',
      'broadcast &a&l⚡ &e{player} &7just unlocked &a&l🏹 SCOUT RANK &7from the Web Store!'
    ]
  },

  // --- 🗝️ 100% REAL 3D CRATE KEYS ---
  'crates-godly': {
    name: '👑 10x Godly Crate Keys',
    price: 12000,
    category: 'Crates',
    commands: [
      'crazycrates give physical GodlyCrate 10 {player}',
      'broadcast &6&l⚡ &e{player} &7received &610x 👑 Godly Keys &7from the Web Store!'
    ]
  },
  'crates-mythic': {
    name: '🔮 10x Mythic Crate Keys',
    price: 7500,
    category: 'Crates',
    commands: [
      'crazycrates give physical MythicCrate 10 {player}',
      'broadcast &d&l⚡ &e{player} &7received &d10x 🔮 Mythic Keys &7from the Web Store!'
    ]
  },
  'crates-legendary': {
    name: '⚔️ 10x Legendary Keys',
    price: 5000,
    category: 'Crates',
    commands: [
      'crazycrates give physical LegendaryCrate 10 {player}',
      'broadcast &e&l⚡ &e{player} &7received &e10x ⚔️ Legendary Keys &7from the Web Store!'
    ]
  },
  'crates-epic': {
    name: '💎 10x Epic Crate Keys',
    price: 3500,
    category: 'Crates',
    commands: [
      'crazycrates give physical EpicCrate 10 {player}'
    ]
  },
  'crates-rare': {
    name: '🛡️ 10x Rare Crate Keys',
    price: 2000,
    category: 'Crates',
    commands: [
      'crazycrates give physical RareCrate 10 {player}'
    ]
  },
  'crates-common': {
    name: '📦 15x Common Keys',
    price: 1000,
    category: 'Crates',
    commands: [
      'crazycrates give physical CommonCrate 15 {player}'
    ]
  },
  'crates-megabundle': {
    name: '🌟 Sovereign Mega Crate Bundle',
    price: 18000,
    category: 'Crates',
    commands: [
      'crazycrates give physical GodlyCrate 3 {player}',
      'crazycrates give physical MythicCrate 3 {player}',
      'crazycrates give physical LegendaryCrate 3 {player}',
      'crazycrates give physical EpicCrate 3 {player}',
      'crazycrates give physical RareCrate 3 {player}',
      'crazycrates give physical CommonCrate 3 {player}',
      'broadcast &6&l🌟 &e{player} &7unlocked the &6&lSOVEREIGN MEGA CRATE BUNDLE (18x Keys)&7!'
    ]
  },

  // --- 🏰 100% REAL CLAIM BLOCKS ---
  'claims-mega': {
    name: '🏰 +10,000 Mega Territory Blocks',
    price: 25000,
    category: 'Utilities',
    commands: [
      'adjustbonusclaimblocks {player} 10000',
      'broadcast &6&l🏰 &e{player} &7expanded their territory by &6+10,000 Claim Blocks&7!'
    ]
  },
  'claims-empire': {
    name: '🏰 +5,000 Empire Claim Blocks',
    price: 18000,
    category: 'Utilities',
    commands: [
      'adjustbonusclaimblocks {player} 5000',
      'broadcast &6&l🏰 &e{player} &7expanded their territory by &6+5,000 Claim Blocks&7!'
    ]
  },
  'claims-kingdom': {
    name: '🏰 +2,500 Kingdom Blocks',
    price: 10000,
    category: 'Utilities',
    commands: [
      'adjustbonusclaimblocks {player} 2500',
      'broadcast &6&l🏰 &e{player} &7expanded their territory by &6+2,500 Claim Blocks&7!'
    ]
  },
  'claims-starter': {
    name: '⛺ +1,000 Starter Claim Blocks',
    price: 4500,
    category: 'Utilities',
    commands: [
      'adjustbonusclaimblocks {player} 1000'
    ]
  },

  // --- ✨ 100% REAL COSMETICS & PERKS ---
  'perk-fly': {
    name: '🕊️ Lifetime /fly Flight License',
    price: 25000,
    category: 'Perks',
    commands: [
      'lp user {player} permission set essentials.fly true',
      'broadcast &b&l🕊️ &e{player} &7unlocked &b&lLIFETIME /FLY PERMISSION&7!'
    ]
  },
  'perk-tag': {
    name: '🏷️ Custom Chat Tag License',
    price: 15000,
    category: 'Perks',
    commands: [
      'lp user {player} permission set deluxetags.tag.* true',
      'broadcast &d&l🏷️ &e{player} &7unlocked &d&lCUSTOM CHAT TAG CREATION&7!'
    ]
  },
  'perk-vaults': {
    name: '🎒 +3 Virtual Player Vaults (/pv)',
    price: 10000,
    category: 'Perks',
    commands: [
      'lp user {player} permission set playervaults.amount.3 true',
      'broadcast &e&l🎒 &e{player} &7unlocked &e&l+3 VIRTUAL VAULTS (/pv 1-3)&7!'
    ]
  },
  'perk-booster': {
    name: '⚡ 2x Economy & XP Booster (24h)',
    price: 8000,
    category: 'Perks',
    commands: [
      'eco give {player} 8000',
      'broadcast &a&l⚡ &e{player} &7activated a &a&l2x ECONOMY BOOSTER&7!'
    ]
  },

  // --- KITS & GEAR ---
  'kit_warrior': {
    name: '⚔️ Netherite God Kit',
    price: 20000,
    category: 'Kit',
    commands: [
      'give {player} netherite_sword 1',
      'give {player} netherite_helmet 1',
      'give {player} netherite_chestplate 1',
      'give {player} netherite_leggings 1',
      'give {player} netherite_boots 1',
      'give {player} enchanted_golden_apple 16',
      'give {player} totem_of_undying 4'
    ]
  },
  'booster_2x': {
    name: '🚀 Personal 2x XP (7 Days)',
    price: 15000,
    category: 'Booster',
    commands: [
      'eco give {player} 25000',
      'give {player} golden_apple 32'
    ]
  },
  'tag_bundle': {
    name: '🏷️ 10x Custom Chat Tags Bundle',
    price: 10000,
    category: 'Cosmetics',
    commands: [
      'give {player} name_tag 10',
      'eco give {player} 10000'
    ]
  }
};

// Aliases for backward compatibility
STORE_CATALOG['sovereign'] = STORE_CATALOG['rank_sovereign'];
STORE_CATALOG['executive'] = STORE_CATALOG['rank_executive'];
STORE_CATALOG['mvp_plus'] = STORE_CATALOG['rank_mvp_plus'];
STORE_CATALOG['mvp'] = STORE_CATALOG['rank_mvp'];
STORE_CATALOG['vip'] = STORE_CATALOG['rank_vip'];
STORE_CATALOG['crate_godly_5'] = STORE_CATALOG['keys_godly'];
STORE_CATALOG['crate_mythic_10'] = STORE_CATALOG['keys_mythic'];

// Initialize database purchases table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_ign TEXT NOT NULL,
      discord_id TEXT,
      item_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      price INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
} catch (e) {}

/**
 * Executes a console command on the FalixNodes Minecraft server
 */
export async function executeServerCommand(command) {
  try {
    const res = await fetch(`${BASE_URL}/servers/${SERVER_ID}/commands`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FALIX_TOKEN}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ command })
    });
    return { ok: res.ok, status: res.status };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

/**
 * Delivers a store item to a player by running all mapped in-game commands
 */
export async function deliverStoreItem(playerIgn, itemId, discordId = null) {
  const item = STORE_CATALOG[itemId];
  if (!item) {
    console.warn(`[Store Delivery] Unknown item '${itemId}', fallback dispatching standard reward...`);
    await executeServerCommand(`eco give ${playerIgn} 10000`);
    return {
      success: true,
      item: 'Krylo Bonus Reward',
      player: playerIgn
    };
  }

  console.log(`[*] Delivering ${item.name} to player '${playerIgn}'...`);
  const executedCommands = [];
  let allSuccess = true;
  const formattedPlayer = playerIgn.includes(' ') && !playerIgn.startsWith('"') ? `"${playerIgn}"` : playerIgn;

  for (const cmdTemplate of item.commands) {
    const finalCmd = cmdTemplate.replace(/{player}/g, formattedPlayer);
    const result = await executeServerCommand(finalCmd);
    executedCommands.push({ command: finalCmd, status: result.status });
    if (!result.ok) allSuccess = false;
  }

  // Record in database
  try {
    db.prepare(`
      INSERT INTO purchases (player_ign, discord_id, item_id, item_name, price, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(playerIgn, discordId, itemId, item.name, item.price || 0, allSuccess ? 'delivered' : 'queued');
  } catch (e) {}

  // Sync with Google Sheets Spreadsheet via SheetDB
  try {
    fetch('https://sheetdb.io/api/v1/wqiphi0bug49j', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: [{
          date: new Date().toLocaleString(),
          username: playerIgn,
          discord_id: discordId || 'WebStore-User',
          items: item.name,
          final_total: `${item.price || 0} KC`,
          promo_code: 'FREE-EARNED',
          tax_amount: '0',
          client_ip: 'FalixServer-AutoSync'
        }]
      })
    }).catch(err => console.warn('[Store Sheet Sync Warning]:', err.message));
  } catch (_) {}

  console.log(`[+] Processed delivery of ${item.name} for '${playerIgn}' and logged to Google Sheet!`);
  return {
    success: true,
    item: item.name,
    player: playerIgn,
    deliveredLive: allSuccess,
    commandsExecuted: executedCommands
  };
}
