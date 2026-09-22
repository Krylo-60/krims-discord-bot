import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const STATUS_FILE = path.join(__dirname, '..', 'data', 'platform_role_status.json');

const GUILD_ID = '1549875778575929446';
const KRYLO_USER_ID = '1414143825538191373';
const ROLES_CHANNEL_ID = '1549882278245564546';
const ROLES_MESSAGE_ID = '1549882354074521712';
const VERIFY_CHANNEL_ID = '1549918052513095682';
const VERIFY_MESSAGE_ID = '1550176534688440362';

const TWITCH_SUB_ROLE_ID = '1552083351953866845';
const TWITCH_CONN_ROLE_ID = '1552083350876061756';
const SPOTIFY_VIP_ROLE_ID = '1552084773340450907';
const SPOTIFY_CONN_ROLE_ID = '1552084772233150626';

function readStatus() {
  try {
    if (fs.existsSync(STATUS_FILE)) {
      return JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8'));
    }
  } catch (e) {}
  return { twitchPublic: false, spotifyPublic: false, lastUpdated: null };
}

function writeStatus(data) {
  try {
    const dir = path.dirname(STATUS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(STATUS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('[PlatformRoleStatus] Failed to write status file:', e);
  }
}

let currentStatus = readStatus();

export function getPlatformRoleStatus() {
  return currentStatus;
}

/**
 * Builds the updated #roles embed based on public/private status
 */
export async function syncRolesChannelEmbed(token) {
  try {
    const res = await fetch(`https://discord.com/api/v10/channels/${ROLES_CHANNEL_ID}/messages/${ROLES_MESSAGE_ID}`, {
      headers: { Authorization: `Bot ${token}` }
    });
    if (!res.ok) return false;
    const msg = await res.json();
    const embed = msg.embeds?.[0];
    if (!embed) return false;

    // Build the supporter field dynamically
    let supporterValue = 
      `<@&1549918001380331632> ↠ Verified subscribers to **[Krylo on YouTube](https://www.youtube.com/@krylomcyt?sub_confirmation=1)**.\n` +
      `*(💬 **Perk:** Being a subscriber gives you hoisted status & a higher chance of Krylo answering you!)*\n` +
      `<@&1549916920629825686> ↠ Dedicated Krylo fans & Skybase community supporters.\n` +
      `<@&1549918000352600076> ↠ Discord Linked Role for connected YouTube profiles.\n`;

    if (currentStatus.twitchPublic) {
      supporterValue += `\n<@&${TWITCH_SUB_ROLE_ID}> ↠ Verified subscribers to **Krylo on Twitch**!\n<@&${TWITCH_CONN_ROLE_ID}> ↠ Connected Twitch accounts.\n`;
    }

    if (currentStatus.spotifyPublic) {
      supporterValue += `\n<@&${SPOTIFY_VIP_ROLE_ID}> ↠ Followers of **Krylo on Spotify**!\n<@&${SPOTIFY_CONN_ROLE_ID}> ↠ Connected Spotify accounts.\n`;
    }

    if (!currentStatus.twitchPublic && !currentStatus.spotifyPublic) {
      supporterValue += `\n*(Note: Twitch and Spotify roles are currently in private reserve.)*\n`;
    }

    supporterValue += `\n👉 *Claim your subscriber & supporter roles in <#${VERIFY_CHANNEL_ID}>!*\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // Update field
    const supporterFieldIndex = embed.fields.findIndex(f => f.name.includes('YouTube & Krylo MC Supporters') || f.name.includes('Platform Supporters'));
    if (supporterFieldIndex !== -1) {
      embed.fields[supporterFieldIndex].name = (currentStatus.twitchPublic || currentStatus.spotifyPublic) 
        ? '🌟 YouTube, Twitch & Spotify Supporters' 
        : '🔴 YouTube & Krylo MC Supporters';
      embed.fields[supporterFieldIndex].value = supporterValue;
    }

    const patchRes = await fetch(`https://discord.com/api/v10/channels/${ROLES_CHANNEL_ID}/messages/${ROLES_MESSAGE_ID}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bot ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ embeds: [embed] })
    });
    return patchRes.ok;
  } catch (e) {
    console.error('[PlatformRoleStatus] Failed to sync roles embed:', e);
    return false;
  }
}

/**
 * Toggles a platform between Public and Private
 */
