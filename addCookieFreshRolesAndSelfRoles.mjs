import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = ['1531792924055048292', '1524878881918685405']; // Krishiv Studios & KryloSMP

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`🚀 Adding Full Cookie & Fresh Roles to Guild: ${guild.name} (${guild.id})...`);

      // 1. Full Role Hierarchy Definition
      const fullRoles = [
        // Staff & Executive
        { name: '👑 Founder & Studio Lead', color: '#ffaa00', hoist: true, permissions: [PermissionFlagsBits.Administrator] },
        { name: '🛡️ Head Administrator', color: '#ff0055', hoist: true },
        { name: '⚔️ Senior Moderator', color: '#0088ff', hoist: true },
        { name: '🛠️ Developer / Builder', color: '#00f2ff', hoist: true },
        
        // VIP & Boosters
        { name: '💎 Server Booster', color: '#f47fff', hoist: true },
        { name: '⭐ VIP Client', color: '#ff8800', hoist: true },
        { name: '🏆 Tournament Champion', color: '#ffff00', hoist: true },

        // Level & Activity Roles
        { name: '🌟 Level 50 Legend', color: '#ffaa00', hoist: true },
        { name: '🔥 Level 25 Veteran', color: '#00f2ff', hoist: true },
        { name: '⚡ Level 10 Active', color: '#00ff88', hoist: false },

        // Ping / Notification Roles
        { name: '🔔 Announcement Ping', color: '#00f2ff', hoist: false },
        { name: '🎉 Giveaway Ping', color: '#ffaa00', hoist: false },
        { name: '🎪 Event Ping', color: '#ff00aa', hoist: false },
        { name: '🔴 Stream/YouTube Ping', color: '#ff0000', hoist: false },

        // Game & Platform Roles
        { name: '☕ Java Edition Player', color: '#00ff88', hoist: false },
        { name: '📱 Bedrock Edition Player', color: '#0088ff', hoist: false },
        { name: '⚔️ PvP Specialist', color: '#ff0055', hoist: false },
        { name: '🏰 Master Builder', color: '#ffaa00', hoist: false }
      ];

      for (const rData of fullRoles) {
        const existing = guild.roles.cache.find(r => r.name === rData.name);
        if (!existing) {
          await guild.roles.create({
            name: rData.name,
            color: rData.color,
            hoist: rData.hoist,
            permissions: rData.permissions || []
          });
          console.log(`Created role: ${rData.name}`);
        }
      }

      // 2. Post Self-Role Selection Menu Embed into #roles
      const channels = await guild.channels.fetch();
      const rolesChan = channels.find(c => (c.name.includes('roles') || c.name.includes('verify')) && c.isTextBased());

      if (rolesChan) {
        console.log(`Posting Self-Role Selection Menu in #${rolesChan.name}...`);

        const embed = new EmbedBuilder()
          .setTitle("🌍 SELF-ROLE SELECTION CENTER")
          .setDescription("Click the buttons below to toggle your notification pings and gaming platform roles!")
          .addFields(
            { name: "🔔 Notification Pings", value: "• Announcement Ping\n• Giveaway Ping\n• Event Ping\n• Stream/YouTube Ping" },
            { name: "🎮 Gaming Platforms", value: "• Java Edition Player\n• Bedrock Edition Player" }
          )
          .setColor(0x00F2FF)
          .setFooter({ text: `${guild.name} • Self-Role System`, iconURL: guild.iconURL() });

        const row1 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("role_announcement").setLabel("🔔 Announcement Ping").setStyle(ButtonStyle.Primary),
          new ButtonBuilder().setCustomId("role_giveaway").setLabel("🎉 Giveaway Ping").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("role_event").setLabel("🎪 Event Ping").setStyle(ButtonStyle.Danger)
        );

        const row2 = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("role_java").setLabel("☕ Java Player").setStyle(ButtonStyle.Secondary),
          new ButtonBuilder().setCustomId("role_bedrock").setLabel("📱 Bedrock Player").setStyle(ButtonStyle.Secondary)
        );

        await rolesChan.send({ embeds: [embed], components: [row1, row2] }).catch(e => console.error(`Could not send to #${rolesChan.name}: ${e.message}`));
      }

    } catch (err) {
      console.error(`Error processing guild ${gId}:`, err.message);
    }
  }

  console.log(`✅ FULL COOKIE & FRESH ROLES & SELF-ROLE SYSTEM DEPLOYED!`);
  client.destroy();
});

client.login(token);
