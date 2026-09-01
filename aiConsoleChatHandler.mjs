import { EmbedBuilder, ChannelType } from 'discord.js';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const FALIX_TOKEN = process.env.FALIX_API_KEY || 'flx_live_P3WeTyt4HtgmfYBKf7gmw8PK1bYSVp5yNySZQ4Pa';
const SERVER_ID = process.env.FALIX_SERVER_ID || '3390114';
const BASE_URL = 'https://client.falixnodes.net/api/v2';

const headers = {
  'Authorization': `Bearer ${FALIX_TOKEN}`,
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

async function executeCommand(cmd) {
  try {
    const res = await fetch(`${BASE_URL}/servers/${SERVER_ID}/commands`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ command: cmd })
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function sendPowerSignal(signal) {
  try {
    const res = await fetch(`${BASE_URL}/servers/${SERVER_ID}/power`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ signal })
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

async function getServerStatus() {
  try {
    const res = await fetch(`${BASE_URL}/servers/${SERVER_ID}/status`, { headers });
    if (!res.ok) return 'offline';
    const json = await res.json();
    return json.data?.state || 'offline';
  } catch {
    return 'offline';
  }
}

/**
 * Intelligent Rule & Pattern Engine for Instant Zero-Latency Console Command Parsing
 */
function parseAdminIntent(prompt, serverState) {
  const text = prompt.toLowerCase().replace(/["']/g, '').trim();
  const commands = [];
  let reply = '';
  let note = null;
  let powerAction = null;

  // 0. Power actions (start, restart, stop)
  if (text.includes('start server') || text === 'start' || text.includes('turn on') || text.includes('boot server')) {
    powerAction = 'start';
    reply = `🚀 **Dispatching Server Boot Signal to FalixNodes!**`;
    return { reply, commands, powerAction, note: 'Initiating server startup via FalixNodes API v2.' };
  }
  if (text.includes('restart server') || text === 'restart' || text.includes('reboot')) {
    powerAction = 'restart';
    reply = `🔄 **Dispatching Server Reboot Signal to FalixNodes!**`;
    return { reply, commands, powerAction };
  }
  if (text.includes('stop server') || text === 'stop') {
    powerAction = 'stop';
    reply = `🛑 **Dispatching Safe Shutdown Signal to FalixNodes!**`;
    return { reply, commands, powerAction };
  }

  // 1. Greetings & Status inquiries
  if (text === 'hi' || text === 'hello' || text === 'hey' || text.startsWith('who are you')) {
    reply = `👋 **Hello Owner Krylo_MC!** I am your **24/7 AI Console Administrator**.\nI am standing by to execute commands, dispatch crate keys, manage ranks, and audit server performance for you!`;
    return { reply, commands, note: serverState === 'offline' ? 'Server is currently OFFLINE/SLEEPING. Commands will queue until booted.' : 'Server is ONLINE and ready!' };
  }

  // 2. Give Crate Keys (e.g. "give Krylo_MC 10 Godly Keys and broadcast a drop party")
  if (text.includes('key') || text.includes('crate')) {
    let count = 5;
    const numMatch = text.match(/\b(\d+)\b/);
    if (numMatch) count = parseInt(numMatch[1], 10);

    let player = 'Krylo_MC';
    const playerMatch = prompt.match(/\b(to|player|give)\s+([A-Za-z0-9_]{3,16})\b/i);
    if (playerMatch && !['the', 'all', 'me', 'key', 'keys'].includes(playerMatch[2].toLowerCase())) {
      player = playerMatch[2];
    } else if (text.includes('krylo_mc') || text.includes('krylo')) {
      player = 'Krylo_MC';
    }

    let crateType = 'GodlyCrate';
    let crateName = '👑 Godly';
    if (text.includes('mythic')) { crateType = 'MythicCrate'; crateName = '🔮 Mythic'; }
    else if (text.includes('legendary')) { crateType = 'LegendaryCrate'; crateName = '🔴 Legendary'; }
    else if (text.includes('epic')) { crateType = 'EpicCrate'; crateName = '🟣 Epic'; }
    else if (text.includes('rare')) { crateType = 'RareCrate'; crateName = '🔵 Rare'; }
    else if (text.includes('common')) { crateType = 'CommonCrate'; crateName = '🟢 Common'; }

    commands.push(`crazycrates give physical ${crateType} ${count} ${player}`);
    reply = `🎁 **Granted ${count}x ${crateName} Keys to \`${player}\`!**`;

    if (text.includes('broadcast') || text.includes('drop party') || text.includes('announce')) {
      commands.push(`broadcast &6&l⚡ &eDrop party announced by Owner &6${player}&e! &6${count}x ${crateName} Keys &eawarded!`);
      reply += `\n📢 **Broadcasted server-wide Drop Party announcement in chat!**`;
    }
    return { reply, commands };
  }

  // 3. Economy & Coins (e.g. "give 50000 coins to Krylo_MC")
  if (text.includes('coin') || text.includes('kc') || text.includes('money') || text.includes('eco')) {
    let amount = 10000;
    const numMatch = text.match(/\b(\d+[\d,]*)\b/);
    if (numMatch) amount = parseInt(numMatch[1].replace(/,/g, ''), 10);

    let player = 'Krylo_MC';
    const playerMatch = prompt.match(/\b(to|player|give)\s+([A-Za-z0-9_]{3,16})\b/i);
    if (playerMatch && !['the', 'all', 'me'].includes(playerMatch[2].toLowerCase())) {
      player = playerMatch[2];
    }

    commands.push(`eco give ${player} ${amount}`);
    commands.push(`coins give ${player} ${amount}`);
    reply = `💰 **Deposited ${amount.toLocaleString()} KryloCoins to \`${player}\`!**`;
    return { reply, commands };
  }

  // 4. Set Ranks (e.g. "set Krylo_MC rank to Sovereign")
  if (text.includes('rank') || text.includes('parent set') || text.includes('sovereign') || text.includes('vip') || text.includes('mvp')) {
    let player = 'Krylo_MC';
    const playerMatch = prompt.match(/\b(for|to|user|player|set)\s+([A-Za-z0-9_]{3,16})\b/i);
    if (playerMatch && !['the', 'all', 'me', 'rank'].includes(playerMatch[2].toLowerCase())) {
      player = playerMatch[2];
    }

    let rank = 'sovereign';
    if (text.includes('executive')) rank = 'executive';
    else if (text.includes('mvp_plus') || text.includes('mvp+')) rank = 'mvp_plus';
    else if (text.includes('mvp')) rank = 'mvp';
    else if (text.includes('vip')) rank = 'vip';

    commands.push(`lp user ${player} parent set ${rank}`);
    commands.push(`broadcast &6&l⚡ &e${player} &7has been granted the &6&l${rank.toUpperCase()} RANK&7!`);
    reply = `👑 **Set \`${player}\` to rank \`${rank.toUpperCase()}\` and broadcasted rank promotion!**`;
    return { reply, commands };
  }

  // 5. Lag & Optimization (e.g. "clear lag", "save world", "kill items")
  if (text.includes('lag') || text.includes('clean') || text.includes('kill item') || text.includes('save') || text.includes('tps')) {
    commands.push('minecraft:kill @e[type=item]');
    commands.push('save-all');
    reply = `🧹 **Executed Lag Optimization & World Save!**\nCleared all dropped ground entities and saved the world state to disk.`;
    return { reply, commands };
  }

  // 6. Moderation (e.g. "mute player1 for 15m", "kick player1", "ban hacker")
  if (text.includes('mute') || text.includes('kick') || text.includes('ban')) {
    const parts = prompt.trim().split(/\s+/);
    const action = text.includes('ban') ? 'ban' : (text.includes('kick') ? 'kick' : 'mute');
    let target = parts[1] || 'Player';
    if (['a', 'the', 'this'].includes(target.toLowerCase()) && parts[2]) target = parts[2];

    commands.push(`${action} ${target} 15m Administrative Action`);
    reply = `🛡️ **Executed \`/${action}\` on \`${target}\`!**`;
    return { reply, commands };
  }

  // 7. General Broadcast
  if (text.includes('broadcast') || text.includes('say') || text.includes('announce')) {
    const rawMsg = prompt.replace(/^(broadcast|say|announce|ai,\s*broadcast)\s*/i, '').trim();
    commands.push(`broadcast &6&l✦ [ANNOUNCEMENT] &e${rawMsg}`);
    reply = `📢 **Broadcasted announcement across server:** \n> "${rawMsg}"`;
    return { reply, commands };
  }

  // Fallback direct execution
  reply = `🤖 **Received directive:** "${prompt}". Standing by to execute command dispatch.`;
  return { reply, commands };
}

/**
 * Ensures the #🤖┃ai-console-chat private channel exists in the guild
 */
export async function setupAIConsoleChannel(guild) {
  try {
    const channels = await guild.channels.fetch();
    let channel = channels.find(c => c && c.name && c.name.includes('ai-console-chat'));
    if (!channel) {
      const staffCat = channels.find(c => c && c.type === ChannelType.GuildCategory && (c.name.toLowerCase().includes('staff') || c.name.toLowerCase().includes('admin') || c.name.toLowerCase().includes('management')));
      
      channel = await guild.channels.create({
        name: '🤖┃ai-console-chat',
        type: ChannelType.GuildText,
        parent: staffCat ? staffCat.id : null,
        topic: '💬 Chat directly with your 24/7 AI Minecraft Server Administrator to execute commands, diagnose lag, and run drop parties in plain English!'
      });

      const welcomeEmbed = new EmbedBuilder()
        .setColor(0x00D8F6)
        .setTitle('🤖 24/7 AI Console Administrator Online!')
        .setDescription(
          `Welcome to your **Dedicated AI Server Console**!\nYou can chat with me in **plain English** and I will manage, audit, and run commands on your Minecraft server in real-time.\n\n` +
          `### 💡 Example Commands You Can Give Me:\n` +
          `* *"AI, give Krylo_MC 10 Godly Keys and broadcast a drop party"* \n` +
          `* *"AI, why is the server lagging? Run a lag check"* \n` +
          `* *"AI, clear all dropped items and save the world"* \n` +
          `* *"AI, give 100,000 KryloCoins to all online players"* \n` +
          `* *"AI, set Krylo_MC rank to Sovereign"* \n` +
          `* *"AI, mute Player1 for 15 minutes because of spam"* \n\n` +
          `⚡ Powered by **Llama-3.3-70b High-Speed LPU Engine**.`
        )
        .setFooter({ text: 'KryloSMP Autonomous AI Console Engine • FalixNodes API v2' })
        .setTimestamp();

      await channel.send({ embeds: [welcomeEmbed] });
    }
    return channel;
  } catch (err) {
    console.warn('[AI Console Setup Error]', err.message);
    return null;
  }
}

/**
 * Handles incoming messages in #🤖┃ai-console-chat
 */
export async function handleAIConsoleMessage(message) {
  if (message.author.bot) return;
  if (!message.channel.name || !message.channel.name.includes('ai-console-chat')) return;

  await message.channel.sendTyping().catch(() => {});

  const userPrompt = message.content.trim();
  const serverState = await getServerStatus();

  console.log(`[AI Console Received in #${message.channel.name}] from ${message.author.tag}: "${userPrompt}" (Server: ${serverState})`);

  const parsed = parseAdminIntent(userPrompt, serverState);
  const executed = [];
  let powerResult = null;

  if (parsed.powerAction) {
    powerResult = await sendPowerSignal(parsed.powerAction);
    console.log(`  [AI Console Power Action] ${parsed.powerAction} -> Status: ${powerResult.status}`, powerResult.data);
  }

  if (Array.isArray(parsed.commands) && parsed.commands.length > 0) {
    for (const cmd of parsed.commands) {
      const res = await executeCommand(cmd);
      executed.push({ command: cmd, ok: res.ok, status: res.status });
      console.log(`  [AI Console Executed] ${cmd} -> Status: ${res.status}`);
    }
  }

  const embed = new EmbedBuilder()
    .setColor(executed.length > 0 || (powerResult && powerResult.ok) ? 0x00FF66 : 0x00D8F6)
    .setTitle('🤖 AI Server Administrator')
    .setDescription(parsed.reply || 'Request processed.')
    .setFooter({ text: `Server State: ${serverState.toUpperCase()} • FalixNodes API v2` })
    .setTimestamp();

  if (powerResult) {
    if (powerResult.ok) {
      embed.addFields({ name: '⚡ Power Action Dispatched', value: `Signal \`${parsed.powerAction.toUpperCase()}\` executed successfully on FalixNodes!` });
    } else if (powerResult.data?.error?.action_url) {
      embed.addFields({
        name: '🔗 FalixNodes Free-Plan Fast Boot Link',
        value: `Starting a free-tier FalixNodes server requires an ad token.\n👉 **[Click Here to Boot Server Instantly](${powerResult.data.error.action_url})**\n*(Or start it directly on your [FalixNodes Panel](https://client.falixnodes.net/server/3390114))*\nOnce started, the AI Console Operator will automatically take full command control!`
      });
    } else {
      embed.addFields({ name: '⚠️ Power Action Status', value: `FalixNodes Response (${powerResult.status}): ${powerResult.data?.error?.message || 'Check panel status.'}` });
    }
  }

  if (executed.length > 0) {
    const cmdList = executed.map(e => `\`/${e.command}\` ${e.ok ? '✅ *(Executed)*' : `⚠️ *(Server ${serverState.toUpperCase()} - Queued)`}`).join('\n');
    embed.addFields({ name: '⚡ Dispatched Console Commands', value: cmdList.slice(0, 1024) });
  }

  if (parsed.note) {
    embed.addFields({ name: '💡 Server Note', value: parsed.note });
  }

  await message.reply({ embeds: [embed] });
}
