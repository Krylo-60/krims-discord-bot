import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILDS = [
  '1524878881918685405', // KryloSMP
  '1420991845546332162', // Krylo's Discord server
  '1532574925356007525'  // Krylo Fan Army 👑
];

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag} - Updating #verify across all 3 Krylo servers...`);

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      const channels = await guild.channels.fetch();
      const verifyCh = channels.find(c => c && c.name && (c.name.includes('verify') || c.name.includes('verification')) && c.isTextBased());

      if (!verifyCh) {
        console.log(`[-] No verify channel found in ${guild.name}`);
        continue;
      }

      console.log(`[+] Cleaning and updating #${verifyCh.name} in ${guild.name}...`);
      const oldMsgs = await verifyCh.messages.fetch({ limit: 50 }).catch(() => null);
      if (oldMsgs && oldMsgs.size > 0) {
        for (const m of oldMsgs.values()) {
          await m.delete().catch(() => {});
        }
      }

      const verifyEmbed = new EmbedBuilder()
        .setAuthor({ name: `${guild.name} Verification System`, iconURL: guild.iconURL() || client.user.displayAvatarURL() })
        .setTitle('🛡️ REAL-PLAYER VERIFICATION & SERVER UNLOCK')
        .setDescription(
          `Welcome to **KryloSMP Network**! To protect our community from bot raids and unlock all chat & voice lounges:\n\n` +
          `**HOW TO VERIFY & UNLOCK THE SERVER:**\n` +
          `1️⃣ Click the **\`✅ Verify Account\`** button below.\n` +
          `2️⃣ The bot will generate a **unique personal 6-digit code** for your account.\n` +
          `3️⃣ Enter your code on the [**Player Portal**](https://krylosmp.web.app/) or type \`/verify <code>\` inside Minecraft (\`KryloSmp.play.hosting\`).\n` +
          `4️⃣ Your Discord account will automatically receive the **\`✅ VERIFIED PLAYER\`** role and unlock all channels!\n\n` +
          `*Need assistance? Open a support ticket in #🎫┃support-tickets for help!*`
        )
        .setColor(0x00FF88)
        .setFooter({ text: 'KryloSMP Network Security • Automated Cloud Engine Active', iconURL: guild.iconURL() || client.user.displayAvatarURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('verify_user')
          .setLabel('✅ Verify Account')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setLabel('🌐 Player Portal')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp.web.app/'),
        new ButtonBuilder()
          .setLabel('🛒 Web Store')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp-store.web.app/')
      );

      await verifyCh.send({ embeds: [verifyEmbed], components: [row] });
      console.log(`[+] Successfully updated #${verifyCh.name} in ${guild.name} with new Firebase Portal URL!`);
    } catch (err) {
      console.warn(`[-] Error updating verify channel for guild ${guildId}:`, err.message);
    }
  }

  console.log('\n[🎉 COMPLETE] All #verify channels updated with https://krylosmp.web.app/');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
