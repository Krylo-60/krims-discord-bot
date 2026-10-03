import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PENDING_FILE = path.join(__dirname, '..', 'data', 'twitch-pending-verifications.json');
const SUPPORTERS_FILE = path.join(__dirname, '..', 'data', 'twitch-beta-supporters.json');
const USERS_FILE = path.join(__dirname, '..', 'data', 'twitch-users.json');

const SKYBASE_GUILD_ID = '1549875778575929446';
const TWITCH_SUB_ROLE_ID = '1552083351953866845'; // 🟣 Skybase • Subbed to Krylo on Twitch (PAID)
const TWITCH_FOLLOW_ROLE_ID = '1555976589336903696'; // 🟣 Skybase • Following Krylo on Twitch (FOLLOWER)
const TWITCH_CONN_ROLE_ID = '1552083350876061756'; // 🔗 Twitch Connected (SHOWOFF)
const YT_SUB_ROLE_ID = '1549918001380331632'; // 🔴 Skybase • Subbed to Krylo on YouTube
const WARDEN_DECK_CHANNEL_ID = '1549883558208868373';
const TWITCH_VERIFY_CHANNEL_ID = '1555933857037951127';

// In-memory pending map: code -> { code, discordId, discordTag, syncNickname, createdAt, expiresAt }
let pendingVerifications = new Map();

// Load pending from disk if exists
try {
  if (fs.existsSync(PENDING_FILE)) {
    const raw = JSON.parse(fs.readFileSync(PENDING_FILE, 'utf8'));
    const now = Date.now();
    for (const [code, item] of Object.entries(raw)) {
      if (item.expiresAt > now) {
        pendingVerifications.set(code, item);
      }
    }
  }
} catch (e) {
  console.error('[TwitchVerification] Error loading pending file:', e.message);
}

