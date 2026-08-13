import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log('[+] Masterpiece Elevater Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🚀 ELEVATING TO ABSOLUTE BEST FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      // 1. Ensure Live Stats Tracker Category & Channels
      let statsCat = guild.channels.cache.find(c => c.name.includes('SERVER STATS') && c.type === ChannelType.GuildCategory);
      if (!statsCat) {
        statsCat = await guild.channels.create({
          name: '📊 SERVER STATS 📊',
          type: ChannelType.GuildCategory,
          position: 0
        });
        console.log(`[+] Created Live Server Stats Category.`);
      }

      const memberCount = guild.memberCount;
      const statsVCs = [
        `🌐┃Total Members: ${memberCount}`,
        `🟢┃Server IP: KryloSmp.play.hosting`,
        `👑┃Owner: Krylo`
      ];

      for (const vcName of statsVCs) {
        const existing = guild.channels.cache.find(c => c.parentId === statsCat.id && (c.name.includes('Members') || c.name.includes('Server IP') || c.name.includes('Owner')));
        if (!existing) {
          await guild.channels.create({
            name: vcName,
            type: ChannelType.GuildVoice,
            parent: statsCat.id,
            permissionOverwrites: [
              { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.Connect] }
            ]
          });
          console.log(`[+] Created Stats VC: ${vcName}`);
        } else {
          await existing.setName(vcName).catch(() => {});
          console.log(`[+] Updated Stats VC: ${vcName}`);
        }
      }

      // 2. Deploy Master Server Rules Embed in #📌・rules
      const rulesCh = guild.channels.cache.find(c => c.name.includes('rules') && c.isTextBased());
      if (rulesCh) {
        const msgs = await rulesCh.messages.fetch({ limit: 20 }).catch(() => null);
        if (msgs && msgs.size > 0) {
          await rulesCh.bulkDelete(msgs).catch(() => {});
        }

        const rulesEmbed = new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Official Governance & Server Rules', iconURL: guild.iconURL() })
          .setTitle('📜 KRYLOSMP OFFICIAL SERVER CODE OF CONDUCT')
          .setDescription(
            `Welcome to **KryloSMP**! To maintain a safe, fair, and competitive environment for all players and creators, please strictly adhere to the rules below.\n\n` +
            `**1. 🛡️ RESPECT & SPORTSMANSHIP**\n` +
            `• No toxicity, harassment, hate speech, or excessive trash talk.\n` +
            `• Respect all staff members, creators, and fellow players at all times.\n\n` +
            `**2. 🚫 NO CHEATING & EXPLOITS**\n` +
            `• Hacking, X-Ray, Auto-Clickers, or exploiting server bugs is strictly prohibited.\n` +
            `• Violators will receive an instant permanent ban with zero appeals.\n\n` +
            `**3. 💰 ECONOMY & TRADING FAIRNESS**\n` +
            `• Real-Money Trading (RMT) outside the official store is forbidden.\n` +
            `• Scrambling or scamming during official trade or bounty sessions is punishable.\n\n` +
            `**4. 🔒 ACCOUNT & SECURITY**\n` +
            `• Keep your account credentials safe. You are responsible for all actions on your account.\n` +
            `• Do not share your verification code ("77777") with anyone.\n\n` +
            `**5. 🎟️ TICKET ETIQUETTE**\n` +
            `• Create support tickets only for valid issues. Do not spam or troll the support team.`
          )
          .setColor(0x00F2FF)
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'KryloSMP Network Governance • Powered by Krishiv Studios', iconURL: guild.iconURL() })
          .setTimestamp();

        const rulesRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🛒 Web Store").setStyle(ButtonStyle.Link).setURL("https://krims-code-chatbot.vercel.app/store"),
          new ButtonBuilder().setLabel("🎟️ Open Ticket").setStyle(ButtonStyle.Link).setURL(`https://discord.com/channels/${guild.id}`),
          new ButtonBuilder().setLabel("⭐ Vote Server").setStyle(ButtonStyle.Link).setURL("https://minecraft-mp.com")
        );

        await rulesCh.send({ embeds: [rulesEmbed], components: [rulesRow] });
        console.log(`[+] Sent Master Rules Embed into #${rulesCh.name}`);
      }

      // 3. Deploy Bot Commands Guide Embed in #🤖・bot-commands
      const cmdCh = guild.channels.cache.find(c => c.name.includes('bot-commands') && c.isTextBased());
      if (cmdCh) {
        const msgs = await cmdCh.messages.fetch({ limit: 20 }).catch(() => null);
        if (msgs && msgs.size > 0) {
          await cmdCh.bulkDelete(msgs).catch(() => {});
        }

        const cmdEmbed = new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Bot Command Directory & Leveling', iconURL: guild.iconURL() })
          .setTitle('🤖 KRYLOSMP INTERACTIVE BOT COMMAND CENTER')
          .setDescription(
            `Welcome to the command hub! Use the slash commands below to interact with the economy, clans, bounties, and leveling system!\n\n` +
            `**💰 ECONOMY COMMANDS**\n` +
            `• \`/balance\` — View your total KryloCoins (KC).\n` +
            `• \`/daily\` — Claim your 5,000 KC daily reward.\n` +
            `• \`/work\` — Work a mini-job and earn 1,000-3,000 KC.\n` +
            `• \`/jackpot\` — Enter the global server jackpot.\n\n` +
            `**🏰 CLAN COMMANDS**\n` +
            `• \`/clan info\` — View your clan details, members, and vault.\n` +
            `• \`/clan deposit\` — Deposit KC into your clan bank.\n` +
            `• \`/clan create\` — Create a new clan for 100,000 KC.\n\n` +
            `**🎯 BOUNTY COMMANDS**\n` +
            `• \`/bounty\` — Place a hit bounty on any player.\n` +
            `• \`/bounties\` — View all active bounties across the server.\n\n` +
            `**📊 LEVELING & REWARDS**\n` +
            `• \`/rank\` — View your current XP level and progress bar.\n` +
            `• \`/xpleaderboard\` — View top 10 highest-ranked players.`
          )
          .setColor(0x9900FF)
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'KryloSMP Command Desk • Level up by chatting!', iconURL: guild.iconURL() })
          .setTimestamp();

        await cmdCh.send({ embeds: [cmdEmbed] });
        console.log(`[+] Sent Bot Commands Guide Embed into #${cmdCh.name}`);
      }
    }

    console.log(`\n=======================================================`);
    console.log(`🏆 ALL KRYLO SERVERS ELEVATED TO GOD-TIER BEST!`);
    console.log(`=======================================================`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
