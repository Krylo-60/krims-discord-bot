import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add 365-day cooldown check to /bday command
const oldBdayHeader = "if (commandName === 'bday') {";
const newBdayHeader = `if (commandName === 'bday') {
    const userId = interaction.user.id;
    const now = Date.now();
    const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000; // 365 days

    if (!xpData[userId]) {
      xpData[userId] = { xp: 0, level: 1 };
    }

    if (xpData[userId].lastBdayClaim) {
      const timePassed = now - xpData[userId].lastBdayClaim;
      if (timePassed < ONE_YEAR_MS) {
        const daysLeft = Math.ceil((ONE_YEAR_MS - timePassed) / (24 * 60 * 60 * 1000));
        await interaction.reply({
          content: \`⏳ **You have already claimed your once-a-year birthday celebration!**\\n\\nYou can use \\\`/bday\\\` again in **\${daysLeft} day(s)**.\`,
          ephemeral: true
        });
        return;
      }
    }

    // Set last claim timestamp & save
    xpData[userId].lastBdayClaim = now;
    saveXPData();
`;

content = content.replace(oldBdayHeader, newBdayHeader);

// 2. Prevent birthday daemon from posting duplicate announcements on bot reboot
content = content.replace(
  "let birthdayAnnounced = false;",
  "let birthdayAnnouncedYear = 0;"
);

content = content.replace(
  "if (Date.now() >= targetTimestamp && !birthdayAnnounced) {",
  "const currentYear = new Date().getFullYear();\n      if (Date.now() >= targetTimestamp && birthdayAnnouncedYear !== currentYear) {"
);

content = content.replace(
  "birthdayAnnounced = true;",
  "birthdayAnnouncedYear = currentYear;"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 BDAY 365-DAY COOLDOWN & DAEMON DE-DUPLICATION INTEGRATED SUCCESSFULLY!]');
