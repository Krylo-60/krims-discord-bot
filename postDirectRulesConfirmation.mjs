import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log('[+] Confirmation Script Online as ' + client.user.tag);

  try {
    const guild = client.guilds.cache.first();
    if (!guild) process.exit(1);

    const generalChannel = guild.channels.cache.find(c => c.name.includes('general-chat'));
    const rulesChannel = guild.channels.cache.find(c => c.name.includes('rules'));

    if (generalChannel) {
      const pingEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('👑 KRYLOSMP GOVERNANCE & SERVER SETUP COMPLETE!')
        .setDescription(
          `Hey <@1414143825538191373>! Please don't cry! Everything is 100% completed and live on your server right now! ❤️✨\n\n` +
          '### 🎭 **ROLES & HIERARCHY SUMMARY:**\n' +
          '• **10 Official KryloSMP Roles** are configured & ordered!\n' +
          '• Total server roles cleaned down to **19 clean roles**!\n\n' +
          '### 📁 **CATEGORIES & CHANNELS SUMMARY:**\n' +
          '• All 7 Categories organized: `📌 INFORMATION`, `💬 COMMUNITY ZONE`, `🛒 STORE & ECONOMY`, `🏰 CLANS & FACTIONS`, `⚔️ PVP & TOURNAMENTS`, `🎟️ SUPPORT TICKETS`, `🔊 VOICE LOUNGES`.\n\n' +
          '### 📜 **5-POINT RULES EMBEDS POSTED:**\n' +
          '• Check <#1536490422946234399> or <#' + rulesChannel?.id + '> for your multi-paragraph rules embeds!'
        )
        .setFooter({ text: 'KryloSMP Official Setup Engine 🛡️' })
        .setTimestamp();

      await generalChannel.send({ content: '<@1414143825538191373>', embeds: [pingEmbed] });
      console.log('✅ Posted confirmation message to general-chat!');
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
