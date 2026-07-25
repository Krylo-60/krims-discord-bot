import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

async function fetchServerEmojis() {
  console.log('[🚀 FETCHING SERVER EMOJIS] Getting uploaded custom emojis for KryloSMP...');

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/emojis`, {
      headers: { 'Authorization': `Bot ${token}` }
    });

    if (res.ok) {
      const emojis = await res.json();
      console.log(`[+] Total custom emojis found: ${emojis.length}`);
      emojis.forEach(e => {
        console.log(`📌 Emoji Name: :${e.name}: | ID: ${e.id} | Format: <: ${e.name}:${e.id} >`);
      });
    } else {
      console.error('[-] Failed to fetch emojis:', res.status, await res.text());
    }
  } catch (err) {
    console.error('[-] Error fetching emojis:', err.message);
  }
}

fetchServerEmojis();
