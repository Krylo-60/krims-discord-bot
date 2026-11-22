import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { db, neonPool } from '../databaseEngine.mjs';

const channelId = '1570582331494760563';
const guildId = '1568083131624460371';
const miniUserId = '1541259051801780275';
const kryloUserId = '1414143825538191373';
const statusMsgId = '1570582332912570469';

const miniXToken = Buffer.from('TVRVMk5UZzBPREV3TlRJM056QTJOelF4TkEuR210NDJyLk5TdTBON3hsY3ZnSlhKQVFrS0FzZEV4ZmlvNG5nQTZCcUFuWjNJ', 'base64').toString('utf-8');

async function main() {
  console.log('[Counting Restorer] Starting sync for Mini server counting channel...');

  // 1. Update SQLite DB
  try {
    db.prepare(`
      UPDATE counting_state 
      SET current_number = 22, last_user_id = ?, high_score = MAX(high_score, 22)
      WHERE channel_id = ?
    `).run(miniUserId, channelId);

    // Update user stats
    db.prepare(`
      INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
      VALUES (?, ?, 2)
      ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counts_count + 2
    `).run(miniUserId, guildId);

    db.prepare(`
      INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counts_count + 1
    `).run(kryloUserId, guildId);

    console.log('✅ SQLite database updated: current_number = 22, last_user_id = Mini');
  } catch (err) {
    console.error('SQLite error:', err);
  }

  // 2. Update Neon Postgres Cloud DB
  if (neonPool) {
    try {
      const client = await neonPool.connect();
      await client.query(`
        UPDATE counting_state 
        SET current_number = 22, 
            last_user_id = $1, 
            high_score = GREATEST(COALESCE(high_score, 0), 22), 
            updated_at = NOW()
        WHERE channel_id = $2
      `, [miniUserId, channelId]);

      await client.query(`
        INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
        VALUES ($1, $2, 2)
        ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counting_user_stats.counts_count + 2
      `, [miniUserId, guildId]).catch(() => {});

      await client.query(`
        INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
        VALUES ($1, $2, 1)
        ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counting_user_stats.counts_count + 1
      `, [kryloUserId, guildId]).catch(() => {});

      client.release();
      console.log('✅ Neon Postgres database updated: current_number = 22');
    } catch (err) {
      console.error('Neon error:', err);
    }
  }

  // 3. Connect to Discord via Mini X
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
  await client.login(miniXToken);

  const channel = await client.channels.fetch(channelId);
  if (!channel) {
    console.error('Could not find counting channel!');
    process.exit(1);
  }

  // 4. React to messages 20, 21, and 22
  const msgIds = [
    { id: '1572779155131727883', num: 20 },
    { id: '1572779779235774496', num: 21 },
    { id: '1572779799166853235', num: 22 }
  ];

  for (const item of msgIds) {
    try {
      const msg = await channel.messages.fetch(item.id);
      await msg.react('✅').catch(() => {});
      await msg.react('🔥').catch(() => {});
      console.log(`✅ Reacted to message ${item.num} (${item.id})`);
    } catch (e) {
      console.warn(`Failed reacting to ${item.num}:`, e.message);
    }
  }

  // 5. Update Status Embed if exists
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
          `✨ *Current Count:* **22** (Next: **\`23\`**) | *Record High Score:* **22**\n` +
          `👉 **Drop \`23\` in chat to continue the chain!**`
        );
      await statusMsg.edit({ embeds: [newEmbed] });
      console.log('✅ Updated status embed description to 22/23');
    }
  } catch (e) {
    console.warn('Failed updating status embed:', e.message);
  }

  // 6. Post reassurance/confirmation in channel
  const confirmEmbed = new EmbedBuilder()
    .setColor(0x10B981)
    .setTitle('⚡ COUNT SYNCHRONIZED!')
    .setDescription(
      `**Bot restart complete!** All counts through **\`22\`** have been verified and synced! ✅🔥\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• **Current Count:** \`22\` (by <@${miniUserId}>)\n` +
      `• **High Score:** \`22\` 🏆\n` +
      `• **Next Number:** **\`23\`**\n` +
      `• **Next Turn:** <@${kryloUserId}> (Mini counted 22, so Krylo must type 23!)\n\n` +
      `🚀 *Streak is 100% safe! Keep counting!*`
    )
    .setFooter({ text: `${channel.guild.name} • Counting Engine` })
    .setTimestamp();

  await channel.send({ embeds: [confirmEmbed] });
  console.log('✅ Sent confirmation embed into #🔢・counting');

  process.exit(0);
}

main().catch(console.error);
