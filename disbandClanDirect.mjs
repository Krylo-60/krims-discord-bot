import fs from 'fs';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

client.once('ready', async () => {
  console.log('[+] Disband Script Online as ' + client.user.tag);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) {
      console.error('[-] No guild found.');
      process.exit(1);
    }

    const clansFile = 'clans.json';
    if (!fs.existsSync(clansFile)) {
      console.log('[-] clans.json file not found.');
      process.exit(0);
    }

    const clanData = JSON.parse(fs.readFileSync(clansFile, 'utf8'));
    const leaderId = "1414143825538191373"; // @Krylo

    const userClanKey = Object.keys(clanData).find(k => clanData[k].leaderId === leaderId);
    if (!userClanKey) {
      console.log('[-] No clan found for user.');
      process.exit(0);
    }

    const userClan = clanData[userClanKey];
    console.log(`[+] Disbanding Clan: [${userClan.tag}] ${userClan.name}...`);

    // 1. Delete Role if exists
    if (userClan.roleId) {
      try {
        const r = guild.roles.cache.get(userClan.roleId) || await guild.roles.fetch(userClan.roleId);
        if (r) {
          await r.delete('Clan Disbanded by Owner');
          console.log(`✅ Deleted Clan Role: ${r.name}`);
        }
      } catch (e) {
        console.warn('[-] Could not delete role:', e.message);
      }
    }

    // 2. Delete Channel if exists
    if (userClan.channelId) {
      try {
        const ch = guild.channels.cache.get(userClan.channelId) || await guild.channels.fetch(userClan.channelId);
        if (ch) {
          await ch.delete('Clan Disbanded by Owner');
          console.log(`✅ Deleted Private Clan Channel: ${ch.name}`);
        }
      } catch (e) {
        console.warn('[-] Could not delete channel:', e.message);
      }
    }

    const disbandedName = userClan.name;
    const disbandedTag = userClan.tag;

    // Delete from clans.json
    delete clanData[userClanKey];
    fs.writeFileSync(clansFile, JSON.stringify(clanData, null, 2), 'utf8');

    // Send announcement to bot-commands channel
    const botCmdChannel = guild.channels.cache.find(c => c.name.includes('bot-commands'));
    if (botCmdChannel) {
      const disbandEmbed = new EmbedBuilder()
        .setColor(0xFF0055)
        .setTitle(`💥 CLAN DISBANDED: [${disbandedTag}] ${disbandedName}`)
        .setDescription(`The clan **[${disbandedTag}] ${disbandedName}** has been successfully disbanded! Its private Discord role & text channel have been removed.`)
        .setFooter({ text: 'KryloSMP Clan System 🏰' })
        .setTimestamp();
      await botCmdChannel.send({ embeds: [disbandEmbed] });
    }

    console.log(`🏆 CLAN DISBAND SUCCESSFUL!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
