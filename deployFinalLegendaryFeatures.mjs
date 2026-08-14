import { 
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, ChannelType 
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILD_ID = '1524878881918685405';

client.once('ready', async () => {
  console.log(`[+] ${client.user.tag} — Deploying Final Legendary Tier Features...`);

  const guild = await client.guilds.fetch(GUILD_ID);
  const channels = await guild.channels.fetch();

  // ─────────────────────────────────────────────
  // 1. SELF-ROLE REACTION HUB in #server-info
  // ─────────────────────────────────────────────
  const infoCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('server-info'));
  if (infoCh) {
    const selfRoleEmbed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setAuthor({ name: '👑 KryloSMP Self-Assign Roles', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
      .setTitle('🏷️ PICK YOUR ROLES & PING PREFERENCES')
      .setDescription(
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Toggle notification pings and community tags! Click a button to **add/remove** the role from your profile.\n\n` +
        `🔔 **Notification Pings:**\n` +
        `• 📢 **Announcement Ping** — Get pinged for major server updates\n` +
        `• 🎁 **Giveaway Ping** — Never miss a free KC or rank giveaway\n` +
        `• 🎪 **Event Ping** — Tournaments, PvP events, and community nights\n\n` +
        `🎮 **Community Tags:**\n` +
        `• 🏰 **Builder** — You love building mega bases\n` +
        `• ⚔️ **PvP Warrior** — You live for combat and duels\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setFooter({ text: 'KryloSMP Self-Role Engine • Click to toggle' })
      .setTimestamp();

    const pingRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('selfrole_announcement').setLabel('📢 Announcements').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('selfrole_giveaway').setLabel('🎁 Giveaways').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('selfrole_event').setLabel('🎪 Events').setStyle(ButtonStyle.Secondary)
    );

    const tagRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('selfrole_builder').setLabel('🏰 Builder').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('selfrole_pvp').setLabel('⚔️ PvP Warrior').setStyle(ButtonStyle.Danger)
    );

    await infoCh.send({ embeds: [selfRoleEmbed], components: [pingRow, tagRow] });
    console.log(`   [✅] Deployed Self-Role Hub in #${infoCh.name}`);
  }

  // ─────────────────────────────────────────────
  // 2. SUGGESTION VOTING INSTRUCTIONS in #suggestions
  // ─────────────────────────────────────────────
  const suggestCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('suggestion'));
  if (suggestCh) {
    const msgs = await suggestCh.messages.fetch({ limit: 10 }).catch(() => null);
    if (msgs) {
      for (const [, m] of msgs) {
        if (m.author.id === client.user.id) await m.delete().catch(() => {});
      }
    }

    const suggestEmbed = new EmbedBuilder()
      .setColor(0xFFD166)
      .setAuthor({ name: '👑 KryloSMP Community Voice', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
      .setTitle('💡 KRYLOSMP SUGGESTION BOX')
      .setDescription(
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Have an idea to make **KryloSMP** even better? Drop your suggestion below!\n\n` +
        `📋 **HOW IT WORKS:**\n` +
        `1️⃣ Type your suggestion as a message in this channel\n` +
        `2️⃣ The bot will automatically react with ✅ and ❌ for community voting\n` +
        `3️⃣ Staff reviews top-voted suggestions every week!\n\n` +
        `✨ **SUGGESTIONS WE LOVE:**\n` +
        `• New minigames, events, or tournament ideas\n` +
        `• Quality-of-life improvements for Discord or Minecraft\n` +
        `• Channel layout or bot command ideas\n` +
        `• In-game economy balancing feedback\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ *Top-voted suggestions each month earn their creator **5,000 KC**!*`
      )
      .setImage('https://krylosmp.web.app/banner.jpg')
      .setFooter({ text: 'KryloSMP Suggestions • Auto-Vote System Active' })
      .setTimestamp();

    await suggestCh.send({ embeds: [suggestEmbed] });
    console.log(`   [✅] Deployed Suggestion Box in #${suggestCh.name}`);
  }

  // ─────────────────────────────────────────────
  // 3. BUMP REMINDER PANEL in #bot-commands
  // ─────────────────────────────────────────────
  const botCmdCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('bot-command'));
  if (botCmdCh) {
    const bumpEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ name: '📊 Disboard Bump Reminder', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
      .setTitle('🚀 HELP KRYLOSMP GROW — BUMP THE SERVER!')
      .setDescription(
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Every **2 hours**, you can run \`/bump\` (Disboard) to push **KryloSMP** to the top of the Disboard server list!\n\n` +
        `🏆 **BUMP REWARDS:**\n` +
        `• Each successful bump earns you **+500 KryloCoins**!\n` +
        `• Top bumper of the month wins **10,000 KC + Custom Title**!\n\n` +
        `📊 **BUMP LEADERBOARD:**\n` +
        `Run \`/bumpleaderboard\` to see who has bumped the most!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setFooter({ text: 'KryloSMP Growth Engine • /bump every 2 hours' })
      .setTimestamp();

    const bumpRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_bump_reminder')
        .setLabel('🔔 Remind Me to Bump')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🔔'),
      new ButtonBuilder()
        .setLabel('📊 View on Disboard')
        .setStyle(ButtonStyle.Link)
        .setURL('https://disboard.org/server/1524878881918685405')
    );

    await botCmdCh.send({ embeds: [bumpEmbed], components: [bumpRow] });
    console.log(`   [✅] Deployed Bump Reminder in #${botCmdCh.name}`);
  }

  // ─────────────────────────────────────────────
  // 4. LEVEL REWARDS PANEL in #levels-and-rewards
  // ─────────────────────────────────────────────
  const levelsCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('level'));
  if (levelsCh) {
    const msgs = await levelsCh.messages.fetch({ limit: 10 }).catch(() => null);
    if (msgs) {
      for (const [, m] of msgs) {
        if (m.author.id === client.user.id) await m.delete().catch(() => {});
      }
    }

    const levelEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setAuthor({ name: '👑 KryloSMP Progression System', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
      .setTitle('📈 LEVEL REWARDS & MILESTONE PERKS')
      .setDescription(
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Earn **XP** by chatting, playing minigames, and participating in events! Each level unlocks exclusive rewards.\n\n` +
        `🏆 **MILESTONE REWARDS:**\n\n` +
        `⭐ **Level 5** — Unlock \`#📷┃media-clips\` + **2,000 KC Bonus**\n` +
        `⭐ **Level 10** — Unlock \`#⚔️┃pvp-chat\` + **🔴 Red Name Color** + **5,000 KC**\n` +
        `⭐ **Level 25** — Unlock \`#🤝┃item-trading\` + **Custom Nickname** + **15,000 KC**\n` +
        `⭐ **Level 50** — **👑 Elite Member** Role + **50,000 KC** + **In-Game God Kit**\n` +
        `⭐ **Level 100** — **🌟 Legendary** Role + **100,000 KC** + **Server Shoutout**\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💡 *Use \`/rank\` to check your current level and XP progress!*`
      )
      .setImage('https://krylosmp.web.app/banner.jpg')
      .setFooter({ text: 'KryloSMP Leveling Engine • Powered by Krims AI' })
      .setTimestamp();

    const levelRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_check_rank')
        .setLabel('📊 Check My Rank & XP')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📊'),
      new ButtonBuilder()
        .setLabel('🌐 View Rich List on Web')
        .setStyle(ButtonStyle.Link)
        .setURL('https://krylosmp.web.app/')
    );

    await levelsCh.send({ embeds: [levelEmbed], components: [levelRow] });
    console.log(`   [✅] Deployed Level Rewards in #${levelsCh.name}`);
  }

  // ─────────────────────────────────────────────
  // 5. PARTNERSHIP DIRECTORY in #partnerships
  // ─────────────────────────────────────────────
  const partnerCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('partner'));
  if (partnerCh) {
    const msgs = await partnerCh.messages.fetch({ limit: 10 }).catch(() => null);
    if (msgs) {
      for (const [, m] of msgs) {
        if (m.author.id === client.user.id) await m.delete().catch(() => {});
      }
    }

    const partnerEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setAuthor({ name: '👑 KryloSMP Partnership Network', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
      .setTitle('🤝 OFFICIAL PARTNERSHIP & CREATOR PROGRAM')
      .setDescription(
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Interested in partnering your **Discord server**, **YouTube channel**, or **Minecraft community** with KryloSMP?\n\n` +
        `📋 **PARTNERSHIP TIERS:**\n\n` +
        `🥉 **Bronze Partner** (100+ members)\n` +
        `• Mutual server advertisement + Partner role\n\n` +
        `🥈 **Silver Partner** (500+ members)\n` +
        `• Dedicated partner channel + Cross-promotions\n\n` +
        `🥇 **Gold Partner** (1,000+ members)\n` +
        `• Featured in #📢┃server-announcements + Custom embed showcase\n\n` +
        `🎬 **Content Creator** (100+ subscribers)\n` +
        `• 🎬 Creator role + Early access to events + Dedicated media perks\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setImage('https://krylosmp.web.app/banner.jpg')
      .setFooter({ text: 'KryloSMP Partnership Program • Apply Below' })
      .setTimestamp();

    const partnerRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('📝 Apply for Partnership')
        .setStyle(ButtonStyle.Link)
        .setURL('https://docs.google.com/forms/d/e/1FAIpQLSfMeMUj0OWdnH-mpMvdiFbkRywoT7WMXpxYsSdDgPixtKAX7w/viewform'),
      new ButtonBuilder()
        .setCustomId('btn_partner_info')
        .setLabel('❓ Partnership FAQ')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('❓')
    );

    await partnerCh.send({ embeds: [partnerEmbed], components: [partnerRow] });
    console.log(`   [✅] Deployed Partnership Hub in #${partnerCh.name}`);
  }

  console.log(`\n🎉 ALL FINAL LEGENDARY FEATURES DEPLOYED!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
