import dotenv from 'dotenv';
import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} from 'discord.js';

dotenv.config();

const KRIMS_CODE_ID = '1523794466740371586';
const GUILD_ID = '1538225337048236082';

const STORE_VERCEL_URL = 'https://krylosmp-store-website.vercel.app/';
const MAIN_PORTAL_URL = 'https://krylosmp.web.app/';
const STORE_MIRROR_URL = 'https://krylosmp-store.web.app/';
const BANNER_URL = 'https://krylosmp-store-website.vercel.app/official_banner.jpg';

const ksmpClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

const krimsClient = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

async function main() {
  console.log('[🚀 Migration] Logging in bots...');
  await Promise.all([
    ksmpClient.login(process.env.KSMP_BOT_TOKEN),
    krimsClient.login(process.env.DISCORD_TOKEN)
  ]);

  console.log(`[✅ Ready] Ksmp Bot: ${ksmpClient.user.tag} (${ksmpClient.user.id})`);
  console.log(`[✅ Ready] Krims Bot: ${krimsClient.user.tag} (${krimsClient.user.id})`);

  const ksmpGuild = await ksmpClient.guilds.fetch(GUILD_ID);
  const krimsGuild = await krimsClient.guilds.fetch(GUILD_ID);

  // Helper to delete messages sent by Krims Code AI in a channel
  async function purgeKrimsMessages(channelId, limit = 20) {
    try {
      const ch = await krimsGuild.channels.fetch(channelId).catch(() => null);
      if (!ch || !ch.isTextBased()) return 0;
      const msgs = await ch.messages.fetch({ limit }).catch(() => null);
      if (!msgs) return 0;
      const krimsMsgs = msgs.filter(m => m.author.id === KRIMS_CODE_ID);
      let count = 0;
      for (const m of krimsMsgs.values()) {
        await m.delete().catch(() => {});
        count++;
      }
      return count;
    } catch (e) {
      console.warn(`[Purge Warning #${channelId}]:`, e.message);
      return 0;
    }
  }

  // 1. Clean rogue chat chatter in general and level lounges
  console.log('[🧹 Step 1] Purging rogue Krims Code chatter from general & bot chats...');
  const chatterChannels = [
    '1542646245028401253', // 💬・general-chat
    '1542670957251010672', // ⚡・lvl-5-rookie-lounge
    '1542646336992837762', // 🤖・bot-commands
    '1544113931008741386'  // 🤖・ai-console-chat
  ];
  for (const chId of chatterChannels) {
    const deleted = await purgeKrimsMessages(chId, 30);
    console.log(`  Purged ${deleted} Krims messages in channel ${chId}`);
  }

  // 2. #💬・unverified-chat (1542661747272319057)
  console.log('[🚀 Step 2] Upgrading #💬・unverified-chat...');
  await purgeKrimsMessages('1542661747272319057', 30);
  const unverifiedCh = await ksmpGuild.channels.fetch('1542661747272319057');
  if (unverifiedCh) {
    const embed = new EmbedBuilder()
      .setColor(0x00F2FF)
      .setTitle('💬 KRYLOSMP — UNVERIFIED & GUEST CHAT LOUNGE')
      .setAuthor({
        name: 'KryloSMP Official Community Network • Guest Hub',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Welcome to **KryloSMP**! 👋\n\n` +
        `This channel is a public space for **new members and guests** to chat, ask questions, and meet the community before linking their Minecraft account.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `### 🚀 Ready to Unlock the Full Server?\n` +
        `• 🌐 **Server IP:** \`krylosmp.falix.gg:29273\` (Java & Bedrock)\n` +
        `• 💎 **Link Reward:** Claim **+1,000 KryloCoins ($Kr)** deposited instantly!\n` +
        `• 🔓 **Access:** Gain access to all **50+ community channels & voice lounges**!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
        `*Click the green button below to sync your Minecraft IGN and unlock the server!*`
      )
      .setImage(BANNER_URL)
      .setFooter({ text: 'KryloSMP Official • Built for Krylo 亗' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_ksmp_verify_modal')
        .setLabel('🎮 Sync Minecraft Account (+1,000 Kr)')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮'),
      new ButtonBuilder()
        .setLabel('🛒 Web Store & Hub')
        .setStyle(ButtonStyle.Link)
        .setURL(STORE_VERCEL_URL)
        .setEmoji('🛒'),
      new ButtonBuilder()
        .setLabel('📜 Server Rules')
        .setStyle(ButtonStyle.Link)
        .setURL(`${MAIN_PORTAL_URL}#rules`)
        .setEmoji('📜')
    );

    await unverifiedCh.send({ embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official KryloSMP Guest Lounge in #💬・unverified-chat');
  }

  // 3. #🛒・store (1542646306994921553)
  console.log('[🚀 Step 3] Upgrading #🛒・store...');
  await purgeKrimsMessages('1542646306994921553', 30);
  const storeCh = await ksmpGuild.channels.fetch('1542646306994921553');
  if (storeCh) {
    const embed = new EmbedBuilder()
      .setColor(0xF59E0B)
      .setTitle('🛒 KRYLOSMP — OFFICIAL SERVER STORE & WEB HUB')
      .setAuthor({
        name: 'KryloSMP Executive Network • Store & Marketplace',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Welcome to the official **KryloSMP Store & Marketplace**! 💎⚡\n` +
        `Our community economy is **100% Free-to-Play friendly** with in-game **KryloCoins ($Kr)**, plus manual real-money store support!\n\n` +
        `🌐 **OFFICIAL WEB HUBS:**\n` +
        `• 🚀 **Primary Store & Portal:** [krylosmp-store-website.vercel.app](${STORE_VERCEL_URL})\n` +
        `• 🌐 **Master Portal:** [krylosmp.web.app](${MAIN_PORTAL_URL})\n` +
        `• 🛒 **Store Mirror:** [krylosmp-store.web.app](${STORE_MIRROR_URL})\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `### 👑 IN-GAME LIFETIME RANKS:\n` +
        `• 👑 **Sovereign Rank** — \`$10.00\` or \`15,000 KC\` (6 Homes, /fly in Hub, Colored Chat, 5 Vaults)\n` +
        `• ⚔️ **Overlord Rank** — \`$7.50\` or \`10,000 KC\` (5 Homes, /hat, Nickname access, 4 Vaults)\n` +
        `• 🛡️ **Warlord Rank** — \`$5.00\` or \`6,500 KC\` (4 Homes, /near, 3 Vaults)\n` +
        `• 🗡️ **Champion Rank** — \`$3.00\` or \`3,500 KC\` (3 Homes, /feed, 2 Vaults)\n` +
        `• 🌟 **VIP Rank** — \`$1.50\` or \`1,500 KC\` (2 Homes, /craft, 1 Vault)\n\n` +
        `### 📦 CRATE KEYS & BUNDLES:\n` +
        `• 🌟 **Godly Crate Keys** — \`$2.50\` or \`2,500 KC\` (Guaranteed Tier-5 Netherite Enchants)\n` +
        `• 💎 **Mythic Crate Keys** — \`$1.00\` or \`1,000 KC\` (Custom Talismans & Totems)\n` +
        `• 🗝️ **Rare Crate Keys** — \`$0.50\` or \`500 KC\` (Diamond Gear & Essentials)\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Need assistance with an order or paying with PayPal / UPI? Open a ticket below!*`
      )
      .setImage(BANNER_URL)
      .setFooter({ text: 'KryloSMP Store • Crossplay Java & Bedrock' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Open Official Web Store')
        .setStyle(ButtonStyle.Link)
        .setURL(STORE_VERCEL_URL)
        .setEmoji('🌐'),
      new ButtonBuilder()
        .setCustomId('btn_ksmp_ticket_store')
        .setLabel('🎫 Open Store Ticket')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎫'),
      new ButtonBuilder()
        .setCustomId('btn_ksmp_verify_modal')
        .setLabel('🎮 Sync Account')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮')
    );

    await storeCh.send({ embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official KryloSMP Store Hub in #🛒・store');
  }

  // 4. #📌・rules (1542646197100224552)
  console.log('[🚀 Step 4] Upgrading #📌・rules...');
  await purgeKrimsMessages('1542646197100224552', 30);
  const rulesCh = await ksmpGuild.channels.fetch('1542646197100224552');
  if (rulesCh) {
    const embed = new EmbedBuilder()
      .setColor(0xEF4444)
      .setTitle('📌 KRYLOSMP — OFFICIAL COMMUNITY RULES & GUIDELINES')
      .setAuthor({
        name: 'KryloSMP Governance & Server Policy',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Welcome to **KryloSMP**! To ensure a safe, fun, and competitive environment for all players, everyone must abide by these 9 official guidelines.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚖️ **1. RESPECT & FAIR PLAY**\n` +
        `• Toxicity, hate speech, targeted harassment, racism, and doxxing result in an immediate permanent ban.\n\n` +
        `🚫 **2. NO SPAM OR SELF-PROMOTION**\n` +
        `• Advertising external servers, unsolicited DMs, and spamming chat channels are strictly prohibited.\n\n` +
        `🔒 **3. ACCOUNT & SECURITY**\n` +
        `• You are solely responsible for your account. Never share passwords or session credentials.\n\n` +
        `⚔️ **4. NO HACKING OR UNFAIR ADVANTAGES**\n` +
        `• Absolutely no hacked clients (Meteor, Aristois), X-Ray packs, KillAura, Baritone, Flight, or macro automation.\n\n` +
        `🐛 **5. NO BUG ABUSE OR DUPLICATION**\n` +
        `• Any item duplication, glitching, or exploit abuse leads to an instant ban & inventory wipe. Report bugs for KryloCoin bounties!\n\n` +
        `🗡️ **6. COMBAT & COMBAT-LOGGING**\n` +
        `• Combat-logging during active combat results in automatic death and full inventory drop.\n\n` +
        `🏰 **7. TRAP & SPAWN ETIQUETTE**\n` +
        `• Portal trapping or spawn-killing newly joined players within the protected perimeter is disallowed.\n\n` +
        `💵 **8. REAL MONEY TRADING (RMT) POLICY**\n` +
        `• Real money trading outside the official web store is prohibited.\n\n` +
        `🤝 **9. FAIR TRADING & SCAMMING**\n` +
        `• In non-anarchy gamemodes, bait-and-switch scamming is strictly forbidden.\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Live synced from our Web Portal at [krylosmp.web.app/#rules](${MAIN_PORTAL_URL}#rules).*`
      )
      .setFooter({ text: 'KryloSMP Policy • Synced Live from Database' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_ksmp_verify_modal')
        .setLabel('✅ I Agree & Understand')
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅'),
      new ButtonBuilder()
        .setCustomId('btn_ksmp_ticket_report')
        .setLabel('🛡️ Report Rulebreaker')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🛡️'),
      new ButtonBuilder()
        .setLabel('📜 Web Portal Policy')
        .setStyle(ButtonStyle.Link)
        .setURL(`${MAIN_PORTAL_URL}#rules`)
        .setEmoji('📜')
    );

    await rulesCh.send({ embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official KryloSMP Rules in #📌・rules');
  }

  // 5. #👋・welcome (1542646201684467885)
  console.log('[🚀 Step 5] Upgrading #👋・welcome...');
  await purgeKrimsMessages('1542646201684467885', 30);
  const welcomeCh = await ksmpGuild.channels.fetch('1542646201684467885');
  if (welcomeCh) {
    const embed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('👋 WELCOME TO KRYLOSMP NETWORK!')
      .setAuthor({
        name: 'KryloSMP Executive Network • Welcome Hub',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Welcome to **KryloSMP** — the ultimate crossplay Minecraft SMP experience! ⚔️🏰\n\n` +
        `🎮 **HOW TO GET STARTED:**\n` +
        `1️⃣ **Read Server Rules:** Review <#1542646197100224552> to stay safe.\n` +
        `2️⃣ **Link Your Account:** Head to <#1542646204658090054> and click Sync to claim **+1,000 KryloCoins ($Kr)**!\n` +
        `3️⃣ **Connect In-Game:** Join \`krylosmp.falix.gg:29273\` on Java or Bedrock.\n` +
        `4️⃣ **Explore the Web Hub:** Visit [krylosmp-store-website.vercel.app](${STORE_VERCEL_URL}) to browse ranks, worlds, and staff applications!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Have fun and make new memories on KryloSMP!* 🌟`
      )
      .setImage(BANNER_URL)
      .setFooter({ text: 'KryloSMP • Built for Krylo 亗' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_ksmp_verify_modal')
        .setLabel('🎮 Sync Minecraft Account')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮'),
      new ButtonBuilder()
        .setLabel('🌐 Official Web Portal')
        .setStyle(ButtonStyle.Link)
        .setURL(STORE_VERCEL_URL)
        .setEmoji('🌐')
    );

    await welcomeCh.send({ embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official KryloSMP Welcome card in #👋・welcome');
  }

  // 6. #📢・server-announcements (1542646207179001856)
  console.log('[🚀 Step 6] Upgrading #📢・server-announcements...');
  await purgeKrimsMessages('1542646207179001856', 30);
  const announceCh = await ksmpGuild.channels.fetch('1542646207179001856');
  if (announceCh) {
    const embed = new EmbedBuilder()
      .setColor(0x8B5CF6)
      .setTitle('🚀 OFFICIAL LAUNCH: UNIFIED WEB STORE & PORTAL IS LIVE!')
      .setAuthor({
        name: 'KryloSMP Executive Administration',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Attention @everyone! 👑\n\n` +
        `We are thrilled to officially unveil the **KryloSMP Unified Web Store & Server Portal**!\n\n` +
        `🌐 **Official Web Hub Links:**\n` +
        `• 🚀 **Primary Store & Portal:** [krylosmp-store-website.vercel.app](${STORE_VERCEL_URL})\n` +
        `• 🌐 **Master Web Portal:** [krylosmp.web.app](${MAIN_PORTAL_URL})\n` +
        `• 🛒 **Store Mirror:** [krylosmp-store.web.app](${STORE_MIRROR_URL})\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `✨ **HIGHLIGHTS & FEATURES:**\n` +
        `• ⚔️ **4 Active Gamemodes:** Lifesteal SMP, Redish BoxPvP, OneBlock, and Practice Duels!\n` +
        `• 💎 **100% Free-to-Play Economy:** Earn KryloCoins ($Kr) in-game & on Discord to unlock VIP ranks and crate keys!\n` +
        `• 🌐 **Seamless Crossplay:** Connect on Java (1.20 - 1.21.x) or Bedrock at \`krylosmp.falix.gg:29273\`!\n` +
        `• 🤖 **Dedicated KryloSMP Bot:** Instant account sync, nickname updates, and 24/7 ticket support!\n\n` +
        `🎁 **CLAIM +1,000 KRYLOCOINS:**\n` +
        `Head over to <#1542646204658090054> to link your account and claim your free **+1,000 Kr** starter reward!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Built to Inspire. Built to Dominate. Welcome to KryloSMP!* ⚡`
      )
      .setImage(BANNER_URL)
      .setFooter({ text: 'KryloSMP Official • Global Announcement' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Visit Web Store')
        .setStyle(ButtonStyle.Link)
        .setURL(STORE_VERCEL_URL)
        .setEmoji('🌐'),
      new ButtonBuilder()
        .setCustomId('btn_ksmp_verify_modal')
        .setLabel('🎮 Sync Minecraft Account')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮')
    );

    await announceCh.send({ content: '@everyone', embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official announcement in #📢・server-announcements');
  }

  // 7. #ℹ️・server-info (1542646211973218425)
  console.log('[🚀 Step 7] Upgrading #ℹ️・server-info...');
  await purgeKrimsMessages('1542646211973218425', 30);
  const infoCh = await ksmpGuild.channels.fetch('1542646211973218425');
  if (infoCh) {
    const embed = new EmbedBuilder()
      .setColor(0x00E5FF)
      .setTitle('🌐 KRYLOSMP — OFFICIAL SERVER SPECIFICATIONS')
      .setAuthor({
        name: 'KryloSMP Master Network • Connection Protocol',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Welcome to **KryloSMP**, the premier crossplay Minecraft community network! ⚔️\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `📡 **CONNECTION PROTOCOL:**\n` +
        `• **Server IP:** \`krylosmp.falix.gg\`\n` +
        `• **Java Edition Port:** \`29273\` (Default 25565 forwards)\n` +
        `• **Bedrock Edition Port:** \`29273\`\n` +
        `• **Supported Versions:** \`1.20.x — 1.21.x\` (Native 1.21.1)\n\n` +
        `🏰 **WORLDS & GAMEMODES:**\n` +
        `• ⚔️ **Lifesteal SMP:** High-stakes survival; kill players to steal hearts.\n` +
        `• 📦 **Redish BoxPvP:** 12 Progressive ore mines, custom crystal trading & instant kits.\n` +
        `• 🌱 **OneBlock:** Regenerating single floating block with 10+ biome phases & minions.\n` +
        `• 🎯 **Practice Duels:** Ranked 1v1 Elo matchmaking with Crystal & Nodebuff kits.\n\n` +
        `🌐 **WEB DIRECTORY:**\n` +
        `• 🛒 **Web Store & Hub:** [krylosmp-store-website.vercel.app](${STORE_VERCEL_URL})\n` +
        `• 🌐 **Master Portal:** [krylosmp.web.app](${MAIN_PORTAL_URL})\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setFooter({ text: 'KryloSMP Network • Online 24/7' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Master Web Portal')
        .setStyle(ButtonStyle.Link)
        .setURL(MAIN_PORTAL_URL)
        .setEmoji('🌐'),
      new ButtonBuilder()
        .setCustomId('btn_ksmp_verify_modal')
        .setLabel('🎮 Link In-Game Account')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮')
    );

    await infoCh.send({ embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official server info in #ℹ️・server-info');
  }

  // 8. #🌐・socials (1542646214972153939)
  console.log('[🚀 Step 8] Upgrading #🌐・socials...');
  await purgeKrimsMessages('1542646214972153939', 30);
  const socialsCh = await ksmpGuild.channels.fetch('1542646214972153939');
  if (socialsCh) {
    const embed = new EmbedBuilder()
      .setColor(0xFF0055)
      .setTitle('🌐 KRYLOSMP — OFFICIAL SOCIAL DIRECTORY')
      .setAuthor({
        name: 'KryloSMP Media & Creator Network',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Stay connected with **KryloSMP** across all platforms! 🚀\n\n` +
        `• 📺 **YouTube:** [@KryloMCYT](https://www.youtube.com/@KryloMCYT) — Daily Minecraft SMP videos & streams!\n` +
        `• 🛒 **Web Store:** [krylosmp-store-website.vercel.app](${STORE_VERCEL_URL})\n` +
        `• 🌐 **Official Portal:** [krylosmp.web.app](${MAIN_PORTAL_URL})\n` +
        `• 💬 **Discord Permanent Invite:** [discord.gg/6vrEDTu3bx](https://discord.gg/6vrEDTu3bx)\n\n` +
        `*Share the invite with your friends to climb the Leaderboard and earn bonus KryloCoins!*`
      )
      .setFooter({ text: 'KryloSMP Socials • Follow & Subscribe' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('📺 YouTube Channel')
        .setStyle(ButtonStyle.Link)
        .setURL('https://www.youtube.com/@KryloMCYT')
        .setEmoji('📺'),
      new ButtonBuilder()
        .setLabel('🛒 Web Store')
        .setStyle(ButtonStyle.Link)
        .setURL(STORE_VERCEL_URL)
        .setEmoji('🛒')
    );

    await socialsCh.send({ embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official socials in #🌐・socials');
  }

  // 9. #❓・faq-how-to-play (1542646221275922483)
  console.log('[🚀 Step 9] Upgrading #❓・faq-how-to-play...');
  await purgeKrimsMessages('1542646221275922483', 30);
  const faqCh = await ksmpGuild.channels.fetch('1542646221275922483');
  if (faqCh) {
    const embed = new EmbedBuilder()
      .setColor(0x06B6D4)
      .setTitle('❓ FREQUENTLY ASKED QUESTIONS — HOW TO PLAY')
      .setAuthor({
        name: 'KryloSMP Support & Help Center',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Everything you need to know to get started on **KryloSMP**!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🎮 **Q: How do I join the Minecraft server?**\n` +
        `• **Java:** Multiplayer ➔ Direct Connect / Add Server ➔ \`krylosmp.falix.gg:29273\`\n` +
        `• **Bedrock:** Servers ➔ Add External Server ➔ IP: \`krylosmp.falix.gg\`, Port: \`29273\`\n\n` +
        `💎 **Q: What are KryloCoins ($Kr) and how do I earn them?**\n` +
        `• KryloCoins are our free in-game & Discord currency! Earn them by linking your account (+1,000 Kr), chatting in channels, finding server bugs, and winning community events. Redeem them for real store ranks!\n\n` +
        `🛡️ **Q: How do I report a hacker or rulebreaker?**\n` +
        `• Open a private ticket in <#1542646331502366760> and attach video evidence. Our executive staff will review it in under 5 minutes!\n\n` +
        `🤝 **Q: Can Java and Bedrock players play together?**\n` +
        `• Yes! Our server features 100% full crossplay synchronization.\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setFooter({ text: 'KryloSMP FAQ • Need more help? Open a ticket!' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('btn_ksmp_ticket_general')
        .setLabel('❓ Ask a Question')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('❓'),
      new ButtonBuilder()
        .setCustomId('btn_ksmp_verify_modal')
        .setLabel('🎮 Sync Account')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮')
    );

    await faqCh.send({ embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official FAQ in #❓・faq-how-to-play');
  }

  // 10. #🗺️・world-info (1542646233867489372)
  console.log('[🚀 Step 10] Upgrading #🗺️・world-info...');
  await purgeKrimsMessages('1542646233867489372', 30);
  const worldCh = await ksmpGuild.channels.fetch('1542646233867489372');
  if (worldCh) {
    const embed = new EmbedBuilder()
      .setColor(0x10B981)
      .setTitle('🗺️ KRYLOSMP — ACTIVE WORLDS & GAMEMODES ATLAS')
      .setAuthor({
        name: 'KryloSMP World Atlas & Realm Explorer',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Explore all realms available on the **KryloSMP Network**!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⚔️ **LIFESTEAL SMP** (\`/lifesteal\`)\n` +
        `• High-stakes survival where eliminating players steals their hearts!\n` +
        `• Craft beacon revives, custom Netherite weapons, and battle weekly dragon bosses.\n\n` +
        `📦 **REDISH BOXPVP** (\`/boxpvp\`)\n` +
        `• Fast-paced box combat arena featuring 12 progressive ore mines.\n` +
        `• Trade custom crystal fragments with spawn NPCs and open mythic crate keys.\n\n` +
        `🌱 **ONEBLOCK** (\`/oneblock\`)\n` +
        `• Start on a single floating block that regenerates through 10+ biome phases!\n` +
        `• Automate your kingdom with custom minions and build co-op skybases.\n\n` +
        `🎯 **PRACTICE DUELS** (\`/duels\`)\n` +
        `• Refine your sword, crystal, and bow PvP skills with instant 1v1 matchmaking.\n` +
        `• Crystal & Nodebuff kits with real-time Elo rating and seasonal leaderboards.\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setFooter({ text: 'KryloSMP Worlds • Live on krylosmp.falix.gg:29273' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 View Worlds on Web Hub')
        .setStyle(ButtonStyle.Link)
        .setURL(`${MAIN_PORTAL_URL}#worlds`)
        .setEmoji('🌐'),
      new ButtonBuilder()
        .setCustomId('btn_ksmp_verify_modal')
        .setLabel('🎮 Sync Account')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮')
    );

    await worldCh.send({ embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official world info in #🗺️・world-info');
  }

  // 11. #📖・server-guide (1542664732719186030)
  console.log('[🚀 Step 11] Upgrading #📖・server-guide...');
  await purgeKrimsMessages('1542664732719186030', 30);
  const guideCh = await ksmpGuild.channels.fetch('1542664732719186030');
  if (guideCh) {
    const embed = new EmbedBuilder()
      .setColor(0x3B82F6)
      .setTitle('👑 KRYLOSMP — ULTIMATE MASTER SERVER GUIDE & ROADMAP 🧭')
      .setAuthor({
        name: 'KryloSMP Executive Network Protocol',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Welcome to **KryloSMP**! Whether you are here to build megabases, dominate PvP leaderboards, or lead the richest clan, here is your definitive roadmap:\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `🧭 **PHASE 1: ACCOUNT SETUP & STARTER BONUS**\n` +
        `• Link your Minecraft account in <#1542646204658090054> to claim **+1,000 KryloCoins**.\n` +
        `• Read server rules in <#1542646197100224552> to prevent accidental infractions.\n\n` +
        `⚔️ **PHASE 2: CLAN WARFARE & ALLIANCES**\n` +
        `• Create or join a clan in <#1542646295561375764> to pool resources and build fortresses.\n` +
        `• Check clan standings in <#1542646298191331368>.\n\n` +
        `💎 **PHASE 3: RANKS, REWARDS & STORE**\n` +
        `• Earn ranks through Discord activity in <#1542669962278338681> or redeem via the [Official Store](${STORE_VERCEL_URL}).\n` +
        `• Boost the server for exclusive perks listed in <#1543050874027511909>!\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
      )
      .setImage(BANNER_URL)
      .setFooter({ text: 'KryloSMP Master Guide • Engineered by Krylo 亗' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('🌐 Official Web Portal')
        .setStyle(ButtonStyle.Link)
        .setURL(STORE_VERCEL_URL)
        .setEmoji('🌐'),
      new ButtonBuilder()
        .setCustomId('btn_ksmp_verify_modal')
        .setLabel('🎮 Sync Account')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎮')
    );

    await guideCh.send({ embeds: [embed], components: [row] });
    console.log('  ✅ Deployed official server guide in #📖・server-guide');
  }

  // 12. #🚀・booster-perks (1543050874027511909)
  console.log('[🚀 Step 12] Upgrading #🚀・booster-perks...');
  await purgeKrimsMessages('1543050874027511909', 30);
  const boosterCh = await ksmpGuild.channels.fetch('1543050874027511909');
  if (boosterCh) {
    const embed = new EmbedBuilder()
      .setColor(0xEC4899)
      .setTitle('🚀 KRYLOSMP — SERVER BOOSTER PERKS & REWARDS 💎')
      .setAuthor({
        name: 'KryloSMP Nitro Loyalty Program',
        iconURL: ksmpGuild.iconURL() || ksmpClient.user.displayAvatarURL()
      })
      .setDescription(
        `Support **KryloSMP** by Boosting our Discord Server and unlock epic VIP rewards!\n\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `💖 **BOOSTER REWARDS PACKAGE:**\n` +
        `• 💎 **+5,000 KryloCoins ($Kr)** instant bonus deposited to your wallet\n` +
        `• ⚡ **2.0x Double XP Multiplier** for all Discord chat & voice activity\n` +
        `• 👑 **Exclusive @Server Booster Role** with high-profile top-role display\n` +
        `• 🎨 **Custom Nickname & Color Access** across all community lounges\n` +
        `• 🎁 **Monthly Godly Crate Key Voucher** delivered via support tickets\n` +
        `• 🚀 **Direct Access to Private Booster Lounges & Events**\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `*Thank you to all our amazing Nitro Boosters for keeping KryloSMP powered!* 💖`
      )
      .setFooter({ text: 'KryloSMP Boosters • We Appreciate You!' })
      .setTimestamp();

    await boosterCh.send({ embeds: [embed] });
    console.log('  ✅ Deployed official booster perks in #🚀・booster-perks');
  }

  // 13. Platform chats: crossplay, java, bedrock
  console.log('[🚀 Step 13] Upgrading platform lounges (#🎮・crossplay-chat, #☕・java-chat, #📱・bedrock-chat)...');
  const platformConfigs = [
    {
      id: '1542662507406303232',
      title: '🎮 KRYLOSMP CROSSPLAY COMMUNITY HUB',
      color: 0x00F2FF,
      desc: 'Welcome to the official **Crossplay Discussion Hub** for both Java Edition & Bedrock Edition players!\n\n• Chat about cross-platform gameplay, server events, and trading.\n• Server IP: `krylosmp.falix.gg:29273`'
    },
    {
      id: '1542662509054402600',
      title: '☕ KRYLOSMP JAVA EDITION LOUNGE',
      color: 0xEAB308,
      desc: 'Dedicated discussion channel for **Minecraft Java Edition** players on KryloSMP!\n\n• Discuss Java PvP mechanics, 1.8 vs 1.9+ combat, mods, and client performance.\n• Java Port: `29273` (Default 25565 forwards automatically).'
    },
    {
      id: '1542662509947912252',
      title: '📱 KRYLOSMP BEDROCK EDITION LOUNGE',
      color: 0x10B981,
      desc: 'Dedicated lounge for **Windows 10/11, iOS, Android, Xbox, PlayStation, and Switch** players!\n\n• Server IP: `krylosmp.falix.gg`\n• Bedrock Port: `29273`\n• Bedrock IGNs start with a leading dot (e.g. `.TSOKZIN13`).'
    }
  ];

  for (const pc of platformConfigs) {
    await purgeKrimsMessages(pc.id, 20);
    const ch = await ksmpGuild.channels.fetch(pc.id).catch(() => null);
    if (ch) {
      const emb = new EmbedBuilder()
        .setColor(pc.color)
        .setTitle(pc.title)
        .setDescription(pc.desc)
        .setFooter({ text: 'KryloSMP Platform Hub' })
        .setTimestamp();
      await ch.send({ embeds: [emb] });
      console.log(`  ✅ Deployed platform header in #${ch.name}`);
    }
  }

  // 14. Combat & Hub channels: spawn-and-hub & ffa-kill-feed
  console.log('[🚀 Step 14] Upgrading #🏛️・spawn-and-hub & #⚔️・ffa-kill-feed...');
  await purgeKrimsMessages('1539007015039406213', 20);
  const spawnCh = await ksmpGuild.channels.fetch('1539007015039406213').catch(() => null);
  if (spawnCh) {
    const emb = new EmbedBuilder()
      .setColor(0x6366F1)
      .setTitle('🏛️ OFFICIAL KRYLOSMP SPAWN HUB & NPC DIRECTORY')
      .setAuthor({ name: 'KryloSMP Master Network • Spawn & Hub System' })
      .setDescription(
        `Welcome to the heart of **KryloSMP**! The Spawn Hub is the central gathering place where all players meet.\n\n` +
        `• 🧙 **NPC Merchants:** Trade custom crystals, buy tools, and exchange KryloCoins.\n` +
        `• 🌀 **Portals:** Instant warp to Lifesteal, BoxPvP, OneBlock, and Duels.\n` +
        `• 🛡️ **Safe Zone:** PvP is strictly disabled in spawn perimeter.`
      )
      .setFooter({ text: 'KryloSMP Spawn Hub' })
      .setTimestamp();
    await spawnCh.send({ embeds: [emb] });
  }

  await purgeKrimsMessages('1539011466064302160', 20);
  const ffaCh = await ksmpGuild.channels.fetch('1539011466064302160').catch(() => null);
  if (ffaCh) {
    const emb = new EmbedBuilder()
      .setColor(0xDC2626)
      .setTitle('⚔️ KRYLOSMP FFA COMBAT ARENA & LEADERBOARD')
      .setAuthor({ name: 'KryloSMP Combat Network • FFA Arena' })
      .setDescription(
        `Welcome to the **Free-For-All (FFA) Combat Arena**! Jump in, test your PvP skills with custom Netherite kits, and steal hearts on kills!\n\n` +
        `• ⚔️ Type \`/ffa\` or \`/warp ffa\` in-game to enter.\n` +
        `• 🏆 Top killers featured on the weekly Discord Leaderboard!`
      )
      .setFooter({ text: 'KryloSMP Combat Arena' })
      .setTimestamp();
    await ffaCh.send({ embeds: [emb] });
  }

  console.log('\n🎉 ALL KRIMS CODE MESSAGES PURGED AND REPLACED WITH KRYLOSMP BOT EMBEDS!');
  process.exit(0);
}

main().catch(err => {
  console.error('[Migration Error]:', err);
  process.exit(1);
});
