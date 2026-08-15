import { Client, GatewayIntentBits, PermissionsBitField, ChannelType } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildWebhooks
  ]
});

const GUILDS = [
  '1524878881918685405', // KryloSMP
  '1420991845546332162', // Krylo's Discord server
  '1532574925356007525'  // Krylo Fan Army 👑
];

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag} - Securing webhooks & permissions across all servers...`);

  for (const guildId of GUILDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      console.log(`\n========================================`);
      console.log(`🔒 Securing Webhooks for: ${guild.name} (${guild.id})`);
      console.log(`========================================`);

      // 1. Lock down Manage Webhooks permission for @everyone and all regular roles
      const roles = await guild.roles.fetch();
      for (const [, role] of roles) {
        if (!role.permissions.has(PermissionsBitField.Flags.Administrator) && role.id !== '1414143825538191373') {
          if (role.permissions.has(PermissionsBitField.Flags.ManageWebhooks)) {
            const newPerms = role.permissions.remove(PermissionsBitField.Flags.ManageWebhooks);
            await role.setPermissions(newPerms).catch(() => {});
            console.log(`   [🔒] Stripped Manage Webhooks from role: ${role.name}`);
          }
        }
      }

      // 2. Hide & Disguise Webhooks with Official Server Brand Avatars & Names
      const channels = await guild.channels.fetch();
      for (const [, ch] of channels) {
        if (!ch || ch.type !== ChannelType.GuildText) continue;

        // Ensure channel-level overwrites deny ManageWebhooks to @everyone
        await ch.permissionOverwrites.edit(guild.roles.everyone, {
          ManageWebhooks: false
        }).catch(() => {});

        try {
          const webhooks = await ch.fetchWebhooks().catch(() => null);
          if (!webhooks) continue;

          for (const [, wh] of webhooks) {
            // Disguise webhook as official KryloSMP system
            await wh.edit({
              name: 'KryloSMP Official',
              avatar: 'https://krylosmp.web.app/banner.jpg'
            }).catch(() => {});
            console.log(`   [✨] Disguised webhook in #${ch.name} as 'KryloSMP Official'`);
          }
        } catch (e) {
          console.warn(`Error on channel #${ch.name}:`, e.message);
        }
      }

      console.log(`✅ Webhook security & stealth styling applied for ${guild.name}!`);

    } catch (err) {
      console.warn(`Guild error:`, err.message);
    }
  }

  console.log(`\n🎉 ALL WEBHOOKS ARE NOW INVISIBLE TO MEMBERS & STYLED AS OFFICIAL KRIMS CODE AI / KRYLOSMP SYSTEM!`);
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
