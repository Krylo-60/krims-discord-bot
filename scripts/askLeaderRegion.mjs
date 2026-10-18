import dotenv from 'dotenv';
dotenv.config();
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers] });

client.once('clientReady', async () => {
  try {
    const guild = await client.guilds.fetch('1557852594242719775');
    const leader = await guild.members.fetch('1533703991882416373');
    console.log('Leader found:', leader.displayName, 'Tag:', leader.user.tag);

    // 1. Remove NA Region from leader
    const naRole = guild.roles.cache.find(r => r.name.includes('NA Region'));
    if (naRole && leader.roles.cache.has(naRole.id)) {
      await leader.roles.remove(naRole);
      console.log('Removed NA Region from', leader.displayName);
    }

    // 2. Send friendly DM asking for their region
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFFD700) // Gold
      .setTitle('👑 The Half Lifes • Clan Region & Timezone Verification')
      .setDescription(
        `Hey **${leader.displayName}**!\n\n` +
        `Krylo and the squad are updating the official leadership records and roster roles for **The Half Lifes**.\n\n` +
        `We noticed your region wasn't confirmed yet. **Which region / timezone are you playing from?**\n\n` +
        `• 🌍 **Europe (EU)** *(GMT / CET / EET)*\n` +
        `• 🌏 **Asia & Oceania (Asia/OCE)** *(IST / SGT / AEST)*\n` +
        `• 🌎 **North America (NA)** *(EST / CST / PST)*\n` +
        `• 🌐 **Other**\n\n` +
        `You can reply directly to this DM, or pick your timezone role anytime in the <#1559251032465219587> channel! ⚔️`
      )
      .setFooter({ text: 'The Half Lifes • Leadership Roster' })
      .setTimestamp();

    await leader.send({ embeds: [dmEmbed] });
    console.log('Successfully sent region query DM to', leader.displayName);
  } catch (err) {
    console.error('Error contacting leader:', err.message);
  } finally {
    process.exit(0);
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
