import { 
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, ChannelType 
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILD_ID = '1538225337048236082';

client.once('ready', async () => {
  const guild = await client.guilds.fetch(GUILD_ID).catch(() => null);
  if (!guild) {
    console.error('Guild not found');
    process.exit(1);
  }

  const channels = await guild.channels.fetch();
  const guideCh = channels.find(c => c.name.includes('server-guide'));
  const rulesCh = channels.find(c => c.name === '📌┃rules');

  // 1. Post Master Server Guide Embed
  if (guideCh && guideCh.type === ChannelType.GuildText) {
    const guideEmbed1 = new EmbedBuilder()
      .setColor(0x00E5FF)
      .setAuthor({ name: '👑 KryloSMP Network • Official Server Guide', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
      .setTitle('🗺️ WELCOME TO KRYLOSMP BETA RELEASE — OFFICIAL SERVER GUIDE')
      .setDescription(
        `Welcome to the official **KryloSMP Beta Testing & Staging Hub**!\n\n` +
        `This server is designed to test exclusive upcoming Minecraft features, private whitelist builds, 3D proximity voice chat, custom mystery crates, and community balance.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📍 **STEP 1: READ THE RULES & GET VERIFIED**\n` +
        `• Head over to <#${rulesCh?.id || 'rules'}> to review the community guidelines.\n` +
        `• Click the **\`[✅ I Agree to the Rules]\`** button to unlock all testing channels.\n\n` +
        `🎮 **STEP 2: MINECRAFT SERVER CONNECTION**\n` +
        `• **Java Server IP:** \`KryloSmp.play.hosting\` (Port: \`25565\`)\n` +
        `• **Bedrock Server IP:** \`KryloSmp.play.hosting\` (Port: \`19132\`)\n` +
        `• **Version:** 1.21.x Paper Engine (20.0 TPS Zero-Lag)\n\n` +
        `🎙️ **STEP 3: SIMPLE VOICE CHAT SETUP**\n` +
        `• Install the **Simple Voice Chat** client mod (or enable in Lunar/Badlion).\n` +
        `• Press **\`V\`** in-game to test your microphone and proximity audio!\n\n` +
        `🧪 **STEP 4: SUBMIT BUG REPORTS & FEEDBACK**\n` +
        `• Found a bug or exploit? Report it to earn exclusive **KryloCoins** and **[Pioneer]** perks!`
      )
      .setImage('https://krylosmp.web.app/banner.jpg')
      .setFooter({ text: 'KryloSMP Beta Guide • Designed by Krylo & Krishiv' })
      .setTimestamp();

    const guideRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_join_beta_roster')
        .setLabel('🧪 Join Beta Tester Roster')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🧪'),
      new ButtonBuilder()
        .setLabel('🌐 Web Portal')
        .setStyle(ButtonStyle.Link)
        .setURL('https://krylosmp.web.app/')
    );

    await guideCh.send({ embeds: [guideEmbed1], components: [guideRow] });
    console.log('✅ Posted Server Guide Embed in #📖┃server-guide');
  }

  // 2. Post Rules in #📌┃rules
  if (rulesCh && rulesCh.type === ChannelType.GuildText) {
    const rulesEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('📜 KRYLOSMP BETA RELEASE — COMMUNITY RULES')
      .setDescription(
        `By joining the Beta Testing Network, all players must abide by these rules:\n\n` +
        `🤝 **1. Respect & Decency:** Be kind to fellow testers and staff. Zero harassment or toxicity.\n` +
        `🎬 **2. Family-Friendly:** Keep all chat, usernames, and content clean and appropriate.\n` +
        `⛏️ **3. Testing Integrity:** Report all exploits and bugs. Do not abuse test glitches.\n` +
        `🚫 **4. No Spam or Unauthorized Ads:** Keep discussion focused on testing and community.\n` +
        `🛡️ **5. Staff Instructions:** Follow staff guidance at all times.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `👇 *Click below to agree and unlock your Beta Tester verification!*`
      )
      .setFooter({ text: 'KryloSMP Official Code of Conduct' });

    const rulesRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_agree_rules')
        .setLabel('✅ I Agree to the Rules')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅')
    );

    await rulesCh.send({ embeds: [rulesEmbed], components: [rulesRow] });
    console.log('✅ Posted Rules in #📌┃rules');
  }

  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
