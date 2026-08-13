import { Client, GatewayIntentBits, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 DEPLOY ULTRA-PROFESSIONAL ROLES & PERMISSIONS (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const roleHierarchy = [
  {
    name: '👑 OWNER',
    color: '#FFD700', // Gold
    hoist: true,
    mentionable: true,
    permissions: [PermissionFlagsBits.Administrator]
  },
  {
    name: '💎 ADMIN',
    color: '#9900FF', // Purple
    hoist: true,
    mentionable: true,
    permissions: [PermissionFlagsBits.Administrator]
  },
  {
    name: '🛡️ SENIOR MODERATOR',
    color: '#FF0055', // Crimson
    hoist: true,
    mentionable: true,
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.KickMembers,
      PermissionFlagsBits.BanMembers,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.DeafenMembers,
      PermissionFlagsBits.MoveMembers,
      PermissionFlagsBits.ViewAuditLog
    ]
  },
  {
    name: '🛡️ MODERATOR',
    color: '#FF5500', // Orange-Red
    hoist: true,
    mentionable: true,
    permissions: [
      PermissionFlagsBits.ManageMessages,
      PermissionFlagsBits.ModerateMembers,
      PermissionFlagsBits.MuteMembers,
      PermissionFlagsBits.ViewAuditLog
    ]
  },
  {
    name: '🎬 CREATOR / YOUTUBER',
    color: '#FF0000', // YouTube Red
    hoist: true,
    mentionable: false,
    permissions: [
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.UseExternalEmojis,
      PermissionFlagsBits.MentionEveryone
    ]
  },
  {
    name: '⭐ VIP / BOOSTER',
    color: '#F47FFF', // Nitro Pink
    hoist: true,
    mentionable: false,
    permissions: [
      PermissionFlagsBits.ChangeNickname,
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks,
      PermissionFlagsBits.UseExternalEmojis
    ]
  },
  {
    name: '⚔️ CLAN LEADER',
    color: '#00F2FF', // Cyan
    hoist: true,
    mentionable: false,
    permissions: [
      PermissionFlagsBits.AttachFiles,
      PermissionFlagsBits.EmbedLinks
    ]
  },
  {
    name: '✅ VERIFIED PLAYER',
    color: '#00FF88', // Neon Green
    hoist: true,
    mentionable: false,
    permissions: [
      PermissionFlagsBits.ViewChannel,
      PermissionFlagsBits.SendMessages,
      PermissionFlagsBits.ReadMessageHistory,
      PermissionFlagsBits.Connect,
      PermissionFlagsBits.Speak,
      PermissionFlagsBits.UseApplicationCommands,
      PermissionFlagsBits.AddReactions
    ]
  }
];

client.once('ready', async () => {
  console.log('[+] Role Architect Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`👑 DEPLOYING ULTRA-PRO ROLES & PERMISSIONS FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      for (let i = 0; i < roleHierarchy.length; i++) {
        const rDef = roleHierarchy[i];
        let role = guild.roles.cache.find(r => r.name.toLowerCase() === rDef.name.toLowerCase() || r.name.toLowerCase().includes(rDef.name.toLowerCase().replace(/[^a-z]/g, '')));

        if (!role) {
          role = await guild.roles.create({
            name: rDef.name,
            color: rDef.color,
            hoist: rDef.hoist,
            mentionable: rDef.mentionable,
            permissions: rDef.permissions,
            reason: 'Deploying ultra-professional role structure'
          });
          console.log(`  [+] Created Role: ${role.name} (Color: ${rDef.color})`);
        } else {
          await role.edit({
            name: rDef.name,
            color: rDef.color,
            hoist: rDef.hoist,
            mentionable: rDef.mentionable,
            permissions: rDef.permissions
          }).catch((err) => {
            console.warn(`  [-] Could not edit role ${rDef.name}: ${err.message}`);
          });
          console.log(`  [+] Updated Permissions & Style for Role: ${role.name}`);
        }
      }

      // Automatically assign @Krylo (Owner) the 👑 OWNER role
      const ownerId = guild.ownerId;
      if (ownerId) {
        try {
          const ownerMember = await guild.members.fetch(ownerId).catch(() => null);
          const ownerRole = guild.roles.cache.find(r => r.name.includes('OWNER'));
          if (ownerMember && ownerRole) {
            await ownerMember.roles.add(ownerRole);
            console.log(`  👑 Granted OWNER role to server owner (${ownerMember.user.tag})`);
          }
        } catch (e) {
          console.warn(`  [-] Could not assign owner role: ${e.message}`);
        }
      }

      console.log(`\n🏆 ROLE ARCHITECTURE COMPLETE IN [${guild.name}]!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error deploying roles:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
