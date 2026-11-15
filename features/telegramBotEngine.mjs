import { Bot, InlineKeyboard } from 'grammy';
import { GoogleGenAI } from '@google/genai';
import { getBalance, addCoins, transferRewards, db } from '../databaseEngine.mjs';

// Setup local table for Telegram <-> Discord linking
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS telegram_links (
      telegram_id TEXT PRIMARY KEY,
      discord_id TEXT UNIQUE,
      username TEXT,
      linked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `).run();
} catch (e) {
  console.warn('[Telegram Engine] Table init warning:', e.message);
}

// Telegram Daily Claims table
try {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS telegram_daily (
      telegram_id TEXT PRIMARY KEY,
      last_claim INTEGER,
      streak INTEGER DEFAULT 1
    )
  `).run();
} catch (e) {}

// Setup Gemini AI Client Cascade
const GEMINI_KEYS = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY_2,
  process.env.GEMINI_API_KEY_3,
  process.env.GEMINI_API_KEY_4
].filter(Boolean);

let geminiClients = [];
let geminiKeyIndex = 0;
for (const k of GEMINI_KEYS) {
  try {
    geminiClients.push(new GoogleGenAI({ apiKey: k }));
  } catch (e) {}
}

function rotateGeminiKey() {
  if (geminiClients.length <= 1) return;
  geminiKeyIndex = (geminiKeyIndex + 1) % geminiClients.length;
}

const SYSTEM_PROMPT = `You are Krims, an advanced autonomous neural AI assistant built by Krylo 亗 for the Krims Code ecosystem.
You are running natively on Telegram.
You are helpful, sharp, modern, friendly, and expert in coding, gaming, Discord, and Telegram communities.
Your economy uses Krims Rewards (Kr).
Keep answers crisp, well-formatted, and helpful. Use emojis tastefully. Avoid robotic boilerplate.`;

