import { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const token = process.env.DISCORD_TOKEN;
const guildId = '1524878881918685405';
const OWNER_DISCORD_ID = '1420991845546332162'; // Krylo's Discord ID

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  const guild = client.guilds.cache.get(guildId) || await client.guilds.fetch(guildId);

  const action = process.argv[2] || 'refresh';

  if (action === 'refresh') {
    await refreshAllChannels(guild);
  } else if (action === 'infinite') {
    await setInfiniteCoins(guild);
  } else if (action === 'all') {
    await refreshAllChannels(guild);
    await setInfiniteCoins(guild);
  }

  console.log('\n🏁 Done! Disconnecting...');
  client.destroy();
  process.exit(0);
});

// ══════════════════════════════════════════════════════════
// 💰 SET INFINITE COINS FOR OWNER
// ══════════════════════════════════════════════════════════
async function setInfiniteCoins(guild) {
  console.log('\n💰 Setting infinite coins for owner (Krylo)...');
  
  const pteroToken = process.env.PTERODACTYL_TOKEN;
  const serverId = '25a5d79a';
  const usernames = ['Krylo', 'krylo_blox', 'Krylo_MC', 'krishiv'];
  
  // Set balance to 999,999,999 via Pterodactyl console
  for (const username of usernames) {
    try {
      const res = await fetch(`https://panel.play.hosting/api/client/servers/${serverId}/command`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pteroToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: `krylo setbalance ${username} 999999999` })
      });
      
      if (res.ok || res.status === 204) {
        console.log(`  ✅ Set ${username} balance to 999,999,999 KryloCoins!`);
      } else {
        console.log(`  ⚠️ Could not set balance for ${username}: status ${res.status}`);
      }
    } catch (err) {
      console.log(`  ⚠️ Could not reach server for ${username}: ${err.message}`);
    }
  }
  
  // Also update Vercel config with the balance
  try {
    const configRes = await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_config', guildId: guildId })
    });
    
    if (configRes.ok) {
      const config = await configRes.json();
      
      // Initialize economyData if not exists
      if (!config.economyData) config.economyData = {};
      for (const username of usernames) {
        config.economyData[username] = 999999999;
      }
      
      // Also update in verifiedPlayers if exists
      if (config.verifiedPlayers) {
        for (const [userId, data] of Object.entries(config.verifiedPlayers)) {
          const lowerName = data.name?.toLowerCase();
          if (userId === OWNER_DISCORD_ID || usernames.some(u => u.toLowerCase() === lowerName)) {
            data.balance = 999999999;
          }
        }
      }
      
      // Save config
      await fetch('https://krims-code-chatbot.vercel.app/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_config', guildId: guildId, config: config })
      });
      
      console.log('  ✅ Synced infinite balance to Vercel cloud config!');
    }
  } catch (err) {
    console.log(`  ⚠️ Vercel sync failed: ${err.message}`);
  }
}

function getChannelMention(guild, name) {
  const channel = guild.channels.cache.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
  return channel ? `<#${channel.id}>` : `#${name}`;
}

