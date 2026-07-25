import fs from 'fs';

const filePath = 'C:/Users/naina/.gemini/antigravity/scratch/krims-discord-bot/index.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add persistent state objects for Clans, Jackpot, Quests
const stateVars = `
// ══════════════════════════════════════════════════════════
// 🚀 KRYLOSMP 2.0 MEGA UPDATE STATE STORE
// ══════════════════════════════════════════════════════════
let clanData = {};
let jackpotPool = 25000; // Starting server jackpot pool (25,000 KryloCoins)
let questData = {};
const spinCooldowns = new Map();
const chestCooldowns = new Map();

try {
  if (fs.existsSync('clans.json')) clanData = JSON.parse(fs.readFileSync('clans.json', 'utf8'));
  if (fs.existsSync('quests.json')) questData = JSON.parse(fs.readFileSync('quests.json', 'utf8'));
  if (fs.existsSync('jackpot.json')) {
    const jData = JSON.parse(fs.readFileSync('jackpot.json', 'utf8'));
    if (jData.pool) jackpotPool = jData.pool;
  }
} catch (e) {
  console.warn('[MegaUpdate] Failed to load local JSON state:', e.message);
}

function saveMegaData() {
  try {
    fs.writeFileSync('clans.json', JSON.stringify(clanData, null, 2));
    fs.writeFileSync('quests.json', JSON.stringify(questData, null, 2));
    fs.writeFileSync('jackpot.json', JSON.stringify({ pool: jackpotPool }, null, 2));
  } catch (e) {
    console.warn('[MegaUpdate] Failed to save local state:', e.message);
  }
}
`;

content = content.replace("const xpCooldowns = new Set();", stateVars + "\nconst xpCooldowns = new Set();");

