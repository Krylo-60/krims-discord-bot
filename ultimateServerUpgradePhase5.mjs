import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

client.once('ready', async () => {
  console.log(`[+] Phase 5 FINAL Upgrader Online as ${client.user.tag}\n`);

  for (const [, guild] of client.guilds.cache) {
    if (!guild.name.toLowerCase().includes('krylo')) continue;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 PHASE 5 FINAL UPGRADE: ${guild.name} (${guild.id})`);
    console.log(`${'='.repeat(60)}\n`);

    const channels = await guild.channels.fetch();
    const allChannels = [...channels.values()].filter(c => c !== null);
    const communityCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('COMMUNITY'));
    const infoCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('INFORMATION'));
    const botCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('BOT'));

    // ═══════════════════════════════════════════
    // 1. INTRODUCTION / SELF-INTRO CHANNEL
    // ═══════════════════════════════════════════
    console.log('── 1: Introductions Channel ──');
    let introCh = allChannels.find(c => c.isTextBased() && (c.name.includes('intro') || c.name.includes('self-intro')));
    if (!introCh && communityCat) {
      try {
        introCh = await guild.channels.create({
          name: '👤┃introductions',
          type: ChannelType.GuildText,
          parent: communityCat.id,
          topic: '👤 Introduce yourself to the KryloSMP community! Tell us your name, age, platform, and what you like to build!'
        });
        console.log(`  [+] Created #👤┃introductions`);
      } catch (e) { console.log(`  [-] ${e.message}`); }
    }
    if (introCh) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Community', iconURL: guild.iconURL() })
        .setTitle('👤 INTRODUCE YOURSELF!')
        .setDescription(
          '**Tell the community about yourself!**\n\n' +
          '📝 **Template:**\n' +
          '```\n' +
          '🎮 IGN (In-Game Name): \n' +
          '☕/🪨 Platform: Java / Bedrock\n' +
          '🏗️ Playstyle: Builder / Redstoner / PvPer / Explorer\n' +
          '🎂 Age: \n' +
          '🌍 Country/Timezone: \n' +
          '💬 Fun Fact About Me: \n' +
          '```\n\n' +
          '*Welcome to the KryloSMP family! 🎉*'
        )
        .setColor(0x3498DB).setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Executive Network', iconURL: guild.iconURL() }).setTimestamp();
      await introCh.send({ embeds: [embed] });
      console.log(`  [+] Posted Introductions template embed`);
    }

    // ═══════════════════════════════════════════
    // 2. ART & BUILDS CHANNEL
    // ═══════════════════════════════════════════
    console.log('\n── 2: Art & Builds Channel ──');
    let artCh = allChannels.find(c => c.isTextBased() && (c.name.includes('art') || c.name.includes('builds')));
    if (!artCh && communityCat) {
      try {
        artCh = await guild.channels.create({
          name: '🎨┃art-and-builds',
          type: ChannelType.GuildText,
          parent: communityCat.id,
          topic: '🎨 Share your Minecraft builds, pixel art, fan art, and creative projects!'
        });
        console.log(`  [+] Created #🎨┃art-and-builds`);
      } catch (e) { console.log(`  [-] ${e.message}`); }
    }
    if (artCh) {
      const embed = new EmbedBuilder()
        .setTitle('🎨 ART & BUILDS GALLERY')
        .setDescription(
          '**Show off your creativity!**\n\n' +
          '🏗️ Share your best Minecraft builds\n' +
          '🎨 Post fan art, pixel art, and designs\n' +
          '📸 Include screenshots with shaders for bonus points!\n' +
          '⭐ The best builds get featured and earn bonus KC!\n\n' +
          '*Use ⭐ reactions to vote on the best submissions!*'
        )
        .setColor(0xE91E63).setTimestamp();
      await artCh.send({ embeds: [embed] });
      console.log(`  [+] Posted Art & Builds Gallery embed`);
    }

    // ═══════════════════════════════════════════
    // 3. BOT COMMANDS QUICK REFERENCE
    // ═══════════════════════════════════════════
    console.log('\n── 3: Complete Command Reference ──');
    const botCh = allChannels.find(c => c.isTextBased() && c.name.includes('bot-commands'));
    if (botCh) {
      const embed1 = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Bot Command Bible', iconURL: guild.iconURL() })
        .setTitle('📖 COMPLETE COMMAND REFERENCE — PAGE 1')
        .setDescription('**Every command at your fingertips!**')
        .addFields(
          { name: '💰 Economy', value: '`/daily` `/work` `/balance` `/pay` `/shop`\n`/fish` `/mine` `/craft` `/enchant`\n`/slots` `/coinflip` `/jackpot` `/spin`\n`/lootbox` `/chest` `/lottery`', inline: true },
          { name: '⚔️ Combat & PvP', value: '`/pvp` `/challenge` `/duel` `/endduel`\n`/tournament` `/bounty` `/rob` `/heist`\n`/raid`', inline: true },
          { name: '🏰 Clans', value: '`/clan action:create`\n`/clan action:invite`\n`/clan action:deposit`\n`/clan action:info`\n`/clan action:leaderboard`\n`/clan action:disband`', inline: true },
          { name: '🐾 Pets & RPG', value: '`/pet` `/inventory` `/profile`\n`/achievements` `/quests`', inline: true },
          { name: '🤝 Social', value: '`/trade` `/refer` `/bump` `/vote`\n`/bday` `/suggest` `/poll`', inline: true },
          { name: '🎉 Fun', value: '`/joke` `/meme` `/roll` `/eightball`\n`/avatar` `/giveaway`', inline: true }
        )
        .setColor(0x00E5FF).setTimestamp();

      const embed2 = new EmbedBuilder()
        .setTitle('📖 COMPLETE COMMAND REFERENCE — PAGE 2')
        .addFields(
          { name: '🛡️ Moderation', value: '`/purge` `/warn` `/mcban` `/announce`\n`/ticket` `/close`', inline: true },
          { name: '📊 Stats & Info', value: '`/rank` `/xpleaderboard` `/leaderboard`\n`/serverinfo` `/userinfo` `/status` `/ip`', inline: true },
          { name: '🔧 Utility', value: '`/gameboost` `/adminabuse` `/genkey`\n`/ask` `/diagnose` `/github` `/verify`', inline: true }
        )
        .setColor(0x5865F2)
        .setFooter({ text: 'KryloSMP Executive Network • 65 Commands', iconURL: guild.iconURL() }).setTimestamp();

      await botCh.send({ embeds: [embed1, embed2] });
      console.log(`  [+] Posted Complete Command Reference (2 embeds)`);
    }

    // ═══════════════════════════════════════════
    // 4. DAILY TIPS & TRICKS CHANNEL
    // ═══════════════════════════════════════════
    console.log('\n── 4: Tips & Tricks Channel ──');
    let tipsCh = allChannels.find(c => c.isTextBased() && c.name.includes('tips'));
    if (!tipsCh && communityCat) {
      try {
        tipsCh = await guild.channels.create({
          name: '💡┃tips-and-tricks',
          type: ChannelType.GuildText,
          parent: communityCat.id,
          topic: '💡 Share Minecraft tips, tricks, redstone tutorials, farm designs, and pro strategies!'
        });
        console.log(`  [+] Created #💡┃tips-and-tricks`);
      } catch (e) { console.log(`  [-] ${e.message}`); }
    }
    if (tipsCh) {
      const embed = new EmbedBuilder()
        .setTitle('💡 KRYLOSMP TIPS & TRICKS')
        .setDescription(
          '**Pro tips to help you dominate KryloSMP!**\n\n' +
          '💰 **Economy Tips:**\n' +
          '• Use `/daily` every day for free 1,000 KC\n' +
          '• Stack `/fish` + `/mine` for passive income\n' +
          '• Craft items with `/craft` to sell for more KC\n' +
          '• Join the `/jackpot` when the pool is high!\n\n' +
          '⚔️ **PvP Tips:**\n' +
          '• Use enchanted gear from `/shop` before duels\n' +
          '• Check opponent ELO with `/profile` before challenging\n' +
          '• Monthly tournaments have the biggest prizes!\n\n' +
          '🏰 **Clan Tips:**\n' +
          '• Deposit KC daily to grow your clan vault\n' +
          '• Recruit active members for heist defense\n' +
          '• Top clans on `/clan action:leaderboard` get featured!'
        )
        .setColor(0xFFD700).setTimestamp();
      await tipsCh.send({ embeds: [embed] });
      console.log(`  [+] Posted Tips & Tricks embed`);
    }

    // ═══════════════════════════════════════════
    // 5. FINAL MASTER EMBED IN RULES
    // ═══════════════════════════════════════════
    console.log('\n── 5: Season 1 Re-Release Banner in Announcements ──');
    const annCh = allChannels.find(c => c.isTextBased() && c.name.includes('server-announcements'));
    if (annCh) {
      const embed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Executive Network', iconURL: guild.iconURL() })
        .setTitle('🎉🔥 KRYLOSMP SEASON 1 RE-RELEASE IS LIVE! 🔥🎉')
        .setDescription(
          `**The wait is over. KryloSMP is BACK and better than ever!**\n\n` +
          `We've rebuilt everything from the ground up:\n\n` +
          `⚔️ **65+ Bot Commands** — Economy, PvP, Clans, Pets, RPG\n` +
          `💰 **KryloCoin Economy v2.0** — Daily, Work, Fish, Mine, Craft, Gamble\n` +
          `🏰 **Clan System** — Private channels, vaults, leaderboards\n` +
          `🎮 **PvP & Tournaments** — ELO rankings, monthly brackets\n` +
          `🌐 **Player Portal** — Web dashboard for your account\n` +
          `🛒 **KC Store** — Buy items with KryloCoins\n` +
          `🛡️ **AutoMod Protection** — Anti-spam, profanity filter\n` +
          `✅ **Unique Code Verification** — Secure 6-digit system\n\n` +
          `**🌐 Connect Now:**\n` +
          `\`\`\`\nServer IP: KryloSmp.play.hosting\nJava Port: 25565\nBedrock Port: 19132\nVersion: 1.21.x\n\`\`\``
        )
        .setColor(0x00FF88)
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Season 1 Re-Release • August 2026', iconURL: guild.iconURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setLabel('🌐 Player Portal').setStyle(ButtonStyle.Link).setURL('https://krylosmp.web.app/'),
        new ButtonBuilder().setLabel('🛒 KC Store').setStyle(ButtonStyle.Link).setURL('https://krylosmp-store.web.app/'),
        new ButtonBuilder().setCustomId('btn_check_status').setLabel('📡 Server Status').setStyle(ButtonStyle.Primary)
      );

      await annCh.send({ embeds: [embed], components: [row] });
      console.log(`  [+] Posted Season 1 Re-Release announcement!`);
    }

    console.log(`\n🏆 PHASE 5 FINAL UPGRADE COMPLETE FOR [${guild.name}]!\n`);
  }

  console.log('\n🏆🏆🏆🏆🏆 ALL 5 PHASES COMPLETE — SERVERS AT MAXIMUM PREMIUM! 🏆🏆🏆🏆🏆');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
