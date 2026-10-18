import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'application_emojis.json');

let emojiCache = null;

export function getApplicationEmojis() {
  if (emojiCache) return emojiCache;
  try {
    if (fs.existsSync(DATA_FILE)) {
      emojiCache = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      return emojiCache;
    }
  } catch (e) {
    console.error('[ApplicationEmojis] Failed to read application emojis:', e);
  }
  return {};
}

export function getEmoji(name) {
  const emojis = getApplicationEmojis();
  return emojis[name]?.tag || '';
}

export function getEmojiId(name) {
  const emojis = getApplicationEmojis();
  return emojis[name]?.id || null;
}

export default {
  getApplicationEmojis,
  getEmoji,
  getEmojiId
};
