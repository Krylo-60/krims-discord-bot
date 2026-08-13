import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });

client.once('ready', async () => {
  console.log(`[+] Phase 2 Upgrader Online as ${client.user.tag}\n`);

  for (const [, guild] of client.guilds.cache) {
    if (!guild.name.toLowerCase().includes('krylo')) continue;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 PHASE 2 UPGRADE: ${guild.name} (${guild.id})`);
    console.log(`${'='.repeat(60)}\n`);

    const channels = await guild.channels.fetch();
    const allChannels = [...channels.values()].filter(c => c !== null);

    // ═══════════════════════════════════════════
    // 1. SELF-ROLE SELECTION EMBED
    // ═══════════════════════════════════════════
    console.log('── 1: Self-Role Selection Panel ──');
    let roleCh = allChannels.find(c => c.isTextBased() && (c.name.includes('verify') || c.name.includes('roles')));
    if (!roleCh) roleCh = allChannels.find(c => c.isTextBased() && c.name.includes('welcome'));

    if (roleCh) {
      const roleEmbed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Role Selection', iconURL: guild.iconURL() })
        .setTitle('🎭 CHOOSE YOUR ROLES')
        .setDescription(
          `Select your platform and notification preferences below!\n\n` +
          `**☕ Java Player** — You play on Java Edition\n` +
          `**🪨 Bedrock Player** — You play on Bedrock Edition\n` +
          `**📢 Announcements** — Get pinged for server news & updates\n` +
          `**🎁 Giveaways** — Get pinged for giveaway events\n\n` +
          `*Click a button to toggle the role on/off!*`
        )
        .setColor(0x5865F2)
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Executive Network • Role Selection', iconURL: guild.iconURL() })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('role_java').setLabel('☕ Java').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('role_bedrock').setLabel('🪨 Bedrock').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('role_announcements').setLabel('📢 News').setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId('role_giveaways').setLabel('🎁 Giveaways').setStyle(ButtonStyle.Success)
      );

      await roleCh.send({ embeds: [roleEmbed], components: [row] });
      console.log(`  [+] Posted Role Selection Panel in #${roleCh.name}`);
    }

    // ═══════════════════════════════════════════
    // 2. FAQ & HOW-TO-PLAY CHANNEL
    // ═══════════════════════════════════════════
    console.log('\n── 2: FAQ & How-To-Play Channel ──');
    const infoCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('INFORMATION'));
    let faqCh = allChannels.find(c => c.isTextBased() && c.name.includes('faq'));

    if (!faqCh && infoCat) {
      try {
        faqCh = await guild.channels.create({
          name: '❓┃faq-how-to-play',
          type: ChannelType.GuildText,
          parent: infoCat.id,
          topic: '❓ Frequently Asked Questions and how to get started on KryloSMP!'
        });
        console.log(`  [+] Created #❓┃faq-how-to-play`);
      } catch (e) {
        console.log(`  [-] Could not create FAQ channel: ${e.message}`);
      }
    }

    if (faqCh) {
      try {
        const msgs = await faqCh.messages.fetch({ limit: 50 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        if (botMsgs.size > 0) await faqCh.bulkDelete(botMsgs).catch(() => {});
      } catch (e) {}

      const faqEmbed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Help Center', iconURL: guild.iconURL() })
        .setTitle('❓ FREQUENTLY ASKED QUESTIONS')
        .setDescription('Everything you need to know about KryloSMP!')
        .addFields(
          { name: '🌐 How do I join the server?', value: 'Add `KryloSmp.play.hosting` in Minecraft Multiplayer. Java: port `25565`, Bedrock: port `19132`.', inline: false },
          { name: '✅ How do I verify?', value: 'Click `✅ Verify Account` in the verify channel. You\'ll get a unique 6-digit code to enter on the Player Portal or in-game with `/verify <code>`.', inline: false },
          { name: '💰 How do I earn KryloCoins?', value: 'Use `/daily` (1,000 KC), `/work` (random KC), `/fish`, `/mine`, `/craft`, or win `/jackpot`, `/slots`, `/lootbox`!', inline: false },
          { name: '🏰 How do I create a Clan?', value: 'Use `/clan action:create name:MyClan tag:TAG`. Costs 5,000 KC. You get a private role + text channel!', inline: false },
          { name: '⚔️ How does PvP work?', value: 'Use `/pvp` to queue for duels, `/challenge @player` for direct challenges. Win to earn ELO and climb the leaderboard!', inline: false },
          { name: '🤝 How do I trade items?', value: 'Use `/trade player:@user offer:description` in #🤝┃item-trading. The target can Accept or Decline.', inline: false },
          { name: '🎫 I need help!', value: 'Open a ticket in #🎫┃support-tickets. Our AI support bot provides 24/7 assistance!', inline: false },
          { name: '📦 What version is the server?', value: 'We support Minecraft `1.21.x` on both Java and Bedrock editions!', inline: false }
        )
        .setColor(0x00E5FF)
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Executive Network • FAQ', iconURL: guild.iconURL() })
        .setTimestamp();

      await faqCh.send({ embeds: [faqEmbed] });
      console.log(`  [+] Posted FAQ embed in #${faqCh.name}`);
    }

    // ═══════════════════════════════════════════
    // 3. GIVEAWAY CHANNEL
    // ═══════════════════════════════════════════
    console.log('\n── 3: Giveaway Channel ──');
    const communityCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('COMMUNITY'));
    let giveawayCh = allChannels.find(c => c.isTextBased() && c.name.includes('giveaway'));

    if (!giveawayCh && communityCat) {
      try {
        giveawayCh = await guild.channels.create({
          name: '🎁┃giveaways',
          type: ChannelType.GuildText,
          parent: communityCat.id,
          topic: '🎁 Enter active giveaways for exclusive items, KryloCoins, ranks, and crate keys!'
        });
        console.log(`  [+] Created #🎁┃giveaways`);
      } catch (e) {
        console.log(`  [-] Could not create giveaway channel: ${e.message}`);
      }
    }

    if (giveawayCh) {
      try {
        const msgs = await giveawayCh.messages.fetch({ limit: 50 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        if (botMsgs.size > 0) await giveawayCh.bulkDelete(botMsgs).catch(() => {});
      } catch (e) {}

      const giveawayEmbed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Giveaway Center', iconURL: guild.iconURL() })
        .setTitle('🎁 KRYLOSMP GIVEAWAY HUB')
        .setDescription(
          `Welcome to the **Official Giveaway Center**!\n\n` +
          `🎉 **How to Enter:**\n` +
          `• Staff will post giveaways with a **[🎉 Enter Giveaway]** button\n` +
          `• Click the button to enter — one click per giveaway!\n` +
          `• Winners are drawn automatically when the timer expires\n\n` +
          `🏆 **Possible Prizes:**\n` +
          `• 💰 KryloCoins (10K — 100K+)\n` +
          `• 🎭 Exclusive Roles (VIP, Content Creator)\n` +
          `• 📦 Crate Keys & Lootboxes\n` +
          `• ⚔️ Rare In-Game Items\n\n` +
          `*Get the **🎁 Giveaways** role to be pinged when new giveaways drop!*`
        )
        .setColor(0xFF9800)
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Executive Network • Giveaway System', iconURL: guild.iconURL() })
        .setTimestamp();

      await giveawayCh.send({ embeds: [giveawayEmbed] });
      console.log(`  [+] Posted Giveaway Hub embed in #${giveawayCh.name}`);
    }

    // ═══════════════════════════════════════════
    // 4. SEASON 1 RE-RELEASE PATCH NOTES
    // ═══════════════════════════════════════════
    console.log('\n── 4: Season 1 Re-Release Patch Notes ──');
    const updateCh = allChannels.find(c => c.isTextBased() && (c.name.includes('new-updates') || c.name.includes('New-Updates')));

    if (updateCh) {
      const patchEmbed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Development Team', iconURL: guild.iconURL() })
        .setTitle('📋 SEASON 1 RE-RELEASE — PATCH NOTES v1.0')
        .setDescription(
          `**🎉 KryloSMP Season 1 is BACK and better than ever!**\n\n` +
          `We've rebuilt the server from the ground up with massive improvements.\n`
        )
        .addFields(
          { name: '⚔️ Combat & PvP', value: '• Full ELO-based PvP ranking system\n• Monthly tournaments with brackets\n• 1v1 Duel challenges with wagers\n• Bounty hunting system', inline: true },
          { name: '💰 Economy 2.0', value: '• KryloCoin currency system\n• Daily/Work/Fish/Mine/Craft income\n• Jackpot, Slots, Lootbox gambling\n• Item Trading marketplace', inline: true },
          { name: '🏰 Clan System', value: '• Create clans with private channels\n• Clan vault deposits\n• Clan leaderboards\n• Recruit & invite members', inline: true },
          { name: '🤖 AI Bot Features', value: '• 65+ slash commands\n• AI-powered support tickets\n• Auto-moderation (anti-spam, profanity filter)\n• XP & leveling system', inline: true },
          { name: '🌐 Web Portal', value: '• Player Portal website\n• Account linking & verification\n• Live economy stats\n• Leaderboard rankings', inline: true },
          { name: '🎮 Server Control', value: '• One-click server start from Discord\n• Live server status checking\n• Pterodactyl panel integration\n• Java + Bedrock crossplay', inline: true }
        )
        .setColor(0x00FF88)
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Season 1 Re-Release • August 2026', iconURL: guild.iconURL() })
        .setTimestamp();

      await updateCh.send({ embeds: [patchEmbed] });
      console.log(`  [+] Posted Season 1 Patch Notes in #${updateCh.name}`);
    }

    // ═══════════════════════════════════════════
    // 5. COUNTING & FUN CHANNELS
    // ═══════════════════════════════════════════
    console.log('\n── 5: Fun Engagement Channels ──');

    if (communityCat) {
      // Counting channel
      let countCh = allChannels.find(c => c.isTextBased() && c.name.includes('counting'));
      if (!countCh) {
        try {
          countCh = await guild.channels.create({
            name: '🔢┃counting',
            type: ChannelType.GuildText,
            parent: communityCat.id,
            topic: '🔢 Count as high as you can! One number per message. Don\'t break the chain!'
          });
          await countCh.send({ embeds: [
            new EmbedBuilder()
              .setTitle('🔢 COUNTING CHALLENGE')
              .setDescription('**Count as high as possible!**\n\n• One number per message\n• Don\'t count twice in a row\n• If someone breaks the chain, it resets to 1!\n\n*Start counting from **1**!*')
              .setColor(0x00E5FF).setTimestamp()
          ]});
          console.log(`  [+] Created #🔢┃counting with guide embed`);
        } catch (e) {
          console.log(`  [-] Could not create counting channel: ${e.message}`);
        }
      }

      // QOTD channel
      let qotdCh = allChannels.find(c => c.isTextBased() && c.name.includes('qotd'));
      if (!qotdCh) {
        try {
          qotdCh = await guild.channels.create({
            name: '💭┃question-of-the-day',
            type: ChannelType.GuildText,
            parent: communityCat.id,
            topic: '💭 Daily questions to spark community conversations! Answer and discuss.'
          });
          await qotdCh.send({ embeds: [
            new EmbedBuilder()
              .setTitle('💭 QUESTION OF THE DAY')
              .setDescription('**A new question will be posted here daily!**\n\n• Share your thoughts and discuss with others\n• Be respectful of different opinions\n• Have fun and get to know the community!\n\n*Stay tuned for today\'s question!*')
              .setColor(0x9B59B6).setTimestamp()
          ]});
          console.log(`  [+] Created #💭┃question-of-the-day with guide embed`);
        } catch (e) {
          console.log(`  [-] Could not create QOTD channel: ${e.message}`);
        }
      }
    }

    // ═══════════════════════════════════════════
    // 6. SET GUILD FEATURES (AFK, System Channel)
    // ═══════════════════════════════════════════
    console.log('\n── 6: Guild Settings ──');
    try {
      const afkCh = allChannels.find(c => c.type === ChannelType.GuildVoice && c.name.toLowerCase().includes('afk'));
      if (afkCh) {
        await guild.setAFKChannel(afkCh.id);
        await guild.setAFKTimeout(300); // 5 min
        console.log(`  [+] AFK Channel set to #${afkCh.name} (5 min timeout)`);
      }

      const sysCh = allChannels.find(c => c.isTextBased() && c.name.includes('general-chat'));
      if (sysCh) {
        await guild.setSystemChannel(sysCh.id);
        console.log(`  [+] System Channel set to #${sysCh.name}`);
      }
    } catch (e) {
      console.log(`  [⚠️] Guild settings: ${e.message}`);
    }

    // ═══════════════════════════════════════════
    // 7. BOOST PERKS DISPLAY
    // ═══════════════════════════════════════════
    console.log('\n── 7: Boost Perks Embed ──');
    const storeCh = allChannels.find(c => c.isTextBased() && c.name.includes('store'));
    if (storeCh) {
      const boostEmbed = new EmbedBuilder()
        .setAuthor({ name: 'KryloSMP Supporter Program', iconURL: guild.iconURL() })
        .setTitle('🚀 SERVER BOOST PERKS & VIP BENEFITS')
        .setDescription(
          `**Support KryloSMP and unlock exclusive rewards!**\n\n` +
          `💎 **VIP Rank Perks:**\n` +
          `• 🎨 Custom colored name in chat\n` +
          `• 💬 Access to exclusive VIP lounge channels\n` +
          `• 💰 2x daily KryloCoin bonuses\n` +
          `• 📦 Weekly exclusive lootbox drops\n` +
          `• ⚔️ Priority tournament entry\n` +
          `• 🏆 VIP badge on Player Portal\n\n` +
          `🚀 **Server Booster Perks:**\n` +
          `• 🎭 Exclusive **🚀 Booster** hoisted role\n` +
          `• 💰 5,000 KC instant bonus on boost\n` +
          `• 🎁 Monthly booster-only giveaways\n` +
          `• 🔊 Custom voice channel access\n\n` +
          `*Visit the [Web Store](https://krylosmp.tebex.io) for ranks, keys, and items!*`
        )
        .setColor(0xF47FFF)
        .setThumbnail(guild.iconURL())
        .setFooter({ text: 'KryloSMP Executive Network • Support Program', iconURL: guild.iconURL() })
        .setTimestamp();

      await storeCh.send({ embeds: [boostEmbed] });
      console.log(`  [+] Posted Boost Perks embed in #${storeCh.name}`);
    }

    console.log(`\n🏆 PHASE 2 UPGRADE COMPLETE FOR [${guild.name}]!\n`);
  }

  console.log('\n🏆🏆🏆 ALL SERVERS PHASE 2 UPGRADE COMPLETE! 🏆🏆🏆');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
