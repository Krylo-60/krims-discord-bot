import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * ════════════════════════════════════════════════════════════════════════════════════════════════════
 * 👑 EXPLICIT KRYLOSMP ULTRA-PROFESSIONAL SERVER TRANSFORMER (.MJS)
 * ════════════════════════════════════════════════════════════════════════════════════════════════════
 * Explicitly targets the KryloSMP server!
 * ════════════════════════════════════════════════════════════════════════════════════════════════════
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

client.once('ready', async () => {
  console.log('[+] KryloSMP Specific Pro Transformer Online as ' + client.user.tag);

  try {
    // Find EVERY guild that matches 'KryloSMP' explicitly
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => 
      g.name.toLowerCase().includes('krylosmp') || g.name.toLowerCase().includes('krylo smp')
    );

    if (targetGuilds.length === 0) {
      console.log('[-] No explicit KryloSMP guild found by exact name filter. Listing all guilds:');
      client.guilds.cache.forEach(g => console.log(`   • ${g.name} (${g.id})`));
      process.exit(1);
    }

    for (const guild of targetGuilds) {
      console.log(`\n👑 TRANSFORMING TARGET GUILD: ${guild.name} (${guild.id})...\n`);

      const proStructure = [
        {
          name: '╭━━━ 📌 INFORMATION ━━━╮',
          channels: [
            { name: '📌・rules', type: ChannelType.GuildText },
            { name: '📢・announcements', type: ChannelType.GuildText },
            { name: '📺・youtube-alerts', type: ChannelType.GuildText },
            { name: '🌐・official-links', type: ChannelType.GuildText },
            { name: '✅・verify-here', type: ChannelType.GuildText }
          ]
        },
        {
          name: '╭━━━ 💬 COMMUNITY ━━━╮',
          channels: [
            { name: '💬・general-chat', type: ChannelType.GuildText },
            { name: '🤖・bot-commands', type: ChannelType.GuildText },
            { name: '📷・media-clips', type: ChannelType.GuildText },
            { name: '💡・suggestions', type: ChannelType.GuildText },
            { name: '😂・memes', type: ChannelType.GuildText }
          ]
        },
        {
          name: '╭━━━ 🛒 ECONOMY & STORE ━━━╮',
          channels: [
            { name: '🛒・web-store', type: ChannelType.GuildText },
            { name: '💰・jackpot-vault', type: ChannelType.GuildText },
            { name: '🎯・bounty-board', type: ChannelType.GuildText },
            { name: '🤝・item-trading', type: ChannelType.GuildText }
          ]
        },
        {
          name: '╭━━━ 🏰 FACTIONS & CLANS ━━━╮',
          channels: [
            { name: '🏰・ksmp-clan-chat', type: ChannelType.GuildText },
            { name: '🏆・clan-rankings', type: ChannelType.GuildText }
          ]
        },
        {
          name: '╭━━━ ⚔️ PVP & TOURNAMENTS ━━━╮',
          channels: [
            { name: '⚔️・pvp-arena-chat', type: ChannelType.GuildText },
            { name: '🏆・monthly-tournament', type: ChannelType.GuildText }
          ]
        },
        {
          name: '╭━━━ 🎟️ SUPPORT & TICKETS ━━━╮',
          channels: [
            { name: '🎟️・open-ticket', type: ChannelType.GuildText }
          ]
        },
        {
          name: '╭━━━ 🔊 VOICE LOUNGES ━━━╮',
          channels: [
            { name: '🔊・General Lounge', type: ChannelType.GuildVoice },
            { name: '🔊・Gaming Squad 1', type: ChannelType.GuildVoice },
            { name: '🔊・Gaming Squad 2', type: ChannelType.GuildVoice },
            { name: '💤・AFK Zone', type: ChannelType.GuildVoice }
          ]
        }
      ];

      let pos = 1;
      for (const catConfig of proStructure) {
        let cat = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && (c.name.includes(catConfig.name.split(' ')[1]) || c.name === catConfig.name));
        if (!cat) {
          cat = await guild.channels.create({
            name: catConfig.name,
            type: ChannelType.GuildCategory,
            position: pos
          });
          console.log(`  📁 Created Pro Category on [${guild.name}]: ${cat.name}`);
        } else {
          await cat.edit({ name: catConfig.name, position: pos });
          console.log(`  🔄 Updated Pro Category on [${guild.name}]: ${cat.name}`);
        }
        pos++;

        for (const chCfg of catConfig.channels) {
          let ch = guild.channels.cache.find(c => c.name.includes(chCfg.name.replace(/[^a-z0-9]/g, '')) || c.name === chCfg.name);
          if (!ch) {
            ch = await guild.channels.create({
              name: chCfg.name,
              type: chCfg.type,
              parent: cat.id
            });
            console.log(`    ✅ Created Pro Channel: ${ch.name}`);
          } else {
            await ch.edit({ name: chCfg.name, parent: cat.id });
            await ch.lockPermissions().catch(() => {});
            console.log(`    🔒 Organized & Synced Pro Channel: ${ch.name}`);
          }
          await sleep(100);
        }
      }

      // Deploy Verification Gateway
      const verifyChannel = guild.channels.cache.find(c => c.name.includes('verify'));
      if (verifyChannel && verifyChannel.type === ChannelType.GuildText) {
        try {
          const verifyEmbed = new EmbedBuilder()
            .setColor(0x00F2FF)
            .setTitle('🛡️ KRYLOSMP OFFICIAL PLAYER VERIFICATION PORTAL')
            .setDescription(
              'Welcome to **KryloSMP Season 3**! To access player text channels, receive your in-game starter kit, and whitelist your Minecraft account, click the button below.\n\n' +
              '### 📋 **VERIFICATION BENEFITS:**\n' +
              '• **Automatic Whitelist**: Instant access to `KryloSmp.play.hosting`.\n' +
              '• **Free Rewards**: **+500 KryloCoins** ⛃ + **16x Diamonds** delivered to your inventory!\n' +
              '• **Verified Discord Rank**: Grants the `<@&Verified>` rank and opens community channels.'
            )
            .setFooter({ text: 'KryloSMP Automated Gateway System • Season 3' })
            .setTimestamp();

          const btnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('btn_open_verify_modal').setLabel('✅ Link Minecraft & Verify').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('check_status').setLabel('🔍 Account Status').setStyle(ButtonStyle.Primary)
          );

          await verifyChannel.send({ embeds: [verifyEmbed], components: [btnRow] });
          console.log(`  ✨ Deployed Verification Gateway Panel on [${guild.name}]`);
        } catch (e) {}
      }

      // Deploy Ticket Support Portal
      const ticketChannel = guild.channels.cache.find(c => c.name.includes('ticket'));
      if (ticketChannel && ticketChannel.type === ChannelType.GuildText) {
        try {
          const ticketEmbed = new EmbedBuilder()
            .setColor(0x9900FF)
            .setTitle('🎟️ KRYLOSMP OFFICIAL SUPPORT TICKET CENTER')
            .setDescription(
              'Need assistance from our Staff Team? Click below to open a private support ticket.\n\n' +
              '• **🐛 Bug Report** • **🛒 Web Store Support** • **🛡️ Player Report** • **💡 Feature Suggestion**'
            )
            .setFooter({ text: 'KryloSMP Staff Assistance Gateway • 24/7 Support' })
            .setTimestamp();

          const ticketBtnRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('create_ticket_general').setLabel('📩 Create Ticket').setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('create_ticket_store').setLabel('🛒 Web Store Help').setStyle(ButtonStyle.Success)
          );

          await ticketChannel.send({ embeds: [ticketEmbed], components: [ticketBtnRow] });
          console.log(`  ✨ Deployed Ticket Support Panel on [${guild.name}]`);
        } catch (e) {}
      }
    }

    console.log(`\n🏆 EXPLICIT KRYLOSMP TRANSFORM COMPLETED SUCCESSFULLY!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
