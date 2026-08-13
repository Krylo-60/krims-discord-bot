import crypto from 'crypto';
import fs from 'fs';

// ═══════════════════════════════════════════════════════════
// FREE CUSTOM API KEY GENERATOR & MANAGER
// ═══════════════════════════════════════════════════════════

/**
 * Generate a cryptographically secure API key with a custom prefix
 * @param {string} prefix - Custom prefix (e.g., 'krylo', 'krims', 'krylosmp')
 * @param {string} env - Environment type ('live', 'dev', 'admin')
 * @param {number} byteLength - Length of random entropy (default 24 bytes -> 48 hex chars)
 * @returns {string} - Generated API Key (e.g. krylo_live_a1b2c3d4e5f6...)
 */
export function generateApiKey(prefix = 'krylo', env = 'live', byteLength = 24) {
  const cleanPrefix = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
  const randomHex = crypto.randomBytes(byteLength).toString('hex');
  return `${cleanPrefix}_${env}_${randomHex}`;
}

/**
 * Save an API Key to local database (api_keys.json)
 */
export function saveApiKey(key, ownerName, permissions = ['read', 'write']) {
  const DB_FILE = 'api_keys.json';
  let keysData = {};

  if (fs.existsSync(DB_FILE)) {
    try {
      keysData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (e) {
      keysData = {};
    }
  }

  keysData[key] = {
    owner: ownerName,
    permissions: permissions,
    createdAt: new Date().toISOString(),
    active: true
  };

  fs.writeFileSync(DB_FILE, JSON.stringify(keysData, null, 2));
  return keysData[key];
}

// Quick Test Demo
console.log('--- 🔑 CUSTOM API KEY GENERATION DEMO ---');
const key1 = generateApiKey('krylo', 'live');
const key2 = generateApiKey('krims', 'dev');
const key3 = generateApiKey('krylosmp', 'admin');

console.log('1. Krylo Live Key  :', key1);
console.log('2. Krims Dev Key   :', key2);
console.log('3. KryloSMP Admin  :', key3);

saveApiKey(key1, 'Krylo (Owner)', ['full_access']);
console.log('\n✅ Key 1 saved to api_keys.json!');
