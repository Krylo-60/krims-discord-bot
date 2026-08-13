import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 KRYLOSMP UNIQUE CHANNEL PROTOCOL & GUIDELINES DEPLOYER (.MJS)
 * Deletes old messages in ALL channels and posts 100% unique custom guideline embeds!
 */

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages
  ]
});

const STORE_URL = 'https://krylosmp-store.web.app/';
const PORTAL_URL = 'https://krylosmp.web.app/';

// Unique Protocol Map for all channel types
const CHANNEL_PROTOCOLS = {
  'rules': {
    title: '📌 KRYLOSMP OFFICIAL EXECUTIVE RULEBOOK & CODE OF CONDUCT',
    color: 0xFF3366,
    desc: `Welcome to **KryloSMP**! To ensure a fun, safe, and competitive environment for all players, you must adhere strictly to these rules:\n\n` +
          `1️⃣ **NO HACKING / CHEATING**: Unfair advantages (X-Ray, KillAura, Fly, Autoclicker > 15 CPS) result in a permanent ban.\n` +
          `2️⃣ **NO TOXICITY / SLURS**: Respect all players. Hate speech, extreme toxicity, and harassment will not be tolerated.\n` +
          `3️⃣ **NO SCAMMING REAL MONEY**: In-game item trading is allowed, but real-money scams will result in immediate blacklisting.\n` +
          `4️⃣ **RESPECT STAFF DECISIONS**: Staff members enforce safety. If you believe a punishment was unfair, open a ticket in <#🎫┃support-tickets>.\n` +
          `5️⃣ **FAIR PLAY IN FACTIONS**: Exploiting bugs or duping items is strictly prohibited and will trigger a world roll-back.\n\n` +
          `*Violation of rules will result in mutes, temp-bans, or permanent network blacklisting.*`
  },
  'server-announcements': {
    title: '📢 KRYLOSMP OFFICIAL NETWORK ANNOUNCEMENTS',
    color: 0xFFD700,
    desc: `Welcome to the official **Server Announcements** channel!\n\n` +
          `📢 **WHAT TO EXPECT HERE:**\n` +
          `• Official Season 1 Launch notices & countdowns\n` +
          `• Server maintenance windows & downtime alerts\n` +
          `• Community drop parties & admin abuse events\n` +
          `• Global economy resets & expansion updates\n\n` +
          `*Keep notifications enabled so you never miss a server update!*`
  },
  'youtube-announcements': {
    title: '📺 KRYLO OFFICIAL YOUTUBE & CONTENT HUB',
    color: 0xFF0000,
    desc: `Welcome to the official **YouTube Announcements** hub for @Krylo!\n\n` +
          `🎥 **CONTENT HIGHLIGHTS:**\n` +
          `• New KryloSMP YouTube video releases & SMP episodes\n` +
          `• Live stream broadcasts & community gameplay\n` +
          `• YouTube Shorts, PvP montages & build showcases\n\n` +
          `*Subscribe to the official Krylo YouTube channel and leave a like on videos!*`
  },
  'server-info': {
    title: 'ℹ️ KRYLOSMP SYSTEM INFORMATION & CONNECTIONS',
    color: 0x00F2FF,
    desc: `Everything you need to connect and play on **KryloSMP**!\n\n` +
          `🌐 **SERVER IP**: \`KryloSmp.play.hosting\`\n` +
          `🔌 **JAVA PORT**: \`25565\` | **BEDROCK PORT**: \`19132\`\n` +
          `🎮 **SUPPORTED VERSIONS**: \`Java & Bedrock 1.21.x\`\n` +
          `⚡ **HARDWARE SPECS**: High-frequency NVMe Nodes & 1Gbps Anti-DDoS Protection\n` +
          `📊 **PLAYER PORTAL**: \`https://krylosmp.web.app\`\n\n` +
          `*Join the server now and start your Season 1 journey!*`
  },
  'socials': {
    title: '🌐 OFFICIAL KRYLOSMP SOCIAL LINKS & PLATFORMS',
    color: 0x0088FF,
    desc: `Connect with the official **KryloSMP Community** across all platforms!\n\n` +
          `🔗 **OFFICIAL LINKS:**\n` +
          `• 🌐 **Player Portal**: [krylosmp.web.app](${PORTAL_URL})\n` +
          `• 🛒 **Web Store**: [krylosmp-store.web.app](${STORE_URL})\n` +
          `• 📺 **YouTube**: \`@Krylo_MC\`\n` +
          `• 💬 **Discord Server**: \`discord.gg/krylosmp\`\n\n` +
          `*Follow our official channels to stay connected!*`
  },
  'verify': {
    title: '✅ KRYLOSMP 3.0 AUTOMATED VERIFICATION PORTAL',
    color: 0x00FF77,
    desc: `Link your Minecraft account to Discord to gain full server access and claim your free launch rewards!\n\n` +
          `📋 **HOW TO VERIFY:**\n` +
          `1️⃣ Click the **\`✅ Verify Account\`** button below.\n` +
          `2️⃣ Receive your **unique 6-digit personal code** (e.g. \`482910\`).\n` +
          `3️⃣ Run \`/verify <code>\` in-game OR click **\`[➕ Link Account]\`** at [krylosmp.web.app](${PORTAL_URL})!\n\n` +
          `🎁 **VERIFICATION REWARDS:**\n` +
          `• **\`+500 KryloCoins\`** economy balance\n` +
          `• **\`💎 16x Diamonds\`** starter gear\n` +
          `• **\`🔥 OG Member\`** exclusive Discord role`
  },
  'new-updates': {
    title: '📢 KRYLOSMP SEASON 1 CHANGELOG & PATCH NOTES',
    color: 0x9D4EDD,
    desc: `Track all technical improvements, plugin updates, and game balance changes!\n\n` +
          `✨ **SEASON 1 HIGHLIGHTS:**\n` +
          `• Added 1-Click Verification Portal with personal 6-digit codes\n` +
          `• Expanded Faction War zones & Clan Vault economy\n` +
          `• Released Headhunter Bounty System (\`/bounty\`)\n` +
          `• Integrated Live Vercel Player Portal Database`
  },
  'general-chat': {
    title: '💬 KRYLOSMP GLOBAL COMMUNITY LOUNGE',
    color: 0x3A86EF,
    desc: `The main hangout spot for all **KryloSMP** members!\n\n` +
          `💬 **LOUNGE GUIDELINES:**\n` +
          `• Chat about Minecraft, SMP strategies, build ideas, and gaming\n` +
          `• Keep conversations friendly, respectful, and PG-13\n` +
          `• Avoid spamming, excessive caps, or self-promotion\n` +
          `• Use <#🤖┃bot-commands> for bot commands to keep general clean!`
  },
  'music-chat': {
    title: '🎵 KRYLOSMP MUSIC & AUDIO LOUNGE',
    color: 0x7209B7,
    desc: `Share your favorite music tracks, playlists, and audio vibes!\n\n` +
          `🎶 **CHANNEL PROTOCOL:**\n` +
          `• Post Spotify, YouTube, or Soundcloud song links\n` +
          `• Queue music bot commands in VC lounges\n` +
          `• Respect all music genres and tastes`
  },
  'media-clips': {
    title: '📷 KRYLOSMP CLIPS, SCREENSHOTS & FAN ART',
    color: 0xF72585,
    desc: `Showcase your best KryloSMP moments!\n\n` +
          `🎬 **WHAT TO POST HERE:**\n` +
          `• Insane PvP clutch videos & crystal combos\n` +
          `• Screenshots of your mega faction bases & builds\n` +
          `• YouTube Shorts, TikToks, and custom Krylo fan art\n\n` +
          `*The best clips will be featured on official Krylo socials!*`
  },
  'memes': {
    title: '😂 KRYLOSMP MEME VAULT & HUMOR ZONE',
    color: 0xFF9E00,
    desc: `Post funny KryloSMP memes, Minecraft humor, and gaming jokes!\n\n` +
          `😄 **RULES:**\n` +
          `• Keep memes lighthearted and funny\n` +
          `• No offensive, explicit, or targeted cyberbullying content`
  },
  'suggestions': {
    title: '💡 KRYLOSMP COMMUNITY SUGGESTIONS & FEEDBACK',
    color: 0xFFD166,
    desc: `Have a great idea to make KryloSMP even better?\n\n` +
          `💡 **HOW TO SUGGEST:**\n` +
          `• Post your plugin, event, or feature suggestion\n` +
          `• Explain why it benefits the server\n` +
          `• Community members will vote on your suggestion!`
  },
  'bot-commands': {
    title: '🤖 KRYLOSMP BOT COMMAND CENTER',
    color: 0x118AB2,
    desc: `Execute all bot commands here to keep general text channels clean!\n\n` +
          `⚡ **POPULAR COMMANDS:**\n` +
          `• \`/balance\` — Check your KryloCoins balance\n` +
          `• \`/daily\` — Claim your daily coin bonus\n` +
          `• \`/bounty\` — Place or claim headhunter bounties\n` +
          `• \`/work\` — Perform daily jobs to earn coins\n` +
          `• \`/gameboost\` — Optimize PC RAM for 100+ FPS Minecraft`
  },
  'store': {
    title: '🛒 KRYLOSMP OFFICIAL WEB STORE & VIP PACKAGES',
    color: 0x06D6A0,
    desc: `Upgrade your gameplay with exclusive ranks, crate keys, and cosmetics!\n\n` +
          `💎 **AVAILABLE PACKAGES:**\n` +
          `• **VIP Ranks**: VIP, VIP+, MVP, MVP+ (Permanent Perks)\n` +
          `• **Crate Keys**: Legendary, Mythic, God Crate Keys\n` +
          `• **Claim Blocks**: Expand your faction territory\n\n` +
          `🛒 **VISIT STORE**: [krylosmp-store.web.app](${STORE_URL})`
  },
  'item-trading': {
    title: '🤝 KRYLOSMP MARKETPLACE & ITEM TRADING',
    color: 0x2EC4B6,
    desc: `Buy, sell, and trade rare items safely with fellow players!\n\n` +
          `📦 **TRADING GUIDELINES:**\n` +
          `• Post what items you are selling (e.g. Netherite Armor, God Axes, Shulker Boxes)\n` +
          `• Specify your asking price in KryloCoins or barter items\n` +
          `• Conduct trades safely in-game using \`/trade\`!`
  },
  'jackpot-vault': {
    title: '💰 KRYLOSMP JACKPOT & VAULT LOUNGE',
    color: 0xFFB703,
    desc: `Track the server Jackpot pool and celebrate big wins!\n\n` +
          `🎰 **JACKPOT RULES:**\n` +
          `• Use \`/jackpot\` in <#🤖┃bot-commands> to enter the pool\n` +
          `• Winner takes the entire server coin pool!`
  },
  'bounty-board': {
    title: '🎯 KRYLOSMP HEADHUNTER BOUNTY BOARD',
    color: 0xD62828,
    desc: `Place or claim bounties on enemy players in the warzone!\n\n` +
          `🏹 **HOW BOUNTIES WORK:**\n` +
          `• Place a bounty using \`/bounty place <player> <amount>\`\n` +
          `• Eliminate the target in the PvP warzone to claim their bounty reward!`
  },
  'clan-recruitment': {
    title: '🛡️ KRYLOSMP FACTIONS & CLAN RECRUITMENT',
    color: 0x8B0000,
    desc: `Recruit warriors for your faction or find a mega clan to join!\n\n` +
          `🏰 **RECRUITMENT FORMAT:**\n` +
          `• **Clan Name & Tag**:\n` +
          `• **Leader**: @User\n` +
          `• **Requirements**: (e.g. 1.21 Crystal PvP skills, active 3+ hrs/day)\n` +
          `• **Base Type**: Mega Castle / Underground Bunker`
  },
  'clan-leaderboard': {
    title: '🏆 KRYLOSMP OFFICIAL CLAN RANKINGS',
    color: 0xFFD700,
    desc: `The top-ranked factions and clans on **KryloSMP**!\n\n` +
          `🏆 **LEADERBOARD CRITERIA:**\n` +
          `• Combined Clan Vault Net Worth (KryloCoins)\n` +
          `• Total Warzone Kills & Tournament Trophies\n` +
          `• Faction Territory Size`
  },
  'pvp-chat': {
    title: '⚔️ KRYLOSMP WARZONE & PVP ARENA CHAT',
    color: 0xE63946,
    desc: `Discuss combat setups, crystal PvP strategies, and set up 1v1 duels!\n\n` +
          `⚔️ **RULES:**\n` +
          `• Arrange duels fairly\n` +
          `• No trash-talking or toxicity after losing a fight`
  },
  'monthly-tournament': {
    title: '🏆 KRYLOSMP MONTHLY TOURNAMENT ARENA',
    color: 0xD4AF37,
    desc: `Official announcements and brackets for monthly server tournaments!\n\n` +
          `👑 **TOURNAMENT REWARDS:**\n` +
          `• **1st Place**: Tournament Champion Role + 100,000 KryloCoins + Store Voucher\n` +
          `• **2nd Place**: 50,000 KryloCoins + Mythic Key\n` +
          `• **3rd Place**: 25,000 KryloCoins`
  },
  'support-tickets': {
    title: '🎫 KRYLOSMP SUPPORT & HELP DESK',
    color: 0x4EA8DE,
    desc: `Need assistance from the official KryloSMP Staff Team?\n\n` +
          `🛠️ **TYPES OF SUPPORT:**\n` +
          `• **Account Verification & Whitelist Issues**\n` +
          `• **Web Store & Purchase Assistance**\n` +
          `• **Reporting Cheaters / Bug Exploits**\n` +
          `• **General Server Inquiries**\n\n` +
          `👇 Click **\`🎫 Open Ticket\`** below to create a private support channel!`
  }
};

