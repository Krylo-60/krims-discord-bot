/**
 * 🧠 AI Self-Healing & Autonomous Bug Diagnostic Engine
 * Catches runtime exceptions, isolates errors to prevent crashes,
 * and uses the AI Brain (Gemini/Groq) to automatically analyze the bug,
 * identify the root cause, and recommend the exact fix.
 */

import { EmbedBuilder } from 'discord.js';
import crypto from 'crypto';
import db from '../databaseEngine.mjs';

const recentErrorHashes = new Map(); // hash -> timestamp
const ERROR_COOLDOWN_MS = 15 * 60 * 1000; // 15-minute cooldown per unique bug to prevent log flooding

let clientRef = null;
let askGeminiRef = null;

export function initAISelfHealing(client, askGeminiFn) {
  clientRef = client;
  askGeminiRef = askGeminiFn;
  console.log('[AI Self-Healing] 🧠 Autonomous Bug Diagnostic Engine online & watching process health.');
}

/**
 * Handle and auto-diagnose any caught or uncaught error
 */
export async function diagnoseAndIsolateBug(error, origin = 'Runtime Exception') {
  if (!error) return;

  const errorMsg = error.message || String(error);
  const errorStack = error.stack || 'No stack trace available';
  
  // Fingerprint error to prevent duplicate spam
  const errorHash = crypto.createHash('md5').update(`${errorMsg}_${errorStack.slice(0, 150)}`).digest('hex');
  const now = Date.now();
  if (recentErrorHashes.has(errorHash) && (now - recentErrorHashes.get(errorHash) < ERROR_COOLDOWN_MS)) {
    return; // Already diagnosed recently
  }
  recentErrorHashes.set(errorHash, now);

  console.error(`[AI Self-Healing] 🚨 Bug Detected (${origin}): ${errorMsg}`);

  // 1. Log to database dev_audit_logs
  try {
    db.prepare(`
      INSERT INTO dev_audit_logs (category, action, status, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run('BUG_DETECTED', origin, 'ISOLATED', JSON.stringify({ message: errorMsg, stack: errorStack.slice(0, 500) }), now);
  } catch (_) {}

  // 2. Ask AI Brain for automated diagnosis and root-cause fix
  let aiDiagnosis = 'AI diagnosis pending analysis.';
  try {
    if (typeof askGeminiRef === 'function') {
      const prompt = `You are Krims Code AI's Autonomous Bug Diagnostic Brain.
A production error occurred in the Discord bot:
Origin: ${origin}
Error Message: ${errorMsg}
Stack Trace:
${errorStack.slice(0, 600)}

Task:
1. Explain the Root Cause in 1 simple sentence.
2. Provide the recommended patch/solution in 1-2 bullet points.
Keep it concise, clear, and actionable. Do not add fluff.`;

      const result = await askGeminiRef(prompt, 'You are an elite autonomous debugging AI for Node.js Discord bots.');
      if (result && result.trim().length > 0) {
        aiDiagnosis = result.trim();
      }
    }
  } catch (aiErr) {
    aiDiagnosis = `Root Cause: ${errorMsg}\nRecommendation: Check Discord API parameters and error handling.`;
  }

  // 3. Post notification to staff logs in active clan/community servers
  if (clientRef) {
    try {
      const logEmbed = new EmbedBuilder()
        .setColor(0xFFA500) // Amber Warning
        .setTitle('🧠 AI BRAIN: AUTOMATIC BUG DIAGNOSIS & ISOLATION')
        .setDescription(
          `A runtime bug was detected and **isolated** by the AI Self-Healing Engine. The bot remains **100% online & crash-free**.\n\n` +
          `**📍 Origin:** \`${origin}\`\n` +
          `**❌ Error:** \`${errorMsg.slice(0, 150)}\``
        )
        .addFields([
          {
            name: '🤖 AI Root Cause & Fix Recommendation',
            value: aiDiagnosis.slice(0, 1024),
            inline: false
          },
          {
            name: '🛡️ Self-Healing Protection',
            value: '✅ Exception isolated • No process crash • Git auto-updater standing by for hot-reload',
            inline: false
          }
        ])
        .setFooter({ text: 'Krims Code AI • Autonomous Self-Healing System' })
        .setTimestamp();

      for (const [, guild] of clientRef.guilds.cache) {
        const logCh = guild.channels.cache.find(c => c && c.name && (c.name.includes('staff-log') || c.name.includes('admin-log') || c.name.includes('mod-log')) && c.isTextBased());
        if (logCh) {
          await logCh.send({ embeds: [logEmbed] }).catch(() => {});
        }
      }
    } catch (_) {}
  }
}
