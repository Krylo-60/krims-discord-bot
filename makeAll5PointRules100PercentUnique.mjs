import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1531792924055048292', '1524878881918685405']; // Krishiv Studios & KryloSMP

// Hand-crafted unique 5-point rules database for every channel type
const channelRulesMap = {
  'rules': {
    title: "📑 5-POINT OFFICIAL SERVER RULES",
    color: 0x00F2FF,
    p1: "1️⃣ RESPECT ALL MEMBERS: No harassment, hate speech, toxicity, or personal attacks.",
    p2: "2️⃣ NO UNSOLICITED ADVERTISING: Do not DM members with server invites or self-promotion.",
    p3: "3️⃣ NO SPAM OR EXPLOITS: Keep chat clean. Do not spam messages, emojis, or exploit bugs.",
    p4: "4️⃣ FOLLOW DISCORD TOS: Adhere strictly to Discord Terms of Service and Community Guidelines.",
    p5: "5️⃣ STAFF AUTHORITY: Follow directions from Head Admins and Krishiv PB at all times."
  },
  'announcements': {
    title: "📢 5-POINT ANNOUNCEMENTS PROTOCOL",
    color: 0xFFAA00,
    p1: "1️⃣ OFFICIAL UPDATES: Only Krishiv PB and Studio Lead post network news here.",
    p2: "2️⃣ FEATURE RELEASES: Check here for new Discord bot versions and SMPLink SaaS patches.",
    p3: "3️⃣ MAINTENANCE NOTICES: Scheduled server downtime and updates will be posted here.",
    p4: "4️⃣ PING ROLES: Toggle `@Announcement Ping` in `#roles` to control notification pings.",
    p5: "5️⃣ FEEDBACK: Discuss announcements in `#general-chat` or submit ideas in `#suggestions`."
  },
  'pricing': {
    title: "💳 5-POINT PRICING & SERVICES MENU",
    color: 0x00FF88,
    p1: "1️⃣ DISCORD BOT COMMISSIONS: $25 - $100 for custom slash commands & Pterodactyl node control.",
    p2: "2️⃣ SMPLINK SAAS LICENSE: $9.99/mo for automated 1-click Minecraft ⇄ Discord linking.",
    p3: "3️⃣ SKRIPT & PAPER PLUGINS: $15 - $50 for custom bounties, OP ranks, and daily lucky chests.",
    p4: "4️⃣ 24-48 HOUR GUARANTEE: Fast delivery with source code package and full documentation.",
    p5: "5️⃣ HOW TO ORDER: Click 'Order Online' below to trigger Krishiv's AI Agent Auto-Responder."
  },
  'ticket': {
    title: "🎫 5-POINT ORDER & SUPPORT TICKET PROTOCOL",
    color: 0x00F2FF,
    p1: "1️⃣ SUBMIT YOUR INQUIRY: Fill out the order form on krishiv-new-portfoilo.vercel.app/#contact.",
    p2: "2️⃣ INSTANT AI RESPONSE: Receive your unique Order Tracker ID (`COMM-XXXX`) immediately.",
    p3: "3️⃣ AUTOMATED CODE PREVIEW: View generated starter code & deployment config on screen.",
    p4: "4️⃣ EMAIL CONFIRMATION: Order receipts and setup guides are sent directly to your email.",
    p5: "5️⃣ DIRECT STAFF CHAT: Need custom modifications? Staff will assist in your ticket channel."
  },
  'reviews': {
    title: "⭐ 5-POINT CLIENT REVIEWS PROTOCOL",
    color: 0xFFAA00,
    p1: "1️⃣ VERIFIED CLIENTS ONLY: Post reviews after receiving your completed bot or SaaS order.",
    p2: "2️⃣ STAR RATING FORMAT: Include a 1-5 star rating and project summary in your review.",
    p3: "3️⃣ HONEST FEEDBACK: Share your experience with build speed, code quality, and support.",
    p4: "4️⃣ NO DISPUTES IN REVIEWS: For support questions, use `#contact-staff` or open a ticket.",
    p5: "5️⃣ VIP ROLE REWARD: Reviewers receive the `⭐ VIP Client` role in Discord!"
  },
  'faq': {
    title: "❓ 5-POINT FREQUENTLY ASKED QUESTIONS",
    color: 0x00FF88,
    p1: "1️⃣ HOW LONG DOES A BOT TAKE?: Guaranteed delivery within 24 to 48 hours of order.",
    p2: "2️⃣ IS 24/7 HOSTING INCLUDED?: Yes! We set up Pterodactyl node hosting for continuous uptime.",
    p3: "3️⃣ ARE SOURCE FILES INCLUDED?: Yes! Clients get clean ZIP source packages with `.env` templates.",
    p4: "4️⃣ WHAT PAYMENT METHODS?: Instant AI confirmation with Vercel & Stripe support.",
    p5: "5️⃣ CAN I CUSTOMIZE MY BOT LATER?: Yes, custom bot code can be upgraded anytime."
  },
  'general': {
    title: "💬 5-POINT GENERAL CHAT PROTOCOL",
    color: 0x00F2FF,
    p1: "1️⃣ WELCOME EVERYONE: Greet new members and keep conversations friendly and open.",
    p2: "2️⃣ ENGLISH ONLY: Use English in general chat so moderators can assist everyone.",
    p3: "3️⃣ NO BOT COMMANDS HERE: Use bot slash commands in `#bot-commands` to keep chat clean.",
    p4: "4️⃣ NO HEAVY ARGUMENTS: Keep debates civil and respectful. Take disputes to DMs.",
    p5: "5️⃣ EARN LEVEL ROLES: Chat actively to unlock `⚡ Level 10`, `🔥 Level 25`, and `🌟 Level 50`!"
  },
  'commands': {
    title: "🤖 5-POINT BOT COMMANDS PROTOCOL",
    color: 0xAA00FF,
    p1: "1️⃣ ECONOMY COMMANDS: Use `/spin`, `/chest`, `/jackpot`, and `/bday` for daily rewards.",
    p2: "2️⃣ CLAN COMMANDS: Use `/clan create`, `/clan invite`, and `/clan info` for faction teams.",
    p3: "3️⃣ DUEL COMMANDS: Use `/duel <player>` to challenge players to 1v1 PvP matches.",
    p4: "4️⃣ NO COMMAND SPAM: Allow bot responses to finish before sending rapid commands.",
    p5: "5️⃣ REPORT BOT BUGS: Found a issue? Report it in `#bug-reports` for instant fixes."
  },
  'booster': {
    title: "💎 5-POINT SERVER BOOSTER PERKS",
    color: 0xF47FFF,
    p1: "1️⃣ EXCLUSIVE BOOSTER ROLE: Instant `💎 Server Booster` role with custom gradient color.",
    p2: "2️⃣ DOUBLE REWARDS: Earn 2x diamonds and coins from `/spin` and `/jackpot` commands.",
    p3: "3️⃣ VIP CHAT ACCESS: Unlock private voice channels and booster lounge access.",
    p4: "4️⃣ DIRECT SUPPORT PRIORITY: Priority response time on custom bot & plugin inquiries.",
    p5: "5️⃣ SPECIAL GIVEAWAYS: Auto-entry into monthly Booster Nitro & Rank giveaways!"
  },
  'giveaways': {
    title: "🎁 5-POINT GIVEAWAY PROTOCOL",
    color: 0xFFAA00,
    p1: "1️⃣ FREE PARTICIPATION: All verified server members can enter public giveaways.",
    p2: "2️⃣ FAIR WINNER SELECTION: Winners are chosen automatically using Krims Code AI bot.",
    p3: "3️⃣ CLAIM TIMELINE: Winners have 48 hours to claim rewards in `#contact-staff`.",
    p4: "4️⃣ NO ALT ACCOUNTS: Using alternate accounts to enter giveaways results in a ban.",
    p5: "5️⃣ TOGGLE NOTIFICATIONS: Click `🎉 Giveaway Ping` in `#roles` to never miss a drop!"
  },
  'hire': {
    title: "💼 5-POINT FREELANCE & HIRING PROTOCOL",
    color: 0x00F2FF,
    p1: "1️⃣ PROFESSIONAL WORK: Custom Discord.js v14 bots, Minecraft plugins, and Vercel web apps.",
    p2: "2️⃣ TRANSPARENT SCOPE: Detailed feature breakdown provided before build starts.",
    p3: "3️⃣ FAST TURNAROUND: Delivery guaranteed within 24 to 48 hours of project confirmation.",
    p4: "4️⃣ FULL SOURCE CODE: 100% ownership of project files and configuration code.",
    p5: "5️⃣ START ORDER: Click 'Order Online' below to initiate Krishiv's AI Agent Order Desk."
  },
  'pvp': {
    title: "⚔️ 5-POINT PVP ARENA PROTOCOL",
    color: 0xFF0055,
    p1: "1️⃣ ARENA RULES: Fair 1v1 PvP combat. No hacked clients, killaura, or speed mods.",
    p2: "2️⃣ DUEL SYSTEM: Use `/duel` to initiate wagered or practice matches.",
    p3: "3️⃣ CLAN WARFARE: Form alliances and recruit members in `#clan-recruitment`.",
    p4: "4️⃣ NO COMBAT LOGGING: Logging out in combat results in automatic inventory loss.",
    p5: "5️⃣ LEADERBOARD: Top killers earn the `⚔️ PvP Specialist` role in Discord!"
  },
  'shops': {
    title: "🏪 5-POINT PLAYER SHOPS & TRADING PROTOCOL",
    color: 0xFFAA00,
    p1: "1️⃣ ADVERTISE SHOPS: Post your shop coordinates (`/shop`) and item stock here.",
    p2: "2️⃣ PRICE TRANSPARENCY: State item prices clearly in diamonds or server currency.",
    p3: "3️⃣ SAFE TRADING: Use in-game `/trade` to prevent scamming during transactions.",
    p4: "4️⃣ NO FAKE ADVERTS: Posting misleading shop coordinates is strictly prohibited.",
    p5: "5️⃣ BALTOP RANKINGS: Check `/baltop` to view the richest players on the server!"
  }
};

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`🚀 Making 100% Unique 5-Point Rules for Guild: ${guild.name} (${guild.id})...`);
      const channels = await guild.channels.fetch();

      for (const [cId, channel] of channels) {
        if (!channel.isTextBased() || channel.type === 4) continue;

        // Find matching key
        const lowerName = channel.name.toLowerCase();
        let key = 'general';

        if (lowerName.includes('rule')) key = 'rules';
        else if (lowerName.includes('announce')) key = 'announcements';
        else if (lowerName.includes('price') || lowerName.includes('service')) key = 'pricing';
        else if (lowerName.includes('ticket') || lowerName.includes('order')) key = 'ticket';
        else if (lowerName.includes('review')) key = 'reviews';
        else if (lowerName.includes('faq')) key = 'faq';
        else if (lowerName.includes('command')) key = 'commands';
        else if (lowerName.includes('booster') || lowerName.includes('perk')) key = 'booster';
        else if (lowerName.includes('giveaway')) key = 'giveaways';
        else if (lowerName.includes('hire') || lowerName.includes('freelance') || lowerName.includes('term')) key = 'hire';
        else if (lowerName.includes('pvp') || lowerName.includes('duel')) key = 'pvp';
        else if (lowerName.includes('shop') || lowerName.includes('trade') || lowerName.includes('market')) key = 'shops';

        const r = channelRulesMap[key];

        console.log(`Posting UNIQUE 5-Point Rules to #${channel.name} (Key: ${key})...`);

        const embed = new EmbedBuilder()
          .setTitle(r.title)
          .setDescription(`Unique channel protocol and usage guidelines for **#${channel.name}** in **${guild.name}**.`)
          .addFields(
            { name: "1️⃣ PURPOSE & SCOPE", value: r.p1 },
            { name: "2️⃣ CONTENT PROTOCOL", value: r.p2 },
            { name: "3️⃣ CHAT ETIQUETTE", value: r.p3 },
            { name: "4️⃣ FEATURE INTEGRATION", value: r.p4 },
            { name: "5️⃣ ASSISTANCE & ACTIONS", value: r.p5 }
          )
          .setColor(r.color)
          .setFooter({ text: `${guild.name} • 100% Unique Channel Protocol`, iconURL: guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
          new ButtonBuilder().setLabel("📝 Order Online").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact")
        );

        await channel.send({ embeds: [embed], components: [row] }).catch(e => console.error(`Failed to send to #${channel.name}: ${e.message}`));
      }
    } catch (err) {
      console.error(`Error in guild ${gId}:`, err.message);
    }
  }

  console.log(`✅ 100% UNIQUE 5-POINT RULES POSTED TO ALL CHANNELS ACROSS BOTH SERVERS!`);
  client.destroy();
});

client.login(token);
