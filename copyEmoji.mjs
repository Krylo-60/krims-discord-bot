import fs from 'fs';

const src = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\krylosmp_custom_emoji_1784938774516.jpg';
const dest = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\krylosmp_crown_cookie_emoji.jpg';

fs.copyFileSync(src, dest);
console.log('[🎉 CUSTOM EMOJI SAVED TO WORKSPACE!]', dest);