client.once('ready', async () => {
  console.log('[+] Master Unique Protocol Deployer Online as ' + client.user.tag + '\n');

  try {
    for (const [, guild] of client.guilds.cache) {
      if (!guild.name.toLowerCase().includes('krylo')) continue;

      console.log(`=======================================================`);
      console.log(`🚀 DEPLOYING UNIQUE PROTOCOLS IN: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const channels = await guild.channels.fetch();
      const textChannels = channels.filter(c => c && c.isTextBased());

      for (const [, ch] of textChannels) {
        try {
          // 1. Bulk delete existing messages
          const msgs = await ch.messages.fetch({ limit: 50 }).catch(() => null);
          if (msgs && msgs.size > 0) {
            await ch.bulkDelete(msgs).catch(async () => {
              for (const [, m] of msgs) {
                await m.delete().catch(() => {});
              }
            });
          }

          // 2. Identify protocol key
          let matchedKey = 'general-chat';
          for (const key of Object.keys(CHANNEL_PROTOCOLS)) {
            if (ch.name.includes(key)) {
              matchedKey = key;
              break;
            }
          }

          const proto = CHANNEL_PROTOCOLS[matchedKey];

          const embed = new EmbedBuilder()
            .setAuthor({ name: 'KryloSMP Executive Network Protocol', iconURL: guild.iconURL() })
            .setTitle(proto.title)
            .setDescription(proto.desc)
            .setColor(proto.color)
            .setThumbnail(guild.iconURL())
            .setFooter({ text: `KryloSMP Official • #${ch.name}`, iconURL: guild.iconURL() })
            .setTimestamp();

          // Action Rows for interactive channels
          let components = [];
          if (matchedKey === 'verify') {
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('verify_user').setLabel('✅ Verify Account').setStyle(ButtonStyle.Success),
              new ButtonBuilder().setLabel('🌐 Player Portal').setStyle(ButtonStyle.Link).setURL(PORTAL_URL),
              new ButtonBuilder().setLabel('🛒 Web Store').setStyle(ButtonStyle.Link).setURL(STORE_URL)
            );
            components.push(row);
          } else if (matchedKey === 'support-tickets') {
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setCustomId('create_ticket').setLabel('🎫 Open Support Ticket').setStyle(ButtonStyle.Primary)
            );
            components.push(row);
          } else if (matchedKey === 'store') {
            const row = new ActionRowBuilder().addComponents(
              new ButtonBuilder().setLabel('🛒 Visit Web Store').setStyle(ButtonStyle.Link).setURL(STORE_URL)
            );
            components.push(row);
          }

          await ch.send({ embeds: [embed], components: components });
          console.log(`  [+] Successfully posted unique protocol in #${ch.name}!`);
        } catch (e) {
          console.warn(`  [-] Could not process #${ch.name}: ${e.message}`);
        }
      }

      console.log(`\n🏆 UNIQUE PROTOCOLS DEPLOYED IN [${guild.name}]!\n\n`);
    }

    console.log('🏆 ALL CHANNELS UPDATED WITH 100% UNIQUE CUSTOM PROTOCOLS!');
    process.exit(0);
  } catch (err) {
    console.error('[-] Error:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
