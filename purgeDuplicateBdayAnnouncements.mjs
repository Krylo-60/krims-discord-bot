import dotenv from 'dotenv';
dotenv.config();

const token = process.env.DISCORD_TOKEN;
const ANNOUNCEMENTS_CHANNEL_ID = '1526685107044356198';

async function purgeDuplicateAnnouncements() {
  console.log('[🚀 CLEANING UP DUPLICATE ANNOUNCEMENTS] Fetching messages from #announcements...');

  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${ANNOUNCEMENTS_CHANNEL_ID}/messages?limit=25`, {
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.error('[-] Failed to fetch announcements:', res.status, await res.text());
      return;
    }

    const messages = await res.json();
    console.log(`[+] Total messages in #announcements: ${messages.length}`);

    // Filter messages created by bot with Birthday title
    const bdayMsgs = messages.filter(m => 
      m.embeds && m.embeds.some(e => e.title && e.title.includes("OFFICIALLY KRYLO'S BIRTHDAY"))
    );

    console.log(`[+] Found ${bdayMsgs.length} birthday announcement message(s).`);

    if (bdayMsgs.length > 1) {
      // Sort ascending by ID (earliest first)
      bdayMsgs.sort((a, b) => (BigInt(a.id) > BigInt(b.id) ? 1 : -1));

      const keepMsg = bdayMsgs[0];
      const deleteMsgs = bdayMsgs.slice(1);

      console.log(`[+] Keeping original message ID: ${keepMsg.id}`);

      for (const msg of deleteMsgs) {
        console.log(`[-] Deleting duplicate message ID: ${msg.id}...`);
        const delRes = await fetch(`https://discord.com/api/v10/channels/${ANNOUNCEMENTS_CHANNEL_ID}/messages/${msg.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bot ${token}`
          }
        });
        if (delRes.ok || delRes.status === 204) {
          console.log(`[✅ DELETED DUPLICATE MESSAGE ${msg.id}]`);
        } else {
          console.warn(`[!] Failed to delete message ${msg.id}: status ${delRes.status}`);
        }
      }
    } else {
      console.log('[+] Only 1 birthday message exists. No duplicate cleanup needed.');
    }
  } catch (err) {
    console.error('[-] Purge error:', err.message);
  }
}

purgeDuplicateAnnouncements();