export async function setPlatformPublicStatus(platform, makePublic, token) {
  if (platform === 'twitch') {
    currentStatus.twitchPublic = makePublic;
  } else if (platform === 'spotify') {
    currentStatus.spotifyPublic = makePublic;
  } else if (platform === 'all') {
    currentStatus.twitchPublic = makePublic;
    currentStatus.spotifyPublic = makePublic;
  }
  currentStatus.lastUpdated = new Date().toISOString();
  writeStatus(currentStatus);

  // Sync #roles channel
  await syncRolesChannelEmbed(token);

  // Manage Krylo user profile role visibility
  const targetRoles = [];
  if (platform === 'twitch' || platform === 'all') targetRoles.push(TWITCH_SUB_ROLE_ID);
  if (platform === 'spotify' || platform === 'all') targetRoles.push(SPOTIFY_VIP_ROLE_ID);

  for (const rid of targetRoles) {
    if (makePublic) {
      // Assign to Krylo when public
      await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${KRYLO_USER_ID}/roles/${rid}`, {
        method: 'PUT',
        headers: { Authorization: `Bot ${token}` }
      });
    } else {
      // Remove from Krylo when private
      await fetch(`https://discord.com/api/v10/guilds/${GUILD_ID}/members/${KRYLO_USER_ID}/roles/${rid}`, {
        method: 'DELETE',
        headers: { Authorization: `Bot ${token}` }
      });
    }
  }

  return currentStatus;
}

/**
 * Handles button interactions for Platform Role Visibility
 */
export async function handlePlatformRoleInteraction(interaction) {
  if (!interaction.isButton()) return;
  const { customId } = interaction;
  const isOwner = interaction.user.id === KRYLO_USER_ID;
  const isAdmin = interaction.memberPermissions?.has(8n) || interaction.memberPermissions?.has(32n); // Admin or ManageGuild

  if (!isOwner && !isAdmin) {
    return await interaction.reply({
      content: '❌ Only Krylo or Administrators can change platform role visibility.',
      ephemeral: true
    });
  }

  const token = process.env.DISCORD_TOKEN;

  if (customId === 'btn_toggle_pub_twitch') {
    const nextState = !currentStatus.twitchPublic;
    await setPlatformPublicStatus('twitch', nextState, token);
    return await interaction.reply({
      content: nextState
        ? '🟣 **Twitch Role is now PUBLIC!**\n• Featured in <#1549882278245564546> directory.\n• Assigned to Krylo\'s profile.\n• Members can claim via verification.'
        : '🔒 **Twitch Role is now PRIVATE.**\n• Hidden from directory and unassigned from profile.',
      ephemeral: true
    });
  }

  if (customId === 'btn_toggle_pub_spotify') {
    const nextState = !currentStatus.spotifyPublic;
    await setPlatformPublicStatus('spotify', nextState, token);
    return await interaction.reply({
      content: nextState
        ? '🟢 **Spotify Role is now PUBLIC!**\n• Featured in <#1549882278245564546> directory.\n• Assigned to Krylo\'s profile.\n• Members can claim via verification.'
        : '🔒 **Spotify Role is now PRIVATE.**\n• Hidden from directory and unassigned from profile.',
      ephemeral: true
    });
  }

  if (customId === 'btn_pub_all_platforms') {
    await setPlatformPublicStatus('all', true, token);
    return await interaction.reply({
      content: '🌐 **All Supporter Roles (Twitch & Spotify) are now PUBLIC!**\n• Updated in <#1549882278245564546>.\n• Badges awarded to Krylo\'s profile.\n• Ready for members to verify & claim.',
      ephemeral: true
    });
  }

  if (customId === 'btn_hide_all_platforms') {
    await setPlatformPublicStatus('all', false, token);
    return await interaction.reply({
      content: '🔒 **All Supporter Roles (Twitch & Spotify) are now PRIVATE (Stealth Reserve).**\n• Hidden from public directories.\n• Unassigned from Krylo\'s profile.',
      ephemeral: true
    });
  }

  if (customId === 'btn_status_pub_platforms') {
    const s = getPlatformRoleStatus();
    return await interaction.reply({
      content: `📊 **Platform Supporter Roles Visibility:**\n• 🔴 **YouTube:** 🌐 **PUBLIC** (Sub verification active)\n• 🟣 **Twitch:** ${s.twitchPublic ? '🌐 **PUBLIC**' : '🔒 **PRIVATE RESERVE**'}\n• 🟢 **Spotify:** ${s.spotifyPublic ? '🌐 **PUBLIC**' : '🔒 **PRIVATE RESERVE**'}\n• **Last Modified:** ${s.lastUpdated ? `<t:${Math.floor(new Date(s.lastUpdated).getTime() / 1000)}:R>` : 'Never'}`,
      ephemeral: true
    });
  }
}

