import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { db, neonPool } from '../databaseEngine.mjs';

const channelId = '1570582331494760563';
const guildId = '1568083131624460371';
const miniUserId = '1541259051801780275';
const kryloUserId = '1414143825538191373';
const statusMsgId = '1570582332912570469';
const msg24Id = '1572783903624921199';
const errorBreakMsgId = '1572783906711797872';

const miniXToken = Buffer.from('TVRVMk5UZzBPREV3TlRJM056QTJOelF4TkEuR210NDJyLk5TdTBON3hsY3ZnSlhKQVFrS0FzZEV4ZmlvNG5nQTZCcUFuWjNJ', 'base64').toString('utf-8');

async function main() {
  console.log('[Counting Restorer] Restoring count to 24 (Mini)...');

  // 1. Update SQLite DB
  try {
    db.prepare(`
      UPDATE counting_state 
      SET current_number = 24, last_user_id = ?, high_score = MAX(high_score, 24)
      WHERE channel_id = ?
    `).run(miniUserId, channelId);

    db.prepare(`
      INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counts_count + 1
    `).run(miniUserId, guildId);

    console.log('✅ SQLite updated: count = 24, last_user = Mini');
  } catch (err) {
    console.error('SQLite error:', err);
  }

  // 2. Update Neon Postgres Cloud DB
  if (neonPool) {
    try {
      const client = await neonPool.connect();
      await client.query(`
        UPDATE counting_state 
        SET current_number = 24, 
            last_user_id = $1, 
            high_score = GREATEST(COALESCE(high_score, 0), 24), 
            updated_at = NOW()
        WHERE channel_id = $2
      `, [miniUserId, channelId]);

      await client.query(`
        INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
        VALUES ($1, $2, 1)
        ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counting_user_stats.counts_count + 1
      `, [miniUserId, guildId]).catch(() => {});

      client.release();
      console.log('✅ Neon Postgres updated: count = 24');
    } catch (err) {
      console.error('Neon error:', err);
    }
  }

  // 3. Connect via Mini X
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
  await client.login(miniXToken);

  const channel = await client.channels.fetch(channelId);

  // Delete the false error embed
  try {
    const errorMsg = await channel.messages.fetch(errorBreakMsgId).catch(() => null);
    if (errorMsg) {
      await errorMsg.delete();
      console.log('✅ Deleted erroneous "Counting Chain Broken" bot message');
    }
  } catch (e) {
    console.warn('Could not delete error embed:', e.message);
  }

  // React to 24 with ✅ and 🔥 (and remove ❌)
  try {
    const msg24 = await channel.messages.fetch(msg24Id);
    await msg24.reactions.resolve('❌')?.users.remove(client.user.id).catch(() => {});
    await msg24.react('✅').catch(() => {});
    await msg24.react('🔥').catch(() => {});
    console.log('✅ Reacted to 24 with ✅ and 🔥');
  } catch (e) {
    console.warn('Could not react to 24:', e.message);
  }

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
          `✨ *Current Count:* **24** (Next: **\`25\`**) | *Record High Score:* **24**\n` +
          `👉 **Drop \`25\` in chat to reach Milestone 25!**`
        );
      await statusMsg.edit({ embeds: [newEmbed] });
      console.log('✅ Updated status embed to 24/25');
    }
  } catch (e) {
    console.warn('Failed updating status embed:', e.message);
  }

  // 5. Send confirmation announcement
  const announceEmbed = new EmbedBuilder()
    .setColor(0x10B981)
    .setTitle('👑 COUNT RESTORED & REINSTATED!')
    .setDescription(
      `**👑 Mini**'s number **\`24\`** has been officially verified and restored! ✅🔥\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• **Current Count:** \`24\` (by <@${miniUserId}>)\n` +
      `• **Record High Score:** \`24\` 🏆\n` +
      `• **Next Number:** **\`25\`**\n` +
      `• **Next Turn:** <@${kryloUserId}> (Krylo must type **\`25\`** for the Milestone celebration! 🎉)\n\n` +
      `🚀 *The streak is alive and unbroken! Drop 25!*`
    )
    .setFooter({ text: `${channel.guild.name} • Counting Engine` })
    .setTimestamp();

  await channel.send({ embeds: [announceEmbed] });
  console.log('✅ Sent restoration announcement into #🔢・counting');

  process.exit(0);
}

main().catch(console.error);
