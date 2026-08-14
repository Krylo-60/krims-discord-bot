import dotenv from 'dotenv';
dotenv.config();

const GUILD_ID = '1524878881918685405';

async function checkOnboarding() {
  const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/onboarding`, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

checkOnboarding();
