import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addCoins, getBalance } from '../databaseEngine.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'diwali_festival.json');

// In-memory state with persistence
let diwaliState = {
  totalDiyasLit: 1250,
  usersClaimedDaily: {}, // userId -> timestamp
  sweetsSentCount: 380,
  userDiyas: {} // userId -> count
};

function loadState() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      diwaliState = { ...diwaliState, ...data };
    }
  } catch (err) {
    console.error('[DiwaliEngine] Error loading state:', err.message);
  }
}

function saveState() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(diwaliState, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DiwaliEngine] Error saving state:', err.message);
  }
}

// Load on initialization
loadState();

const MITHAI_COLLECTION = [
  { name: 'Kaju Katli', emoji: '🍬', desc: 'Melt-in-your-mouth cashew fudge layered with pure edible silver leaf' },
  { name: 'Hot Gulab Jamun', emoji: '🍯', desc: 'Soft golden milk dumplings soaked in aromatic cardamom & saffron syrup' },
  { name: 'Crispy Saffron Jalebi', emoji: '🥨', desc: 'Deep-fried golden spirals glistening with warm sugar and saffron' },
  { name: 'Motichoor Ladoo', emoji: '🟡', desc: 'Tiny pearls of gram flour fried in pure desi ghee and bound into sweet golden spheres' },
  { name: 'Kesar Pista Barfi', emoji: '🟨', desc: 'Luxurious royal fudge infused with rich pistachios and Kashmiri saffron' },
  { name: 'Rasgulla', emoji: '🍚', desc: 'Classic velvety cottage cheese delicacies steeped in floral rosewater' }
];

const DIWALI_BLESSINGS = [
  "May the divine glow of Diwali diyas illuminate your path toward endless health, wisdom, and victory over all challenges.",
  "Wishing you and your loved ones the sacred blessings of Goddess Lakshmi for wealth and Lord Ganesha for wisdom and new beginnings.",
  "May the darkness of doubt and struggle vanish under the radiant light of truth, friendship, and unshakeable courage.",
  "May this Diwali bring boundless prosperity to your code, your games, your community, and your family.",
  "Triumph of light over darkness, knowledge over ignorance, and greatness over all obstacles. Happy Diwali!"
];

