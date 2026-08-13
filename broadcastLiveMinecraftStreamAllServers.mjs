import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const targetGuildIds = [
  '1524878881918685405', // KryloSMP
  '1531792924055048292', // Krishiv Studios
  '1532574925356007525'  // Krylo Fan Army 👑
];

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  console.log(`\n🔴 BROADCASTING LIVE MINECRAFT STREAM ACROSS ALL 3 SERVERS...`);

  for (const gId of targetGuildIds) {
    try {
      const guild = await client.guilds.fetch(gId);
      if (!guild) continue;

      console.log(`\nBroadcasting to server: "${guild.name}" (${guild.id})...`);
      const channels = await guild.channels.fetch();

      const textCh = channels.find(c => c && c.isTextBased() && (c.name.includes('youtube') || c.name.includes('announcement') || c.name.includes('stream') || c.name.includes('general')));

      if (textCh) {
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
          .setImage("https://i.ytimg.com/vi/UBT9cvXm_c4/maxresdefault.jpg")
          .setColor(0xFF0000)
          .setFooter({ text: `Krylo Live Broadcast • Official Event`, iconURL: guild.iconURL() })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel("▶️ Watch Stream @Krylo-60").setStyle(ButtonStyle.Link).setURL("https://www.youtube.com/@Krylo-60"),
          new ButtonBuilder().setLabel("🎮 Join Minecraft Server").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app")
        );

        const pingRole = guild.roles.cache.find(r => r.name.toLowerCase().includes('youtube') || r.name.toLowerCase().includes('stream') || r.name.toLowerCase().includes('announcement'));
        const pingText = pingRole ? `<@&${pingRole.id}>` : '@everyone';

        const msg = await textCh.send({
          content: `🔴 ${pingText} **KRYLO IS NOW PLAYING MINECRAFT LIVE!** Join the server or watch now:`,
          embeds: [embed],
          components: [row]
        });

        await msg.react('🔴').catch(() => {});
        await msg.react('🔥').catch(() => {});
        await msg.react('👍').catch(() => {});
        await msg.react('🚀').catch(() => {});

        console.log(`✅ Successfully posted live stream broadcast in #${textCh.name} (${guild.name})!`);
      } else {
        console.warn(`Could not find suitable stream text channel in ${guild.name}`);
      }

    } catch (err) {
      console.error(`Error broadcasting to guild ${gId}:`, err.message);
    }
  }

  // Set bot status to streaming mode
  try {
    client.user.setActivity('🔴 LIVE KryloSMP Minecraft!', { type: 1, url: 'https://www.youtube.com/@Krylo-60' });
    console.log(`✅ Set bot activity status to Streaming!`);
  } catch (e) {}

  console.log(`\n🏆 MULTI-SERVER LIVE STREAM BROADCAST COMPLETE!`);
  client.destroy();
});

client.login(token);
