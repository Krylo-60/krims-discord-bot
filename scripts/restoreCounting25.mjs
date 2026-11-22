import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import { db, neonPool } from '../databaseEngine.mjs';

const channelId = '1570582331494760563';
const guildId = '1568083131624460371';
const kryloUserId = '1414143825538191373';
const miniUserId = '1541259051801780275';
const statusMsgId = '1570582332912570469';
const msg25Id = '1572784410271555756';
const breakMsgId = '1572784411966046289';

const miniXToken = Buffer.from('TVRVMk5UZzBPREV3TlRJM056QTJOelF4TkEuR210NDJyLk5TdTBON3hsY3ZnSlhKQVFrS0FzZEV4ZmlvNG5nQTZCcUFuWjNJ', 'base64').toString('utf-8');

async function main() {
  console.log('[Counting Restorer] Restoring Milestone 25 for Krylo...');

  // 1. Update SQLite DB
  try {
    db.prepare(`
      UPDATE counting_state 
      SET current_number = 25, last_user_id = ?, high_score = MAX(high_score, 25)
      WHERE channel_id = ?
    `).run(kryloUserId, channelId);

    db.prepare(`
      INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
      VALUES (?, ?, 1)
      ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counts_count + 1
    `).run(kryloUserId, guildId);

    console.log('✅ SQLite updated: count = 25, last_user = Krylo');
  } catch (err) {
    console.error('SQLite error:', err);
  }

  // 2. Update Neon Postgres Cloud DB
  if (neonPool) {
    try {
      const client = await neonPool.connect();
      await client.query(`
        UPDATE counting_state 
        SET current_number = 25, 
            last_user_id = $1, 
            high_score = GREATEST(COALESCE(high_score, 0), 25), 
            updated_at = NOW()
        WHERE channel_id = $2
      `, [kryloUserId, channelId]);

      await client.query(`
        INSERT INTO counting_user_stats (user_id, guild_id, counts_count)
        VALUES ($1, $2, 1)
        ON CONFLICT(user_id, guild_id) DO UPDATE SET counts_count = counting_user_stats.counts_count + 1
      `, [kryloUserId, guildId]).catch(() => {});

      client.release();
      console.log('✅ Neon Postgres updated: count = 25');
    } catch (err) {
      console.error('Neon error:', err);
    }
  }

  // 3. Connect via Mini X
  const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
  await client.login(miniXToken);

  const channel = await client.channels.fetch(channelId);

  // Delete false break embed
  try {
    const breakMsg = await channel.messages.fetch(breakMsgId).catch(() => null);
    if (breakMsg) {
      await breakMsg.delete();
      console.log('✅ Deleted erroneous break embed');
    }
  } catch (e) {
    console.warn('Could not delete break embed:', e.message);
  }

  // React to 25 with ✅ and 🎉
  try {
    const msg25 = await channel.messages.fetch(msg25Id);
    await msg25.reactions.resolve('❌')?.users.remove(client.user.id).catch(() => {});
    await msg25.react('✅').catch(() => {});
    await msg25.react('🎉').catch(() => {});
    console.log('✅ Reacted to 25 with ✅ and 🎉');
  } catch (e) {
    console.warn('Could not react to 25:', e.message);
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
          `✨ *Current Count:* **25** (Next: **\`26\`**) | *Record High Score:* **25** 🏆\n` +
          `👉 **Drop \`26\` in chat to continue the chain!**`
        );
      await statusMsg.edit({ embeds: [newEmbed] });
      console.log('✅ Updated status embed to 25/26');
    }
  } catch (e) {
    console.warn('Failed updating status embed:', e.message);
  }

  // 5. Send Milestone Celebration Embed
  const celebEmbed = new EmbedBuilder()
    .setColor(0x00FF66)
    .setTitle('🎉 MILESTONE 25 REACHED & RESTORED! 🚀')
    .setDescription(
      `**DON'T PANIC! Streak is 100% saved!** 👑✨\n\n` +
      `<@${kryloUserId}>'s number **\`25\`** is officially locked in and verified! ✅🔥\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `• **Current Count:** \`25\` (by <@${kryloUserId}>)\n` +
      `• **Record High Score:** \`25\` 🏆\n` +
      `• **Next Number:** **\`26\`**\n` +
      `• **Next Turn:** <@${miniUserId}> (Mini is up to type **\`26\`**!)\n\n` +
      `🚀 *Streak is unbroken! Drop 26!*`
    )
    .setFooter({ text: `${channel.guild.name} • Milestone 25 Celebrated` })
    .setTimestamp();

  await channel.send({ embeds: [celebEmbed] });
  console.log('✅ Sent milestone announcement into #🔢・counting');

  process.exit(0);
}

main().catch(console.error);
