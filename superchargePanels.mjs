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

    console.log(`\n🟢 SUPERCHARGING SERVER STATUS & STATS TRACKER for: ${guild.name}...`);
    const channels = await guild.channels.fetch();

    // 1. Live Server Status Channel (#server-status)
    const statusCh = channels.find(c => c && c.name && c.name.toLowerCase().includes('server-status') && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    if (statusCh) {
      // Clean old bot messages
      try {
        const msgs = await statusCh.messages.fetch({ limit: 10 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        for (const m of botMsgs.values()) { await m.delete().catch(() => {}); }
      } catch (e) {}

      const statusEmbed = new EmbedBuilder()
        .setTitle(`${KRYLO_EMOJI} 🟢 KRYLOSMP LIVE NETWORK STATUS`)
        .setDescription(`Real-time operational status and connection guide for **KryloSMP Network**!`)
        .addFields(
          { name: "🟢 Server Status", value: "`ONLINE & OPERATIONAL`", inline: true },
          { name: "⚡ Network Region", value: "`North America / Global`", inline: true },
          { name: "📶 Version Support", value: "`Java 1.20+ • Bedrock 1.20+`", inline: true },
          { name: "☕ Java Connection IP", value: "```krylosmp.play.hosting``` *(Default Port: 25565)*", inline: false },
          { name: "📱 Bedrock Connection IP", value: "```IP: krylosmp.play.hosting\nPort: 19132```", inline: false },
          { name: "🔒 Account Whitelist", value: "Link your account in <#${channels.find(c => c?.name?.includes('verify'))?.id || '0'}> to get instant whitelist & 16x free diamonds!", inline: false }
        )
        .setColor(0x00FF88)
        .setFooter({ text: `KryloSMP • Live Status Monitor`, iconURL: guild.iconURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
        new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app"),
        new ButtonBuilder().setLabel("💬 Invite Friends").setStyle(ButtonStyle.Link).setURL("https://discord.gg/2hSXQKHvvX")
      );

      await statusCh.send({ embeds: [statusEmbed], components: [row] });
      console.log(`✅ Posted Live Server Status embed in #${statusCh.name}!`);
    }

    // 2. Live Stats Tracker Channel (#live-stats-tracker)
    const statsCh = channels.find(c => c && c.name && c.name.toLowerCase().includes('live-stats-tracker') && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    if (statsCh) {
      try {
        const msgs = await statsCh.messages.fetch({ limit: 10 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        for (const m of botMsgs.values()) { await m.delete().catch(() => {}); }
      } catch (e) {}

      const textChannelsCount = channels.filter(c => c && c.isTextBased() && c.type !== ChannelType.GuildCategory).size;
      const rolesCount = guild.roles.cache.size;

      const statsEmbed = new EmbedBuilder()
        .setTitle(`${KRYLO_EMOJI} 📊 KRYLOSMP NETWORK STATS TRACKER`)
        .setDescription(`Current statistics for **${guild.name}**:`)
        .addFields(
          { name: "👥 Total Discord Members", value: `\`${guild.memberCount}\``, inline: true },
          { name: "💬 Total Channels", value: `\`${textChannelsCount}\``, inline: true },
          { name: "🎭 Total Roles", value: `\`${rolesCount}\``, inline: true },
          { name: "👑 Server Owner", value: `<@${guild.ownerId}>`, inline: true },
          { name: "🤖 Active Bot Systems", value: "`Verification` • `Tickets` • `Economy` • `PvP Duels` • `Leveling` • `AutoMod`", inline: false }
        )
        .setColor(0x00F2FF)
        .setFooter({ text: `KryloSMP Live Telemetry`, iconURL: guild.iconURL() })
        .setTimestamp();

      const statsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
        new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
      );

      await statsCh.send({ embeds: [statsEmbed], components: [statsRow] });
      console.log(`✅ Posted Live Stats Tracker embed in #${statsCh.name}!`);
    }

    // 3. Interactive Self-Role Panel (#roles / #server-info)
    const rolesCh = channels.find(c => c && c.name && (c.name.includes('roles') || c.name.includes('server-info')) && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    if (rolesCh) {
      try {
        const msgs = await rolesCh.messages.fetch({ limit: 10 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        for (const m of botMsgs.values()) { await m.delete().catch(() => {}); }
      } catch (e) {}

      const rolesEmbed = new EmbedBuilder()
        .setTitle(`${KRYLO_EMOJI} 🎨 SELF-ROLE SELECTION HUB`)
        .setDescription(`Click the buttons below to customize your roles and notification pings!`)
        .addFields(
          { name: "🎮 Gaming Platform Roles", value: "• `☕ Java Player` — I play Minecraft Java Edition\n• `🪨 Bedrock Player` — I play Minecraft Bedrock Edition" },
          { name: "🔔 Notification Ping Roles", value: "• `📢 Announcements` — Get pinged for server news & updates\n• `🎁 Giveaways` — Get pinged for free rank & item giveaways" }
        )
        .setColor(0xAA00FF)
        .setFooter({ text: `KryloSMP • Click buttons below to toggle roles!`, iconURL: guild.iconURL() })
        .setTimestamp();

      const roleRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('role_java').setLabel('Java Player').setStyle(ButtonStyle.Success).setEmoji('☕'),
        new ButtonBuilder().setCustomId('role_bedrock').setLabel('Bedrock Player').setStyle(ButtonStyle.Secondary).setEmoji('🪨'),
        new ButtonBuilder().setCustomId('role_announcements').setLabel('Announcements Ping').setStyle(ButtonStyle.Primary).setEmoji('📢'),
        new ButtonBuilder().setCustomId('role_giveaways').setLabel('Giveaways Ping').setStyle(ButtonStyle.Primary).setEmoji('🎁')
      );

      await rolesCh.send({ embeds: [rolesEmbed], components: [roleRow] });
      console.log(`✅ Posted Self-Role Selection panel in #${rolesCh.name}!`);
    }

    console.log(`\n🏆 KRYLOSMP STATUS, STATS & ROLE PANELS FULLY UPGRADED!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
