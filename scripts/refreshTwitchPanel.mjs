import 'dotenv/config';
import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Routes, REST } from 'discord.js';
import { masterCommandJson } from '../commands/masterCommandRegistry.mjs';

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
await client.login(process.env.DISCORD_TOKEN);

const guildId = '1549875778575929446';
const channelId = '1555933857037951127';

const channel = await client.channels.fetch(channelId);
if (channel) {
  const embed = new EmbedBuilder()
    .setColor(0x9146FF)
    .setTitle('🟣 Skybase Twitch Stream Verification [SECURE LINKING]')
    .setDescription(
      `Welcome to the official **Twitch Verification Hub** for **[Krylo's Stream](https://twitch.tv/kryloplaysmc)**!\n\n` +
      `🛡️ **How Secure Verification Works:**\n` +
      `To ensure total security and guarantee that you actually own your Twitch account, verification connects directly through **[Twitch Live Chat](https://twitch.tv/kryloplaysmc)** using a unique one-time code tied to your Discord User ID.\n\n` +
      `📋 **3 Simple Steps to Verify:**\n` +
      `1️⃣ Click the **🔑 Get Verification Code** button below (or use \`/verifytwitch\`).\n` +
      `2️⃣ The bot will generate your secret one-time code (e.g. \`SKY-XXXX\`).\n` +
      `3️⃣ Open **[Krylo's Live Stream](https://twitch.tv/kryloplaysmc)** and type in chat:\n` +
      `   \`!verify SKY-XXXX\`  *(or \`!link SKY-XXXX\`)*\n\n` +
      `✨ As soon as our Twitch bot sees your code in stream chat, your Twitch account is linked to your Discord profile and your roles are equipped instantly!\n\n` +
      `🎁 **Unlocked Rewards & Roles:**\n` +
      `• <@&1555976589336903696> — **Twitch Follower** *(Free for following Krylo!)*\n` +
      `• <@&1552083350876061756> — **[Twitch Connected](https://discord.com/channels/@me)** *(Showcase badge on your profile!)*\n` +
      `• <@&1552083351953866845> — **Twitch Subscribed** *(Exclusive VIP role for **[Paid & Prime Subscribers](https://www.twitch.tv/subs/kryloplaysmc)** — Hoisted + direct \`@Krylo\` mention privileges!)*\n` +
      `• +250 Bonus KryloCoins in stream chat (+500 for **[Paid Subscribers](https://www.twitch.tv/subs/kryloplaysmc)**)!\n` +
      `• ⭐ **Dual Supporter Status** if you are also subscribed on YouTube in <#1549918052513095682>!\n\n` +
      `📖 **Helpful Server Links:**\n` +
      `• **[Role Directory & Hierarchy](https://discord.com/channels/1549875778575929446/1549882278245564546)** ➔ Server perks, ranks & badges\n` +
      `• **[YouTube Verification Hub](https://discord.com/channels/1549875778575929446/1549918052513095682)** ➔ Claim your YouTube Sub role\n` +
      `• **[Krylo's YouTube Channel](https://www.youtube.com/@krylomcyt?sub_confirmation=1)** ➔ Watch latest videos & subscribe\n` +
      `• **[Skybase Server Rules](https://discord.com/channels/1549875778575929446/1549882276278435841)** ➔ Community guidelines\n\n` +
      `🏷️ **Optional Nickname Sync:**\n` +
      `You can toggle whether your Discord nickname automatically matches your Twitch name.\n` +
      `🛡️ *Anti-Impersonation Protection: Any nickname containing **"Krylo"** is strictly blocked to protect server security.*`
    )
    .setFooter({ text: "Krylo's Skybase • Secure Stream Chat Verification" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('btn_verify_twitch_sub')
      .setLabel('🔑 Get Verification Code')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setLabel('🟣 Open Twitch Stream')
      .setStyle(ButtonStyle.Link)
      .setURL('https://twitch.tv/kryloplaysmc'),
    new ButtonBuilder()
      .setLabel('📖 Roles & Perks')
      .setStyle(ButtonStyle.Link)
      .setURL('https://discord.com/channels/1549875778575929446/1549882278245564546')
  );

  // Auto-clean any old messages in channel first to guarantee zero duplicates!
  const oldMsgs = await channel.messages.fetch({ limit: 20 });
  for (const [id, m] of oldMsgs) {
    await m.delete().catch(() => {});
  }

  const sentMsg = await channel.send({ embeds: [embed], components: [row] });
  await sentMsg.pin().catch(() => {});
  // Delete the automatic pin system message
  const afterMsgs = await channel.messages.fetch({ limit: 5 });
  for (const [id, m] of afterMsgs) {
    if (id !== sentMsg.id) await m.delete().catch(() => {});
  }
  console.log('✅ Posted updated Twitch verification panel to #twitch-verify and pinned cleanly!');
}

// Register updated slash commands
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
await rest.put(
  Routes.applicationGuildCommands(client.user.id, guildId),
  { body: masterCommandJson }
);
console.log('✅ Registered updated /verifytwitch guild slash command!');

process.exit(0);