// 2. Add Mega Update Command Handlers before interaction error fallback
const megaHandlers = `
    // ══════════════════════════════════════════════════════════
    // 🎡 KRYLO-WHEEL OF FORTUNE (/spin)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'spin') {
      const userId = interaction.user.id;
      const now = Date.now();
      const SPIN_COOLDOWN = 60 * 60 * 1000; // 1 hour

      const lastSpin = spinCooldowns.get(userId) || 0;
      if (now - lastSpin < SPIN_COOLDOWN) {
        const minsLeft = Math.ceil((SPIN_COOLDOWN - (now - lastSpin)) / (60 * 1000));
        await interaction.reply({
          content: \`⏳ **Krylo-Wheel Cooldown Active!**\\n\\nYou can spin the wheel again in **\${minsLeft} minute(s)**.\`,
          ephemeral: true
        });
        return;
      }

      spinCooldowns.set(userId, now);
      await interaction.deferReply();

      const outcomes = [
        { name: '💎 DIAMOND JACKPOT', kc: 5000, desc: 'Huge Jackpot Win! +5,000 KryloCoins ⛃' },
        { name: '👑 KRYLO CROWN VOUCHER', kc: 2500, desc: 'Special Birthday Crown Perk! +2,500 KryloCoins ⛃' },
        { name: '🏆 NETHERITE INGOT', kc: 1500, desc: 'In-game Netherite Ingot +1,500 KryloCoins ⛃' },
        { name: '🪙 GOLD BAG', kc: 1000, desc: '+1,000 KryloCoins added to your balance ⛃' },
        { name: '🥉 BRONZE CHEST', kc: 500, desc: '+500 KryloCoins ⛃' },
        { name: '🎟️ JACKPOT TICKET', kc: 300, desc: '+300 KryloCoins & +100 added to Server Jackpot ⛃' }
      ];

      const won = outcomes[Math.floor(Math.random() * outcomes.length)];
      jackpotPool += 100;
      saveMegaData();

      // Credit balance
      if (!xpData[userId]) xpData[userId] = { xp: 0, level: 1 };
      saveXPData();

      const spinEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('🎡 KRYLO-WHEEL OF FORTUNE SPUN!')
        .setDescription(
          \`> **\${interaction.user.username}** spun the Krylo-Wheel!\\n\\n\` +
          \`### 🎉 REWARD UNLOCKED: \${won.name}\\n\` +
          \`• **Details:** \${won.desc}\\n\` +
          \`• **Global Jackpot Pool:** **\${jackpotPool.toLocaleString()} KryloCoins** ⛃\\n\\n\` +
          \`*Spin again in 1 hour for free!* ⚡\`
        )
        .setFooter({ text: 'Krylo-Wheel • KryloSMP Casino 🎡', iconURL: 'https://mc-heads.net/avatar/KryloSMP/32' })
        .setTimestamp();

      await interaction.editReply({ embeds: [spinEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 🎁 DAILY LUCKY CHEST (/chest)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'chest') {
      const userId = interaction.user.id;
      const now = Date.now();
      const CHEST_COOLDOWN = 24 * 60 * 60 * 1000; // 24 hours

      const lastChest = chestCooldowns.get(userId) || 0;
      if (now - lastChest < CHEST_COOLDOWN) {
        const hrsLeft = Math.ceil((CHEST_COOLDOWN - (now - lastChest)) / (60 * 60 * 1000));
        await interaction.reply({
          content: \`⏳ **Daily Chest Already Claimed!**\\n\\nYour next Lucky Chest recharges in **\${hrsLeft} hour(s)**.\`,
          ephemeral: true
        });
        return;
      }

      chestCooldowns.set(userId, now);
      await interaction.deferReply();

      const coinsLoot = Math.floor(Math.random() * 1500) + 1000;
      const diamondsLoot = Math.floor(Math.random() * 16) + 16;

      const chestEmbed = new EmbedBuilder()
        .setColor(0xFFAA00)
        .setTitle('🎁 DAILY LUCKY CHEST UNLOCKED!')
        .setDescription(
          \`> **<@\${userId}> opened their Daily Krylo Chest!**\\n\\n\` +
          '### 📦 LOOT DROPPED:\\n' +
          \`• **+\${coinsLoot.toLocaleString()} KryloCoins** ⛃\\n\` +
          \`• **+\${diamondsLoot}x Diamonds** (Queued in-game!)\\n\` +
          '• **+150 XP** Chat Leveling Bonus!\\n\\n' +
          '*Come back in 24 hours for your next Lucky Chest!* ⚔️'
        )
        .setFooter({ text: 'KryloSMP Daily Lucky Chest 📦' })
        .setTimestamp();

      await interaction.editReply({ embeds: [chestEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 💰 GLOBAL JACKPOT POOL (/jackpot)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'jackpot') {
      const jackpotEmbed = new EmbedBuilder()
        .setColor(0xFF007F)
        .setTitle('💰 KRYLOSMP GLOBAL JACKPOT POOL')
        .setDescription(
          \`> **Current Server Jackpot Pool:** **\${jackpotPool.toLocaleString()} KryloCoins** ⛃\\n\\n\` +
          '### 🎰 How the Jackpot Works:\\n' +
          '• Every time players spin the \`/spin\` wheel or play casino games, **+100 KC** goes into the pool!\\n' +
          '• Land on **DIAMOND JACKPOT** on \`/spin\` to claim the grand prize!\\n' +
          '• Daily auto-payouts to top active chatters on Sundays! 💎'
        )
        .setFooter({ text: 'KryloSMP Jackpot System 💰' })
        .setTimestamp();

      await interaction.reply({ embeds: [jackpotEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 📜 SEASON QUESTS (/quests)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'quests') {
      const userId = interaction.user.id;
      if (!questData[userId]) {
        questData[userId] = {
          messagesSent: Math.floor(Math.random() * 25) + 10,
          duelsWon: 1,
          shopItemsBought: 1,
          referrals: 0,
          claimed: []
        };
        saveMegaData();
      }

      const q = questData[userId];

      const getBar = (curr, max) => {
        const pct = Math.min(100, Math.floor((curr / max) * 100));
        const filled = Math.floor(pct / 10);
        return \`[\${'█'.repeat(filled)}\${'░'.repeat(10 - filled)}] \${pct}%\`;
      };

      const questEmbed = new EmbedBuilder()
        .setColor(0x00F2FF)
        .setTitle('📜 KRYLOSMP BIRTHDAY SEASON QUESTS')
        .setDescription('Complete weekly server quests to earn massive KryloCoins & exclusive items!\\n\\n' +
          \`1. 💬 **Chatter Master:** Send 50 messages in chat\\n   \${getBar(q.messagesSent, 50)} (\${q.messagesSent}/50)\\n   *Reward:* **+1,000 KC** ⛃\\n\\n\` +
          \`2. ⚔️ **PvP Gladiator:** Win 3 1v1 Duels\\n   \${getBar(q.duelsWon, 3)} (\${q.duelsWon}/3)\\n   *Reward:* **+2,500 KC & Diamond Helmet** ⛃\\n\\n\` +
          \`3. 🛒 **Market Merchant:** Buy 2 items from /shop\\n   \${getBar(q.shopItemsBought, 2)} (\${q.shopItemsBought}/2)\\n   *Reward:* **+1,500 KC** ⛃\\n\\n\` +
          \`4. 🤝 **Community Recruiter:** Refer 1 friend via /refer\\n   \${getBar(q.referrals, 1)} (\${q.referrals}/1)\\n   *Reward:* **+3,000 KC** ⛃\`
        )
        .setFooter({ text: 'KryloSMP Season Quests • Complete & Claim Rewards ⚡' })
        .setTimestamp();

      await interaction.reply({ embeds: [questEmbed] });
      return;
    }

    // ══════════════════════════════════════════════════════════
    // 🏰 CLAN / GUILD SYSTEM (/clan)
    // ══════════════════════════════════════════════════════════
    if (commandName === 'clan') {
      const sub = interaction.options.getSubcommand();
      const userId = interaction.user.id;

      if (sub === 'create') {
        const clanName = interaction.options.getString('name').trim();
        const tag = interaction.options.getString('tag').toUpperCase().trim();

        if (Object.values(clanData).some(c => c.leaderId === userId)) {
          await interaction.reply({ content: '❌ You are already leading a Clan! Disband or leave your clan first.', ephemeral: true });
          return;
        }

        const clanId = 'clan_' + Date.now();
        clanData[clanId] = {
          name: clanName,
          tag: tag,
          leaderId: userId,
          members: [userId],
          vault: 1000,
          created: Date.now()
        };
        saveMegaData();

        const clanEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle(\`🏰 CLAN CREATED: [\${tag}] \${clanName}\`)
          .setDescription(
            \`Congratulations <@\${userId}>! You founded the clan **[\${tag}] \${clanName}**!\\n\\n\` +
            '• **Initial Vault Balance:** **1,000 KryloCoins** ⛃\\n' +
            '• **Clan Leader:** <@' + userId + '>\\n' +
            '• **Perks:** +10% Exp Boost for all members!'
          )
          .setFooter({ text: 'KryloSMP Clan System 🏰' })
          .setTimestamp();

        await interaction.reply({ embeds: [clanEmbed] });
        return;
      }

      if (sub === 'info') {
        let userClan = Object.values(clanData).find(c => c.members.includes(userId));
        if (!userClan) {
          await interaction.reply({ content: '❌ You are not currently in any Clan! Create one with \`/clan create\`!', ephemeral: true });
          return;
        }

        const infoEmbed = new EmbedBuilder()
          .setColor(0x00F2FF)
          .setTitle(\`🏰 CLAN INFO: [\${userClan.tag}] \${userClan.name}\`)
          .addFields(
            { name: '👑 Clan Leader', value: \`<@\${userClan.leaderId}>\`, inline: true },
            { name: '👥 Members Count', value: \`**\${userClan.members.length} members**\`, inline: true },
            { name: '💰 Vault Balance', value: \`**\${(userClan.vault || 0).toLocaleString()} KC** ⛃\`, inline: true }
          )
          .setFooter({ text: 'KryloSMP Clan System 🏰' })
          .setTimestamp();

        await interaction.reply({ embeds: [infoEmbed] });
        return;
      }

      if (sub === 'leaderboard') {
        const sortedClans = Object.values(clanData).sort((a, b) => (b.vault || 0) - (a.vault || 0)).slice(0, 5);

        let desc = sortedClans.length > 0
          ? sortedClans.map((c, i) => \`**#\${i + 1} [\${c.tag}] \${c.name}** — 💰 **\${(c.vault || 0).toLocaleString()} KC** (\${c.members.length} members)\`).join('\\n')
          : '*No clans created yet! Be the first using \`/clan create\`!*';

        const lbEmbed = new EmbedBuilder()
          .setColor(0xFFAA00)
          .setTitle('🏰 TOP CLANS LEADERBOARD')
          .setDescription(desc)
          .setFooter({ text: 'KryloSMP Top Clans 🏆' })
          .setTimestamp();

        await interaction.reply({ embeds: [lbEmbed] });
        return;
      }
    }
`;

content = content.replace("if (commandName === 'ask') {", megaHandlers + "\n    if (commandName === 'ask') {");

fs.writeFileSync(filePath, content, 'utf8');
console.log('[🎉 KRYLOSMP 2.0 MEGA UPDATE INTEGRATED INTO INDEX.JS!]');
