import { Client, GatewayIntentBits, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

/**
 * 👑 DEPLOY CUSTOM CHANNEL GUIDELINES TO ALL CHANNELS (.MJS)
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

const channelGuidelinesMap = {
  'welcome': {
    title: '👋 WELCOME TO KRYLOSMP NETWORK',
    desc: 'Welcome to the official **KryloSMP Discord Network**!\n\n• **Step 1**: Read the server constitution in <#1524882737230774332>\n• **Step 2**: Verify your account in <#1524882737230774332> to receive your personal 6-digit code!\n• **Step 3**: Connect in-game at `KryloSmp.play.hosting` and enjoy competitive survival!',
    color: 0x00FF88
  },
  'rules': {
    title: '📜 CONSTITUTION & GOVERNANCE LAWS OF KRYLOSMP',
    desc: 'Welcome to **KryloSMP**!\n\n⚖️ **RULE 1: RESPECT & COMMUNITY DECORUM**\n• Toxicity, hate speech, and targeted harassment are strictly forbidden.\n\n⚔️ **RULE 2: FAIR PLAY & ANTI-CHEAT POLICY**\n• Hacking, x-raying, auto-clickers, and duplication result in permanent bans.\n\n🛒 **RULE 3: TRANSACTION INTEGRITY**\n• Real-money trading (RMT) outside the official [**Web Store**](' + STORE_URL + ') is strictly prohibited.',
    color: 0xFFD700
  },
  'announcements': {
    title: '📢 OFFICIAL NETWORK ANNOUNCEMENTS & RELEASES',
    desc: 'Official network updates, maintenance schedules, season resets, and major feature releases are posted here by Executive Administration.\n\n• **Tip**: Reaction roles are available to turn on push notifications!',
    color: 0xFF4444
  },
  'official-links': {
    title: '🌐 OFFICIAL KRYLOSMP PORTALS & LINKS',
    desc: 'Access official KryloSMP resources below:\n\n• 🛒 **Web Store**: [' + STORE_URL + '](' + STORE_URL + ')\n• 🌐 **Player Portal**: [' + PORTAL_URL + '](' + PORTAL_URL + ')\n• 🎮 **Server IP**: `KryloSmp.play.hosting` (Java: 25565 | Bedrock: 19132)',
    color: 0x00F2FF
  },
  'verify': {
    title: '⚡ KRYLOSMP 3.0 — OFFICIAL VERIFICATION PORTAL',
    desc: 'Click **`✅ Verify Account`** below to generate your unique personal 6-digit verification code. Enter your code in-game via `/verify <code>` or on the [**Player Portal**](' + PORTAL_URL + ') to unlock all server channels!',
    color: 0x00FF88
  },
  'general-chat': {
    title: '💬 GENERAL COMMUNITY CONDUCT & CHAT LAWS',
    desc: 'The main hub for community chat and general discussions!\n\n• Keep chat civil, friendly, and welcoming.\n• No excessive caps, spamming, or self-promotion.\n• Enjoy hanging out with fellow KryloSMP survivalists!',
    color: 0x5865F2
  },
  'memes': {
    title: '😂 MEMES & FUN MEDIA LOUNGE',
    desc: 'Share funny Minecraft memes, gaming humor, and community jokes!\n\n• Keep all posted memes SFW and appropriate for all ages.\n• No offensive or inappropriate content.',
    color: 0xFF007F
  },
  'media-clips': {
    title: '🎬 COMMUNITY MEDIA SHOWCASE & CREATOR HUB',
    desc: 'Post your KryloSMP YouTube videos, Twitch clips, base screenshots, and epic PvP highlights!\n\n• Creators can apply for the **`🎬 CREATOR / YOUTUBER`** role via support tickets.',
    color: 0xFF9900
  },
  'suggestions': {
    title: '💡 COMMUNITY SUGGESTIONS & FEEDBACK',
    desc: 'Propose feature ideas, economy balancing tweaks, or new plugins for KryloSMP!\n\n• Be clear and detailed in your proposals.\n• Community members can upvote ideas with reactions.',
    color: 0xFFFF00
  },
  'music-chat': {
    title: '🎵 MUSIC LOUNGE & AUDIO CORNER',
    desc: 'Discuss music tracks, queue bot songs in voice channels, and share your favorite playlists!',
    color: 0x00E5FF
  },
  'web-store': {
    title: '🛒 OFFICIAL KRYLOSMP WEB STORE & MARKETPLACE',
    desc: 'Unlock VIP ranks, claim blocks, crate keys, and custom perks at our official [**Web Store**](' + STORE_URL + ')!\n\n• Purchases deliver instantly in-game upon payment.',
    color: 0x00FFBB
  },
  'store': {
    title: '🛒 OFFICIAL KRYLOSMP WEB STORE & MARKETPLACE',
    desc: 'Unlock VIP ranks, claim blocks, crate keys, and custom perks at our official [**Web Store**](' + STORE_URL + ')!\n\n• Purchases deliver instantly in-game upon payment.',
    color: 0x00FFBB
  },
  'item-trading': {
    title: '🤝 PLAYER ITEM TRADING & MARKETPLACE',
    desc: 'Trade diamonds, netherite gear, enchanted books, and base resources safely with other players!\n\n• Always verify trade items before completing transactions.\n• Scamming is punishable by ban.',
    color: 0xFFAA00
  },
  'jackpot-vault': {
    title: '💰 KRYLOCOINS JACKPOT & ECONOMY VAULT',
    desc: 'Check your balance using `/balance`, claim daily coins via `/daily`, or gamble in the server Jackpot vault!',
    color: 0xFFD700
  },
  'bounty-board': {
    title: '🎯 BOUNTY BOARD & HEADHUNTER LOG',
    desc: 'Place bounties on rival players using `/bounty place <player> <amount>`. Slay targets in survival or PvP arenas to collect the jackpot!',
    color: 0xFF2200
  },
  'clan-chat': {
    title: '🏰 PRIVATE CLAN HUB & FACTION HEADQUARTERS',
    desc: 'Discuss clan tactics, recruit members, coordinate base builds, and dominate the server clan rankings!',
    color: 0x9D00FF
  },
  'clan-rankings': {
    title: '🏆 OFFICIAL CLAN LEADERBOARD & REPUTATION',
    desc: 'View top clans ranked by total kills, territory claims, and KryloCoins wealth using `/clan top`!',
    color: 0xFFD700
  },
  'pvp-arena-chat': {
    title: '⚔️ PVP ARENA & DUEL DISCUSSIONS',
    desc: 'Coordinate 1v1 duels, flex your combat stats, and challenge rivals in the PvP Arena!',
    color: 0xFF3300
  },
  'monthly-tournament': {
    title: '🏆 MONTHLY PVP TOURNAMENT & CHAMPIONSHIP',
    desc: 'Official monthly PvP tournament brackets, prize pools, and rules. Prepare your gear and compete for champion glory!',
    color: 0xFF0055
  },
  'tickets': {
    title: '🎟️ KRYLOSMP OFFICIAL SUPPORT TICKET CENTER',
    desc: 'Need staff assistance or AI help? Open a ticket in <#1524882737230774332> for 24/7 support!',
    color: 0x00FFFF
  },
  'bot-commands': {
    title: '🤖 KRYLOSMP INTERACTIVE BOT COMMAND CENTER',
    desc: 'Browse and execute slash commands (`/balance`, `/daily`, `/work`, `/clan`, `/status`). Click **`🔍 Check My Status`** below to view your account details!',
    color: 0x9D00FF
  }
};

client.once('ready', async () => {
  console.log('[+] Custom Channel Guidelines Deployer Online as ' + client.user.tag + '\n');

  try {
    const targetGuilds = Array.from(client.guilds.cache.values()).filter(g => g.name.toLowerCase().includes('krylo'));

    for (const guild of targetGuilds) {
      console.log(`=======================================================`);
      console.log(`📌 DEPLOYING CUSTOM GUIDELINES IN ALL CHANNELS: ${guild.name} (${guild.id})`);
      console.log(`=======================================================\n`);

      const textChannels = Array.from(guild.channels.cache.values())
        .filter(c => c.isTextBased() && !c.name.startsWith('ticket-'));

      for (const ch of textChannels) {
        try {
          // Find matching guidelines by channel name keywords
          let matchedKey = Object.keys(channelGuidelinesMap).find(k => ch.name.includes(k));
          if (!matchedKey) matchedKey = 'general-chat'; // default

          const info = channelGuidelinesMap[matchedKey];

          // Fetch existing messages to see if guidelines embed already posted
          const msgs = await ch.messages.fetch({ limit: 10 }).catch(() => null);
          const hasEmbed = msgs && msgs.some(m => m.author.id === client.user.id && m.embeds.length > 0 && m.embeds[0].title === info.title);

          if (!hasEmbed) {
            const embed = new EmbedBuilder()
              .setAuthor({ name: `KryloSMP Channel Protocol • #${ch.name}`, iconURL: guild.iconURL() })
              .setTitle(info.title)
              .setDescription(info.desc)
              .setColor(info.color)
              .setFooter({ text: 'KryloSMP Network Protocol • Read & Follow Guidelines', iconURL: guild.iconURL() })
              .setTimestamp();

            const row = new ActionRowBuilder();
            if (ch.name.includes('store') || ch.name.includes('link')) {
              row.addComponents(
                new ButtonBuilder().setLabel('🛒 Web Store').setStyle(ButtonStyle.Link).setURL(STORE_URL),
                new ButtonBuilder().setLabel('🌐 Player Portal').setStyle(ButtonStyle.Link).setURL(PORTAL_URL)
              );
            } else if (ch.name.includes('verify')) {
              row.addComponents(
                new ButtonBuilder().setCustomId('verify_user').setLabel('✅ Verify Account').setStyle(ButtonStyle.Success),
                new ButtonBuilder().setLabel('🌐 Player Portal').setStyle(ButtonStyle.Link).setURL(PORTAL_URL)
              );
            } else if (ch.name.includes('bot-commands')) {
              row.addComponents(
                new ButtonBuilder().setCustomId('check_status').setLabel('🔍 Check My Status').setStyle(ButtonStyle.Primary),
                new ButtonBuilder().setLabel('🌐 Player Portal').setStyle(ButtonStyle.Link).setURL(PORTAL_URL)
              );
            }

            const sendObj = { embeds: [embed] };
            if (row.components.length > 0) sendObj.components = [row];

            await ch.send(sendObj);
            console.log(`  [+] Posted custom protocol embed in #${ch.name}`);
          } else {
            console.log(`  [=] Protocol embed already exists in #${ch.name}, skipping.`);
          }
        } catch (e) {
          console.warn(`  [-] Could not post in #${ch.name}: ${e.message}`);
        }
      }

      console.log(`\n🏆 CUSTOM GUIDELINES DEPLOYED TO ALL CHANNELS IN [${guild.name}]!\n\n`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[-] Error deploying guidelines:', err.message);
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
