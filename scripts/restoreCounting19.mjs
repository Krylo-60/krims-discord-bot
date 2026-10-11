import dotenv from 'dotenv';
dotenv.config();
import pg from 'pg';
import Database from 'better-sqlite3';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function restoreCountingState() {
  const channelId = '1558234543494930462'; // #🔢・𝖢ounting in The_Half_Lifes
  const guildId = '1557852594242719775';
  const kryloUserId = '1414143825538191373';
  const correctCount = 19;
  const newHighScore = 19;
  const token = process.env.DISCORD_TOKEN;

  console.log(`[Counting Restorer] Restoring count to ${correctCount} with lastCounter = Krylo...`);

  // 1. Delete the erroneous "Counting Chain Broken" bot messages
  const errMsgs = ['1558642143512363220', '1558642152387510283'];
  for (const msgId of errMsgs) {
    try {
      const delRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${msgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bot ${token}` }
      });
      console.log(`Deleted bot error message ${msgId}: status ${delRes.status}`);
    } catch (e) {
      console.warn(`Failed to delete ${msgId}:`, e.message);
    }
  }

  // 2. React ✅ to Krylo's "19" message (id: 1558642141016760382)
  try {
    const reactRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/1558642141016760382/reactions/%E2%9C%85/@me`, {
      method: 'PUT',
      headers: { Authorization: `Bot ${token}` }
    });
    console.log(`Reacted ✅ to message 19: status ${reactRes.status}`);
  } catch (e) {
    console.warn('React error:', e.message);
  }

  // 3. Update local SQLite DB
  try {
    const localDb = new Database(path.join(__dirname, '../data/krylosmp.db'));
    localDb.prepare(`
      UPDATE counting_state 
      SET current_number = ?, last_user_id = ?, high_score = ?
      WHERE channel_id = ?
    `).run(correctCount, kryloUserId, newHighScore, channelId);
    console.log('✅ Local SQLite counting state updated to 19!');
  } catch (e) {
    console.warn('SQLite update error:', e.message);
  }

  // 4. Update Neon Postgres Cloud DB
  if (process.env.DATABASE_URL) {
    try {
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const client = await pool.connect();
      await client.query(`
        UPDATE counting_state
        SET current_number = $1, last_user_id = $2, high_score = $3, updated_at = NOW()
        WHERE channel_id = $4
      `, [correctCount, kryloUserId, newHighScore, channelId]);
      client.release();
      await pool.end();
      console.log('✅ Neon Postgres cloud counting state updated to 19!');
    } catch (e) {
      console.warn('Neon Postgres update error:', e.message);
    }
  }

  // 5. Update the pinned status embed in the channel
  try {
    const statusMsgId = '1558234544300232797';
    const pinRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${statusMsgId}`, {
      headers: { Authorization: `Bot ${token}` }
    });
    const pinMsg = await pinRes.json();
    if (pinMsg && pinMsg.embeds && pinMsg.embeds.length > 0) {
      const embed = pinMsg.embeds[0];
      embed.fields = embed.fields.map(f => {
        if (f.name.includes('Status')) {
          return {
            name: '📊 Live Counting Status',
            value: `\`\`\`yaml\nCurrent Count:  19\nNext Number:    20\nHigh Score:     19\nLast Counter:   Krylo\nStatus:         🔥 Active Chain!\n\`\`\``,
            inline: false
          };
        }
        return f;
      });

      const patchRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages/${statusMsgId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bot ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ embeds: [embed] })
      });
      console.log(`Updated pinned status dashboard to 19: status ${patchRes.status}`);
    }
  } catch (e) {
    console.warn('Status embed update error:', e.message);
  }

  // 6. Post confirmation notice
  const confirmEmbed = {
    color: 0x10B981,
    title: '👑 COUNT RESTORED BY SERVER OWNER',
    description: 
      `**Krylo_MC**'s number **\`19\`** has been officially verified and reinstated! ✅\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• **Current Count:** \`19\`\n` +
      `• **High Score:** \`19\` 🔥\n` +
      `• **Last Counter:** <@${kryloUserId}>\n` +
      `• **Next Number:** **\`20\`** (must be typed by another teammate: st1LLkill3r, CrazyCoolCam, or Bexxy!)\n\n` +
      `🚀 *Streak is alive! Keep counting!*`,
    footer: { text: 'The Half Lifes • Counting Engine' },
    timestamp: new Date().toISOString()
  };

  await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bot ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ embeds: [confirmEmbed] })
  });

  console.log('✅ Sent confirmation announcement into channel!');
}

restoreCountingState();
