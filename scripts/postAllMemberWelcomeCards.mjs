import 'dotenv/config';
import {
  Client,
  GatewayIntentBits,
  AttachmentBuilder,
  EmbedBuilder
} from 'discord.js';
import { renderWelcomeCard } from '../features/welcomeCardEngine.mjs';
import db from '../databaseEngine.mjs';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages
  ]
});

await client.login(process.env.DISCORD_TOKEN);
console.log(`[+] Logged in as ${client.user.tag}`);

const GUILD_ID = '1557852594242719775';
const WELCOME_CH_ID = '1557863777070743693';

const guild = await client.guilds.fetch(GUILD_ID);
const welcomeCh = await guild.channels.fetch(WELCOME_CH_ID);
console.log(`[+] Connected to guild "${guild.name}" and channel "#${welcomeCh.name}"`);

const clanMembers = [
  { userId: '1327730417863753800', ign: 'byqml', roleTitle: '🗡️ Clan Combatant', orderNum: 1 },
  { userId: '1283841949945823252', ign: 'CrazyCoolCam', roleTitle: '🏹 Clan Veteran', orderNum: 2 },
  { userId: '1460330497140981852', ign: 'Domino', roleTitle: '🛡️ Clan Vanguard', orderNum: 3 },
  { userId: '1414143825538191373', ign: 'KryloMCYT', roleTitle: '⚔️ Clan Co-Leader', orderNum: 4 },
  { userId: '1533703991882416373', ign: 'st1LLkill3r', roleTitle: '👑 Clan Leader', orderNum: 5 }
];

for (const m of clanMembers) {
  console.log(`\n[*] Processing card for @${m.ign} (${m.userId})...`);
  const member = await guild.members.fetch(m.userId).catch(() => null);
  const avatarUrl = member
    ? member.user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true })
    : 'https://cdn.discordapp.com/embed/avatars/0.png';
  const mcHeadUrl = `https://mc-heads.net/avatar/${m.ign}/128.png`;

  console.log(`  ⏳ Rendering Phase 2 Cyber Card with 3D skin head...`);
  const cardBuffer = await renderWelcomeCard({
    avatarUrl,
    mcHeadUrl,
    username: m.ign,
    memberCount: m.orderNum,
    serverName: "THE HALF LIFE'S",
    phase: 2
  });

  if (!cardBuffer) {
    console.error(`  ❌ Failed to generate card buffer for ${m.ign}`);
    continue;
  }

  const attachment = new AttachmentBuilder(cardBuffer, { name: `welcome_${m.ign}.png` });

  const embed = new EmbedBuilder()
    .setColor(0x00FF88)
    .setTitle(`✅ OPERATIVE VERIFIED & ROSTER CONFIRMED — ${m.ign.toUpperCase()}`)
    .setDescription(
      `<@${m.userId}> has officially linked Minecraft IGN **\`${m.ign}\`**! ⚔️🛡️\n\n` +
      `• 🏷️ **Verified In-Game Name:** \`${m.ign}\`\n` +
      `• 👑 **Clan Rank:** **${m.roleTitle}**\n` +
      `• 🌐 **Server:** \`EliteSmp.gg\` (Bedrock: \`Mc.eliteSmp.gg:19132\`)\n` +
      `• 💬 **Squad Comms:** <#1557855867897127054>\n` +
      `• ⚔️ **All clan base coordinates & operations unlocked!**`
    )
    .setImage(`attachment://welcome_${m.ign}.png`)
    .setFooter({ text: `⚔️ CO-LEADER: KryloMCYT • 👑 LEADER: st1LLkill3r • Operative #${String(m.orderNum).padStart(3, '0')} [VERIFIED]` })
    .setTimestamp();

  // Check if member already has a message in member_welcome_cards
  const existingRecord = db.prepare(`SELECT * FROM member_welcome_cards WHERE user_id = ? AND guild_id = ?`).get(m.userId, GUILD_ID);

  let sentMsg;
  if (existingRecord && existingRecord.message_id) {
    try {
      const priorMsg = await welcomeCh.messages.fetch(existingRecord.message_id).catch(() => null);
      if (priorMsg) {
        sentMsg = await priorMsg.edit({
          content: `🛡️ **Operative Verified:** <@${m.userId}> has officially linked Minecraft IGN **\`${m.ign}\`**! ⚔️`,
          embeds: [embed],
          files: [attachment]
        });
        console.log(`  ✅ Successfully updated existing message ${priorMsg.id} for ${m.ign}!`);
      }
    } catch (e) {}
  }

  if (!sentMsg) {
    sentMsg = await welcomeCh.send({
      content: `🛡️ **Operative Verified:** <@${m.userId}> has officially linked Minecraft IGN **\`${m.ign}\`**! ⚔️`,
      embeds: [embed],
      files: [attachment]
    });
    console.log(`  ✅ Dispatched new Phase 2 Welcome Card for ${m.ign} (Message ID: ${sentMsg.id})!`);
  }

  // Update DB
  db.prepare(`
    INSERT INTO member_welcome_cards (user_id, guild_id, message_id, channel_id, member_count, minecraft_ign)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET
      message_id = excluded.message_id,
      channel_id = excluded.channel_id,
      member_count = excluded.member_count,
      minecraft_ign = excluded.minecraft_ign,
      updated_at = CURRENT_TIMESTAMP
  `).run(m.userId, GUILD_ID, sentMsg.id, welcomeCh.id, m.orderNum, m.ign);

  // Update players table
  try {
    db.prepare(`
      INSERT INTO players (discord_id, minecraft_username, balance, level)
      VALUES (?, ?, 1000, 1)
      ON CONFLICT(discord_id) DO UPDATE SET
        minecraft_username = excluded.minecraft_username
    `).run(m.userId, m.ign);
  } catch (_) {}
}

console.log('\n======================================================');
console.log('🎉 ALL 5 CLAN MEMBERS VERIFIED CARDS DISPATCHED TO #WELCOME!');
console.log('======================================================\n');
await client.destroy();
process.exit(0);
