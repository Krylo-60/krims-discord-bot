import { 
  Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, 
  ButtonBuilder, ButtonStyle, ChannelType 
} from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const GUILD_IDS = ['1524878881918685405', '1420991845546332162', '1532574925356007525'];

client.once('ready', async () => {
  console.log(`[+] Deploying Custom Official Rules Embed across all guilds...`);

  for (const guildId of GUILD_IDS) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) continue;
    console.log(`\n========================================\n👑 Deploying Rules to: ${guild.name}\n========================================`);

    const channels = await guild.channels.fetch();
    const rulesCh = channels.find(c => c && c.type === ChannelType.GuildText && (c.name.includes('rule') || c.name.includes('📌') || c.name.includes('📖')));

    if (rulesCh) {
      // Clean old messages
      const msgs = await rulesCh.messages.fetch({ limit: 10 }).catch(() => null);
      if (msgs) {
        for (const [, m] of msgs) await m.delete().catch(() => {});
      }

      const embed1 = new EmbedBuilder()
        .setColor(0x00E5FF)
        .setAuthor({ name: '👑 KryloSMP Official Network', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
        .setTitle('🌟 KRYLOSMP OFFICIAL SERVER RULES')
        .setDescription(
          `Welcome to the community! By joining, you agree to follow these rules and Discord’s Terms of Service & Community Guidelines.\n\n` +
          `🤝 **Be Respectful**\n` +
          `• Treat everyone with kindness.\n` +
          `• No harassment, bullying, hate speech, discrimination, or personal attacks.\n` +
          `• Respect different opinions and interests.\n\n` +
          `🎬 **Keep It Family-Friendly**\n` +
          `• This is a Minecraft community for all ages.\n` +
          `• No sexual, inappropriate, or extremely disturbing content.\n` +
          `• Keep usernames, profiles, and messages appropriate.\n` +
          `• Refrain from swearing please!\n\n` +
          `📜 **Follow Discord Rules**\n` +
          `• Follow all Discord Terms of Service and Community Guidelines.\n` +
          `• No illegal content, harmful content, or attempts to bypass moderation.\n\n` +
          `🚫 **No Spam or Unapproved Ads**\n` +
          `• No spam, excessive pings, or message flooding.\n` +
          `• Do not advertise servers, channels, or products without permission.\n` +
          `• No spam pinging the moderators, and no unnecessary mentioning of Krylo.\n\n` +
          `⛏️ **Minecraft Rules**\n` +
          `• Keep content related to Minecraft, gaming, videos, and the community.\n` +
          `• No hacking, cheating, scams, malicious files, or exploits.\n` +
          `• Keep builds and creations family-friendly.`
        );

      const embed2 = new EmbedBuilder()
        .setColor(0xFFD700)
        .setDescription(
          `🔒 **Protect Privacy**\n` +
          `• Never share personal information.\n` +
          `• Do not ask for passwords, addresses, school details, or private accounts.\n` +
          `• No impersonation of others without permission, including staff and/or creators.\n\n` +
          `🎥 **Respect Creators**\n` +
          `• Give credit for builds, art, videos, and ideas.\n` +
          `• Do not steal or claim others’ work as your own.\n` +
          `• No plagiarism (including AI).\n\n` +
          `📌 **Use Channels Correctly**\n` +
          `• Post in the appropriate channels.\n` +
          `• Avoid disrupting ongoing conversations.\n` +
          `• Spoiling video content/premieres is strictly punishable.\n\n` +
          `🛡️ **Respect Staff**\n` +
          `• Follow staff instructions at all times.\n` +
          `• Contact us privately in \`#🎫┃support-tickets\` if you have concerns.\n` +
          `• Do **NOT** ask about staff applications in public chat.\n\n` +
          `⚖️ **Enforcement & Sanctions**\n` +
          `Breaking rules can and will result in:\n` +
          `1️⃣ Warnings\n` +
          `2️⃣ Message removal\n` +
          `3️⃣ Timeouts\n` +
          `4️⃣ Temporary bans\n` +
          `5️⃣ Permanent removal\n` +
          `*Listen to our warnings or instructions when we give them and don’t make excuses. Don't ignore staff just because something isn't explicitly stated in the rules.*\n\n` +
          `🎲 **Gambling Policy**\n` +
          `On the KryloSMP network, we do **NOT** support, condone or encourage real-money gambling, betting or anything relating to that. We will take immediate action against anyone attempting to bypass this in any way.\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `*Help us keep this a fun, safe, and welcoming Minecraft community!* 🌎`
        )
        .setImage('https://krylosmp.web.app/banner.jpg')
        .setFooter({ text: 'KryloSMP Official Code of Conduct • Click below to agree' })
        .setTimestamp();

      const rulesRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_agree_rules')
          .setLabel('✅ I Agree to the Rules')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setLabel('🌐 View Server Portal')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp.web.app/')
      );

      await rulesCh.send({ embeds: [embed1, embed2], components: [rulesRow] });
      console.log(`   [✅] Successfully Deployed Custom Rules to #${rulesCh.name}`);
    }
  }

  console.log('\n🎉 ALL CUSTOM RULES DEPLOYED ACROSS ALL 3 GUILDS!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
