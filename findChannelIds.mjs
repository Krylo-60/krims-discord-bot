import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

async function listChannels() {
  const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
    headers: { 'Authorization': `Bot ${token}` }
  });
  if (res.ok) {
    const channels = await res.json();
    channels.forEach(c => {
      if (c.name.includes('announcement') || c.name.includes('general')) {
        console.log(`📌 #${c.name} | ID: ${c.id}`);
      }
    });
  }
}

listChannels();
