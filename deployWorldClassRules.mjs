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
  console.log(`[+] Deploying World-Class Rules Embed across all guilds...`);

  for (const guildId of GUILD_IDS) {
    const guild = await client.guilds.fetch(guildId).catch(() => null);
    if (!guild) continue;
    console.log(`\n========================================\n👑 Deploying Rules to: ${guild.name}\n========================================`);

    const channels = await guild.channels.fetch();
    const rulesCh = channels.find(c => c && c.type === ChannelType.GuildText && (c.name.includes('rule') || c.name.includes('📌') || c.name.includes('📖')));

    if (rulesCh) {
      // Clean any existing messages first
      const msgs = await rulesCh.messages.fetch({ limit: 10 }).catch(() => null);
      if (msgs) {
        for (const [, m] of msgs) await m.delete().catch(() => {});
      }

      const rulesEmbed = new EmbedBuilder()
        .setColor(0xFFD700)
        .setAuthor({ name: '👑 KryloSMP Official Code of Conduct', iconURL: 'https://mc-heads.net/avatar/Krylo_MC/64' })
        .setTitle('📜 KRYLOSMP OFFICIAL COMMUNITY RULES & EULA')
        .setDescription(
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Welcome to **KryloSMP**! To ensure a fun, fair, and safe experience for everyone across Discord and Minecraft, all members must adhere to our official Code of Conduct.\n\n` +
          `💬 **SECTION 1: DISCORD COMMUNITY RULES**\n` +
          `• **1. Respect & Decency:** Treat all players and staff with respect. Hate speech, harassment, discrimination, or toxic behavior will result in an immediate ban.\n` +
          `• **2. No Spam or Mass Pinging:** Do not flood chat, spam caps, or mass-ping members/staff.\n` +
          `• **3. Appropriate Channels:** Use channels for their intended purpose (memes in \`#😂┃memes\`, clips in \`#📷┃media-clips\`, bot games in \`#🤖┃bot-commands\`).\n` +
          `• **4. No Unauthorized Advertising:** Advertising other Discord servers or sending unsolicited DMs is strictly prohibited.\n\n` +
          `⚔️ **SECTION 2: MINECRAFT IN-GAME CODE**\n` +
          `• **5. Fair Play (Zero Cheating):** Hacked clients, X-ray texture packs, auto-clickers, baritone bots, and macros are strictly banned.\n` +
          `• **6. No Griefing or Exploiting:** Duping items, abusing server bugs, or griefing claimed areas is forbidden. Report bugs in \`#🎫┃support-tickets\` for bounty rewards!\n` +
          `• **7. Combat Integrity:** Combat logging or abusing safe zones during PvP is penalized.\n\n` +
          `⚖️ **SECTION 3: STAFF & ENFORCEMENT**\n` +
          `• **8. Staff Compliance:** Respect staff decisions. If you need assistance, open a ticket in \`#🎫┃support-tickets\`.\n` +
          `━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `👇 *Click below to confirm you have read and agreed to the rules!*`
        )
        .setImage('https://krylosmp.web.app/banner.jpg')
        .setFooter({ text: 'KryloSMP Administration • Rule Violations are Logged' })
        .setTimestamp();

      const rulesRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('btn_agree_rules')
          .setLabel('✅ I Agree to the Rules')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
        new ButtonBuilder()
          .setLabel('🌐 View Server EULA & Portal')
          .setStyle(ButtonStyle.Link)
          .setURL('https://krylosmp.web.app/')
      );

      await rulesCh.send({ embeds: [rulesEmbed], components: [rulesRow] });
      console.log(`   [✅] Successfully Deployed Rules to #${rulesCh.name}`);
    }
  }

  console.log('\n🎉 RULES DEPLOYED ACROSS ALL 3 GUILDS!');
  process.exit(0);
});

client.login(process.env.DISCORD_TOKEN);
