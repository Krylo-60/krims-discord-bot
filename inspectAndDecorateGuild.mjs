import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = '1531792924055048292'; // Krishiv Studios Guild ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    if (!guild) {
      console.error(`Guild ${guildId} not found!`);
      process.exit(1);
    }

    console.log(`🔍 Inspecting Guild: ${guild.name} (${guild.id})...`);

    // 1. Add Extended Roles
    const extendedRoles = [
      { name: '👑 Founder & Studio Lead', color: '#ffaa00', hoist: true, permissions: [PermissionFlagsBits.Administrator] },
      { name: '⚡ Bot Architect', color: '#00f2ff', hoist: true },
      { name: '🛠️ Skript & Plugin Developer', color: '#0088ff', hoist: true },
      { name: '🚀 Client / Customer', color: '#ff8800', hoist: true },
      { name: '⭐ VIP Client', color: '#ff00aa', hoist: true },
      { name: '💎 Server Booster', color: '#aa00ff', hoist: true },
      { name: '🤖 AI Agent Auto-Responder', color: '#00ffcc', hoist: false },
      { name: '🎉 Giveaway Winner', color: '#ffff00', hoist: false },
      { name: '✅ Verified Member', color: '#00ff88', hoist: false }
    ];

    console.log(`Updating Server Roles...`);
    for (const rData of extendedRoles) {
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

    // 2. Fetch All Channels and Decorate Empty/New Text Channels
    const channels = await guild.channels.fetch();
    console.log(`Found ${channels.size} channels in ${guild.name}:`);

    for (const [cId, channel] of channels) {
      if (!channel.isTextBased() || channel.type === 4) continue; // Skip categories/voice

      console.log(`- Checking #${channel.name} (${channel.id})...`);
      
      // Check last message or decorate empty text channels
      const messages = await channel.messages.fetch({ limit: 5 }).catch(() => null);

      if (!messages || messages.size === 0) {
        console.log(`✨ Decorating empty/new channel: #${channel.name}`);

        const embed = new EmbedBuilder()
          .setTitle(`📌 Welcome to #${channel.name}!`)
          .setDescription(`Official channel for **Krishiv Studios**. Share discussions, updates, and feedback related to ${channel.name.replace(/[^a-zA-Z0-9]/g, ' ')}.`)
          .setColor(0x00F2FF)
          .setFooter({ text: "Krishiv Studios • High Performance Discord & Web Engineering", iconURL: guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("🌐 Portfolio Website").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app"),
          new ButtonBuilder().setLabel("📝 Order Custom Bot").setStyle(ButtonStyle.Link).setURL("https://krishiv-new-portfoilo.vercel.app/#contact")
        );

        await channel.send({ embeds: [embed], components: [row] }).catch(e => console.error(`Could not send to ${channel.name}: ${e.message}`));
      }
    }

    console.log(`✅ INSPECTION & DECORATION COMPLETE FOR KRISHIV STUDIOS!`);
  } catch (err) {
    console.error("Error inspecting guild:", err.message);
  } finally {
    client.destroy();
  }
});

client.login(token);
