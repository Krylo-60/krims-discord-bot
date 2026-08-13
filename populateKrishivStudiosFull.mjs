import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = '1531792924055048292'; // Krishiv Studios Guild ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      console.error(`Guild ${guildId} not found!`);
      process.exit(1);
    }

    console.log(`🚀 Starting Full Setup for "Krishiv Studios" (${guild.name})...`);

    // 1. Set Guild Icon / Logo
    const logoPath = path.join(process.cwd(), '..', 'Krishiv-portfolio', 'krishiv_studios_logo.jpg');
    if (fs.existsSync(logoPath)) {
      try {
        const logoBuffer = fs.readFileSync(logoPath);
        await guild.setIcon(logoBuffer);
        console.log(`✅ Guild Icon/Logo updated to krishiv_studios_logo.jpg!`);
      } catch (err) {
        console.error(`Could not set icon: ${err.message}`);
      }
    } else {
      console.warn(`Logo image not found at ${logoPath}`);
    }

    // 2. Create Server Roles
    console.log(`Creating Server Roles...`);
    const rolesData = [
      { name: '👑 Founder & Studio Lead', color: '#ffaa00', hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: '⚡ Bot Engineer', color: '#00f2ff', hoist: true },
      { name: '🚀 Client / Customer', color: '#ff8800', hoist: true },
      { name: '💎 VIP Member', color: '#aa00ff', hoist: true },
      { name: '✅ Verified Member', color: '#00ff88', hoist: false }
    ];

    for (const rData of rolesData) {
      const existing = guild.roles.cache.find(r => r.name === rData.name);
      if (!existing) {
        await guild.roles.create({
          name: rData.name,
          color: rData.color,
          hoist: rData.hoist,
          permissions: rData.permissions || []
        });
        console.log(`Created role: ${rData.name}`);
      }
    }

    // 3. Post Messages to Channels
    const channels = await guild.channels.fetch();

    // Helper to find channel by name snippet
    const findChan = (snippet) => channels.find(c => c.name.toLowerCase().includes(snippet.toLowerCase()) && c.isTextBased());

    // Channel 1: Welcome & Rules
    const welcomeChan = findChan('welcome-and-rules');
    if (welcomeChan) {
      const embed = new EmbedBuilder()
        .setTitle("👋 Welcome to Krishiv Studios Official Hub!")
        .setDescription("World-class custom Discord bots, Minecraft Paper/Skript engineering, and multi-tenant SaaS platforms built by **Krishiv PB (@Krylo-60)**.")
        .addFields(
          { name: "📜 Server Rules", value: "1. Be respectful to all clients & developers.\n2. No spamming or unauthorized self-promotion.\n3. Open tickets only for genuine project inquiries." },
          { name: "🌐 Official Links", value: "[Portfolio Website](https://krishiv-new-portfoilo.vercel.app) • [SMPLink SaaS](https://smplink-saas.vercel.app) • [GitHub Profile](https://github.com/Krylo-60)" }
        )
        .setColor(0x00F2FF)
        .setThumbnail(guild.iconURL());

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("🌐 Portfolio Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app"),
        new ButtonBuilder().setLabel("🐙 GitHub Profile").setStyle(ButtonStyle.Link).setURL("https://github.com/Krylo-60")
      );

      await welcomeChan.send({ embeds: [embed], components: [row] });
      console.log(`Posted embed to #welcome-and-rules`);
    }

    // Channel 2: Announcements
    const announceChan = findChan('announcements');
    if (announceChan) {
      const embed = new EmbedBuilder()
        .setTitle("📢 Official Launch: Krishiv Studios Hub!")
        .setDescription("Welcome to the central command center for **Krishiv Studios**! Here you can order custom Discord bots, explore our SaaS software, and get 24/7 automated support.")
        .setColor(0xFFAA00);
      await announceChan.send({ embeds: [embed] });
      console.log(`Posted embed to #announcements`);
    }

    // Channel 3: Portfolio Showcase
    const portChan = findChan('portfolio-showcase');
    if (portChan) {
      const embed = new EmbedBuilder()
        .setTitle("🚀 Krishiv Studios — Major Buildships Showcase")
        .addFields(
          { name: "1. ⚡ SMPLink SaaS", value: "Multi-tenant Discord ⇄ Minecraft linking, 3D skin tracker, and auto-whitelisting. ([View Live](https://smplink-saas.vercel.app))" },
          { name: "2. 🤖 Krims Code AI Bot", value: "Discord.js v14 bot engine featuring 16+ economy commands, Pterodactyl controls, and reaction roles." },
          { name: "3. 🎮 KryloSMP 1.21.x Network", value: "Cross-platform Java & Bedrock survival server (`KryloSmp.play.hosting:25565`)." }
        )
        .setColor(0x00F2FF);
      await portChan.send({ embeds: [embed] });
      console.log(`Posted embed to #portfolio-showcase`);
    }

    // Channel 4: Pricing & Services
    const priceChan = findChan('pricing-and-services');
    if (priceChan) {
      const embed = new EmbedBuilder()
        .setTitle("💳 Krishiv Studios — Services & Pricing Menu")
        .addFields(
          { name: "🤖 Custom Discord Bot Commissions ($25 – $100)", value: "Custom slash commands, Pterodactyl node integration, verification modals, and 24/7 host setup." },
          { name: "⚡ SMPLink SaaS Subscription ($9.99 / month)", value: "Plug-and-play Minecraft verification portal, 3D skin tracker, and live Vercel web leaderboard." },
          { name: "📜 Custom Skript / Paper Plugin Engineering ($15 – $50)", value: "Bounty systems, custom economy commands, OP ranks, and daily chest rewards." }
        )
        .setColor(0xFFAA00);
      await priceChan.send({ embeds: [embed] });
      console.log(`Posted embed to #pricing-and-services`);
    }

    // Channel 5: Order a Bot Ticket
    const ticketChan = findChan('order-a-bot-ticket');
    if (ticketChan) {
      const embed = new EmbedBuilder()
        .setTitle("🎫 Order a Custom Bot or SaaS License")
        .setDescription("Click the link below or submit your project inquiry on our web portal to trigger **Krishiv's AI Agent Auto-Responder**!")
        .setColor(0x00F2FF);
      
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("📝 Submit Inquiry / Order Online").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact")
      );

      await ticketChan.send({ embeds: [embed], components: [row] });
      console.log(`Posted embed to #order-a-bot-ticket`);
    }

    // Channel 6: FAQ & Support
    const faqChan = findChan('faq-support');
    if (faqChan) {
      const embed = new EmbedBuilder()
        .setTitle("❓ Frequently Asked Questions")
        .addFields(
          { name: "Q: How long does a custom bot take?", value: "A: Guaranteed delivery within 24–48 hours." },
          { name: "Q: Do you help with 24/7 hosting?", value: "A: Yes! We set up Pterodactyl node hosting for continuous uptime." },
          { name: "Q: How do payments work?", value: "A: Instant order confirmation receipt generated by our AI Agent." }
        )
        .setColor(0x00F2FF);
      await faqChan.send({ embeds: [embed] });
      console.log(`Posted embed to #faq-support`);
    }

    console.log(`✅ ALL CHANNELS, EMBEDS, ROLES, AND SERVER LOGO SUCCESSFULLY UPDATED!`);
  } catch (err) {
    console.error("Error populating server:", err.message);
  } finally {
    client.destroy();
  }
});

client.login(token);
