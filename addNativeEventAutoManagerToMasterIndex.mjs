import fs from 'fs';

let code = fs.readFileSync('index.js', 'utf8');

const nativeEventCode = `
// ═══════════════════════════════════════════════════════════
// NATIVE DISCORD SCHEDULED EVENT AUTO-MANAGER
// ═══════════════════════════════════════════════════════════
async function ensureMonthlyNativeDiscordEvent(guild) {
  try {
    if (!guild) return;
    const events = await guild.scheduledEvents.fetch().catch(() => null);
    if (!events) return;

    const hasAbuseEvent = events.some(e => e.name.toLowerCase().includes('admin abuse'));
    if (!hasAbuseEvent) {
      const now = new Date();
      let eventYear = now.getFullYear();
      let eventMonth = now.getMonth();

      if (now.getDate() > 1 || (now.getDate() === 1 && now.getHours() >= 18)) {
        eventMonth += 1;
        if (eventMonth > 11) {
          eventMonth = 0;
          eventYear += 1;
        }
      }

      const scheduledTime = new Date(eventYear, eventMonth, 1, 18, 0, 0);

      await guild.scheduledEvents.create({
        name: '🔥 Monthly Admin Abuse & New Features Event',
        scheduledStartTime: scheduledTime,
        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
        entityType: GuildScheduledEventEntityType.External,
        entityMetadata: { location: 'krylosmp.play.hosting' },
        description: 'Official Monthly Admin Abuse Event, OP Drop Parties, Boss Mobs, and KryloSMP New Feature Releases!',
        image: 'https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80'
      });
      console.log('[Native Event Manager] Auto-created native Discord Scheduled Event for next month!');
    }
  } catch (err) {
    console.warn('[Native Event Manager] Error:', err.message);
  }
}
`;

if (!code.includes('ensureMonthlyNativeDiscordEvent')) {
  const insertIdx = code.indexOf("if (message.content.startsWith('!postvideo'))");
  if (insertIdx !== -1) {
    code = code.substring(0, insertIdx) + nativeEventCode + '\n\n' + code.substring(insertIdx);
  }
}

// Add call inside ready event
if (!code.includes("ensureMonthlyNativeDiscordEvent(guild)")) {
  const readyCallIdx = code.indexOf("[KryloSMP Setup] Found KryloSMP guild.");
  if (readyCallIdx !== -1) {
    code = code.substring(0, readyCallIdx) + "await ensureMonthlyNativeDiscordEvent(guild);\n  " + code.substring(readyCallIdx);
  }
}

// Ensure GuildScheduledEventEntityType import at top
if (!code.includes("GuildScheduledEventEntityType")) {
  code = code.replace("import { Client,", "import { Client, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel,");
}

fs.writeFileSync('index.js', code);
console.log('✅ index.js updated with Native Discord Scheduled Event Auto-Manager!');
