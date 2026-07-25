import fs from 'fs';

const src = 'C:\\Users\\naina\\.gemini\\antigravity\\brain\\3b5ba9e3-cf39-4150-bdda-eb9b1dc6e58c\\krylostyle_custom_emoji_1784938835092.jpg';
const dest = 'C:\\Users\\naina\\.gemini\\antigravity\\scratch\\krims-discord-bot\\krylostyle_signature_emoji.jpg';

fs.copyFileSync(src, dest);
console.log('[🎉 KRYLOSTYLE SIGNATURE EMOJI SAVED TO WORKSPACE!]', dest);
