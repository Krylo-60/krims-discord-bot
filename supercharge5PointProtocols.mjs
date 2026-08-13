import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const KRYLO_GUILD_ID = '1524878881918685405';
const KRYLO_EMOJI_ID = '1530370298262720722';
const KRYLO_EMOJI = `<:KryloSMP:${KRYLO_EMOJI_ID}>`;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const guild = await client.guilds.fetch(KRYLO_GUILD_ID);
    if (!guild) {
      console.error('KryloSMP guild not found!');
      process.exit(1);
    }

    console.log(`\n📜 SUPERCHARGING 5-POINT PROTOCOL EMBEDS FOR ALL KRYLOSMP CHANNELS...`);
    const channels = await guild.channels.fetch();
    const textChannels = channels.filter(c => c && c.isTextBased() && c.type !== ChannelType.GuildCategory);

    for (const [cId, ch] of textChannels) {
      // Skip special system channels like verify, status, stats
      if (['verify', 'server-status', 'live-stats-tracker', 'server-info'].some(name => ch.name.includes(name))) {
        continue;
      }

      try {
        const msgs = await ch.messages.fetch({ limit: 10 }).catch(() => null);
        const hasProtocol = msgs && msgs.some(m => m.embeds && m.embeds.some(e => e.footer && e.footer.text && e.footer.text.includes('5-Point Protocol')));

        if (!hasProtocol) {
          const cleanName = ch.name.replace(/[^a-zA-Z0-9-]/g, '').toUpperCase();
          const embed = new EmbedBuilder()
            .setTitle(`${KRYLO_EMOJI} 📌 #${ch.name.toUpperCase()} • OFFICIAL CHANNEL PROTOCOL`)
            .setDescription(`Welcome to **#${ch.name}** in KryloSMP! Please follow the 5 official channel guidelines below:`)
            .addFields(
              { name: '1️⃣ Channel Focus', value: `Keep all discussions strictly relevant to **${cleanName}**.` },
              { name: '2️⃣ Respect & Decorum', value: 'Treat all players and staff with respect. Toxicity and harassment are prohibited.' },
              { name: '3️⃣ Clean Chat & No Spam', value: 'Avoid excessive pings, message spamming, or advertising outside permitted channels.' },
              { name: '4️⃣ Community Safety', value: 'Never post unsafe links, personal info, or unauthorized software.' },
              { name: '5️⃣ Need Assistance?', value: 'Open a support ticket in <#1524882737230774332> if you need help from our staff team!' }
            )
            .setColor(0x00FF88)
            .setFooter({ text: `KryloSMP Channel Protocol • 5-Point Standards`, iconURL: guild.iconURL() })
            .setTimestamp();

          const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setLabel("🌐 Player Portal").setStyle(ButtonStyle.Link).setURL("https://krylosmp.web.app"),
            new ButtonBuilder().setLabel("🛒 Webstore").setStyle(ButtonStyle.Link).setURL("https://krylosmp-store.web.app")
          );

          await ch.send({ embeds: [embed], components: [row] });
          console.log(`✅ Posted 5-Point Protocol embed in #${ch.name}`);
        }
      } catch (e) {
        console.warn(`Could not process #${ch.name}: ${e.message}`);
      }
    }

    console.log(`\n🏆 ALL CHANNELS SUPERCHARGED WITH 5-POINT PROTOCOL EMBEDS!`);

  } catch (err) {
    console.error(`Error:`, err.message);
  }

  client.destroy();
});

client.login(token);
