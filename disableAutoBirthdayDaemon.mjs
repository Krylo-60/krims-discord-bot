import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const oldDaemonBlock = `  let birthdayAnnouncedYear = 0;
  setInterval(async () => {
    const targetTimestamp = 1784865600000; // July 24th, 2026 00:00:00 EDT
    const currentYear = new Date().getFullYear();
      if (Date.now() >= targetTimestamp && birthdayAnnouncedYear !== currentYear) {
        birthdayAnnouncedYear = currentYear;
        
        console.log("[🎂 BIRTHDAY DAEMON] July 24th reached! Triggering Official Birthday Announcement...");
        try {
          const guild = await client.guilds.fetch('1524878881918685405');
          const announceCh = guild.channels.cache.find(c => c.name.includes('announcements') && c.type === ChannelType.GuildText);
          
          if (!announceCh) return;

          // Check if birthday announcement ALREADY exists in channel history
          const recentMsgs = await announceCh.messages.fetch({ limit: 25 }).catch(() => null);
          const alreadyPosted = recentMsgs && recentMsgs.some(m => 
            m.embeds && m.embeds.some(e => e.title && e.title.includes("OFFICIALLY KRYLO'S BIRTHDAY"))
          );
          if (alreadyPosted) {
            return; // Already posted in channel, skip!
          }
        if (announceCh) {
          const embed = new EmbedBuilder()
            .setColor(0xFF007F)
            .setTitle('🎂🎉 IT IS OFFICIALLY KRYLO\\'S BIRTHDAY! 🎉🎂')
            .setDescription('👑 **HAPPY BIRTHDAY TO KRYLO, THE CREATOR & OWNER OF KRYLOSMP!** 🥳✨\\n\\nToday is the big day! Everyone raise your swords, celebrate in-game, and claim your free **+1000 KryloCoins** bonus using \`/bday\` and \`/daily\`! ⚔️💎🎁')
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ text: 'KryloSMP Official Birthday Event • July 24th' })
            .setTimestamp();

          await announceCh.send({ content: '🎉 @everyone **IT IS OFFICIALLY KRYLO\\'S BIRTHDAY!** 🎂🎈', embeds: [embed] });
        }
      } catch (err) {
        console.warn("[🎂 BIRTHDAY DAEMON] Failed to send announcement:", err.message);
      }
    }
  }, 60000);`;

const newDaemonBlock = `  // Birthday announcement is triggered on-demand via !bday or /bday command`;

if (code.includes('BIRTHDAY DAEMON')) {
  code = code.replace(oldDaemonBlock, newDaemonBlock);
  fs.writeFileSync('index.js', code);
  console.log('✅ Disabled automated birthday loop in index.js!');
} else {
  // Regex fallback
  const startIdx = code.indexOf('let birthdayAnnouncedYear = 0;');
  const endIdx = code.indexOf('// 24/7 Automated Social News');
  if (startIdx !== -1 && endIdx !== -1) {
    code = code.substring(0, startIdx) + newDaemonBlock + '\n\n  ' + code.substring(endIdx);
    fs.writeFileSync('index.js', code);
    console.log('✅ Regex disabled automated birthday loop in index.js!');
  }
}