// ══════════════════════════════════════════════════════════
// 🔄 REFRESH ALL CHANNELS
// ══════════════════════════════════════════════════════════
async function refreshAllChannels(guild) {
  console.log('\n🔄 Refreshing all server channels...\n');

  // 1. RULES channel
  await refreshChannel(guild, 'rules', async (channel) => {
    const rulesEmbed = new EmbedBuilder()
      .setColor(0xFF6B6B)
      .setTitle('📜 KryloSMP — Server Rules')
      .setDescription('By playing on **KryloSMP**, you agree to follow these rules. Violations may result in mutes, kicks, or bans.')
      .addFields(
        { name: '1️⃣ No Griefing', value: 'Do not destroy, modify, or steal from builds that are not yours.' },
        { name: '2️⃣ No Hacking / Cheating', value: 'No hacked clients, x-ray, autoclickers, or any unfair advantage mods.' },
        { name: '3️⃣ Be Respectful', value: 'No harassment, hate speech, racism, or toxic behavior in chat.' },
        { name: '4️⃣ No Spamming', value: 'No spam, excessive caps, or advertising in any chat channel.' },
        { name: '5️⃣ No Exploiting', value: 'Do not exploit bugs or glitches. Report them to staff immediately.' },
        { name: '6️⃣ PvP Rules', value: 'No spawn killing or combat logging. PvP is allowed in designated areas only.' },
        { name: '7️⃣ Listen to Staff', value: 'Staff decisions are final. Do not argue with moderators publicly.' },
        { name: '8️⃣ Account Security', value: 'You are responsible for your account. Register with `/register` and login with `/login`.' }
      )
      .setImage('https://media1.tenor.com/m/NcD5pWTOoBkAAAAd/minecraft-smp.gif')
      .setFooter({ text: 'KryloSMP • Breaking rules = consequences' })
      .setTimestamp();

    await channel.send({ embeds: [rulesEmbed] });
  });

  // 2. ANNOUNCEMENTS channel
  await refreshChannel(guild, 'announcements', async (channel) => {
    const storeMention = getChannelMention(guild, 'store');
    const announcementEmbed = new EmbedBuilder()
      .setColor(0xFFAA00)
      .setTitle('📢 KryloSMP — Announcements')
      .setDescription('Welcome to the official announcements channel! Stay tuned for server updates, events, and important news.')
      .addFields(
        { name: '🆕 Latest Update', value: '**Discord Store is LIVE!** 🛒\nBuy ranks, kits, cosmetics, and special items directly from Discord using your KryloCoins!' },
        { name: '🎮 Server Address', value: '`KryloSmp.play.hosting`', inline: true },
        { name: '🌍 Version', value: 'Paper 1.21.1', inline: true },
        { name: '💎 Edition', value: 'Java + Bedrock', inline: true },
        { name: '🔗 Useful Links', value: `🌐 [Web Portal](https://krims-code-portal.vercel.app)\n📊 [Bot Dashboard](https://krims-bot-dashboard.vercel.app)\n🛒 Check out ${storeMention} for shop!` }
      )
      .setImage('https://media1.tenor.com/m/Gv6Km11XjzIAAAAd/minecraft.gif')
      .setFooter({ text: 'KryloSMP • Stay tuned for updates' })
      .setTimestamp();

    await channel.send({ embeds: [announcementEmbed] });
  });

  // 3. SERVER-INFO channel
  await refreshChannel(guild, 'server-info', async (channel) => {
    const infoEmbed = new EmbedBuilder()
      .setColor(0x00BFFF)
      .setTitle('🖥️ KryloSMP — Server Information')
      .setDescription('Everything you need to know about our Minecraft SMP server!')
      .addFields(
        { name: '🌐 Server IP', value: '```KryloSmp.play.hosting```', inline: false },
        { name: '📋 Version', value: 'Paper 1.21.1 (Build 26.2 #60)', inline: true },
        { name: '🎮 Platform', value: 'Java + Bedrock', inline: true },
        { name: '👥 Slots', value: '20 Players', inline: true },
        { name: '⚡ Features', value: '• Custom Economy (KryloCoins ⛃)\n• Custom Ranks & Kits\n• Land Claims & Protection\n• Particle Trails & Auras\n• Custom Bosses\n• Custom PvP Arena\n• Monthly Tournaments\n• Authentication System\n• Discord Integration', inline: false },
        { name: '⚔️ PvP & Tournaments', value: '• **PvP Arena:** Fight other players in our custom arena! Join via `/warp pvp`.\n• **Monthly Tournaments:** Server-wide PvP tournaments held on the first Saturday of every month. Massive rewards for the winners (KryloCoins ⛃, custom items, and titles!). Sign up in <#1524890351549157387> (polls) or by opening a ticket.', inline: false },
        { name: '🎒 Getting Started', value: '1. Join with IP above\n2. Register: `/register <password> <password>`\n3. Set home: `/sethome`\n4. Check balance: `/balance`\n5. Open shop: `/shop`\n6. Link Discord: `/link`', inline: false }
      )
      .setImage('https://media1.tenor.com/m/FfP01LJ4wSEAAAAd/survival-minecraft.gif')
      .setFooter({ text: 'KryloSMP • Powered by KryloSMP Plugin v5.0' })
      .setTimestamp();

    await channel.send({ embeds: [infoEmbed] });
  });

  // 4. SOCIALS channel
  await refreshChannel(guild, 'socials', async (channel) => {
    const announceMention = getChannelMention(guild, 'announcements');
    const storeMention = getChannelMention(guild, 'store');
    const socialsEmbed = new EmbedBuilder()
      .setColor(0xAA55FF)
      .setTitle('🌐 KryloSMP • Official Portals & Social Links')
      .setDescription('Stay connected with the community and developer updates across our platforms:')
      .addFields(
        { name: '🔮 Developer Web Portal', value: '[krims-code-portal.vercel.app](https://krims-code-portal.vercel.app)', inline: false },
        { name: '📢 Announcements Channel', value: `Keep an eye on ${announceMention} for server updates!`, inline: false },
        { name: '🛒 Server Store', value: `Buy ranks, kits & cosmetics in ${storeMention}!`, inline: false },
        { name: '📺 YouTube', value: '[Watch KryloSMP Videos](https://www.youtube.com/@Krylo-60)', inline: true },
        { name: '📊 Bot Dashboard', value: '[krims-bot-dashboard.vercel.app](https://krims-bot-dashboard.vercel.app)', inline: true }
      )
      .setImage('https://media1.tenor.com/m/7E7bxrqFYTgAAAAd/minecraftbuilding-minecraft.gif')
      .setFooter({ text: 'KryloSMP • Connect with us!' })
      .setTimestamp();

    await channel.send({ embeds: [socialsEmbed] });
  });

  // 5. FAQ channel
  await refreshChannel(guild, 'faq', async (channel) => {
    const storeMention = getChannelMention(guild, 'store');
    const verifyMention = getChannelMention(guild, 'verify');
    const ticketMention = getChannelMention(guild, 'support-tickets');
    const chatMention = getChannelMention(guild, 'general-chat');
    const faqEmbed = new EmbedBuilder()
      .setColor(0x55FF55)
      .setTitle('❓ KryloSMP — Frequently Asked Questions')
      .setDescription('Got questions? Here are the most common ones answered!')
      .addFields(
        { name: '🔗 How do I join the server?', value: 'Use the IP: `KryloSmp.play.hosting` on Java Edition 1.21.1' },
        { name: '📱 Can I join on Bedrock?', value: 'Yes! Bedrock players can connect too. Use the same IP address.' },
        { name: '💰 How do I earn KryloCoins?', value: 'Kill mobs, mine ores, complete challenges, and sell items! Use `/balance` to check.' },
        { name: '⚔️ Are there PvP Arenas and Tournaments?', value: 'Yes! We have a custom PvP Arena you can join using `/warp pvp`. We also host Monthly Tournaments on the first Saturday of each month with massive KryloCoins ⛃ prizes, special trophies, and vanity ranks!' },
        { name: '🛒 How does the Discord Store work?', value: `Click buy buttons in ${storeMention} → Confirm → Coins are deducted from your in-game balance & items delivered!` },
        { name: '🔐 How do I verify my account?', value: `Go to ${verifyMention}, click **Link Minecraft Account**, enter your MC username, then enter the 5-digit code shown in-game.` },
        { name: '🏠 How do I claim land?', value: 'Use a golden shovel to create claims! You start with 100 claim blocks and earn more as you play.' },
        { name: '🆘 I need help!', value: `Open a support ticket in ${ticketMention} or ask in ${chatMention}.` },
        { name: '🎭 Can I change my nickname?', value: 'Gold rank and above can use `/nick` in-game. Or use the HexNicks plugin when it\'s installed!' }
      )
      .setImage('https://media1.tenor.com/m/TFCbXMQJNmEAAAAd/minecraft-video-games.gif')
      .setFooter({ text: 'KryloSMP • Still have questions? Ask in #general-chat!' })
      .setTimestamp();

    await channel.send({ embeds: [faqEmbed] });
  });

  // 6. STORE channel
  await refreshChannel(guild, 'store', async (channel) => {
    const verifyMention = getChannelMention(guild, 'verify');
    // Welcome banner
    const welcomeEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🛒 KryloSMP Store')
      .setDescription(`Welcome to the official **KryloSMP Discord Store**!\nPurchase ranks, kits, cosmetics, and special items using your **KryloCoins ⛃**.\n\n> 💡 Earn coins by playing on the server — killing mobs, mining, completing challenges!\n> 🔗 You must have a **linked Minecraft account** to buy items. Link in ${verifyMention}.`)
      .setImage('https://media1.tenor.com/m/WZrjq1UM5HoAAAAd/minecraft-shopping.gif')
      .setFooter({ text: 'KryloSMP Store • Prices in KryloCoins ⛃' })
      .setTimestamp();
    await channel.send({ embeds: [welcomeEmbed] });

    // ── RANKS ──
    const ranksEmbed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('👑 Premium Ranks')
      .setDescription('Unlock exclusive perks, commands, and cosmetics!')
      .addFields(
        { name: '🥉 Bronze — 500 ⛃', value: 'Custom prefix, colored name, priority queue', inline: true },
        { name: '🥈 Silver — 1,500 ⛃', value: 'Bronze perks + /fly, 3 homes, kit access', inline: true },
        { name: '🥇 Gold — 3,000 ⛃', value: 'Silver perks + /nick, 5 homes, cosmetics', inline: true },
        { name: '💎 Diamond — 5,000 ⛃', value: 'All perks + /god, unlimited homes, VIP', inline: true }
      );
    const ranksRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('shop_buy_bronze').setLabel('🥉 Bronze - 500').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shop_buy_silver').setLabel('🥈 Silver - 1,500').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('shop_buy_gold').setLabel('🥇 Gold - 3,000').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('shop_buy_diamond').setLabel('💎 Diamond - 5,000').setStyle(ButtonStyle.Danger),
    );
    await channel.send({ embeds: [ranksEmbed], components: [ranksRow] });

    // ── KITS ──
    const kitsEmbed = new EmbedBuilder()
      .setColor(0x55AAFF)
      .setTitle('🎒 Starter Kits')
      .setDescription('Get a head start with pre-loaded gear sets!')
      .addFields(
        { name: '⚔️ Warrior — 200 ⛃', value: 'Iron armor + Sharpness II sword + food', inline: true },
        { name: '🏹 Ranger — 200 ⛃', value: 'Leather armor + Power II Infinity bow', inline: true },
        { name: '⛏️ Miner — 200 ⛃', value: 'Eff III Fortune II pickaxe + torches', inline: true },
        { name: '🔮 Enchanter — 350 ⛃', value: 'Enchanting table + 30 bookshelves + XP', inline: true }
      );
    const kitsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('shop_buy_warrior').setLabel('⚔️ Warrior - 200').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shop_buy_ranger').setLabel('🏹 Ranger - 200').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shop_buy_miner').setLabel('⛏️ Miner - 200').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shop_buy_enchanter').setLabel('🔮 Enchanter - 350').setStyle(ButtonStyle.Primary),
    );
    await channel.send({ embeds: [kitsEmbed], components: [kitsRow] });

    // ── COSMETICS ──
    const cosmeticsEmbed = new EmbedBuilder()
      .setColor(0xFF55FF)
      .setTitle('✨ Cosmetics & Effects')
      .setDescription('Stand out with particle trails, kill effects, and name styles!')
      .addFields(
        { name: '🔥 Fire Trail — 300 ⛃', value: 'Leave fire particles behind you', inline: true },
        { name: '❄️ Frost Aura — 300 ⛃', value: 'Frost particles surround you', inline: true },
        { name: '⚡ Lightning Kill — 500 ⛃', value: 'Lightning on every kill', inline: true },
        { name: '🌈 Rainbow Name — 750 ⛃', value: 'Name cycles through colors', inline: true },
        { name: '🎆 Firework Death — 400 ⛃', value: 'Fireworks on your death', inline: true }
      );
    const cosmeticsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('shop_buy_fire').setLabel('🔥 Fire - 300').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shop_buy_frost').setLabel('❄️ Frost - 300').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shop_buy_lightning').setLabel('⚡ Lightning - 500').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('shop_buy_rainbow').setLabel('🌈 Rainbow - 750').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('shop_buy_firework').setLabel('🎆 Firework - 400').setStyle(ButtonStyle.Secondary),
    );
    await channel.send({ embeds: [cosmeticsEmbed], components: [cosmeticsRow] });

    // ── SPECIALS ──
    const specialsEmbed = new EmbedBuilder()
      .setColor(0x00FF88)
      .setTitle('🎁 Special Items')
      .setDescription('Unique perks and one-time-use tokens!')
      .addFields(
        { name: '🏗️ +1,000 Claim Blocks — 400 ⛃', value: 'Expand your protected land', inline: true },
        { name: '🎒 Backpack Expansion — 250 ⛃', value: 'Upgrade portable storage', inline: true },
        { name: '🌀 Custom Warp — 600 ⛃', value: 'Create a public warp point', inline: true },
        { name: '🛡️ Keep Inventory — 150 ⛃', value: 'Keep items on next death (1 use)', inline: true }
      );
    const specialsRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('shop_buy_claim').setLabel('🏗️ Claims - 400').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shop_buy_backpack').setLabel('🎒 Backpack - 250').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('shop_buy_warp').setLabel('🌀 Warp - 600').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('shop_buy_keepinv').setLabel('🛡️ KeepInv - 150').setStyle(ButtonStyle.Success),
    );
    await channel.send({ embeds: [specialsEmbed], components: [specialsRow] });
  });

  console.log('\n✅ All channels refreshed successfully!');
}

