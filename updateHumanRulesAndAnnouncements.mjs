import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';
const KRYLO_EMOJI_ID = '1530370298262720722';
const KRYLO_EMOJI = `<:KryloSMP:${KRYLO_EMOJI_ID}>`;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('KryloSMP guild not found!');
      process.exit(1);
    }

    console.log(`\n📜 UPDATING RULES & ANNOUNCEMENTS WITH NATURAL HUMAN STAFF TONE...`);
    const channels = await guild.channels.fetch();

    // 1. Update #rules with clean, natural human 5-point server rules
    const rulesCh = channels.find(c => c && c.name && c.name.toLowerCase().includes('rules') && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    if (rulesCh) {
      try {
        const msgs = await rulesCh.messages.fetch({ limit: 10 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        for (const m of botMsgs.values()) { await m.delete().catch(() => {}); }
      } catch (e) {}

      const rulesEmbed = new EmbedBuilder()
        .setTitle(`${KRYLO_EMOJI} ⚔️ KRYLOSMP OFFICIAL SERVER RULES`)
        .setDescription(
          `Welcome to **KryloSMP**! To maintain a fun, fair, and competitive survival environment for everyone, all members and players must follow these official guidelines at all times.`
        )
        .addFields(
          {
            name: "1️⃣ Respect & Community Decorum",
            value: "Treat all members, players, and staff with respect. Toxicity, harassment, hate speech, and excessive drama are strictly prohibited in both Discord and in-game chat."
          },
          {
            name: "2️⃣ Fair Play Policy (Zero Tolerance)",
            value: "Hacked clients, X-Ray texture packs, auto-clickers, killaura, or any unfair modifications are strictly banned. Violators receive an immediate permanent ban without warning."
          },
          {
            name: "3️⃣ Land Claiming & Build Protection",
            value: "Griefing, stealing, or bypassing claim protections on built structures or claimed lands is forbidden. Protect your territory using `/claim` in-game."
          },
          {
            name: "4️⃣ Trading Integrity & Safe Economy",
            value: "Always use the `/trade` system for in-game transactions. Scamming, real-money trading (RMT), and staff impersonation are not allowed."
          },
          {
            name: "5️⃣ Server Connection & Account Security",
            value: "Connect using **`krylosmp.play.hosting`** (Java 1.20+ / Bedrock 19132). You are responsible for your account security. Link your account in <#${channels.find(c => c?.name?.includes('verify'))?.id || '0'}> to get whitelisted."
          }
        )
        .setColor(0x00FF88)
        .setFooter({ text: `KryloSMP Staff Team • Follow rules for a great experience!`, iconURL: guild.iconURL() })
        .setTimestamp();

      const rulesRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
        new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app"),
        new ButtonBuilder().setLabel("💬 Invite Friends").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
      );

      await rulesCh.send({ embeds: [rulesEmbed], components: [rulesRow] });
      console.log(`✅ Posted natural human rules embed in #${rulesCh.name}!`);
    }

    // 2. Update #announcements with clean, natural announcement welcome embed
    const announceCh = channels.find(c => c && c.name && c.name.toLowerCase().includes('announcement') && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    if (announceCh) {
      try {
        const msgs = await announceCh.messages.fetch({ limit: 10 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        for (const m of botMsgs.values()) { await m.delete().catch(() => {}); }
      } catch (e) {}

      const announceEmbed = new EmbedBuilder()
        .setTitle(`${KRYLO_EMOJI} 📢 KRYLOSMP OFFICIAL ANNOUNCEMENTS`)
        .setDescription(
          `Welcome to the **Official KryloSMP Announcements** channel!\n\n` +
          `This channel is used exclusively by our staff team to share important server updates, patch notes, maintenance schedules, and YouTube video releases.\n\n` +
          `> 💡 **Tip:** Click the **Follow** button at the bottom of this channel to receive our updates directly in your own Discord server!`
        )
        .addFields(
          { name: "🔔 Role Notifications", value: "Grab the `@Announcement Ping` role in <#${channels.find(c => c?.name?.includes('server-info'))?.id || '0'}> to never miss a major update." },
          { name: "📹 YouTube Releases", value: "New uploads from **Krylo** (`@Krylo-60`) will be automatically published here with direct watch links!" }
        )
        .setColor(0xFFAA00)
        .setFooter({ text: `KryloSMP Staff Team • Official Announcements`, iconURL: guild.iconURL() })
        .setTimestamp();

      const announceRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
        new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
      );

      await announceCh.send({ embeds: [announceEmbed], components: [announceRow] });
      console.log(`✅ Posted natural human announcement embed in #${announceCh.name}!`);
    }

    console.log(`\n🏆 RULES AND ANNOUNCEMENTS EMBEDS UPDATED WITH NATURAL HUMAN STAFF TONE!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
