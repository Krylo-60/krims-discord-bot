with open('index.js', 'r', encoding='utf-8') as f:
    code = f.read()

targetOld = """        // Align channels under 📌 INFORMATION
        await ensureChannel('📌┃rules', infoCat, 'Official server rules and regulations.');
        await ensureChannel('ℹ️┃server-info', infoCat, 'Server information, IP address, and role selector.');
        await ensureChannel('📢┃announcements', infoCat, 'Official server news and announcements.');
        await ensureChannel('💡┃suggestions', infoCat, 'Submit your ideas and vote on suggestions!');

        // Align channels under 💬 COMMUNITY ZONE
        await ensureChannel('💬┃general-chat', commCat, 'General chat and discussion for KryloSMP players.');
        await ensureChannel('📷┃media-clips', commCat, 'Post your builds, screenshots, and videos!');
        await ensureChannel('🛒┃marketplace', commCat, 'List items for sale, trade, and advertise player shops.');
        await ensureChannel('🤖┃bot-commands', commCat, 'Use bot commands like /rank or /xpleaderboard here to keep chat clean.');
        await ensureChannel('📈┃polls', commCat, 'Participate in official server votes and polls.');

        // Align channels under 🎪 EVENTS & ACTIVITIES
        await ensureChannel('⚔️┃pvp-chat', eventCat, 'Chat about PvP, tournaments, and duels.');
        await ensureChannel('🏆┃tournaments', eventCat, 'Official server tournament updates.');
        await ensureChannel('🎨┃build-showcase', eventCat, 'Share your base coordinates or submit builds for build contests!');
        await ensureChannel('🎉┃giveaways', eventCat, 'Participate in item and rank giveaways!');

        // Align channels under 🎮 MINECRAFT LIVE
        const onlinePlayersCh = await ensureChannel('🟢┃players-online', liveCat, 'Real-time player tracking for KryloSMP.');
        const leaderboardCh = await ensureChannel('🏆┃leaderboards', liveCat, 'KryloSMP global chat and in-game leaderboards.');
        await ensureChannel('📰┃server-updates', liveCat, 'Real-time alerts for server join/leaves, deaths, and advancements!');

        // Align channels under 📞 STAFF AREA
        await ensureChannel('💬┃staff-chat', staffCat, 'Private chat area for staff members only.', true);
        const modLogsCh = await ensureChannel('🛡️┃mod-logs', staffCat, 'Moderator action logs and system notifications.', true);
        await ensureChannel('🚨┃reports', staffCat, 'Real-time player report logs.', true);

        // Align Voice Channels
        const voiceChannels = ['🔊┃Lobby', '🔊┃Survival 1', '🔊┃Survival 2', '🔊┃Gaming'];
        for (const vcName of voiceChannels) {
          const existingVC = guild.channels.cache.find(c => c.name === vcName && c.type === ChannelType.GuildVoice && c.parentId === voiceCat.id);
          if (!existingVC) {
            await guild.channels.create({
              name: vcName,
              type: ChannelType.GuildVoice,
              parent: voiceCat.id
            });
            console.log(`[KryloSMP Setup] Created voice channel: ${vcName}`);
          }
        }"""

targetNew = """        // Align channels under 📌 INFORMATION
        await ensureChannel('📌・rules', infoCat, 'Official server rules and regulations.');
        await ensureChannel('📢・announcements', infoCat, 'Official server news and announcements.');
        await ensureChannel('📺・youtube-alerts', infoCat, 'YouTube video notifications.');
        await ensureChannel('🌐・official-links', infoCat, 'Official web links and store.');
        await ensureChannel('✅・verify-here', infoCat, 'Player verification gateway.');

        // Align channels under 💬 COMMUNITY
        await ensureChannel('💬・general-chat', commCat, 'General chat and discussion.');
        await ensureChannel('🤖・bot-commands', commCat, 'Use bot commands here.');
        await ensureChannel('📷・media-clips', commCat, 'Post your builds and clips.');
        await ensureChannel('💡・suggestions', commCat, 'Submit ideas and vote.');

        // Align channels under 🛒 ECONOMY & STORE
        await ensureChannel('🛒・web-store', econCat, 'Official KryloSMP store catalog.');
        await ensureChannel('💰・jackpot-vault', econCat, 'Jackpot vault & casino.');
        await ensureChannel('🎯・bounty-board', econCat, 'Active player bounties.');
        await ensureChannel('🤝・item-trading', econCat, 'Player-to-player trading.');

        // Align channels under 🏰 FACTIONS & CLANS
        await ensureChannel('🏰・ksmp-clan-chat', clanCat, 'Official clan discussion.');
        await ensureChannel('🏆・clan-rankings', clanCat, 'Top clans leaderboard.');

        // Align channels under ⚔️ PVP & TOURNAMENTS
        await ensureChannel('⚔️・pvp-arena-chat', pvpCat, 'PvP chat and duels.');
        await ensureChannel('🏆・monthly-tournament', pvpCat, 'Monthly tournament announcements.');

        // Align channels under 🎟️ SUPPORT & TICKETS
        await ensureChannel('🎟️・open-ticket', tktCat, 'Open support tickets.');

        // Align Voice Channels
        const voiceChannels = ['🔊・General Lounge', '🔊・Gaming Squad 1', '🔊・Gaming Squad 2', '💤・afk-zone'];
        for (const vcName of voiceChannels) {
          const existingVC = guild.channels.cache.find(c => c.name === vcName && c.type === ChannelType.GuildVoice && c.parentId === voiceCat.id);
          if (!existingVC) {
            await guild.channels.create({
              name: vcName,
              type: ChannelType.GuildVoice,
              parent: voiceCat.id
            });
            console.log(`[KryloSMP Setup] Created voice channel: ${vcName}`);
          }
        }
        const onlinePlayersCh = null;
        const leaderboardCh = null;
        const modLogsCh = null;"""

if targetOld in code:
    code = code.replace(targetOld, targetNew)
    with open('index.js', 'w', encoding='utf-8') as f:
        f.write(code)
    print("SUCCESS: Replaced channel alignments in index.js")
else:
    print("[-] targetOld string not found in index.js")
