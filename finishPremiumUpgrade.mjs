import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1531792924055048292', '1524878881918685405'];

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
      console.log(`\n🚀 Finishing Premium Upgrade for: ${guild.name}...`);

      const channels = await guild.channels.fetch();

      // ==========================================
      // 1. SUPPORT CENTER EMBED
      // ==========================================
      const contactChannel = channels.find(c => c && c.name && (c.name.includes('contact-staff') || c.name.includes('support-ticket')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

      if (contactChannel) {
        try {
          const msgs = await contactChannel.messages.fetch({ limit: 50 });
          const botMsgs = msgs.filter(m => m.author.id === client.user.id);
          for (const m of botMsgs.values()) { await m.delete().catch(() => {}); }
        } catch (e) {}

        const ticketEmbed = new EmbedBuilder()
          .setTitle("🎫 SUPPORT & CONTACT CENTER")
          .setDescription("Need help? Choose an option below to get started.")
          .addFields(
            { name: "🤖 AI Agent Support", value: "Visit our website to instantly talk to Krishiv's AI Sales & Support Agent. Get your order processed in under 60 seconds!", inline: false },
            { name: "📧 Email Support", value: "Send an email to **71krishivpb@gmail.com** for direct private assistance.", inline: false },
            { name: "💬 Staff DM", value: "DM any online staff member with the `🛡️ Head Administrator` or `⚔️ Senior Moderator` role.", inline: false },
            { name: "⏱️ Response Time", value: "Average response time: **< 24 hours** for all inquiries.", inline: false }
          )
          .setColor(0x00F2FF)
          .setFooter({ text: `${guild.name} • We're here to help!`, iconURL: guild.iconURL() });

        const ticketRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🤖 AI Agent Support").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact"),
          new ButtonBuilder().setLabel("🌐 Portfolio Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app")
        );

        await contactChannel.send({ embeds: [ticketEmbed], components: [ticketRow] });
        console.log(`✅ Support center posted in #${contactChannel.name}!`);
      }

      // ==========================================
      // 2. SOCIAL LINKS & BRANDING
      // ==========================================
      const socialsChannel = channels.find(c => c && c.name && (c.name.includes('social') || c.name.includes('youtube')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

      if (socialsChannel) {
        try {
          const msgs = await socialsChannel.messages.fetch({ limit: 50 });
          const botMsgs = msgs.filter(m => m.author.id === client.user.id);
          for (const m of botMsgs.values()) { await m.delete().catch(() => {}); }
        } catch (e) {}

        const socialEmbed = new EmbedBuilder()
          .setTitle("🌐 OFFICIAL SOCIAL LINKS & WEB PRESENCE")
          .setDescription("Follow **Krishiv Studios** across all platforms for updates, content, and project announcements!")
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

        const socialRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app"),
          new ButtonBuilder().setLabel("💻 GitHub").setStyle(ButtonStyle.Link).setURL("https://github.com/Krylo-60"),
          new ButtonBuilder().setLabel("🛒 Store").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
        );

        await socialsChannel.send({ embeds: [socialEmbed], components: [socialRow] });
        console.log(`✅ Social links posted in #${socialsChannel.name}!`);
      }

      // ==========================================
      // 3. CHANNEL DIRECTORY (for Krishiv Studios — was missing)
      // ==========================================
      if (isKS) {
        const guideChannel = channels.find(c => c && c.name && (c.name.includes('faq-support') || c.name.includes('starter-guide')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

        if (guideChannel) {
          const directoryEmbed = new EmbedBuilder()
            .setTitle(`📖 ${guild.name} — COMPLETE CHANNEL DIRECTORY`)
            .setColor(0x00F2FF)
            .setDescription("Navigate the server easily using this master directory!")
            .setFooter({ text: `${guild.name} • Channel Directory`, iconURL: guild.iconURL() });

          const textChannels = channels.filter(c => c && c.isTextBased() && c.type !== ChannelType.GuildCategory);
          const categories = channels.filter(c => c && c.type === ChannelType.GuildCategory);

          for (const [catId, cat] of categories) {
            const children = textChannels.filter(c => c.parentId === catId);
            if (children.size === 0) continue;
            const channelList = children.map(c => `<#${c.id}>`).join('\n');
            directoryEmbed.addFields({ name: `📁 ${cat.name}`, value: channelList.substring(0, 1024), inline: true });
          }

          await guideChannel.send({ embeds: [directoryEmbed] });
          console.log(`✅ Channel directory posted in #${guideChannel.name}!`);
        }
      }

      console.log(`✅ Premium upgrade COMPLETE for ${guild.name}!`);

    } catch (err) {
      console.error(`Error in guild ${gId}:`, err.message);
    }
  }

  console.log(`\n🏆 ALL REMAINING PREMIUM FEATURES DEPLOYED!`);
  client.destroy();
});

client.login(token);
