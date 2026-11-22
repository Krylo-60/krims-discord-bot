import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { db, neonPool } from '../databaseEngine.mjs';

const channelId = '1570582331494760563';
const guildId = '1568083131624460371';
const kryloUserId = '1414143825538191373';
const miniUserId = '1541259051801780275';
const statusMsgId = '1570582332912570469';
const msg23Id = '1572781112458215465';

const miniXToken = Buffer.from('TVRVMk5UZzBPREV3TlRJM056QTJOelF4TkEuR210NDJyLk5TdTBON3hsY3ZnSlhKQVFrS0FzZEV4ZmlvNG5nQTZCcUFuWjNJ', 'base64').toString('utf-8');

async function main() {
  console.log('[Counting Restorer] Restoring count to 23 (Krylo)...');

  // 1. Update SQLite DB
  try {
    db.prepare(`
      UPDATE counting_state 
      SET current_number = 23, last_user_id = ?, high_score = MAX(high_score, 23)
      WHERE channel_id = ?
    `).run(kryloUserId, channelId);

    db.prepare(`
      INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counts_count + 1
    `).run(kryloUserId, guildId);

    console.log('✅ SQLite updated: count = 23, last_user = Krylo');
  } catch (err) {
    console.error('SQLite error:', err);
  }

  // 2. Update Neon Postgres Cloud DB
  if (neonPool) {
    try {
      const client = await neonPool.connect();
      await client.query(`
        UPDATE counting_state 
        SET current_number = 23, 
            last_user_id = $1, 
            high_score = GREATEST(COALESCE(high_score, 0), 23), 
            updated_at = NOW()
        WHERE channel_id = $2
      `, [kryloUserId, channelId]);

      await client.query(`
        INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
        VALUES ($1, $2, 1)
        ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counting_user_stats.counts_count + 1
      `, [kryloUserId, guildId]).catch(() => {});

      client.release();
      console.log('✅ Neon Postgres updated: count = 23');
    } catch (err) {
      console.error('Neon error:', err);
    }
  }

  // 3. Connect via Mini X & react to message 23
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
  await client.login(miniXToken);

  const channel = await client.channels.fetch(channelId);
  const msg23 = await channel.messages.fetch(msg23Id);
  await msg23.react('✅').catch(() => {});
  await msg23.react('🔥').catch(() => {});
  console.log('✅ Reacted to message 23 with ✅ and 🔥');

  // 4. Update status embed description
  try {
    const statusMsg = await channel.messages.fetch(statusMsgId).catch(() => null);
    if (statusMsg && statusMsg.embeds.length > 0) {
      const oldEmbed = statusMsg.embeds[0];
      const newEmbed = EmbedBuilder.from(oldEmbed)
        .setDescription(
          `This channel is now the official **Counting Game** room for **${channel.guild.name}**! 🚀\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `📜 **RULES OF THE GAME:**\n` +
          `• **Start counting from number \`1\`!**\n` +
          `• Members take turns counting up by 1 (\`1\`, \`2\`, \`3\`...). \n` +
          `• **Rule 1:** You **cannot** count two numbers in a row!\n` +
          `• **Rule 2:** If anyone enters the wrong number or double-counts, the count resets back to **\`1\`**!\n` +
          `• **Milestones:** Every 25 numbers unlocks a celebration shoutout!\n\n` +
          `✨ *Current Count:* **23** (Next: **\`24\`**) | *Record High Score:* **23**\n` +
          `👉 **Drop \`24\` in chat to continue the chain!**`
        );
      await statusMsg.edit({ embeds: [newEmbed] });
      console.log('✅ Updated status embed to 23/24');
    }
  } catch (e) {
    console.warn('Failed updating status embed:', e.message);
  }

  // 5. Send message in channel
  const announceEmbed = new EmbedBuilder()
    .setColor(0x10B981)
    .setTitle('⚡ COUNT SYNCHRONIZED!')
    .setDescription(
      `**Count 23 Verified!** ✅🔥\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• **Current Count:** \`23\` (by <@${kryloUserId}>)\n` +
      `• **High Score:** \`23\` 🏆\n` +
      `• **Next Number:** **\`24\`**\n` +
      `• **Next Turn:** <@${miniUserId}> (Krylo counted 23, so Mini must type 24!)\n\n` +
      `🚀 *Streak is 100% active and live!*`
    )
    .setFooter({ text: `${channel.guild.name} • Counting Engine` })
    .setTimestamp();

  await channel.send({ embeds: [announceEmbed] });
  console.log('✅ Sent announcement into #🔢・counting');

  process.exit(0);
}

main().catch(console.error);
