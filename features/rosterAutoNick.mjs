/**
 * 🏷️ Roster & Minecraft IGN Automatic Nickname Sync Engine
 * Automatically extracts Minecraft in-game names from roster posts, forms,
 * or direct IGN registrations and synchronizes the member's Discord server nickname.
 */

import { learnServerFact } from './aiMemoryEngine.mjs';

export function extractIgn(content, isRosterChannel = false) {
  if (!content) return null;
  const trimmed = content.trim();

  // Pattern 1: Command prefix (e.g. !ign Steve, !mcign Steve)
  const cmdMatch = trimmed.match(/^!(?:ign|mcign|name|setign)\s+`?([a-zA-Z0-9_]{3,16})`?/i);
  if (cmdMatch) return cmdMatch[1];

  // Pattern 2: Explicit label (e.g. • Minecraft IGN: CrazyCoolCam, MC IGN: Steve, IGN: Alex)
  const labeledMatch = trimmed.match(/(?:minecraft\s*ign|mc\s*ign|\bign\b)\s*[:=\-]?\s*`?([a-zA-Z0-9_]{3,16})`?/i);
  if (labeledMatch) return labeledMatch[1];

  // Pattern 3: Conversational (e.g. My IGN is CrazyCoolCam, My MC name is Steve)
  const phraseMatch = trimmed.match(/(?:my\s*(?:minecraft\s*|mc\s*)?(?:ign|name|username)\s*(?:is)?\s*[:=\-]?)\s*`?([a-zA-Z0-9_]{3,16})`?/i);
  if (phraseMatch) return phraseMatch[1];

  // Pattern 4: In dedicated roster channel, check if the first line or standalone message is a valid MC IGN
  if (isRosterChannel) {
    // Exact standalone single-word IGN (3-16 chars, letters/numbers/underscore)
    if (/^[a-zA-Z0-9_]{3,16}$/.test(trimmed)) {
      return trimmed;
    }
    // First line is just an IGN, followed by other details
    const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length > 0 && /^[a-zA-Z0-9_]{3,16}$/.test(lines[0])) {
      return lines[0];
    }
  }

  return null;
}

export async function handleRosterMessage(message) {
  if (!message.guild || message.author.bot) return false;

  const channelName = (message.channel.name || '').toLowerCase();
  const isRosterChannel = channelName.includes('roster') ||
                          channelName.includes('ign') ||
                          channelName.includes('verify') ||
                          channelName.includes('directory');

  const ign = extractIgn(message.content, isRosterChannel);
  if (!ign) return false;

  try {
    const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
    if (!member) return false;

    // 🧠 Learn member IGN into persistent server AI memory
    learnServerFact(
      message.guild.id,
      `member_${ign.toLowerCase()}`,
      `Discord user @${member.user.username} (${member.user.tag}) has verified Minecraft IGN: "${ign}".`,
      'Roster Sync'
    );

    // Already matches
    if (member.nickname === ign || (!member.nickname && member.user.username === ign)) {
      await message.react('✅').catch(() => {});
      return true;
    }

    // Server owner cannot be renamed via bot API (Discord protocol 50013)
    if (message.guild.ownerId === member.id) {
      await message.react('✅').catch(() => {});
      console.log(`[RosterAutoNick] IGN "${ign}" registered for server owner @${member.user.username} (Discord bypasses bot renaming for owner)`);
      return true;
    }

    // Set server nickname
    await member.setNickname(ign, 'Automatic Minecraft IGN Sync via Roster');
    await message.react('🏷️').catch(() => {});
    await message.react('✅').catch(() => {});

    await message.reply({
      content: `🏷️ **Minecraft IGN Linked:** Your server nickname has been updated to **\`${ign}\`**! ⚔️`,
      allowedMentions: { repliedUser: false }
    }).catch(() => {});

    console.log(`[RosterAutoNick] ✅ Updated nickname for @${member.user.username} to "${ign}" in ${message.guild.name}`);
    return true;
  } catch (err) {
    if (err.code === 50013) {
      // Permission hierarchy issue or owner
      await message.react('✅').catch(() => {});
      console.log(`[RosterAutoNick] IGN "${ign}" confirmed for @${message.author.username} (Hierarchy restricted)`);
      return true;
    } else {
      console.error('[RosterAutoNick] Error setting nickname:', err.message);
      return false;
    }
  }
}
