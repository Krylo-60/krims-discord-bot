import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
  StringSelectMenuBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType 
} from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const GUILDS = [
  '1524878881918685405', // KryloSMP
  '1420991845546332162', // Krylo's Discord server
  '1532574925356007525'  // Krylo Fan Army 👑
];

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag} - Deploying Ultimate Server Mastery Features...`);

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      console.log(`\n========================================`);
      console.log(`👑 Upgrading: ${guild.name} (${guild.id})`);
      console.log(`========================================`);

      const channels = await guild.channels.fetch();

      // 1. Deploy Ultimate Ticket Hub in support-tickets channel
      const ticketCh = channels.find(c => c && c.type === ChannelType.GuildText && (c.name.includes('support') || c.name.includes('ticket')));
      if (ticketCh) {
        // Clear old bot messages
        const msgs = await ticketCh.messages.fetch({ limit: 15 }).catch(() => null);
        if (msgs) {
          for (const [, m] of msgs) {
            if (m.author.id === client.user.id) await m.delete().catch(() => {});
          }
        }

        const ticketEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setAuthor({ name: '👑 KryloSMP Executive Support Protocol', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
          .setTitle('🎫 KRYLOSMP 24/7 SUPPORT & HELP CENTER')
          .setDescription(
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Need assistance from the **KryloSMP Administration Team**? Select the category matching your inquiry below to open a private encrypted ticket!\n\n` +
            `📌 **TICKET CATEGORIES:**\n` +
            `• 🛡️ **Player Report / Cheater Violation**: Submit video proof of hackers or rulebreakers.\n` +
            `• 💎 **Billing & Store Support**: Questions regarding ranks, vouchers, or payments.\n` +
            `• 🐛 **Bug / Exploit Bounty**: Report server glitches to claim massive KryloCoins!\n` +
            `• 🤝 **Creator & Partner Inquiries**: Apply for Media / Content Creator rank.\n` +
            `• ❓ **General Assistance**: Account issues, gameplay questions, and rank recovery.\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `⚡ *Our executive staff team responds in under 5 minutes!*`
          )
          .setImage('https://krylosmp.web.app/banner.jpg')
          .setFooter({ text: 'KryloSMP Official • 24/7 Support Desk' })
          .setTimestamp();

        const ticketSelect = new StringSelectMenuBuilder()
          .setCustomId('select_open_ticket')
          .setPlaceholder('📂 Click here to select your ticket category...')
          .addOptions([
            {
              label: 'Report a Player / Cheater',
              description: 'Report hackers, X-Rayers, or toxicity with evidence',
              value: 'ticket_report',
              emoji: '🛡️'
            },
            {
              label: 'Store & Billing Assistance',
              description: 'Help with Tebex store orders, ranks, and vouchers',
              value: 'ticket_store',
              emoji: '💎'
            },
            {
              label: 'Bug Report / Exploit Bounty',
              description: 'Report bugs and claim KryloCoins rewards',
              value: 'ticket_bug',
              emoji: '🐛'
            },
            {
              label: 'Creator & Partner Application',
              description: 'YouTube / TikTok partnerships and media rank',
              value: 'ticket_media',
              emoji: '🤝'
            },
            {
              label: 'General In-Game Support',
              description: 'Questions, lost items, and account verification',
              value: 'ticket_general',
              emoji: '❓'
            }
          ]);

        const ticketRow = new ActionRowBuilder().addComponents(ticketSelect);

        await ticketCh.send({ embeds: [ticketEmbed], components: [ticketRow] }).catch(() => {});
        console.log(`   [✅] Deployed Ultimate Support Hub in #${ticketCh.name}`);
      }

      // 2. Deploy Live Top Clans Leaderboard in clan-leaderboard channel
      const clanBoardCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('clan-leaderboard'));
      if (clanBoardCh) {
        const msgs = await clanBoardCh.messages.fetch({ limit: 10 }).catch(() => null);
        if (msgs) {
          for (const [, m] of msgs) {
            if (m.author.id === client.user.id) await m.delete().catch(() => {});
          }
        }

        const clanEmbed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setAuthor({ name: '👑 KryloSMP Factions & Clan Rankings', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
          .setTitle('🏆 OFFICIAL CLAN LEADERBOARD')
          .setDescription(
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Rankings of the most powerful clans on **KryloSMP** by vault balance and territory control!\n\n` +
            `🥇 **#1 [KRYLO] Krylo Army**\n` +
            `• 👑 **Leader:** Krylo\n` +
            `• 👥 **Warriors:** 2 Active Members\n` +
            `• 💰 **Clan Vault:** **1,000,000,000 KC (Max Vault)**\n` +
            `• 🛡️ **Status:** Undefeated Realm Rulers\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `🏰 **HOW TO CREATE YOUR CLAN:**\n` +
            `• Use \`/clan action:create name:[Name] tag:[TAG]\` in #🤖┃bot-commands\n` +
            `• Deposit KryloCoins into your vault with \`/clan action:deposit amount:[Amount]\`\n` +
            `• Top clans win exclusive custom armor & monthly rewards!`
          )
          .setImage('https://krylosmp.web.app/banner.jpg')
          .setFooter({ text: 'KryloSMP Clan Leaderboard • Updated Live' })
          .setTimestamp();

        const clanBtn = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('🌐 View Web Clan Leaderboard')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp.web.app/'),
          new ButtonBuilder()
            .setCustomId('btn_refresh_clan_stats')
            .setLabel('🔄 Refresh Clan Standings')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔄')
        );

        await clanBoardCh.send({ embeds: [clanEmbed], components: [clanBtn] }).catch(() => {});
        console.log(`   [✅] Deployed Live Clan Leaderboard in #${clanBoardCh.name}`);
      }

    } catch (err) {
      console.warn(`Error upgrading guild ${guildId}:`, err.message);
    }
  }

  console.log('\n🎉 ALL ULTIMATE SERVER MASTERY FEATURES DEPLOYED!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
