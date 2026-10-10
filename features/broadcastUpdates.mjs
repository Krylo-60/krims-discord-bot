import { EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;

/**
 * 📢 Broadcast Master Update & New ToS Dispatch
 * Sends directly to:
 * 1. All unique Server Owners via DM
 * 2. System / Announcement channels in all connected servers
 */
export async function broadcastUpdateToAllGuildsAndOwners() {
  const results = {
    ownersNotified: [],
    channelsNotified: [],
    errors: []
  };

  const updateEmbed = new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('🚀 Krims Code AI • v5.3 All-In-One Power Upgrade & Community Dispatch')
    .setDescription(
      `Hello Server Owners! 👋\n\n` +
      `We have just deployed a brand-new **All-In-One Utility & Moderation Suite** to **Krims Code AI** across all your servers! Here is everything newly unlocked:`
    )
    .addFields(
      {
        name: '🛠️ 1. All-In-One Utility Suite Now Live',
        value: 
          '• 🌐 **`/translate`** — Instant multi-language translation (English, Spanish, French, Japanese, etc.)\n' +
          '• 🧮 **`/calc`** — Solve complex math formulas and expressions right in Discord chat\n' +
          '• ☀️ **`/weather`** — Real-time worldwide weather conditions and forecasts\n' +
          '• ⏰ **`/remind`** — Automated countdown reminder notifications sent directly to your DMs\n' +
          '• 🏓 **`/ping`** — Live roundtrip latency, Discord gateway ping, and database response telemetry\n' +
          '• 🧹 **`/clear`** — Lightning-fast message purges for staff\n' +
          '• ⏱️ **`/uptime`** — Bot system metrics, heap memory, and operational runtime'
      },
      {
        name: '🧠 2. Persistent Neural Memory & Counting Game',
        value: 
          '• **Persistent Server Memory:** Remembers past conversations and lore across bot restarts (`/memory`).\n' +
          '• **Cross-Server Counting:** Compete with other servers for the highest unbroken count (`/counting`).'
      },
      {
        name: '❤️ 3. Support Us & Invite Krims Code AI to Your Other Servers!',
        value:
          'If you and your members are enjoying **Krims Code AI**, please consider:\n' +
          '• 🤝 **Sharing Krims Code:** Tell your server members, moderators, and friends about us!\n' +
          '• ➕ **Adding Krims Code to Other Servers:** You can invite Krims Code AI to any of your friend groups or communities for FREE using `/getbot` or by clicking the bot profile!\n' +
          '• ⭐ **Feedback & Ideas:** Let us know what features you want next using `/suggest`!'
      },
      {
        name: '📜 4. Updated Terms of Service (ToS) & Data Protection',
        value:
          '• Strict server data isolation per guild.\n' +
          '• Server owners retain 100% control to view or erase their data anytime via `/memory action:reset`.\n' +
          '• Full ToS details: type `/about` or visit https://krims-code-chatbot.vercel.app/terms'
      }
    )
    .setFooter({ text: 'Krims Code AI • Direct Dispatch to Server Owners' })
    .setTimestamp();

  try {
    // 1. Fetch all guilds
    const gRes = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: { 'Authorization': `Bot ${token}` }
    });
    const guilds = await gRes.json();

    const uniqueOwnerIds = new Set();
    const fullGuilds = [];

    for (const g of guilds) {
      const detailRes = await fetch(`https://discord.com/api/v10/guilds/${g.id}`, {
        headers: { 'Authorization': `Bot ${token}` }
      });
      const full = await detailRes.json();
      fullGuilds.push(full);
      if (full.owner_id) {
        uniqueOwnerIds.add(full.owner_id);
      }
    }

    // 2. Notify Server Owners via DM
    for (const ownerId of uniqueOwnerIds) {
      try {
        // Open DM channel
        const dmRes = await fetch('https://discord.com/api/v10/users/@me/channels', {
          method: 'POST',
          headers: {
            'Authorization': `Bot ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ recipient_id: ownerId })
        });
        const dmChannel = await dmRes.json();

        if (dmChannel.id) {
          const sendRes = await fetch(`https://discord.com/api/v10/channels/${dmChannel.id}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bot ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ embeds: [updateEmbed.toJSON()] })
          });

          if (sendRes.ok) {
            results.ownersNotified.push(ownerId);
            console.log(`[Update Dispatch] ✅ Sent update DM to Server Owner: ${ownerId}`);
          } else {
            console.warn(`[Update Dispatch] ⚠️ Could not DM owner ${ownerId} (DMs might be closed): ${sendRes.status}`);
          }
        }
      } catch (dmErr) {
        results.errors.push(`DM Error (${ownerId}): ${dmErr.message}`);
      }
    }

    // Note: Public channel broadcasts are disabled per server management policy.
    // All updates and ToS dispatches are sent STRICTLY via Direct Message (DM) to server owners.

  } catch (err) {
    console.error('[Update Dispatch Error]', err);
    results.errors.push(err.message);
  }

  return results;
}
