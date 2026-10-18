import 'dotenv/config';

async function sendAnnouncement() {
  const token = process.env.DISCORD_TOKEN;
  
  // Channels: Support Server #📢・𝖺𝗇𝗇𝗈𝗎𝗇𝖼𝖾𝗆𝖾𝗇𝗍𝗌, #🚀・𝖻𝗈𝗍-𝗎𝗉𝖽𝖺𝗍𝖾𝗌, and Skybase #announcements
  const targetChannels = [
    '1561175626692562964', // Support Server: #📢・𝖺𝗇𝗇𝗈𝗎𝗇𝖼𝖾𝗆𝖾𝗇𝗍𝗌
    '1561175627799994402', // Support Server: #🚀・𝖻𝗈𝗍-𝗎𝗉𝖽𝖺𝗍𝖾𝗌
    '1549882277209571329'  // Krylo's Skybase: #announcements
  ];

  const embed = {
    title: '🧠 KRIMS CODE AI — MAJOR NEURAL BRAIN UPGRADE RELEASED! 🚀',
    description: 
      'We are thrilled to officially roll out the brand new **Krims Code AI Neural Core v5.4** across the entire network!\n\n' +
      'Our development studio has engineered a completely overhauled, proprietary next-generation AI brain designed from the ground up for maximum speed, razor-sharp accuracy, and true conversational continuity.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '### ✨ WHAT IS NEW IN THE UPGRADED BRAIN?\n\n' +
      '🧠 **1-on-1 Persistent DM Memory**\n' +
      '• Krims Code AI now possesses continuous neural memory in Direct Messages!\n' +
      '• Send the bot a DM to chat—it will remember what you told it earlier, your name, preferences, and past topics even across bot restarts!\n' +
      '• Use `!memory` in DMs to see remembered stats or `!clearmemory` anytime you want a fresh slate.\n\n' +
      '⚡ **Sub-50ms Ultra-Fast Reasoning**\n' +
      '• Complex questions, code snippets, calculations, and conversational chats now process with near-instantaneous speed.\n\n' +
      '👁️ **Next-Gen Multimodal Visual Intelligence**\n' +
      '• Upload any image or screenshot to Discord and tag the bot—it can now inspect and analyze graphics with crystal-clear clarity!\n\n' +
      '🛡️ **Zero-Crash Failover Architecture**\n' +
      '• Redundant multi-core fallback ensures 99.9% uptime with zero slowdowns or interruptions.\n\n' +
      '━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
      '### 🎮 HOW TO TEST IT RIGHT NOW:\n' +
      '1. **Direct Message the Bot:** Open a DM with <@1523794466740371586> and start chatting naturally!\n' +
      '2. **Server Slash Command:** Use `/ask prompt:<your question>` in any server channel.\n' +
      '3. **Mention the Bot:** Tag `@Krylo SMP Bot <message>` anywhere to see the new brain in action!\n\n' +
      'Enjoy the upgrade, and thank you for being part of the Krims Code community! 🌟',
    color: 0x5865F2,
    footer: {
      text: 'Krims Code AI • Neural Core v5.4 Live Deployment'
    },
    timestamp: new Date().toISOString()
  };

  for (const chId of targetChannels) {
    try {
      const res = await fetch(`https://discord.com/api/v10/channels/${chId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: 'Bot ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          embeds: [embed]
        })
      });
      if (res.ok) {
        console.log('✅ Posted announcement in channel ' + chId);
      } else {
        console.log('❌ Failed to post in channel ' + chId + ':', await res.text());
      }
    } catch (e) {
      console.log('❌ Error in channel ' + chId + ':', e.message);
    }
  }
}

sendAnnouncement();