function savePending() {
  try {
    const obj = {};
    const now = Date.now();
    for (const [code, item] of pendingVerifications.entries()) {
      if (item.expiresAt > now) {
        obj[code] = item;
      }
    }
    fs.writeFileSync(PENDING_FILE, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('[TwitchVerification] Error saving pending file:', e.message);
  }
}

export function loadSupporters() {
  try {
    if (fs.existsSync(SUPPORTERS_FILE)) {
      return JSON.parse(fs.readFileSync(SUPPORTERS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('[TwitchVerification] Error loading supporters:', e.message);
  }
  return {};
}

export function saveSupporters(data) {
  try {
    fs.writeFileSync(SUPPORTERS_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('[TwitchVerification] Error saving supporters:', e.message);
  }
}

/**
 * Generate or retrieve an active verification code for a Discord user ID
 */
export function generateVerificationCode(discordId, discordTag, syncNickname = false) {
  const now = Date.now();

  // Check if user already has an active, unexpired code
  for (const [code, item] of pendingVerifications.entries()) {
    if (item.discordId === discordId) {
      if (item.expiresAt > now) {
        // Update syncNickname preference if provided
        item.syncNickname = syncNickname;
        savePending();
        return item;
      } else {
        pendingVerifications.delete(code);
      }
    }
  }

  // Generate 6 segments of 4 characters (24 chars): SKY-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const segments = [];
  for (let s = 0; s < 6; s++) {
    let seg = '';
    for (let i = 0; i < 4; i++) {
      seg += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    segments.push(seg);
  }
  const code = `SKY-${segments.join('-')}`;

  const item = {
    code,
    discordId,
    discordTag,
    syncNickname: Boolean(syncNickname),
    createdAt: now,
    expiresAt: now + 15 * 60 * 1000 // 15 minutes expiration
  };

  pendingVerifications.set(code, item);
  savePending();
  return item;
}

/**
 * Toggle nickname synchronization for a user's pending code
 */
export function toggleNicknameSync(discordId) {
  const now = Date.now();
  for (const [code, item] of pendingVerifications.entries()) {
    if (item.discordId === discordId && item.expiresAt > now) {
      item.syncNickname = !item.syncNickname;
      savePending();
      return item;
    }
  }
  return null;
}

/**
 * Get active pending code for a user
 */
export function getActiveCodeForUser(discordId) {
  const now = Date.now();
  for (const [code, item] of pendingVerifications.entries()) {
    if (item.discordId === discordId && item.expiresAt > now) {
      return item;
    }
  }
  return null;
}

/**
 * Get all active pending codes
 */
export function getPendingCodesList() {
  const now = Date.now();
  const list = [];
  for (const [code, item] of pendingVerifications.entries()) {
    if (item.expiresAt > now) {
      list.push(item);
    } else {
      pendingVerifications.delete(code);
    }
  }
  return list;
}

/**
 * Process verification code received from Twitch stream chat
 */
export async function processTwitchChatCode(twitchUsername, twitchDisplayName, rawCode, discordClient, tags = null) {
  if (!rawCode) return { success: false, reason: 'missing_code' };

  let cleanCode = rawCode.trim().toUpperCase();
  const match = cleanCode.match(/SKY(?:-[A-Z0-9]{4}){1,6}/i);
  if (match) {
    cleanCode = match[0].toUpperCase();
  }
  const item = pendingVerifications.get(cleanCode);

  if (!item) {
    return { success: false, reason: 'invalid_code' };
  }

  if (item.expiresAt < Date.now()) {
    pendingVerifications.delete(cleanCode);
    savePending();
    return { success: false, reason: 'code_expired' };
  }

  // Verification matched! Remove from pending
  pendingVerifications.delete(cleanCode);
  savePending();

  const supporters = loadSupporters();
  const existing = supporters[item.discordId];

  // Detect subscriber status from Twitch chat tags
  const isSubscribed = Boolean(
    tags && (
      tags.subscriber === true ||
      tags.subscriber === '1' ||
      tags.badges?.subscriber !== undefined ||
      tags.badges?.founder !== undefined ||
      tags.badges?.broadcaster !== undefined
    )
  );

  let nicknameStatus = 'none';
  if (item.syncNickname) {
    const containsKrylo = /krylo/i.test(twitchDisplayName) || /krylo/i.test(twitchUsername);
    if (containsKrylo) {
      // NO WAY NICKNAME! Reject completely to prevent impersonation of Krylo
      nicknameStatus = 'blocked_krylo';
      console.log(`[TwitchVerification] 🛡️ Blocked nickname change for ${item.discordTag} — Name "${twitchDisplayName}" contains "Krylo"!`);
    } else {
      nicknameStatus = 'pending_apply';
    }
  }

  let memberObj = null;

  // Handle Discord guild actions
  if (discordClient) {
    try {
      const guild = await discordClient.guilds.fetch(SKYBASE_GUILD_ID).catch(() => null);
      if (guild) {
        memberObj = await guild.members.fetch(item.discordId).catch(() => null);
        if (memberObj) {
          // 1. Always assign Follower and Connected (Showoff) Roles
          await memberObj.roles.add(TWITCH_FOLLOW_ROLE_ID).catch(err => {
            console.error('[TwitchVerification] Error adding follow role:', err.message);
          });
          await memberObj.roles.add(TWITCH_CONN_ROLE_ID).catch(err => {
            console.error('[TwitchVerification] Error adding connected role:', err.message);
          });

          // 2. Assign Subbed Role ONLY if verified subscriber
          if (isSubscribed) {
            await memberObj.roles.add(TWITCH_SUB_ROLE_ID).catch(err => {
              console.error('[TwitchVerification] Error adding sub role:', err.message);
            });
          } else {
            // Remove sub role if user is not actively subscribed
            if (memberObj.roles.cache.has(TWITCH_SUB_ROLE_ID)) {
              await memberObj.roles.remove(TWITCH_SUB_ROLE_ID).catch(() => {});
            }
          }

          // 3. Handle Nickname Synchronization with strict "Krylo" guardrail
          if (nicknameStatus === 'pending_apply') {
            try {
              // If member is owner, Discord prevents bot from editing nickname
              if (guild.ownerId === item.discordId) {
                nicknameStatus = 'server_owner';
              } else {
                await memberObj.setNickname(twitchDisplayName);
                nicknameStatus = 'updated';
              }
            } catch (err) {
              console.error('[TwitchVerification] Nickname change failed:', err.message);
              nicknameStatus = 'permission_error';
            }
          }

          // 4. Check for Dual Supporter status (YouTube + Twitch)
          const hasYt = memberObj.roles.cache.has(YT_SUB_ROLE_ID);

          // 5. Send verification completion embed ONLY to Warden Deck (Owner, Admins & Mods)
          const wardenDeck = guild.channels.cache.get(WARDEN_DECK_CHANNEL_ID) || await guild.channels.fetch(WARDEN_DECK_CHANNEL_ID).catch(() => null);
          if (wardenDeck) {
            const rolesEquipped = [
              `<@&${TWITCH_FOLLOW_ROLE_ID}> *(Follower)*`,
              `<@&${TWITCH_CONN_ROLE_ID}> *(Connected Showoff)*`
            ];
            if (isSubscribed) {
              rolesEquipped.unshift(`<@&${TWITCH_SUB_ROLE_ID}> *(⭐ Paid/Prime Subscriber)*`);
            }

            const verifyEmbed = new EmbedBuilder()
              .setColor(isSubscribed ? 0x9146FF : 0x00D2D3)
              .setTitle('🎉 Twitch Stream Verification Complete! [STAFF AUDIT]')
              .setDescription(
                `A member has securely linked their Twitch account via live stream chat!\n\n` +
                `👤 **Discord Member:** <@${item.discordId}> (\`${item.discordTag}\`)\n` +
                `🟣 **Twitch Account:** [${twitchDisplayName}](https://twitch.tv/${twitchUsername.toLowerCase()})\n` +
                `💎 **Twitch Status:** ${isSubscribed ? '⭐ **Active Subscriber** (Paid / Prime / Founder)' : '🆓 **Follower / Viewer** (Free)'}\n` +
                `🎁 **Equipped Roles:**\n• ${rolesEquipped.join('\n• ')}\n\n` +
                (item.syncNickname 
                  ? (nicknameStatus === 'updated' 
                      ? `🏷️ **Nickname:** Updated to \`${twitchDisplayName}\`\n` 
                      : (nicknameStatus === 'blocked_krylo' 
                          ? `🛡️ **Nickname:** Blocked *(Contains "Krylo" - protected name)*\n` 
                          : '🏷️ **Nickname:** Kept original\n')) 
                  : '') +
                (hasYt ? `⭐ **DUAL SUPPORTER UNLOCKED!** Verified on both YouTube & Twitch! 👑\n` : '')
              )
              .setFooter({ text: "Krylo's Skybase • Staff Audit Log" })
              .setTimestamp();

            wardenDeck.send({ embeds: [verifyEmbed] }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('[TwitchVerification] Error updating Discord member:', err);
    }
  }

  // Save to supporters database
  supporters[item.discordId] = {
    discordId: item.discordId,
    discordTag: item.discordTag,
    twitchUsername: twitchUsername.toLowerCase(),
    twitchDisplayName: twitchDisplayName,
    isSubscribed,
    verifiedAt: new Date().toISOString(),
    syncNickname: item.syncNickname,
    nicknameStatus
  };
  saveSupporters(supporters);

  // Bonus starting KryloCoins for verified Twitch viewer
  try {
    let usersData = {};
    if (fs.existsSync(USERS_FILE)) {
      usersData = JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
    }
    const tKey = twitchUsername.toLowerCase();
    if (!usersData[tKey]) {
      usersData[tKey] = {
        username: tKey,
        points: isSubscribed ? 500 : 250, // Extra bonus for subscribers!
        messages: 0,
        lastDaily: null,
        wins: 0
      };
    } else {
      usersData[tKey].points = (usersData[tKey].points || 0) + (isSubscribed ? 250 : 100);
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(usersData, null, 2), 'utf8');
  } catch (e) {}

  return {
    success: true,
    entry: item,
    isSubscribed,
    twitchUsername,
    twitchDisplayName,
    nicknameStatus
  };
}

/**
 * Builds the verification embed and action buttons for Discord response
 */
export function buildVerificationResponse(item) {
  const expiresTimestamp = Math.floor(item.expiresAt / 1000);

  const embed = new EmbedBuilder()
    .setColor(0x9146FF)
    .setTitle('🟣 Twitch Stream Chat Verification')
    .setDescription(
      `To ensure total security and guarantee that you actually own your Twitch account, verification is done directly in the stream chat!\n\n` +
      `🔑 **Your Secure One-Time Code:**\n` +
      `# \`${item.code}\`\n` +
      `⏳ **Code Expires:** <t:${expiresTimestamp}:R> (<t:${expiresTimestamp}:t>)\n\n` +
      `📋 **How to Verify in 2 Easy Steps:**\n` +
      `1. Open Krylo's Twitch channel: **[twitch.tv/kryloplaysmc](https://twitch.tv/kryloplaysmc)**\n` +
      `2. Type this exact command in the stream chat:\n` +
      `   \`!link ${item.code}\`  *(or \`!verify ${item.code}\`)*\n\n` +
      `✨ As soon as you send that in chat, our Twitch bot will match your code, verify your account, and instantly equip:\n` +
      `• <@&${TWITCH_FOLLOW_ROLE_ID}> *(Twitch Follower)*\n` +
      `• <@&${TWITCH_CONN_ROLE_ID}> *(Twitch Connected Showoff)*\n` +
      `⭐ *If you are an active paid/Prime Twitch Subscriber, you will also automatically receive the exclusive <@&${TWITCH_SUB_ROLE_ID}> role!*\n\n` +
      `🏷️ **Server Nickname Sync:** ${item.syncNickname ? '🟢 **ENABLED**' : '⚪ **DISABLED**'}\n` +
      `*When enabled, your Discord nickname will automatically match your Twitch display name upon verification.*\n` +
      `🛡️ *Security Rule: Any Twitch name containing "Krylo" cannot be set as a nickname to prevent impersonation.*`
    )
    .setFooter({ text: "Krylo's Skybase • Secure Account Linking" })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`btn_twitch_toggle_nick_${item.discordId}`)
      .setLabel(item.syncNickname ? '🏷️ Nickname Sync: ON' : '🏷️ Nickname Sync: OFF')
      .setStyle(item.syncNickname ? ButtonStyle.Success : ButtonStyle.Secondary),
    new ButtonBuilder()
      .setLabel('🟣 Open Twitch Stream')
      .setStyle(ButtonStyle.Link)
      .setURL('https://twitch.tv/kryloplaysmc'),
    new ButtonBuilder()
      .setCustomId(`btn_twitch_regen_${item.discordId}`)
      .setLabel('🔄 Get New Code')
      .setStyle(ButtonStyle.Primary)
  );

  return { embeds: [embed], components: [row] };
}
