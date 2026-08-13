import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 SEASON 1 RE-RELEASE ANNOUNCEMENT DEPLOYER (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const STORE_URL = 'https://krylosmp-store.web.app/';
const PORTAL_URL = 'https://krylosmp.web.app/';

client.once('ready', async () => {
  console.log('[+] Season 1 Announcement Deployer Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🚀 DEPLOYING SEASON 1 RE-RELEASE ANNOUNCEMENT IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const announceChannels = guild.channels.cache.filter(c => 
        (c.name.includes('announcements') || c.name.includes('new-updates')) && c.isTextBased()
      );

      for (const [, ch] of announceChannels) {
        try {
          const msgs = await ch.messages.fetch({ limit: 10 }).catch(() => null);
          if (msgs && msgs.size > 0) await ch.bulkDelete(msgs).catch(() => {});

          const embed = new EmbedBuilder()
            .setAuthor({ name: 'KryloSMP Executive Network Release', iconURL: guild.iconURL() })
            .setTitle('🚀 KRYLOSMP SEASON 1: RE-RELEASE IS OFFICIALLY LIVE!')
            .setDescription(
              `The wait is officially **OVER**! Welcome to the brand new **KryloSMP Season 1 Re-Release** — bigger, faster, and more competitive than ever before!\n\n` +
              `🔥 **WHAT'S NEW IN SEASON 1 RE-RELEASE:**\n` +
              `• 🌐 **Server IP**: \`KryloSmp.play.hosting\` (Java: 25565 | Bedrock: 19132)\n` +
              `• 🏰 **Expanded Clan Wars & Factions** — Build mega bases and wage war on rival clans!\n` +
              `• 🎯 **Headhunter Bounty Board** — Place or claim bounties on enemy players using \`/bounty\`!\n` +
              `• 🔒 **1-Click Unique Verification System** — Instant whitelist via personal 6-digit codes!\n` +
              `• 🛒 **Official Web Store & Player Portal** — Instant 24/7 delivery of VIP ranks & crate keys!\n\n` +
              `🎉 **SEASON 1 LAUNCH GIFTS & REWARDS:**\n` +
              `• All verified players receive **\`+500 KryloCoins\`** + **\`💎 16x Diamonds\`** + **\`🔥 OG Member\`** role!\n\n` +
              `*Connect now at \`KryloSmp.play.hosting\` and dominate Season 1!*`
            )
            .setColor(0xFFD700) // Gold
            .setThumbnail(guild.iconURL())
            .setFooter({ text: 'KryloSMP Season 1 • Official Launch Notice', iconURL: guild.iconURL() })
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel('🌐 Player Portal').setStyle(ButtonStyle.Link).setURL(PORTAL_URL),
            new ButtonBuilder().setLabel('🛒 Web Store').setStyle(ButtonStyle.Link).setURL(STORE_URL),
            new ButtonBuilder().setCustomId('verify_user').setLabel('✅ Verify & Claim Rewards').setStyle(ButtonStyle.Success)
          );

          await ch.send({ embeds: [embed], components: [row] });
          console.log(`  [+] Successfully posted Season 1 Re-Release Announcement in #${ch.name}!`);
        } catch (e) {
          console.warn(`  [-] Could not post in #${ch.name}: ${e.message}`);
        }
      }

      console.log(`\n🏆 SEASON 1 RE-RELEASE ANNOUNCEMENTS LIVE IN [${guild.name}]!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error deploying announcement:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