// ═════════════════════════════════════════════════════════════════════════════
// 1. 🪔 Main Diwali Celebration Hub (!diwali / /diwali)
// ═════════════════════════════════════════════════════════════════════════════
export async function handleDiwaliCommand(target, isInteraction = false) {
  const user = isInteraction ? target.user : target.author;
  const currencySymbol = target.guild?.id === '1538225337048236082' ? 'KC' : 'KR';

  const embed = new EmbedBuilder()
    .setColor(0xF59E0B)
    .setTitle('🪔✨ शुभ दीपावली • HAPPY DIWALI ✨🪔')
    .setDescription(
      `### 🌟 The Festival of Lights • Deepavali Celebration\n\n` +
      `Diwali celebrates the **victory of light over darkness, good over evil, and wisdom over ignorance**.\n\n` +
      `Honoring the rich heritage of Indian culture, Krims Code brings the sacred warmth of glowing diyas, festive sweets, and community joy to all players!\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `🪔 **Community Diyas Lit Worldwide:** \`${diwaliState.totalDiyasLit.toLocaleString()}\`\n` +
      `🍬 **Mithai Sweet Boxes Gifted:** \`${diwaliState.sweetsSentCount.toLocaleString()}\`\n` +
      `🎁 **Festival Gift:** Light a diya or claim your daily Lakshmi Blessing below for **+500 ${currencySymbol}**!\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .addFields(
      {
        name: '🪔 Commands Available',
        value: 
          '`!diya` — Light a personal sacred diya in this channel\n' +
          '`!mithai @friend` — Gift a festive box of Indian sweets\n' +
          '`!fireworks` — Launch safe virtual eco-friendly fireworks\n' +
          '`!diwali` — Open this festival control hub',
        inline: false
      }
    )
    .setFooter({ text: 'शुभ दीपावली • Wishing you peace, light & boundless prosperity' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('diwali_light_diya')
      .setLabel('🪔 Light a Diya (+100)')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('diwali_claim_blessing')
      .setLabel('🎁 Daily Lakshmi Blessing (+500)')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('diwali_burst_patakha')
      .setLabel('🎆 Burst Fireworks')
      .setStyle(ButtonStyle.Secondary)
  );

  if (isInteraction) {
    return target.reply({ embeds: [embed], components: [row] });
  } else {
    return target.reply({ embeds: [embed], components: [row] });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. 🪔 Light a Diya Command (!diya)
// ═════════════════════════════════════════════════════════════════════════════
export async function handleDiyaCommand(message) {
  diwaliState.totalDiyasLit += 1;
  const userCount = (diwaliState.userDiyas[message.author.id] || 0) + 1;
  diwaliState.userDiyas[message.author.id] = userCount;
  saveState();

  const blessing = DIWALI_BLESSINGS[Math.floor(Math.random() * DIWALI_BLESSINGS.length)];
  const currencySymbol = message.guild?.id === '1538225337048236082' ? 'KC' : 'KR';
  
  // Award 100 coins
  try {
    addCoins(message.author.id, 100);
  } catch (e) {}

  const embed = new EmbedBuilder()
    .setColor(0xF59E0B)
    .setTitle(`🪔 Diya Lit by ${message.author.username}! 🪔`)
    .setDescription(
      `🕯️ **A golden flame glows brightly in this server!**\n\n` +
      `*"${blessing}"*\n\n` +
      `✨ **Your Personal Diyas Lit:** \`${userCount}\`\n` +
      `🌐 **Global Diyas Lit:** \`${diwaliState.totalDiyasLit.toLocaleString()}\`\n` +
      `💰 **Festival Reward:** \`+100 ${currencySymbol}\``
    )
    .setFooter({ text: 'Happy Diwali • May your home shine with light and joy!' });

  return message.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. 🍬 Share Indian Mithai / Sweets (!mithai @user)
// ═════════════════════════════════════════════════════════════════════════════
export async function handleMithaiCommand(message, targetUser) {
  const recipient = targetUser || message.mentions.users.first();
  if (!recipient) {
    return message.reply("🍬 **Usage:** `!mithai @friend` — Gift a festive box of delicious Indian sweets to a server friend!");
  }

  if (recipient.id === message.author.id) {
    return message.reply("🪔 Sharing is caring! Gift your mithai box to a friend with `!mithai @friend`!");
  }

  diwaliState.sweetsSentCount += 1;
  saveState();

  const sweet = MITHAI_COLLECTION[Math.floor(Math.random() * MITHAI_COLLECTION.length)];

  const embed = new EmbedBuilder()
    .setColor(0xEC4899)
    .setTitle(`🍬 Diwali Sweet Gift from ${message.author.username}!`)
    .setDescription(
      `### 🪔 Happy Diwali, <@${recipient.id}>!\n\n` +
      `<@${message.author.id}> has sent you a royal festive box of:\n\n` +
      `# ${sweet.emoji} ${sweet.name}\n` +
      `> *${sweet.desc}*\n\n` +
      `May this celebration bring supreme sweetness, warmth, and lifelong joy to your friendship! ✨`
    )
    .setFooter({ text: 'Diwali Mithai Delivery • Krims Code Cultural Hub' });

  return message.reply({ content: `🎁 <@${recipient.id}>, you received festive Diwali mithai!`, embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. 🎆 Safe Virtual Fireworks (!fireworks / !patakha)
// ═════════════════════════════════════════════════════════════════════════════
export async function handleFireworksCommand(message) {
  const sounds = [
    "✨ *PHOOOOSH... KABOOOM!* 🎆✨",
    "💥 *CHAKKAR SPARKLE... RAT-TAT-TAT!* 🎇⚡",
    "🌟 *ANAR FOUNTAIN OF GOLDEN LIGHT!* 🪔✨",
    "🚀 *ROCKET SOARS TO THE SKY... BANG!* 🎆🌌"
  ];
  const soundChoice = sounds[Math.floor(Math.random() * sounds.length)];

  const embed = new EmbedBuilder()
    .setColor(0x8B5CF6)
    .setTitle('🎆✨ DIWALI VIRTUAL FIREWORKS SPECTACULAR ✨🎆')
    .setDescription(
      `### ${soundChoice}\n\n` +
      `\`\`\`text\n` +
      `       . : * . : * .\n` +
      `     : * .  ★  . * :\n` +
      `   . *  \\  |  /  * .\n` +
      `  *   -- 💥 --   *\n` +
      `   . *  /  |  \\  * .\n` +
      `     : * .  ★  . * :\n` +
      `       . : * . : * .\n` +
      `\`\`\`\n` +
      `✨ **Eco-Friendly, 100% Smoke-Free Virtual Celebration!**\n` +
      `Celebrating Indian heritage with dazzling light across the server!`
    )
    .setFooter({ text: 'Happy Diwali • Safe, Bright & Joyous Celebrations!' });

  return message.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. 🔘 Button Interactions Router
// ═════════════════════════════════════════════════════════════════════════════
export async function handleDiwaliButton(interaction) {
  const userId = interaction.user.id;
  const currencySymbol = interaction.guild?.id === '1538225337048236082' ? 'KC' : 'KR';

  if (interaction.customId === 'diwali_light_diya') {
    diwaliState.totalDiyasLit += 1;
    const userCount = (diwaliState.userDiyas[userId] || 0) + 1;
    diwaliState.userDiyas[userId] = userCount;
    saveState();

    try {
      addCoins(userId, 100);
    } catch (e) {}

    const blessing = DIWALI_BLESSINGS[Math.floor(Math.random() * DIWALI_BLESSINGS.length)];

    return interaction.reply({
      content: 
        `🪔 **You lit a sacred Diwali Diya!**\n\n` +
        `*"${blessing}"*\n\n` +
        `✨ **Your Total Diyas:** \`${userCount}\` | 🌐 **Global:** \`${diwaliState.totalDiyasLit.toLocaleString()}\`\n` +
        `💰 **Reward:** \`+100 ${currencySymbol}\``,
      ephemeral: true
    });
  }

  if (interaction.customId === 'diwali_claim_blessing') {
    const lastClaim = diwaliState.usersClaimedDaily[userId] || 0;
    const now = Date.now();
    const oneDayMs = 24 * 60 * 60 * 1000;

    if (now - lastClaim < oneDayMs) {
      const remainingHrs = Math.ceil((oneDayMs - (now - lastClaim)) / (60 * 60 * 1000));
      return interaction.reply({
        content: `⏳ You have already received your daily **Lakshmi Blessing**! Please return in **${remainingHrs} hours** for another festival reward. 🪔`,
        ephemeral: true
      });
    }

    diwaliState.usersClaimedDaily[userId] = now;
    saveState();

    try {
      addCoins(userId, 500);
    } catch (e) {}

    return interaction.reply({
      content: 
        `🎁✨ **Shubh Deepavali! You received the Daily Lakshmi Blessing!**\n\n` +
        `💰 **Bonus Added:** \`+500 ${currencySymbol}\`\n` +
        `🪔 *May the auspicious light of Diwali fill your life with eternal prosperity and peace.*`,
      ephemeral: true
    });
  }

  if (interaction.customId === 'diwali_burst_patakha') {
    return interaction.reply({
      content: 
        `🎆✨ **BOOOOOM! WHEEEE-POP!** 🎇✨\n` +
        `\`\`\`text\n` +
        `     ★ . * . ★ . *\n` +
        `   *   \\  |  /   *\n` +
        `  .  --  💥  --  .\n` +
        `   *   /  |  \\   *\n` +
        `     ★ . * . ★ . *\n` +
        `\`\`\`\n` +
        `Safe virtual eco-fireworks ignited by <@${userId}>! Happy Diwali! 🪔🌟`,
      ephemeral: false
    });
  }
}
