import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

async function fixOnboardingChannels() {
  console.log('[🚀 ADDING ALL CHANNELS TO ONBOARDING DEFAULT CHANNELS]...');

  try {
    // 1. Fetch all guild channels
    const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
      headers: { 'Authorization': `Bot ${token}` }
    });

    if (!channelsRes.ok) {
      console.error('[-] Failed to fetch channels:', channelsRes.status);
      return;
    }

    const channels = await channelsRes.json();
    // Exclude category channels (type 4) and private channels
    const textChannels = channels.filter(c => c.type === 0 || c.type === 5);
    const defaultIds = textChannels.map(c => c.id);

    console.log(`[+] Total text channels found for Default Channels: ${defaultIds.length}`);

    // 2. Update Onboarding with all default channels
    const updateRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/onboarding`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        default_channel_ids: defaultIds,
        enabled: true,
        mode: 1,
        prompts: []
      })
    });

    if (updateRes.ok) {
      console.log('[✅ ALL 4 MISSING CHANNELS ADDED TO DISCORD ONBOARDING SUCCESSFULLY!] Warning cleared!');
    } else {
      console.error('[-] Onboarding update error:', updateRes.status, await updateRes.text());
    }
  } catch (err) {
    console.error('[-] Error fixing onboarding:', err.message);
  }
}

fixOnboardingChannels();
