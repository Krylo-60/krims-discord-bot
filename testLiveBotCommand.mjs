import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;

async function checkBot() {
  const res = await fetch('https://discord.com/api/v10/users/@me', {
    headers: { Authorization: `Bot ${TOKEN}` }
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`🤖 Live Bot API Status: ${data.username}#${data.discriminator} (${data.id}) is ONLINE!`);
  } else {
    console.error('❌ Bot API Error:', await res.text());
  }
}

checkBot();
