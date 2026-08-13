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

    console.log(`\n⚔️ PURGING Krishiv Studios references & Setting up KryloSMP UNIQUE EMBEDS + TICKET BUTTON...`);

    const channels = await guild.channels.fetch();

    // Iterate through all channels in KryloSMP
    for (const [cId, channel] of channels) {
      if (!channel || !channel.isTextBased() || channel.type === ChannelType.GuildCategory) continue;
      // Skip verify channel (verification system has its own handler)
      if (channel.name.toLowerCase().includes('verify')) continue;

      // Delete past bot messages to replace with 100% KryloSMP unique embeds
      try {
        const msgs = await channel.messages.fetch({ limit: 50 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        for (const m of botMsgs.values()) {
          await m.delete().catch(() => {});
        }
      } catch (e) {}

      const n = channel.name.toLowerCase();
      let embed, row;

      // ============================================================
      // 1. SUPPORT TICKETS & CONTACT STAFF -> REAL TICKET BUTTON!
      // ============================================================
      if (n.includes('support-ticket') || n.includes('contact-staff') || n.includes('ticket')) {
        embed = new EmbedBuilder()
          .setTitle(`${KRYLO_EMOJI} 🎟️ KRYLOSMP SUPPORT TICKET CENTER`)
          .setDescription(
            `Welcome to the official **KryloSMP Support Ticket Center**! 🛡️\n\n` +
            `Need assistance from our staff team? Have a player report, bug discovery, or billing inquiry?\n\n` +
            `**Click the button below to open a private 1-on-1 support ticket channel!**`
          )
          .addFields(
            {
              name: `📋 Ticket Guidelines`,
              value:
                `• **Player Reports:** Provide player IGN and video/screenshot evidence.\n` +
                `• **Bug Reports:** Describe how to reproduce the bug clearly.\n` +
                `• **Store / Ranks:** Provide your transaction ID or Minecraft IGN.\n` +
                `• **Staff Applications:** Open a ticket to submit your app.`
            },
            {
              name: `⏱️ Support Hours & Response`,
              value: `Our Support Staff & Moderators respond as quickly as possible. Please do not ping staff immediately after opening.`
            }
          )
          .setColor(0x00FF88)
          .setFooter({ text: `KryloSMP • Click below to open a support ticket!`, iconURL: guild.iconURL() })
          .setTimestamp();

        // REAL FUNCTIONAL TICKET BUTTON (customId: 'open_ticket')
        const openTicketBtn = new ButtonBuilder()
          .setCustomId('open_ticket')
          .setLabel('📩 Open Support Ticket')
          .setStyle(ButtonStyle.Primary)
          .setEmoji('🎟️');

        const portalBtn = new ButtonBuilder()
          .setLabel('🌐 Player Portal')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp.web.app');

        const storeBtn = new ButtonBuilder()
          .setLabel('🛒 Webstore')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp-store.web.app');

        row = new ActionRowBuilder().addComponents(openTicketBtn, portalBtn, storeBtn);

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Posted TICKET EMBED with 'open_ticket' button in #${channel.name}`);
      }

      // ============================================================
      // 2. RULES & INFORMATION
      // ============================================================
      else if (n.includes('rules') || n.includes('welcome')) {
        embed = new EmbedBuilder()
          .setTitle(`${KRYLO_EMOJI} ⚔️ WELCOME TO KRYLOSMP`)
          .setDescription(
            `**KryloSMP** is the ultimate Minecraft Survival experience! 🏹\n` +
            `Featuring custom economy, player shops, clan warfare, PvP arenas, daily quests, and weekly jackpot drawings.\n\n` +
            `> *\"Where legends are forged and empires rise.\"*`
          )
          .addFields(
            { name: "1️⃣ Respect All Players", value: "No harassment, hate speech, toxicity, or excessive trash talk." },
            { name: "2️⃣ Fair Play & No Hacks", value: "Strictly no hacked clients, x-ray, auto-clickers, or killaura. Unfair advantage = permaban." },
            { name: "3️⃣ No Griefing in Claimed Zones", value: "Respect land claims and build protections." },
            { name: "4️⃣ No Scamming or Impersonation", value: "Trade fairly using `/trade`. Do not impersonate staff members." },
            { name: "5️⃣ Server IP & Connection", value: "Connect using **`krylosmp.play.hosting`** or **`play.krylosmp.net`** (Java 1.20+)" }
          )
          .setColor(0xFF0055)
          .setFooter({ text: `KryloSMP Official Rules`, iconURL: guild.iconURL() });

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
          new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app"),
          new ButtonBuilder().setLabel("💬 Invite Friends").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Posted Rules embed in #${channel.name}`);
      }

      // ============================================================
      // 3. ANNOUNCEMENTS
      // ============================================================
      else if (n.includes('announce')) {
        embed = new EmbedBuilder()
          .setTitle(`${KRYLO_EMOJI} 📢 KRYLOSMP ANNOUNCEMENTS`)
          .setDescription("Official server news, game updates, patch notes, and event schedules!")
          .addFields(
            { name: "1️⃣ Stay Informed", value: "Check here for server restart schedules, patch notes, and content drops." },
            { name: "2️⃣ Role Notifications", value: "Toggle `@Announcement Ping` in `#roles` to never miss an update." },
            { name: "3️⃣ Event Calendar", value: "Special weekend events and drop parties are announced here first." }
          )
          .setColor(0xFFAA00)
          .setFooter({ text: `KryloSMP Announcements`, iconURL: guild.iconURL() });

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
          new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Posted Announcements embed in #${channel.name}`);
      }

      // ============================================================
      // 4. SERVER INFO & SOCIALS
      // ============================================================
      else if (n.includes('social') || n.includes('server-info') || n.includes('socials')) {
        embed = new EmbedBuilder()
          .setTitle(`${KRYLO_EMOJI} 🌐 KRYLOSMP NETWORK LINKS`)
          .setDescription("Connect with KryloSMP across all official portals and platforms!")
          .addFields(
            { name: "🎮 Server IP", value: "`krylosmp.play.hosting` (Java 1.20+)", inline: true },
            { name: "🌐 Player Portal", value: "[krylosmp.web.app](https://krylosmp.web.app)", inline: true },
            { name: "🛒 Official Webstore", value: "[krylosmp-store.web.app](https://krylosmp-store.web.app)", inline: true },
            { name: "💬 Discord Community", value: "[discord.gg/2hSXQKHvvX](https://discord.gg/2hSXQKHvvX)", inline: true },
            { name: "📊 Live Stats Tracker", value: "View online players, top clans, and rich list in real-time!", inline: true }
          )
          .setColor(0x00F2FF)
          .setFooter({ text: `KryloSMP Network Links`, iconURL: guild.iconURL() });

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
          new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app"),
          new ButtonBuilder().setLabel("💬 Invite Link").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Posted Socials embed in #${channel.name}`);
      }

      // ============================================================
      // 5. BOT COMMANDS HUB
      // ============================================================
      else if (n.includes('command')) {
        embed = new EmbedBuilder()
          .setTitle(`${KRYLO_EMOJI} 🤖 BOT COMMANDS HUB`)
          .setDescription("Use all server slash commands here!")
          .addFields(
            { name: "💰 Economy & Daily", value: "`/spin` • `/chest` • `/jackpot` • `/bday` • `/bal`" },
            { name: "🛡️ Clans & Factions", value: "`/clan create` • `/clan invite` • `/clan info` • `/clan deposit`" },
            { name: "⚔️ PvP Duels", value: "`/duel <player>` • `/duels-stats` • `/leaderboard`" },
            { name: "🎯 Quests & Bounties", value: "`/quests` • `/bounty place` • `/bounty list`" }
          )
          .setColor(0xAA00FF)
          .setFooter({ text: `KryloSMP Bot Commands`, iconURL: guild.iconURL() });

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
          new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Posted Bot Commands embed in #${channel.name}`);
      }

      // ============================================================
      // 6. PVP / ARENA / DUELS
      // ============================================================
      else if (n.includes('pvp') || n.includes('duel') || n.includes('arena')) {
        embed = new EmbedBuilder()
          .setTitle(`${KRYLO_EMOJI} ⚔️ PVP & ARENA CENTER`)
          .setDescription("Challenge players, test your gear, and dominate the KryloSMP PvP leaderboards!")
          .addFields(
            { name: "1️⃣ Arena Access", value: "Warp to arena using `/warp pvp` or challenge players directly with `/duel`." },
            { name: "2️⃣ Fair Fighting", value: "Strictly no auto-clickers, killaura, or reach hacks." },
            { name: "3️⃣ Clan Battles", value: "Organize clan vs clan skirmishes and record your clips!" },
            { name: "4️⃣ Top Rank", value: "Climb the duel leaderboard to earn the \`⚔️ PvP Specialist\` role." }
          )
          .setColor(0xFF0055)
          .setFooter({ text: `KryloSMP PvP Arena`, iconURL: guild.iconURL() });

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
          new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Posted PvP embed in #${channel.name}`);
      }

      // ============================================================
      // 7. STORE & MARKETPLACE
      // ============================================================
      else if (n.includes('store') || n.includes('market') || n.includes('shop') || n.includes('trade')) {
        embed = new EmbedBuilder()
          .setTitle(`${KRYLO_EMOJI} 🛒 KRYLOSMP WEBSTORE & MARKETPLACE`)
          .setDescription("Support the server and get rank upgrades, keys, and cosmetics!")
          .addFields(
            { name: "🌟 Ranks & Perks", value: "Unlock VIP, MVP, and LEGEND ranks with custom kits and fly perks." },
            { name: "🔑 Crate Keys", value: "Open Legendary & Mythic crates at spawn for rare items." },
            { name: "🏪 Player Shops", value: "Set up your own in-game chest shop using `/shop`." },
            { name: "🌐 Visit Webstore", value: "[krylosmp-store.web.app](https://krylosmp-store.web.app)" }
          )
          .setColor(0xFFAA00)
          .setFooter({ text: `KryloSMP Webstore`, iconURL: guild.iconURL() });

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🛒 Open Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app"),
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app")
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Posted Store embed in #${channel.name}`);
      }

      // ============================================================
      // 8. GENERIC KRYLOSMP EMBED (For remaining channels)
      // ============================================================
      else {
        const cleanName = channel.name.replace(/[^a-zA-Z0-9 ]/g, ' ').trim().toUpperCase();
        embed = new EmbedBuilder()
          .setTitle(`${KRYLO_EMOJI} 📌 ${cleanName}`)
          .setDescription(`Welcome to **#${channel.name}** in KryloSMP!`)
          .addFields(
            { name: "1️⃣ Stay On Topic", value: `Keep all discussions relevant to **${cleanName}**.` },
            { name: "2️⃣ Respect Community", value: "Follow server rules and treat everyone fairly." },
            { name: "3️⃣ No Spam", value: "Keep text clean, avoid excessive pings or bot commands." },
            { name: "4️⃣ Need Help?", value: "Open a support ticket in `#support-tickets` for staff assistance!" }
          )
          .setColor(0x00F2FF)
          .setFooter({ text: `KryloSMP Channel Protocol`, iconURL: guild.iconURL() });

        row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
          new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
        );

        await channel.send({ embeds: [embed], components: [row] });
        console.log(`✅ Posted generic KryloSMP embed in #${channel.name}`);
      }
    }

    console.log(`\n🏆 ALL KRYLOSMP CHANNELS CLEANED AND RESTORED WITH 100% UNIQUE KRYLOSMP EMBEDS + TICKET BUTTON!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
