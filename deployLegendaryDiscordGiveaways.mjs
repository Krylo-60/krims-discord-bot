import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType } from 'discord.js';
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
  console.log(`[+] Logged in as ${client.user.tag} - Deploying Legendary Giveaway & Community Panels...`);

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      const channels = await guild.channels.fetch();
      const giveawayChannel = channels.find(c => c && c.type === ChannelType.GuildText && (c.name.includes('giveaway') || c.name.includes('giveaways')));

      if (giveawayChannel) {
        // Clear old bot messages
        try {
          const oldMsgs = await giveawayChannel.messages.fetch({ limit: 10 });
          const botMsgs = oldMsgs.filter(m => m.author.id === client.user.id);
          for (const [, msg] of botMsgs) {
            await msg.delete().catch(() => {});
          }
        } catch (e) {}

        const embed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setTitle('🎁 ━━━ KRYLOSMP LEGENDARY REWARDS & GIVEAWAYS ━━━ 🎁')
          .setDescription(
            '━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '👑 **OFFICIAL COMMUNITY DROP & STREAK VAULT**\n' +
            '⚡ *Engineered by Krylo & Krishiv • Season 1 Re-Release*\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
            'Welcome to the official KryloSMP Giveaway & Daily Rewards Station! Claim free KryloCoins, enter VIP Rank giveaways, and test your luck daily!\n\n' +
            '💎 **ACTIVE GIVEAWAY EVENT**\n' +
            '• **Prize:** `⚡ VIP Sovereign Rank + 50,000 KryloCoins`\n' +
            '• **Winners:** `3 Lucky Members`\n' +
            '• **Requirements:** Verified Discord & Minecraft Account\n\n' +
            '🎁 **DAILY LOGIN REWARD**\n' +
            '• Click the button below every 24 hours for **+1,000 KC** direct to your balance!'
          )
          .setImage('https://krylosmp.web.app/banner.jpg')
          .setFooter({ text: 'KryloSMP Executive Network • Fair & Automated' })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_claim_daily_kc')
            .setLabel('🎁 Claim Daily 1,000 KC')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('btn_enter_vip_giveaway')
            .setLabel('🎉 Enter VIP Giveaway')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setLabel('🛒 Visit KC Web Store')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp-store.web.app/'),
          new ButtonBuilder()
            .setLabel('📊 Live Player Database')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp.web.app/')
        );

        await giveawayChannel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Deployed Legendary Giveaway panel in #${giveawayChannel.name} on ${guild.name}`);
      }
    } catch (err) {
      console.warn(`Error in guild ${guildId}:`, err.message);
    }
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
