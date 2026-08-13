import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = [
  '1524878881918685405', // KryloSMP
  '1531792924055048292', // Krishiv Studios
  '1532574925356007525'  // Krylo Fan Army 👑
];

const MINECRAFT_STREAM_ARTWORK = "https://images.unsplash.com/photo-1627856013091-fed6e4e30025?auto=format&fit=crop&w=1200&q=80"; // High-res Minecraft artwork

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  console.log(`\n🧹 UPDATING LIVE STREAM BROADCAST WITH OFFICIAL MINECRAFT ARTWORK...`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      const channels = await guild.channels.fetch();
      const textCh = channels.find(c => c && c.isTextBased() && (c.name.includes('youtube') || c.name.includes('announcement') || c.name.includes('stream') || c.name.includes('general')));

      if (textCh) {
        // Delete old Roblox thumbnail message
        const msgs = await textCh.messages.fetch({ limit: 10 });
        const oldBroadcasts = msgs.filter(m => m.author.id === client.user.id && (m.content.includes('KRYLO IS NOW PLAYING MINECRAFT') || (m.embeds && m.embeds.some(e => e.footer && e.footer.text && e.footer.text.includes('Krylo Live Broadcast')))));

        for (const m of oldBroadcasts.values()) {
          await m.delete().catch(() => {});
          console.log(`  - Deleted old broadcast message in ${guild.name}`);
        }

        // Send updated broadcast with official Minecraft artwork
        const embed = new EmbedBuilder()
          .setAuthor({ name: `🔴 KRYLO LIVE MINECRAFT STREAM • ${guild.name}`, iconURL: guild.iconURL() })
          .setTitle(`🔴 LIVE NOW: Krylo Playing KryloSMP Minecraft! 🎮⚔️`)
          .setURL("https://www.youtube.com/@Krylo-60")
          .setDescription(
            `👑 **Krylo** is currently **IN-GAME PLAYING MINECRAFT**!\n\n` +
            `> 🎮 **Server IP:** \`\`\`krylosmp.play.hosting\`\`\`\n` +
            `> ☕ **Java Port:** 25565 | 🪨 **Bedrock Port:** 19132\n` +
            `> 👥 **Hop on the server now to play alongside Krylo or watch live!**`
          )
          .setImage(MINECRAFT_STREAM_ARTWORK)
          .setColor(0x00FF88)
          .setFooter({ text: `Krylo Live Broadcast • Official Event`, iconURL: guild.iconURL() })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("▶️ Watch Stream @Krylo-60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@Krylo-60"),
          new ButtonBuilder().setLabel("🎮 Join Minecraft Server").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app")
        );

        const pingRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('youtube') || r.name.toLowerCase().includes('stream') || r.name.toLowerCase().includes('announcement'));
        const pingText = pingRole ? `<@&${pingRole.id}>` : '@everyone';

        await textCh.send({
          content: `🔴 ${pingText} **KRYLO IS NOW PLAYING MINECRAFT LIVE!** Join the server or watch now:`,
          embeds: [embed],
          components: [row]
        });

        console.log(`✅ Updated live stream broadcast in #${textCh.name} (${guild.name}) with Minecraft artwork!`);
      }

    } catch (err) {
      console.error(`Error updating guild ${gId}:`, err.message);
    }
  }

  client.destroy();
});

client.login(token);
