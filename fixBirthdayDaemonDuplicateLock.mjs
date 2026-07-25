import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(filePath, 'utf8');

const targetLine = `console.log("[🎂 BIRTHDAY DAEMON] July 24th reached! Triggering Official Birthday Announcement & Fireworks...");`;

if (content.includes(targetLine)) {
  const replaceBlock = `
          // Check if birthday announcement ALREADY exists in channel history
          const recentMsgs = await announceCh.messages.fetch({ limit: 25 }).catch(() => null);
          const alreadyPosted = recentMsgs && recentMsgs.some(m => 
            m.embeds && m.embeds.some(e => e.title && e.title.includes("OFFICIALLY KRYLO'S BIRTHDAY"))
          );
          if (alreadyPosted) {
            return; // Already posted in channel, skip!
          }

          console.log("[🎂 BIRTHDAY DAEMON] July 24th reached! Triggering Official Birthday Announcement...");`;

  content = content.replace(targetLine, replaceBlock);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('[🎉 INDEX.JS SUCCESSFULLY UPDATED WITH CHANNEL HISTORY LOCK!]');
} else {
  console.log('[!] Target line not found.');
}
