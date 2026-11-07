import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { getBalance, removeCoins, addCoins, addXp } from '../databaseEngine.mjs';

// Cooldown map to prevent spamming
const commandCooldowns = new Map(); // userId -> { command -> timestamp }

function checkCooldown(userId, command, cooldownMs = 3000) {
  const now = Date.now();
  if (!commandCooldowns.has(userId)) commandCooldowns.set(userId, {});
  const userCd = commandCooldowns.get(userId);
  if (userCd[command] && now - userCd[command] < cooldownMs) {
    return Math.ceil((cooldownMs - (now - userCd[command])) / 1000);
  }
  userCd[command] = now;
  return 0;
}

// ═════════════════════════════════════════════════════════════════════════════
// 1. 🪙 !bet <amount> [heads|tails] — Wager KR / KryloCoins in 50/50 Coinflip
// ═════════════════════════════════════════════════════════════════════════════
export async function handleBetCommand(message, args, customCurrency = null) {
  if (!message.guild) return message.reply("❌ The `!bet` command can only be used inside servers!");

  const cd = checkCooldown(message.author.id, 'bet', 2500);
  if (cd > 0) return message.reply(`⏳ Slow down! Please wait **${cd}s** before betting again.`);

  const currencySymbol = customCurrency?.symbol || (message.guild.id === '1538225337048236082' ? 'KC' : 'KR');
  const currencyName = customCurrency?.name || (message.guild.id === '1538225337048236082' ? 'KryloCoins' : 'Krims Rewards');

  const balObj = getBalance(message.author.id);
  const currentBal = balObj ? (balObj.krylocoins || 0) : 0;

  if (!args[0]) {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xF59E0B)
          .setTitle(`🪙 How to Bet (${currencyName})`)
          .setDescription(
            `**Usage:** \`!bet <amount> [heads|tails]\`\n\n` +
            `**Examples:**\n` +
            `• \`!bet 100 heads\` — Bet 100 ${currencySymbol} on Heads\n` +
            `• \`!bet 500 tails\` — Bet 500 ${currencySymbol} on Tails\n` +
            `• \`!bet all heads\` — All-in wager on Heads!\n` +
            `• \`!bet half\` — 50/50 coinflip with half your wallet\n\n` +
            `💰 **Your Current Balance:** \`${Number(currentBal).toLocaleString()} ${currencySymbol}\`\n` +
            `⚡ **Payout:** 2x your bet on win!`
          )
          .setFooter({ text: `${currencyName} Casino Engine • Krims Code Studio` })
      ]
    });
  }

  // Parse amount
  let betAmount = 0;
  const rawAmt = args[0].toLowerCase();
  if (rawAmt === 'all' || rawAmt === 'max') {
    betAmount = currentBal;
  } else if (rawAmt === 'half') {
    betAmount = Math.floor(currentBal / 2);
  } else {
    betAmount = parseInt(rawAmt, 10);
  }

  if (isNaN(betAmount) || betAmount <= 0) {
    return message.reply(`❌ Invalid bet amount! Please enter a positive number, \`all\`, or \`half\`.`);
  }

  if (betAmount < 10) {
    return message.reply(`❌ Minimum bet is **10 ${currencySymbol}**!`);
  }

  if (currentBal < betAmount) {
    return message.reply(`❌ **Insufficient funds!** You only have **${Number(currentBal).toLocaleString()} ${currencySymbol}** in your wallet.\nUse \`!daily\` to claim free daily coins!`);
  }

  // Parse prediction
  let prediction = 'heads';
  if (args[1]) {
    const rawChoice = args[1].toLowerCase();
    if (rawChoice === 'tails' || rawChoice === 'tail' || rawChoice === 't') {
      prediction = 'tails';
    } else if (rawChoice === 'heads' || rawChoice === 'head' || rawChoice === 'h') {
      prediction = 'heads';
    } else {
      return message.reply(`❌ Invalid choice! Choose either \`heads\` or \`tails\`. Example: \`!bet ${betAmount} heads\``);
    }
  }

  // Deduct coins first
  const deducted = removeCoins(message.author.id, betAmount);
  if (!deducted) {
    return message.reply(`❌ Transaction failed. Insufficient funds!`);
  }

  // Flip the coin
  const outcome = Math.random() < 0.5 ? 'heads' : 'tails';
  const won = outcome === prediction;

  const outcomeEmoji = outcome === 'heads' ? '🪙' : '🦅';
  const choiceEmoji = prediction === 'heads' ? '🪙' : '🦅';

  if (won) {
    const winPayout = betAmount * 2;
    addCoins(message.author.id, winPayout);
    addXp(message.author.id, Math.min(Math.floor(betAmount * 0.1), 50));
    const newBal = getBalance(message.author.id).krylocoins;

    const winEmbed = new EmbedBuilder()
      .setColor(0x10B981) // Emerald Green
      .setTitle(`🎉 VICTORY! You Doubled Your Bet!`)
      .setDescription(
        `The coin landed on **${outcomeEmoji} ${outcome.toUpperCase()}**!\n\n` +
        `• **Your Call:** ${choiceEmoji} **${prediction.toUpperCase()}** ✅\n` +
        `• **Winnings:** **+${Number(betAmount).toLocaleString()} ${currencySymbol}** *(2x Payout)*\n` +
        `• **New Balance:** \`${Number(newBal).toLocaleString()} ${currencySymbol}\``
      )
      .setFooter({ text: `Krims Casino • Coinflip Arena` })
      .setTimestamp();

    return message.reply({ embeds: [winEmbed] });
  } else {
    const newBal = getBalance(message.author.id).krylocoins;

    const loseEmbed = new EmbedBuilder()
      .setColor(0xEF4444) // Crimson Red
      .setTitle(`💀 DEFEAT! The House Wins!`)
      .setDescription(
        `The coin landed on **${outcomeEmoji} ${outcome.toUpperCase()}**!\n\n` +
        `• **Your Call:** ${choiceEmoji} **${prediction.toUpperCase()}** ❌\n` +
        `• **Lost:** **-${Number(betAmount).toLocaleString()} ${currencySymbol}**\n` +
        `• **Remaining Balance:** \`${Number(newBal).toLocaleString()} ${currencySymbol}\``
      )
      .setFooter({ text: `Better luck next time! • Use !daily for free coins` })
      .setTimestamp();

    return message.reply({ embeds: [loseEmbed] });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 2. ✂️ !rps <rock|paper|scissors> — Rock, Paper, Scissors vs AI
// ═════════════════════════════════════════════════════════════════════════════
export async function handleRpsCommand(message, args, customCurrency = null) {
  if (!message.guild) return message.reply("❌ `!rps` can only be used inside servers!");

  const choices = ['rock', 'paper', 'scissors'];
  const emojis = { rock: '🪨', paper: '📄', scissors: '✂️' };

  const raw = (args[0] || '').toLowerCase();
  let userChoice = null;
  if (raw === 'r' || raw === 'rock') userChoice = 'rock';
  if (raw === 'p' || raw === 'paper') userChoice = 'paper';
  if (raw === 's' || raw === 'scissors') userChoice = 'scissors';

  if (!userChoice) {
    return message.reply(`❌ **Usage:** \`!rps <rock|paper|scissors>\`\nExample: \`!rps rock\``);
  }

  const botChoice = choices[Math.floor(Math.random() * choices.length)];
  const currencySymbol = customCurrency?.symbol || (message.guild.id === '1538225337048236082' ? 'KC' : 'KR');

  let result = 'tie';
  if (
    (userChoice === 'rock' && botChoice === 'scissors') ||
    (userChoice === 'paper' && botChoice === 'rock') ||
    (userChoice === 'scissors' && botChoice === 'paper')
  ) {
    result = 'win';
  } else if (userChoice !== botChoice) {
    result = 'lose';
  }

  if (result === 'win') {
    const reward = 50;
    addCoins(message.author.id, reward);
    addXp(message.author.id, 15);
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x10B981)
          .setTitle(`🎉 You Won Rock-Paper-Scissors!`)
          .setDescription(
            `You chose: ${emojis[userChoice]} **${userChoice.toUpperCase()}**\n` +
            `AI chose: ${emojis[botChoice]} **${botChoice.toUpperCase()}**\n\n` +
            `🏆 **Reward:** **+${reward} ${currencySymbol}** & **+15 XP**!`
          )
      ]
    });
  } else if (result === 'lose') {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xEF4444)
          .setTitle(`🤖 AI Won Rock-Paper-Scissors!`)
          .setDescription(
            `You chose: ${emojis[userChoice]} **${userChoice.toUpperCase()}**\n` +
            `AI chose: ${emojis[botChoice]} **${botChoice.toUpperCase()}**\n\n` +
            `Nice try! Play again anytime with \`!rps <choice>\`!`
          )
      ]
    });
  } else {
    return message.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0xFBBF24)
          .setTitle(`🤝 It's a Tie!`)
          .setDescription(
            `Both picked ${emojis[userChoice]} **${userChoice.toUpperCase()}**!\n` +
            `Rematch? Try again with \`!rps <choice>\`!`
          )
      ]
    });
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 3. 🧠 !trivia / !quiz — Interactive Trivia Minigame
// ═════════════════════════════════════════════════════════════════════════════
const TRIVIA_QUESTIONS = [
  {
    q: "In Blox Fruits, which sea contains the Ghost Ship, Leviathan, and Mirage Island?",
    options: ["First Sea", "Second Sea", "Third Sea", "Fourth Sea"],
    correct: 2
  },
  {
    q: "What is the primary currency used in the Krims Code ecosystem?",
    options: ["Bitcoin", "Krims Rewards (KR)", "Robux", "Emeralds"],
    correct: 1
  },
  {
    q: "In Minecraft, how many obsidian blocks are needed to build the smallest Nether Portal?",
    options: ["8", "10", "12", "14"],
    correct: 1
  },
  {
    q: "Which fruit in Blox Fruits is famously known as the best for grinding and raids?",
    options: ["Buddha", "Rocket", "Spin", "Bomb"],
    correct: 0
  },
  {
    q: "What programming language powers the Krims Code Discord Bot Engine?",
    options: ["Python", "JavaScript / Node.js", "C++", "Rust"],
    correct: 1
  },
  {
    q: "In Minecraft, what ore is required to craft Netherite ingots alongside gold?",
    options: ["Ancient Debris", "Lapis Lazuli", "Coal", "Quartz"],
    correct: 0
  }
];

