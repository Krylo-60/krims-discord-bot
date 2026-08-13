import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AutoModerationRuleTriggerType, AutoModerationRuleEventType, AutoModerationActionType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1531792924055048292', '1524878881918685405'];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.AutoModerationConfiguration]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      const isKS = gId === '1531792924055048292';
      console.log(`\n🚀 PREMIUM UPGRADE for: ${guild.name}...`);

      // ==========================================
      // 1. AUTO-MODERATION RULES
      // ==========================================
      console.log(`Setting up AutoMod...`);

      try {
        // Block spam mentions
        await guild.autoModerationRules.create({
          name: '🛡️ Anti-Spam Mentions',
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.MentionSpam,
          triggerMetadata: { mentionTotalLimit: 5 },
          actions: [
            { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: '🛡️ Too many mentions! Please avoid mass pinging.' } },
          ],
          enabled: true
        });
        console.log(`✅ Anti-Spam Mentions rule created!`);
      } catch (e) {
        console.warn(`⚠️ Anti-Spam: ${e.message}`);
      }

      try {
        // Block spam keywords
        await guild.autoModerationRules.create({
          name: '🚫 Blocked Words Filter',
          eventType: AutoModerationRuleEventType.MessageSend,
          triggerType: AutoModerationRuleTriggerType.Keyword,
          triggerMetadata: {
            keywordFilter: ['discord.gg', 'free nitro', 'claim reward', 'steam gift', 'gift card scam', 'earn money fast']
          },
          actions: [
            { type: AutoModerationActionType.BlockMessage, metadata: { customMessage: '🚫 This message was blocked by AutoMod. No scam links or unauthorized ads allowed.' } },
          ],
          enabled: true
        });
        console.log(`✅ Blocked Words Filter created!`);
      } catch (e) {
        console.warn(`⚠️ Blocked Words: ${e.message}`);
      }

      // ==========================================
      // 2. PREMIUM WELCOME EMBED WITH BANNER
      // ==========================================
      console.log(`Posting premium welcome banner...`);

      const channels = await guild.channels.fetch();
      const rulesChannel = channels.find(c => c && c.name && (c.name.includes('welcome') || c.name.includes('rules')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

      if (rulesChannel) {
        // Delete existing bot messages first to keep it clean
        try {
          const msgs = await rulesChannel.messages.fetch({ limit: 50 });
          const botMsgs = msgs.filter(m => m.author.id === client.user.id);
          for (const m of botMsgs.values()) {
            await m.delete().catch(() => {});
          }
        } catch (e) {}

        const welcomeEmbed = new EmbedBuilder()
          .setTitle(isKS ? "👑 WELCOME TO KRISHIV STUDIOS" : "⚔️ WELCOME TO KRYLOSMP")
          .setDescription(isKS
            ? "**Krishiv Studios** is a premium development agency specializing in custom Discord bots, Minecraft plugins, and SaaS products.\n\n> *\"Building the future of gaming infrastructure, one bot at a time.\"*\n> — **Krishiv PB**, Founder & Studio Lead"
            : "**KryloSMP** is the ultimate Minecraft survival network featuring custom economy, PvP arenas, daily quests, and jackpot rewards.\n\n> *\"Where legends are forged and empires rise.\"*\n> — **KryloSMP Network**"
          )
          .addFields(
            { name: "📌 Quick Start Guide", value: isKS
              ? "1. Read the rules below\n2. Grab your roles in <#roles>\n3. Browse services in <#pricing>\n4. Order at [krishiv-new-portfoilo.vercel.app](https://krishiv-new-portfoilo.vercel.app/#contact)"
              : "1. Read the rules below\n2. Verify in <#verify>\n3. Pick roles in <#roles>\n4. Connect: `play.krylosmp.net`" },
            { name: "🌐 Links", value: isKS
              ? "[🌐 Portfolio](https://krishiv-new-portfoilo.vercel.app) • [📝 Order Bot](https://krishiv-new-portfoilo.vercel.app/#contact) • [🛒 Store](https://krylosmp-store.web.app)"
              : "[🌐 Player Portal](https://krylosmp.web.app) • [🛒 Webstore](https://krylosmp-store.web.app) • [📊 Live Map](https://krylosmp.web.app)" }
          )
          .setColor(isKS ? 0x00F2FF : 0xFF0055)
          .setFooter({ text: `${guild.name} • Est. 2024`, iconURL: guild.iconURL() })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app"),
          new ButtonBuilder().setLabel("💬 Invite Friends").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX"),
          new ButtonBuilder().setLabel("🛒 Store").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
        );

        await rulesChannel.send({ embeds: [welcomeEmbed], components: [row] });

        // 3. OFFICIAL RULES EMBED
        const rulesEmbed = new EmbedBuilder()
          .setTitle("📜 OFFICIAL SERVER RULES")
          .setDescription("By joining this server, you agree to follow all rules listed below. Violations may result in warnings, mutes, or permanent bans.")
          .addFields(
            { name: "1️⃣ Respect Everyone", value: "No harassment, bullying, racism, sexism, homophobia, or personal attacks of any kind." },
            { name: "2️⃣ No Spam or Flooding", value: "Do not spam messages, emojis, images, or bot commands. Keep conversations meaningful." },
            { name: "3️⃣ No NSFW Content", value: "Absolutely no NSFW, gore, or disturbing content in any channel or DMs to members." },
            { name: "4️⃣ No Unauthorized Advertising", value: "Do not promote other Discord servers, products, or services without explicit staff permission." },
            { name: "5️⃣ No Exploiting or Hacking", value: isKS
              ? "Do not attempt to exploit bot vulnerabilities, steal source code, or DDoS any service."
              : "No hacked clients, x-ray, killaura, speed hacks, or any unfair advantage mods." },
            { name: "6️⃣ Follow Discord TOS", value: "You must adhere to [Discord Terms of Service](https://discord.com/terms) and [Community Guidelines](https://discord.com/guidelines)." },
            { name: "7️⃣ Listen to Staff", value: "Staff decisions are final. If you have concerns, open a ticket in the support channel." },
            { name: "8️⃣ Use Channels Correctly", value: "Keep discussions relevant to each channel's topic. Check channel descriptions for guidance." },
            { name: "9️⃣ No Impersonation", value: "Do not impersonate staff members, other users, or bots." },
            { name: "🔟 Have Fun!", value: "This is a community — enjoy yourself, make friends, and be part of something awesome! 🎉" }
          )
          .setColor(0xFFAA00)
          .setFooter({ text: `${guild.name} • Breaking rules = consequences`, iconURL: guild.iconURL() });

        await rulesChannel.send({ embeds: [rulesEmbed] });
        console.log(`✅ Premium welcome banner + 10-point rules posted in #${rulesChannel.name}!`);
      }

      // ==========================================
      // 4. SERVER GUIDE DIRECTORY EMBED
      // ==========================================
      const guideChannel = channels.find(c => c && c.name && (c.name.includes('server-info') || c.name.includes('starter-guide')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

      if (guideChannel) {
        try {
          const msgs = await guideChannel.messages.fetch({ limit: 50 });
          const botMsgs = msgs.filter(m => m.author.id === client.user.id);
          for (const m of botMsgs.values()) {
            await m.delete().catch(() => {});
          }
        } catch (e) {}

        const directoryEmbed = new EmbedBuilder()
          .setTitle(`📖 ${guild.name} — COMPLETE CHANNEL DIRECTORY`)
          .setColor(0x00F2FF)
          .setDescription("Navigate the server easily using this master directory. Each channel has its own unique 5-point protocol!")
          .setFooter({ text: `${guild.name} • Channel Directory`, iconURL: guild.iconURL() });

        const textChannels = channels.filter(c => c && c.isTextBased() && c.type !== ChannelType.GuildCategory);
        const categories = channels.filter(c => c && c.type === ChannelType.GuildCategory);

        for (const [catId, cat] of categories) {
          const children = textChannels.filter(c => c.parentId === catId);
          if (children.size === 0) continue;

          const channelList = children.map(c => `<#${c.id}>`).join('\n');
          directoryEmbed.addFields({
            name: `📁 ${cat.name}`,
            value: channelList.substring(0, 1024),
            inline: true
          });
        }

        await guideChannel.send({ embeds: [directoryEmbed] });
        console.log(`✅ Channel directory posted in #${guideChannel.name}!`);
      }

      // ==========================================
      // 5. STAFF APPLICATION EMBED
      // ==========================================
      const contactChannel = channels.find(c => c && c.name && (c.name.includes('contact-staff') || c.name.includes('support-ticket')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

      if (contactChannel) {
        try {
          const msgs = await contactChannel.messages.fetch({ limit: 50 });
          const botMsgs = msgs.filter(m => m.author.id === client.user.id);
          for (const m of botMsgs.values()) {
            await m.delete().catch(() => {});
          }
        } catch (e) {}

        const ticketEmbed = new EmbedBuilder()
          .setTitle("🎫 SUPPORT & CONTACT CENTER")
          .setDescription("Need help? Choose an option below to get started.")
          .addFields(
            { name: "🤖 AI Agent Support", value: "Visit [our website](https://krishiv-new-portfoilo.vercel.app/#contact) to instantly talk to Krishiv's AI Sales & Support Agent.", inline: true },
            { name: "📧 Email Support", value: "Send an email to `71krishivpb@gmail.com` for direct assistance.", inline: true },
            { name: "💬 Staff DM", value: "DM any online staff member with the `🛡️ Head Administrator` or `⚔️ Senior Moderator` role.", inline: true }
          )
          .setColor(0x00F2FF)
          .setFooter({ text: `${guild.name} • Average response time: < 24 hours`, iconURL: guild.iconURL() });

        const ticketRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🤖 AI Agent Support").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact"),
          new ButtonBuilder().setLabel("📧 Email Us").setStyle(ButtonStyle.Link).setURL("mailto:71krishivpb@gmail.com")
        );

        await contactChannel.send({ embeds: [ticketEmbed], components: [ticketRow] });
        console.log(`✅ Support center embed posted in #${contactChannel.name}!`);
      }

      // ==========================================
      // 6. SOCIAL LINKS & BRANDING EMBED
      // ==========================================
      const socialsChannel = channels.find(c => c && c.name && (c.name.includes('social') || c.name.includes('youtube')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

      if (socialsChannel) {
        try {
          const msgs = await socialsChannel.messages.fetch({ limit: 50 });
          const botMsgs = msgs.filter(m => m.author.id === client.user.id);
          for (const m of botMsgs.values()) {
            await m.delete().catch(() => {});
          }
        } catch (e) {}

        const socialEmbed = new EmbedBuilder()
          .setTitle("🌐 OFFICIAL SOCIAL LINKS & WEB PRESENCE")
          .setDescription("Follow Krishiv Studios across all platforms for updates, content, and announcements!")
          .addFields(
            { name: "🌐 Portfolio Website", value: "[krishiv-new-portfoilo.vercel.app](https://krishiv-new-portfoilo.vercel.app)", inline: true },
            { name: "🛒 Server Webstore", value: "[krylosmp-store.web.app](https://krylosmp-store.web.app)", inline: true },
            { name: "📊 Player Portal", value: "[krylosmp.web.app](https://krylosmp.web.app)", inline: true },
            { name: "💻 GitHub", value: "[github.com/Krylo-60](https://github.com/Krylo-60)", inline: true },
            { name: "🤖 AI SaaS Portal", value: "[smplink-saas.vercel.app](https://smplink-saas.vercel.app)", inline: true },
            { name: "💬 Discord Invite", value: "[discord.gg/2hSXQKHvvX](https://discord.gg/2hSXQKHvvX)", inline: true }
          )
          .setColor(0x00F2FF)
          .setFooter({ text: `${guild.name} • Krishiv Studios Network`, iconURL: guild.iconURL() });

        await socialsChannel.send({ embeds: [socialEmbed] });
        console.log(`✅ Social links embed posted in #${socialsChannel.name}!`);
      }

      console.log(`✅ ALL PREMIUM UPGRADES COMPLETE for ${guild.name}!`);

    } catch (err) {
      console.error(`Error in guild ${gId}:`, err.message);
    }
  }

  console.log(`\n🏆 ALL PREMIUM UPGRADES DEPLOYED ACROSS ALL SERVERS!`);
  client.destroy();
});

client.login(token);
