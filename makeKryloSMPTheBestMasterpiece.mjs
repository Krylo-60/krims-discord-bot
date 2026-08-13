import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 REMOVE GOOGLE SHEET LINE FROM RULES EMBED (.MJS)
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const STORE_URL = 'https://krylosmp-store.web.app/';
const PORTAL_URL = 'https://krylosmp.web.app/';

client.once('ready', async () => {
  console.log('[+] Rules Embed Cleaner Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`🧹 UPDATING RULES EMBED FOR: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const rulesCh = guild.channels.cache.find(c => (c.name.includes('rules') || c.name.includes('welcome-and-rules')) && c.isTextBased());
      if (rulesCh) {
        const msgs = await rulesCh.messages.fetch({ limit: 10 }).catch(() => null);
        if (msgs && msgs.size > 0) await rulesCh.bulkDelete(msgs).catch(() => {});

        const rulesEmbed = new EmbedBuilder()
          .setAuthor({ name: 'KryloSMP Official Network Administration', iconURL: guild.iconURL() })
          .setTitle('📜 CONSTITUTION & GOVERNANCE LAWS OF KRYLOSMP')
          .setDescription(
            `Welcome to **KryloSMP** — the ultimate competitive survival network!\n\n` +
            `⚖️ **RULE 1: RESPECT & COMMUNITY DECORUM**\n` +
            `• Toxicity, hate speech, harassment, and targeted insults are strictly prohibited.\n\n` +
            `⚔️ **RULE 2: FAIR PLAY & ANTI-CHEAT POLICY**\n` +
            `• Hacking, x-raying, auto-clickers, item duplication, or exploit abuse result in an instant permanent ban.\n\n` +
            `🛒 **RULE 3: TRANSACTION & STORE INTEGRITY**\n` +
            `• Real-money trading (RMT) outside the official [**Web Store**](${STORE_URL}) is strictly forbidden.\n\n` +
            `*By playing on KryloSMP (\`KryloSmp.play.hosting\`), you agree to adhere to all governance rules.*`
          )
          .setColor(0xFFD700) // Gold
          .setThumbnail(guild.iconURL())
          .setFooter({ text: 'KryloSMP Executive Administration • Master Governance Active', iconURL: guild.iconURL() })
          .setTimestamp();

        const rulesRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder().setLabel('🛒 Web Store').setStyle(ButtonStyle.Link).setURL(STORE_URL),
          new ButtonBuilder().setLabel('🌐 Player Portal').setStyle(ButtonStyle.Link).setURL(PORTAL_URL)
        );

        await rulesCh.send({ embeds: [rulesEmbed], components: [rulesRow] });
        console.log(`  [+] Cleaned and re-sent Master Rules Embed to #${rulesCh.name}.`);
      }
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error updating rules embed:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
