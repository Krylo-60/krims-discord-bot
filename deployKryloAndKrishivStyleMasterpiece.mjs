import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ════════════════════════════════════════════════════════════════════════════════════════════════════
 * ⚡ KRYLOSMP x KRISHIV STUDIOS MASTERPIECE DEPLOYER (.MJS)
 * ════════════════════════════════════════════════════════════════════════════════════════════════════
 * Polishes the entire server ecosystem with signature Krylo & Krishiv Studios branding:
 * • Vibrant HSL & Gradient Color Aesthetics (Neon Cyan #00F2FF, Deep Purple #9900FF, Gold #FFD700)
 * • Rich Multi-Section Embeds with Custom Header Badges
 * • Interactive Verification Gateway & Ticket Support Portal
 * ════════════════════════════════════════════════════════════════════════════════════════════════════
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

client.once('ready', async () => {
  console.log('[+] Krylo & Krishiv Masterpiece Deployer Online as ' + client.user.tag + '\n');

  try {
    const guilds = Array.from(client.guilds.cache.values());

    for (const guild of guilds) {
      console.log(`⚡ POLISHING SERVER IN KRYLO & KRISHIV STYLE: ${guild.name} (${guild.id})...`);

      // 1. Verify Channel Panel
      const verifyCh = guild.channels.cache.find(c => c.name.includes('verify'));
      if (verifyCh && verifyCh.type === ChannelType.GuildText) {
        try {
          const vEmbed = new EmbedBuilder()
            .setColor(0x00F2FF)
            .setTitle('⚡ KRYLOSMP 3.0 — OFFICIAL VERIFICATION PORTAL')
            .setDescription(
              'Welcome to **KryloSMP Season 3**! Powered by **Krishiv Studios**.\n\n' +
              'Click the button below to link your Minecraft Java/Bedrock account, claim your starter kit, and get whitelisted instantly!\n\n' +
              '### 🎁 **STARTER REWARDS ON VERIFY:**\n' +
              '• **+500 KryloCoins** ⛃ Transferred to your wallet\n' +
              '• **16x Diamonds** 💎 Delivered directly to your in-game inventory\n' +
              '• **`<@&Verified>` Role** 🟢 Access all player text and voice channels'
            )
            .setFooter({ text: 'KryloSMP x Krishiv Studios Official Gateway Engine ⚡' })
            .setTimestamp();

          const vRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_open_verify_modal').setLabel('✅ Link Account & Verify').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('check_status').setLabel('🔍 View Account Status').setStyle(ButtonStyle.Primary)
          );

          await verifyCh.send({ embeds: [vEmbed], components: [vRow] });
          console.log(`  ✨ Deployed Signature Verification Panel on [${guild.name}]`);
        } catch (e) {}
      }

      // 2. Ticket Channel Panel
      const ticketCh = guild.channels.cache.find(c => c.name.includes('ticket'));
      if (ticketCh && ticketCh.type === ChannelType.GuildText) {
        try {
          const tEmbed = new EmbedBuilder()
            .setColor(0x9900FF)
            .setTitle('🎟️ KRYLOSMP SUPPORT TICKET CENTER')
            .setDescription(
              'Need assistance from our Staff Team? Click below to open a private 1-on-1 support ticket.\n\n' +
              '• **🐛 Bug Report** • **🛒 Store Delivery Help** • **🛡️ Player Report** • **💡 Feature Idea**'
            )
            .setFooter({ text: 'Krishiv Studios 24/7 Support Desk ⚡' })
            .setTimestamp();

          const tRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('create_ticket_general').setLabel('📩 Open Support Ticket').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('create_ticket_store').setLabel('🛒 Web Store Support').setStyle(ButtonStyle.Success)
          );

          await ticketCh.send({ embeds: [tEmbed], components: [tRow] });
          console.log(`  ✨ Deployed Signature Support Ticket Panel on [${guild.name}]`);
        } catch (e) {}
      }

      await sleep(200);
    }

    console.log(`\n🏆 KRYLO & KRISHIV STUDIOS STYLE MASTERPIECE DEPLOYED SUCCESSFULLY!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Deployer Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
