import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';
import 'dotenv/config';

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

client.once('ready', async () => {
  console.log(`[+] Logged in as ${client.user.tag}`);
  try {
    const guild = await client.guilds.fetch(guildId);
    
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('🛡️ REAL-PLAYER DISCORD VERIFICATION & SOCIAL SPOTLIGHT 🛡️')
      .setDescription(
        '👑 **Welcome to KryloSMP — The Ultimate Cross-Platform Survival Network!**\n\n' +
        'To protect our community from spam bots and ensure only **100% REAL HUMAN PLAYERS** join the server:\n\n' +
        '### 🔑 How to Verify & Join in 2 Seconds:\n' +
        '1. Type `/verify username:<YourMinecraftName>` right here in Discord!\n' +
        '2. Get instant **@Verified** status in Discord.\n' +
        '3. Your username is automatically added to the server whitelist!\n' +
        '4. Claim **+500 KryloCoins & 16x Free Diamonds** in-game!\n\n' +
        '---\n\n' +
        '### 🌐 Server Connection Specs:\n' +
        '• **Java IP:** `KryloSmp.play.hosting` (Port: `25565`)\n' +
        '• **Bedrock / Mobile IP:** `KryloSmp.play.hosting` (Port: `19132`)\n' +
        '• **Version:** 1.26.2 (Paper Build #65)'
      )
      .setFooter({ text: 'KryloSMP • Real-Player Verification System' })
      .setTimestamp();

    const verifyCh = guild.channels.cache.find(c => c && c.name && c.name.includes('verify') && c.type === ChannelType.GuildText);
    const generalCh = guild.channels.cache.find(c => c && c.name && c.name.includes('general-chat') && c.type === ChannelType.GuildText);

    if (verifyCh) {
      await verifyCh.send({ embeds: [embed] });
      console.log(`[✅ Sent] Real-Player Verification Spotlight in #${verifyCh.name}`);
    }

    if (generalCh) {
      await generalCh.send({ embeds: [embed] });
      console.log(`[✅ Sent] Real-Player Verification Spotlight in #${generalCh.name}`);
    }

    client.destroy();
    process.exit(0);
  } catch (err) {
    console.error("[-] Broadcast error:", err.message);
    client.destroy();
    process.exit(1);
  }
});

client.login(token);
