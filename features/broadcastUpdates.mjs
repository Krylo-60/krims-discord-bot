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
    .setTitle('🚀 Krims Code AI • v5.2 Feature & Terms of Service Update')
    .setDescription(
      `Hello Server Owners & Community Members! 👋\n\n` +
      `We have deployed a major upgrade to **Krims Code AI** across all servers. This release introduces **Persistent Neural Memory**, **Cross-Server Counting Game**, and our **Updated Terms of Service (ToS)**.`
    )
    .addFields(
      {
        name: '🧠 1. Persistent Server AI Memory & Knowledge Base',
        value: 
          '• **Continuous Memory:** Krims Code AI now remembers past server conversations, team lore, and facts across bot restarts.\n' +
          '• **Admin Control:** Server Administrators can inspect memory stats or perform a complete wipe anytime using `/memory` or `!resetmemory`.\n' +
          '• **Teach Facts:** Staff can teach permanent server knowledge using `/memory action:learn` or `!remember <fact>`.'
      },
      {
        name: '🔢 2. Cross-Server Counting Game Engine',
        value:
          '• **Live Status Embed:** Real-time auto-updating status dashboard pinned in counting channels.\n' +
          '• **Global Leaderboard:** Compete against other servers using `/counting action:leaderboard` or `!counting lb`!\n' +
          '• **Link Channels:** Staff can link any channel using `/counting action:link` or `!setcounting`.'
      },
      {
        name: '🏷️ 3. Automatic Minecraft IGN Sync',
        value:
          '• Automatically extracts Minecraft IGNs from roster channels and synchronizes server nicknames.\n' +
          '• Integrates member identities directly into the bot\'s AI memory knowledge base.'
      },
      {
        name: '🛡️ 4. Open Team Communication (Restriction Removal)',
        value:
          '• All restrictive mention warnings and strike penalties have been completely abolished across all servers.\n' +
          '• Members and teammates can now freely communicate without false strike interruptions.'
      },
      {
        name: '📜 5. Updated Terms of Service (ToS) & Data Privacy',
        value:
          '• **Data Isolation:** Each server\'s neural memory and facts are strictly isolated per server.\n' +
          '• **Right to Erase:** Server owners hold 100% control to purge their server data with zero trace.\n' +
          '• **Privacy Commitment:** We never sell, rent, or monetize your server conversations.\n' +
          '• **Read Full Policy:** Type `/about` or visit https://krims-code-chatbot.vercel.app/terms'
      }
    )
    .setFooter({ text: 'Krims Code Studio • Automated Server Owner Dispatch' })
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
