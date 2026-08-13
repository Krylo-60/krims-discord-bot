import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 OFFICIAL VERIFICATION PANEL DEPLOYER (.MJS)
 * Generates unique personal code for every player!
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const PORTAL_URL = 'https://krylosmp.web.app/';
const STORE_URL = 'https://krylosmp-store.web.app/';

client.once('ready', async () => {
  console.log('[+] Verification Panel Deployer Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🔒 DEPLOYING PERSONAL VERIFICATION PANEL FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const verifyCh = guild.channels.cache.find(c => (c.name.includes('verify') || c.name.includes('verification')) && c.isTextBased());
      if (verifyCh) {
        const msgs = await verifyCh.messages.fetch({ limit: 20 }).catch(() => null);
        if (msgs && msgs.size > 0) {
          await verifyCh.bulkDelete(msgs).catch(() => {});
        }

        const verifyEmbed = new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Official Security & Whitelist Gateway', iconURL: guild.iconURL() })
          .setTitle('⚡ KRYLOSMP 3.0 — OFFICIAL VERIFICATION PORTAL')
          .setDescription(
            `Welcome to **KryloSMP**! To protect our community from bot raids, malicious alt accounts, and spam, all new members must verify their account before accessing server channels.\n\n` +
            `**HOW TO VERIFY & UNLOCK THE SERVER:**\n` +
            `1️⃣ Click the **\`✅ Verify Account\`** button below.\n` +
            `2️⃣ The bot will generate a **unique personal 6-digit code** generated specifically for your account.\n` +
            `3️⃣ Enter your personal code on the [**Player Portal**](${PORTAL_URL}) or type \`/verify <your_code>\` inside Minecraft (\`KryloSmp.play.hosting\`).\n` +
            `4️⃣ Your Discord account will automatically receive the **\`✅ VERIFIED PLAYER\`** role and unlock all chat and voice lounges!\n\n` +
            `*Need assistance? Open a ticket in #🎟️・open-ticket for 24/7 AI support!*`
          )
          .setColor(0x00FF88) // Neon Green
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'KryloSMP Network Security • Unique Player Code System Active', iconURL: guild.iconURL() })
          .setTimestamp();

        const verifyRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('verify_user')
            .setLabel('✅ Verify Account')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setLabel('🌐 Player Portal')
            .setStyle(ButtonStyle.Link)
            .setURL(PORTAL_URL),
          new ButtonBuilder()
            .setLabel('🛒 Web Store')
            .setStyle(ButtonStyle.Link)
            .setURL(STORE_URL)
        );

        await verifyCh.send({ embeds: [verifyEmbed], components: [verifyRow] });
        console.log(`  [+] Successfully deployed Personal Verification Panel into #${verifyCh.name}!`);

        const verifiedRole = guild.roles.cache.find(r => r.name.includes('VERIFIED'));
        if (verifiedRole) {
          await verifyCh.permissionOverwrites.edit(guild.roles.everyone.id, { ViewChannel: true, SendMessages: false }).catch(() => {});
          await verifyCh.permissionOverwrites.edit(verifiedRole.id, { ViewChannel: true, SendMessages: false }).catch(() => {});
        }
      }

      console.log(`\n🏆 PERSONAL VERIFICATION GATEWAY ACTIVE IN [${guild.name}]!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error deploying verification panel:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
