import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = '1524878881918685405';

async function deploy() {
  console.log('[Deploy] Fetching channels for guild:', GUILD_ID);
  
  // 1. Fetch Guild Channels
  const chRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
    headers: { Authorization: `Bot ${TOKEN}` }
  });
  const channels = await chRes.json();
  
  let verifyChannel = channels.find(c => c.name.toLowerCase().includes('verify') || c.name.toLowerCase().includes('link'));
  
  if (!verifyChannel) {
    console.log('[Deploy] Creating #verify channel...');
    const createRes = await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/channels`, {
      method: 'POST',
      headers: {
        Authorization: `Bot ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'verify',
        type: 0 // Text channel
      })
    });
    verifyChannel = await createRes.json();
  }

  console.log('[Deploy] Found #verify channel:', verifyChannel.name, 'ID:', verifyChannel.id);

  // 2. Build 4-Button Verification Embed matching screenshot layout
  const embed = {
    title: '🔗 Minecraft Account Linking',
    description: 
      'Link your Minecraft account to get a chance to participate in future events and claim exclusive rewards!\n\n' +
      '**How to Link:**\n' +
      '1. Click **Link Account** below\n' +
      '2. Enter your Minecraft Username (Java or Bedrock)\n' +
      '3. Connect to **`KryloSmp.play.hosting`**\n' +
      '4. Your account will be automatically linked & whitelisted!\n\n' +
      '🔒 **Privacy Policy**\n' +
      '🌐 **Server Address:** `KryloSmp.play.hosting`  |  🕹️ **Supported Versions:** Java & Bedrock 1.21.x',
    color: 0x00FF66,
    footer: { text: 'KryloSMP Account Linking System ⚡' }
  };

  const components = [
    {
      type: 1, // Action Row
      components: [
        {
          type: 2, // Button
          custom_id: 'start_verification',
          label: 'Link Account',
          style: 3 // Success (Green)
        },
        {
          type: 2,
          custom_id: 'unlink_account',
          label: 'Unlink Account',
          style: 4 // Danger (Red)
        },
        {
          type: 2,
          custom_id: 'update_username',
          label: 'Update Username',
          style: 1 // Primary (Blue)
        },
        {
          type: 2,
          custom_id: 'check_status',
          label: 'Check Status',
          style: 2 // Secondary (Gray)
        }
      ]
    }
  ];

  // 3. Post Message
  const msgRes = await fetch(`https://discord.com/api/v10/channels/${verifyChannel.id}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      embeds: [embed],
      components: components
    })
  });

  if (msgRes.ok) {
    console.log('✅ Successfully posted 4-button Account Linking panel to #' + verifyChannel.name);
  } else {
    const errText = await msgRes.text();
    console.error('❌ Failed to post message:', errText);
  }
}

deploy().catch(console.error);