async function generateAIResponse(userPrompt, userName = 'Friend') {
  if (geminiClients.length === 0) {
    return "🧠 Krims Neural Brain is currently running on low compute. Please try again shortly!";
  }

  const client = geminiClients[geminiKeyIndex];
  rotateGeminiKey();

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  for (const model of models) {
    try {
      const response = await client.models.generateContent({
        model: model,
        contents: [
          {
            role: 'user',
            parts: [{ text: `${SYSTEM_PROMPT}\n\nUser (${userName}): ${userPrompt}` }]
          }
        ]
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err) {
      console.warn(`[Telegram AI] Model ${model} error:`, err.message);
    }
  }

  return "⚠️ My neural brain is momentarily busy. Please try asking again in a few seconds!";
}

function getEffectiveId(telegramId) {
  try {
    const row = db.prepare('SELECT discord_id FROM telegram_links WHERE telegram_id = ?').get(String(telegramId));
    if (row && row.discord_id) {
      return { id: row.discord_id, isLinked: true, discordId: row.discord_id };
    }
  } catch (e) {}
  return { id: `tg_${telegramId}`, isLinked: false, discordId: null };
}

let botInstance = null;

export async function initTelegramBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('ℹ️ [Telegram] TELEGRAM_BOT_TOKEN is not configured. Telegram bot paused on standby.');
    return null;
  }

  try {
    const bot = new Bot(token);
    botInstance = bot;

    // 1. /start command
    bot.command('start', async (ctx) => {
      const firstName = ctx.from?.first_name || 'Adventurer';
      const tgId = ctx.from?.id;
      const { id: effectiveId, isLinked, discordId } = getEffectiveId(tgId);
      const bal = getBalance(effectiveId).krylocoins;

      const keyboard = new InlineKeyboard()
        .text('💎 Check Balance', 'action_balance')
        .text('🎁 Claim Daily Kr', 'action_daily')
        .row()
        .url('🎮 Join Discord Server', 'https://discord.gg/uB93g9Hrhh')
        .url('🌐 Open Web Dashboard', 'https://krims-bot-dashboard.vercel.app');

      const welcomeMsg = 
        `⚡ *Welcome to Krims Code on Telegram!* ⚡\n\n` +
        `Hey *${firstName}*! I am the official Krims Neural AI assistant, now running live on mobile.\n\n` +
        `💎 *Your Kr Balance:* \`${bal.toLocaleString()} KR\`\n` +
        `🔗 *Account Status:* ${isLinked ? `Linked to Discord (\`${discordId}\`)` : '📱 Standalone Telegram Wallet (Use `/link` to connect Discord & get +1,000 KR!)'}\n\n` +
        `💬 *What you can do here:*\n` +
        `• *Chat with AI:* Just send me any message or question!\n` +
        `• *Check Balance:* Type \`/balance\`\n` +
        `• *Daily Streak:* Type \`/daily\`\n` +
        `• *Transfer Kr:* Type \`/pay <user> <amount>\`\n` +
        `• *Link Discord:* Type \`/link <your_discord_id>\`\n\n` +
        `_Built with precision by Krylo 亗 • "Dream higher, build higher."_`;

      await ctx.reply(welcomeMsg, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });

    // 2. /help command
    bot.command('help', async (ctx) => {
      const helpText = 
        `📖 *Krims Code Telegram Commands*\n\n` +
        `🧠 *AI & Chat:*\n` +
        `• Just send any normal text message to chat with Krims Neural AI!\n` +
        `• \`/ai <prompt>\` — Force an AI inference query\n\n` +
        `💎 *Krims Economy (Kr):*\n` +
        `• \`/balance\` — View your current Kr balance & wallet ID\n` +
        `• \`/daily\` — Claim daily Kr rewards & maintain your streak\n` +
        `• \`/pay <@username/id> <amount>\` — Send Kr to another user\n` +
        `• \`/link <discord_id>\` — Link your Discord account (+1,000 KR bonus!)\n\n` +
        `⚙️ *System:*\n` +
        `• \`/ping\` — Check bot latency and cloud health\n` +
        `• \`/start\` — Re-open main hub menu\n\n` +
        `🌐 *Dashboard:* https://krims-bot-dashboard.vercel.app`;

      await ctx.reply(helpText, { parse_mode: 'Markdown' });
    });

    // 3. /balance command
    bot.command(['balance', 'bal', 'kr'], async (ctx) => {
      const tgId = ctx.from?.id;
      const { id: effectiveId, isLinked, discordId } = getEffectiveId(tgId);
      const bal = getBalance(effectiveId).krylocoins;

      const keyboard = new InlineKeyboard()
        .text('🎁 Claim Daily', 'action_daily')
        .url('💎 Rewards Vault', 'https://krims-bot-dashboard.vercel.app/rewards');

      const text = 
        `💎 *KRIMS REWARDS WALLET*\n\n` +
        `💰 *Balance:* \`${bal.toLocaleString()} KR\`\n` +
        `👤 *Wallet ID:* \`${effectiveId}\`\n` +
        `🔗 *Discord Link:* ${isLinked ? `Connected (\`${discordId}\`)` : '❌ Not Linked (Type `/link <id>` to merge & claim +1,000 KR!)'}`;

      await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
    });

    // 4. /daily command
    bot.command('daily', async (ctx) => {
      const tgId = ctx.from?.id;
      const { id: effectiveId } = getEffectiveId(tgId);

      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      let row = null;
      try {
        row = db.prepare('SELECT last_claim, streak FROM telegram_daily WHERE telegram_id = ?').get(String(tgId));
      } catch (e) {}

      if (row && row.last_claim && now - row.last_claim < oneDayMs) {
        const remaining = oneDayMs - (now - row.last_claim);
        const hours = Math.floor(remaining / (60 * 60 * 1000));
        const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
        return ctx.reply(`⏳ *Daily Cooldown Active!*\nYou have already claimed your daily reward. Come back in *${hours}h ${mins}m*!`, { parse_mode: 'Markdown' });
      }

      const isStreakAlive = row && row.last_claim && now - row.last_claim < (oneDayMs * 2);
      const newStreak = isStreakAlive ? ((row.streak || 1) + 1) : 1;
      const reward = 150 + ((newStreak - 1) * 25);

      addCoins(effectiveId, reward);

      try {
        db.prepare(`
          INSERT INTO telegram_daily (telegram_id, last_claim, streak) VALUES (?, ?, ?)
          ON CONFLICT(telegram_id) DO UPDATE SET last_claim = excluded.last_claim, streak = excluded.streak
        `).run(String(tgId), now, newStreak);
      } catch (e) {}

      const newBal = getBalance(effectiveId).krylocoins;
      const text = 
        `🎉 *DAILY KR REWARD CLAIMED!* 🎉\n\n` +
        `🪙 *Earned:* \`+${reward} KR\`\n` +
        `🔥 *Daily Streak:* \`${newStreak} Days\`\n` +
        `💎 *New Balance:* \`${newBal.toLocaleString()} KR\``;

      await ctx.reply(text, { parse_mode: 'Markdown' });
    });

    // 5. /link command
    bot.command('link', async (ctx) => {
      const tgId = ctx.from?.id;
      const username = ctx.from?.username || ctx.from?.first_name || 'User';
      const text = ctx.message?.text?.trim() || '';
      const parts = text.split(/\s+/);

      if (parts.length < 2) {
        return ctx.reply(
          `🔗 *Link Your Discord Account*\n\n` +
          `Link your Discord account to share your Kr balance and unlock a *+1,000 KR one-time bonus*!\n\n` +
          `*Syntax:*\n\`/link <your_discord_id>\`\n\n` +
          `_Example:_ \`/link 1414143825538191373\`\n` +
          `_(To find your Discord ID, enable Developer Mode in Discord, right-click your profile, and select "Copy User ID")_`,
          { parse_mode: 'Markdown' }
        );
      }

      const discordId = parts[1].replace(/[^0-9]/g, '');
      if (discordId.length < 17 || discordId.length > 20) {
        return ctx.reply(`❌ Invalid Discord ID. A Discord ID is usually 17-19 digits long.`);
      }

      try {
        const existing = db.prepare('SELECT discord_id FROM telegram_links WHERE telegram_id = ?').get(String(tgId));
        if (existing) {
          return ctx.reply(`ℹ️ Your Telegram is already linked to Discord ID \`${existing.discord_id}\`!`, { parse_mode: 'Markdown' });
        }

        db.prepare('INSERT INTO telegram_links (telegram_id, discord_id, username) VALUES (?, ?, ?)').run(String(tgId), discordId, username);

        // Grant 1,000 KR link bonus to Discord account
        addCoins(discordId, 1000);
        const newBal = getBalance(discordId).krylocoins;

        await ctx.reply(
          `✅ *ACCOUNTS LINKED SUCCESSFULLY!* 🔗\n\n` +
          `Your Telegram is now officially linked to Discord ID \`${discordId}\`!\n` +
          `🎁 *Link Bonus:* \`+1,000 KR\` added to your wallet!\n` +
          `💎 *Total Balance:* \`${newBal.toLocaleString()} KR\`\n\n` +
          `Your balance is now synchronized across Telegram, Discord, and the Web Dashboard!`,
          { parse_mode: 'Markdown' }
        );
      } catch (err) {
        if (err.message && err.message.includes('UNIQUE')) {
          return ctx.reply(`⚠️ That Discord ID is already linked to another Telegram account.`);
        }
        ctx.reply(`❌ Error linking account: ${err.message}`);
      }
    });

    // 6. /ping command
    bot.command('ping', async (ctx) => {
      const start = Date.now();
      const msg = await ctx.reply('🏓 Pinging Krims Cloud Fleet...');
      const latency = Date.now() - start;
      await ctx.api.editMessageText(
        ctx.chat.id,
        msg.message_id,
        `⚡ *Pong!* \`${latency}ms\`\n` +
        `🟢 *Cloud Status:* Render 24/7 Cluster Online\n` +
        `🧠 *Neural AI:* Gemini 3.5 Active\n` +
        `🌐 *Web Portals:* Live`,
        { parse_mode: 'Markdown' }
      );
    });

    // 7. Interactive Callback Buttons (from inline keyboards)
    bot.callbackQuery('action_balance', async (ctx) => {
      await ctx.answerCallbackQuery();
      const tgId = ctx.from?.id;
      const { id: effectiveId, isLinked, discordId } = getEffectiveId(tgId);
      const bal = getBalance(effectiveId).krylocoins;
      await ctx.reply(
        `💎 *Your Balance:* \`${bal.toLocaleString()} KR\`\n` +
        `🔗 *Status:* ${isLinked ? `Linked (\`${discordId}\`)` : 'Standalone (type `/link` to connect Discord)'}`,
        { parse_mode: 'Markdown' }
      );
    });

    bot.callbackQuery('action_daily', async (ctx) => {
      await ctx.answerCallbackQuery();
      const tgId = ctx.from?.id;
      const { id: effectiveId } = getEffectiveId(tgId);

      const now = Date.now();
      const oneDayMs = 24 * 60 * 60 * 1000;
      let row = null;
      try {
        row = db.prepare('SELECT last_claim, streak FROM telegram_daily WHERE telegram_id = ?').get(String(tgId));
      } catch (e) {}

      if (row && row.last_claim && now - row.last_claim < oneDayMs) {
        return ctx.reply(`⏳ Daily reward already claimed today! Check back later.`);
      }

      const reward = 150;
      addCoins(effectiveId, reward);
      try {
        db.prepare(`
          INSERT INTO telegram_daily (telegram_id, last_claim, streak) VALUES (?, ?, 1)
          ON CONFLICT(telegram_id) DO UPDATE SET last_claim = excluded.last_claim
        `).run(String(tgId), now);
      } catch (e) {}

      const newBal = getBalance(effectiveId).krylocoins;
      await ctx.reply(`🎉 *Daily Claimed!* \`+${reward} KR\`\n💎 *New Balance:* \`${newBal.toLocaleString()} KR\``, { parse_mode: 'Markdown' });
    });

    // 8. Natural Language AI Chat in DMs or when tagged
    bot.on('message:text', async (ctx) => {
      const text = ctx.message.text.trim();
      if (text.startsWith('/')) return; // handled by commands

      // In group chats, only respond if bot is mentioned or replied to
      if (ctx.chat.type !== 'private') {
        const isMentioned = ctx.message.entities?.some(
          e => e.type === 'mention' && text.substring(e.offset, e.offset + e.length).toLowerCase() === '@krimscodebot'
        );
        const isReplyToBot = ctx.message.reply_to_message?.from?.id === bot.botInfo.id;
        if (!isMentioned && !isReplyToBot) return;
      }

      await ctx.replyWithChatAction('typing');
      const senderName = ctx.from?.first_name || 'Friend';
      const cleanPrompt = text.replace(/@krimscodebot/gi, '').trim();

      const aiReply = await generateAIResponse(cleanPrompt, senderName);
      await ctx.reply(aiReply, {
        reply_to_message_id: ctx.message.message_id
      });
    });

    // Error handling
    bot.catch((err) => {
      console.error('[Telegram Bot Error]', err.message || err);
    });

    // Start long-polling
    bot.start({
      onStart: (info) => {
        console.log(`✈️ [Telegram] ✅ Bot connected successfully as @${info.username} (${info.id})!`);
      }
    });

    return bot;
  } catch (error) {
    console.error('❌ [Telegram] Failed to initialize Telegram bot:', error);
    return null;
  }
}
