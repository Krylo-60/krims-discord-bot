import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const VERIFY_CHANNEL_ID = '1526685112693952568'; // #verify

async function repostFreshVerifyEmbed() {
  console.log('[🚀 UPDATING #VERIFY CHANNEL] Purging old embeds & posting fresh interactive verification card...');

  try {
    // 1. Purge old messages in #verify
    const fetchRes = await fetch(`https://discord.com/api/v10/channels/${VERIFY_CHANNEL_ID}/messages?limit=25`, {
      headers: { 'Authorization': `Bot ${token}` }
    });

    if (fetchRes.ok) {
      const messages = await fetchRes.json();
      console.log(`[+] Found ${messages.length} old message(s) in #verify. Purging...`);
      for (const m of messages) {
        await fetch(`https://discord.com/api/v10/channels/${VERIFY_CHANNEL_ID}/messages/${m.id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bot ${token}` }
        }).catch(() => {});
      }
    }

    // 2. Build fresh interactive verification embed
    const embed = {
      color: 0x00F2FF,
      title: '🛡️ REAL-PLAYER VERIFICATION & KRYLOSMP STARTER UNLOCK',
      description:
        '👑 **Welcome to KryloSMP — The Ultimate Cross-Platform Survival Network!**\n\n' +
        'To protect our community from spam bots and grant access to all server channels:\n\n' +
        '### 🔑 How to Verify & Unlock KryloSMP Starter Role:\n' +
        '1. Click **🔗 Link Account** below and type your Minecraft Username.\n' +
        '2. Open Minecraft and connect to **\`KryloSmp.play.hosting\`** to receive your 5-digit verification code in-game.\n' +
        '3. Return here, click **🔑 Enter Code**, and enter your code!\n' +
        '4. Agree to our 3 core server rules to claim your **KryloSMP Starter** role!\n\n' +
        '---\n\n' +
        '### 🌐 Server Connection Specs:\n' +
        '• **Java IP:** \`KryloSmp.play.hosting\` (Port: \`25565\`)\n' +
        '• **Bedrock / Mobile IP:** \`KryloSmp.play.hosting\` (Port: \`19132\`)\n' +
        '• **Webstore:** \`https://krylosmp-store.vercel.app\`',
      footer: { text: 'KryloSMP Real-Player Verification • 24/7 Cloud Automated System' },
      timestamp: new Date().toISOString()
    };

    const row = {
      type: 1,
      components: [
        {
          type: 2,
          custom_id: 'start_verification',
          label: 'Link Account',
          style: 3, // Success green
          emoji: { name: '🔗' }
        },
        {
          type: 2,
          custom_id: 'enter_verify_code',
          label: 'Enter Code',
          style: 1, // Primary blue
          emoji: { name: '🔑' }
        }
      ]
    };

    const sendRes = await fetch(`https://discord.com/api/v10/channels/${VERIFY_CHANNEL_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ embeds: [embed], components: [row] })
    });

    if (sendRes.ok) {
      console.log('[✅ FRESH #VERIFY EMBED POSTED SUCCESSFULLY!]');
    } else {
      console.error('[-] Failed to post verify embed:', sendRes.status, await sendRes.text());
    }
  } catch (err) {
    console.error('[-] Error updating #verify:', err.message);
  }
}

repostFreshVerifyEmbed();
