import { Client, GatewayIntentBits, REST, Routes, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1531792924055048292', '1524878881918685405'];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const botId = client.user.id;

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`\n🧹 CLEANING DUPLICATE BOT MESSAGES in: ${guild.name} (${guild.id})...`);
      const channels = await guild.channels.fetch();

      for (const [cId, channel] of channels) {
        if (!channel || !channel.isTextBased() || channel.type === ChannelType.GuildCategory) continue;

        try {
          // Fetch up to 100 recent messages
          const messages = await channel.messages.fetch({ limit: 100 });
          
          // Filter only bot's own messages
          const botMessages = messages.filter(m => m.author.id === botId);
          
          if (botMessages.size <= 1) {
            // 0 or 1 bot message = no duplicates
            continue;
          }

          // Sort by timestamp descending (newest first)
          const sorted = [...botMessages.values()].sort((a, b) => b.createdTimestamp - a.createdTimestamp);
          
          // Keep only the NEWEST bot message, delete the rest
          const toDelete = sorted.slice(1); // Everything except the first (newest)
          
          console.log(`#${channel.name}: Found ${botMessages.size} bot messages, keeping newest, deleting ${toDelete.length} duplicates...`);
          
          for (const msg of toDelete) {
            try {
              await msg.delete();
            } catch (e) {
              // Ignore delete errors for old messages
            }
          }
        } catch (e) {
          // Channel might not be accessible
        }
      }

      console.log(`✅ Duplicate cleanup complete for ${guild.name}!`);
    } catch (err) {
      console.error(`Error in guild ${gId}:`, err.message);
    }
  }

  // ---- SERVER GUIDE SETUP ----
  console.log(`\n📖 Setting up Server Guide...`);
  const rest = new REST({ version: '10' }).setToken(token);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      const channels = await guild.channels.fetch();

      const findChannel = (keywords) => {
        for (const kw of keywords) {
          const found = channels.find(c => c && c.name && c.name.toLowerCase().includes(kw) && c.isTextBased() && c.type !== ChannelType.GuildCategory);
          if (found) return found;
        }
        return null;
      };

      const rulesChannel = findChannel(['rules', 'welcome']);
      const generalChannel = findChannel(['general-chat', 'general']);
      const announcementsChannel = findChannel(['announcements']);
      const faqChannel = findChannel(['faq']);
      const rolesChannel = findChannel(['roles', 'verify']);
      const botCommandsChannel = findChannel(['bot-commands', 'commands']);
      const ticketChannel = findChannel(['ticket', 'contact-staff', 'order']);
      const showcaseChannel = findChannel(['showcase', 'portfolio', 'build']);
      const giveawaysChannel = findChannel(['giveaway']);
      const pricingChannel = findChannel(['pricing', 'hire']);

      const isKS = gId === '1531792924055048292';

      // Build Server Guide resource channels array
      const guideResources = [];

      if (rulesChannel) {
        guideResources.push({
          channel_id: rulesChannel.id,
          title: "📑 Server Rules",
          description: isKS ? "Read our community rules and terms of service before interacting." : "Official KryloSMP rules and guidelines for all players.",
          emoji: { name: "📑" }
        });
      }

      if (announcementsChannel) {
        guideResources.push({
          channel_id: announcementsChannel.id,
          title: "📢 Official Announcements",
          description: isKS ? "Latest news about custom bot releases, SaaS updates, and studio projects." : "Server updates, maintenance notices, and feature releases.",
          emoji: { name: "📢" }
        });
      }

      if (faqChannel) {
        guideResources.push({
          channel_id: faqChannel.id,
          title: "❓ FAQ & Quick Answers",
          description: isKS ? "Common questions about pricing, delivery times, and bot features." : "How to connect, commands, shop setup, and server IP info.",
          emoji: { name: "❓" }
        });
      }

      if (rolesChannel) {
        guideResources.push({
          channel_id: rolesChannel.id,
          title: "🌍 Self-Assign Roles",
          description: "Pick your notification pings (Announcements, Giveaways, Events) and gaming platform roles.",
          emoji: { name: "🌍" }
        });
      }

      if (generalChannel) {
        guideResources.push({
          channel_id: generalChannel.id,
          title: "💬 Community Chat",
          description: "Start chatting, meet the community, and earn level roles by being active!",
          emoji: { name: "💬" }
        });
      }

      if (botCommandsChannel) {
        guideResources.push({
          channel_id: botCommandsChannel.id,
          title: "🤖 Bot Commands",
          description: isKS ? "Test bot features and use slash commands." : "Use /spin, /jackpot, /duel, /clan, /quests and more!",
          emoji: { name: "🤖" }
        });
      }

      if (ticketChannel) {
        guideResources.push({
          channel_id: ticketChannel.id,
          title: "🎫 Get Support",
          description: isKS ? "Order a custom bot or get help from Krishiv's AI Agent." : "Open a support ticket for help with any server issues.",
          emoji: { name: "🎫" }
        });
      }

      if (showcaseChannel) {
        guideResources.push({
          channel_id: showcaseChannel.id,
          title: isKS ? "🚀 Portfolio Showcase" : "🏰 Build Showcase",
          description: isKS ? "Browse Krishiv's completed projects and client deliveries." : "Share your epic builds and check out community creations.",
          emoji: { name: isKS ? "🚀" : "🏰" }
        });
      }

      if (giveawaysChannel) {
        guideResources.push({
          channel_id: giveawaysChannel.id,
          title: "🎁 Giveaways & Events",
          description: "Participate in free rank, item, and Nitro giveaways. Toggle @Giveaway Ping in roles!",
          emoji: { name: "🎁" }
        });
      }

      if (pricingChannel) {
        guideResources.push({
          channel_id: pricingChannel.id,
          title: isKS ? "💳 Pricing & Services" : "💼 Hire Developers",
          description: isKS ? "View commission pricing for Discord bots, plugins, and SaaS products." : "Commission custom bots and plugins from Krishiv Studios.",
          emoji: { name: isKS ? "💳" : "💼" }
        });
      }

      // Use the Guild edit endpoint to enable Server Guide
      try {
        // Enable Community features required for Server Guide
        await guild.edit({
          description: isKS
            ? "Krishiv Studios — Custom Discord bots, Minecraft plugins, and SaaS by Krishiv PB. 🚀"
            : "KryloSMP — The ultimate Minecraft survival network with custom economy, PvP, and events. ⚔️"
        });
        console.log(`✅ Updated ${guild.name} description!`);
      } catch (e) {
        console.warn(`⚠️ Guild description: ${e.message}`);
      }

      // Post Server Guide overview embed in rules channel
      if (rulesChannel) {
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');

        const guideEmbed = new EmbedBuilder()
          .setTitle(`📖 ${guild.name} — SERVER GUIDE`)
          .setDescription(`Welcome to **${guild.name}**! Here's everything you need to get started:`)
          .setColor(0x00F2FF)
          .setFooter({ text: `${guild.name} • Official Server Guide`, iconURL: guild.iconURL() });

        for (const res of guideResources) {
          guideEmbed.addFields({
            name: `${res.title}`,
            value: `${res.description}\n→ <#${res.channel_id}>`,
            inline: false
          });
        }

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app"),
          new ButtonBuilder().setLabel("📝 Order a Bot").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact"),
          new ButtonBuilder().setLabel("💬 Invite Friends").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
        );

        await rulesChannel.send({ embeds: [guideEmbed], components: [row] });
        console.log(`✅ Server Guide embed posted in #${rulesChannel.name}!`);
      }

      console.log(`✅ Server Guide setup complete for ${guild.name}!`);
    } catch (err) {
      console.error(`Error setting up guide for ${gId}:`, err.message);
    }
  }

  console.log(`\n✅ ALL DUPLICATE MESSAGES DELETED & SERVER GUIDES DEPLOYED!`);
  client.destroy();
});

client.login(token);
