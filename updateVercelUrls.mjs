import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

/**
 * 👑 UPDATE OFFICIAL VERCEL STORE & PLAYER PORTAL URLS (.MJS)
 * Web Store: https://krylosmp-store.web.app/
 * Player Portal: https://krylosmp.web.app/
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
  console.log('[+] Vercel URL Updater Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🌐 UPDATING OFFICIAL VERCEL URLS FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      // 1. Update #🛒・web-store
      const storeCh = guild.channels.cache.find(c => c.name.includes('web-store') || c.name.includes('store') && c.isTextBased());
      if (storeCh) {
        const msgs = await storeCh.messages.fetch({ limit: 20 }).catch(() => null);
        if (msgs && msgs.size > 0) {
          await storeCh.bulkDelete(msgs).catch(() => {});
        }

        const storeEmbed = new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Official Web Store', iconURL: guild.iconURL() })
          .setTitle('🛒 OFFICIAL KRYLOSMP WEB STORE & PLAYER PORTAL')
          .setDescription(
            `Welcome to the official **KryloSMP Network Web Store**! Enhance your gameplay experience with exclusive ranks, KryloCoins (KC), custom cosmetics, and god kits!\n\n` +
            `🛒 **WEB STORE**: [https://krylosmp-store.web.app/](https://krylosmp-store.web.app/)\n` +
            `🌐 **PLAYER PORTAL**: [https://krylosmp.web.app/](https://krylosmp.web.app/)\n\n` +
            `**💎 STORE FEATURES & UPGRADES**\n` +
            `• **VIP & GOD Ranks** — Unlock flying, God Relics, and saturation buffs.\n` +
            `• **KryloCoins (KC)** — Instant deposits into your player balance & clan vault.\n` +
            `• **Verification Link** — Verify your Minecraft account using code **\`77777\`**.\n\n` +
            `*All purchases directly support server hosting, custom Skript development, and event prize pools!*`
          )
          .setColor(0x00F2FF)
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'KryloSMP Store • Instant Automated Delivery', iconURL: guild.iconURL() })
          .setTimestamp();

        const storeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🛒 Visit Web Store").setStyle(ButtonStyle.Link).setURL(STORE_URL),
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL(PORTAL_URL)
        );

        await storeCh.send({ embeds: [storeEmbed], components: [storeRow] });
        console.log(`  [+] Updated Web Store Embed in #${storeCh.name}`);
      }

      // 2. Update #🌐・official-links
      const linksCh = guild.channels.cache.find(c => c.name.includes('official-links') || c.name.includes('socials') && c.isTextBased());
      if (linksCh) {
        const msgs = await linksCh.messages.fetch({ limit: 20 }).catch(() => null);
        if (msgs && msgs.size > 0) {
          await linksCh.bulkDelete(msgs).catch(() => {});
        }

        const linksEmbed = new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Official Network Directory', iconURL: guild.iconURL() })
          .setTitle('🌐 OFFICIAL KRYLOSMP WEB LINKS & PORTALS')
          .setDescription(
            `Access all official **KryloSMP** web portals and community hubs below:\n\n` +
            `🌐 **PLAYER PORTAL**: [krylosmp.web.app](https://krylosmp.web.app/)\n` +
            `🛒 **WEB STORE**: [krylosmp-store.web.app](https://krylosmp-store.web.app/)\n` +
            `🎮 **MINECRAFT SERVER IP**: \`KryloSmp.play.hosting\`\n` +
            `🔴 **OFFICIAL YOUTUBE**: [@Krylo-60](https://www.youtube.com/@Krylo-60) & [@KryloBlox60](https://www.youtube.com/@KryloBlox60)`
          )
          .setColor(0x9900FF)
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'KryloSMP Network Hub', iconURL: guild.iconURL() })
          .setTimestamp();

        const linksRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL(PORTAL_URL),
          new ButtonBuilder().setLabel("🛒 Web Store").setStyle(ButtonStyle.Link).setURL(STORE_URL),
          new ButtonBuilder().setLabel("▶️ YouTube Channel").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@Krylo-60")
        );

        await linksCh.send({ embeds: [linksEmbed], components: [linksRow] });
        console.log(`  [+] Updated Official Links Embed in #${linksCh.name}`);
      }

      console.log(`\n🏆 VERCEL URLS UPDATED IN [${guild.name}]!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error updating Vercel URLs:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
