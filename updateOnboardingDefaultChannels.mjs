import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

async function updateOnboarding() {
  console.log('[🚀 CHECKING DISCORD ONBOARDING & DEFAULT CHANNELS]...');

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/onboarding`, {
      headers: { 'Authorization': `Bot ${token}` }
    });

    console.log(`[+] Onboarding GET status: ${res.status}`);
    if (res.ok) {
      const onboardingData = await res.json();
      console.log('[+] Current Onboarding Data:', JSON.stringify(onboardingData, null, 2));
    } else {
      console.log('[-] Onboarding fetch response:', await res.text());
    }
  } catch (err) {
    console.error('[-] Error checking onboarding:', err.message);
  }
}

updateOnboarding();
