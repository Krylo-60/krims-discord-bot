import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

// Master secret key used to derive AES encryption key
const MASTER_SECRET = process.env.TOKEN_ENCRYPTION_KEY || process.env.DISCORD_PUBLIC_KEY || 'krylo-multi-bot-secure-engine-2026';
const SALT = 'krylo_salt_secure_99';
const ALGORITHM = 'aes-256-gcm';

// Derive 32-byte key from master secret using scrypt
const key = crypto.scryptSync(MASTER_SECRET, SALT, 32);

/**
 * Encrypt a sensitive bot token with AES-256-GCM
 * @param {string} token 
 * @returns {string} iv:authTag:encryptedData (hex encoded)
 */
export function encryptToken(token) {
  if (!token) return '';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypt an encrypted token
 * @param {string} cipherText 
 * @returns {string} Plaintext token
 */
export function decryptToken(cipherText) {
  if (!cipherText) return '';
  try {
    const parts = cipherText.split(':');
    if (parts.length !== 3) {
      // If it wasn't encrypted (legacy / raw fallback)
      return cipherText;
    }
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[-] Failed to decrypt token:', err.message);
    return '';
  }
}
