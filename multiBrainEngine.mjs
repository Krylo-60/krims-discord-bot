/**
 * =============================================================================
 * Krims Code AI - Master Multi-Brain Neural Engine v3.0
 * 
 * 4 Autonomous Specialized Brains:
 *  1. 🛡️ SENTINEL BRAIN   -> Auto-Mod, Anti-Toxicity & Security
 *  2. ⚔️ GAMEPLAY BRAIN   -> KryloSMP Minecraft Knowledge & Lore
 *  3. 🎫 SUPPORT BRAIN    -> Tickets, Payment Verifications & Link Guides
 *  4. 🎉 HYPE BRAIN       -> Event Announcements, Giveaways & Media Hype
 * 
 * Key Pool: Dual Groq API Keys (LPU 500 T/s) + Google Gemini API Failover
 * =============================================================================
 */

import dotenv from 'dotenv';
dotenv.config();

const GROQ_KEYS = [
  process.env.GROQ_API_KEY,
  process.env.GROQ_API_KEY_2
].filter(Boolean);

const GEMINI_KEY = process.env.GEMINI_API_KEY;

let keyIndex = 0;
function getActiveGroqKey() {
  const key = GROQ_KEYS[keyIndex % GROQ_KEYS.length];
  keyIndex++;
  return key;
}

// System Prompts for Each Brain
const BRAIN_SYSTEM_PROMPTS = {
  // BRAIN 1: Security & Moderation
  SENTINEL: `You are Brain 1: The Sentinel Security Brain of Krims Code AI on KryloSMP Discord (1538225337048236082).
Your objective: Rapidly inspect user messages for toxicity, hate speech, spam, scam links, and IP leakers.
Output format: JSON with { "isSafe": boolean, "severity": "CLEAN"|"WARNING"|"PUNISH", "reason": string }`,

  // BRAIN 2: Minecraft & KryloSMP Gameplay Expert
  GAMEPLAY: `You are Brain 2: The Minecraft & Gameplay Expert Brain for KryloSMP.
Server IP: krylosmp.falix.gg:29273 (Java & Bedrock Floodgate compatible).
Network Features:
- Lifesteal SMP: Steal hearts upon killing players, craft revive hearts, seasonal dragon boss.
- Redish BoxPvP: 12 tiered ore mines, NPC trading, instant respawn kits, central PvP arena.
- OneBlock: Infinitely regenerating floating block with 10+ progressive biome phases.
- Practice Duels: Ranked 1v1 Elo queues, Crystal, Nodebuff, and Netherite kits.
- Store: 100% Free Play-to-Earn KryloCoins (KC) at https://krylosmp-store.web.app/
Keep responses friendly, helpful, concise, and formatted with clean Discord markdown.`,

  // BRAIN 3: Support Desk & Ticket Solver
  SUPPORT: `You are Brain 3: The Support & Ticket Solving Brain for KryloSMP Help Desk.
- Guide players through account linking with '/discord link' in-game and sending the 4-digit code to Krims Code AI.
- Help players verify KryloCoins store orders with format 'KRYLO-ORD-XXXX'.
- Address server connectivity, skin issues with /skin, and bug reports with empathetic, professional tone.`,

  // BRAIN 4: Community Hype & Events
  HYPE: `You are Brain 4: The Hype & Events Brain for KryloSMP.
Generate energetic, high-engagement announcements for YouTube videos, TikTok streams, seasonal Boss Fights, and Discord giveaways. Use emojis strategically (⚔️, 👑, 🔥, 💎, 🚀).`
};

/**
 * Query Groq API with automatic key rotation and model fallback
 */
async function queryGroq(systemPrompt, userPrompt, model = 'openai/gpt-oss-120b', maxTokens = 300) {
  const currentKey = getActiveGroqKey();
  
  const payload = {
    model: model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    max_tokens: maxTokens,
    temperature: 0.7
  };

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${currentKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      // Try fallback model if 120b is busy
      if (model !== 'qwen/qwen3.8-27b') {
        return await queryGroq(systemPrompt, userPrompt, 'qwen/qwen3.8-27b', maxTokens);
      }
      throw new Error(`Groq HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    return data.choices[0].message.content || data.choices[0].message.reasoning || '';
  } catch (err) {
    console.error(`[MultiBrain Warning] Groq error, attempting Gemini failover: ${err.message}`);
    return await queryGeminiFallback(systemPrompt, userPrompt);
  }
}

/**
 * Gemini API Failover Brain
 */
async function queryGeminiFallback(systemPrompt, userPrompt) {
  if (!GEMINI_KEY) return '⚠️ AI Engine is currently processing requests. Please retry in a moment!';

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY}`;
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser Request: ${userPrompt}` }]
      }
    ]
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch (err) {
    return '⚡ Krims Code AI Multi-Brain Engine is active.';
  }
}

/**
 * Master Brain Router: Routes tasks to the optimal brain
 */
export async function executeMultiBrainTask(brainType, prompt) {
  const type = brainType.toUpperCase();
  const systemPrompt = BRAIN_SYSTEM_PROMPTS[type] || BRAIN_SYSTEM_PROMPTS.GAMEPLAY;

  console.log(`[🧠 Multi-Brain Router] Routing prompt to BRAIN: ${type}`);
  return await queryGroq(systemPrompt, prompt);
}

// Brain Dispatchers
export const SentinelBrain = (text) => executeMultiBrainTask('SENTINEL', text);
export const GameplayBrain = (question) => executeMultiBrainTask('GAMEPLAY', question);
export const SupportBrain = (ticketQuery) => executeMultiBrainTask('SUPPORT', ticketQuery);
export const HypeBrain = (eventTopic) => executeMultiBrainTask('HYPE', eventTopic);

export default {
  executeMultiBrainTask,
  SentinelBrain,
  GameplayBrain,
  SupportBrain,
  HypeBrain
};
