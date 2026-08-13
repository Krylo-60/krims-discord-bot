import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1524878881918685405', '1531792924055048292']; // KryloSMP & Krishiv Studios

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      const isKS = gId === '1531792924055048292';
      console.log(`\n🚀 Re-posting premium embeds for: ${guild.name}...`);

      const channels = await guild.channels.fetch();

      // Delete ALL old bot messages from every channel first, then post fresh ones
      for (const [cId, channel] of channels) {
        if (!channel || !channel.isTextBased() || channel.type === ChannelType.GuildCategory) continue;
        // Skip verify channel (already has its own embed)
        if (channel.name.toLowerCase().includes('verify')) continue;

        try {
          const msgs = await channel.messages.fetch({ limit: 50 });
          const botMsgs = msgs.filter(m => m.author.id === client.user.id);
          for (const m of botMsgs.values()) { await m.delete().catch(() => {}); }
        } catch (e) {}
      }
      console.log(`✅ Cleaned old bot messages from all channels.`);

      // Now post fresh, proper embeds to each channel
      for (const [cId, channel] of channels) {
        if (!channel || !channel.isTextBased() || channel.type === ChannelType.GuildCategory) continue;
        if (channel.name.toLowerCase().includes('verify')) continue;

        const n = channel.name.toLowerCase();
        let embed, row;

        // ============ RULES ============
        if (n.includes('rules') || n.includes('welcome')) {
          embed = new EmbedBuilder()
            .setTitle(isKS ? "👑 WELCOME TO KRISHIV STUDIOS" : "⚔️ WELCOME TO KRYLOSMP")
            .setDescription(isKS
              ? "**Krishiv Studios** is a premium development agency specializing in custom Discord bots, Minecraft plugins, and SaaS products.\n\n> *\"Building the future of gaming infrastructure, one bot at a time.\"*"
              : "**KryloSMP** is the ultimate Minecraft survival network featuring custom economy, PvP arenas, daily quests, and jackpot rewards.\n\n> *\"Where legends are forged and empires rise.\"*")
            .addFields(
              { name: "1️⃣ Respect Everyone", value: "No harassment, bullying, racism, or personal attacks." },
              { name: "2️⃣ No Spam or Flooding", value: "Keep conversations meaningful. No spam or bot command abuse." },
              { name: "3️⃣ No NSFW Content", value: "Absolutely no NSFW, gore, or disturbing content." },
              { name: "4️⃣ No Unauthorized Advertising", value: "No promoting other servers or services without permission." },
              { name: "5️⃣ Follow Discord TOS", value: "Adhere to Discord Terms of Service and Community Guidelines." }
            )
            .setColor(isKS ? 0x00F2FF : 0xFF0055)
            .setFooter({ text: `${guild.name} • Official Rules`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🌐 Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app"),
            new ButtonBuilder().setLabel("💬 Invite Friends").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX"),
            new ButtonBuilder().setLabel("🛒 Store").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
          );
        }
        // ============ ANNOUNCEMENTS ============
        else if (n.includes('announce')) {
          embed = new EmbedBuilder()
            .setTitle("📢 OFFICIAL ANNOUNCEMENTS")
            .setDescription("Stay updated with the latest news, updates, and feature releases!")
            .addFields(
              { name: "1️⃣ Official Updates Only", value: "Only staff post announcements here." },
              { name: "2️⃣ Feature Releases", value: "New bot versions, plugin updates, and SaaS patches." },
              { name: "3️⃣ Maintenance Notices", value: "Scheduled server downtime and maintenance windows." },
              { name: "4️⃣ Toggle Pings", value: "Use `#roles` to toggle `@Announcement Ping` notifications." },
              { name: "5️⃣ Discuss", value: "React with feedback or discuss announcements in `#general-chat`." }
            )
            .setColor(0xFFAA00)
            .setFooter({ text: `${guild.name} • Announcements`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
            new ButtonBuilder().setLabel("📝 Order Bot").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact")
          );
        }
        // ============ CONTACT / SUPPORT ============
        else if (n.includes('contact') || n.includes('support') || n.includes('ticket')) {
          embed = new EmbedBuilder()
            .setTitle("🎫 SUPPORT & CONTACT CENTER")
            .setDescription("Need help? Choose an option below to get started.")
            .addFields(
              { name: "1️⃣ AI Agent Support", value: "Visit our website to instantly talk to Krishiv's AI Sales & Support Agent!" },
              { name: "2️⃣ Email Support", value: "Send an email to **71krishivpb@gmail.com** for direct assistance." },
              { name: "3️⃣ Staff DM", value: "DM any `🛡️ Head Administrator` or `⚔️ Senior Moderator`." },
              { name: "4️⃣ Bug Reports", value: "Found a bug? Report it in `#bug-reports` with screenshots." },
              { name: "5️⃣ Response Time", value: "Average response time: **< 24 hours** for all inquiries." }
            )
            .setColor(0x00F2FF)
            .setFooter({ text: `${guild.name} • We're here to help!`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🤖 AI Agent Support").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact"),
            new ButtonBuilder().setLabel("🌐 Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app")
          );
        }
        // ============ FAQ ============
        else if (n.includes('faq')) {
          embed = new EmbedBuilder()
            .setTitle("❓ FREQUENTLY ASKED QUESTIONS")
            .setColor(0x00FF88)
            .addFields(
              { name: "1️⃣ How long does a bot take?", value: "Guaranteed delivery within 24–48 hours." },
              { name: "2️⃣ Is 24/7 hosting included?", value: "Yes! Pterodactyl node hosting for continuous uptime." },
              { name: "3️⃣ Are source files included?", value: "Yes! Clean ZIP source packages with `.env` templates." },
              { name: "4️⃣ What payment methods?", value: "Instant AI confirmation with secure processing." },
              { name: "5️⃣ Can I customize later?", value: "Yes! Bot code can be upgraded anytime." }
            )
            .setFooter({ text: `${guild.name} • FAQ`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("📝 Order Bot").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact"),
            new ButtonBuilder().setLabel("🛒 Store").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
          );
        }
        // ============ BOT COMMANDS ============
        else if (n.includes('command')) {
          embed = new EmbedBuilder()
            .setTitle("🤖 BOT COMMANDS HUB")
            .setColor(0xAA00FF)
            .addFields(
              { name: "1️⃣ Economy", value: "`/spin`, `/chest`, `/jackpot`, `/bday` for daily rewards." },
              { name: "2️⃣ Clans", value: "`/clan create`, `/clan invite`, `/clan info` for faction teams." },
              { name: "3️⃣ Duels", value: "`/duel <player>` to challenge players to 1v1 PvP." },
              { name: "4️⃣ No Spam", value: "Wait for bot responses before sending rapid commands." },
              { name: "5️⃣ Report Bugs", value: "Found an issue? Report it in `#bug-reports`." }
            )
            .setFooter({ text: `${guild.name} • Bot Commands`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
            new ButtonBuilder().setLabel("📝 Order Bot").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact")
          );
        }
        // ============ PVP ============
        else if (n.includes('pvp') || n.includes('duel') || n.includes('arena')) {
          embed = new EmbedBuilder()
            .setTitle("⚔️ PVP ARENA PROTOCOL")
            .setColor(0xFF0055)
            .addFields(
              { name: "1️⃣ Arena Rules", value: "Fair 1v1 combat. No hacked clients or killaura." },
              { name: "2️⃣ Duel System", value: "Use `/duel` to initiate wagered or practice matches." },
              { name: "3️⃣ Clan Warfare", value: "Form alliances in `#clan-recruitment`." },
              { name: "4️⃣ No Combat Logging", value: "Logging out in combat = automatic inventory loss." },
              { name: "5️⃣ Leaderboard", value: "Top killers earn the `⚔️ PvP Specialist` role!" }
            )
            .setFooter({ text: `${guild.name} • PvP`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
            new ButtonBuilder().setLabel("💬 Main Discord").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
          );
        }
        // ============ GIVEAWAYS ============
        else if (n.includes('giveaway') || n.includes('nitro')) {
          embed = new EmbedBuilder()
            .setTitle("🎁 GIVEAWAY & REWARDS CENTER")
            .setColor(0xFFAA00)
            .addFields(
              { name: "1️⃣ Free Entry", value: "All verified members can enter public giveaways." },
              { name: "2️⃣ Fair Selection", value: "Winners chosen automatically by Krims Code AI." },
              { name: "3️⃣ Claim Rewards", value: "Winners have 48 hours to claim in `#contact-staff`." },
              { name: "4️⃣ No Alt Accounts", value: "Using alts to enter = permanent ban." },
              { name: "5️⃣ Get Pinged", value: "Toggle `🎉 Giveaway Ping` in `#roles` to never miss a drop!" }
            )
            .setFooter({ text: `${guild.name} • Giveaways`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🛒 Store").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app"),
            new ButtonBuilder().setLabel("💬 Discord").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
          );
        }
        // ============ SOCIAL / YOUTUBE ============
        else if (n.includes('social') || n.includes('youtube')) {
          embed = new EmbedBuilder()
            .setTitle("🌐 OFFICIAL SOCIAL LINKS & WEB PRESENCE")
            .setDescription("Follow **Krishiv Studios** across all platforms!")
            .addFields(
              { name: "🌐 Portfolio", value: "[krishiv-new-portfoilo.vercel.app](https://krishiv-new-portfoilo.vercel.app)", inline: true },
              { name: "🛒 Store", value: "[krylosmp-store.web.app](https://krylosmp-store.web.app)", inline: true },
              { name: "📊 Portal", value: "[krylosmp.web.app](https://krylosmp.web.app)", inline: true },
              { name: "💻 GitHub", value: "[github.com/Krylo-60](https://github.com/Krylo-60)", inline: true },
              { name: "🤖 SaaS", value: "[smplink-saas.vercel.app](https://smplink-saas.vercel.app)", inline: true },
              { name: "💬 Discord", value: "[discord.gg/2hSXQKHvvX](https://discord.gg/2hSXQKHvvX)", inline: true }
            )
            .setColor(0x00F2FF)
            .setFooter({ text: `${guild.name} • Social Links`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🌐 Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app"),
            new ButtonBuilder().setLabel("💻 GitHub").setStyle(ButtonStyle.Link).setURL("https://github.com/Krylo-60"),
            new ButtonBuilder().setLabel("🛒 Store").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
          );
        }
        // ============ SHOPS / MARKETPLACE / TRADING ============
        else if (n.includes('shop') || n.includes('trade') || n.includes('market') || n.includes('store')) {
          embed = new EmbedBuilder()
            .setTitle("🏪 PLAYER SHOPS & MARKETPLACE")
            .setColor(0xFFAA00)
            .addFields(
              { name: "1️⃣ Advertise Shops", value: "Post your shop coords (`/shop`) and item stock." },
              { name: "2️⃣ Price Transparency", value: "State prices clearly in diamonds or server currency." },
              { name: "3️⃣ Safe Trading", value: "Use `/trade` to prevent scams during transactions." },
              { name: "4️⃣ No Fake Adverts", value: "Misleading shop coordinates = ban." },
              { name: "5️⃣ Rich List", value: "Check `/baltop` for the richest players!" }
            )
            .setFooter({ text: `${guild.name} • Marketplace`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app"),
            new ButtonBuilder().setLabel("🌐 Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app")
          );
        }
        // ============ BOOSTER / PERKS ============
        else if (n.includes('booster') || n.includes('perk')) {
          embed = new EmbedBuilder()
            .setTitle("💎 SERVER BOOSTER PERKS")
            .setColor(0xF47FFF)
            .addFields(
              { name: "1️⃣ Exclusive Role", value: "Instant `💎 Server Booster` role with custom color." },
              { name: "2️⃣ Double Rewards", value: "2x diamonds and coins from `/spin` and `/jackpot`." },
              { name: "3️⃣ VIP Access", value: "Private voice channels and booster lounge." },
              { name: "4️⃣ Priority Support", value: "Priority response on custom bot & plugin inquiries." },
              { name: "5️⃣ Special Giveaways", value: "Auto-entry into monthly Booster giveaways!" }
            )
            .setFooter({ text: `${guild.name} • Booster Perks`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🛒 Store").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app"),
            new ButtonBuilder().setLabel("💬 Discord").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
          );
        }
        // ============ HIRE / FREELANCE / PRICING ============
        else if (n.includes('hire') || n.includes('freelance') || n.includes('pricing') || n.includes('terms')) {
          embed = new EmbedBuilder()
            .setTitle("💼 FREELANCE & COMMISSION CENTER")
            .setColor(0x00F2FF)
            .addFields(
              { name: "1️⃣ Professional Work", value: "Custom Discord.js v14 bots, Paper plugins, and web apps." },
              { name: "2️⃣ Transparent Scope", value: "Detailed feature breakdown before build starts." },
              { name: "3️⃣ Fast Turnaround", value: "Delivery guaranteed within 24–48 hours." },
              { name: "4️⃣ Full Source Code", value: "100% ownership of project files and config." },
              { name: "5️⃣ Start Order", value: "Click 'Order Online' below to initiate Krishiv's AI Agent!" }
            )
            .setFooter({ text: `${guild.name} • Commissions`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("📝 Order Online").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact"),
            new ButtonBuilder().setLabel("🌐 Portfolio").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app")
          );
        }
        // ============ GENERIC (everything else) ============
        else {
          const cleanName = channel.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().toUpperCase();
          embed = new EmbedBuilder()
            .setTitle(`📌 ${cleanName} — CHANNEL GUIDE`)
            .setColor(0x00F2FF)
            .addFields(
              { name: "1️⃣ Channel Purpose", value: `This channel is for **${cleanName}** related content.` },
              { name: "2️⃣ Stay On Topic", value: "Keep discussions relevant to this channel's theme." },
              { name: "3️⃣ Be Respectful", value: "Treat all members with kindness and respect." },
              { name: "4️⃣ No Spam", value: "No flooding, spam, or off-topic self-promotion." },
              { name: "5️⃣ Need Help?", value: "Contact staff in `#contact-staff` or visit our web portal." }
            )
            .setFooter({ text: `${guild.name} • Channel Guide`, iconURL: guild.iconURL() });
          row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
            new ButtonBuilder().setLabel("📝 Order Bot").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact")
          );
        }

        try {
          await channel.send({ embeds: [embed], components: [row] });
          console.log(`✅ Posted to #${channel.name}`);
        } catch (e) {
          console.warn(`⚠️ Could not post to #${channel.name}: ${e.message}`);
        }
      }

      console.log(`\n✅ ALL PREMIUM EMBEDS & BUTTONS RE-POSTED FOR ${guild.name}!`);

    } catch (err) {
      console.error(`Error in guild ${gId}:`, err.message);
    }
  }

  console.log(`\n🏆 ALL EMBEDS & BUTTONS RESTORED ACROSS ALL SERVERS!`);
  client.destroy();
});

client.login(token);
