import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 BOT COMMANDS CATEGORY & EMBED DEPLOYER (.MJS)
 * Moves #🤖┃bot-commands into dedicated ╭━━━ 🤖 BOT & UTILITIES ━━━╮ category and posts command directory embed!
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log('[+] Bot Commands Category Deployer Online as ' + client.user.tag + '\n');

  try {
    for (const [, guild] of client.guilds.cache) {
      if (!guild.name.toLowerCase().includes('krylo')) continue;

      console.log(`=======================================================`);
      console.log(`🤖 DEPLOYING DEDICATED BOT CATEGORY IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const channels = await guild.channels.fetch();
      const allChannels = [...channels.values()].filter(c => c !== null);

      // Find or create '╭━━━ 🤖 BOT & UTILITIES ━━━╮' category
      let botCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('BOT & UTILITIES'));
      if (!botCat) {
        botCat = await guild.channels.create({
          name: '╭━━━ 🤖 BOT & UTILITIES ━━━╮',
          type: ChannelType.GuildCategory
        });
        console.log(`  [+] Created Category: "╭━━━ 🤖 BOT & UTILITIES ━━━╮"`);
      }

      // Find #🤖┃bot-commands channel
      const botCh = allChannels.find(c => c && c.isTextBased() && c.name.includes('bot-commands'));

      if (botCh) {
        // Move channel into the dedicated category
        await botCh.setParent(botCat.id, { lockPermissions: false });
        console.log(`  [➔ MOVED] #${botCh.name} -> Placed into "╭━━━ 🤖 BOT & UTILITIES ━━━╮"`);

        // Purge old messages & post clean command guide
        const msgs = await botCh.messages.fetch({ limit: 50 }).catch(() => null);
        if (msgs && msgs.size > 0) {
          await botCh.bulkDelete(msgs).catch(async () => {
            for (const [, m] of msgs) {
              await m.delete().catch(() => {});
            }
          });
        }

        const commandEmbed = new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Executive Network • Bot Center', iconURL: guild.iconURL() })
          .setTitle('🤖 KRYLOSMP OFFICIAL BOT COMMANDS DIRECTORY')
          .setDescription(
            `Welcome to the **Bot Commands & Utilities Center**! Execute all network commands and interaction protocols here to keep public chat channels clean.\n\n` +
            `⚡ **MINECRAFT SERVER CONTROL**\n` +
            `• \`/startserver\` — Send instant power-on signal to \`KryloSmp.play.hosting\`.\n` +
            `• \`/status\` — View live server status, online players, and ping.\n\n` +
            `💰 **ECONOMY & PLAYER PORTAL**\n` +
            `• \`/balance\` — Check your wallet and bank KC balance.\n` +
            `• \`/daily\` — Claim your free daily 1,000 KryloCoins bonus.\n` +
            `• \`/bday\` — Claim special birthday KryloCoins reward.\n` +
            `• \`/pay @user amount\` — Send KryloCoins securely to another player.\n\n` +
            `🏰 **CLANS & FACTIONS PROTOCOLS**\n` +
            `• \`/clan action:create name:Tag\` — Create private Clan, role, and text chat.\n` +
            `• \`/clan action:invite target:@user\` — Invite member & grant role/channel access.\n` +
            `• \`/clan action:deposit value:10000\` — Deposit KryloCoins into Clan Vault.\n` +
            `• \`/clan action:info\` / \`/clan action:leaderboard\` — View clan rankings.\n\n` +
            `⚔️ **PVP & TOURNAMENTS**\n` +
            `• \`/pvp\` — Queue for duels, view ELO ratings & Monthly Leaderboards.\n\n` +
            `📌 *Please run all bot commands exclusively inside this channel!*`
          )
          .setColor(0x00E5FF) // Cyan
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'KryloSMP Executive Network • Dedicated Bot Zone', iconURL: guild.iconURL() })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_startserver_quick')
            .setLabel('🎮 Start Server')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setLabel('🌐 Player Portal')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp.web.app'),
          new ButtonBuilder()
            .setLabel('🛒 Web Store')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp.tebex.io'),
          new ButtonBuilder()
            .setCustomId('btn_ticket_open')
            .setLabel('🎫 Support')
            .setStyle(ButtonStyle.Secondary)
        );

        await botCh.send({ embeds: [commandEmbed], components: [row] });
        console.log(`  [+] Posted Official Bot Commands Directory in #${botCh.name}!`);
      }

      console.log(`\n🏆 DEDICATED BOT CATEGORY DEPLOYED IN [${guild.name}]!\n\n`);
    }

    console.log('🏆 ALL SERVERS UPDATED: DEDICATED BOT CATEGORY DEPLOYED!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
