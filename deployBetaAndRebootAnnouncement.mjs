import { 
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, ChannelType 
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILD_IDS = ['1524878881918685405', '1420991845546332162', '1532574925356007525'];

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag} — Deploying Season 1 Reset & Beta Program...`);

  for (const guildId of GUILD_IDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;
      console.log(`\n========================================\n👑 Processing Guild: ${guild.name} (${guild.id})\n========================================`);

      // 1. Ensure '🧪 Beta Tester' role exists
      let betaRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('beta tester') || r.name.toLowerCase().includes('founder'));
      if (!betaRole) {
        betaRole = await guild.roles.create({
          name: '🧪 Beta Tester',
          color: 0x00FFCC,
          hoist: true,
          mentionable: true,
          reason: 'Official KryloSMP Beta Tester / Founder Role'
        }).catch(err => {
          console.error('Role create error:', err.message);
          return null;
        });
        if (betaRole) console.log(`   [+] Created Role: 🧪 Beta Tester`);
      } else {
        console.log(`   [✓] Role already exists: ${betaRole.name}`);
      }

      const channels = await guild.channels.fetch();

      // 2. Post Announcement in #server-announcements
      const annCh = channels.find(c => c && c.type === ChannelType.GuildText && (c.name.includes('announcement') || c.name.includes('news')));
      if (annCh) {
        const annEmbed = new EmbedBuilder()
          .setColor(0xFF4757)
          .setAuthor({ name: '👑 KryloSMP Official Administration', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
          .setTitle('📢 IMPORTANT NOTICE: SEASON 1 FRESH REBOOT & BETA PROGRAM')
          .setDescription(
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Dear **KryloSMP Community**,\n\n` +
            `Due to recent technical backend issues, the previous temporary state of the server has been **reset and cleared** to ensure long-term stability, performance, and security.\n\n` +
            `We are turning this into an opportunity to build the **ultimate, polished version of KryloSMP** from the ground up! 🚀\n\n` +
            `🏰 **WHAT'S HAPPENING NEXT?**\n` +
            `• **Complete Infrastructure Upgrade:** Optimized paper engine, zero-lag chunk loading, and fresh balanced custom economy.\n` +
            `• **Development & Whitelist Phase:** The server is currently in private development mode while we construct new spawns, minigames, and custom Skripts.\n` +
            `• **Target Public Release:** The grand public opening will launch once we assemble our **5+ Founding Beta Players**!\n\n` +
            `🧪 **WANT EARLY ACCESS? JOIN THE BETA TEAM:**\n` +
            `We are accepting applications for our **Core Beta Roster**! Click the button below to join:\n` +
            `✨ **Beta Perks:** Early whitelist access, exclusive **[Founder]** in-game tag, and **10,000 KC Starter Bonus** at grand launch!\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━`
          )
          .setImage('https://krylosmp.web.app/banner.jpg')
          .setFooter({ text: 'KryloSMP Development Team • Building the Best SMP' })
          .setTimestamp();

        const annRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_join_beta_roster')
            .setLabel('🧪 Join Beta Tester Roster')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🧪'),
          new ButtonBuilder()
            .setLabel('🌐 View Player Portal')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp.web.app/')
        );

        await annCh.send({ embeds: [annEmbed], components: [annRow] });
        console.log(`   [✅] Posted Season 1 Reboot Announcement in #${annCh.name}`);
      }

      // 3. Post Beta Whitelist Hub in #server-info
      const infoCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('server-info'));
      if (infoCh) {
        const betaEmbed = new EmbedBuilder()
          .setColor(0x00FFCC)
          .setAuthor({ name: '🧪 KryloSMP Beta Program', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
          .setTitle('🧪 BECOME AN OFFICIAL KRYLOSMP BETA TESTER')
          .setDescription(
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Help shape the future of **KryloSMP Season 1**!\n\n` +
            `We are looking for at least **5 dedicated founding players** to test early builds, report bugs, test combat balance, and explore new custom features.\n\n` +
            `🎁 **EXCLUSIVE FOUNDING REWARDS:**\n` +
            `• 🧪 **🧪 Beta Tester** Discord role & private test channel access\n` +
            `• 📜 **Early Whitelist Access** to the server during development\n` +
            `• 👑 **Permanent [Founder]** cosmetic title on public release day\n` +
            `• 💰 **10,000 KryloCoins Bonus** deposited straight to your wallet\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `👇 *Click below to claim your Beta Tester spot!*`
          )
          .setFooter({ text: 'KryloSMP Founder Initiative • Limited Beta Slots Available' })
          .setTimestamp();

        const betaRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_join_beta_roster')
            .setLabel('🧪 Claim Beta Tester Access')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🧪')
        );

        await infoCh.send({ embeds: [betaEmbed], components: [betaRow] });
        console.log(`   [✅] Deployed Beta Hub in #${infoCh.name}`);
      }

    } catch (err) {
      console.error(`Error processing guild ${guildId}:`, err);
    }
  }

  console.log('\n🎉 ALL ANNOUNCEMENTS & BETA HUBS DEPLOYED!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
