/**
 * 🏷️ Roster & Minecraft IGN Automatic Nickname Sync Engine
 * Automatically extracts Minecraft in-game names from roster posts, forms,
 * or direct IGN registrations and synchronizes the member's Discord server nickname.
 */

import { learnServerFact } from './aiMemoryEngine.mjs';
import { handleRosterIgnWelcomeUpdate } from './welcomeCardEngine.mjs';

// Protected Leadership & Admin IDs that must NEVER have their nickname modified by auto-sync
export const PROTECTED_MEMBER_IDS = new Set([
  '1533703991882416373', // Jonesy / st1LLkill3r (The Half Life's Clan Leader)
  '1414143825538191373', // Krylo / KryloMCYT (Supreme Creator & Co-Leader)
]);

// Common English words that must NEVER be extracted as valid Minecraft IGNs
const STOPWORDS = new Set([
  'like', 'that', 'this', 'here', 'there', 'what', 'when', 'where', 'good', 'well',
  'name', 'user', 'team', 'clan', 'leader', 'owner', 'admin', 'moderator', 'staff',
  'mine', 'your', 'ours', 'them', 'they', 'dont', 'cant', 'wont', 'just', 'some',
  'more', 'play', 'help', 'wait', 'with', 'from', 'have', 'said', 'tell', 'know',
  'about', 'think', 'again', 'right', 'wrong', 'yeah', 'okay', 'sure', 'fine', 'cool',
  'game', 'server', 'smp', 'life', 'dead', 'kill', 'died', 'base', 'raid', 'loot'
]);

export function extractIgn(content, isRosterChannel = false) {
  if (!content) return null;
  const trimmed = content.trim();

  // Pattern 1: Command prefix (e.g. !ign Steve, !mcign Steve, !setign Steve) - Allowed in any channel
  const cmdMatch = trimmed.match(/^!(?:ign|mcign|setign)\s+`?([a-zA-Z0-9_]{3,16})`?$/i);
  if (cmdMatch) {
    const candidate = cmdMatch[1];
    if (!STOPWORDS.has(candidate.toLowerCase())) return candidate;
  }

  // Conversational and loose patterns are STRICTLY restricted to dedicated roster/verification channels!
  // In normal chat channels (#team-chat, #general, etc.), we NEVER parse normal sentences as IGNs.
  if (!isRosterChannel) {
    return null;
  }

  // Pattern 2: Explicit label inside roster channels (e.g. "IGN: Steve", "MC IGN: Steve", "Minecraft IGN: Alex")
  const labeledMatch = trimmed.match(/(?:(?:minecraft|mc)\s*ign|\bign\b)\s*[:=\-]\s*`?([a-zA-Z0-9_]{3,16})`?/i);
  if (labeledMatch) {
    const candidate = labeledMatch[1];
    if (!STOPWORDS.has(candidate.toLowerCase())) return candidate;
  }

  // Pattern 3: Strict conversational inside roster channels (e.g. "My IGN is Steve", "My MC username is Alex")
  // Requires explicit "is", "=", or ":"
  const phraseMatch = trimmed.match(/^my\s*(?:minecraft\s*|mc\s*)?(?:ign|name|username)\s*(?:is|=|:)\s*`?([a-zA-Z0-9_]{3,16})`?$/i);
  if (phraseMatch) {
    const candidate = phraseMatch[1];
    if (!STOPWORDS.has(candidate.toLowerCase())) return candidate;
  }

  // Pattern 4: Standalone single-word IGN in dedicated roster channel
  if (/^[a-zA-Z0-9_]{3,16}$/.test(trimmed)) {
    if (!STOPWORDS.has(trimmed.toLowerCase())) {
      return trimmed;
    }
  }

  // Pattern 5: First line of a structured application form in dedicated roster channel
  const lines = trimmed.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 0 && /^[a-zA-Z0-9_]{3,16}$/.test(lines[0])) {
    if (!STOPWORDS.has(lines[0].toLowerCase())) {
      return lines[0];
    }
  }

  return null;
}

export async function handleRosterMessage(message) {
  if (!message.guild || message.author.bot) return false;

  // Immunize Leadership & Protected Members
  if (PROTECTED_MEMBER_IDS.has(message.author.id)) {
    return false;
  }

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

    // Immunize server owners & admins
    if (message.guild.ownerId === member.id || member.permissions.has('Administrator')) {
      return false;
    }

    // 🧠 Learn member IGN into persistent server AI memory
    learnServerFact(
      message.guild.id,
      `member_${member.id}`,
      `Discord user @${member.user.username} (${member.user.tag}) has verified Minecraft IGN: "${ign}".`,
      'Roster Sync'
    );

    // Trigger live update of Welcome Card in #welcome
    try {
      handleRosterIgnWelcomeUpdate(message.guild, member.id, ign).catch(err => {
        console.warn('[RosterAutoNick] Welcome Card update notice:', err.message);
      });
    } catch (_) {}

    // Already matches
    if (member.nickname === ign || (!member.nickname && member.user.username === ign)) {
      await message.react('✅').catch(() => {});
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