// ══════════════════════════════════════════════════════════
// HELPER: Clean and refresh a channel
// ══════════════════════════════════════════════════════════
async function refreshChannel(guild, channelName, populateFunc) {
  const channel = guild.channels.cache.find(c => c.name.includes(channelName) && c.isTextBased());
  if (!channel) {
    console.log(`  ⚠️ Channel "${channelName}" not found, skipping.`);
    return;
  }

  console.log(`📝 Refreshing #${channel.name}...`);

  // Delete all existing messages (up to 100)
  try {
    let deleted = 0;
    let messages;
    do {
      messages = await channel.messages.fetch({ limit: 100 });
      if (messages.size === 0) break;
      
      // Try bulk delete first (messages < 14 days old)
      const recent = messages.filter(m => Date.now() - m.createdTimestamp < 14 * 24 * 60 * 60 * 1000);
      if (recent.size > 1) {
        await channel.bulkDelete(recent);
        deleted += recent.size;
      }
      
      // Delete older messages one by one
      const old = messages.filter(m => Date.now() - m.createdTimestamp >= 14 * 24 * 60 * 60 * 1000);
      for (const [, msg] of old) {
        try {
          await msg.delete();
          deleted++;
          await new Promise(r => setTimeout(r, 300)); // Rate limit
        } catch (e) {
          // Skip if already deleted
        }
      }
    } while (messages.size >= 100);
    
    console.log(`  🗑️ Deleted ${deleted} old messages from #${channel.name}`);
  } catch (err) {
    console.log(`  ⚠️ Could not clean #${channel.name}: ${err.message}`);
  }

  // Wait a moment before posting new content
  await new Promise(r => setTimeout(r, 500));

  // Populate with fresh content
  try {
    await populateFunc(channel);
    console.log(`  ✅ #${channel.name} refreshed!`);
  } catch (err) {
    console.log(`  ❌ Failed to populate #${channel.name}: ${err.message}`);
  }
}

client.login(token);
