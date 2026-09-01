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
  // --- RANKS ---
  'rank_sovereign': {
    name: '👑 Sovereign Rank',
    price: 100000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set sovereign',
      'eco give {player} 50000',
      'coins give {player} 50000',
      'broadcast &6&l⚡ &e{player} &7just unlocked &6&l👑 SOVEREIGN RANK &7from the Web Store!'
    ]
  },
  'rank_executive': {
    name: '💎 Executive Rank',
    price: 60000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set executive',
      'eco give {player} 30000',
      'coins give {player} 30000',
      'broadcast &b&l⚡ &e{player} &7just unlocked &b&l💎 EXECUTIVE RANK &7from the Web Store!'
    ]
  },
  'rank_mvp_plus': {
    name: '🔮 MVP+ Rank',
    price: 40000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set mvp_plus',
      'eco give {player} 20000',
      'coins give {player} 20000',
      'broadcast &d&l⚡ &e{player} &7just unlocked &d&l🔮 MVP+ RANK &7from the Web Store!'
    ]
  },
  'rank_mvp': {
    name: '⭐ MVP Rank',
    price: 25000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set mvp',
      'eco give {player} 15000',
      'coins give {player} 15000',
      'broadcast &e&l⚡ &e{player} &7just unlocked &e&l⭐ MVP RANK &7from the Web Store!'
    ]
  },
  'rank_vip': {
    name: '🟢 VIP Rank',
    price: 15000,
    category: 'Rank',
    commands: [
      'lp user {player} parent set vip',
      'eco give {player} 10000',
      'coins give {player} 10000',
      'broadcast &a&l⚡ &e{player} &7just unlocked &a&l🟢 VIP RANK &7from the Web Store!'
    ]
  },

  // --- CRATE KEYS ---
  'keys_godly': {
    name: '👑 5x Godly Crate Keys',
    price: 35000,
    category: 'Crates',
    commands: [
      'crazycrates give physical GodlyCrate 5 {player}',
      'broadcast &6&l⚡ &e{player} &7received &65x 👑 Godly Keys &7from the Web Store!'
    ]
  },
  'keys_mythic': {
    name: '🔮 10x Mythic Crate Keys',
    price: 25000,
    category: 'Crates',
    commands: [
      'crazycrates give physical MythicCrate 10 {player}',
      'broadcast &d&l⚡ &e{player} &7received &d10x 🔮 Mythic Keys &7from the Web Store!'
    ]
  },
  'keys_legendary': {
    name: '🔴 10x Legendary Crate Keys',
    price: 18000,
    category: 'Crates',
    commands: [
      'crazycrates give physical LegendaryCrate 10 {player}'
    ]
  },
  'keys_epic': {
    name: '🟣 15x Epic Crate Keys',
    price: 12000,
    category: 'Crates',
    commands: [
      'crazycrates give physical EpicCrate 15 {player}'
    ]
  },
  'keys_rare': {
    name: '🔵 20x Rare Crate Keys',
    price: 8000,
    category: 'Crates',
    commands: [
      'crazycrates give physical RareCrate 20 {player}'
    ]
  },
  'keys_common': {
    name: '🟢 30x Common Crate Keys',
    price: 5000,
    category: 'Crates',
    commands: [
      'crazycrates give physical CommonCrate 30 {player}'
    ]
  },

  // --- LAND & UTILITY PACKS ---
  'claim_blocks_10k': {
    name: '🛡️ 10,000 Land Claim Blocks',
    price: 25000,
    category: 'Utilities',
    commands: [
      'adjustbonusclaimblocks {player} 10000',
      'broadcast &6&l🛡️ &e{player} &7expanded their land claim by &6&l10,000 Claim Blocks&7!'
    ]
  },
  'elytra_master_pack': {
    name: '🪽 Elytra Wings & Rockets Pack',
    price: 15000,
    category: 'Utilities',
    commands: [
      'give {player} elytra 1',
      'give {player} firework_rocket 192',
      'broadcast &b&l🪽 &e{player} &7unlocked the &b&lElytra Flight Gear Pack&7!'
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
