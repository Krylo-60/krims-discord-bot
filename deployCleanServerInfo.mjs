import { 
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle 
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILD_IDS = ['1524878881918685405', '1538225337048236082'];

client.once('ready', async () => {
  console.log(`[Discord] Updating server info & clickable embeds as ${client.user.tag}...`);

  for (const guildId of GUILD_IDS) {
    try {
      const guild = await client.guilds.fetch(guildId).catch(() => null);
      if (!guild) continue;

      const channels = await guild.channels.fetch();
      const serverInfoChan = channels.find(c => c && c.name && c.name.includes('server-info'));
      
      if (serverInfoChan) {
        // Clear old messages
        const fetched = await serverInfoChan.messages.fetch({ limit: 10 }).catch(() => null);
        if (fetched && fetched.size > 0) {
          await serverInfoChan.bulkDelete(fetched).catch(() => {});
        }

        const embed = new EmbedBuilder()
          .setColor(0x00E5FF)
          .setAuthor({ name: '👑 KryloSMP Official Network • Connection Portal', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
          .setTitle('🌐 KRYLOSMP — OFFICIAL CONNECTION DETAILS')
          .setDescription(
            `Welcome to **KryloSMP**! Connect from any device on **Java Edition** or **Bedrock Edition (Mobile, Console, Windows)**.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `☕ **JAVA EDITION (PC / Mac)**\n` +
            `• Server Address: \`krylosmp.play.hosting\` *(or \`62.141.62.24:25754\`)*\n` +
            `• Version: **1.20.x – 1.21.x**\n\n` +
            `🪨 **BEDROCK EDITION (Phone, Tablet, Console, Win 10)**\n` +
            `• Server Address: \`krylosmp.play.hosting\`\n` +
            `• Port: \`43089\`\n\n` +
            `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `✨ **QUICK LINKS & SERVICES**\n` +
            `• 🛒 **Web Store:** [https://krylosmp-store.web.app](https://krylosmp-store.web.app)\n` +
            `• 📊 **Player Database:** [https://krylosmp.web.app](https://krylosmp.web.app)\n` +
            `• ⚔️ **FFA Combat Arena:** \`/ffa join\`\n` +
            `• 🏝️ **SkyBlock Worlds:** \`/is\``
          )
          .addFields(
            { name: '🌐 Domain IP', value: '`krylosmp.play.hosting`', inline: true },
            { name: '🔌 Direct Port', value: '`:25754`', inline: true },
            { name: '💎 Status', value: '`🟢 Online (24/7)`', inline: true }
          )
          .setFooter({ text: 'KryloSMP Executive Network • 1-Click Buttons Below' })
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('🛒 Open KC Store')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp-store.web.app'),
          new ButtonBuilder()
            .setLabel('📊 Player Database')
            .setStyle(ButtonStyle.Link)
            .setURL('https://krylosmp.web.app'),
          new ButtonBuilder()
            .setLabel('💬 Discord Invite')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/xYmyPxSx7u')
        );

        await serverInfoChan.send({ embeds: [embed], components: [row] });
        console.log(`[+] Posted updated clickable embed in ${guild.name} (#${serverInfoChan.name})`);
      }
    } catch (err) {
      console.error(`Error in guild ${guildId}:`, err.message);
    }
  }

  console.log('✅ Discord embeds successfully updated with interactive buttons!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
