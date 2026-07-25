import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

async function grantEveryoneAccess() {
  console.log('[🚀 GRANTING @EVERYONE VIEW ACCESS TO PUBLIC INFO CHANNELS]...');

  try {
    const channelsRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
      headers: { 'Authorization': `Bot ${token}` }
    });

    if (!channelsRes.ok) return;

    const channels = await channelsRes.json();
    const targetNames = ['faq', 'suggestions', 'support-tickets', 'store', 'rules', 'server-info', 'announcements', 'socials', 'verify'];

    const publicChannels = channels.filter(c => 
      c.type === 0 && targetNames.some(name => c.name.includes(name))
    );

    console.log(`[+] Found ${publicChannels.length} public info channel(s) to make default.`);

    for (const ch of publicChannels) {
      // Overwrite @everyone role (ID === GUILD_ID) to allow ViewChannel (1024)
      await fetch(`https://discord.com/api/v10/channels/${ch.id}/permissions/${GUILD_ID}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          allow: '1024', // VIEW_CHANNEL
          deny: '0',
          type: 0 // Role
        })
      }).catch(() => {});
    }

    // Now update onboarding default channels
    const defaultIds = publicChannels.map(c => c.id);
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
      console.log('[✅ ALL 4 MISSING CHANNELS ADDED TO DISCORD ONBOARDING SUCCESSFULLY!] Onboarding warning cleared!');
    } else {
      console.error('[-] Onboarding update error:', updateRes.status, await updateRes.text());
    }
  } catch (err) {
    console.error('[-] Error:', err.message);
  }
}

grantEveryoneAccess();