export async function handleTriviaCommand(message, customCurrency = null) {
  if (!message.guild) return message.reply("❌ `!trivia` can only be used inside servers!");

  const item = TRIVIA_QUESTIONS[Math.floor(Math.random() * TRIVIA_QUESTIONS.length)];
  const currencySymbol = customCurrency?.symbol || (message.guild.id === '1538225337048236082' ? 'KC' : 'KR');

  const row = new ActionRowBuilder();
  item.options.forEach((opt, idx) => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`trivia_${idx}`)
        .setLabel(`${idx + 1}. ${opt}`)
        .setStyle(ButtonStyle.Secondary)
    );
  });

  const promptEmbed = new EmbedBuilder()
    .setColor(0x3B82F6)
    .setTitle(`🧠 Trivia Challenge: Test Your Knowledge!`)
    .setDescription(
      `**Question:**\n>>> ${item.q}\n\n` +
      `⏱️ *First player to click the correct button in 20 seconds wins **+75 ${currencySymbol}** & **+25 XP**!*`
    )
    .setFooter({ text: 'Krims Trivia Brain • Click a button below!' });

  const replyMsg = await message.channel.send({ embeds: [promptEmbed], components: [row] });

  const filter = i => i.customId.startsWith('trivia_');
  const collector = replyMsg.createMessageComponentCollector({ filter, time: 20000, max: 1 });

  collector.on('collect', async interaction => {
    const chosenIndex = parseInt(interaction.customId.split('_')[1], 10);
    const correctOpt = item.options[item.correct];

    if (chosenIndex === item.correct) {
      addCoins(interaction.user.id, 75);
      addXp(interaction.user.id, 25);

      const winRow = new ActionRowBuilder();
      item.options.forEach((opt, idx) => {
        winRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`done_${idx}`)
            .setLabel(`${idx + 1}. ${opt}`)
            .setStyle(idx === item.correct ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setDisabled(true)
        );
      });

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0x10B981)
            .setTitle(`🎉 CORRECT ANSWER!`)
            .setDescription(
              `Awesome job <@${interaction.user.id}>! You got it right!\n\n` +
              `• **Correct Answer:** **${correctOpt}**\n` +
              `• **Reward:** **+75 ${currencySymbol}** & **+25 XP** added to your account!`
            )
        ],
        components: [winRow]
      });
    } else {
      const failRow = new ActionRowBuilder();
      item.options.forEach((opt, idx) => {
        failRow.addComponents(
          new ButtonBuilder()
            .setCustomId(`done_${idx}`)
            .setLabel(`${idx + 1}. ${opt}`)
            .setStyle(idx === item.correct ? ButtonStyle.Success : (idx === chosenIndex ? ButtonStyle.Danger : ButtonStyle.Secondary))
            .setDisabled(true)
        );
      });

      await interaction.update({
        embeds: [
          new EmbedBuilder()
            .setColor(0xEF4444)
            .setTitle(`❌ WRONG ANSWER!`)
            .setDescription(
              `<@${interaction.user.id}> guessed **${item.options[chosenIndex]}**, which is incorrect!\n\n` +
              `• **The Correct Answer Was:** **${correctOpt}**\n` +
              `Better luck next time! Try again with \`!trivia\`!`
            )
        ],
        components: [failRow]
      });
    }
  });

  collector.on('end', async (collected, reason) => {
    if (reason === 'time' && collected.size === 0) {
      await replyMsg.edit({
        embeds: [
          new EmbedBuilder()
            .setColor(0x64748B)
            .setTitle(`⏰ Time's Up!`)
            .setDescription(`Nobody answered in time! The correct answer was: **${item.options[item.correct]}**`)
        ],
        components: []
      }).catch(() => {});
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 4. 🔥 !roast & 💖 !compliment
// ═════════════════════════════════════════════════════════════════════════════
const PRESET_ROASTS = [
  "You play like you're using a steering wheel for a keyboard.",
  "Your WiFi connection has more drops than a Skrillex concert.",
  "If lag was an art form, you'd be Picasso.",
  "I've seen NPCs with better decision making.",
  "You're the reason our team has a spectate mode."
];

const PRESET_COMPLIMENTS = [
  "Your gaming sense is genuinely legendary!",
  "The server is honestly 10x more fun whenever you're chatting in here.",
  "You've got top-tier clutch potential in every match.",
  "Your positivity in chat keeps the whole squad going!",
  "Certified MVP of the server — keep grinding!"
];

export async function handleRoastCommand(message, targetUser) {
  const target = targetUser || message.mentions.users.first() || message.author;
  const roast = PRESET_ROASTS[Math.floor(Math.random() * PRESET_ROASTS.length)];
  return message.reply({
    content: `🔥 <@${target.id}>, ${roast}`
  });
}

export async function handleComplimentCommand(message, targetUser) {
  const target = targetUser || message.mentions.users.first() || message.author;
  const comp = PRESET_COMPLIMENTS[Math.floor(Math.random() * PRESET_COMPLIMENTS.length)];
  return message.reply({
    content: `💖 <@${target.id}>, ${comp}`
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// 5. 🤝 !partners — Official Partnership Hub
// ═════════════════════════════════════════════════════════════════════════════
export async function handlePartnersCommand(message) {
  const embed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle('🤝 Official Krims Code Ecosystem Partnerships')
    .setDescription(
      `Krims Code powers an autonomous triumvirate of cutting-edge developer platforms. Free access is open to all community members:\n\n` +
      `🎙️ **Krims Voice AI**\n` +
      `>>> Ultra-low latency neural speech and real-time audio interaction in Discord voice channels.\n` +
      `• *Command:* \`/voice\` or \`!voice\`\n\n` +
      `💻 **Krims Code CLI**\n` +
      `>>> Command-line interface to deploy bots, sync guild databases, and inspect live metrics from your local terminal.\n` +
      `• *Get Key:* \`/cli-key\`\n\n` +
      `📦 **Krims SDK**\n` +
      `>>> JavaScript/TypeScript client library to integrate with Krims Cloud Lakebase, XP, and economy APIs.`
    )
    .addFields(
      { name: '🌐 Live Dashboard', value: '[Open Dashboard](https://krims-bot-dashboard.vercel.app)', inline: true },
      { name: '⏳ v6.0 Radar', value: '[View Roadmap](https://krims-bot-dashboard.vercel.app/updates)', inline: true }
    )
    .setFooter({ text: 'Krims Code Core v6.0 Ready' })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 6. ⚡ !aura / !krylo — Krylo Supreme Animated Aura Showcase
// ═════════════════════════════════════════════════════════════════════════════
export async function handleAuraCommand(message) {
  const gifUrl = 'https://krims-discord-bot-d57m.onrender.com/gifs/krylo_aura_all_in_one.gif';
  const embed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle('⚡ KRYLO SUPREME AURA • +1,000,000 AURA ⚡')
    .setDescription(
      `👑 **Java Minecraft Player:** \`KryloMCYT\`\n` +
      `⚔️ **Factions:** [IND] • The Light Bearers [TLB]\n` +
      `⚡ **Sovereignty:** Infinite Aura • God of Code & PvP\n\n` +
      `*Domination across Elite SMP, TLB, and KryloSMP.*`
    )
    .setImage(gifUrl)
    .setFooter({ text: 'Krims Code • Powered by Krylo', iconURL: 'https://cdn.discordapp.com/avatars/1414143825538191373/90c635bbd2b9deb44f9c6564891eaee4.png' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setLabel('View HD GIF')
      .setStyle(ButtonStyle.Link)
      .setURL(gifUrl),
    new ButtonBuilder()
      .setLabel('Elite SMP Edition')
      .setStyle(ButtonStyle.Link)
      .setURL('https://krims-discord-bot-d57m.onrender.com/gifs/krylo_elite_smp_ind_aura.gif'),
    new ButtonBuilder()
      .setLabel('TLB Edition')
      .setStyle(ButtonStyle.Link)
      .setURL('https://krims-discord-bot-d57m.onrender.com/gifs/krylo_mc_aura.gif')
  );

  return message.reply({ embeds: [embed], components: [row] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 7. 🗺️ !roadmap / !schedule — Autonomous Release Matrix (2026 -> 2027)
// ═════════════════════════════════════════════════════════════════════════════
import { getEcosystemReleaseStatus } from './timeGatedReleaseEngine.mjs';

export async function handleRoadmapCommand(message) {
  const status = getEcosystemReleaseStatus();
  
  const stageLines = status.allStages.map((s, idx) => {
    const icon = s.isTriggered ? '✅' : '⏳';
    return `${icon} **Stage ${idx + 1}: ${s.version}**\n` +
           `> **Date:** \`${s.dateString.substring(0, 16)}\`\n` +
           `> **Feature:** *${s.summary}*`;
  }).join('\n\n');

  const embed = new EmbedBuilder()
    .setColor(0x00F2FF)
    .setTitle('🚀 KRIMS CODE AUTONOMOUS RELEASE MATRIX (2026 — 2027)')
    .setDescription(
      `### 🤖 100% Hands-Free Autopilot Schedule\n` +
      `The bot self-deploys all updates automatically on Render at exact dates without needing developer intervention.\n\n` +
      `**Current Status:** \`${status.countdownText}\`\n\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
      `${stageLines}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    )
    .setFooter({ text: 'Krims Code Autopilot • Zero Maintenance Required' })
    .setTimestamp();

  return message.reply({ embeds: [embed] });
}

// ═════════════════════════════════════════════════════════════════════════════
// 8. ❄️ !snowball @user — Winter Minigame
// ═════════════════════════════════════════════════════════════════════════════
export async function handleSnowballCommand(message, targetUser) {
  const target = targetUser || message.mentions.users.first();
  if (!target) {
    return message.reply("❄️ **Usage:** `!snowball @user` — Throw a snowball at a friend in chat!");
  }

  const roll = Math.random();
  if (roll < 0.25) {
    return message.reply(`💨 **WHOOSH!** <@${target.id}> swiftly ducked into the snow! <@${message.author.id}>'s snowball completely missed! ⛄`);
  } else if (roll < 0.85) {
    return message.reply(`❄️ **SPLAT!** <@${message.author.id}> threw a crisp snowball that hit <@${target.id}> right on the shoulder! 🥶`);
  } else {
    try { addCoins(message.author.id, 50); } catch (_) {}
    return message.reply(`🎯 **CRITICAL HIT!** <@${message.author.id}> launched an icy mega-snowball straight at <@${target.id}>! (+50 Coins bonus) 🧊💥`);
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// 9. 🥧 !feast / !harvest — Autumn Harvest Bounty
// ═════════════════════════════════════════════════════════════════════════════
export async function handleFeastCommand(message) {
  const currencySymbol = message.guild?.id === '1538225337048236082' ? 'KC' : 'KR';
  try { addCoins(message.author.id, 100); } catch (_) {}

  const dishes = ['🥧 Warm Pumpkin Pie', '🌽 Roasted Sweet Corn', '🍎 Spiced Apple Cider', '🥖 Fresh Baked Brioche', '🍯 Glazed Honey Ham'];
  const dish = dishes[Math.floor(Math.random() * dishes.length)];

  const embed = new EmbedBuilder()
    .setColor(0xEAB308)
    .setTitle('🌾 Autumn Harvest Feast Shared! 🦃')
    .setDescription(
      `<@${message.author.id}> served a delicious **${dish}** for the community!\n\n` +
      `💰 **Harvest Blessing:** \`+100 ${currencySymbol}\` awarded to your wallet!\n` +
      `🍂 *May your season be filled with warmth and good fortune.*`
    )
    .setFooter({ text: 'Harvest Season • Krims Code Seasonal Engine' });

  return message.reply({ embeds: [embed] });
}
