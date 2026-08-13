import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMembers] });

client.once('ready', async () => {
  console.log(`[+] Phase 3 Ultimate Upgrader Online as ${client.user.tag}\n`);

  for (const [, guild] of client.guilds.cache) {
    if (!guild.name.toLowerCase().includes('krylo')) continue;
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 PHASE 3 UPGRADE: ${guild.name} (${guild.id})`);
    console.log(`${'='.repeat(60)}\n`);

    const channels = await guild.channels.fetch();
    const allChannels = [...channels.values()].filter(c => c !== null);
    const roles = await guild.roles.fetch();

    // ═══════════════════════════════════════════
    // 1. STARBOARD CHANNEL
    // ═══════════════════════════════════════════
    console.log('── 1: Starboard Channel ──');
    const communityCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('COMMUNITY'));
    let starboardCh = allChannels.find(c => c.isTextBased() && c.name.includes('starboard'));

    if (!starboardCh && communityCat) {
      try {
        starboardCh = await guild.channels.create({
          name: '⭐┃starboard',
          type: ChannelType.GuildText,
          parent: communityCat.id,
          topic: '⭐ The best messages from our community! Messages with 3+ ⭐ reactions get featured here.'
        });
        await starboardCh.send({ embeds: [
          new EmbedBuilder()
            .setAuthor({ name: 'KryloSMP Starboard', iconURL: guild.iconURL() })
            .setTitle('⭐ COMMUNITY STARBOARD')
            .setDescription(
              '**The best messages from KryloSMP get showcased here!**\n\n' +
              '⭐ When a message receives **3+ star reactions**, it gets automatically posted here for everyone to see!\n\n' +
              '🏆 **How to Star a Message:**\n' +
              '• React with ⭐ on any amazing message\n' +
              '• If it reaches 3 stars, it\'s featured!\n' +
              '• The more stars, the higher the recognition!\n\n' +
              '*Only the best of the best make it to the Starboard!*'
            )
            .setColor(0xFFD700)
            .setThumbnail(guild.iconURL())
            .setFooter({ text: 'KryloSMP Executive Network • Starboard', iconURL: guild.iconURL() })
            .setTimestamp()
        ]});
        console.log(`  [+] Created #⭐┃starboard with guide embed`);
      } catch (e) {
        console.log(`  [-] Starboard: ${e.message}`);
      }
    } else {
      console.log(`  [✓] Starboard already exists`);
    }

    // ═══════════════════════════════════════════
    // 2. CONFESSION / ANONYMOUS CHANNEL
    // ═══════════════════════════════════════════
    console.log('\n── 2: Confession Channel ──');
    let confessionCh = allChannels.find(c => c.isTextBased() && c.name.includes('confession'));

    if (!confessionCh && communityCat) {
      try {
        confessionCh = await guild.channels.create({
          name: '🤫┃confessions',
          type: ChannelType.GuildText,
          parent: communityCat.id,
          topic: '🤫 Share anonymous confessions, hot takes, and unpopular opinions! Keep it respectful.'
        });
        await confessionCh.send({ embeds: [
          new EmbedBuilder()
            .setTitle('🤫 ANONYMOUS CONFESSIONS')
            .setDescription(
              '**Share your thoughts anonymously!**\n\n' +
              '💬 Use `/suggest` with your confession and it will be posted anonymously\n' +
              '⚠️ Keep all confessions family-friendly and respectful\n' +
              '🚫 No harassment, bullying, or targeting specific members\n\n' +
              '*All confessions are moderated. Rule violations will result in action.*'
            )
            .setColor(0x9B59B6)
            .setTimestamp()
        ]});
        console.log(`  [+] Created #🤫┃confessions`);
      } catch (e) {
        console.log(`  [-] Confessions: ${e.message}`);
      }
    }

    // ═══════════════════════════════════════════
    // 3. LEVEL REWARDS GUIDE
    // ═══════════════════════════════════════════
    console.log('\n── 3: Level Rewards Guide ──');
    const infoCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('INFORMATION'));
    let levelCh = allChannels.find(c => c.isTextBased() && c.name.includes('level'));

    if (!levelCh && infoCat) {
      try {
        levelCh = await guild.channels.create({
          name: '📊┃levels-and-rewards',
          type: ChannelType.GuildText,
          parent: infoCat.id,
          topic: '📊 XP leveling system guide, rank rewards, and milestone perks!'
        });
        console.log(`  [+] Created #📊┃levels-and-rewards`);
      } catch (e) {
        console.log(`  [-] Levels channel: ${e.message}`);
      }
    }

    if (levelCh) {
      try {
        const msgs = await levelCh.messages.fetch({ limit: 50 });
        const botMsgs = msgs.filter(m => m.author.id === client.user.id);
        if (botMsgs.size > 0) await levelCh.bulkDelete(botMsgs).catch(() => {});
      } catch (e) {}

      await levelCh.send({ embeds: [
        new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Leveling System', iconURL: guild.iconURL() })
          .setTitle('📊 XP LEVELING SYSTEM & RANK REWARDS')
          .setDescription('**Earn XP by chatting and unlock exclusive rewards as you level up!**')
          .addFields(
            { name: '📈 How XP Works', value: '• Earn 15-25 XP per message (60s cooldown)\n• Check your rank: `/rank`\n• View leaderboard: `/xpleaderboard`', inline: false },
            { name: '🌱 Level 1-9 — Newcomer', value: '• Access to basic chat channels\n• Can use economy commands\n• Role: `🌱 Newcomer`', inline: true },
            { name: '✨ Level 10+ — Rising Star', value: '• Unlock advanced channels\n• Bonus daily KC rewards\n• Role: `✨ Level 10+`', inline: true },
            { name: '🔥 Level 25+ — Veteran', value: '• Priority tournament entry\n• Exclusive emote access\n• Role: `🔥 Level 25+`', inline: true },
            { name: '⭐ Level 50+ — Legend', value: '• Custom colored name\n• VIP lounge access\n• 3x daily KC bonus\n• Role: `⭐ Level 50+`', inline: true },
            { name: '💎 Level 100+ — Mythic', value: '• Legendary badge on profile\n• Special shoutout in announcements\n• Exclusive Mythic perks', inline: true },
            { name: '🏆 Bonus XP Events', value: '• 2x XP weekends announced in #📢┃server-announcements\n• Win XP boosts from `/lootbox` and `/chest`', inline: true }
          )
          .setColor(0x00E5FF)
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'KryloSMP Executive Network • XP System', iconURL: guild.iconURL() })
          .setTimestamp()
      ]});
      console.log(`  [+] Posted Level Rewards Guide embed`);
    }

    // ═══════════════════════════════════════════
    // 4. PARTNER / AFFILIATE CHANNEL
    // ═══════════════════════════════════════════
    console.log('\n── 4: Partnership Channel ──');
    let partnerCh = allChannels.find(c => c.isTextBased() && c.name.includes('partner'));

    if (!partnerCh && infoCat) {
      try {
        partnerCh = await guild.channels.create({
          name: '🤝┃partnerships',
          type: ChannelType.GuildText,
          parent: infoCat.id,
          topic: '🤝 Official KryloSMP partners, affiliated servers, and collaboration opportunities!'
        });
        await partnerCh.send({ embeds: [
          new EmbedBuilder()
            .setAuthor({ name: 'KryloSMP Partnership Program', iconURL: guild.iconURL() })
            .setTitle('🤝 KRYLOSMP PARTNERSHIP PROGRAM')
            .setDescription(
              '**Interested in partnering with KryloSMP?**\n\n' +
              '📋 **Requirements:**\n' +
              '• Server must have 50+ active members\n' +
              '• Must be a gaming or Minecraft-related community\n' +
              '• Must follow Discord ToS and have active moderation\n' +
              '• Must display KryloSMP partner badge/channel\n\n' +
              '🎁 **Partner Benefits:**\n' +
              '• Cross-promotion in both servers\n' +
              '• Partner role and channel access\n' +
              '• Joint events and giveaways\n' +
              '• Featured on our Player Portal\n\n' +
              '📩 **To Apply:** Open a ticket in #🎫┃support-tickets with subject "Partnership Application"'
            )
            .setColor(0x5865F2)
            .setThumbnail(guild.iconURL())
            .setFooter({ text: 'KryloSMP Executive Network • Partnerships', iconURL: guild.iconURL() })
            .setTimestamp()
        ]});
        console.log(`  [+] Created #🤝┃partnerships with embed`);
      } catch (e) {
        console.log(`  [-] Partnerships: ${e.message}`);
      }
    }

    // ═══════════════════════════════════════════
    // 5. VERIFIED-ONLY CHANNEL PERMISSIONS
    // ═══════════════════════════════════════════
    console.log('\n── 5: Verified-Only Channel Permissions ──');
    const verifiedRole = [...roles.values()].find(r => r.name === '✅ Verified');
    const everyoneRole = guild.roles.everyone;

    if (verifiedRole) {
      const protectedChannels = allChannels.filter(c =>
        c.isTextBased() &&
        c.type !== ChannelType.GuildCategory &&
        !c.name.includes('rules') &&
        !c.name.includes('verify') &&
        !c.name.includes('welcome') &&
        !c.name.includes('server-info') &&
        !c.name.includes('socials') &&
        !c.name.includes('announcements') &&
        !c.name.includes('new-updates')
      );

      let lockCount = 0;
      for (const ch of protectedChannels) {
        try {
          await ch.permissionOverwrites.edit(everyoneRole, { SendMessages: false });
          await ch.permissionOverwrites.edit(verifiedRole, { SendMessages: true });
          lockCount++;
        } catch (e) {}
      }
      console.log(`  [+] Locked ${lockCount} channels to ✅ Verified members only`);
    } else {
      console.log(`  [⚠️] No ✅ Verified role found — skipping permission lockdown`);
    }

    // ═══════════════════════════════════════════
    // 6. ADDITIONAL VOICE CHANNELS
    // ═══════════════════════════════════════════
    console.log('\n── 6: Additional Voice Channels ──');
    const voiceCat = allChannels.find(c => c.type === ChannelType.GuildCategory && c.name.includes('VOICE'));

    if (voiceCat) {
      const existingVoice = allChannels.filter(c => c.type === ChannelType.GuildVoice && c.parentId === voiceCat.id);

      if (existingVoice.length < 4) {
        const voiceChannels = [
          { name: '🔊・General Lounge', type: ChannelType.GuildVoice },
          { name: '🔊・Gaming Squad 1', type: ChannelType.GuildVoice },
          { name: '🔊・Gaming Squad 2', type: ChannelType.GuildVoice },
          { name: '🎵・Music Lounge', type: ChannelType.GuildVoice },
          { name: '💤・afk-zone', type: ChannelType.GuildVoice }
        ];

        for (const vc of voiceChannels) {
          const exists = allChannels.find(c => c.name === vc.name && c.parentId === voiceCat.id);
          if (!exists) {
            try {
              await guild.channels.create({ ...vc, parent: voiceCat.id });
              console.log(`  [+] Created voice channel: ${vc.name}`);
            } catch (e) {
              console.log(`  [-] Voice ${vc.name}: ${e.message}`);
            }
          }
        }
      } else {
        console.log(`  [✓] Voice channels already set up (${existingVoice.length} channels)`);
      }

      // Music lounge
      const musicVc = allChannels.find(c => c.type === ChannelType.GuildVoice && c.name.includes('Music'));
      if (!musicVc) {
        try {
          await guild.channels.create({ name: '🎵・Music Lounge', type: ChannelType.GuildVoice, parent: voiceCat.id });
          console.log(`  [+] Created 🎵・Music Lounge voice channel`);
        } catch (e) {}
      }
    }

    // ═══════════════════════════════════════════
    // 7. SERVER DESCRIPTION
    // ═══════════════════════════════════════════
    console.log('\n── 7: Server Description ──');
    try {
      await guild.setDescription('⚔️ KryloSMP — The Ultimate Minecraft SMP Experience! Season 1 Re-Release is LIVE. Join now: KryloSmp.play.hosting');
      console.log(`  [+] Server description updated`);
    } catch (e) {
      console.log(`  [⚠️] Description: ${e.message}`);
    }

    // ═══════════════════════════════════════════
    // 8. ECONOMY GUIDE EMBED IN STORE
    // ═══════════════════════════════════════════
    console.log('\n── 8: Economy Guide ──');
    const storeCh = allChannels.find(c => c.isTextBased() && c.name.includes('store'));
    if (storeCh) {
      await storeCh.send({ embeds: [
        new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Economy System', iconURL: guild.iconURL() })
          .setTitle('💰 COMPLETE KRYLOCOIN ECONOMY GUIDE')
          .setDescription('**Master the KryloCoin economy and build your fortune!**')
          .addFields(
            { name: '💵 Earning KC', value: '`/daily` — 1,000 KC\n`/work` — 500-2,000 KC\n`/fish` — Catch & sell fish\n`/mine` — Mine ores for KC\n`/craft` — Craft items to sell', inline: true },
            { name: '🎰 Gambling', value: '`/slots` — Slot machine\n`/coinflip` — 50/50 double\n`/jackpot` — Grand jackpot\n`/spin` — Prize wheel\n`/lootbox` — Mystery rewards', inline: true },
            { name: '💼 Trading', value: '`/trade @user` — Direct trade\n`/pay @user` — Send KC\n`/shop` — Buy from store\n`/bounty` — Place bounties\n`/rob @user` — Risky theft', inline: true },
            { name: '🏦 Banking', value: '`/balance` — Check wallet & bank\n`/profile` — Full profile view\n`/inventory` — Your items\n`/achievements` — Unlock rewards\n`/quests` — Daily quest chains', inline: true },
            { name: '🏰 Clan Economy', value: '`/clan deposit` — Fund vault\n`/clan info` — View balance\n`/clan leaderboard` — Rankings\n`/heist` — Raid clan vaults\n`/raid` — Group raids', inline: true },
            { name: '🎁 Free Bonuses', value: '`/bday` — Birthday reward\n`/chest` — Random chest\n`/refer` — Referral bonus\n`/vote` — Vote rewards\n`/bump` — Bump bonus', inline: true }
          )
          .setColor(0xFFD700)
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'KryloSMP Executive Network • Economy v2.0', iconURL: guild.iconURL() })
          .setTimestamp()
      ]});
      console.log(`  [+] Posted Economy Guide in #${storeCh.name}`);
    }

    console.log(`\n🏆 PHASE 3 UPGRADE COMPLETE FOR [${guild.name}]!\n`);
  }

  console.log('\n🏆🏆🏆 ALL SERVERS PHASE 3 UPGRADE COMPLETE! 🏆🏆🏆');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
