import { Client, GatewayIntentBits, ChannelType, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers
  ]
});

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const channelRulesMap = {
  'rules': {
    title: '📜 CONSTITUTION OF KRYLOSMP — COMPREHENSIVE SERVER LAWS',
    color: '#8B0000',
    sections: [
      { header: 'SECTION I: ZERO TOLERANCE FOR HARASSMENT & TOXICITY', body: 'Treat all community members with respect. Discrimination, personal attacks, or doxxing result in immediate bans.' },
      { header: 'SECTION II: ABSOLUTE BAN ON HACKING & EXPLOITING', body: 'Using Killaura, X-ray, auto-clickers, or dupe glitches results in permanent inventory purges and IP bans.' },
      { header: 'SECTION III: COMBAT CODE & SAFE ZONE ETHICS', body: 'Combat logging leads to automatic death and drop. Abusing safe zone boundaries is strictly prohibited.' },
      { header: 'SECTION IV: STAFF AUTHORITY & TICKET PROTOCOL', body: 'Follow staff directives. Resolve moderation disputes privately inside `🎟️-open-ticket`.' },
      { header: 'SECTION V: ACCOUNT SECURITY & RMT BAN', body: 'Buying or selling in-game items or KryloCoins for real money outside the web store is strictly forbidden.' }
    ]
  },
  'default': {
    title: '🛡️ OFFICIAL KRYLOSMP CHANNEL GUIDELINES',
    color: '#00F2FF',
    sections: [
      { header: 'SECTION I: RESPECTFUL CONDUCT', body: 'Keep conversations welcoming, clean, and friendly for all members.' },
      { header: 'SECTION II: NO SPAM', body: 'Avoid flood messaging, mass caps, or repeating text in quick succession.' },
      { header: 'SECTION III: RELEVANT DISCUSSIONS', body: 'Keep chat strictly relevant to the designated purpose of this channel.' },
      { header: 'SECTION IV: NO PROMOTION', body: 'Unsolicited advertising of external Discord servers or links is prohibited.' },
      { header: 'SECTION V: FOLLOW GUIDELINES', body: 'Adhere to all server rules and staff instructions at all times.' }
    ]
  }
};

client.once('ready', async () => {
  console.log('[+] Apply To All Guilds Script Online as ' + client.user.tag);

  try {
    const guilds = Array.from(client.guilds.cache.values());
    console.log(`[+] Discovered ${guilds.length} Guilds connected to bot.\n`);

    for (const guild of guilds) {
      console.log(`\n👑 PROCESSING GUILD: ${guild.name} (${guild.id})...`);

      // 1. Lock permissions for all channels to sync with categories
      const channels = Array.from(guild.channels.cache.values());
      for (const ch of channels) {
        if (ch.type !== ChannelType.GuildCategory && ch.parent) {
          try {
            await ch.lockPermissions();
            console.log(`  🔒 Synced Permissions with Category: #${ch.name}`);
            await sleep(150);
          } catch (e) {}
        }
      }

      // 2. Post rules embeds to all text channels
      const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText);
      for (const [chId, channel] of textChannels) {
        const matchedKey = Object.keys(channelRulesMap).find(k => k !== 'default' && channel.name.includes(k));
        const ruleConfig = matchedKey ? channelRulesMap[matchedKey] : channelRulesMap['default'];

        try {
          const embed = new EmbedBuilder()
            .setColor(ruleConfig.color)
            .setTitle(ruleConfig.title)
            .setDescription(`### 📌 OFFICIAL #${channel.name.toUpperCase()} GUIDELINES\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

          ruleConfig.sections.forEach(sec => {
            embed.addFields({ name: sec.header, value: sec.body });
          });

          embed.setFooter({ text: 'KryloSMP Official Governance • Season 3' }).setTimestamp();

          await channel.send({ embeds: [embed] });
          console.log(`  📜 Posted Rules Embed to #${channel.name} in [${guild.name}]`);
          await sleep(300);
        } catch (e) {
          console.warn(`  [-] Skipped #${channel.name}: ${e.message}`);
        }
      }
    }

    console.log(`\n🏆 ALL GUILDS (INCLUDING KRYLOSMP) FULLY PROCESSED & SYNCED!`);
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
