import { 
  Client, 
  GatewayIntentBits, 
  EmbedBuilder, 
  ActionRowBuilder, 
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

const COLOR_ROLES = [
  { name: '🔴 Crimson Red', color: 0xFF2A2A, customId: 'color_crimson' },
  { name: '🔵 Cyber Cyan', color: 0x00F2FF, customId: 'color_cyan' },
  { name: '🟡 Imperial Gold', color: 0xFFD700, customId: 'color_gold' },
  { name: '🟣 Neon Violet', color: 0xA855F7, customId: 'color_violet' },
  { name: '🟢 Emerald Green', color: 0x22C55E, customId: 'color_green' },
  { name: '🌸 Sakura Pink', color: 0xEC4899, customId: 'color_pink' }
];

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag} - Deploying World-Class Legendary Features...`);

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      console.log(`\n========================================`);
      console.log(`👑 Upgrading to Best-of-the-Best: ${guild.name} (${guild.id})`);
      console.log(`========================================`);

      // 1. Ensure Color Roles Exist in the Guild
      const existingRoles = await guild.roles.fetch();
      for (const cr of COLOR_ROLES) {
        let role = existingRoles.find(r => r.name === cr.name);
        if (!role) {
          try {
            role = await guild.roles.create({
              name: cr.name,
              color: cr.color,
              hoist: false,
              reason: 'KryloSMP Color Roles System'
            });
            console.log(`   [+] Created Role: ${cr.name}`);
          } catch (e) {
            console.warn(`   [!] Could not create role ${cr.name}:`, e.message);
          }
        }
      }

      const channels = await guild.channels.fetch();

      // 2. Deploy Interactive KryloSMP Store in #store
      const storeCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('store'));
      if (storeCh) {
        const msgs = await storeCh.messages.fetch({ limit: 10 }).catch(() => null);
        if (msgs) {
          for (const [, m] of msgs) {
            if (m.author.id === client.user.id) await m.delete().catch(() => {});
          }
        }

        const storeEmbed = new EmbedBuilder()
          .setColor(0xFFD700)
          .setAuthor({ name: '👑 KryloSMP Official In-Game & Discord Shop', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
          .setTitle('🛒 KRYLOSMP EXECUTIVE SHOP & PERKS')
          .setDescription(
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Spend your **KryloCoins (KC)** earned from chatting, minigames, and Minecraft achievements!\n\n` +
            `💎 **EXCLUSIVE DISCORD & MINECRAFT PERKS:**\n\n` +
            `⭐ **💎 VIP Sovereign Rank** • \`50,000 KC\`\n` +
            `*Unlocks VIP chat, 1.5x coin boost, custom nickname colors, and VIP Discord role!*\n\n` +
            `📦 **⚔️ 64x Netherite Ingot Kit** • \`25,000 KC\`\n` +
            `*Delivered directly to your Minecraft inventory upon verification!*\n\n` +
            `🎰 **🎁 10x Mystery Gacha Crates** • \`10,000 KC\`\n` +
            `*Spin for God Armor, Mythic swords, rare tags, and massive coin jackpots!*\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `💡 *Click any button below to instantly purchase with your balance!*`
          )
          .setImage('https://krylosmp.web.app/banner.jpg')
          .setFooter({ text: 'KryloSMP Shop • Instant 1-Click Purchase' })
          .setTimestamp();

        const storeRow1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('shop_buy_vip')
            .setLabel('💎 Buy VIP Rank (50,000 KC)')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('💎'),
          new ButtonBuilder()
            .setCustomId('shop_buy_netherite')
            .setLabel('⚔️ Buy 64x Netherite (25,000 KC)')
            .setStyle(ButtonStyle.Success)
            .setEmoji('⚔️'),
          new ButtonBuilder()
            .setCustomId('shop_buy_gacha')
            .setLabel('🎁 10x Mystery Crates (10,000 KC)')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🎁')
        );

        const storeRow2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('🌐 Open Official Web Store')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp.web.app/'),
          new ButtonBuilder()
            .setCustomId('shop_check_balance')
            .setLabel('💰 Check My Balance')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('💰')
        );

        await storeCh.send({ embeds: [storeEmbed], components: [storeRow1, storeRow2] }).catch(() => {});
        console.log(`   [✅] Deployed Executive Shop in #${storeCh.name}`);
      }

      // 3. Deploy Interactive Arcade & Minigames Hub in #bot-commands
      const botCmdCh = channels.find(c => c && c.type === ChannelType.GuildText && c.name.includes('bot-command'));
      if (botCmdCh) {
        const msgs = await botCmdCh.messages.fetch({ limit: 10 }).catch(() => null);
        if (msgs) {
          for (const [, m] of msgs) {
            if (m.author.id === client.user.id) await m.delete().catch(() => {});
          }
        }

        const arcadeEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setAuthor({ name: '👑 KryloSMP 24/7 Arcade & Casino Hub', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
          .setTitle('🎰 KRYLOSMP CASINO & MINIGAME ARENA')
          .setDescription(
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Play games, test your luck, and earn massive **KryloCoins** to climb the rich list!\n\n` +
            `🎮 **QUICK-PLAY BUTTONS:**\n` +
            `• 🎰 **Slots Machine**: Bet 500 KC for a chance at **x10 Jackpot (5,000 KC)**!\n` +
            `• 🪙 **Coinflip Duel**: 50/50 double-or-nothing coin toss!\n` +
            `• 💼 **Hourly Work**: Earn **+2,500 KC** every hour instantly!\n` +
            `• 💰 **Account Balance**: View your KryloCoins, Rank, and Level.\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `⚡ *Click a button below for instant zero-lag gameplay!*`
          )
          .setImage('https://krylosmp.web.app/banner.jpg')
          .setFooter({ text: 'KryloSMP Arcade • Powered by Krims AI' })
          .setTimestamp();

        const arcadeRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('btn_play_slots')
            .setLabel('🎰 Spin Slots (500 KC)')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎰'),
          new ButtonBuilder()
            .setCustomId('btn_play_coinflip')
            .setLabel('🪙 Flip Coin (500 KC)')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🪙'),
          new ButtonBuilder()
            .setCustomId('btn_hourly_work')
            .setLabel('💼 Hourly Work (+2,500 KC)')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('💼'),
          new ButtonBuilder()
            .setCustomId('shop_check_balance')
            .setLabel('💰 My Balance')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('💰')
        );

        await botCmdCh.send({ embeds: [arcadeEmbed], components: [arcadeRow] }).catch(() => {});
        console.log(`   [✅] Deployed Arcade Hub in #${botCmdCh.name}`);
      }

      // 4. Deploy Color Roles Hub in #server-info or #welcome
      const infoCh = channels.find(c => c && c.type === ChannelType.GuildText && (c.name.includes('server-info') || c.name.includes('socials')));
      if (infoCh) {
        const colorEmbed = new EmbedBuilder()
          .setColor(0xEC4899)
          .setAuthor({ name: '👑 KryloSMP Cosmetic Customization', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
          .setTitle('🎨 CHOOSE YOUR NAME COLOR ROLE')
          .setDescription(
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Personalize your appearance in the chat with a custom name color role! Click any button below to toggle your color.\n\n` +
            `🔴 **Crimson Red** • 🔵 **Cyber Cyan** • 🟡 **Imperial Gold**\n` +
            `🟣 **Neon Violet** • 🟢 **Emerald Green** • 🌸 **Sakura Pink**\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━`
          )
          .setFooter({ text: 'KryloSMP Cosmetic Color Engine' })
          .setTimestamp();

        const colorRow1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('color_crimson').setLabel('🔴 Crimson').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('color_cyan').setLabel('🔵 Cyan').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('color_gold').setLabel('🟡 Gold').setStyle(ButtonStyle.Secondary)
        );

        const colorRow2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId('color_violet').setLabel('🟣 Violet').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('color_green').setLabel('🟢 Green').setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId('color_pink').setLabel('🌸 Pink').setStyle(ButtonStyle.Secondary)
        );

        await infoCh.send({ embeds: [colorEmbed], components: [colorRow1, colorRow2] }).catch(() => {});
        console.log(`   [✅] Deployed Color Roles Hub in #${infoCh.name}`);
      }

    } catch (err) {
      console.warn(`Error upgrading guild ${guildId}:`, err.message);
    }
  }

  console.log('\n🎉 ALL WORLD-CLASS FEATURES DEPLOYED!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
